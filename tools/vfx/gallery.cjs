#!/usr/bin/env node
/* Record every lab effect inside the game as an animated WebP (via Pillow) for the preview page.
   node gallery.cjs --out <dir> [--fx a,b | --all] [--ids a,b] [--every 2] [--max 72] [--crop 360x240] [--scale 2]
   Each effect is fired next to the hero in a calm spot, then the GL canvas is cropped every --every frames until the
   effect's handles are gone (or --max captures). Zone-bound effects (weather, snow...) are filmed in a zone that has them
   when their lab entry id says so: ids containing rain/fog/storm -> woods, snow -> snowfield, firefl -> woods, ember -> crater. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const D=__dirname,args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf(k);return i<0?d:args[i+1];};
const out=arg('--out');fs.mkdirSync(path.join(out,'frames'),{recursive:true});const html=path.join(out,'test.html');
execFileSync('node',[path.join(D,'assemble.cjs'),'--out',html,'--test',...(arg('--fx')?['--fx',arg('--fx')]:['--all'])],{stdio:'inherit'});
const every=+arg('--every',2),max=+arg('--max',72),[cw,ch]=arg('--crop','360x240').split('x').map(Number),sc=+arg('--scale',2);
(async()=>{
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const pg=await b.newPage({viewport:{width:800,height:450}});const errs=[];
  pg.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|fonts\.g/.test(m.text()))errs.push(m.text().slice(0,300));});pg.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
  await pg.route('**/fonts.g*/**',r=>r.abort());
  await pg.addInitScript(()=>{const q=[];window.requestAnimationFrame=cb=>{q.push(cb);return q.length;};let T=1000;window.__step=(n,dt)=>{dt=dt||1000/60;for(let i=0;i<n;i++){T+=dt;const a=q.splice(0);for(const cb of a)cb(T);}};try{localStorage.setItem('embervale-q','2');}catch(e){}});
  await pg.goto('file://'+path.resolve(html));
  await pg.waitForFunction(()=>window.__T&&!document.querySelector('#bNew').disabled,null,{timeout:180000,polling:200});
  await pg.evaluate(o=>__T.startGame(o.cls,o),{cls:'blademaster',lvl:25,rg:0,q:{i:3,p:0,stage:'active'},ash:false,pot:3});
  const E=src=>pg.evaluate(s=>__T.ev(s),src);
  await E(`g5_skip=()=>false;showDialog=(d,next)=>{try{next&&next();}catch(e){}};cine=null;Object.defineProperty($('#daily'),'hidden',{get:()=>true,set(){}});P.maxHp=P.hp=1e8;timers=timers.filter(t=>!/showDaily|runNewGameFlow/.test(String(t.fn)));showDaily=()=>{};$('#daily').hidden=true;0`);
  const goZone=id=>E(`(()=>{const zi=ZONES.findIndex(z=>z.id==='${id}');const rg=zi>=6&&zi<=11?1:0;if(curRegion!==rg){buildRegion(rg);resetWorld();}
      let sx=0,sy=0,n=0;for(let i=0;i<MW*MH;i++)if(zoneMap[i]===zi&&!solid[i]){sx+=i%MW;sy+=i/MW|0;n++;}sx/=n;sy/=n;let best=null,bd=1e9;
      for(let i=0;i<MW*MH;i++){if(zoneMap[i]!==zi||solid[i])continue;const tx=i%MW,ty=i/MW|0;let ok=1;for(let dy=-2;dy<=2&&ok;dy++)for(let dx=-3;dx<=3;dx++)if(isSolid(tx+dx,ty+dy)){ok=0;break;}if(!ok)continue;const d=(tx-sx)**2+(ty-sy)**2;if(d<bd){bd=d;best=[tx,ty];}}
      P.x=(best[0]+.5)*T;P.y=(best[1]+.5)*T;CAM.x=P.x;CAM.z=P.y;for(const e of enemies)if(!e.boss&&!e.node&&Math.hypot(e.x-P.x,e.y-P.y)<1000)e.dead=true;P.face=1;return 0;})()`);
  const zoneFor=id=>/rain|storm|fog|firefl|leaf|leaves/.test(id)?'woods':/snow/.test(id)?'snowfield':/ember|cinder/.test(id)?'crater':/bubble|fen|bog/.test(id)?'g3fen':'village';
  let ids=await pg.evaluate(()=>__T.PXLAB.map(e=>e.id));if(arg('--ids'))ids=arg('--ids').split(',');
  const meta=[];let zone='';
  for(const id of ids){const z=zoneFor(id);if(z!==zone){await goZone(z);zone=z;await pg.evaluate(()=>__step(60));}
    await E(`for(const e of enemies)if(!e.boss&&!e.node&&Math.hypot(e.x-P.x,e.y-P.y)<1000)e.dead=true;P.x=Math.round(P.x);0`);await pg.evaluate(()=>__step(20));
    const base=await pg.evaluate(()=>new Set(__T.PXFX.list));await pg.evaluate(()=>{window.__base=new Set(__T.PXFX.list);});
    await pg.evaluate(id=>__T.pxLabPlay(id),id);
    const frames=[];for(let k=0;k<max;k++){const r=await pg.evaluate(([n,cw,ch,sc,k])=>{if(k)__step(n);else __step(1,0);const g=__T.glc,p=__T.P,s=__T.toScreen(p.x+40,40,p.y);
        const c=document.createElement('canvas');c.width=cw*sc;c.height=ch*sc;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
        x.drawImage(g,Math.round(Math.max(0,Math.min(g.width-cw,s.x-cw/2))),Math.round(Math.max(0,Math.min(g.height-ch,s.y-ch*.62))),cw,ch,0,0,cw*sc,ch*sc);
        const mine=__T.PXFX.list.filter(H=>!window.__base.has(H)).length;return{d:c.toDataURL('image/png'),mine};},[every,cw,ch,sc,k]);
      const f=path.join(out,'frames',`${id}_${String(k).padStart(3,'0')}.png`);fs.writeFileSync(f,Buffer.from(r.d.split(',')[1],'base64'));frames.push(f);
      if(k>=8&&r.mine===0)break;}
    meta.push({id,zone:z,frames:frames.length});process.stdout.write(`${id}: ${frames.length} frames\n`);
    await pg.evaluate(()=>__step(30));}
  fs.writeFileSync(path.join(out,'meta.json'),JSON.stringify({meta,errs,lab:await pg.evaluate(()=>__T.PXLAB.map(e=>({id:e.id,name:e.name,cat:e.cat,src:e.src})))},null,1));
  await b.close();
  /* animated WebP per effect, frame time = every/60 s */
  execFileSync('python3',['-c',`
import json,glob,os
from PIL import Image
out=${JSON.stringify(out)};m=json.load(open(os.path.join(out,'meta.json')))
for e in m['meta']:
  fs=sorted(glob.glob(os.path.join(out,'frames',e['id']+'_*.png')))
  if not fs: continue
  ims=[Image.open(f).convert('RGB') for f in fs]
  ims[0].save(os.path.join(out,e['id']+'.webp'),save_all=True,append_images=ims[1:],duration=int(1000*${every}/60),loop=0,quality=82,method=4)
print('webp done')`],{stdio:'inherit'});
  console.log(JSON.stringify({n:meta.length,errs},null,1));})().catch(e=>{console.error(e);process.exit(1);});
