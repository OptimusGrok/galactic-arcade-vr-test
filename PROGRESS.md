
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

## vrtest-v21 (Dave via Chief t958u, sw galactic-arcade_vrtest-v21, label MEMORY TEST v21): DEBUG overlay — TEST LINK ONLY
- debug.js (new, classic script before session.js; precached): FPS, frame time (1 s), worst frame (5 s), JS heap (performance.memory, else n/a),
  renderer.info per frame (draw calls + triangles summed over every pass / both eyes: autoReset is off only while DEBUG is on), textures /
  geometries / programs, tier, version, room / scene (arcade / room 2 / prize shop / Neon Knockout + scenery + mode, cabinet game, beaming),
  last beam time (tp leaves idle -> back to idle) + its worst frame, last 5 errors (console.error, window error incl. failed loads, unhandledrejection).
- Open it: flat = monkey-face OPTIONS -> DEBUG: OFF/ON (opts.js calls __gaDebug.addBtn) -> corner HUD bottom-left. VR = Y menu -> DEBUG
  (top-left of the menu) -> small panel above the left-wrist display. ?debug=1 turns it on. Saved in localStorage galacticarcade.vrDebug.
- Off = no frame hook (window.__dbgFrame null; main.js only checks the property), no timers, no DOM / canvas redraws. On = HUD / panel text
  rebuilt at most 4 / s (VR canvas redrawn only when the numbers change).
- !!! NOT FOR MAIN: debug.js has TEST_BUILD = true and only runs on a path containing /galactic-arcade-vr-test (or localhost). When porting
  anything from v21 to the main VR link, leave out debug.js, its <script> tag in index.html, its sw.js precache entry, the main.js __dbgFrame
  line, the opts.js addBtn line and the vr.js 'debug' Y-menu button + dbgPanel (or set TEST_BUILD = false).
- test/debug_v21.js (flat 480x270 + VR IWER) all pass; test/vr_start_play.js passes.

## vrtest-v22 (Dave t508u / t509u, sw galactic-arcade_vrtest-v22, label MEMORY TEST v22) - comfort locomotion (test repo only)
- Room walking in VR (not Neon Knockout / Neon Bricks / chess / cabinets, which keep their own sticks):
  - LEFT stick forward = teleport aim: parabolic ribbon arc (7.5 m/s, 32 points, one reused buffer) + landing ring, cyan when valid, red when invalid
    (no floor within 9 m, spot inside a wall / cabinet per collide(), or a wall/cabinet between head and spot). Release = fade out 120 ms, rig moved so the head
    lands on the ring (facing kept), fade in 150 ms. Release on red = nothing. Pull back or push hard sideways = cancel (must centre before aiming again).
  - RIGHT stick flick = 30 deg snap turn around the head with a quick fade (70 out / 90 in). Needs re-centring (|x| < 0.35) between snaps. Off while the fire-type menu is open. Replaces smooth turn.
  - MOVEMENT option: Y menu "MOVEMENT: TELEPORT + SNAP TURN / SMOOTH WALK + SNAP TURN", flat OPTIONS "VR MOVEMENT: TELEPORT / SMOOTH WALK". localStorage galacticarcade.vrMove (default teleport).
  - Stick clicks unchanged (left = wrist HUD, right = fire menu). Beam pads + trigger floor teleport unchanged.
  - Fade = own head-locked black sphere (BackSide, depthTest off, renderOrder 5000, hidden from the mirror) in both eyes. Force-cleared when leaving VR, while the PREPARING card is up,
    when a beam starts, or after 1.5 s. Debug panel line: MOVE <mode> LAST TELEPORT <ms> TPs SNAPS.
  - Kill switch ?oldmove=1 = old smooth walk + smooth turn, no MOVEMENT options.
- test/vr_comfort_v22.js (31 checks: valid teleport + fade, red/invalid, cancel, exact 30 deg + re-centre, fire menu blocks snap, smooth persists across reload, fade force-clear, ?oldmove=1, no errors).

## vrtest-v23 (Dave t510u / t511u, sw galactic-arcade_vrtest-v23, label MEMORY TEST v23) - Neon Knockout tidy-up (test repo only)
- Y only in Neon Knockout: during a round Y pauses / resumes (B did too, now ignored); outside a round Y = the menu (B never opened it, R B = gun fire, no gun in NK). Pause panel text "Y = RESUME".
- SCENERY in VR. Why it was hard to find: the orb existed in XR and was in view, but its label "SCENERY: STUDIO/ROOFTOP" was wider than the 512 px label canvas
  at 78 px, so it showed clipped ("ENERY: STUD") on the smallest, lowest orb; and in a round the only panel (pause) had no SCENERY (the Y menu only opens outside a round).
  Fix: labels shrink to fit (all orbs), SCENERY orb bigger (r 0.1, brighter, bigger label); SCENERY button in the Y menu (unchanged slot) AND in the pause panel.
- Boxing ring removed in both sceneries: white posts, the 3 ropes x 3 sides, the 1.25 m mat-edge torus, and the 1.25 m beat ring line in the studio floor shader.
  The standing circle (nkStandHere) + footprints, targets, lanes in the studio floor stay.
- Rooftop floor (nk/rooftop.js): opaque grey weathered concrete: 1.5 m slabs with seams, per-slab tone, wear + aggregate noise, dark stains, a few subtle dark puddles
  with a faint sky sheen. No neon lanes / beat ring / hot glow on the rooftop. Signs + city unchanged.
- Footprints: the outline is pixel-centred on its quad (bounds measured at build, shifted) and the quad is set from the standing circle's own position every frame.
- test/nk_v23.js (16 checks); nk_vr.js updated for Y-only pause.

## vrtest-v24 (Dave t513u, sw galactic-arcade_vrtest-v24, label MEMORY TEST v24)
- NK VR round boards: SCORE (panelL) + CALORIES (panelR) were 29 deg left / 29 deg right of facing, 1.95 m, head height + 0.05.
  Now BOTH on the LEFT: SCORE 43 deg, CALORIES 68 deg (centre of the pair ~55 deg), 2.1 m from the standing spot, head height + 0.38 (lower edge + 0.10, above the
  duck bar + sheath at + 0.06 and its posts), each turned to face the head. Both sceneries; placed from the calibrated standing spot at round start (now at once, was up to 0.1 s later).
  Flat (non-VR) layout unchanged. Tunable: PANEL_VR in nk/nkgame.js.
- Wrist HUD bug: pointing the ray at an NK menu orb (hover target 'nkOrb_<id>') had no entry in the HUD's hint table, so line 2 read "undefined" (ticket count on line 1 was fine).
  Now "TRIGGER: <orb label>" (e.g. TRIGGER: SCENERY: STUDIO), and any unknown target falls back to "TRIGGER: SELECT".
- test/nk_v24.js: angle / distance / height / facing per board, bar + post clearance, punch reach, every target path (20 cm margin), menu orbs, both sceneries, HUD text.
