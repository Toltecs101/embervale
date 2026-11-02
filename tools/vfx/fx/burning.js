/* BURNING (Sprite Fusion "Fire", MIT, ported): an enemy on fire, flames licking up its own outline. Any enemy carrying a fire
   DoT (an e.dots entry with c '#ff9a4d': Meteor and Pyroclasm meteors, fire traps, burning ground, Firewall, the Dragoon's
   breath / dive / Dragon Scales, fire-element procs, Cataclysm's fire strike) burns while the DoT lasts and dies down when the
   DoT ends or it dies. Driven by game state (e.dots polled every update); at most 8 burning outlines (5 on lite), bosses first,
   then the nearest the hero. Every enemy gets its own small canvas (one small fire per enemy, never a merged blaze).
   Recipe (SF "Fire" unchanged; size S = sprite height / 38, clamped .75..1.5; SF's 16 px box is S 1):
   - Timeline: every tick the burning shape is read again (the enemy's live silhouette), so the flames follow its pose.
     0-0.3 s it catches (SF's start): level 0 -> 1 (smoothstep: ~.4 at frame 8, ~.8 at frame 14) scales tongue heights and every
     emission; then a steady flicker while the DoT lasts; dies down over 1.2 s (level -> 0 linearly); done once the last smoke
     (up to 2.6 s old) is gone. A new burn relights it from its current level.
   - Layers: back = smoke only. front, in order: smouldering body pixels (a fixed 1 in 5, heat T = (.4 + .6 noise) x level,
     painted [2]-[5] when T > .45), tongues (outermost first), licks, fire puffs, embers.
     Light (SF's, x .5 strength for Embervale's bright, bloomed scene, radii x .62 and fitted inside the canvas): flicker =
     .74 + .16 noise(7.3t) + .1 noise(19t), breath = .92 + .08 sin(2.1t); up to 7 tongues one warm glow r 70 #ffb060 at .4,
     a hot r 22 [2] at .32 and a white r 9 at .18; wider shapes every 5th tongue from the 3rd a warm r 50 at .36 and a hot r 16
     at .26; fire puffs r 2.4r + 2 at .18 x life; embers r 3 at .3 x life. No lamp, no flash, no shake.
   - Palette (9 steps): #ffffff #fff3a6 #ffe26b #ffc23d #ff8a2a #f2561d #c9281f #8a1f17 #4a1712: white-yellow at the base
     of each tongue, yellow, orange, red only at the outer edge and tips. Tongues are 4 nested teardrops [width, height, step]
     [1,1,6] [.76,.86,4] [.54,.68,2] [.3,.42,0]. Puffs cool by age [0] -> [7], outlined 2 steps darker, the last step dithered
     out. Embers [2]/[4] flicker, [4] under half life, [6] under a fifth. Smoke: SF's grey ramp lifted a step for a daylit
     scene (#a39a9c #8a8288 #716a73 #58525c #403b45, the base #7a7380 with 15% of [6]), soft alpha discs, peak alpha .55.
   - Shapes and motion: one tongue per 2 top-edge columns + 4 on body pixels (fixed hash), base 5-10 px (4-7 on the body) x S,
     half-width 1.5-2.1 x sqrt S; height x (1 +- .25 noise at 3.3 rad/s) + a leap up to +72%, x level x (1 + stretch); tips sway
     +-2 px x S and lean in by clamp(dx/4, +-2). Anchor velocity smoothed at 10/s: lean = clamp(-vx/520, +-1.3) eased 7/s, so the
     flames trail as it runs; stretch = clamp(vy/900, -.3, .45). Emission per 1/60 s, L = .7 x level x E, per tongue: 18% fire
     puff (r .8-1.6 x sqrt S, 30-60 up, .14-.3 s, 45% leave smoke), 7.5% + speed/2700 lick (two blobs, 24-40 px/s up, .26 s),
     2.4% x S ember (50-120 up, .9-2.2 s, wandering, drag 1.6), 1.7% smoke (1.6-2.6 s); whole body: 70% fire puff, 16% smoke.
     E (Embervale) = 16 / (tongue count), clamped .45..1, so a wide body sheds what SF's 16 px box sheds (x .55 on lite).
     Puffs rise at 190 u/s2, wobble 60 u/s2 at 17 rad/s, drag 5 / 3.2. Smoke rises at 32 u/s2, drag 1.6 / 1.2.
   - Feel: no shake, no flash: the light flickers at about 7 and 19 Hz and breathes slowly (+-8%).
   Embervale: the canvas follows the enemy and is SF's camera (fr.ox / fr.oy), so smoke, puffs and embers stay where they were
   shed in the world and trail behind a running enemy; emission chances scale by dt x 60 (frame-rate independent); the shape is
   re-read at draw time so the flames sit on this frame's sprite. */
const {pxBurning,pxBurningFire}=(function(){'use strict';const {Px,Rng,mix,ramp,hex,rgb,cl:clamp,smooth,hash,PXW:PX}=PXK;
  const noise=(x,seed=0)=>{const i=Math.floor(x),f=x-i,u=f*f*(3-2*f),a=hash(i,seed)*2-1;return a+(hash(i+1,seed)*2-1-a)*u;};
  const FIRE=['#ffffff','#fff3a6','#ffe26b','#ffc23d','#ff8a2a','#f2561d','#c9281f','#8a1f17','#4a1712'].map(hex);
  const SMOKE_RAMP=['#a39a9c','#8a8288','#716a73','#58525c','#403b45'].map(hex),SMOKE1=hex('#7a7380'),SOOT=hex('#0d0a12'),WARM=rgb(255,176,96);
  const LAYERS=[[1,1,6],[.76,.86,4],[.54,.68,2],[.3,.42,0]],FLAME=0,SMOKE_K=1,EMBER=2;
  const flick=t=>.74+.16*noise(t*7.3,1)+.1*noise(t*19,2);
  const disc=(buf,x,y,r,c,a=1)=>{if(a<=.01)return;if(a>=1)buf.disc(x,y,r,c);else buf.alphaDisc(x,y,r,c,a);};

  /* Sprite Fusion "Fire": o = {actor, box, size, ramp, wind, duration, seed} (+ Embervale: glow radius, light strength, fit, emit, lite) */
  function fire(o={}){
    const RAMP=o.ramp??FIRE,R=new Rng(o.seed??1),S=o.size??1,sS=Math.sqrt(S),WIND=o.wind??0;
    const HEAT=[...RAMP.slice(0,8),mix(RAMP[8],SOOT,.35),mix(RAMP[8],SOOT,.65)];
    const GLOW=o.ramp?mix(RAMP[3],RAMP[4],.5):WARM,SMOKE=mix(SMOKE1,RAMP[6],.15),SEED=37,GL=.9;
    const GK=o.glow??1,LK=o.light??1,EM=o.emit??1,ps=new Particles(R,RAMP,!!o.lite,LK);
    const bx=[],by=[],top=[],licks=[],tongues=[],pool=[],ord=[],TIP=[0,0];
    let t=0,stopAt=o.duration??2.6,lv=0,ax=0,ay=0,x=0,y=0,vx=0,vy=0,lean=0,stretch=0,placed=false;
    let cAt=0,sil=null,em=EM;
    const lit=()=>smooth(cAt,cAt+.3,t)*clamp(1-(t-stopAt)/1.2);
    function read(){
      bx.length=by.length=0;sil=null;
      const A=o.actor,s=A&&A.silhouette?A.silhouette():null;
      if(s){sil=s;const d=s.data,w=s.w;
        for(let py=0;py<s.h;py++)for(let px=0;px<w;px++)if(d[py*w+px]>>>24>127){bx.push(s.x+px);by.push(s.y+py);}
        const f=A.feet?A.feet():null;if(f){ax=f[0];ay=f[1];}else{ax=(s.x+s.w/2)*PX;ay=(s.y+s.h)*PX;}}
      else if(A){const f=A.feet?A.feet():null;if(f){ax=f[0];ay=f[1];}}/* Embervale: an actor with no sprite this tick burns nothing */
      else{const [X,Y,W,H]=o.box??[744,568,32,32];
        for(let py=Math.floor(Y/PX);py<(Y+H)/PX;py++)for(let px=Math.floor(X/PX);px<(X+W)/PX;px++){bx.push(px);by.push(py);}
        ax=X+W/2;ay=Y+H;}}
    function put(n,dx,h,w,dy){const q=pool[n]||(pool[n]=[0,0,0,0]);q[0]=dx;q[1]=h;q[2]=w;q[3]=dy;tongues[n]=q;}
    function place(){
      let x0=Infinity,x1=-Infinity;for(let i=0;i<bx.length;i++){if(bx[i]<x0)x0=bx[i];if(bx[i]>x1)x1=bx[i];}
      const nw=bx.length?x1-x0+1:0;top.length=nw;for(let j=0;j<nw;j++)top[j]=1e9;
      for(let i=0;i<bx.length;i++){const j=bx[i]-x0;if(by[i]<top[j])top[j]=by[i];}
      const fx=ax/PX,fy=ay/PX;let n=0;
      for(let j=0;j<nw;j+=2)if(top[j]<1e9)put(n++,x0+j-fx,5+5*hash(j,2),1.5+.6*hash(j,3),top[j]-fy+1);
      for(let k=0;k<4&&bx.length;k++){const i=Math.floor(hash(k,9)*bx.length);put(n++,bx[i]-fx,4+3*hash(k,4),1.3,by[i]-fy+1);}
      tongues.length=n;em=EM*clamp(16/Math.max(1,n),.45,1);}
    function height(i){
      const h=tongues[i][1],n=SEED+i;
      const leap=Math.max(0,noise(t*2.6+n*3.1,n+70)-.55)*1.6;
      return(h+.25*h*noise(t*3.3+n*1.7,n)+h*leap)*(.9+.1*flick(t))*S*lv*(1+stretch);}
    function tip(i){const q=tongues[i],h=height(i);TIP[0]=x+(q[0]+lean*h*.9)*PX;TIP[1]=y+(q[3]-h*.88+4)*PX;return TIP;}
    function move(dt){
      if(!placed){x=ax;y=ay;placed=true;}
      if(dt<=0)return;
      const k=1-Math.exp(-dt*10),kl=1-Math.exp(-dt*7);
      vx+=((ax-x)/dt-vx)*k;
      vy+=((ay-y)/dt-vy)*k;
      x=ax;y=ay;
      lean+=(clamp((-vx+WIND)/520,-1.3,1.3)-lean)*kl;
      stretch+=(clamp(vy/900,-.3,.45)-stretch)*kl;}
    function shed(dt){
      const speed=Math.hypot(vx,vy),L=lv*.7*em,k6=Math.min(3,dt*60);
      for(let i=0;i<tongues.length;i++){
        if(L<=.02)continue;
        if(R.chance(.18*L*k6)){const T=tip(i);
          ps.spawn(FLAME,T[0]+R.range(-2,2),T[1]+R.range(0,8),R.range(-8,8)+WIND*.3,R.range(-60,-30),R.range(.14,.3),0,R.range(.8,1.6)*sS,R.chance(.45));}
        if(R.chance((.075+speed/2700)*L*k6)){const T=tip(i);
          licks.push({x:T[0]/PX,y:T[1]/PX,vx:R.range(-6,6)+WIND*.15,vy:R.range(-40,-24),s:R.range(.9,1.7)*sS,life:.26,max:.26});}
        if(R.chance(.024*L*S*k6))ps.spawn(EMBER,x+(tongues[i][0]+R.range(-3,3))*PX,y-R.range(10,24)*S,R.range(-30,30)+WIND*.4,R.range(-120,-50),R.range(.9,2.2));
        if(R.chance(.017*L*k6)){const T=tip(i);
          ps.spawn(SMOKE_K,T[0],T[1]-6,R.range(-5,5)+WIND*.5,R.range(-34,-20),R.range(1.6,2.6),SMOKE,R.range(1.6,2.8)*sS);}}
      for(let i=licks.length-1;i>=0;i--){const l=licks[i];
        if((l.life-=dt)<=0){licks.splice(i,1);continue;}
        l.x+=l.vx*dt+noise(t*8+i,3)*.15*k6;
        l.y+=l.vy*dt;}}
    /* Embervale glow: SF's glow, radius scaled (GK) and kept inside the canvas so no light is cut by its edge */
    function glow(light,cx,cy,r,c,k){k*=LK;if(o.fit)r=Math.min(r,Math.max(1,Math.min(cx-light.ox,light.ox+light.w-cx,cy-light.oy,light.oy+light.h-cy))/.75);light.glow(cx,cy,r,c,k);}
    const outer=(a,b)=>Math.abs(tongues[b][0])-Math.abs(tongues[a][0]);
    function flames(buf,light){
      for(let i=0;i<bx.length;i++){
        const h=hash(bx[i]*73+by[i]*151,5);
        if(h>.2)continue;
        const T=clamp(.4+.6*noise(t*(5+h*20),bx[i]*7+by[i]))*lv;
        if(T>.45)buf.set(bx[i],by[i],HEAT[Math.min(9,2+Math.floor((1-T)*7))]);}
      const fx=x/PX,fy=y/PX,n=tongues.length;
      ord.length=n;for(let i=0;i<n;i++)ord[i]=i;ord.sort(outer);
      for(let q=0;q<n;q++){const i=ord[q],T=tongues[i],dx=T[0],w=T[2],dy=T[3],h=height(i),m=SEED+i;
        if(h<1)continue;
        tongue(buf,fx+dx,fy+dy+1,h,w*sS*(1-.25*Math.abs(lean)),noise(t*2.2+m,m+40)*2*S+lean*h*.9-clamp(dx*.25,-2,2),t,m*13,RAMP);}
      for(const l of licks){const k=l.life/l.max,r=l.s*(.4+.6*k);
        buf.disc(l.x,l.y,r+.6,k>.5?RAMP[5]:RAMP[6]);
        if(k>.35)buf.disc(l.x,l.y-.3,r*.6,k>.7?RAMP[2]:RAMP[4]);}
      const fl=flick(t),br=.92+.08*Math.sin(t*2.1);
      if(n<=7){const k=fl*Math.max(.15,n?lv:0)*Math.min(1,(n?lv:0)*4),g=GL*sS*GK;
        glow(light,fx+lean*4,fy-8*S,70*g*br*(.9+.1*fl),GLOW,.4*k);
        glow(light,fx,fy-6*S,22*g,RAMP[2],.32*k);
        glow(light,fx,fy-2,9*GL,RAMP[0],.18*k);}
      else for(let i=2,st=Math.max(5,Math.ceil((n-2)/8));i<n;i+=st){const T=tongues[i],dx=T[0],dy=T[3];
        glow(light,fx+dx,fy+dy-10*S,50*GL*sS*GK*br,GLOW,.36*fl*lv);
        glow(light,fx+dx,fy+dy-3,16*GL*sS*GK,RAMP[2],.26*fl*lv);}}
    return{
      update(dt){
        t+=dt;
        read();
        place();
        lv=lit();
        move(dt);
        shed(dt);
        const k6=Math.min(3,dt*60);
        if(bx.length&&R.chance(.7*lv*em*k6)){const i=Math.floor(R.next()*bx.length);
          ps.spawn(FLAME,bx[i]*PX,by[i]*PX,R.range(-10,10)-vx*.2,R.range(-80,-40),R.range(.16,.3),0,R.range(1,1.8)*sS);}
        if(bx.length&&R.chance(.16*lv*em*k6))ps.spawn(SMOKE_K,bx[0]*PX,by[0]*PX-8,R.range(-6,6)-vx*.3,R.range(-40,-20),R.range(1.2,2),SMOKE,R.range(2,3.2));
        ps.update(dt,t);},
      draw(f,layer){const buf=new Px(f,f.color),light=new Px(f,f.light);
        if(layer!=='front'){if(o.actor){read();place();}ps.draw(buf,light,true,t);}
        if(layer!=='back'){flames(buf,light);ps.draw(buf,light,false,t);}},
      stop(){if(stopAt>t)stopAt=t;},
      done:()=>t>stopAt+1.2&&ps.list.length===0,
      /* Embervale: burn again, from the current level */
      relight(){if(stopAt===Infinity)return;stopAt=Infinity;cAt=t-.3*(.5-Math.sin(Math.asin(clamp(1-2*lv,-1,1))/3));},
      _dbg:()=>({bx:bx.length,ps:ps.list.length,tg:tongues.length,sil:sil?[sil.x,sil.y,sil.w,sil.h]:null,licks:licks.length})};}
  function tongue(buf,x,y,h,w,sx,t,n,ramp9){
    if(h<1)return;
    for(const [lw,lh,ri] of LAYERS){const H=h*lh,col=ramp9[ri];
      for(let r=0;r<=H;r++){const u=r/Math.max(1,H);
        const half=w*lw*Math.pow(1-u,.85)*Math.min(1,(r+1.5)/3.5)+noise(t*9+r*.45,n)*.5;
        const cx=x+sx*u*u*lh+noise(t*4+r*.2,n+7)*u*1.1;
        if(half<.3)continue;
        for(let px=Math.round(cx-half);px<=Math.round(cx+half);px++)buf.set(px,Math.round(y-r),col);}}}
  /* smoke fades out near the canvas edge (Embervale: the canvas is a window onto the world, not the whole screen) */
  const edge=(buf,ax,ay)=>clamp(Math.min(ax-buf.ox,buf.ox+buf.w-ax,ay-buf.oy,buf.oy+buf.h-ay)/8);
  class Particles{
    constructor(R,ramp9,lite,lk){this.list=[];this.R=R;this.ramp=ramp9;this.lite=lite;this.lk=lk??1;}
    spawn(k,x,y,vx,vy,life,col=0,size=1,smokes=false){this.list.push({k,x,y,vx,vy,life,max:life,col,size,seed:this.R.next()*100,smokes});}
    update(dt,t){const L=this.list;
      for(let i=L.length-1;i>=0;i--){const p=L[i];
        if((p.life-=dt)<=0){if(p.smokes)this.spawn(SMOKE_K,p.x,p.y,p.vx*.6,p.vy*.6-12,this.R.range(.8,1.4),0,p.size*.7);L.splice(i,1);continue;}
        if(p.k===FLAME){p.vy-=190*dt;p.vx+=Math.sin(t*17+p.seed)*60*dt;p.vx-=p.vx*5*dt;p.vy-=p.vy*3.2*dt;}
        else if(p.k===SMOKE_K){p.vy-=32*dt;p.vx+=Math.sin(t*1.3+p.seed)*16*dt;p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.2*dt;}
        else{p.vy+=(-60+Math.sin(t*3+p.seed)*40)*dt;p.vx+=Math.cos(t*2.3+p.seed)*90*dt;p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.6*dt;}
        p.x+=p.vx*dt;p.y+=p.vy*dt;}}
    draw(buf,light,smoke,t){const r9=this.ramp;
      for(const p of this.list){if((p.k===SMOKE_K)!==smoke)continue;const k=p.life/p.max,age=1-k,ax=p.x/PX,ay=p.y/PX;
        if(p.k===SMOKE_K){
          const r=p.size*(.65+Math.min(1,age*2.5)*.45+age*.4),a=Math.min(1,age*12)*Math.min(1,k*2.4)*.55*edge(buf,ax,ay);
          const c=p.col?mix(p.col,ramp(SMOKE_RAMP,age),age):ramp(SMOKE_RAMP,age*1.05);
          disc(buf,ax,ay,r,c,a*.45);
          disc(buf,ax+r*.05,ay+r*.06,r*.74,c,a*.62);
          if(age<.5)disc(buf,ax-r*.22,ay-r*.3,r*.5,mix(c,r9[0],.12),a*.4*(1-age*2));}
        else if(p.k===FLAME){
          const heat=Math.min(.999,Math.pow(age,.62)+(p.seed%1)*.1),idx=Math.min(7,Math.floor(heat*8));
          const r=p.size*(.55+.45*Math.min(1,age*7))*(1-age*.55),c=r9[idx];
          if(idx>=7)disc(buf,ax,ay,r,c,Math.min(1,k*3)*.85);
          else{buf.disc(ax,ay,r,r9[Math.min(8,idx+2)]);
            buf.disc(ax-r*.16,ay-r*.22,r*.78,c);
            if(r>1.6)buf.disc(ax,ay-r*.9,r*.42,c);
            if(idx<=3&&r>1.8)buf.disc(ax-r*.28,ay-r*.34,r*.36,r9[Math.max(0,idx-1)]);
            if(idx<6&&!this.lite)light.glow(ax,ay,r*2.4+2,c,.18*k*this.lk);}}
        else{const c=k>.5?(Math.sin(t*22+p.seed*3)>-.2?r9[2]:r9[4]):k>.2?r9[4]:r9[6];
          buf.set(Math.floor(ax),Math.floor(ay),c);
          light.glow(ax,ay,3,c,.3*k*this.lk);}}}}

  /* Embervale: burn an enemy. The canvas follows it; its world drift is SF's camera (fr.ox, fr.oy) */
  const FIREC='#ff9a4d',ON=new Map(),cool=new Map(),cand=[];let seed=1,clk=0;
  const burns=e=>{const d=e.dots;if(!d)return false;for(let i=0;i<d.length;i++)if(d[i].c===FIREC&&d[i].t>0)return true;return false;};
  const lift=e=>(e.d.fly?e.d.fly*(e.leap?.3:1):0)+(e.air||0)+(e.pz||0);
  function pxBurning(e){if(!e||!e.d)return null;
    const fr=ATL.frames[e.d.spr],f0=fr&&fr[0],k=((f0&&f0.k)||1)*(e.s||1),sw=f0?f0.w*k:e.r*1.6,sh=f0?f0.h*k:e.r*1.6,boss=!!e.boss,lite=!!PERF.lite;
    const S=clamp(sh/38,.75,1.5),w=Math.round(clamp(sw+36,56,boss?220:96)),hh=Math.round(clamp(sh+(e.d.fly||0)/PIX+34,56,boss?190:96));
    let OX=0,OY=0,lx=0,ly=0,lh=0,last=null;
    const F={w,h:hh,ox:0,oy:0,color:null,light:null},W={x:0,y:0,w:0,h:0,data:null};
    return pxfx(c=>{const H=c.handle;lx=H.x;ly=H.y;lh=hdEH(H.x,H.y);
      const actor={feet:()=>[(H.ax+OX)*PX,(H.ay+OY-lift(e)/PIX)*PX],
        silhouette:()=>{let s=c.actor.silhouette();if(s)last=s;else s=last;if(!s)return null;
          W.x=s.x+Math.round(OX);W.y=s.y+Math.round(OY);W.w=s.w;W.h=s.h;W.data=s.data;return W;}};
      const fx=fire({actor,size:S,duration:Infinity,seed:seed++,glow:.62,light:.5,fit:true,emit:lite?.55:1,lite});
      return{
        update(dt){if(H.follow){const h=hdEH(H.x,H.y);OX+=(H.x-lx)/PIX;OY+=((H.y-ly)*CAM.sp-(h-lh)*CAM.cp)/PIX;lx=H.x;ly=H.y;lh=h;}fx.update(dt);},
        draw(f,layer){F.w=f.w;F.h=f.h;F.ox=Math.round(OX);F.oy=Math.round(OY);F.color=f.color;F.light=f.light;fx.draw(F,layer);},
        _dbg:()=>Object.assign(fx._dbg(),{S,w,hh}),done:()=>fx.done(),stop:()=>fx.stop(),relight:()=>fx.relight()};
    },{follow:e,w,hh,ay:hh-6,split:true,ttl:600,pri:boss?2:1});}
  const near=(a,b)=>(b.boss?1:0)-(a.boss?1:0)||Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y);
  const has=H=>PXFX.list.indexOf(H)>=0;
  /* every update: the enemies that burn now (fire DoT in e.dots), capped, bosses first then nearest the hero */
  onEv('update',dt=>{clk+=dt;if(!P)return;
    const cap=PERF.lite?5:8;cand.length=0;
    for(const e of enemies)if(!e.node&&pxAlive(e)&&burns(e))cand.push(e);
    if(cand.length>cap){cand.sort(near);cand.length=cap;}
    for(const e of cand){let r=ON.get(e);
      if(r&&!has(r.H)){ON.delete(e);if(!r.out)cool.set(e,clk+1);r=null;}/* evicted by the budget: wait before asking again */
      if(!r){if((cool.get(e)||0)>clk)continue;const H=pxBurning(e);if(H)ON.set(e,{H,out:false});else cool.set(e,clk+.5);}
      else{if(r.out)r.H.fx.relight();r.out=false;}}
    for(const [e,r] of ON){if(!has(r.H)){ON.delete(e);continue;}if(!r.out&&cand.indexOf(e)<0){r.out=true;r.H.fx.stop();}}
    if(cool.size>64)cool.clear();});
  const LAB=[];
  const reset=()=>{ON.clear();cool.clear();LAB.length=0;};
  onEv('resetWorld',reset);onEv('respawn',reset);
  /* lab: each entry clears the previous entry's subjects (and their fires) and spawns calm ones (no aggro, so no boss intro,
     no fight): the capture shows only this effect, the burn applied straight to the enemy as a fire DoT */
  const clear=()=>{for(const e of LAB){e.dead=true;const r=ON.get(e);if(r){r.H.dead=true;ON.delete(e);}const i=enemies.indexOf(e);if(i>=0)enemies.splice(i,1);}LAB.length=0;};
  const spawn=(type,x,y,calm=true)=>{const e=mkEnemy(type,x,y,Math.max(1,P.lvl-2),null);e.state='idle';if(calm){e.d=Object.assign({},e.d,{aggro:0});e.wanderT=99;}enemies.push(e);LAB.push(e);return e;};
  pxlab('burning','Burning (fire DoT on a wolf)','Status','sf',(x,y)=>{clear();addDot(spawn('wolf',x+40,y),4,3,FIREC);});
  pxlab('burning-golem','Burning (golem, 5 s)','Status','sf',(x,y)=>{clear();addDot(spawn('golem',x+50,y),4,5,FIREC);});
  pxlab('burning-run','Burning (charging wolf: flames trail)','Status','sf',(x,y)=>{clear();const e=spawn('wolf',x+260,y,false);addDot(e,2,4,FIREC);aggro(e);});
  pxlab('burning-flyer','Burning (harpy, airborne)','Status','sf',(x,y)=>{clear();addDot(spawn('harpy',x+50,y),4,3,FIREC);});
  pxlab('burning-boss','Burning (boss: Broodmother)','Status','sf',(x,y)=>{clear();addDot(spawn('brood',x+120,y),10,4,FIREC);});
  pxlab('burning-pack','Burning (a pack of 10: 8-outline cap)','Status','sf',(x,y)=>{clear();for(let k=0;k<10;k++){const a=k/10*Math.PI*2;addDot(spawn('wolf',x+90+Math.cos(a)*130,y+Math.sin(a)*80),3,3,FIREC);}});
  return{pxBurning,pxBurningFire:fire};})();
