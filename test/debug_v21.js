// vrtest-v21 (Dave via Chief t958u): DEBUG overlay (debug.js, test link only). Flat: off by default (no hook, no HUD, no redraws),
// OPTIONS -> DEBUG toggles the corner HUD, values update, <= 4 redraws / s, console errors listed, beam time, persists across reload,
// toggles off; ?debug=1 turns it on. VR: Y menu DEBUG -> panel above the left wrist, redraws <= 4 / s, off again. No console errors.
const { open } = require('./lib'); const { openVR, H, IWER_SRC, SETUP } = require('./vrlib');
(async () => {
  let ok = true; const chk = (c, m, x) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) ok = false; };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let R = await open({ w: 480, h: 270 }), page = R.page;
  const E = (f, a) => page.evaluate(f, a);
  const cpu = async ms => { const a = await E(() => ({ f: window.__arcade.stats.frames, t: performance.now() })); await sleep(ms); return E(a => { const s = window.__arcade.stats; return { fps: +((s.frames - a.f) / ((performance.now() - a.t) / 1000)).toFixed(1), cpuAvg: +s.cpuAvg.toFixed(2) }; }, a); };
  const st = () => E(() => { const D = window.__gaDebug; return { on: D.on, hook: typeof window.__dbgFrame === 'function', samples: D.samples, redraws: D.redraws, hud: !!document.getElementById('gaDebug') && document.getElementById('gaDebug').style.display !== 'none', btn: (document.getElementById('dbgBtn') || {}).textContent || null, autoReset: window.__arcade.renderer.info.autoReset, stats: D.stats, txt: (document.getElementById('gaDebug') || {}).textContent || '' }; });
  try {
    await E(() => localStorage.removeItem('galacticarcade.vrDebug')); await page.reload(); await page.waitForFunction(() => window.__arcade && window.__arcade.stats.frames > 3, null, { timeout: 90000 }); await sleep(1500);
    let s = await st(); const s0 = s.samples;
    chk(!s.on && !s.hook && !s.hud && s.btn === 'DEBUG: OFF' && s.autoReset, 'off by default: no frame hook, no HUD, OPTIONS has DEBUG: OFF', s);
    const off = await cpu(3000); s = await st();
    chk(s.samples === s0 && s.redraws === 0, 'off = zero work: no samples, no redraws over 3 s', { samples: s.samples, redraws: s.redraws });
    // OPTIONS -> DEBUG
    await page.click('#bOpt'); await page.waitForSelector('#dbgBtn', { state: 'visible', timeout: 10000 }); await page.click('#dbgBtn'); await page.click('#opX').catch(() => {});
    await sleep(1500); s = await st();
    chk(s.on && s.hook && s.hud && s.btn === 'DEBUG: ON' && !s.autoReset, 'OPTIONS -> DEBUG turns it on (corner HUD)', { on: s.on, hud: s.hud, btn: s.btn });
    const v = s.stats; chk(v && v.fps > 0 && v.ms > 0 && v.worst >= v.ms && v.calls > 0 && v.tris > 0 && v.tex > 0 && v.geo > 0 && v.prog > 0 && v.tier && /ARCADE/.test(v.where), 'values: fps / frame / worst / draws / tris / tex / geo / programs / tier / where', v);
    chk(/HEAP \d+ \/ \d+ MB|HEAP n\/a/.test(s.txt) && /vrtest-v22/.test(s.txt), 'HUD text shows heap + version', s.txt.split('\n').slice(0, 3));
    const r0 = s.redraws; await sleep(2000); s = await st(); const rps = (s.redraws - r0) / 2;
    chk(rps > 0 && rps <= 4.5, 'HUD redraws at most ~4 / s', rps);
    const on = await cpu(3000); console.log('INFO frame cost off ' + JSON.stringify(off) + ' on ' + JSON.stringify(on));
    await E(() => console.error('dbgtest boom')); await E(() => { setTimeout(() => { Promise.reject(new Error('dbgtest reject')); }, 0); }); await sleep(800); s = await st();
    chk(/dbgtest boom/.test(s.txt) && /dbgtest reject/.test(s.txt), 'console.error + unhandled rejection listed', s.txt.split('\n').slice(-3));
    // beam time
    await E(() => { window.__tpTimeScale = 4; window.__tp.go('nk'); }); await page.waitForFunction(() => window.__tp.where === 3 && window.__tp.state === 'idle', null, { timeout: 60000 }); await sleep(800); s = await st();
    chk(s.stats.beamMs > 0 && /NEON KNOCKOUT/.test(s.stats.where) && /LAST BEAM \d+ ms/.test(s.txt), 'last beam time + room = Neon Knockout', { beamMs: s.stats.beamMs, worst: s.stats.beamWorst, where: s.stats.where });
    // persists across reload
    await page.reload(); await page.waitForFunction(() => window.__arcade && window.__arcade.stats.frames > 3, null, { timeout: 90000 }); await sleep(1500); s = await st();
    chk(s.on && s.hud && s.btn === 'DEBUG: ON', 'still on after a reload (galacticarcade.vrDebug)', { on: s.on, hud: s.hud });
    await sleep(3000); const onW = await cpu(4000);
    await page.click('#bOpt'); await page.waitForSelector('#dbgBtn', { state: 'visible' }); await page.click('#dbgBtn'); await page.click('#opX').catch(() => {}); await sleep(300);
    s = await st(); const sa = s.samples; await sleep(1500); const s2 = await st();
    chk(!s.on && !s.hook && !s.hud && s.autoReset && s2.samples === sa && s2.redraws === s.redraws && (await E(() => localStorage.getItem('galacticarcade.vrDebug'))) === '0', 'OPTIONS -> DEBUG again turns it off (no hook, HUD hidden, saved 0)', { on: s.on, hud: s.hud });
    await sleep(1000); const offW = await cpu(4000); console.log('INFO warm frame cost (same page, after reload): on ' + JSON.stringify(onW) + ' off ' + JSON.stringify(offW));
    const errs = R.errors.filter(e => !/dbgtest/.test(e)); chk(errs.length === 0, 'no console errors (flat)', errs.slice(0, 4));
    await R.close();
    // ?debug=1
    R = await open({ w: 480, h: 270, qs: '?debug=1' }); page = R.page; await sleep(1500); s = await st();
    chk(s.on && s.hud, '?debug=1 turns it on', { on: s.on }); chk(R.errors.length === 0, 'no console errors (?debug=1)', R.errors.slice(0, 4)); await R.close();
    // VR: Y menu DEBUG
    R = await openVR({ init: { content: IWER_SRC + SETUP } }); page = R.page;
    await page.waitForFunction(() => document.getElementById('vrBtn').classList.contains('on'), null, { timeout: 20000 }); await page.waitForFunction(() => window.__gaVR.prewarm.done, null, { timeout: 180000 });
    await page.click('#vrBtn'); await page.waitForFunction(() => window.__gaVR.presenting && window.__gaVR.posed, null, { timeout: 30000 });
    await H.press(page, 'left', 'y-button'); await H.frames(page, 6);
    let b = await E(() => window.__gaVR.ui.btns.find(q => q.id === 'debug')); chk(!!b && b.label === 'DEBUG', 'Y menu has DEBUG', b);
    let bw = await E(() => window.__gaVR.ui.btnWorld('debug')); await H.aim(page, 'right', [0.2, 1.2, 0.1], bw); await H.frames(page, 4); await H.press(page, 'right', 'trigger'); await H.frames(page, 6);
    await E(() => window.__gaVR.ui.close()); await H.frames(page, 10); await sleep(1500);
    let p = await E(() => ({ D: window.__gaDebug.on, P: window.__gaVR.dbgPanel(), xr: window.__gaDebug.stats && window.__gaDebug.stats.xr, L: window.__gaDebug.lines().slice(0, 2) }));
    chk(p.D && p.P.on && p.xr && /VR/.test(p.L[0]), 'VR: DEBUG on -> panel above the left wrist, stats from the XR frames', p);
    const d0 = p.P.draws; await sleep(2000); const d1 = await E(() => window.__gaVR.dbgPanel().draws); chk(d1 > d0 && (d1 - d0) / 2 <= 4.5, 'VR panel redraws at most ~4 / s', (d1 - d0) / 2);
    await H.press(page, 'left', 'y-button'); await H.frames(page, 6); b = await E(() => window.__gaVR.ui.btns.find(q => q.id === 'debug')); chk(b && b.label === 'DEBUG ON', 'Y menu shows DEBUG ON', b);
    bw = await E(() => window.__gaVR.ui.btnWorld('debug')); await H.aim(page, 'right', [0.2, 1.2, 0.1], bw); await H.frames(page, 4); await H.press(page, 'right', 'trigger'); await H.frames(page, 6);
    p = await E(() => ({ D: window.__gaDebug.on, P: window.__gaVR.dbgPanel(), hook: !!window.__dbgFrame })); chk(!p.D && !p.P.on && !p.hook, 'VR: DEBUG again -> off, panel gone', p);
    chk(R.errors.length === 0, 'no console errors (VR)', R.errors.slice(0, 4));
  } catch (e) { chk(false, 'exception ' + (e && e.stack || e)); }
  await R.close(); console.log(ok ? 'ALL PASS' : 'SOME FAILED'); process.exit(ok ? 0 : 1);
})();
