// Room 1 background music: "Neon Nights" (105 BPM, 32-bar seamless loop, 1612800 samples @ 22.05 kHz mono; vrtest-v10 = Chief's v256 re-encode, was stereo 44.1 kHz / 3225600), decoded with WebAudio and
// looped on exact sample points (encoder padding trimmed). Plays in room 1, the hallway and room 2 without a break (t244); silent while a
// cabinet is zoomed in / played, in the Neon Knockout studio (its own beat), on the start screen, when the tab is hidden, or when MUSIC
// is off in Options ('neonarcade.music' = '0').
// Memory (TEST v1 + vrtest-v4 port of the Chief's t911u "one song at a time"): the decoded loop is ~13 MB of float PCM at 48 kHz (mono since v10; was ~26 MB stereo). It is kept only
// while it can be heard: once the room track is silent (a cabinet loop has fully ducked it, a game, the NK studio, MUSIC off, hidden
// tab) for HOLD (1 s; window.__gaMusicHold overrides) and its gain has faded out, the decoded buffer is dropped. The compact fetched file
// (~0.45 MB since v10) is kept, so coming back re-decodes it off the main thread (decodeAudioData) without a re-fetch, from the loop start.
(function () {
  var N = 1612800, SR = 22050, VOL = 0.42, KEY = 'neonarcade.music', HOLD = 1000;
  var M = window.__music = { loaded: false, playing: false, gain: 0, target: 0, on: true, loopStart: 0, loopEnd: 0, len: 0, src: '', hasBuf: false, rawBytes: 0, freed: 0, decodes: 0 };
  try { M.on = localStorage.getItem(KEY) !== '0'; } catch (e) {}
  var ac = null, g = null, node = null, loading = false, raw = null, silentSince = 0, gen = 0;
  M.drops = 0; M.loads = 0; M.decodedMB = 0;
  function pickSrc() { return 'audio/neon_nights.m4a'; }   // vrtest-v10 (Chief v256): one format (mono AAC); the stereo opus copy is gone
  function ctx() { if (!ac) { ac = window.__unlockAC || new (window.AudioContext || window.webkitAudioContext)(); window.__unlockAC = ac; } return ac; }
  function start(buf) {
    // Chief v256: encoder padding is a short prefix; scale the 1024/2112-sample delays to the decoded rate, or treat a short leftover as lead,
    // so the 22.05 kHz file decoded at 48 kHz still loops on the 32-bar boundary
    var extra = buf.length - Math.round(N * buf.sampleRate / SR), lead = 0, scale = buf.sampleRate / SR;
    [2112, 1024].forEach(function (n) { var s = Math.round(n * scale); if (Math.abs(extra - s) <= 8) lead = s; });
    if (!lead && extra > 0 && extra < buf.sampleRate * 0.25) lead = extra;
    M.sr = buf.sampleRate; M.ch = buf.numberOfChannels; M.len = buf.length; M.loopStart = lead / buf.sampleRate; M.loopEnd = M.loopStart + N / SR;
    node = ac.createBufferSource(); node.buffer = buf; node.loop = true; node.loopStart = M.loopStart; node.loopEnd = M.loopEnd; node.connect(g); node.start(0, M.loopStart);
    M.t0 = ac.currentTime; M.loaded = true; M.playing = true; M.hasBuf = true; M.decodes++; M.decodedMB = +(buf.length * buf.numberOfChannels * 4 / 1048576).toFixed(1);
  }
  function load() { if (loading) return; loading = true; M.loads++; ctx(); var my = ++gen;
    if (!g) { g = ac.createGain(); g.gain.value = 0; g.connect(ac.destination); }
    var decode = function (ab) { raw = ab; M.rawBytes = ab.byteLength;
      return new Promise(function (ok, no) { ac.decodeAudioData(ab.slice(0), ok, no); }).then(function (buf) { loading = false; if (my !== gen) return; start(buf); }); };
    var p = raw ? decode(raw) : (M.src = pickSrc(), fetch(M.src).then(function (r) { return r.arrayBuffer(); }).then(decode));
    p.catch(function (e) { M.err = String(e); loading = false; });
  }
  function drop() { gen++; try { if (node) { node.stop(); node.disconnect(); } } catch (e) {} node = null; loading = false;
    M.loaded = false; M.playing = false; M.hasBuf = false; M.decodedMB = 0; M.drops++; M.freed++; }
  M.drop = M.free = drop;
  M.setOn = function (on) { M.on = !!on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {} tick(); };
  M.pos = function () { return (M.loaded && ac && node) ? ((ac.currentTime - M.t0) % (M.loopEnd - M.loopStart)) : 0; };
  function tick() {
    var S = window.__start, A = window.__arcade, onStart = !!document.getElementById('start') && !(S && S.dismissed);
    var t = 0;
    if (M.on && !onStart && !document.hidden && A && A.play) {
      var z = A.monkey.position.z, R = window.__mp && window.__mp.roomOf, k = R && R(A.monkey.position) === 'white' ? Math.max(0, Math.min(1, (z + 12 + 2.5) / 3)) : 1;   // t244: same track plays on through the hallway and room 2 (only the white shop keeps the old fade)
      t = A.play.mode === 'walk' ? VOL * k : 0;
      if (A.monkey.position.x < -40) t = 0; }   // v16: the Neon Knockout studio (far west) plays its own beat
    if (window.__pa && window.__pa.playing) t *= 0.3;   // duck under the PA announcement
    if (window.__cabMusic) t *= 1 - window.__cabMusic.duck;   // cabinet loop near / in demo (cabinet-music.js)
    M.target = t; M.room1 = t > 0;
    if (t > 0.02) { silentSince = 0; if (S && S.dismissed && !M.loaded && !loading) load(); }   // first START (a user gesture unlocked the context) or coming back
    else if (M.loaded || loading) {
      var hold = window.__gaMusicHold != null ? +window.__gaMusicHold : HOLD;
      if (!silentSince) silentSince = performance.now();
      if (performance.now() - silentSince >= hold && (!g || g.gain.value < 0.01)) drop();
    }
    if (g) { if (ac.state === 'suspended' && t > 0) ac.resume(); g.gain.setTargetAtTime(t, ac.currentTime, t > M.gain ? 0.5 : 0.25); M.gain = g.gain.value; }
  }
  setInterval(tick, 120); document.addEventListener('visibilitychange', tick);
})();
