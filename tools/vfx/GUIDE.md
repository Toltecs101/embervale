# Embervale × Sprite Fusion pixel VFX: builder guide

Read this whole file before you start. It is your only briefing.

## The game
**Embervale** (`/home/user/embervale/index.html`, ~1.4 MB, one file, plain JS + WebGL, all code inside one IIFE) is an HD-2D action RPG:
pixel-art sprites standing as camera-tilted billboards in a lit 3D diorama with bloom, tilt-shift and real shadows. Seven classes
(blademaster, arcanist, ranger, lightwarden, shadowblade, dragoon, berserker), bosses, pets, loot, 2 regions (0 = Embervale, 1 = the Frostspire).
Its existing FX are smooth gradient textures (`FXR.soft/ring/flame...`) drawn through `fxBill`/`fxFlat`, plus `part()` particles.
**Do not edit `index.html` or `core.js`.** You write one module file in `fx/`; the assembler splices it into index.html (it derives the clean game by stripping the VFX blocks out of index.html). Grep `../../index.html` for game code.

## What we are adding
Sprite Fusion (SF) publishes an MIT library of pixel-art game VFX *as code* (MCP tools `mcp__Spritefusion__list_vfx` and
`mcp__Spritefusion__get_vfx`; load them with ToolSearch `select:mcp__Spritefusion__get_vfx,mcp__Spritefusion__list_vfx`).
`get_vfx(slug)` returns the effect's **recipe** (timeline, layers, palette, numbers) and its **complete TypeScript source**.
We port SF effects the game is missing, and build original effects **in SF's exact coding style**.

SF style, which you must follow:
- Effects rasterize into **art-pixel buffers** (`Uint32Array` ABGR): a `color` buffer (opaque pixels, alpha-blended discs only for
  dust/smoke/mist) and a `light` buffer (additive glows, falloff `(1 - d/r)^2 * k`). Never smooth gradients in the colour buffer.
- **Stepped ramps**: 6–7 colour ramps white-hot → dark; a pixel's colour jumps between ramp steps by life/heat thresholds
  (e.g. `k > .6 ? C[1] : k > .3 ? C[2] : C[3]`). Hue-shifted ramps (highlights toward yellow-white, shadows toward deep/cool).
- **4×4 Bayer ordered dither** for every fade (`dot(buf, x, y, c, alpha)`), never alpha, except dust/smoke/mist discs.
- **Frame windows** for the opening punch: frame 1 is `t <= 1/60`, frame 2 `t <= 2/60` (time windows, frame-rate independent).
- **Seeded `Rng`** (mulberry32) per effect; `seed` option. Physics: gravity 1900 units/s², drag `v -= v*drag*dt`.
- **back / front layers** (`draw(fr, layer)`): what is behind vs in front of the character it belongs to.
- **Hooks** for game feel: `shake(trauma)`, `flash(k, "r,g,b")`. Light "pop" `e^(-t/τ)` is the punch, not screen flashes.
- A header comment that **is a recipe**: timeline with times, layers, palette roles, shapes and motion numbers, feel.
- One closure per effect file, Sprite Fusion helper names (`Px`, `dot`, `bayer`, `Rng`, `mix`, `scale`, `ramp`, `hex`, `rgb`, `clamp`, `smooth`, `outExpo`, `noise2`, `hash`).

## The bridge (already built, in core.js; read `/home/user/embervale/tools/vfx/core.js` header and code)
`pxfx(make, o) -> handle|null` gives an effect its own small canvas in the world. Each frame the bridge clears the canvas buffers,
calls your `draw`, packs the buffers into one dynamic nearest-filtered texture and draws them: the light buffer additively
(it also feeds the bloom), then the colour buffer alpha-blended. Your effect object is SF-shaped:
`{update(dt), draw(fr, layer?), done(), stop?(), lamp?()}` and `fr = {w, h, ox:0, oy:0, color, light}`.
- **Scale:** 1 art px = `PIX` (2.5) world units, the sprites' own grid. Inside effects, positions are SF world units: `PXW` (2) per art px,
  so ported SF code keeps its numbers. `make(c)` receives `c = {x, y, w, h, PXW, actor, handle}`: the anchor in effect units
  (`c.x, c.y`), canvas size in effect units, and an SF **Actor** when `o.follow` is set.
- **Modes:** `'bill'` (default) stands up facing the camera like a sprite: art x → world x, art y down → down. Put the anchor at the
  ground point (`ay` near the canvas bottom) so the canvas's ground row is the floor (SF's `ground` option = `c.y`). `'flat'` lies on the
  ground like a decal: art y down → world y (toward the camera). A circle in a flat canvas reads as a perspective ellipse on the ground.
- **Options:** `x, y` world ground point; `h` anchor height above ground; `w, hh` canvas size in art px (≤ 512, keep it as small as
  the effect needs: cost is w×hh per frame); `ax, ay` anchor pixel (default `w/2, hh-8`); `split:true` separate back/front colour
  layers drawn 3 units behind/in front of the anchor depth (for effects wrapping a character); `follow: entity` (tracks `e.x, e.y`; when
  it dies/vanishes the bridge calls your `stop()` or fades you out); `fx, fy` offset from the followed entity; `ttl` hard cap seconds
  (default 12; weather/status loops set their own); `pri` budget priority (0 ambient, 1 normal, 2 keep); `amb` 0..1 multiply the colour
  layer by the zone's ambient light (use ~.6–1 for smoke, dust, leaves, rain, fog: non-emissive stuff); `lamp:true` + an `fx.lamp()`
  returning `{i, c:[r,g,b], r, h}` lights the world around it (use for big bright moments only); `nolight:true` no light buffer
  (cheaper; weather, stains, dust).
- **Actors:** `c.actor = {feet(), silhouette()}` exactly SF's Actor: `silhouette()` returns the followed entity's *current sprite pixels*
  placed in your canvas (`{x, y, w, h, data}` ABGR, alpha 0 where empty), read from the sprite atlas each frame. Outline effects
  (burning, electrified, frozen, poisoned, auras, dissolves) use it. Make the canvas big enough around the anchor: hero is 52×46 art px
  (≈43 px tall, anchor at its feet), wolves 38×28, golems 40×40, bosses 53×55 up to 150×104 (Varkhul).
- `pxProj(H, x, h, y)` → `[X, Y]` effect units where a world point lands on your canvas (for chains/arcs between enemies).
- `pxStop(H)` stops a handle; `pxfx_clear()` clears all (the bridge does it on world reset/respawn, then emits `pxClear`).
  A handle that has left the list (done, ttl, evicted over budget, cleared) has `H.dead === true`: if you keep entity→handle maps,
  test `!H || H.dead` before reusing and respawn; also clear your maps on `pxClear`.
- **Shared helpers:** `PXK` = `{PXW, TAU, BAYER, bayer, rgb, hex, mix, scale, ramp, cl /*clamp(v,a=0,b=1)*/, smooth, outExpo, hash, noise2, lum,
  Px, dot, Rng, rampOf, shake, flash, WHITE}`. `PXK.rampOf('#rrggbb' | [r,g,b])` makes a 6-step SF-style ramp from any colour (handy for
  per-element/per-enemy colours). `PXK.shake(trauma)` and `PXK.flash(k, "r,g,b")` are SF's hooks mapped to the game (respect settings).
  `Rng` has `next range int sign chance pick`. Px has `set get blend add disc alphaDisc line glow`.
- **Lab:** `pxlab(id, name, category, src /*'sf' or 'orig'*/, play(x, y))` registers a test entry (x, y = a ground point next to the hero).
  Every effect variant you make needs at least one lab entry; ids must be unique and prefixed by your module name.
  A lab entry for a character effect can spawn its own subject next to the hero:
  `const e=mkEnemy('wolf',x,y,Math.max(1,P.lvl-2),null);e.state='idle';enemies.push(e);` then apply the status (e.g. `addDot(e,4,3,'#ff9a4d')`,
  `e.stun=2`, `e.slowT=3;e.slowAmt=.5`). Status effects should be driven by the *game state* (poll `e.dots`, `e.stun`, `e.slowT`... in `update`),
  so that both the lab and real gameplay show them.

## Game events you can subscribe to (`onEv(name, fn)`), all already wired by the core
`pxHit (e, dmg, src, opt, crit)` a hit landed on an enemy (`src===P` for the hero; `opt.dot` = damage over time; `opt.color` the damage colour;
`opt.big`); `pxPHurt (dmg, src)` hero lost hp; `pxHeal (amount)`; `pxLevel (lvl)`; `pxBreak (e)` Octopath-style shield Break;
`pxChest (o)`; `pxDot (e, dps, t, col)` a DoT took hold (colours used by the game: fire `#ff9a4d`, venom `#9aff6a`, void `#c08aff`, bleed `#ff6a8a` / `#ff7a7a`; live DoTs are in `e.dots` as `{dps,t,acc,c}`); `pxMotes (x, y, col, n)` xp
(`#8af08a`) / gold (`#ffd84a`) motes; `pxBoom (g)` meteor/trap/ember blasts (`g.x, g.y, g.r`); `pxElem (kind, x, y, R, k)` kind ∈
fire ice storm wind sun (the arcanist's elemental strikes, also other callers); `pxCast (k, ab)` hero cast slot k (0 = basic attack; `ab.fn`
is the ABIL key, `ab.n` name, `ab.col` colour); `pxUlt (ab)`; `pxShield ()` hero barrier broke.
Plus the game's own: `update (gdt)` (game time, only in play and unpaused), `tick (dt, paused)`, `scene (now, viewBounds)`,
`killEnemy (e)`, `bossKilled (e, first)`, `die`, `respawn`, `dodge (perfect)`, `perfectDodge`, `startGame (save)`, `resetWorld`.
If you need another moment, wrap the game function in the house style, inside your module:
`{const o=novaAt;novaAt=function(p,i,x,y){const r=o(p,i,x,y); /* yours */ return r;};}` (always call through, return its result,
never throw: guard with try/catch if your code could fail). Wrapping is fine for any top-level `function` in the game.
Useful game state: `P` (hero: `x y face ang r hp maxHp shield buffs{} dash dead lvl cls.id`), `enemies` (each: `x y r s d{col fly spr boss}
dead stun slowT slowAmt dots[] brk boss type`), `pets`, `projs` (`kind x y z vx vy`), `gfx` (ground effects: `kind x y r dur t`),
`pickups`, `ZONES[curZone].id`, `curRegion`, `gameTime`, `PERF.lite`, `QUAL` (0..2), `reduceMotion`, `settings.shake`, `T` (tile = 48 wu),
`tiles` / `zoneMap` / `isSolid(tx,ty)`, `hdEH(x,y)` terrain height, `staticLights` (`{x,y,h,r,col,i,fl}` lamps and fires), `ambCur`.
Zones: 0 wilds, 1 village (Hearthmere), 2 woods (Whisperwood), 3 ruins, 4 reach (Ashen Reach), 5 crater (Ember Crater),
6 snowfield, 7 frostholm, 8 whitepine, 9 glimmer (crystal caves), 10 storm, 11 peak, 12 g3fen, 13 g3moor, 14 g3downs, 15 g3coast
(6–11 are region 1). Enemy types: wolf spider spiderling skeleton wraith shade panther lion tortoise acolyte golem imp voidling
snowwolf yeti frostwisp crystalgolem glimbat crystalspider harpy stormknight hollow; bosses brood aldric varkhul starwarden hrimgar
glimmera vortigan nyxara; training dummy `g4_dummy`. Grep `../../index.html` for anything else.

## Your module file
Write exactly one file: `/home/user/embervale/tools/vfx/fx/<module>.js`. Model it on `fx/impact.js` (a finished port, wired to `pxHit`):
```js
/* <NAME> (Sprite Fusion "<Title>", MIT, ported | original, in Sprite Fusion's style): one line on what it is and where it shows in the game.
   Recipe: timeline / layers / palette / shapes and motion / feel, with real numbers (this header is the recipe). */
const {pxSomething}=(function(){'use strict';const {Px,dot,bayer,Rng,mix,scale,ramp,hex,rgb,cl:clamp,TAU,PXW:PX}=PXK;
  /* ...the effect factory/factories in SF's code shape... */
  /* ...Embervale wrapper(s) calling pxfx(...)... */
  /* ...wiring: onEv(...) subscriptions or {const o=fn;fn=function(){...}} wrappers... */
  pxlab('<module>-<variant>','Readable name','Category','sf'|'orig',(x,y)=>...);
  return{pxSomething};})();
```
Rules:
- **Only export names prefixed `px` + your module** (e.g. `pxIchor`, `pxIchorStain`). Never declare other top-level names. The assembler rejects
  collisions with the game or other modules. Everything else stays inside the closure. No marker comments (`/* ===== `) in your file.
- No external assets, no DOM, no timers (`setTimeout`); use `update(dt)` time. Never allocate per pixel per frame; reuse arrays.
- **Budget:** a typical hit/burst canvas ≤ 160×128, status outlines ≤ 96×96 (bosses larger), big moments ≤ 256×200, weather/fog slabs
  ≤ 256×128 each. Raster cost matters (phones): avoid `glow` with radius > 40 every frame on many effects; cap simultaneous instances
  of your effect (e.g. status outlines on at most 6–8 enemies, nearest the hero; keep a Map entity→handle and reuse). Respect `PERF.lite`
  (fewer/smaller/no light) and `reduceMotion` (no shake, gentler flashes). Ambient/weather `pri:0`.
- Don't remove or replace existing game FX; **add** the pixel layer on top so the two read as one (you may dial an existing effect's call down
  only if your effect fully covers it, by wrapping with care, and say so in your report).
- Colours: use SF's default ramps where they fit, otherwise ramps derived from the game's colours (`e.d.col`, ability `col`, `opt.color`) via
  `PXK.rampOf` or hand-made 6/7-step hue-shifted ramps. Match Embervale's warm HD-2D palette.
- Sizes: think in the game's art pixels. The hero is ≈43 px tall; a sword slash arc ~30–40 px; a hit star ~10–20 px; a big explosion
  ~60–100 px. Scale SF's `size` option to fit.

## Test it (required): frame-exact screenshots inside the real game
```
cd /home/user/embervale/tools/vfx
node shot.cjs --out runs/<module> --fx <module> --play <labId>[,<labId2>] --frames 0,2,4,8,14,22,34,50 [--zone woods] [--enemy wolf:2]
              [--pre "js"] [--run "js"] [--post "js"] [--cls arcanist] [--region 1] [--crop 400x260] [--zoom 2]
```
- It assembles a test build (core + your module), boots the game headless (SwiftShader WebGL, ~15–40 s per run; the machine has 4 CPUs
  shared with other agents, so batch several `--play` ids per run), steps exactly 1/60 s per frame, fires the lab entry next to the hero
  and saves crops `runs/<module>/<id>_fNN.png` and a contact sheet `<id>_sheet.png` (frame number + time on each tile).
  **Look at the sheets with the Read tool** and judge them like an art director: pixel-crisp? on the sprite grid? readable at game scale?
  ramp steps visible, dither fades, no smooth gradients in the colour layer? anchored to the ground/character correctly? not clipped by its
  canvas edge? Iterate until it looks great.
- `--run "js"` evaluates code *inside the game closure* as the trigger instead of a lab entry, e.g. to test the real wiring:
  `--enemy wolf:2 --run "const e=enemies.find(q=>q.type==='wolf');hurt(e,10,P,{});addDot(e,5,3,'#ff9a4d')"`.
  `--pre` runs once after spawn; `--post` after each trigger (e.g. `P.face=-1`). `--zone <id>` puts the hero in that zone.
- The JSON report lists console errors (must be **none**) and PXFX stats per captured frame (`ms` = CPU raster time of all effects,
  `live`, `quads`, `drop`). Also measure your effect's cost: keep a single instance's raster well under 0.5 ms here.
- For loops/status effects, also check the stop path (entity dies → effect ends cleanly) and the reset path.
- The real game wiring matters as much as the look: trigger the actual game moment (`--run`) at least once and confirm the effect appears.
- Use your own `runs/<module>*` directories only. Don't delete other agents' files.

## Report (your final message)
Return: the module file path; the lab ids; what each effect is and **where it is wired in the game** (event/wrapper + conditions);
SF slugs ported (or "original"); measured raster ms; the contact sheet paths of your best captures; anything you could not do;
any core/bridge bug you hit (with a precise description: don't work around a core bug silently).

## pixelfx: 244 more effects you can play directly
`/home/user/embervale/tools/vfx/node_modules/pixelfx` is a checkout of **pixelfx** (github.com/patch-gg/pixelfx, MIT, by Patch, built on Hugo Duprez's
Sprite Fusion method and code): 244 pixel effects on the *same* frame layout (color + light Uint32 ABGR), every one a small ES module
`src/fx/<category>/<name>.js` with `meta = {name, desc, tags, size:[w,h], origin:[x,y], duration, loop, actor?, options}`.
- Browse: `docs/CATALOG.md`, `node tools/list.mjs <words>` (inside the checkout). Preview without a browser (fast, no WebGL):
  `node tools/render.mjs <cat/name> [--opts '{"palette":[...]}']` → `records/<cat>/<name>/contact.png` (read it with Read).
- Play one in the game: declare it in your module's header comment, `/* ... @pixelfx fire/brazier status/stunned */` (the build bundles
  exactly the declared effects into `PXLIB`), then `pxLib('fire/brazier', o, opts)` → handle. `o` = pxfx options (x, y, h, follow,
  split, pri, amb, nolight, lamp + lampFn, ttl; default ttl = duration + 1 s, Infinity for loops); `opts` = the effect's options:
  `palette` (**dark → bright** ramp of hex strings, the reverse of SF's order), `seed`, `flip`, `angle`, `light` (glow strength), plus its
  own `meta.options` knobs. The canvas is the effect's `meta.size` (+4 px margin) anchored at `meta.origin`.
- Effects with `meta.actor` (status effects, auras) wrap a character: pass `follow: entity` (and usually `split: true`) and the bridge feeds
  them the entity's live silhouette as their actor every frame (mask, pixels, head, chest), so they hug the real sprite.
- Loops (`meta.loop`) never end on their own: keep a Map thing→handle, spawn when the thing is in range, `pxStop(H)` when it leaves or the
  state ends (it fades out), test `!H || H.dead` before reuse, clear the Map on `pxClear`. To move a handle (critters, travelling
  things) set `H.x`, `H.y`, `H.h` yourself every update; the bridge draws it wherever it is.
- pixelfx effects are fixed pixel size (never scale pixel art); they are drawn for 19–38 px characters on a 320×180 frame, which matches
  Embervale's 43 px hero well. Prefer effects that fit the game's look; recolour with `palette` to match zones and the game's ramps.
- You may combine a pixelfx effect with your own SF-style code in the same module. Credit lines are added by the build.

## Quality bar, references and the rating loop (read RATING.md)
Every module is rated by a reviewer that sees only images and `RATING.md`; it ships at **9.2/10 or more**. The owner's rules:
match the references as closely as possible (composition, scale, materials and especially colours), cinematic and natural, not
oversaturated, not grey or washed out; detail everywhere, nothing copy-pasted or simple, reads as detailed even from far away;
efficient (the owner's GPU is weak: small canvases, `every` for ambient loops, `nolight` where there is no glow, caps).
UI text you add must avoid eyebrow labels, monospace uppercase text, serif display fonts, beige, 01/02/03 counters and em dashes.

**References.** For a Sprite Fusion port, render the original: fetch its source with `mcp__Spritefusion__get_vfx`, save the TypeScript
to `runs/<module>/ref/<slug>.ts`, then `node sfref.mjs runs/<module>/ref/<slug>.ts --out runs/<module>/ref --opts '{...}' --frames ...`
(its own code on a 320x200 frame; use the same frame numbers as your in-game captures and the situation's call from get_vfx as `--opts`).
For a pixelfx-based effect: `cd node_modules/pixelfx && node tools/render.mjs <cat/name>` (contact sheet in `records/<cat>/<name>/`).
For an original effect, render the 1-2 closest Sprite Fusion effects as the style reference.

**Manifest.** After capturing, write `runs/<module>/manifest.json` exactly as RATING.md describes (absolute or tools/vfx-relative
image paths, a plain summary, one item per effect with its game sheets and reference sheets). The rater reads only that.

**Efficiency features in the bridge.** `o.every` (default 2 for ambient loops: pri 0 and ttl >= 60 s) redraws and re-uploads a handle
every Nth frame from a fixed texture slot; `nolight`; the texture is 2048x1024 (left half packed per frame, right half fixed slots).

**Already in index.html (G9 block, not yours to change):** pet shields share a 20 s cooldown, pet/summon hits charge the Ultimate at a
quarter rate, at most 4 spirit wolves, growth cleared round boss Wardens, greener start foliage, MENU moved beside the minimap.
`fx/wayfinder.js` draws the gold route chevrons to the next checkpoint.
