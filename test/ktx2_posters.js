// vrtest-v10: Chief's v256 baked KTX2 posters (cabinet marquees, kiosk ticket, claw icon strip) match what our canvas paint draws and are
// the right way up. Same page twice: ?noktx=1 (canvas paint) and normal (KTX2); each poster's map is drawn on a plane with three's UVs into
// a 96x48 target and the pixels are compared, both as is and flipped. Writes side-by-side PNGs to /workspace/.stt-fixtures/v10-shots.
const { open } = require('./lib'); const fs = require('fs');
const DIR = '/workspace/.stt-fixtures/v10-shots'; fs.mkdirSync(DIR, { recursive: true });
const grab = async qs => { const o = await open({ w: 480, h: 270, qs }); const { page } = o;
  await page.waitForFunction(() => window.__arcade && window.__arcade.stats && window.__arcade.stats.frames > 3, null, { timeout: 120000 });
  await page.waitForTimeout(6000);
  const r = await page.evaluate(async () => { const A = window.__arcade, T = A.THREE, R = A.renderer, out = {};
    const W = 96, H = 48, rt = new T.WebGLRenderTarget(W, H), cam = new T.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 2); cam.position.z = 1;
    const want = { strike: 'strikeCabinet', ghost: 'ghostCabinet', blaster: 'blasterCabinet', bb: 'bbCabinet', roadster: 'roadsterCabinet', skytower: 'skyTowerCabinet', claw: 'clawCabinet' };
    const found = {}; A.scene.traverse(o => { if (!o.isMesh) return; let p = o, cab = null; while (p) { for (const [k, n] of Object.entries(want)) if (p.name === n) cab = k; p = p.parent; }
      if (cab && o.name === 'marquee' && !found[cab]) found[cab] = o.material.map; if (o.name === 'kioskSideTicket' && !found.kiosk) found.kiosk = o.material.map; });
    if (window.__neonClawIcon) found.clawIcon = window.__neonClawIcon.material.map;
    for (const [k, t0] of Object.entries(found)) { if (!t0) continue;
      const rep = t0.repeat.clone(), off = t0.offset.clone(); t0.repeat.set(k === 'clawIcon' ? 0.1 : 1, 1); t0.offset.set(0, 0); t0.updateMatrix();
      const sc = new T.Scene(); sc.add(new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: t0, transparent: k === 'kiosk' })));
      R.setRenderTarget(rt); R.setClearColor(0x000000, 1); R.clear(); R.render(sc, cam); const px = new Uint8Array(W * H * 4); R.readRenderTargetPixels(rt, 0, 0, W, H, px); R.setRenderTarget(null);
      t0.repeat.copy(rep); t0.offset.copy(off); t0.updateMatrix();
      out[k] = { ktx: !!t0.isCompressedTexture, wh: (t0.image && t0.image.width) + 'x' + (t0.image && t0.image.height), mips: !!(t0.generateMipmaps || (t0.mipmaps && t0.mipmaps.length > 1)), px: Array.from(px) }; }
    return { out, ktxOk: window.__texload && window.__texload.ok }; });
  await o.close(); return r; };
(async () => {
  let ok = true; const chk = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) ok = false; };
  const a = await grab('?noktx=1'), b = await grab('');
  chk(!a.ktxOk && b.ktxOk, 'noktx page uses canvases, normal page uses KTX2 ' + JSON.stringify([a.ktxOk, b.ktxOk]));
  const W = 96, H = 48;   for (const k of Object.keys(b.out)) { const p = a.out[k], q = b.out[k]; if (!p) { chk(false, k + ': no canvas twin'); continue; }
    let same = 0, flip = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let c = 0; c < 3; c++) { const i = (y * W + x) * 4 + c; same += Math.abs(p.px[i] - q.px[i]); flip += Math.abs(p.px[i] - q.px[((H - 1 - y) * W + x) * 4 + c]); }
    same /= W * H * 3; flip /= W * H * 3;
    chk(q.ktx && same < 18 && same < flip * 0.7, k + ': baked KTX2 ' + q.wh + ' matches our canvas paint ' + p.wh + ' the right way up (mean diff ' + same.toFixed(1) + ', flipped ' + flip.toFixed(1) + ', ktx ' + q.ktx + ')');
    const buf = Buffer.alloc((W * 2 + 4) * H * 3, 255); for (let y = 0; y < H; y++) for (let x = 0; x < W * 2 + 4; x++) { const src = x < W ? p.px : x >= W + 4 ? q.px : null; if (!src) continue; const sx = x < W ? x : x - W - 4, i = ((H - 1 - y) * W + sx) * 4, o = (y * (W * 2 + 4) + x) * 3;
      for (let c = 0; c < 3; c++) buf[o + c] = src[i + c]; }
    fs.writeFileSync(DIR + '/poster_' + k + '.rgb', buf); }
  console.log(ok ? 'ALL PASS' : 'SOME FAILED'); process.exit(ok ? 0 : 1);
})().catch(e => { console.log('FAIL exception ' + e.message); process.exit(1); });
