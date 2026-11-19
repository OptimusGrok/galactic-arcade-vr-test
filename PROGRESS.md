
## t253 PORTALS in room 2 + hallway (sw v109)
- setWalls: room 2 walls R2_WALLS swap to the shared portalMat (window wall 1 stays hidden/window); hallway W/E walls use portalWallsHall (portalMat clone, uv scaled HALL_L x DOOR_H, shared portalU uniforms); originals restored via userData.mat0; medieval hallway code reads mat0.
- Draw calls in room 2 (phone): current 229 -> portals 223.
- test/portals_room2.js (phone 412x915), shots/portals_{room2_wide,room2_back,room2_window,hall}_phone.png

## Unique player names (Dave via Chief, sw v111)
- Supabase (kfupqtafhaflzaoqtenf): table public.player_names (RLS on, no policies, anon revoked) + SECURITY DEFINER RPCs claim_name(p_name,p_owner,p_legacy) -> ok/taken/bad and name_free(p_name,p_owner). SQL: supabase/migrations/20261105_player_names.sql
- names.js (new, classic script before player.js): owner = secret neonarcade.nameKey (not the broadcast mpId); ET reserved ('__reserved__'), grandfathered via neonarcade.nameLegacy set on first load when galacticarcade.player.name was ET; offline -> fail open + mp presence check.
- player.js (start box + PLAY gating only): debounced check, 'Name taken' hint, PLAY hidden until free; PLAY claims.
- test/names.js all pass; start.js phone + multiplayer.js pass.

## VR v24 (Dave t435u / t437u, sw galactic-arcade_vr-v24)
- Strike HUD: A HYPER SPEED + B BOMB buttons side by side at the TOP RIGHT, bomb icons at the TOP LEFT, both just under the black HUD bar (solo y 62 / co-op y 66; icons y 47 / 54), see-through (fill x0.45, ring 0.6, text 0.8, badges 0.85). layBtns() moves the hit areas too.
- A bug (headset): the A press that starts the cabinet (demo -> play) stayed held into play, so vr.js sent KeyC on the first play frame and Strike burned its one HYPER SPEED (8 s) during the stage intro, then a 60 s recharge ate every later A. Fix: vr.js S.aLatch, A must be released after the start before it counts. Strike toasts "HYPER SPEED RECHARGING Ns" when A hits the recharge.
- Flat Quest: getGamepads() is empty in the 2D Quest Browser (Dave's own ?qdbg overlay), so A cannot reach a page there; the on-screen HYPER SPEED button (laser click) is the flat path. Old non xr-standard pad layout (A = 3) now maps to HYPER SPEED in vr.js + quest-pad.js.
- test/strike_v24.js (layout solo + co-op, real start flow with A held, enemy clock + px drop while A held, X, legacy index).

## VR v25 (Dave t442u / t443u, sw galactic-arcade_vr-v25)
- Strike: P1 / P2 labels at the bottom of the co-op screen removed (top names / scores untouched). A / B buttons r 21 -> 13, side by side in the top-right corner (B at W-16, A at W-46, y 53 solo / 58 co-op), count / status only inside + small A / B badges; hit areas follow r.
- B laser bug: roomfire.js only fires while its FIRE button is "shown", and canShow() needs #bZoom 'on'. main.js skipped syncZoomBtn() while in XR, so after v18's PLAY -> straight into VR the flat HUD never ran and #bZoom stayed off: B never fired (older tests entered VR from a walking flat game, so it was already on). main.js now syncs #bZoom in XR too.
- Room controls (headset): Y (left) = menu open / close, always; B (right) = gun fire only (gear()), nothing without the gun (B no longer opens the menu). NK B / Y pause, Strike B bomb, Neon Bricks, chess, golf unchanged.
- Flat Quest (B / Y = trapped history back, the browser can't tell them apart): walking in the room, B fires the gun's FIRE button only while it is shown, else nothing (was Space = jump). In games / Neon Bricks unchanged.
- test/vr_bfire_v25.js (real PLAY -> VR start; B with gun off / on / off, Y menu; flat Quest B gun off / on). Older tests that opened the menu with B now use Y.

## vrtest-v20 (Dave t503u + t504u, sw galactic-arcade_vrtest-v20, label MEMORY TEST v20)
- Neon Knockout SCENERY: NEON STUDIO (default) or CYBERPUNK ROOFTOP. Saved in localStorage galacticarcade.nkScenery. Kill switch ?norooftop=1 (no option, always the studio).
  - Where: the purple SCENERY orb in the studio menu (right column under DAILY / GLOVES: punch it, or point the ray + TRIGGER or A; every NK menu orb is now pointable too);
    the Y menu in Neon Knockout (SCENERY button in the PLAY NEON BRICKS slot); flat: SCENERY button next to START.
  - nk/rooftop.js (new, procedural, no image files): sky dome (gradient, drifting clouds, stars in the shader), 155 instanced towers (lit windows,
    neon crown bands + stripes computed in the shader, no window texture), wet roof slab (tiles, puddles that show the mirrored neon + reflect the
    sky in the shader, rain ripples; the studio floor's lane / ring / beat cues kept), parapet + railing + 6 HVAC units with ducts + stairwell hut +
    water tank + antenna mast with blinking beacon + dish + pipes (ONE merged mesh), neon strips with dim mirrored copies (ONE mesh), 9 neon signs
    from one 512x512 canvas atlas incl. NEON KNOCKOUT billboard + signs on 5 hero towers (ONE mesh, flicker), 1100 rain streaks (ONE LineSegments,
    animated in the vertex shader), 2 beacon sprites. No lights, no shadows. Ring, ropes, portals, targets, gloves, menu, board unchanged.
  - Switch: built in short slices (setTimeout between sections), compiled with compileAsync while hidden, swapped in one frame. Studio -> rooftop:
    studio columns / cones / sign / dust / glass floor hidden, their geometries + sign texture disposed (re-uploaded on return; materials kept so no
    recompile). Rooftop -> studio: rooftop fully disposed (geometry, materials, atlas).
- FOOTPRINTS (t504u): two glowing shoe-sole outlines (~27 cm, ~38 cm apart, toes toward the targets) at the stand spot, one additive 0.75 m quad +
  256x256 canvas, y 0.016; ~0.6-0.9 on the title screen, 0.16 during a round. Both sceneries. Kill switch ?nofeet=1.
- test/nk_scenery_v20.js (VR, 480x270, IWER): emulator numbers (SwiftShader, both eyes):
  studio 358 draw calls / 37k tris / 211 GPU textures / 1221 geometries / 349 programs;
  rooftop 272 draw calls / 50k tris / 213 textures / 1199 geometries / 355 programs (+6 rooftop programs, compiled before showing);
  back to studio 362 / 213 / 1220 / 349 (+2 textures = cached SCENERY orb labels). Visible-studio texture bytes equal (1024x256 sign swapped for 512x512 atlas, ~1.33 MB each).
  Worst frame while switching to the rooftop 26 ms (median 16.7), back to the studio 21.6 ms; build ~77 ms spread over ~11 tasks, compile ~21 ms.
