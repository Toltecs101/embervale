/* POISON (Sprite Fusion "Poison", MIT, ported: cloud, puddle, poisoned aura): toxic gas drawn the way smoke is, in sickly greens.
   In Embervale: foes carrying a venom DoT (e.dots colour #9aff6a: the Venom affix, Venom Blades, the g8 venom proc...) are Poisoned
   (SF aura on their live silhouette: a green pulse running up their pixels, drips, bubbles, fumes, a stain at their feet; the 8 nearest
   the hero, 4 lite); the hero is Poisoned for 2.6 s when a spider's or the Brood's venom pool lands on it; those pools (gfx 'venom')
   splash into an SF toxic puddle where they land (drying after 2.6 s); Plague Breath's 'venom2' fields are puddles for their whole
   duration; the Smoke Bomb ('smoke') bursts as an SF gas cloud in smoke greys (no venom drops); in the Mirefen bog (g3fen) up to 3
   bubbling puddles (pri 0) sit round the hero, drying up when it walks away. One patch to the SF file, marked "Embervale:": cloud
   land time, start point and a gasOnly (smoke) switch.
   Recipe (SF numbers; P = POISON #f6ffc2 #cfff63 #8eea3f #55b92f #318232 #23552e #173320 #0e1d14, light to dark; steps 0 and 7 unused):
   - Gas puff: 3 alpha discs (skirt 1.08 r at .4, body .76 r at .55 offset (.05, .08) r, lit top .48 r at .38 (1 - .6 age) toward P1
     22 %), r0 -> r1 over 1.4 s outCubic, in over .15 s, launch velocity decaying 2.2/s, noise wander +-6 / +-4, fumes rise; colour
     P4 (or 40 % to P3) sinking 85 % to P6 with age. Spores: alpha discs + white core, breathing, drag .8. Bits at 1900 g.
   - Cloud (Smoke Bomb, r 150 -> size 1.07): smash at land (.05 s here; SF .5 with the flask's arc 110 u up): shake .25 x .5, light
     r 60 P2 .8 for .2 s, 10 glass shards, 14 drops, 16 puffs (60-220 u/s within +-1.4 rad of up, r 3-5 -> 9-17 px), more puffs
     28 % -> 0 by 2.2 s, bubbles / drips / spores to 3.2 s, ground stain 52 px x size spreading .5-1.3 s, fading 3.4-4.2 s, ~4.9 s.
     Smoke: the ramp #f2eef8 #d6cce4 #b2a6c4 #8a7a9a #685a7a #4a3e5a #2e2638 #16121c, gas, shards and stain only.
   - Puddle (half-width 44 px x size; venom pool r 88 -> 35 px, Plague Breath r 70 -> 28 px): splash of 10 drops, spreads .6 s
     (outCubic), a lens min(2.4, .9 + .04 w) px high: surface P2 shimmering P1 / white glints (two sliding noises), P3 under it in
     places, body P4, bottom P5, ends P4 / P5 with a #1a1422 lip, splatter P5 to 1.3 w; bubbles (9 % size + 4 % a tick) swell and pop
     (5 px spray, 2 + r drops, a fume, half the time a spore); fumes 7.5 % size, spores 5 %; stop(): dries over 1.4 s.
   - Aura: fades in .4 s; a pulse v = ((.9 t) mod 1.15) / .95 up the body, each pixel blended toward P1 / P2 at (.12 + .42 e^(-((u - v)
     / .13)^2)) level; per tick 11 % a drop (35-95 % down, staining the ground when 2 px), 9 % a bubble, 10 % a fume from the top 35 %,
     6 % a spore; a pool at the feet 6 -> 14 px over 3 s; light r .9 h + 8 P3 .28 breathing at 7 rad/s; stop(): fades .7 s.
   - Layers: back = stains, pools, splatter, their glows; front = flask, gas, bits, bubbles, spores, the pulse. Split for the aura. */
const {pxPoisonCloud,pxPoisonPuddle,pxPoisonAura}=(function(){'use strict';
  /* Sprite Fusion poison.ts (MIT, Copyright (c) 2026 Hugo Duprez), types stripped */
  function poison(o = {}) {
    const R = new Rng(o.seed ?? 1);
    const groundAt = (x) => (o.ground === undefined ? 600 : typeof o.ground === "number" ? o.ground : o.ground(x));
    const P = o.colors && o.colors.length >= 8 ? o.colors : POISON;
    const c = { o, R, P, ground: groundAt, ps: new Particles(R), bits: new Bits(groundAt), gas: new Gas(), lights: new Lights() };
    const kind = o.kind ?? "cloud";
    const scene = kind === "puddle" ? puddle(c) : kind === "aura" ? aura(c) : cloud(c);
    let t = 0;
    return {
      update(dt) {
        t += dt;
        scene.update(t);
        c.bits.step(dt, (b) => { if (b.kind !== DROP) return; b.life = Math.min(b.life, 0.25); if (b.s > 1 && scene.stain) scene.stain(b.x, b.y, t); });
        c.gas.prune(t);
        c.lights.update(dt);
        c.ps.update(dt);
      },
      draw(f, layer) {
        const buf = new Px(f, f.color), light = new Px(f, f.light);
        if (layer !== "front") scene.back(buf, light, t);
        if (layer !== "back") { scene.front(buf, light, t); drawBits(buf, c); c.ps.draw(buf, light); c.lights.draw(light); }
      },
      stop() { scene.stop?.(t); },
      done: () => scene.over(t) && c.ps.list.length === 0 && c.bits.list.length === 0 && c.gas.list.length === 0,
    };
  }
  const GLASS = 0, DROP = 1, BUBBLE = 2;
  function drawBits(buf, c) {
    const P = c.P;
    for (const b of c.bits.list) {
      const x = b.x / PX, y = b.y / PX, fa = Math.min(1, b.life / 0.3);
      if (b.kind === GLASS) { dot(buf, x, y, b.c, fa); dot(buf, x + Math.cos(b.a), y + Math.sin(b.a), GLASS2, fa); } else if (b.kind === DROP) {
        dot(buf, x, y, P[1], fa);
        if (b.s > 1) dot(buf, x, y - 1, P[3], fa);
      } else if (b.life < 0.06) { for (const [dx, dy] of CROSS2) dot(buf, x + dx, y + dy, P[1]); } else {
        buf.ring(x, y, b.s, 1, P[2]);
        dot(buf, x - 0.6, y - 0.8, PAL.white);
      }
    }
  }
  function cloud(c) {
    const { o, R, P, ps, bits, gas } = c;
    const X = o.x ?? 790, SPREAD = o.size ?? 1, LAND = o.land ?? 0.5, SH = LAND - 0.5, DRY = !!o.gasOnly; /* Embervale: land (SH shifts the SF timeline), gasOnly */
    const G = c.ground(X), vial = flask(P);
    const hand = o.from ? { x: o.from[0], y: o.from[1] + 10 } : o.actor?.hand ? o.actor.hand() : { x: X - 330, y: G - 80 };
    const ox = hand.x, oy = hand.y - 10;
    let smashed = false;
    return {
      update(t) {
        if (t >= LAND && !smashed) {
          smashed = true;
          o.shake?.(0.25);
          c.lights.add(X, G - 10, 120, P[2], 0.8, 0.2);
          for (let i = 0; i < 10; i++) bits.add({ kind: GLASS, x: X, y: G - 4, vx: R.range(-260, 260), vy: -R.range(150, 420), g: 1, drag: 0.4, bounce: 0.35, life: R.range(0.6, 1.1), a: R.range(0, TAU), va: R.range(-20, 20), s: R.range(1.5, 2.5), c: GLASS1 });
          if (!DRY) for (let i = 0; i < 14; i++) bits.add({ kind: DROP, x: X, y: G - 4, vx: R.range(-200, 200), vy: -R.range(100, 360), g: 0.9, life: 1.2, s: R.int(1, 2) });
          for (let i = 0; i < 16; i++) {
            const a = -Math.PI / 2 + R.range(-1.4, 1.4), sp = R.range(60, 220);
            gas.add(t, X + R.range(-10, 10), G - 16, Math.cos(a) * sp * 1.3 * SPREAD, Math.sin(a) * sp * 0.9 - 30, R.range(3, 5), R.range(9, 17), SH + R.range(3.4, 4.1), 0, true);
          }
        }
        if (smashed && t < SH + 2.2 && R.chance(0.28 * (1 - (t - LAND) / 1.7))) gas.add(t, X + R.range(-70, 70) * SPREAD, G - R.range(10, 40), R.range(-50, 50) * SPREAD, R.range(-90, -20), R.range(3, 5), R.range(8, 16), SH + R.range(3.3, 4.1), 0, true);
        if (smashed && t < SH + 3.2 && !DRY) {
          if (R.chance(0.18)) bits.add({ kind: BUBBLE, x: X + R.range(-90, 90) * SPREAD, y: G - R.range(8, 40), vy: -R.range(16, 40), life: R.range(0.5, 1), s: R.chance(0.3) ? 2 : 1.4 });
          if (R.chance(0.08)) bits.add({ kind: DROP, x: X + R.range(-80, 80) * SPREAD, y: G - R.range(20, 40), vy: 20, g: 0.5, life: 1.2, s: 1 });
          if (R.chance(0.2)) ps.spawn(X + R.range(-100, 100) * SPREAD, G - R.range(20, 90), R.range(-12, 12), -R.range(14, 36), R.range(1.2, 2.2), R.chance(0.6) ? P[2] : P[1], R.range(1, 2.2));
        }
      },
      back(buf, light, t) {
        if (!smashed) return;
        const cx = X / PX, cy = G / PX, k = smooth(LAND, LAND + 0.8, t) * (1 - smooth(SH + 3.4, SH + 4.2, t)), w = 52 * SPREAD;
        for (let x = Math.floor(cx - w); x <= cx + w; x++) {
          const d = Math.abs(x - cx) / w, h = hash(x, 41);
          if (h * 0.6 + d < k * 1.1) { dot(buf, x, cy, d < 0.5 ? P[4] : P[5]); if (h < 0.5) dot(buf, x, cy + 1, P[6], k); }
        }
        light.glow(cx, cy - 14, 90 * SPREAD, P[3], 0.3 * gas.density(t, c.ground) * (0.85 + 0.15 * Math.sin(t * 4)));
      },
      front(buf, light, t) {
        if (t < LAND) {
          const k = clamp(t / LAND), x = lerp(ox, X, k), y = lerp(oy, G - 6, k) - Math.sin(Math.PI * k) * 110;
          blitRot(buf, vial, x / PX, y / PX, t * 16);
          light.glow(x / PX, y / PX, 8, P[2], 0.4);
          return;
        }
        gas.draw(buf, light, t, c.ground, P, 1);
      },
      over: (t) => t > SH + 4.3,
    };
  }
  function puddle(c) {
    const { o, R, P, ps, bits, gas } = c;
    const X = o.x ?? 760, S = o.size ?? 1, G = c.ground(X), cx = X / PX, cy = G / PX, W = 44 * S;
    const bubbles = [], pops = [];
    let stopAt = Infinity;
    const width = (t) => W * outCubic(t / 0.6) * (1 - smooth(stopAt, stopAt + 1.4, t));
    const live = (t) => t < stopAt;
    return {
      update(t) {
        if (t < 0.05 && bits.list.length === 0) {
          for (let i = 0; i < 10; i++) bits.add({ kind: DROP, x: X + R.range(-10, 10), y: G - 4, vx: R.range(-180, 180), vy: -R.range(80, 260), g: 0.9, life: 1.2, s: R.int(1, 2) });
          o.shake?.(0.08);
        }
        const w = width(t);
        if (live(t) && t > 0.3 && R.chance(0.09 * S + 0.04)) bubbles.push({ x: cx + R.range(-0.8, 0.8) * w, t0: t, life: R.range(0.45, 1), r: R.range(1.5, 3.4) });
        for (let i = bubbles.length - 1; i >= 0; i--) {
          const b = bubbles[i];
          if (t - b.t0 < b.life) continue;
          bubbles.splice(i, 1);
          if (Math.abs(b.x - cx) > width(t)) continue;
          pops.push({ x: b.x, y: surface(b.x, cx, cy, width(t)), t });
          for (let j = 0; j < 2 + Math.round(b.r); j++) bits.add({ kind: DROP, x: b.x * PX, y: (cy - 2) * PX, vx: R.range(-90, 90), vy: -R.range(90, 200), g: 0.8, life: 0.9, s: 1 });
          gas.add(t, b.x * PX, (cy - 3) * PX, R.range(-15, 15), -R.range(30, 50), b.r * 0.9, b.r * 2.6, t + R.range(1.4, 2), 18);
          if (R.chance(0.5)) ps.spawn(b.x * PX, (cy - 4) * PX, R.range(-10, 10), -R.range(20, 40), R.range(1.2, 2), R.chance(0.6) ? P[2] : P[1], R.range(1, 2));
        }
        for (let i = pops.length - 1; i >= 0; i--) if (t - pops[i].t > 0.1) pops.splice(i, 1);
        if (live(t) && t > 0.2 && R.chance(0.075 * S)) gas.add(t, X + R.range(-0.8, 0.8) * w * PX, G - 4, R.range(-12, 12), -R.range(20, 40), R.range(2, 3), R.range(6, 9), t + R.range(1.6, 2.4), 22);
        if (live(t) && R.chance(0.05)) ps.spawn(X + R.range(-0.8, 0.8) * w * PX, G - R.range(10, 40), R.range(-8, 8), -R.range(14, 30), R.range(1.4, 2.2), R.chance(0.6) ? P[2] : P[1], R.range(1, 2));
      },
      back(buf, light, t) {
        const w = width(t);
        if (w < 1) return;
        const dry = smooth(stopAt, stopAt + 1.4, t);
        for (let x = Math.floor(cx - w * 1.3); x <= cx + w * 1.3; x++) {
          const d = Math.abs(x - cx) / w;
          if (d > 1 && hash(x, 41) < 1.3 - d) dot(buf, x, cy, P[5], 1 - dry * 0.6);
        }
        for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
          const d = Math.abs(x + 0.5 - cx) / w;
          if (d > 1) continue;
          const top = surface(x, cx, cy, w);
          for (let y = top; y <= cy; y++) {
            let col = y === top ? P[2] : y === cy ? P[5] : P[4];
            if (d > 0.9) col = y === top ? P[4] : P[5];
            if (y === top && d < 0.9) {
              const n = noise(x * 0.18 - t * 1.6, 3) + noise(x * 0.07 + t * 0.9, 4) * 0.6;
              if (n > 0.55) col = P[1];
              if (n > 0.95 && hash(x, Math.floor(t * 6)) < 0.3) col = PAL.white;
            } else if (y === top + 1 && d < 0.85 && noise(x * 0.12 + t * 0.7, 5) > 0.3) col = P[3];
            buf.set(x, y, col);
          }
          if (d > 0.97) buf.set(x, top - 1, OUTLINE);
        }
        light.glow(cx, cy - 6, w * 2.4 + 10, P[3], 0.34 * (1 - dry) * (0.85 + 0.15 * Math.sin(t * 3.4)) * smooth(0, 0.4, t));
        light.glow(cx, cy - 2, w * 1.1, P[2], 0.18 * (1 - dry));
      },
      front(buf, light, t) {
        for (const b of bubbles) {
          const k = (t - b.t0) / b.life, r = b.r * (0.3 + 0.7 * outCubic(k * 1.3)), sy = surface(b.x, cx, cy, width(t));
          for (let y = Math.floor(sy - r); y <= sy; y++)
            for (let x = Math.floor(b.x - r - 1); x <= Math.ceil(b.x + r + 1); x++) {
              const dx = x + 0.5 - b.x, dy = y + 0.5 - sy, d = Math.hypot(dx, dy);
              if (d > r + 0.5) continue;
              if (d > r - 0.7) buf.set(x, y, dx < 0 && dy < -r * 0.3 ? P[1] : P[3]);
              else buf.blend(x, y, P[2], 0.3);
            }
          dot(buf, b.x - r * 0.4, sy - r * 0.6, PAL.white);
          light.glow(b.x, sy - r * 0.5, r * 2 + 3, P[2], 0.2);
        }
        for (const p of pops) {
          const k = (t - p.t) / 0.1;
          for (const [dx, dy] of SPRAY) dot(buf, p.x + dx * (2 + 3 * k), p.y + dy * (2 + 3 * k), P[1], 1 - k);
        }
        gas.draw(buf, light, t, c.ground, P, 0.5);
      },
      over: (t) => t > stopAt + 1.5,
      stop(t) { stopAt = Math.min(stopAt, t); },
    };
  }
  function surface(x, cx, cy, w) {
    const d = Math.min(1, Math.abs(x + 0.5 - cx) / Math.max(1, w));
    return cy - Math.round(Math.sqrt(1 - d * d) * Math.min(2.4, 0.9 + w * 0.04));
  }
  function aura(c) {
    const { o, R, P, ps, bits, gas } = c;
    const A = o.actor;
    const stains = [];
    let stopAt = Infinity, sil = null;
    const where = () => {
      const [fx, fy] = A ? A.feet() : [o.x ?? 640, c.ground(o.x ?? 640)];
      const s = A?.silhouette?.();
      if (s && s.w > 0) {
        let x0 = s.w, y0 = s.h, x1 = -1, y1 = -1;
        for (let y = 0; y < s.h; y++)
          for (let x = 0; x < s.w; x++)
            if (s.data[y * s.w + x] >>> 24) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
        sil = { x: s.x, y: s.y, w: s.w, h: s.h, data: s.data, bx0: s.x + x0, by0: s.y + y0, bx1: s.x + x1, by1: s.y + y1 };
      } else sil = null;
      return sil ? { x0: sil.bx0, y0: sil.by0, x1: sil.bx1, y1: sil.by1 } : { x0: fx / PX - 6, y0: fy / PX - 46, x1: fx / PX + 6, y1: fy / PX };
    };
    const on = (box, u0, u1) => {
      for (let k = 0; k < 24; k++) {
        const x = R.range(box.x0, box.x1 + 1), y = lerp(box.y0, box.y1, R.range(u0, u1));
        const s = sil;
        if (!s || s.data[Math.floor(y - s.y) * s.w + Math.floor(x - s.x)] >>> 24) return [x, y];
      }
      return [(box.x0 + box.x1) / 2, lerp(box.y0, box.y1, (u0 + u1) / 2)];
    };
    let box = { x0: 0, y0: 0, x1: 0, y1: 0 };
    const level = (t) => smooth(0, 0.4, t) * (1 - smooth(stopAt, stopAt + 0.7, t));
    return {
      update(t) {
        box = where();
        if (t >= stopAt) return;
        if (R.chance(0.11)) {
          const [x, y] = on(box, 0.35, 0.95);
          bits.add({ kind: DROP, x: x * PX, y: y * PX, vy: R.range(0, 30), vx: R.range(-10, 10), g: 0.7, life: 1.4, s: R.chance(0.5) ? 2 : 1 });
        }
        if (R.chance(0.09)) {
          const [x, y] = on(box, 0.1, 0.8);
          bits.add({ kind: BUBBLE, x: x * PX, y: y * PX, vx: R.range(-14, 14), vy: -R.range(20, 46), life: R.range(0.4, 0.8), s: R.chance(0.3) ? 1.6 : 1.1 });
        }
        if (R.chance(0.1)) {
          const [x, y] = on(box, 0, 0.35);
          gas.add(t, x * PX, y * PX, R.range(-10, 10), -R.range(26, 44), R.range(1.5, 2.5), R.range(4.5, 7), t + R.range(1.2, 1.8), 26);
        }
        if (R.chance(0.06)) ps.spawn((box.x0 + box.x1) * 0.5 * PX + R.range(-20, 20), box.y0 * PX + R.range(0, 40), R.range(-10, 10), -R.range(16, 34), R.range(1.2, 2), R.chance(0.6) ? P[2] : P[1], R.range(0.8, 1.8));
      },
      back(buf, light, t) {
        const k = level(t), fy = c.ground((box.x0 + box.x1) * PX * 0.5) / PX, fx = (box.x0 + box.x1) / 2;
        const w = 6 + 8 * smooth(0, 3, t);
        for (let x = Math.floor(fx - w); x <= fx + w; x++) if (hash(x, 43) < 1.15 - Math.abs(x - fx) / w) dot(buf, x, fy, hash(x, 44) < 0.5 ? P[4] : P[5], 0.85 * Math.max(k, 0.3));
        for (const s of stains) {
          const a = 1 - smooth(s.t + 1.5, s.t + 3, t);
          for (let x = Math.floor(s.x - s.r); x <= s.x + s.r; x++) dot(buf, x, s.y, Math.abs(x - s.x) < s.r * 0.5 ? P[4] : P[5], a);
        }
        light.glow(fx, fy - 2, 18, P[3], 0.2 * k);
      },
      front(buf, light, t) {
        const k = level(t);
        if (k <= 0.01) return;
        const s = sil;
        if (s) {
          const v = ((t * 0.9) % 1.15) / 0.95, H = Math.max(1, s.by1 - s.by0);
          for (let y = s.by0; y <= s.by1; y++) {
            const u = (s.by1 - y) / H, band = Math.exp(-(((u - v) / 0.13) ** 2));
            for (let x = s.bx0; x <= s.bx1; x++) {
              const col = s.data[(y - s.y) * s.w + (x - s.x)];
              if (!(col >>> 24)) continue;
              buf.blend(x, y, band > 0.5 ? P[1] : P[2], k * (0.12 + 0.42 * band));
            }
          }
        }
        gas.draw(buf, light, t, c.ground, P, 0.55);
        const cxb = (box.x0 + box.x1) / 2, cyb = (box.y0 + box.y1) / 2;
        light.glow(cxb, cyb, (box.y1 - box.y0) * 0.9 + 8, P[3], 0.28 * k * (0.8 + 0.2 * Math.sin(t * 7)));
      },
      over: (t) => t > stopAt + 0.8,
      stop(t) { stopAt = Math.min(stopAt, t); },
      stain(x, y, t) { stains.push({ x: x / PX, y: Math.round(y / PX), t, r: R.range(1.2, 2.6) }); if (stains.length > 40) stains.shift(); },
    };
  }
  function flask(P) {
    return sprite(["..ccc..", ".occo..", "..ogo..", ".ogvgo.", "ogvvvdo", "ogvvvdo", ".odddo.", "..ooo.."], { o: OUTLINE, g: GLASS1, c: hex("#9b6a45"), v: P[2], d: P[4] });
  }
  class Gas {
    list = [];
    n = 0;
    add(t, x, y, vx, vy, r0, r1, end, rise = 0, hug = false) {
      this.list.push({ x, y, vx, vy, r0, r1, t0: t, end, seed: (this.n++ * 37.7) % 100, rise, hug });
    }
    prune(t) { for (let i = this.list.length - 1; i >= 0; i--) if (t > this.list[i].end) this.list.splice(i, 1); }
    at(p, t, ground) {
      const age = t - p.t0, e = 1 - Math.exp(-age * 2.2);
      const x = p.x + (p.vx / 2.2) * e + noise(t * 0.7 + p.seed, 1) * 6 * Math.min(1, age);
      let y = p.y + (p.vy / 2.2) * e - p.rise * age + noise(t * 0.6 + p.seed, 2) * 4 * Math.min(1, age);
      const r = p.r0 + (p.r1 - p.r0) * outCubic(age / 1.4);
      if (p.hug) y = Math.min(y, ground(x) - r * PX * 0.7);
      const a = smooth(0, 0.15, age) * (1 - smooth(p.end - (p.hug ? 0.9 : (p.end - p.t0) * 0.6), p.end, t));
      return { x: x / PX, y: y / PX, r, a, age: clamp(age / (p.hug ? 2.6 : p.end - p.t0)) };
    }
    density(t, ground) {
      let s = 0;
      for (const p of this.list) s += this.at(p, t, ground).a;
      return s / Math.max(1, this.list.length);
    }
    draw(buf, light, t, ground, P, opacity) {
      for (let i = 0; i < this.list.length; i++) {
        const { x, y, r, a: a0, age } = this.at(this.list[i], t, ground), a = a0 * opacity;
        if (a < 0.02) continue;
        const c = mix(hash(i, 70) < 0.5 ? P[4] : mix(P[4], P[3], 0.4), P[6], age * 0.85);
        buf.alphaDisc(x, y, r * 1.08, c, a * 0.4);
        buf.alphaDisc(x + r * 0.05, y + r * 0.08, r * 0.76, c, a * 0.55);
        buf.alphaDisc(x - r * 0.22, y - r * 0.3, r * 0.48, mix(c, P[1], 0.22), a * 0.38 * (1 - age * 0.6));
        if (r > 9) light.glow(x, y, r * 1.5, P[3], 0.06 * a);
      }
    }
  }
  const PX = 2;
  class Px {
    constructor(f, data) { this.w = f.w; this.h = f.h; this.ox = f.ox; this.oy = f.oy; this.data = data; }
    at(x, y) { x = (x - this.ox) | 0; y = (y - this.oy) | 0; return x < 0 || y < 0 || x >= this.w || y >= this.h ? -1 : y * this.w + x; }
    set(x, y, c) { const i = this.at(x, y); if (i >= 0) this.data[i] = c; }
    blend(x, y, c, a) {
      const i = this.at(x, y);
      if (i < 0) return;
      const d = this.data[i], oa = a + ((d >>> 24) / 255) * (1 - a);
      if (oa <= 0) return;
      const k = a / oa, j = 1 - k, r = (c & 255) * k + (d & 255) * j, g = ((c >>> 8) & 255) * k + ((d >>> 8) & 255) * j, b = ((c >>> 16) & 255) * k + ((d >>> 16) & 255) * j;
      this.data[i] = ((oa * 255) << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255);
    }
    add(x, y, c, k) {
      const i = this.at(x, y);
      if (i < 0) return;
      const d = this.data[i], r = Math.min(255, (d & 255) + (c & 255) * k), g = Math.min(255, ((d >>> 8) & 255) + ((c >>> 8) & 255) * k), b = Math.min(255, ((d >>> 16) & 255) + ((c >>> 16) & 255) * k);
      this.data[i] = (255 << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255);
    }
    alphaDisc(cx, cy, r, c, a) {
      if (a <= 0.01) return;
      const r2 = r * r;
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
        const dy = y + 0.5 - cy;
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = x + 0.5 - cx; if (dx * dx + dy * dy <= r2) this.blend(x, y, c, a); }
      }
    }
    ring(cx, cy, r, thick, c, alpha = 1) {
      const ro = r + thick * 0.5, ri = Math.max(0, r - thick * 0.5), ro2 = ro * ro, ri2 = ri * ri;
      for (let y = Math.floor(cy - ro); y <= Math.ceil(cy + ro); y++) {
        const dy = y + 0.5 - cy;
        for (let x = Math.floor(cx - ro); x <= Math.ceil(cx + ro); x++) {
          const dx = x + 0.5 - cx, d2 = dx * dx + dy * dy;
          if (d2 <= ro2 && d2 >= ri2 && (alpha >= 1 || alpha > bayer(x, y))) this.set(x, y, c);
        }
      }
    }
    glow(cx, cy, r, c, k) {
      if (r < 1 || k <= 0.01) return;
      const x0 = Math.max(this.ox, Math.floor(cx - r)), x1 = Math.min(this.ox + this.w - 1, Math.ceil(cx + r));
      const y0 = Math.max(this.oy, Math.floor(cy - r)), y1 = Math.min(this.oy + this.h - 1, Math.ceil(cy + r));
      for (let y = y0; y <= y1; y++) {
        const dy = (y + 0.5 - cy) / r;
        for (let x = x0; x <= x1; x++) {
          const dx = (x + 0.5 - cx) / r, d = dx * dx + dy * dy;
          if (d >= 1) continue;
          const f = 1 - Math.sqrt(d);
          this.add(x, y, c, f * f * k);
        }
      }
    }
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function bayer(x, y) { return (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16; }
  function dot(buf, x, y, c, a = 1) {
    const px = Math.floor(x), py = Math.floor(y);
    if (a >= 1 || a > bayer(px, py)) buf.set(px, py, c);
  }
  function sprite(rows, pal) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length)), data = new Uint32Array(w * h);
    rows.forEach((r, y) => [...r].forEach((ch, x) => ch !== "." && ch !== " " && (data[y * w + x] = pal[ch] ?? 0)));
    return { w, h, data };
  }
  function blitRot(buf, s, cx, cy, ang) {
    const c = Math.cos(ang), sn = Math.sin(ang), r = Math.ceil(Math.hypot(s.w, s.h) / 2) + 1, px0 = Math.round(cx), py0 = Math.round(cy);
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++) {
        const iu = Math.floor(c * x + sn * y + s.w / 2), iv = Math.floor(-sn * x + c * y + s.h / 2);
        if (iu < 0 || iv < 0 || iu >= s.w || iv >= s.h) continue;
        const col = s.data[iv * s.w + iu];
        if (col >>> 24) buf.set(px0 + x, py0 + y, col);
      }
  }
  function rgb(r, g, b, a = 255) { return ((a & 255) << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255); }
  function hex(h) { const v = parseInt(h.replace("#", ""), 16); return rgb((v >> 16) & 255, (v >> 8) & 255, v & 255); }
  function mix(c1, c2, t) {
    const u = 1 - t, ch = (c, s) => (c >>> s) & 255;
    return rgb(ch(c1, 0) * u + ch(c2, 0) * t, ch(c1, 8) * u + ch(c2, 8) * t, ch(c1, 16) * u + ch(c2, 16) * t, ch(c1, 24) * u + ch(c2, 24) * t);
  }
  const PAL = { white: hex("#ffffff") };
  const OUTLINE = hex("#1a1422"), GLASS1 = hex("#d8f6ff"), GLASS2 = hex("#62c8f4"), CROSS2 = [[2, 0], [-2, 0], [0, 2], [0, -2]], SPRAY = [[1, 0], [-1, 0], [0.6, -0.7], [-0.6, -0.7], [0, -1]];
  const POISON = ["#f6ffc2", "#cfff63", "#8eea3f", "#55b92f", "#318232", "#23552e", "#173320", "#0e1d14"].map(hex);
  class Rng {
    constructor(seed = 1) { this.s = seed >>> 0 || 1; }
    next() {
      let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(a, b) { return a + (b - a) * this.next(); }
    int(a, b) { return Math.floor(this.range(a, b + 1)); }
    chance(p) { return this.next() < p; }
  }
  const TAU = Math.PI * 2;
  function clamp(v, a = 0, b = 1) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) { if (x <= a) return 0; if (x >= b) return 1; const t = (x - a) / (b - a); return t * t * (3 - 2 * t); }
  function outCubic(t) { return 1 - Math.pow(1 - clamp(t), 3); }
  function hash(n, k = 0) { return ((Math.imul(n + 1 + k * 7919, 2654435761) >>> 0) % 100000) / 100000; }
  function noise(x, seed = 0) {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(hash(i, seed) * 2 - 1, hash(i + 1, seed) * 2 - 1, u);
  }
  class Particles {
    list = [];
    t = 0;
    constructor(R) { this.R = R; }
    spawn(x, y, vx, vy, life, col, size) { this.list.push({ x, y, vx, vy, life, max: life, col, size, seed: this.R.next() * 100 }); }
    update(dt) {
      this.t += dt;
      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i];
        if ((p.life -= dt) <= 0) { this.list.splice(i, 1); continue; }
        p.vx -= p.vx * 0.8 * dt;
        p.vy -= p.vy * 0.8 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }
    draw(buf, light) {
      for (const p of this.list) {
        const k = p.life / p.max, ax = p.x / PX, ay = p.y / PX;
        const br = 0.7 + 0.3 * Math.sin(this.t * (2 + (p.seed % 3)) + p.seed), a = Math.min(1, (1 - k) * 5) * Math.min(1, k * 3) * br;
        if (a < 0.05) continue;
        buf.alphaDisc(ax, ay, p.size, p.col, 0.45 * a);
        buf.alphaDisc(ax, ay, p.size * 0.5, PAL.white, 0.5 * a);
        light.glow(ax, ay, 3 + p.size * 3, p.col, 0.35 * a);
      }
    }
  }
  class Lights {
    list = [];
    add(x, y, r, color, k, life) { this.list.push({ x, y, r, color, k, life, max: life }); }
    update(dt) { for (let i = this.list.length - 1; i >= 0; i--) if ((this.list[i].life -= dt) <= 0) this.list.splice(i, 1); }
    draw(light) { for (const l of this.list) { const k = l.life / l.max; light.glow(l.x / PX, l.y / PX, (l.r / PX) * (0.55 + 0.45 * k), l.color, l.k * k * k); } }
  }
  class Bits {
    list = [];
    constructor(ground) { this.ground = ground; }
    add(b) { const life = b.life ?? 1; this.list.push({ vx: 0, vy: 0, a: 0, va: 0, s: 1, c: 0, kind: 0, g: 0, drag: 0, bounce: 0, rest: false, ...b, life, max: life }); }
    step(dt, onLand) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const b = this.list[i];
        if ((b.life -= dt) <= 0) { this.list.splice(i, 1); continue; }
        if (b.rest) continue;
        b.vy += 1900 * b.g * dt;
        b.vx -= b.vx * b.drag * dt;
        b.vy -= b.vy * b.drag * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.a += b.va * dt;
        const floor = this.ground(b.x);
        if (b.g > 0 && b.y >= floor && b.vy > 0) {
          const sp = b.vy;
          b.y = floor - 0.01;
          onLand?.(b, sp);
          if (b.bounce > 0 && sp > 140) { b.vy = -sp * b.bounce; b.vx *= 0.7; b.va *= 0.6; } else { b.rest = true; b.vx = b.vy = 0; }
        }
      }
    }
  }

  /* ---------- Embervale wrappers ---------- */
  let seed = 1;
  const lite = () => !!PERF.lite, alive = H => !!H && !H.dead, VENOM = "#9aff6a";
  const hookShake = m => tr => PXK.shake(tr * m);
  const SMOKE = ["#f2eef8", "#d6cce4", "#b2a6c4", "#8a7a9a", "#685a7a", "#4a3e5a", "#2e2638", "#16121c"].map(hex);
  /* a gas cloud on the ground point (x, y), game radius r; o.smoke: smoke greys, gas only; o.land: the flask's flight time */
  function pxPoisonCloud(x, y, r = 150, o = {}) {
    const S = clamp(r / 140, 0.6, 1.3), w = Math.min(256, Math.ceil(S * 96 + 24) * 2), hh = lite() ? 100 : 124;
    return pxfx(c => poison({ kind: "cloud", x: c.x, ground: c.y, from: o.from ? [c.x + o.from[0], c.y + o.from[1]] : [c.x - 20, c.y - 30], land: o.land ?? 0.05, size: S,
        colors: o.smoke ? SMOKE : o.colors, gasOnly: !!o.smoke, seed: seed++, shake: hookShake(0.5) }),
      { x, y: y + 2, w, hh, ay: hh - 12, pri: 1, ttl: 7, amb: o.smoke ? 0.75 : 0.3, nolight: !!o.smoke && lite() });
  }
  /* a toxic puddle (a loop: pxStop it) on (x, y), game radius r */
  function pxPoisonPuddle(x, y, r = 70, o = {}) {
    const S = clamp(r / 110, 0.3, 1.2), hw = Math.ceil(44 * S * 1.3) + 14, hh = o.hh ?? 72;
    return pxfx(c => poison({ kind: "puddle", x: c.x, ground: c.y, size: S, colors: o.colors, seed: seed++, shake: o.quiet ? undefined : hookShake(0.3) }),
      { x, y: y + 2, w: hw * 2, hh, ay: hh - 8, pri: o.pri ?? 1, ttl: o.ttl ?? 30, amb: 0.25, nolight: lite() && (o.pri ?? 1) === 0 });
  }
  /* Poisoned: an entity (enemy or the hero) wrapped in SF's aura until pxStop */
  function pxPoisonAura(e) {
    if (!e) return null;
    const big = !!e.boss || (e.s || 1) > 1.3, w = big ? 168 : 96, hh = big ? 168 : 96;
    return pxfx(c => poison({ kind: "aura", actor: c.actor, ground: c.y, seed: seed++ }), { follow: e, x: e.x, y: e.y, w, hh, ay: hh - 10, split: true, pri: e === P ? 2 : 1, ttl: Infinity });
  }

  /* ---------- wiring ---------- */
  const AUR = new Map(), GFX = new Map(), LATE = [], BOG = [];
  let heroT = 0, bogT = 0, scanT = 0;
  const venomous = e => { if (!e.dots || !e.dots.length) return false; for (const d of e.dots) if (d.c === VENOM && d.t > 0) return true; return false; };
  const want = [];
  function auras(dt) {
    want.length = 0;
    if (P && !P.dead && heroT > 0) want.push(P);
    const cap = lite() ? 4 : 8, cand = [];
    for (const e of enemies) if (!e.dead && !e.hidden && !e.node && venomous(e)) { const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < 900) cand.push([d, e]); }
    cand.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < cand.length && i < cap; i++) want.push(cand[i][1]);
    for (const [e, H] of AUR) if (!alive(H)) AUR.delete(e); else if (!want.includes(e)) { pxStop(H); AUR.delete(e); }
    for (const e of want) if (!AUR.has(e)) { const H = pxPoisonAura(e); if (H) AUR.set(e, H); }
  }
  /* ground effects: Plague Breath fields (venom2) last their dur; spider / Brood venom pools (venom) splash where they land; Smoke Bomb */
  function grounds() {
    for (const g of gfx) {
      if (GFX.has(g)) continue;
      if (g.kind === "venom2") GFX.set(g, pxPoisonPuddle(g.x, g.y, g.r || 70, { quiet: true }));
      else if (g.kind === "venom") GFX.set(g, null);
      else if (g.kind === "smoke") { GFX.set(g, null); pxPoisonCloud(g.x, g.y, g.r || 150, { smoke: true }); }
    }
    for (const [g, H] of GFX) {
      if (g.kind === "venom2") { if (g.dead || !(g.t < g.dur - 1.4) || !gfx.includes(g)) { pxStop(H); GFX.delete(g); } continue; }
      if (g.kind === "venom" && g.dead) { if (g.t >= g.delay) { const L = pxPoisonPuddle(g.x, g.y, g.r || 88); if (L) LATE.push([L, 2.6]); } GFX.delete(g); continue; }
      if (!gfx.includes(g)) GFX.delete(g);
    }
  }
  /* the Mirefen bog: a few bubbling puddles round the hero (ambient) */
  function bog(dt) {
    for (let i = BOG.length - 1; i >= 0; i--) { const H = BOG[i]; if (!alive(H)) { BOG.splice(i, 1); continue; } if (!H.stopped && (Math.hypot(H.x - P.x, H.y - P.y) > 560 || ZONES[curZone].id !== "g3fen")) pxStop(H); }
    if (ZONES[curZone].id !== "g3fen" || (bogT -= dt) > 0) return;
    bogT = 1.2;
    let n = 0;
    for (const H of BOG) if (!H.stopped) n++;
    if (n >= (lite() ? 2 : 3)) return;
    for (let k = 0; k < 6; k++) {
      const a = Math.random() * TAU, d = 150 + Math.random() * 230, x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d * 0.7;
      if (isSolid(Math.floor(x / T), Math.floor(y / T))) continue;
      let near = false;
      for (const H of BOG) if (Math.hypot(H.x - x, H.y - y) < 150) near = true;
      if (near) continue;
      const H = pxPoisonPuddle(x, y, 44 + Math.random() * 40, { pri: 0, quiet: true, ttl: 120 });
      if (H) BOG.push(H);
      return;
    }
  }
  onEv("update", dt => {
    if (!P) return;
    try {
      if (heroT > 0) heroT -= dt;
      for (let i = LATE.length - 1; i >= 0; i--) if ((LATE[i][1] -= dt) <= 0) { pxStop(LATE[i][0]); LATE.splice(i, 1); }
      grounds();
      if ((scanT -= dt) <= 0) { scanT = 0.1; auras(dt); bog(0.1); }
    } catch (err) { console.error(err); }
  });
  /* the hero poisoned: a venom pool (spider spit, the Brood's rain) landing on it */
  onEv("pxPHurt", (dmg, src) => { if (src && src.kind === "venom") { heroT = Math.max(heroT, 2.6); scanT = 0; } });
  onEv("pxClear", () => { AUR.clear(); GFX.clear(); LATE.length = 0; BOG.length = 0; heroT = 0; bogT = 0; });

  /* ---------- lab ---------- */
  const foe = (type, x, y) => { const e = mkEnemy(type, x, y, Math.max(1, P.lvl - 2), null); e.state = "idle"; e.spawn = null; enemies.push(e); return e; };
  pxlab("poison-aura", "Poisoned (wolf, venom DoT)", "Poison", "sf", (x, y) => { const e = foe("wolf", x + 30, y); e.stun = 3; addDot(e, 1, 4, VENOM); });
  pxlab("poison-hero", "Poisoned (hero)", "Poison", "sf", () => { heroT = 3; scanT = 0; });
  pxlab("poison-cloud", "Gas cloud (flask)", "Poison", "sf", (x, y) => pxPoisonCloud(x + 40, y, 140, { land: 0.5, from: [-110, -60] }));
  pxlab("poison-smoke", "Smoke Bomb cloud (game)", "Poison", "sf", (x, y) => ground({ x: x + 20, y, r: 150, dur: 3, tick: 0.5, team: "p", dmg: 0, c: "#8a7a9a", kind: "smoke" }));
  pxlab("poison-puddle", "Toxic puddle", "Poison", "sf", (x, y) => { const H = pxPoisonPuddle(x + 30, y, 88); if (H) LATE.push([H, 3]); });
  pxlab("poison-pool", "Venom pool (spider, game)", "Poison", "sf", (x, y) => ground({ x: x + 30, y, r: 88, delay: 0.4, dmg: 0, c: "#9ae04a", kind: "venom" }));
  pxlab("poison-venom2", "Plague Breath field (game)", "Poison", "sf", (x, y) => ground({ x: x + 30, y, r: 70, dur: 3, tick: 0.5, team: "p", dmg: 0, c: "#7aff5a", kind: "venom2" }));
  pxlab("poison-bog", "Bog puddles (ambient)", "Poison", "sf", (x, y) => { for (let k = 0; k < 2; k++) { const H = pxPoisonPuddle(x - 30 + k * 90, y + k * 30, 50 + k * 20, { pri: 0, quiet: true }); if (H) LATE.push([H, 3]); } });
  return { pxPoisonCloud, pxPoisonPuddle, pxPoisonAura };})();
