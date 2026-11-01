#!/usr/bin/env node
/* Assemble Embervale with the pixel VFX modules.
   node assemble.cjs [--out <file.html>] [--ship | --fx a,b,c | --all] [--test] [--base <game.html>]
   --ship builds the modules listed in modules.txt (what ships in index.html); --all every file in fx/ (work in progress included)
   - base: the game without the VFX blocks. Default: ../../index.html with its M7-PXFX / PXFX EFFECT blocks and the two hook calls
     stripped out, so edits made anywhere else in index.html are kept by every rebuild. --out defaults to ../../index.html.
   - core.js goes in a new HD MODULE M7-PXFX block right after the M6 block; each fx/<name>.js gets its own PXFX EFFECT block
   - two one-line hooks are added to the scaffold: pxfx_draw() after the air layers in renderGL, pxfx_lights(L) in buildLights
   - --test also exposes a debug handle window.__T inside the game's closure (test builds only) */
const fs=require('fs'),path=require('path');
const D=__dirname,args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf(k);return i<0?d:args[i+1];},has=k=>args.includes(k);
const GAME=path.join(D,'..','..','index.html');
/* the game without this module's blocks and hook calls (inverse of what this script inserts) */
function strip(src){src=src.replace('drawLayer(LAY.airA,P0);pxfx_draw();','drawLayer(LAY.airA,P0);').replace('pxfx_lights(L);L.sort((a,b)=>b.pri-a.pri);','L.sort((a,b)=>b.pri-a.pri);');
  const a=src.indexOf('/* ===== HD MODULE M7-PXFX');if(a<0)return src;
  let e=src.lastIndexOf('/* ===== /PXFX EFFECT ');if(e<0)e=src.indexOf('/* ===== /HD MODULE M7-PXFX ===== */');
  e=src.indexOf('\n',e)+1;return src.slice(0,a)+src.slice(e);}
const base=strip(fs.readFileSync(arg('--base',GAME),'utf8'));
const out=arg('--out',GAME);
let names=[];
if(has('--all'))names=fs.readdirSync(path.join(D,'fx')).filter(f=>f.endsWith('.js')).map(f=>f.slice(0,-3)).sort();
else if(arg('--fx'))names=arg('--fx').split(',').map(s=>s.trim()).filter(Boolean);
else if(has('--ship'))names=fs.readFileSync(path.join(D,'modules.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'));
function once(src,needle,repl){const i=src.indexOf(needle);if(i<0||src.indexOf(needle,i+1)>=0)throw new Error('anchor not unique: '+needle);return src.slice(0,i)+repl+src.slice(i+needle.length);}
let s=base;
s=once(s,'drawLayer(LAY.airA,P0);','drawLayer(LAY.airA,P0);pxfx_draw();');
s=once(s,'L.sort((a,b)=>b.pri-a.pri);','pxfx_lights(L);L.sort((a,b)=>b.pri-a.pri);');
const core=fs.readFileSync(path.join(D,'core.js'),'utf8').trim();
/* pixelfx (github.com/patch-gg/pixelfx): modules declare the effects they play with a comment "@pixelfx cat/name cat/name ..." and
   exactly those are bundled (esbuild, IIFE, identifiers kept) into  var PXLIB = {createFx, fx:{'cat/name': module}}  at the top of the core block */
const PFX=process.env.PIXELFX||path.join(D,'node_modules','pixelfx');
function pixelfxBundle(mods){const ids=new Set();
  for(const n of mods){const src=fs.readFileSync(path.join(D,'fx',n+'.js'),'utf8');for(const m of src.matchAll(/@pixelfx\s+([^*@]*)/g))for(const id of m[1].split(/[\s,]+/))if(/^[a-z-]+\/[a-z0-9-]+$/.test(id))ids.add(id);}
  if(!ids.size)return '';
  const list=[...ids].sort();for(const id of list)if(!fs.existsSync(path.join(PFX,'src/fx',id+'.js')))throw new Error('unknown pixelfx effect '+id+' (see '+PFX+'/docs/CATALOG.md)');
  const tmp=fs.mkdtempSync(path.join(require('os').tmpdir(),'pxlib-')),entry=path.join(tmp,'entry.js'),outf=path.join(tmp,'out.js');
  fs.writeFileSync(entry,`export { createFx } from ${JSON.stringify(PFX+'/src/core/fx.js')};\n`+list.map((id,i)=>`import * as m${i} from ${JSON.stringify(PFX+'/src/fx/'+id+'.js')};`).join('\n')+`\nexport const fx = {${list.map((id,i)=>JSON.stringify(id)+':m'+i).join(',')}};\n`);
  require('child_process').execFileSync(path.join(D,'node_modules','.bin','esbuild'),[entry,'--bundle','--format=iife','--global-name=PXLIB','--target=es2020','--legal-comments=none','--minify-whitespace','--minify-syntax','--log-level=warning','--outfile='+outf],{stdio:'inherit'});
  const code=fs.readFileSync(outf,'utf8').trim();fs.rmSync(tmp,{recursive:true,force:true});
  return `/* pixelfx 0.3 (https://github.com/patch-gg/pixelfx), bundled effects: ${list.join(' ')}.
   MIT License, Copyright (c) 2026 Patch, Copyright (c) 2026 Hugo Duprez (effects adapting Sprite Fusion's open-source pixel art VFX);
   its src/core/act.js adapts Hollow Crown (https://github.com/rehan-remade/hollow-crown), MIT License, Copyright (c) 2026 rehan-remade.
   Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
   (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge,
   publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
   subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or
   substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
   BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
   ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. */
${code}
`;}
const pxlib=pixelfxBundle(names);
let blk='/* ===== HD MODULE M7-PXFX (owner M7 PIXEL VFX). Put ALL new code of this module between these two marker lines; never edit the markers. ===== */\n'+core+'\n'+pxlib+'/* ===== /HD MODULE M7-PXFX ===== */\n';
for(const n of names){const f=path.join(D,'fx',n+'.js');if(!fs.existsSync(f)){console.error('missing fx module '+f);process.exit(2);}
  const src=fs.readFileSync(f,'utf8').trim();
  if(/\/\* ===== /.test(src))throw new Error(n+': module text must not contain marker lines');
  blk+=`/* ===== PXFX EFFECT ${n} ===== */\n${src}\n/* ===== /PXFX EFFECT ${n} ===== */\n`;}
/* top-level names must not collide (a redeclared const breaks the whole game): check every module against the base, core and each other */
{const tops=src=>{const n=[];for(const m of src.matchAll(/^(?:const|let|var)\s*\{([^}]*)\}\s*=/gm))n.push(...m[1].split(',').map(x=>x.split(':').pop().trim()).filter(Boolean));
   for(const m of src.matchAll(/^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm))n.push(m[1]);
   for(const m of src.matchAll(/^(?:const|let)\s+[A-Za-z_$][\w$]*\s*=[^;\n]*?,\s*([A-Za-z_$][\w$]*)\s*=/gm))n.push(m[1]);return n;};
 const seen=new Map();const own=(who,src)=>{for(const n of tops(src)){if(seen.has(n)&&seen.get(n)!==who)throw new Error(`top-level name "${n}" in ${who} already declared by ${seen.get(n)}`);seen.set(n,who);}};
 const baseNames=new Set();for(const m of base.matchAll(/(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g))baseNames.add(m[1]);
 own('core',core);for(const n of names){const src=fs.readFileSync(path.join(D,'fx',n+'.js'),'utf8');for(const t of tops(src))if(baseNames.has(t))throw new Error(`top-level name "${t}" in fx/${n}.js shadows/collides with a name in the game`);own('fx/'+n,src);}}
const M6='/* ===== /HD MODULE M6-CAMHUD ===== */\n';
s=once(s,M6,M6+blk);
if(has('--test')){const end='\n})();\n</script>';const i=s.lastIndexOf(end);if(i<0)throw new Error('closure end not found');
  s=s.slice(0,i)+"\nwindow.__T={get P(){return P},get state(){return state},get enemies(){return enemies},PXFX,PXLAB,pxLabPlay,startGame,toScreen:(x,h,y)=>toScreen(x,h,y,glc.width,glc.height),glc,ev:(src)=>eval(src)};"+s.slice(i);}
fs.writeFileSync(out,s);
console.log(`assembled ${out} (${(s.length/1024).toFixed(0)} KB) with core + ${names.length} effect module(s): ${names.join(', ')||'-'}${pxlib?` + pixelfx bundle ${(pxlib.length/1024).toFixed(0)} KB`:''}`);
