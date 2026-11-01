#!/usr/bin/env node
/* Reference renders straight from Sprite Fusion's own effect source (the TypeScript file get_vfx returns), for comparing a port.
   node sfref.mjs <effect.ts> --out <dir> [--opts '{"x":320,"y":300}'] [--frames 0,2,4,8,14,22,34,50] [--w 320 --h 200] [--scale 3]
                  [--layers split|one] [--bg #1d1b26] [--id name]
   The file is transpiled with esbuild and its default export is called with the options (plus seed 1 and no-op hooks). It runs at
   exactly 1/60 s per update on a w x h art-pixel frame (world units = 2 per art px, Sprite Fusion's convention), drawing "back" then
   "front" (or one call), compositing colour over the background and adding light, as Sprite Fusion's previews do. Writes
   <id>_fNN.png per frame and <id>_sheet.png with frame numbers and times, at --scale x nearest. Prints a JSON summary. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const D = path.dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args[i + 1]; };
const src = args[0], out = arg('--out', path.join(D, 'runs', 'sfref')), W = +arg('--w', 320), H = +arg('--h', 200), S = +arg('--scale', 3);
const frames = arg('--frames', '0,2,4,8,14,22,34,50').split(',').map(Number), opts = JSON.parse(arg('--opts', '{}')), id = arg('--id', path.basename(src).replace(/\.\w+$/, ''));
const bg = parseInt(arg('--bg', '#1d1b26').slice(1), 16), split = arg('--layers', 'split') === 'split';
fs.mkdirSync(out, { recursive: true });
const js = path.join(out, id + '.mjs');
execFileSync(path.join(D, 'node_modules', '.bin', 'esbuild'), [src, '--format=esm', '--platform=neutral', '--target=es2022', '--log-level=warning', '--outfile=' + js]);
const mod = await import(pathToFileURL(js).href + '?t=' + process.hrtime.bigint());
const make = mod.default;
if (typeof make !== 'function') throw new Error('no default export function in ' + src);
const fx = make(Object.assign({ x: W, y: H * 1.5, seed: 1, shake() {}, flash() {} }, opts));
const frame = { w: W, h: H, ox: 0, oy: 0, color: new Uint32Array(W * H), light: new Uint32Array(W * H) };
const shots = [];
let f = 0;
const step = () => { fx.update(1 / 60); f++; };
const grab = () => {
  frame.color.fill(0); frame.light.fill(0);
  if (split) { fx.draw(frame, 'back'); fx.draw(frame, 'front'); } else fx.draw(frame);
  const rgb = Buffer.alloc(W * H * 3), br = (bg >> 16) & 255, bgg = (bg >> 8) & 255, bb = bg & 255;
  for (let i = 0; i < W * H; i++) {
    const c = frame.color[i], a = (c >>> 24) / 255, l = frame.light[i];
    let r = br * (1 - a) + (c & 255) * a, g = bgg * (1 - a) + ((c >>> 8) & 255) * a, b = bb * (1 - a) + ((c >>> 16) & 255) * a;
    r = Math.min(255, r + (l & 255)); g = Math.min(255, g + ((l >>> 8) & 255)); b = Math.min(255, b + ((l >>> 16) & 255));
    rgb[i * 3] = r; rgb[i * 3 + 1] = g; rgb[i * 3 + 2] = b;
  }
  return rgb;
};
for (const fr of frames) {
  if (fr === 0 && f === 0) { shots.push([fr, grab()]); continue; }
  while (f < fr) step();
  shots.push([fr, grab()]);
}
const raw = path.join(out, id + '.raw');
fs.writeFileSync(raw, Buffer.concat(shots.map(s => s[1])));
execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
W,H,S=${W},${H},${S};fr=${JSON.stringify(frames)};data=open(${JSON.stringify(raw)},'rb').read();n=len(fr);out=${JSON.stringify(out)};id=${JSON.stringify(id)}
ims=[]
for k in range(n):
  im=Image.frombytes('RGB',(W,H),data[k*W*H*3:(k+1)*W*H*3]).resize((W*S,H*S),Image.NEAREST);im.save(f'{out}/{id}_f{fr[k]:02d}.png');ims.append(im)
cols=n if n<=4 else (n+1)//2;rows=(n+cols-1)//cols
sh=Image.new('RGB',(cols*W*S+(cols-1)*4,rows*(H*S+18)+(rows-1)*4),(17,17,17));d=ImageDraw.Draw(sh)
for k,im in enumerate(ims):
  x=(k%cols)*(W*S+4);y=(k//cols)*(H*S+22);sh.paste(im,(x,y+18));d.text((x+4,y+3),f'f{fr[k]}  t={fr[k]/60:.3f}s',fill=(255,210,122))
sh.save(f'{out}/{id}_sheet.png')
`]);
fs.rmSync(raw);
console.log(JSON.stringify({ id, frames, sheet: path.join(out, id + '_sheet.png'), done: typeof fx.done === 'function' ? fx.done() : null }));
