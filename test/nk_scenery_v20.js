// vrtest-v20 (Dave t503u + t504u): Neon Knockout SCENERY (studio <-> cyberpunk rooftop) + the footprint outline.
// VR: beam to the studio, measure default draw calls / textures, point at the SCENERY orb + A -> rooftop (worst frame during the swap,
// programs, draw calls, textures), punch it -> studio (rooftop disposed), the Y menu SCENERY button, reload -> the choice persists,
// feet outline present in both + faint during a round; ?norooftop=1&nofeet=1 -> no option, no feet. No console errors.
const { openVR, H, IWER_SRC, SETUP, HEADSET_FB } = require('./vrlib');
(async () => {
  let ok = true; const chk = (c, m, x) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) ok = false; };
  let R = await openVR({ init: { content: IWER_SRC + SETUP + HEADSET_FB } });
  let { page, errors } = R;
  const E = (f, a) => page.evaluate(f, a), until = (f, ms = 30000, arg) => page.waitForFunction(f, arg, { timeout: ms });
  const place = async (x, z, yaw = 0) => { await E(([x, z, yaw]) => { const S = window.__gaVR; S.rig = { x, y: 0, z, yaw }; S.applyRig(); window.__arcade.monkey.position.set(x, 0, z); }, [x, z, yaw]); await H.frames(page, 6); };
  const ctrlAt = (hand, w) => E(([hand, w]) => { const r = window.__gaVR.rig, c = Math.cos(r.yaw), s = Math.sin(r.yaw), dx = w[0] - r.x, dz = w[2] - r.z;
    const C = window.__xrd.controllers[hand]; C.position.set(c * dx - s * dz, w[1] - r.y, s * dx + c * dz); C.quaternion.set(0, 0, 0, 1); }, [hand, w]);
  const punchAt = async (hand, w) => { for (const k of [0.45, 0.3, 0.15, 0, -0.12]) { await ctrlAt(hand, [w[0], w[1], w[2] + k]); await H.frames(page, 1); } await ctrlAt(hand, [w[0] + (hand === 'left' ? -0.3 : 0.3), w[1] - 0.3, w[2] + 0.5]); await H.frames(page, 2); };
  // what the studio costs while you stand in it: draw calls of one frame + textures / geometry of the VISIBLE studio objects + live GPU allocations
  const measure = () => E(async () => { const A = window.__arcade, r = A.renderer, root = A.scene.getObjectByName('nkStudio'), seen = new Set(); let tex = 0, texN = 0, geo = 0, objs = 0;
    root.traverseVisible(o => { if (o.geometry) { objs++; if (!seen.has(o.geometry)) { seen.add(o.geometry); for (const a of Object.values(o.geometry.attributes)) geo += a.array.byteLength; if (o.instanceMatrix) geo += o.instanceMatrix.array.byteLength; } }
      const ms = o.material ? [].concat(o.material) : []; for (const m of ms) { const ts = Object.values(m).filter(v => v && v.isTexture).concat(m.uniforms ? Object.values(m.uniforms).map(u => u.value).filter(v => v && v.isTexture) : []);
        for (const t of ts) if (!seen.has(t)) { seen.add(t); texN++; const im = t.image || {}; tex += (im.width || 0) * (im.height || 0) * 4 * (t.generateMipmaps ? 4 / 3 : 1); } } });
    const f0 = window.__gaVR.frames; await new Promise(res => { const w = () => window.__gaVR.frames > f0 + 2 ? res() : setTimeout(w, 5); w(); });
    return { calls: r.info.render.calls, tris: r.info.render.triangles, studioObjs: objs, studioTexN: texN, studioTexMB: +(tex / 1048576).toFixed(2), studioGeoMB: +(geo / 1048576).toFixed(2), gpuTex: r.info.memory.textures, gpuGeo: r.info.memory.geometries, programs: r.info.programs.length }; });
  // frame-gap recorder: NK.tick runs once per arcade frame
  const recStart = () => E(() => { const N = window.__nkGame; if (!N.__t0) { const t = N.tick; N.__t0 = t; N.tick = dt => { const n = performance.now(); if (N.__last) { N.__gaps.push(n - N.__last); N.__log.push([Math.round(n), Math.round(n - N.__last)]); } N.__last = n; return t(dt); }; } N.__gaps = []; N.__log = []; N.__last = 0; });
  const recStop = () => E(() => { if (window.__dbg) console.log(JSON.stringify({ log: window.__nkGame.__log.filter(x => x[1] > 20), st: window.__nkGame.scStats })); const g = window.__nkGame.__gaps.slice(); g.sort((a, b) => a - b); return { n: g.length, worst: +g[g.length - 1].toFixed(1), median: +g[g.length >> 1].toFixed(1) }; });
  try {
    await E(() => { localStorage.removeItem('galacticarcade.nkScenery'); window.__tpTimeScale = 3; });
    await until(() => document.getElementById('vrBtn').classList.contains('on'), 20000); await until(() => window.__gaVR.prewarm.done, 180000);
    await page.click('#vrBtn'); await until(() => window.__gaVR.presenting && window.__gaVR.posed, 30000);
    await E(() => window.__loadNK()); const P3 = await E(() => [window.__tp.PAD3.x, window.__tp.PAD3.z]);
    // beam: SW pad -> studio
    const pad4 = await E(() => [window.__tp.PAD4.x, window.__tp.PAD4.z]); await place(pad4[0] + 2.2, pad4[1] - 2.2, 3 * Math.PI / 4);
    const sg = await E(() => { const s = window.__gaVR.signs().find(q => q.id === 'beamNK'); return s ? s.at : null; });
    await H.aim(page, 'right', [0.2, 1.3, -0.2], sg); await H.frames(page, 3); await H.press(page, 'right', 'trigger');
    await until(() => window.__tp.where === 3 && window.__tp.state === 'idle' && window.__nkGame && window.__nkGame.inStudio, 90000);
    await place(P3[0], P3[1], 0); await H.frames(page, 20);
    let s = await E(() => { const N = window.__nkGame; return { sc: N.scenery, orb: !!N.menuOrbs.find(o => o.id === 'scenery'), feet: !!N.feet && N.feet.visible, fo: N.feet && +N.feet.material.opacity.toFixed(2), fy: N.feet && +N.feet.position.y.toFixed(3) }; });
    chk(s.sc === 'studio' && s.orb, 'default scenery = studio, SCENERY orb in the menu', s);
    chk(s.feet && s.fo > 0.5 && s.fy > 0.01 && s.fy < 0.03, 'footprint outline on the studio floor (bright on the title screen, just above the floor)', s);
    const mDef = await measure(); console.log('INFO studio ' + JSON.stringify(mDef));
    const hs0 = await E(() => window.__hsRead());
    // point at the SCENERY orb + A
    const ow = await E(() => window.__nkGame.orbWorld('scenery').toArray());
    await H.aim(page, 'right', [0.2, 1.2, 0.1], ow); await H.frames(page, 4);
    const hov = await E(() => window.__gaVR.hoverTarget || (window.__gaVR.hover && window.__gaVR.hover.target)); chk(hov === 'nkOrb_scenery', 'the right ray points at the SCENERY orb', hov);
    await E(() => { window.__dbg = 1; }); page.on('console', m => { if (m.type() === 'log' && m.text().startsWith('{"log"')) console.log('DBG ' + m.text()); });
    await recStart(); const prog0 = await E(() => window.__arcade.renderer.info.programs.length);
    await H.press(page, 'right', 'a-button');
    await until(() => window.__nkGame.scenery === 'rooftop', 30000); await H.frames(page, 30); const g1 = await recStop();
    s = await E(() => { const N = window.__nkGame, st = N.scStats; return { sc: N.scenery, saved: localStorage.getItem('galacticarcade.nkScenery'), st, roof: !!N.roofKit && N.roofKit.group.visible, kit: N.roofKit && N.roofKit.stats(), floorVis: window.__arcade.scene.getObjectByName('nkFloor').visible, feet: N.feet.visible, prog: window.__arcade.renderer.info.programs.length }; });
    chk(s.sc === 'rooftop' && s.saved === 'rooftop' && s.roof && !s.floorVis, 'pointer + A on SCENERY -> CYBERPUNK ROOFTOP (studio floor hidden, saved)', s);
    chk(s.feet, 'footprint outline still on the rooftop');
    console.log('INFO switch-to-rooftop frames ' + JSON.stringify(g1) + ' programs ' + prog0 + ' -> ' + s.prog + ' buildMs ' + s.st.buildMs + ' compileMs ' + s.st.compileMs + ' swapMs ' + s.st.lastMs);
    const mRoof = await measure(); console.log('INFO rooftop ' + JSON.stringify(mRoof));
    const hs1 = await E(() => window.__hsRead()); chk(hs1 && hs1.left.lit > 2, 'the headset shows the rooftop', { before: hs0 && hs0.left, after: hs1 && hs1.left });
    const p2 = await E(() => window.__arcade.renderer.info.programs.length); await H.frames(page, 20); const p3 = await E(() => window.__arcade.renderer.info.programs.length);
    chk(p3 === p2, 'no new shader programs after the swap (rooftop was compiled before it showed)', [prog0, p2, p3]);
    // round: feet fade to faint
    await E(() => window.__nkGame.startRound()); await H.frames(page, 10);
    s = await E(() => ({ m: window.__nkGame.state.mode, fo: +window.__nkGame.feet.material.opacity.toFixed(2), v: window.__nkGame.feet.visible })); chk(s.m === 'play' && s.v && s.fo > 0.05 && s.fo < 0.3, 'during a round the footprints stay, faint', s);
    await E(() => window.__nkGame.abort('test')); await H.frames(page, 10);
    // punch the SCENERY orb -> back to the studio (rooftop disposed)
    await H.aim(page, 'right', [0.3, 1.0, 0.3], [0, 1, -5]); await H.frames(page, 3);
    const ow2 = await E(() => window.__nkGame.orbWorld('scenery').toArray()); await recStart(); await punchAt('right', ow2); await H.frames(page, 20); const g2 = await recStop();
    s = await E(() => { const N = window.__nkGame; return { sc: N.scenery, kit: !!N.roofKit, inScene: !!window.__arcade.scene.getObjectByName('nkRooftop'), st: N.scStats, floorVis: window.__arcade.scene.getObjectByName('nkFloor').visible, saved: localStorage.getItem('galacticarcade.nkScenery') }; });
    chk(s.sc === 'studio' && !s.kit && !s.inScene && s.floorVis && s.saved === 'studio', 'punching SCENERY -> back to the studio, rooftop removed + disposed', s);
    console.log('INFO switch-to-studio frames ' + JSON.stringify(g2));
    const mBack = await measure(); console.log('INFO studio-again ' + JSON.stringify(mBack));
    chk(mBack.gpuGeo <= mDef.gpuGeo && mBack.gpuTex <= mDef.gpuTex + 2 && mBack.programs <= mDef.programs, 'rooftop GPU buffers / atlas / programs freed after leaving it (+2 = the two cached SCENERY orb label textures)', { def: [mDef.gpuTex, mDef.gpuGeo, mDef.programs], roof: [mRoof.gpuTex, mRoof.gpuGeo, mRoof.programs], back: [mBack.gpuTex, mBack.gpuGeo, mBack.programs] });
    // the Y menu: SCENERY button
    await H.press(page, 'left', 'y-button'); await H.frames(page, 6);
    const btn = await E(() => { const S = window.__gaVR; return S.ui.kind === 'menu' ? S.ui.btns.find(b => b.id === 'nkScenery') : null; }); chk(!!btn && /STUDIO/.test(btn.label), 'Y menu in Neon Knockout has SCENERY: STUDIO', btn);
    const bw = await E(() => window.__gaVR.ui.btnWorld('nkScenery')); await H.aim(page, 'right', [0.2, 1.2, 0.1], bw); await H.frames(page, 4); await H.press(page, 'right', 'trigger');
    await until(() => window.__nkGame.scenery === 'rooftop', 30000); await H.frames(page, 6);
    const lbl = await E(() => (window.__gaVR.ui.btns.find(b => b.id === 'nkScenery') || {}).label); chk(/ROOFTOP/.test(lbl || ''), 'Y menu SCENERY button -> rooftop, label updates', lbl);
    await E(() => window.__gaVR.ui.close());
    // reload: the choice persists
    await page.reload(); await until(() => window.__arcade && window.__arcade.stats.frames > 3, 90000);
    await E(() => window.__loadNK()); s = await E(() => { const N = window.__nkGame; return { saved: localStorage.getItem('galacticarcade.nkScenery'), sc: N.scenery, kit: !!N.roofKit, feet: !!N.feet }; });
    chk(s.saved === 'rooftop' && s.sc === 'rooftop' && s.kit && s.feet, 'after a reload Neon Knockout loads straight into the rooftop', s);
    await E(() => window.__nkGame.menuAct('scenery')); await H.frames(page, 3).catch(() => {}); s = await E(() => window.__nkGame.scenery); chk(s === 'studio', 'flat SCENERY (menuAct) back to studio', s);
    chk(errors.length === 0, 'no console errors', errors.slice(0, 5));
    await R.close();
    // kill switches
    R = await openVR({ qs: '?norooftop=1&nofeet=1', init: { content: IWER_SRC + SETUP + HEADSET_FB } }); page = R.page; errors = R.errors;
    await page.evaluate(() => localStorage.setItem('galacticarcade.nkScenery', 'rooftop')); await page.evaluate(() => window.__loadNK());
    s = await page.evaluate(() => { const N = window.__nkGame; return { sc: N.scenery, orb: !!N.menuOrbs.find(o => o.id === 'scenery'), feet: !!N.feet, btn: !!document.getElementById('nkScn'), noRoof: N.noRoof }; });
    chk(s.sc === 'studio' && !s.orb && !s.feet && !s.btn && s.noRoof, '?norooftop=1&nofeet=1: studio only, no SCENERY option, no footprints', s);
    chk(R.errors.length === 0, 'no console errors (kill switches)', R.errors.slice(0, 5));
  } catch (e) { chk(false, 'exception ' + (e && e.stack || e)); }
  await R.close(); console.log(ok ? 'ALL PASS' : 'SOME FAILED'); process.exit(ok ? 0 : 1);
})();
