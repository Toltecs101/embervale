#!/usr/bin/env node
/* Frame-exact screenshots of pixel VFX inside the real game (headless Chromium, SwiftShader WebGL).
   node shot.cjs --out <dir> [--fx a,b | --all] [--play id1,id2] [--frames 0,2,4,8,14,22,34,50] [--zone village]
                 [--at x,y] [--keep (don't clear enemies near --at/--zone)] [--region 0|1] [--enemy type[:n]] [--pre "js"] [--post "js"] [--warm 40] [--w 960 --h 540]
                 [--crop 560x380] [--zoom 1] [--lvl 25] [--cls blademaster] [--run "js"] [--hold 0]
   The game loop is stepped by hand at exactly 1/60 s per frame (requestAnimationFrame is replaced), so frame N is t = N/60 s
   after the effect started. For each --play id it fires the lab entry next to the hero and saves the GL canvas (no HUD),
   cropped around the hero, as <out>/<id>_fNN.png plus a contact sheet <out>/<id>_sheet.png. --run "js" instead evaluates
   code inside the game closure (P, enemies, pxfx, any module function) as the trigger. --pre runs once after the hero
   spawns, --post after each trigger. Prints a JSON report: console errors, PXFX stats (raster ms, quads, drops), timings. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const D=__dirname,args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf(k);return i<0?d:args[i+1];},has=k=>args.includes(k);
const out=arg('--out');if(!out){console.error('--out required');process.exit(2);}fs.mkdirSync(out,{recursive:true});
const html=path.join(out,'test.html');
const fxa=has('--all')?['--all']:arg('--fx')?['--fx',arg('--fx')]:[];
execFileSync('node',[path.join(D,'assemble.cjs'),'--out',html,'--test',...fxa],{stdio:'inherit'});
const W=+arg('--w',800),H=+arg('--h',450),frames=arg('--frames','0,2,4,8,14,22,34,50').split(',').map(Number),warm=+arg('--warm',40);
const [cw,ch]=arg('--crop','400x260').split('x').map(Number);
const plays=(arg('--play','')||'').split(',').filter(Boolean),runs=arg('--run')?[arg('--run')]:[];
(async()=>{
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const pg=await b.newPage({viewport:{width:W,height:H}});
  const errs=[];pg.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|fonts\.g/.test(m.text()))errs.push(m.text().slice(0,400));});pg.on('pageerror',e=>errs.push('PAGEERROR '+String(e.stack||e.message).slice(0,600)));
  await pg.route('**/fonts.googleapis.com/**',r=>r.abort());await pg.route('**/fonts.gstatic.com/**',r=>r.abort());
  await pg.addInitScript(()=>{const q=[];window.requestAnimationFrame=cb=>{q.push(cb);return q.length;};window.cancelAnimationFrame=()=>{};let T=1000;
    window.__step=(n,dt)=>{dt=dt||1000/60;for(let i=0;i<n;i++){T+=dt;const a=q.splice(0);for(const cb of a)cb(T);}return T;};
    try{localStorage.setItem('embervale-q','2');}catch(e){}});
  await pg.goto('file://'+path.resolve(html));
  await pg.waitForFunction(()=>window.__T&&!document.querySelector('#bNew').disabled,null,{timeout:180000,polling:100});
  const sv={cls:arg('--cls','blademaster'),lvl:+arg('--lvl',25),rg:+arg('--region',0),q:{i:3,p:0,stage:'active'},ash:false,pot:3};
  await pg.evaluate(o=>{__T.startGame(o.cls,o);},sv);
  /* hero placement: --at x,y (world units) or --zone <zone id>: a walkable tile near that zone's middle */
  const at=arg('--at'),zone=arg('--zone');
  const keep=has('--keep');if(at||zone)await pg.evaluate(([at,zone,keep])=>__T.ev(`(()=>{let x,y;if(${JSON.stringify(at)}){[x,y]=${JSON.stringify(at)}.split(',').map(Number);}
      else{const zi=ZONES.findIndex(z=>z.id===${JSON.stringify(zone)});if(zi<0)throw new Error('no zone '+${JSON.stringify(zone)});{const rg=zi>=6&&zi<=11?1:0;if(curRegion!==rg){buildRegion(rg);resetWorld();}}let sx=0,sy=0,n=0;for(let i=0;i<MW*MH;i++)if(zoneMap[i]===zi&&!solid[i]){sx+=i%MW;sy+=i/MW|0;n++;}
        if(!n)throw new Error('zone empty');sx/=n;sy/=n;let best=null,bd=1e9;for(let i=0;i<MW*MH;i++){if(zoneMap[i]!==zi||solid[i])continue;const tx=i%MW,ty=i/MW|0;let ok=1;for(let dy=-2;dy<=2&&ok;dy++)for(let dx=-3;dx<=3;dx++)if(isSolid(tx+dx,ty+dy)){ok=0;break;}if(!ok)continue;const d=(tx-sx)**2+(ty-sy)**2;if(d<bd){bd=d;best=[tx,ty];}}
        x=(best[0]+.5)*T;y=(best[1]+.5)*T;}
      P.x=x;P.y=y;CAM.x=x;CAM.z=y;curZone=zoneMap[Math.floor(y/T)*MW+Math.floor(x/T)];if(!${JSON.stringify(keep)})for(const e of enemies)if(!e.boss&&!e.node&&Math.hypot(e.x-x,e.y-y)<900)e.dead=true;return [x,y];})()`),[at,zone,keep]);
  await pg.evaluate(()=>__T.ev(`P.maxHp=P.hp=1e8;P.face=1;g5_skip=()=>false;showDialog=(d,next)=>{try{next&&next();}catch(e){}};cine=null;Object.defineProperty($('#daily'),'hidden',{get:()=>true,set(){}});timers=timers.filter(t=>!/showDaily|runNewGameFlow/.test(String(t.fn)));showDaily=()=>{};$('#daily').hidden=true;`));
  const en=arg('--enemy');if(en){const [type,n]=en.split(':');await pg.evaluate(([type,n])=>__T.ev(`for(let k=0;k<${+n||1};k++){const e=mkEnemy('${type}',P.x+150+k*40,P.y+(k%2?30:-10),Math.max(1,P.lvl-2),null);e.state='idle';e.spawn=null;enemies.push(e);}`),[type,n]);}
  if(arg('--pre'))await pg.evaluate(src=>__T.ev(src),arg('--pre'));
  await pg.evaluate(n=>{__step(n);},warm);
  const zoom=+arg('--zoom',2);
  /* step n frames (n=0: render once with dt 0) and read the GL canvas in the same task, before the compositor clears it */
  const grab=async(n)=>pg.evaluate(([n,cw,ch,zoom])=>{if(n>0)__step(n);else __step(1,0);const g=__T.glc,p=__T.P,s=__T.toScreen(p.x+40,40,p.y);const c=document.createElement('canvas');c.width=cw*zoom;c.height=ch*zoom;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
      const sx=Math.round(Math.max(0,Math.min(g.width-cw,s.x-cw/2))),sy=Math.round(Math.max(0,Math.min(g.height-ch,s.y-ch*.62)));x.drawImage(g,sx,sy,cw,ch,0,0,cw*zoom,ch*zoom);return c.toDataURL('image/png');},[n,cw,ch,zoom]);
  const report={errors:errs,plays:{}};
  const save=(f,d)=>fs.writeFileSync(path.join(out,f),Buffer.from(d.split(',')[1],'base64'));
  const triggers=[...plays.map(id=>({id,src:`pxLabPlay(${JSON.stringify(id)})`})),...runs.map((src,i)=>({id:'run'+(i||''),src}))];
  if(!triggers.length)triggers.push({id:'idle',src:'0'});
  for(const tr of triggers){
    const ok=await pg.evaluate(src=>__T.ev(src),tr.src).catch(e=>{errs.push('trigger '+tr.id+': '+e.message);return false;});
    if(arg('--post'))await pg.evaluate(src=>__T.ev(src),arg('--post'));
    const shots=[],stats=[];let f=0;const t0=Date.now();
    for(const fr of frames){const d=await grab(Math.max(0,fr-f));f=Math.max(f,fr);save(`${tr.id}_f${String(fr).padStart(2,'0')}.png`,d);shots.push(d);
      stats.push(await pg.evaluate(()=>({live:__T.PXFX.list.length,quads:__T.PXFX.nq,ms:+__T.PXFX.ms.toFixed(2),drop:__T.PXFX.drop,up:__T.PXFX.up})));}
    /* contact sheet: frames side by side (2 rows when more than 4) with their frame numbers */
    const sheet=await pg.evaluate(async([shots,frames,cw,ch,zoom])=>{const n=shots.length,cols=n>4?Math.ceil(n/2):n,rows=Math.ceil(n/cols),sw=cw*zoom,sh=ch*zoom;
      const c=document.createElement('canvas');c.width=cols*sw+(cols-1)*4;c.height=rows*(sh+18)+(rows-1)*4;const x=c.getContext('2d');x.fillStyle='#111';x.fillRect(0,0,c.width,c.height);
      for(let i=0;i<n;i++){const im=new Image();im.src=shots[i];await im.decode();const cx=(i%cols)*(sw+4),cy=Math.floor(i/cols)*(sh+22);x.drawImage(im,cx,cy+18);x.fillStyle='#ffd27a';x.font='14px monospace';x.fillText('f'+frames[i]+'  t='+(frames[i]/60).toFixed(3)+'s',cx+4,cy+14);}
      return c.toDataURL('image/png');},[shots,frames,cw,ch,zoom]);
    save(`${tr.id}_sheet.png`,sheet);
    report.plays[tr.id]={triggered:ok!==false,frames,stats,wallMs:Date.now()-t0};
    await pg.evaluate(n=>__step(n),Math.max(0,90-f));}
  report.pxfx=await pg.evaluate(()=>({live:__T.PXFX.list.length,ms:__T.PXFX.ms,drop:__T.PXFX.drop,lab:__T.PXLAB.map(e=>e.id)}));
  console.log(JSON.stringify(report,null,1));
  await b.close();})().catch(e=>{console.error(e);process.exit(1);});
