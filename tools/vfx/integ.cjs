#!/usr/bin/env node
/* Whole-game integration test with every pixel VFX module.
   node integ.cjs --out <dir> [--fx a,b | --all] [--lite] [--cls blademaster] [--skip-tour] [--skip-fight]
   1. zone tour: the hero visits every zone (both regions), 150 frames each; screenshot + PXFX stats per zone
   2. fight: 10 enemies around the hero; for 900 frames the hero attacks, casts every slot and the Ultimate, enemies get burns,
      venom, bleeds, stuns, slows and die; per-frame PXFX raster ms, live handles, drops, and console errors are recorded
   3. lab sweep: every lab entry fired once (30 frames apart), then 240 idle frames: live handles must return to the ambient baseline
   4. reset: respawn + world reset + region change; nothing must throw, handles cleared
   Prints a JSON summary; exits 1 on any console error. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const D=__dirname,args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf(k);return i<0?d:args[i+1];},has=k=>args.includes(k);
const out=arg('--out');fs.mkdirSync(out,{recursive:true});const html=path.join(out,'test.html');
execFileSync('node',[path.join(D,'assemble.cjs'),'--out',html,'--test',...(arg('--fx')?['--fx',arg('--fx')]:['--all'])],{stdio:'inherit'});
(async()=>{
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const pg=await b.newPage({viewport:{width:800,height:450}});const errs=[];
  pg.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|fonts\.g/.test(m.text()))errs.push(m.text().slice(0,500));});pg.on('pageerror',e=>errs.push('PAGEERROR '+String(e.stack||e.message).slice(0,800)));
  await pg.route('**/fonts.g*/**',r=>r.abort());
  await pg.addInitScript(()=>{const q=[];window.requestAnimationFrame=cb=>{q.push(cb);return q.length;};let T=1000;window.__step=(n,dt)=>{dt=dt||1000/60;for(let i=0;i<n;i++){T+=dt;const a=q.splice(0);for(const cb of a)cb(T);}};try{localStorage.setItem('embervale-q','2');}catch(e){}});
  await pg.goto('file://'+path.resolve(html));
  await pg.waitForFunction(()=>window.__T&&!document.querySelector('#bNew').disabled,null,{timeout:180000,polling:200});
  const E=src=>pg.evaluate(s=>__T.ev(s),src);
  await pg.evaluate(o=>__T.startGame(o.cls,o),{cls:arg('--cls','blademaster'),lvl:25,rg:0,q:{i:3,p:0,stage:'active'},ash:false,pot:3});
  await E(`g5_skip=()=>false;showDialog=(d,next)=>{try{next&&next();}catch(e){}};cine=null;P.maxHp=P.hp=1e8;;timers=timers.filter(t=>!/showDaily|runNewGameFlow/.test(String(t.fn)));showDaily=()=>{};$('#daily').hidden=true;0`);
  if(has('--lite'))await E(`PERF.lite=true;PERF.partMul=.5;0`);
  const shot=async f=>{const d=await pg.evaluate(()=>{__step(1);return __T.glc.toDataURL('image/jpeg',.8);});fs.writeFileSync(path.join(out,f),Buffer.from(d.split(',')[1],'base64'));};
  const stat=()=>pg.evaluate(()=>({live:__T.PXFX.list.length,ms:+__T.PXFX.ms.toFixed(3),drop:__T.PXFX.drop,up:__T.PXFX.up}));
  const R={errors:errs,zones:[],fight:null,lab:null,reset:null};
  if(!has('--skip-tour')){
    for(const rg of [0,1]){await E(`if(curRegion!==${rg})buildRegion(${rg});resetWorld();0`);
      const zs=await E(`JSON.stringify(ZONES.map((z,i)=>[i,z.id]))`).then(JSON.parse);
      for(const [zi,id] of zs){const ok=await E(`(()=>{let sx=0,sy=0,n=0;for(let i=0;i<MW*MH;i++)if(zoneMap[i]===${zi}&&!solid[i]){sx+=i%MW;sy+=i/MW|0;n++;}if(n<30)return false;sx/=n;sy/=n;let best=null,bd=1e9;
          for(let i=0;i<MW*MH;i++){if(zoneMap[i]!==${zi}||solid[i])continue;const tx=i%MW,ty=i/MW|0;let ok=1;for(let dy=-2;dy<=2&&ok;dy++)for(let dx=-3;dx<=3;dx++)if(isSolid(tx+dx,ty+dy)){ok=0;break;}if(!ok)continue;const d=(tx-sx)**2+(ty-sy)**2;if(d<bd){bd=d;best=[tx,ty];}}
          if(!best)return false;P.x=(best[0]+.5)*T;P.y=(best[1]+.5)*T;CAM.x=P.x;CAM.z=P.y;for(const e of enemies)if(!e.boss&&!e.node&&Math.hypot(e.x-P.x,e.y-P.y)<900)e.dead=true;return true;})()`);
        if(!ok)continue;const ms=[];for(let k=0;k<5;k++){await pg.evaluate(()=>__step(30));ms.push((await stat()).ms);}
        await shot(`zone_r${rg}_${zi}_${id}.jpg`);const s=await stat();R.zones.push({rg,zi,id,live:s.live,msAvg:+(ms.reduce((a,b)=>a+b,0)/ms.length).toFixed(3),msMax:Math.max(...ms),errs:errs.length});}}
    await E(`if(curRegion!==0)buildRegion(0);resetWorld();P.x=64*T;P.y=104*T;CAM.x=P.x;CAM.z=P.y;0`);}
  if(!has('--skip-fight')){
    await E(`for(const e of enemies)if(!e.boss&&!e.node&&Math.hypot(e.x-P.x,e.y-P.y)<1200)e.dead=true;0`);
    const types=['wolf','spider','skeleton','wraith','golem','imp','voidling','panther','acolyte','lion'];
    await E(`window.__fT=${JSON.stringify(types)};0`);
    const per=[];
    for(let f=0;f<900;f+=10){
      await E(`(()=>{const lv=enemies.filter(e=>live(e)&&!e.node&&!e.boss&&Math.hypot(e.x-P.x,e.y-P.y)<600);
        if(lv.length<8){const t=window.__fT[(Math.random()*window.__fT.length)|0],a=Math.random()*TAU,e=mkEnemy(t,P.x+Math.cos(a)*170,P.y+Math.sin(a)*120,P.lvl,null);e.state='chase';enemies.push(e);}
        const f=${f};P.cds.fill(0);P.res=P.resMax;P.ult=100;
        if(f%20===0)tryCast(0);if(f%90===10)tryCast(1);if(f%90===40)tryCast(2);if(f%90===60)tryCast(3);if(f%90===80)tryCast(4);if(f%300===150)tryCast(6);
        const e=lv[(f/10|0)%Math.max(1,lv.length)];if(e){if(f%50===0)addDot(e,3,3,'#ff9a4d');if(f%70===0)addDot(e,3,3,'#9aff6a');if(f%110===0)addDot(e,3,3,'#ff6a8a');if(f%60===30){e.stun=1.2;e.slowT=2;e.slowAmt=.5;}
          if(f%40===20)hurt(e,e.hp*.34+5,P,{color:['#ffffff','#bfe9ff','#ffc090','#c8d8ff'][(f/40|0)%4]});}
        if(f%170===0&&P.hp>0)healP(P.maxHp*.002);if(f%230===0){P.shield=1e6;P.shieldT=3;}
        return 0;})()`);
      await pg.evaluate(()=>__step(10));per.push(await stat());}
    const ms=per.map(p=>p.ms);R.fight={frames:900,msAvg:+(ms.reduce((a,b)=>a+b,0)/ms.length).toFixed(3),msMax:Math.max(...ms),liveMax:Math.max(...per.map(p=>p.live)),drops:per[per.length-1].drop,upMax:Math.max(...per.map(p=>p.up)),errs:errs.length};
    await shot('fight.jpg');
    await E(`for(const e of enemies)if(!e.boss&&!e.node)e.dead=true;0`);await pg.evaluate(()=>__step(240));R.fight.liveAfter=(await stat()).live;}
  {const base=(await stat()).live;const ids=await pg.evaluate(()=>__T.PXLAB.map(e=>e.id));const per={};
    for(const id of ids){const e0=errs.length;await pg.evaluate(id=>__T.pxLabPlay(id),id);await pg.evaluate(()=>__step(30));const s=await stat();per[id]={ms:s.ms,live:s.live,err:errs.length-e0};}
    await pg.evaluate(()=>__step(300));await E(`for(const e of enemies)if(!e.boss&&!e.node)e.dead=true;0`);await pg.evaluate(()=>__step(300));
    R.lab={n:ids.length,baseline:base,liveAfter:(await stat()).live,per};}
  {const e0=errs.length;await E(`P.hp=0;die();0`);await pg.evaluate(()=>__step(120));await E(`respawn();0`);await pg.evaluate(()=>__step(60));
    await E(`buildRegion(1);resetWorld();P.x=RGN[1].respawn[0]*T;P.y=RGN[1].respawn[1]*T;CAM.x=P.x;CAM.z=P.y;0`);await pg.evaluate(()=>__step(90));
    await E(`buildRegion(0);resetWorld();P.x=RGN[0].respawn[0]*T;P.y=RGN[0].respawn[1]*T;CAM.x=P.x;CAM.z=P.y;0`);await pg.evaluate(()=>__step(90));
    R.reset={errs:errs.length-e0,live:(await stat()).live};}
  console.log(JSON.stringify(R,null,1));await b.close();process.exit(errs.length?1:0);})().catch(e=>{console.error(e);process.exit(1);});
