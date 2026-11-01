# How a pixel VFX module is rated

The rater sees only images and this rubric: no code, no history. It scores one module (one or more effects) from 0 to 10, to one
decimal, and lists what keeps it from a higher score. A module ships at 9.2 or more.

## What the rater gets (the manifest)
`runs/rate-<module>/manifest.json`:
```json
{ "module": "ice", "summary": "what the effects are and when they appear in the game", "refKind": "what the reference sheets are",
  "refs": ["runs/ref/ice/ice-nova_sheet.png", "..."],
  "items": [ { "name": "Frost Nova", "lab": "ice-nova", "game": [".../runs/rate-ice/ice-nova_sheet.png"], "notes": "frames, where to look" } ] }
```
`game` sheets are frame-exact captures inside Embervale (an HD-2D world: pixel sprites standing in a lit 3D diorama, about 43 px tall
heroes, bloom). `ref` sheets are the reference: Sprite Fusion's own effect code rendered by `sfref.mjs` on a dark floor, or pixelfx's
renderer, or, for an original effect, the closest Sprite Fusion effects as a style reference.

## Rubric (weights)
1. **Match the reference (35%)**: composition, timing, scale relative to the character, shape language, materials, and especially the
   colours and how they step (ramp roles, highlights, darks). Aim for the reference's look, adapted to the game's scene; a port should be
   near-indistinguishable in style from its reference.
2. **Pixel-art craft (20%)**: crisp pixels on the sprite grid, stepped ramps (no smooth gradients in the colour layer), ordered dither for
   fades, deliberate clusters, readable silhouettes, light used for glow. Nothing reads as copy-pasted or as simple primitives.
3. **Detail and richness (15%)**: reads as detailed even from far away: layered parts (core, secondary, debris, light), variation between
   instances, secondary motion. Not busy noise.
4. **Fit in the game (20%)**: sits in the scene correctly (feet/ground anchoring, character outline, depth), right scale, colours that are
   cinematic and natural in the zone's light: not oversaturated, not grey or washed out; doesn't hide gameplay or the character.
5. **Restraint and efficiency (10%)**: canvas no bigger than needed, nothing clipped at a canvas edge, no visual clutter, sensible
   lifetimes.

Scoring guide: 9.5+ indistinguishable from a polished shipped game; 9.2 ship quality; 8.5 good but visible flaws; 7.5 clearly
unfinished; below 7 wrong or broken. Be strict: most first passes land between 7 and 8.8.

## What the rater returns
`{ score, perItem: [{ name, score, issues }], fixes: [ordered, concrete, visual instructions: "the core flash is 2x too big next to the
hero", "ripples sit on one horizontal row: scatter them over the ground plane", "orange is oversaturated vs the reference C3"] }`
