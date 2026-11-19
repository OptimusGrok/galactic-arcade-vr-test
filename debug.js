/* vrtest-v21 (Dave via Chief t958u): DEBUG overlay — TEST LINK ONLY.
   !!! When porting to the main VR link this file must be left out (or TEST_BUILD set to false). It also refuses to run on any page
   that is not the test link (or a local test server), so even a stray copy never shows on https://optimusgrok.github.io/galactic-arcade-vr/.
   Shows FPS, frame time, worst frame (last 5 s), JS heap, renderer.info (textures / geometries / programs / draw calls / triangles per frame),
   tier, version, room / scene, the last beam's time and the last 5 console errors. Flat: corner HUD + a DEBUG button in the in-game OPTIONS (monkey-face button).
   VR: a DEBUG button in the Y menu + a small panel above the left-wrist display (vr.js draws it from lines()).
   Off by default; saved in localStorage galacticarcade.vrDebug; ?debug=1 turns it on. When off: no per-frame hook, no timers, no redraws
   (only console.error / error events are kept in a 5-entry ring, which costs nothing unless an error happens). */
(function () {
  var TEST_BUILD = true, VERSION = 'vrtest-v23', KEY = 'galacticarcade.vrDebug';
  var host = location.hostname, path = location.pathname;
  if (!TEST_BUILD || !(/\/galactic-arcade-vr-test(\/|$)/.test(path) || host === 'localhost' || host === '127.0.0.1')) return;
  var ERR = [], errN = 0;
  function pushErr(s) { try { s = String(s).replace(/\s+/g, ' ').slice(0, 140); ERR.push({ t: Date.now(), s: s }); if (ERR.length > 5) ERR.shift(); errN++; } catch (e) {} }
  var ce = console.error;
  console.error = function () { try { pushErr(Array.prototype.map.call(arguments, function (a) { return a && a.message ? a.message : String(a); }).join(' ')); } catch (e) {} return ce.apply(console, arguments); };
  addEventListener('error', function (e) { var t = e && e.target; pushErr(t && t !== window && (t.src || t.href) ? 'load failed: ' + (t.src || t.href) : 'error: ' + (e.message || e.error)); }, true);
  addEventListener('unhandledrejection', function (e) { var r = e && e.reason; pushErr('promise: ' + (r && r.message ? r.message : r)); });
  var ls = function (v) { try { if (v === undefined) return localStorage.getItem(KEY); localStorage.setItem(KEY, v); } catch (e) { return null; } };
  var qOn = /[?&]debug=1(\b|$)/.test(location.search);
  if (qOn) ls('1');
  // frame ring (5 s at up to 120 fps)
  var N = 720, T = new Float64Array(N), G = new Float32Array(N), head = 0, count = 0, lastT = 0, nextUi = 0, beam = { state: 'idle', t0: 0, worst: 0, ms: null, worstMs: null, dest: null };
  var D = { version: VERSION, on: false, rev: 0, redraws: 0, samples: 0, stats: null, errors: ERR, get errN() { return errN; } };
  var R = function () { return window.__arcade && window.__arcade.renderer; };
  function frame(now) {
    if (lastT) { var g = now - lastT; if (g > 0 && g < 2000) { T[head] = now; G[head] = g; head = (head + 1) % N; if (count < N) count++; } }
    lastT = now; D.samples++;
    var tp = window.__tp;   // beam timing: leaves 'idle' -> back to 'idle'
    if (tp) { if (beam.state === 'idle' && tp.state !== 'idle') { beam.state = 'busy'; beam.t0 = now; beam.worst = 0; beam.dest = tp.dest; } else if (beam.state === 'busy') { if (G[(head + N - 1) % N] > beam.worst) beam.worst = G[(head + N - 1) % N]; if (tp.state === 'idle') { beam.state = 'idle'; beam.ms = Math.round(now - beam.t0); beam.worstMs = Math.round(beam.worst); } } }
    var r = R(); if (r) { var i = r.info.render; D._calls = i.calls; D._tris = i.triangles; r.info.reset(); }   // autoReset is off while on: these are the whole frame (all passes / both eyes)
    if (now >= nextUi) { nextUi = now + 250; snapshot(now); }
  }
  function where() { var tp = window.__tp, A = window.__arcade, s = '';
    var w = tp ? tp.where : 1; s = w === 2 ? 'PRIZE SHOP' : w === 3 ? 'NEON KNOCKOUT' : w === 4 ? 'TELEPORT ROOM' : 'ARCADE';
    try { if (w === 3 && window.__nkGame) s += ' · ' + window.__nkGame.scenery.toUpperCase() + ' · ' + window.__nkGame.state.mode.toUpperCase();
      else if (w === 1 && A && A.monkey && A.monkey.position.z < -16) s = 'ARCADE ROOM 2 / HALL'; } catch (e) {}
    try { var p = A && A.play; if (p && p.mode && p.mode !== 'walk') s += ' · GAME ' + String(p.mode).toUpperCase(); } catch (e) {}
    if (tp && tp.state && tp.state !== 'idle') s += ' · BEAMING'; return s; }
  function snapshot(now) {
    var cut1 = now - 1000, cut5 = now - 5000, n1 = 0, sum1 = 0, worst = 0;
    for (var k = 0; k < count; k++) { var j = (head + N - 1 - k) % N; if (T[j] < cut5) break; var g = G[j]; if (g > worst) worst = g; if (T[j] >= cut1) { n1++; sum1 += g; } }
    var r = R(), m = r ? r.info.memory : {}, pm = performance.memory, A = window.__arcade, xr = !!(r && r.xr && r.xr.isPresenting);
    D.stats = { fps: n1, ms: n1 ? +(sum1 / n1).toFixed(1) : 0, worst: +worst.toFixed(1), heap: pm ? Math.round(pm.usedJSHeapSize / 1048576) + ' / ' + Math.round(pm.jsHeapSizeLimit / 1048576) + ' MB' : 'n/a',
      tex: m.textures, geo: m.geometries, prog: r && r.info.programs ? r.info.programs.length : 0, calls: D._calls || 0, tris: D._tris || 0,
      tier: A && A.tier ? A.tier.name + (A.tier.forced ? ' (forced)' : '') : '?', where: where(), beamMs: beam.ms, beamWorst: beam.worstMs, beamDest: beam.dest, xr: xr };
    D.rev++; if (!xr) drawFlat();
  }
  function lines() { var s = D.stats; if (!s) return ['DEBUG · ' + VERSION, 'collecting…'];
    var L = ['DEBUG · ' + VERSION + ' · ' + (s.xr ? 'VR' : 'FLAT') + ' · TIER ' + String(s.tier).toUpperCase(),
      'FPS ' + s.fps + '   FRAME ' + s.ms + ' ms   WORST(5s) ' + s.worst + ' ms', 'HEAP ' + s.heap,
      'DRAWS ' + s.calls + '   TRIS ' + (s.tris > 9999 ? Math.round(s.tris / 1000) + 'k' : s.tris), 'TEX ' + s.tex + '   GEO ' + s.geo + '   PROGRAMS ' + s.prog,
      'WHERE ' + s.where, mvLine(), 'LAST BEAM ' + (s.beamMs == null ? '—' : s.beamMs + ' ms (worst frame ' + s.beamWorst + ' ms' + (s.beamDest != null ? ', to ' + s.beamDest : '') + ')'),
      'ERRORS ' + errN + (ERR.length ? ':' : ' · none')];
    for (var i = ERR.length - 1; i >= 0; i--) L.push('• ' + ERR[i].s); return L; }
  function mvLine() { var c = null; try { c = window.__gaVR && window.__gaVR.comfort && window.__gaVR.comfort(); } catch (e) {}   // vrtest-v23
    return c ? 'MOVE ' + String(c.mode).toUpperCase() + '   LAST TELEPORT ' + (c.lastTpMs == null ? '—' : c.lastTpMs + ' ms') + '   TPs ' + c.tps + '   SNAPS ' + c.snaps : 'MOVE —'; }
  D.lines = lines;
  // ---- flat corner HUD ----
  var hud = null;
  function drawFlat() { if (!hud) { hud = document.createElement('pre'); hud.id = 'gaDebug';
      hud.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:9999;margin:0;max-width:min(92vw,460px);padding:6px 8px;background:rgba(6,2,18,.82);color:#bfffea;border:1px solid #7fffd4;border-radius:8px;font:600 10px/1.3 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;pointer-events:none';
      document.body.appendChild(hud); }
    hud.style.display = ''; var t = lines().join('\n'); if (hud.textContent !== t) { hud.textContent = t; D.redraws++; } }
  function set(v) { v = !!v; if (v === D.on) return D.on; D.on = v; ls(v ? '1' : '0'); var r = R();
    if (v) { lastT = 0; count = 0; nextUi = 0; if (r) r.info.autoReset = false; window.__dbgFrame = frame; }
    else { window.__dbgFrame = null; if (r) { r.info.autoReset = true; r.info.reset(); } if (hud) hud.style.display = 'none'; D.stats = null; }
    syncBtn(); return D.on; }
  D.set = set; D.toggle = function () { return set(!D.on); };
  // ---- flat button: DEBUG in OPTIONS (added here so the main link's markup never has it) ----
  var btn = null;
  function syncBtn() { if (btn) btn.textContent = 'DEBUG: ' + (D.on ? 'ON' : 'OFF'); }
  function addBtn() { if (btn) return; var ref = document.getElementById('opCool'); if (!ref || !ref.parentNode) return;   // in-game OPTIONS (opts.js calls this once its panel exists)
    btn = document.createElement('button'); btn.className = 'opB'; btn.id = 'dbgBtn';
    btn.addEventListener('click', function (e) { e.stopPropagation(); D.toggle(); }); ref.parentNode.insertBefore(btn, ref.nextSibling); syncBtn(); }
  D.addBtn = addBtn;
  window.__gaDebug = D;
  function boot() { addBtn(); if (qOn || ls() === '1') { var go = function () { if (R()) set(true); else setTimeout(go, 200); }; go(); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
