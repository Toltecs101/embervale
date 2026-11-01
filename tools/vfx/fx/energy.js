/* ENERGY (Sprite Fusion "Energy" and "Black Hole", MIT, ported, plus originals in Sprite Fusion's style): raw energy in one
   recolourable 8-step ramp (orb, charge, beam, bolt) and a black hole with a lensed accretion disk.
   In the game: a plasma orb rides every orb projectile (Arcane Orbs 'orb', the Violet Star's 'starorb', pets' 'parc', Nyxara's
   'voidorb'), an Ultimate charges energy into the hero's hands while P.chargeT runs, Dawnbreaker / Dawn Hammer ('dawn') and the
   Glimmera / Nyxara / wyrmling lines ('prismbeam' 'riftbeam' 'prismbeam2') fire pixel beams, every 'singularity' opens a black hole.
   Recipe. Sizes in art px, positions and speeds in Sprite Fusion world units (2 per art px), times in s.
   Palette: 8-step ramps light to dark, C0 white-hot cores / C1 pale insides, rings, flash / C2 bodies, glows / C3 dark rims, beam
   and trail colour / C4 outer rims / C5 beam fringe, mote tails / C6 glass edge, outline / C7 glass tint. SF cyan gold pink, and
   Embervale's violet (arcane) ember (fire) jade (wind, bow) crimson (axe) void (Nyxara, dark glass) made the same way.
   Black hole: blackbody disk #3a0e16 .. #ffffff (9 steps), shadow #020105, jets #f4fbff #9fd8ff #7a5cff, violet #b37bff.
   - ORB RIDER (original, from SF Orb + Bolt): follows the projectile (ground anchor, height pr.z). Glass r 5.5 (orb) / 5 (voidorb),
     dithered 0.15 + 0.55 d^2, C7 inside C6 past 0.8 r; 3 filaments (lightning jag 0.2, forks 0.5, re-struck 15/s); core
     (2.4 + 1.2 pulse) x 0.45 + 1.4 rim; 5 motes on tilted orbits r + 1.8..5; a C3 rim + C6 outline; highlight arc. 'starorb' and
     'parc' get SF's bolt head instead (discs 4.2 / 3.3 / 2.3 / 1.3 x size, 4 rays at 22 rad/s). Behind: the bolt's trail (the
     last 7 positions, discs 0.6 + 2.6u x width), motes shed in world space (35 / 70% per update, +-60, 0.12-0.24 s). The orb
     zaps the ground first at 0.5-0.9 s then every 0.7-1.1 s (bolt jag 0.3, 6 stars). When the projectile is gone it pops
     (SF bolt impact x 0.55): flash disc 5 -> 2.7 in 0.05 s, cross of light 11.5 -> 1.6 in 0.14 s, ring 1.6 -> 14 px, 14 plasma,
     8 stars and motes, light r 82 for 0.25 s; the glass shrinks in 0.14 s. At most 12 riders (6 lite); Nyxara's orbs only fill free
     slots and fade (0.25 s) to make room for the hero's.
   - CHARGE (SF Charge): at the hero's hands while P.chargeT > 0 after an Ultimate cast (0.42-0.75 s); SF's 2.8 s timeline runs in
     that time (pulse rate x (2.8 / charge)^0.7, pulse life 0.2 / sqrt). Orb r = 1.2 + 5.5k^2 + pulse (0.6 + 1.2k), discs
     r + 1.2 C4 / r C2 / 0.72r C1 / 0.42r C0, swirl arcs past r 3, corona of 8 rays past k 0.2, trembling past 0.8; 1 + floor(6k^2)
     motes per update from 42-119 units spiralling in (0.4 tangential); crackles past k 0.4. Release where the hand was: flash disc
     9 -> 3.6 in 0.07 s, cross half-length 26 -> 3, rings 3 -> 33 and 1.5 -> 18 px, light r 180, 50 particles at 150-675, plus a
     ground shockwave (flat, original): SF's release rings 4 -> 84 px laid on the floor. Ramp by the Ultimate's damage type.
   - BEAM (SF Beam): from the caster's hand (24 px up, 12 units ahead) to the far end of the line on the ground, anchored at its
     nearest point. Charge = the line's delay (0.3 Dawnbreaker, 0.12 Dawn Hammer, 0.85 Glimmera, 1 Nyxara), then it fires (reaches
     the end in 0.07 s, 1.35 W settling), holds 0.25-0.4 s, tapers to 0.4 px in 0.3 s. Across it: C0 under 0.2 W, C1 0.4, C2 0.62,
     C3 0.85, C4 1, C5 dithered to 1.3; pulses every 40 px at 136 px/s; two winding strands; flare at the hand, impact crown of 7
     rays leaning back toward the caster, splash plasma, smoke, molten ground (10-step heat ramp, +-18 px x 4 rows). Enemy lines
     also get a pixel aim line during the delay (original): dashes C3 / C2 marching to the target at 60 px/s, denser as it charges.
   - BLACK HOLE (SF Black Hole): every 'singularity' (Singularity r 260 / 364, Shadow Vortex, the void proc r 140). Radius
     0.07 x r units (shadow 9 px for r 260), hole 3.1 radii above the ground. Timeline fitted to the ground's life: forming
     min(0.4, 0.2 dur), imploding min(0.42, 0.22 dur), so the burst lands exactly when the game's own end blast fires. Disk 1.4-3.5
     radii squashed 0.2, lensed far side, photon ring, Doppler, Kepler shear texture, heartbeat every 0.85 s, slabs torn from the
     ground (zone dust colour), streaks sucked in (enemy colours where they stand, else lilac shreds), jets after a big meal: every
     enemy killed inside 0.55 r feeds it (2 + min(6, r / 6)), every Singularity tick that hits feeds 0.4. Rings are ellipses in the
     disk's plane (x 0.5), the lens (scene bend) is replaced by a dithered void gloom to 4.5 radii (no scene access in the bridge).
     Units scale by S = radius / 34 (speeds, reaches, light radii), particle counts by 0.4 + 0.6 S. At most 3 holes (1 lite).
   Feel: shakes go through a trauma holder (they keep a level, never pile up); no screen flashes but the Ultimate's 0.25 and the
   hero beam's 0.12 (halved with reduceMotion); the punch is the light pop. */
const {pxEnergy,pxEnergyOrb,pxEnergyCharge,pxEnergyBeam,pxEnergyHole}=(function(){'use strict';const {Px,dot,bayer,Rng,mix,scale,ramp,hex,rgb,cl:clamp,smooth,outExpo,hash,TAU,PXW:PX}=PXK;
  const lerp=(a,b,t)=>a+(b-a)*t,frac=x=>x-Math.floor(x),outCubic=t=>1-Math.pow(1-clamp(t),3);
  const noise=(x,seed=0)=>{const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);return lerp(hash(i,seed)*2-1,hash(i+1,seed)*2-1,u);};
  const rgbString=c=>`${c&255},${(c>>>8)&255},${(c>>>16)&255}`;
  const luma=c=>((c&255)*.299+((c>>>8)&255)*.587+((c>>>16)&255)*.114)/255;
  const GRAVITY=1900,WHITE=hex('#ffffff');
  const RAMPS={
    cyan:['#ffffff','#d6ffff','#7ff3ff','#1ab8e6','#2b6fd2','#25449c','#1b2662','#0f1538'].map(hex),
    gold:['#fffbe8','#ffec92','#ffd243','#f4a923','#c9761b','#8c4716','#512611','#2c140b'].map(hex),
    pink:['#ffffff','#ffd8f5','#ff9ee4','#ff5fd0','#d43cc4','#8a2bb0','#4b1a7a','#250d42'].map(hex),
    violet:['#ffffff','#eedcff','#cfa4ff','#a66cff','#7a45e6','#5328b0','#321878','#1a0c40'].map(hex),
    ember:['#ffffff','#fff3a6','#ffd24a','#ff8a2a','#e2561d','#ad2f17','#701a17','#3a0e16'].map(hex),
    jade:['#ffffff','#dcffe8','#8cf5b8','#36d68a','#1d9a73','#16665c','#103e44','#0a2028'].map(hex),
    crimson:['#ffffff','#ffe0d6','#ff9a8a','#ff4d5a','#c82a48','#86193c','#4e1030','#28081c'].map(hex),
    void:['#ffe8ff','#e8b8ff','#b878ff','#7a3cd8','#4a1e96','#2a105e','#140832','#08030f'].map(hex)};
  const HEAT_RAMP=['#ffffff','#fff3a6','#ffe26b','#ffc23d','#ff8a2a','#f2561d','#c9281f','#8a1f17','#4f1a13','#2a120e'].map(hex);
  const SMOKE_RAMP=['#7b6f72','#5d5660','#433d48','#2b2630','#1a171e'].map(hex),SMOKE_TINT=hex('#5b5566');
  function ring(buf,cx,cy,r,thick,c,alpha=1){const ro=r+thick*.5,ri=Math.max(0,r-thick*.5),ro2=ro*ro,ri2=ri*ri;
    for(let y=Math.floor(cy-ro);y<=Math.ceil(cy+ro);y++){const dy=y+.5-cy;for(let x=Math.floor(cx-ro);x<=Math.ceil(cx+ro);x++){const dx=x+.5-cx,d2=dx*dx+dy*dy;
      if(d2<=ro2&&d2>=ri2&&(alpha>=1||alpha>bayer(x,y)))buf.set(x,y,c);}}}
  /* a ring laid in a tilted plane: an ellipse squashed q across, turned by (ct, st), drawn as dotted bands so 1 px stays whole */
  function ellRing(buf,cx,cy,r,thick,c,alpha,q,ct,st){const n=Math.ceil(r*TAU*1.4)+8;
    for(let j=0;j<n;j++){const a=(j/n)*TAU,ca=Math.cos(a),sa=Math.sin(a)*q;
      for(let k=-thick/2;k<=thick/2+.01;k+=.5){const rr=r+k,u=ca*rr,v=sa*rr;dot(buf,cx+u*ct-v*st,cy+u*st+v*ct,c,alpha);}}}
  function seg(buf,x0,y0,x1,y1,c,a=1){const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)*2));for(let i=0;i<=n;i++)dot(buf,x0+((x1-x0)*i)/n,y0+((y1-y0)*i)/n,c,a);}
  function holder(shake){let held=0;return(level,dt)=>{held=Math.max(0,held-1.7*dt);if(level>held){shake?.(level-held);held=level;}};}

  /* ---------- Sprite Fusion "Energy" ---------- */
  function energy(o={}){
    const R=new Rng(o.seed??1),C=typeof o.colors==='object'?o.colors:RAMPS[o.colors??'cyan'];
    const groundAt=x=>o.ground===undefined?Infinity:typeof o.ground==='number'?o.ground:o.ground(x);
    const ps=new Particles(R,groundAt,C),lights=[];
    const hand=()=>o.actor?.hand?.()??{x:o.x??430,y:o.y??552,a:0};
    const c={o,R,C,ps,lights,groundAt,hand};
    const kind=o.kind??'charge';
    const run=kind==='beam'?beam(c):kind==='orb'?orb(c):kind==='bolt'?projectile(c):kind==='rider'?rider(c):kind==='shock'?shock(c):charge(c);
    return{
      update(dt){run.update(dt);ps.update(dt);stepLights(lights,dt);},
      draw(f,layer){const buf=new Px(f,f.color),light=new Px(f,f.light);
        if(layer!=='front'){run.back?.(buf,light);ps.draw(buf,light,'back');}
        if(layer!=='back'){run.front(buf,light);ps.draw(buf,light,'front');drawLights(light,lights);}},
      stop:()=>run.stop?.(),
      done:()=>run.over()&&ps.list.length===0&&lights.length===0};}
  function charge({o,R,C,ps,lights,hand}){
    const REL=o.charge??2.8,rumble=holder(o.shake),TS=Math.max(1,2.8/REL),RCH=o.reach??1,RS=o.size??1,PL=.2/Math.sqrt(TS),RR=o.rings??RS,LK=o.lights??RS,SPR=o.spread??RS;
    const sparks=[];let t=0,released=false,phase=0,pulses=[],rel=[0,0],relT=REL;
    const level=()=>released?1:clamp(t/REL);
    return{
      update(dt){t+=dt;const k=level(),e=k*k,m=hand();
        if(!released&&t<REL&&!(o.until&&t>.05&&o.until())){
          for(let i=0;i<1+Math.floor(e*6);i++){const a=R.range(0,TAU),d=R.range(60,170)*RCH*(1-.35*k),life=R.range(.16,.26),sp=(d/life)*.95;
            ps.spawn(K.MOTE,m.x+Math.cos(a)*d,m.y+Math.sin(a)*d,-Math.cos(a)*sp-Math.sin(a)*sp*.4,-Math.sin(a)*sp+Math.cos(a)*sp*.4,life,R.pick([C[0],C[1],C[2]]),1);}
          phase+=(2+13*e)*Math.pow(TS,.7)*dt;if(phase>=1){phase-=1;pulses.push(t);}
          if(k>.4&&R.chance(.25*k)){const a=R.range(0,TAU),l=R.range(6,12)*(.5+k)*RS,x0=m.x/PX,y0=m.y/PX;sparks.push({b:bolt(R,x0,y0,x0+Math.cos(a)*l,y0+Math.sin(a)*l,.4,.3,.7),t});}
          rumble(.08*e,dt);}
        else if(!released){released=true;relT=t;rel=[m.x,m.y];
          o.flash?.(.8,rgbString(C[1]));o.shake?.(.35);o.ripple?.(m.x,m.y,10,300,.6,.18,40);o.release?.(m.x,m.y);
          lights.push({x:m.x,y:m.y,r:240*LK,color:C[2],k:1,life:.45,max:.45});
          for(let i=0,n=Math.round(70*(o.burst??1));i<n;i++){const a=R.range(0,TAU),sp=R.range(200,900)*SPR;
            ps.spawn(R.chance(.65)?K.MOTE:K.STAR,m.x,m.y,Math.cos(a)*sp,Math.sin(a)*sp,R.range(.3,.8),R.pick([C[0],C[1],C[2]]),R.range(.8,2));}}
        pulses=pulses.filter(p=>t-p<PL);
        for(let i=sparks.length-1;i>=0;i--)if(t-sparks[i].t>.06)sparks.splice(i,1);},
      front(buf,light){const k=level();
        if(!released){const m=hand(),jit=k>.8?(Math.floor(t*40)%2?1:-1)*((k-.8)/.2):0,ox=m.x/PX+jit,oy=m.y/PX;
          const pr=Math.sin(phase*TAU)*.5+.5,r=(1.2+5.5*k*k+pr*(.6+1.2*k))*RS;
          orbBall(buf,ox,oy,r,t,k,C);
          for(const p of pulses){const q=(t-p)/PL;ring(buf,ox,oy,r+2+16*RS*(1-outCubic(q))*(.5+k),1,q>.6?C[0]:C[1],1-q*.6);}
          for(const sp of sparks)drawBolt(buf,light,sp.b,{core:C[0],body:C[1],halo:C[3],glow:C[2]},1,.3);
          light.glow(ox,oy,(12+30*k)*LK,C[2],.5+.6*k);
          light.glow(ox,oy,(6+6*k)*LK,C[0],.5+.4*k);}
        if(released&&t-relT<=.6){const q=(t-relT)/.6,e=outCubic(q),ox=rel[0]/PX,oy=rel[1]/PX;
          if(q<.12){buf.disc(ox,oy,12*RS*(1-q*5)+1.5,C[2]);buf.disc(ox,oy,12*RS*(1-q*5),C[0]);}
          if(q<.3)cross(buf,ox,oy,(1-q/.3)*30*RS+4,C);
          ring(buf,ox,oy,4*RR+80*RR*e,Math.max(1,5*RR*(1-q)),q<.2?C[0]:C[1],1.2-q);
          ring(buf,ox,oy,2*RR+44*RR*outCubic(q*1.4),Math.max(1,2*(1-q)),C[2],1-q);
          light.glow(ox,oy,130*LK*(.4+.6*e),C[2],1.1*(1-q));}},
      over:()=>released&&t>relT+1};}
  function orbBall(buf,x,y,r,t,k,C){
    for(let i=0;i<8;i++){const a=(i/8)*TAU+t*1.5,l=(2+6*k)*(.5+.5*Math.abs(noise(t*14+i*3,i)));
      if(k>.2)seg(buf,x+Math.cos(a)*(r+1),y+Math.sin(a)*(r+1),x+Math.cos(a)*(r+1+l),y+Math.sin(a)*(r+1+l),i%2?C[2]:C[1]);}
    buf.disc(x,y,r+1.2,C[4]);buf.disc(x,y,r,C[2]);buf.disc(x-r*.12,y-r*.12,r*.72,C[1]);buf.disc(x,y,r*.42,C[0]);
    if(r>3)for(const s of [0,Math.PI])for(let a=0;a<1.2;a+=.12){const ang=t*9+s+a,rr=r*(.58+.12*Math.sin(a*3));dot(buf,x+Math.cos(ang)*rr,y+Math.sin(ang)*rr,a<.5?C[0]:C[1]);}}
  function cross(buf,x,y,l,C){for(let d=-l;d<=l;d++){const a=Math.abs(d)/l,c=a<.3?C[0]:a<.65?C[1]:C[2];dot(buf,x+d,y,c,1.15-a);dot(buf,x,y+d*.7,c,1.15-a);}}
  function beam({o,R,C,ps,lights,groundAt,hand}){
    const [IX,IY]=o.to??[920,596],FIRE=o.charge??.55,TAPER=FIRE+(o.hold??1.95),OFF=TAPER+(o.taper??.4),W=o.width??6.5,LN=o.lean??1,FS=o.flare??1;
    const GY=groundAt(IX),molten=Number.isFinite(GY)&&Math.abs(GY-IY)<30,SMOKE_TINTED=mix(SMOKE_TINT,C[3],.45),GK=o.glowEvery??15;
    let t=0,fired=false,heat=0;
    const width=t=>t<FIRE?0:t<TAPER?W*(1+.35*Math.exp(-(t-FIRE)*10)):lerp(W,.4,outCubic((t-TAPER)/(OFF-TAPER)));
    const on=t=>t>=FIRE&&t<OFF;
    return{
      update(dt){t+=dt;const m=hand();
        if(t<FIRE)gather(ps,lights,R,C,m.x,m.y,clamp(t/FIRE),FS);
        if(t>=FIRE&&!fired){fired=true;o.flash?.(.45,rgbString(C[1]));o.shake?.(.15);o.kick?.(-3*Math.sign(IX-m.x||1),0);}
        if(on(t)){heat=Math.min(1,heat+dt*1.2);const k=width(t)/W;
          for(let i=0;i<4*k;i++){const a=-Math.PI/2+LN*(R.range(-1.3,.9)-.4),sp=R.range(150,560);ps.spawn(K.PLASMA,IX+R.range(-6,6),IY-2,Math.cos(a)*sp,Math.sin(a)*sp,R.range(.15,.5));}
          if(R.chance(.2))ps.spawn(K.SMOKE,IX+R.range(-10,10),IY-6,R.range(-10,10),R.range(-50,-20),R.range(1,1.8),SMOKE_TINTED,R.range(3,5));
          if(R.chance(.5*k)){const u=R.next();ps.spawn(K.PLASMA,lerp(m.x,IX,u),lerp(m.y,IY,u),R.range(-60,60),R.range(-90,30),R.range(.1,.25));}}
        else heat=Math.max(0,heat-dt*.6);},
      back(buf,light){
        /* Embervale: the aim line of an enemy beam, on the ground under it, while it charges (original) */
        if(o.aim&&t<FIRE){const [[sx,sy],[ex,ey]]=o.aim,k=clamp(t/FIRE),L=Math.hypot(ex-sx,ey-sy)/PX||1,ux=(ex-sx)/PX/L,uy=(ey-sy)/PX/L;
          for(let d=4;d<L;d+=.5){const ph=frac((d-t*60)/9),x=sx/PX+ux*d,y=sy/PX+uy*d;if(ph>.55)continue;dot(buf,x,y,ph<.2&&k>.5?C[2]:C[3],(.35+.6*k)*(1-.5*d/L));}
          ring(buf,ex/PX,ey/PX,3+3*(1-k),1,C[2],.4+.6*k);}
        if(molten&&heat>.02){const cx=IX/PX,cy=Math.round(GY/PX);
          for(let y=cy;y<=cy+3;y++)for(let x=Math.floor(cx-18);x<=cx+18;x++){const d=Math.abs(x+.5-cx)/18+(y-cy)*.22,T=heat*(1.15-d)-hash(x*13+y)*.3;
            if(T>.05)buf.set(x,y,HEAT_RAMP[Math.min(HEAT_RAMP.length-1,Math.floor((1-Math.min(1,T))*(HEAT_RAMP.length-1)))]);}
          light.glow(cx,cy,30,HEAT_RAMP[4],.4*heat);}},
      front(buf,light){const m=hand(),ax=m.x/PX,ay=m.y/PX,bx=IX/PX,by=IY/PX;
        if(t<FIRE){const k=t/FIRE,r=(1+3.5*k*k)*FS;buf.disc(ax,ay,r+1,C[3]);buf.disc(ax,ay,r,C[2]);buf.disc(ax,ay,r*.5,C[0]);return;}
        if(!on(t))return;
        const L0=Math.hypot(bx-ax,by-ay)||1,dx=(bx-ax)/L0,dy=(by-ay)/L0,nx=-dy,ny=dx;
        const L=L0*outExpo((t-FIRE)/.07),w0=width(t),k=w0/W;
        for(let d=0;d<=L;d+=.5){const w=w0*(1+.12*Math.sin(d*.35-t*42))*Math.min(1,(d+3)/7),x=ax+dx*d,y=ay+dy*d;
          const pulse=frac(d*.025-t*3.4)<.07?1:0;
          for(let q0=-w*1.3;q0<=w*1.3;q0+=.5){const q=Math.abs(q0)/Math.max(.3,w),px=Math.floor(x+nx*q0),py=Math.floor(y+ny*q0);
            const lvl=Math.max(0,(q<.2?0:q<.4?1:q<.62?2:q<.85?3:q<1?4:5)-pulse);
            if(lvl===5&&bayer(px,py)>(1.3-q)/.3)continue;buf.set(px,py,C[lvl]);}
          for(const s of [0,Math.PI]){const ph=d*.2-t*28+s,q0=Math.sin(ph)*w*.85;if(Math.cos(ph)>-.2)dot(buf,x+nx*q0,y+ny*q0,Math.cos(ph)>.5?C[0]:C[1]);}
          if(Math.round(d*2)%Math.round(GK*2)===0)light.glow(x,y,w*2.2+4,C[3],.3*k*(GK/8));}
        const fr=(3+2*k+Math.sin(t*50)*.6)*FS;buf.disc(ax,ay,fr+1.5,C[3]);buf.disc(ax,ay,fr,C[2]);buf.disc(ax,ay,fr*.6,C[0]);
        for(let i=0;i<4;i++){const a=t*9+(i*TAU)/4,l=(6+3*Math.sin(t*30+i))*k*FS;seg(buf,ax,ay,ax+Math.cos(a)*l,ay+Math.sin(a)*l,i%2?C[2]:C[0]);}
        light.glow(ax,ay,(26*k+8)*FS,C[2],.9*k);
        if(L>=L0-.5){const ir=4+2.5*k+Math.sin(t*60)*.8;buf.disc(bx,by,ir+1.5,C[3]);buf.disc(bx,by,ir,C[1]);buf.disc(bx,by,ir*.55,C[0]);
          for(let i=0;i<7;i++){const a=-Math.PI/2+LN*((i-3)*.32-.5),l=(8+7*Math.abs(noise(t*18+i*3,i)))*k;seg(buf,bx,by-1,bx+Math.cos(a)*l,by+Math.sin(a)*l,i%2?C[2]:C[1]);}
          light.glow(bx,by,50*k+10,C[2],1*k);light.glow(bx,by,14,C[0],.7*k);}},
      over:()=>t>OFF&&heat<=0};}
  function gather(ps,lights,R,C,x,y,k,s=1){
    for(let i=0;i<2+Math.floor(k*4);i++){const a=R.range(0,TAU),d=R.range(34,96)*s*(1-k*.45),sp=d*R.range(6,9);
      ps.spawn(K.PLASMA,x+Math.cos(a)*d,y+Math.sin(a)*d,-Math.cos(a)*sp-Math.sin(a)*sp*.45,-Math.sin(a)*sp+Math.cos(a)*sp*.45,R.range(.1,.14));}
    if(R.chance(.3+k*.4))ps.spawn(K.GLINT,x+R.range(-3,3)*s,y+R.range(-3,3)*s,0,0,.03,C[2],(1+k)*s);
    lights.push({x,y,r:(30+70*k)*s,color:C[3],k:.5+.7*k,life:.05,max:.05});
    lights.push({x,y,r:(14+18*k)*s,color:C[0],k:.3*k,life:.04,max:.04});}
  function orb({o,R,C,ps,lights,groundAt}){
    const X=o.x??760,Y0=o.y??484,RAD=o.radius??20,[E0,E1]=o.every??[1.1,1.5],ms=Math.max(.45,RAD/20),NF=RAD>=12?6:3,NM=RAD>=12?8:5,GR=o.grow??.3,SH=o.shrink??.4;
    const COLS={core:C[0],body:C[2],halo:C[4],glow:C[3]};
    const fils=Array.from({length:NF},(_,i)=>({a:(i/NF)*TAU,w:(.5+hash(i,1)*.9)*(i%2?1:-1),b:null,end:[0,0]}));
    const motes=Array.from({length:NM},(_,i)=>({a:hash(i,4)*TAU,w:1.6+hash(i,5)*1.4,r:RAD+(4+hash(i,6)*7)*ms,tilt:(hash(i,7)-.5)*1.4}));
    let t=0,zap=null,struck=-1,nextZap=o.firstZap??1.75,stopAt=Infinity;
    const centre=o.centre??(()=>[X/PX,Y0/PX+Math.sin(t*1.7)*3]);
    const size=()=>(t<stopAt?smooth(0,GR,t):1-smooth(stopAt,stopAt+SH,t));
    const motePos=(m,cx,cy,s)=>{const a=m.a+m.w*t,x=Math.cos(a)*m.r*s,z=Math.sin(a);return{x:cx+x*Math.cos(m.tilt),y:cy+x*Math.sin(m.tilt)+z*m.r*s*.28,z};};
    return{
      update(dt){t+=dt;if(o.life&&t>=o.life)stopAt=Math.min(stopAt,t);
        const [cx,cy]=centre(),s=size(),rad=RAD*s,f=Math.floor(t*30);
        if(f!==struck&&f%2===0&&s>.05){struck=f;
          for(const [i,fl] of fils.entries()){fl.a+=fl.w*.07+noise(t*2+i,i)*.12;fl.end=[cx+Math.cos(fl.a)*(rad-.8),cy+Math.sin(fl.a)*(rad-.8)];fl.b=bolt(R,cx,cy,fl.end[0],fl.end[1],.2,.5,.35);}}
        const G=groundAt(X);
        if(t>=nextZap&&t<stopAt&&Number.isFinite(G)){nextZap=t+R.range(E0,E1);const x1=cx+R.range(-30,30)*ms;
          zap={b:bolt(R,cx,cy+rad,x1,G/PX,.3,.5),t};
          for(let i=0,n=o.stars??16;i<n;i++)ps.spawn(K.STAR,x1*PX,G-2,R.range(-180,180)*ms*1.4,-R.range(60,260)*ms*1.4,R.range(.25,.6),R.pick([C[0],C[1],C[2]]),R.range(.6,1.4));
          lights.push({x:x1*PX,y:G-6,r:90*ms*1.4,color:C[3],k:.7,life:.15,max:.15});}
        if(zap&&t-zap.t>.12)zap=null;
        if(t<stopAt&&!o.noShed&&R.chance(.15)){const a=R.range(0,TAU);ps.spawn(K.MOTE,(cx+Math.cos(a)*(rad+1))*PX,(cy+Math.sin(a)*(rad+1))*PX,Math.cos(a)*40,Math.sin(a)*40-20,R.range(.4,.8),C[2],.8);}},
      back(buf,light){const [cx,cy]=centre(),s=size();if(s<=.02)return;
        for(const m of motes){const p=motePos(m,cx,cy,s);if(p.z>=0)continue;dot(buf,p.x,p.y,C[4]);dot(buf,p.x-Math.sign(m.w),p.y,C[5],.6);}
        const pl=.8+.2*Math.sin(t*7)+.1*noise(t*20,2);light.glow(cx,cy,52*ms*pl*s,C[3],.5*pl*s);},
      front(buf,light){const [cx,cy]=centre(),s=size(),rad=RAD*s,pulse=.8+.2*Math.sin(t*7);
        if(s>.02){
          for(let y=Math.floor(cy-rad);y<=Math.ceil(cy+rad);y++)for(let x=Math.floor(cx-rad);x<=Math.ceil(cx+rad);x++){const d=Math.hypot(x+.5-cx,y+.5-cy)/rad;if(d>1)continue;
            if(.15+.55*d*d>bayer(x,y))buf.set(x,y,d>.8?C[6]:C[7]);}
          for(const fl of fils){if(!fl.b)continue;
            for(const p of fl.b.paths)for(let i=0;i<p.pts.length-1;i++){const [x0,y0]=p.pts[i],[x1,y1]=p.pts[i+1],u=Math.hypot(x0-cx,y0-cy)/rad;
              seg(buf,x0+1,y0,x1+1,y1,C[4],.5);seg(buf,x0,y0,x1,y1,p.w>.3&&u<.4?C[0]:p.w>.3?C[1]:C[2]);if(i%3===0)light.glow(x0,y0,5*ms*1.4,C[3],.2);}
            const [ex,ey]=fl.end;buf.disc(ex,ey,1.6*Math.min(1,ms*1.6),C[1]);buf.set(Math.floor(ex),Math.floor(ey),C[0]);light.glow(ex,ey,6*ms*1.4,C[2],.5);}
          const cr=(2.4+1.2*pulse)*s*ms;buf.disc(cx,cy,cr+1.4,C[3]);buf.disc(cx,cy,cr,C[1]);buf.disc(cx,cy,cr*.55,C[0]);
          light.glow(cx,cy,16*ms*1.4,C[0],.55*pulse*s);
          ring(buf,cx,cy,rad+.3,1,C[3]);ring(buf,cx,cy,rad+1.2,1,C[6]);
          const hr=rad-Math.max(1.2,2.2*ms);for(let a=3.5;a<4.6;a+=.04)dot(buf,cx+Math.cos(a)*hr,cy+Math.sin(a)*hr,a>3.8&&a<4.3?C[0]:C[1]);
          buf.disc(cx-rad*.42,cy-rad*.5,Math.min(1,ms*2),C[0]);dot(buf,cx+rad*.5,cy+rad*.55,C[2]);
          for(const m of motes){const p=motePos(m,cx,cy,s);if(p.z<0)continue;dot(buf,p.x,p.y,C[0]);dot(buf,p.x-Math.sign(m.w),p.y,C[2]);dot(buf,p.x-2*Math.sign(m.w),p.y,C[4],.6);light.glow(p.x,p.y,5*ms*1.4,C[2],.35);}}
        if(zap)drawBolt(buf,light,zap.b,COLS,1-(t-zap.t)/.15,.6);},
      over:()=>t>stopAt+SH&&!zap,
      stop(){stopAt=Math.min(stopAt,t);}};}
  function projectile({o,R,C,ps,lights,groundAt,hand}){
    const CH=o.charge??.28,SPEED=o.speed??1100;const trail=[];
    let t=0,from=null,to=[0,0],T=1,hit=-1;
    const head=()=>{if(!from)return[0,0];const u=clamp((t-CH)/T);return[lerp(from[0],to[0],u),lerp(from[1],to[1],u)];};
    return{
      update(dt){t+=dt;const m=hand();
        if(t<CH){if(R.chance(.7)){const a=R.range(0,TAU),d=R.range(20,50),sp=d/.12;ps.spawn(K.MOTE,m.x+Math.cos(a)*d,m.y+Math.sin(a)*d,-Math.cos(a)*sp,-Math.sin(a)*sp,.12,R.pick([C[0],C[1],C[2]]),.8);}return;}
        if(!from){from=[m.x,m.y];to=o.to??[m.x+Math.cos(m.a)*420,m.y+Math.sin(m.a)*420];T=Math.max(.05,Math.hypot(to[0]-from[0],to[1]-from[1])/SPEED);
          o.kick?.(-2*Math.sign(to[0]-from[0]||1),0);lights.push({x:from[0],y:from[1],r:70,color:C[2],k:.8,life:.1,max:.1});}
        if(hit<0){const [x,y]=head();trail.push([x,y]);if(trail.length>7)trail.shift();
          if(R.chance(.7))ps.spawn(K.MOTE,x,y,R.range(-60,60),R.range(-60,60),R.range(.15,.3),R.pick([C[1],C[2]]),.7);
          if(t-CH>=T){hit=t;trail.length=0;o.shake?.(.12);o.flash?.(.15,rgbString(C[1]));impactBurst(ps,lights,R,C,x,y,Math.abs(groundAt(x)-y)<8,1);}}},
      front(buf,light){
        if(t<CH){const m=hand(),k=t/CH,r=.8+2.6*k;buf.disc(m.x/PX,m.y/PX,r+1,C[3]);buf.disc(m.x/PX,m.y/PX,r,C[1]);buf.disc(m.x/PX,m.y/PX,r*.5,C[0]);light.glow(m.x/PX,m.y/PX,10+14*k,C[2],.6*k);return;}
        if(hit<0&&from){const [hx,hy]=head();drawTrail(buf,light,trail,C,1);boltHead(buf,light,hx/PX,hy/PX,t,C,1);}
        if(hit>=0&&t-hit<.35)impactShapes(buf,(t-hit)/.35,to[0]/PX,to[1]/PX,C,1);},
      over:()=>hit>=0&&t-hit>.4};}
  /* the bolt's parts, shared by the SF bolt and the Embervale riders */
  function boltHead(buf,light,ax,ay,t,C,s){
    for(let i=0;i<4;i++){const a=t*22+(i*TAU)/4,l=(5+1.5*Math.sin(t*50+i))*s;seg(buf,ax+Math.cos(a)*3*s,ay+Math.sin(a)*3*s,ax+Math.cos(a)*l,ay+Math.sin(a)*l,C[1]);}
    buf.disc(ax,ay,4.2*s,C[4]);buf.disc(ax,ay,3.3*s,C[2]);buf.disc(ax,ay,2.3*s,C[1]);buf.disc(ax,ay,1.3*s,C[0]);
    light.glow(ax,ay,26*s,C[3],.7);light.glow(ax,ay,9*s,C[0],.5);}
  function drawTrail(buf,light,trail,C,s){
    for(let i=0;i<trail.length-1;i++){const [x0,y0]=trail[i],[x1,y1]=trail[i+1],u=(i+1)/trail.length;
      for(let d=0;d<=1;d+=.1){const x=lerp(x0,x1,d)/PX,y=lerp(y0,y1,d)/PX,w=(.6+2.6*(u-.1+d*.1))*s;if(w>1.6)buf.disc(x,y,w,C[3]);buf.disc(x,y,Math.max(.6,w*.55),u>.6?C[1]:C[2]);}
      light.glow(x0/PX,y0/PX,(8*u+2)*s,C[3],.3*u);}}
  function impactBurst(ps,lights,R,C,x,y,onGround,s){
    for(let i=0,n=Math.round(26*s);i<n;i++){const a=onGround?-Math.PI/2+R.range(-1.4,1.4):R.range(0,TAU),sp=R.range(200,700)*Math.sqrt(s);ps.spawn(K.PLASMA,x,y-1,Math.cos(a)*sp,Math.sin(a)*sp,R.range(.15,.45));}
    for(let i=0,n=Math.round(14*s);i<n;i++){const a=R.range(0,TAU),sp=R.range(80,300)*Math.sqrt(s);ps.spawn(i%2?K.STAR:K.MOTE,x,y,Math.cos(a)*sp,Math.sin(a)*sp-(onGround?120:0),R.range(.25,.6),R.pick([C[0],C[1],C[2]]),R.range(.8,1.6));}
    lights.push({x,y,r:150*s,color:C[3],k:.9,life:.25,max:.25});}
  function impactShapes(buf,q,ax,ay,C,s){
    if(q<.15){buf.disc(ax,ay,9*s*(1-q*3)+1.5,C[3]);buf.disc(ax,ay,9*s*(1-q*3),C[0]);}
    if(q<.4)cross(buf,ax,ay,(18*(1-q/.4)+3)*s,C);
    ring(buf,ax,ay,(3+22*outCubic(q))*s,Math.max(1,3*s*(1-q)),q<.3?C[0]:C[2],1.2-q);}
  /* RIDER (original, from SF Orb and Bolt): a plasma orb (or a bolt head) riding a game projectile, its trail and shed motes in
     world space (the canvas follows the projectile, so they are shifted back each update), popping when the projectile is gone */
  function rider(c){const {o,R,C,ps,lights}=c,H=o.handle,src=o.src,RAD=o.radius??5.5,SZ=o.size??1,glass=o.head!=='bolt',TW=o.trailW??(glass?.55:SZ);
    let t=0,popT=-1,lx=H.x,ly=H.y;const trail=[],last={x:src.x,z:src.z??30,y:src.y};
    const proj=(x,z,y)=>pxProj(H,x,z,y);
    const centre=()=>{const p=proj(last.x,last.z,last.y);return[p[0]/PX,p[1]/PX];};
    const inner=glass?orb({...c,o:{...o,radius:RAD,centre,grow:.18,shrink:.14,firstZap:o.firstZap??R.range(.5,.9),every:o.every??[.7,1.1],stars:6,noShed:true}}):null;
    return{
      update(dt){t+=dt;const dx=H.x-lx,dy=H.y-ly;lx=H.x;ly=H.y;
        if(dx||dy){const sx=-dx/PIX*PX,sy=-dy*CAM.sp/PIX*PX;ps.shift(sx,sy);for(const l of lights){l.x+=sx;l.y+=sy;}}
        if(popT<0){last.x=src.x;last.y=src.y;if(src.z!=null)last.z=src.z;trail.push([last.x,last.z,last.y]);if(trail.length>7)trail.shift();
          const [cx,cy]=centre();if(R.chance(glass?.35:.7))ps.spawn(K.MOTE,cx*PX+R.range(-2,2),cy*PX+R.range(-2,2),R.range(-60,60),R.range(-60,60),R.range(.12,.24),R.pick([C[1],C[2]]),.7);}
        inner?.update(dt);},
      back(buf,light){inner?.back(buf,light);},
      front(buf,light){
        if(popT<0&&trail.length>1){const T=trail.map(p=>proj(p[0],p[1],p[2]));drawTrail(buf,light,T,C,TW);}
        if(inner)inner.front(buf,light);else if(popT<0){const [cx,cy]=centre();boltHead(buf,light,cx,cy,t,C,SZ);}
        if(popT>=0&&t-popT<.35){const [cx,cy]=centre();impactShapes(buf,(t-popT)/.35,cx,cy,C,o.pop??.55);}},
      stop(){if(popT>=0)return;popT=t;trail.length=0;inner?.stop();const [cx,cy]=centre(),k=o.pop??.55;impactBurst(ps,lights,R,C,cx*PX,cy*PX,false,k*(o.soft?.6:1));},
      over:()=>popT>=0&&t-popT>.4&&(!inner||inner.over())};}
  /* SHOCK (original, from SF Charge's release rings): the release laid on the ground in a flat canvas */
  function shock({o,C}){const X=o.x??0,Y=o.y??0,RS=o.size??1,D=o.dur??.6;let t=0;
    return{update(dt){t+=dt;},
      front(buf,light){if(t>D)return;const q=t/D,e=outCubic(q),ox=X/PX,oy=Y/PX;
        ring(buf,ox,oy,4*RS+80*RS*e,Math.max(1,5*RS*(1-q)),q<.2?C[0]:C[1],1.2-q);
        ring(buf,ox,oy,2*RS+44*RS*outCubic(q*1.4),Math.max(1,2*(1-q)),C[2],1-q);
        if(q<.25)for(let y=Math.floor(oy-14*RS);y<=oy+14*RS;y++)for(let x=Math.floor(ox-14*RS);x<=ox+14*RS;x++){const d=Math.hypot(x+.5-ox,y+.5-oy)/(14*RS*(1-q*2));if(d<1&&(1-q/.25)*(1-d*d)>bayer(x,y))buf.set(x,y,d<.5?C[1]:C[2]);}
        light.glow(ox,oy,90*RS*(.4+.6*e),C[3],.6*(1-q));},
      over:()=>t>D};}
  const PAL={white:WHITE,cyan:hex('#7ff3ff'),cyanDeep:hex('#1ab8e6')};
  const K={MOTE:0,STAR:1,PLASMA:2,SMOKE:3,GLINT:4};
  class Particles{
    constructor(R,ground,C){this.list=[];this.t=0;this.R=R;this.ground=ground;this.C=C;}
    spawn(k,x,y,vx,vy,life,col=0,size=1){this.list.push({k,x,y,vx,vy,life,max:life,col,size,seed:this.R.next()*100});}
    shift(dx,dy){for(const p of this.list){p.x+=dx;p.y+=dy;}}
    update(dt){this.t+=dt;const t=this.t,L=this.list;
      for(let i=L.length-1;i>=0;i--){const p=L[i];if((p.life-=dt)<=0){L.splice(i,1);continue;}
        switch(p.k){
          case K.MOTE:p.vx-=p.vx*.6*dt;p.vy-=p.vy*.6*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case K.STAR:p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.6*dt+10*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case K.PLASMA:{p.vy+=GRAVITY*.45*dt;p.vx-=p.vx*2.2*dt;p.vy-=p.vy*2.2*dt;const g=this.ground(p.x),ny=p.y+p.vy*dt;p.x+=p.vx*dt;
            if(p.vy>0&&p.y<=g&&ny>=g){p.vy=-p.vy*.45;p.vx*=.7;p.y=g-.5;}else p.y=ny;break;}
          case K.SMOKE:p.vy-=32*dt;p.vx+=Math.sin(t*1.3+p.seed)*16*dt;p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.2*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case K.GLINT:break;}}}
    draw(buf,light,layer){for(const p of this.list)if((p.k===K.SMOKE)===(layer==='back'))this.drawOne(p,buf,light);}
    drawOne(p,buf,light){const k=p.life/p.max,ax=p.x/PX,ay=p.y/PX,px=Math.floor(ax),py=Math.floor(ay),C=this.C;
      switch(p.k){
        case K.MOTE:{const sp=Math.hypot(p.vx,p.vy)||1,ux=p.vx/sp,uy=p.vy/sp,len=Math.min(16,.5+sp*.013)*p.size;if(k<.35&&bayer(px,py)>k/.35)break;
          buf.line(ax-ux*len,ay-uy*len,ax-ux*len*.35,ay-uy*len*.35,scale(p.col,.55));buf.line(ax-ux*len*.4,ay-uy*len*.4,ax,ay,p.col);light.glow(ax,ay,2.5+p.size,p.col,.4*k);break;}
        case K.STAR:{const tw=.6+.4*Math.sin(this.t*(8+(p.seed%5))+p.seed);
          if(p.size<1){if(tw*k>.25)buf.set(px,py,tw>.8?C[0]:p.col);light.glow(ax,ay,3,p.col,.4*k*tw);break;}
          const arm=Math.max(1,Math.round(p.size*tw*Math.min(1,k*3))),tip=scale(p.col,.75);
          for(let d=1;d<=arm;d++){const cc=d===arm&&arm>1?tip:p.col;buf.set(px+d,py,cc);buf.set(px-d,py,cc);buf.set(px,py+d,cc);buf.set(px,py-d,cc);}
          buf.set(px,py,C[0]);light.glow(ax,ay,3+arm*2,p.col,.5*k*tw);break;}
        case K.PLASMA:{const hot=k>.5?C[0]:k>.25?C[2]:C[3],sp=Math.hypot(p.vx,p.vy)||1,ux=p.vx/sp,uy=p.vy/sp,len=Math.min(9,1+sp*.011);
          buf.line(ax-ux*len,ay-uy*len,ax-ux*len*.4,ay-uy*len*.4,k>.5?hot:C[3]);buf.line(ax-ux*len*.45,ay-uy*len*.45,ax,ay,hot);light.glow(ax,ay,3,hot,.45*k);break;}
        case K.SMOKE:{const age=1-k,r=p.size*(.65+Math.min(1,age*2.5)*.45+age*.4),a=Math.min(1,age*12)*Math.min(1,k*2.4)*.58,c=p.col?mix(p.col,ramp(SMOKE_RAMP,age),age):ramp(SMOKE_RAMP,age*1.05);
          buf.alphaDisc(ax,ay,r,c,a*.45);buf.alphaDisc(ax+r*.05,ay+r*.06,r*.74,c,a*.62);break;}
        case K.GLINT:{const r=p.size*(.5+k*.5);buf.disc(ax,ay,r+.8,C[3]);buf.disc(ax,ay,r,p.col);light.glow(ax,ay,p.size*4,p.col,.6*k);break;}}}}
  function stepLights(lights,dt){for(let i=lights.length-1;i>=0;i--)if((lights[i].life-=dt)<=0)lights.splice(i,1);}
  function drawLights(light,lights){for(const l of lights){const k=l.life/l.max;light.glow(l.x/PX,l.y/PX,(l.r/PX)*(.55+.45*k),l.color,l.k*k*k);}}
  function bolt(R,x0,y0,x1,y1,jag=.32,forks=.35,w=1,depth=0){const out={paths:[]},L=Math.hypot(x1-x0,y1-y0);let pts=[[x0,y0],[x1,y1]],off=L*jag;
    while(pts.length<2+L/3){const nxt=[pts[0]];for(let i=0;i<pts.length-1;i++){const [ax,ay]=pts[i],[bx,by]=pts[i+1],l=Math.hypot(bx-ax,by-ay)||1,oo=R.range(-off,off);
      nxt.push([(ax+bx)/2+(-(by-ay)/l)*oo,(ay+by)/2+((bx-ax)/l)*oo],[bx,by]);}pts=nxt;off*=.52;}
    out.paths.push({pts,w});
    if(depth<2)for(let i=2;i<pts.length-3;i++)if(R.chance(forks/(1+depth)/Math.max(4,pts.length/6))){const [ax,ay]=pts[i],[bx,by]=pts[Math.min(pts.length-1,i+3)];
      const a=Math.atan2(by-ay,bx-ax)+R.sign()*R.range(.35,.9),l=(L-(i/pts.length)*L)*R.range(.25,.55);out.paths.push(...bolt(R,ax,ay,ax+Math.cos(a)*l,ay+Math.sin(a)*l,jag*1.1,forks,w*.55,depth+1).paths);}
    return out;}
  function drawBolt(buf,light,b,cols,k=1,glowK=.5){
    for(const p of b.paths){const thick=p.w>=1;
      for(let i=0;i<p.pts.length-1;i++){const [ax,ay]=p.pts[i],[bx,by]=p.pts[i+1],l=Math.max(1,Math.hypot(bx-ax,by-ay));
        for(let d=0;d<=l;d+=.5){const x=ax+((bx-ax)*d)/l,y=ay+((by-ay)*d)/l;
          if(k>.45&&thick)for(const [dx,dy] of NB4)dot(buf,x+dx*1.5,y+dy*1.5,cols.halo,(k-.45)*1.6);
          if(k>.25&&(thick||p.w>.4))for(const [dx,dy] of NB2)dot(buf,x+dx,y+dy,cols.body);
          buf.set(Math.floor(x),Math.floor(y),thick&&k>.3?cols.core:cols.body);}
        if(i%3===0)light.glow(ax,ay,(thick?9:5)*(.5+k*.5),cols.glow,glowK*k*p.w);}}}
  const NB4=[[1,0],[-1,0],[0,1],[0,-1]],NB2=[[1,0],[0,1]];

  /* ---------- Sprite Fusion "Black Hole" ---------- */
  const BH_RAMP=['#3a0e16','#701a17','#ad2f17','#e2561d','#ff8a2a','#ffb24a','#ffd98c','#fff2cf','#ffffff'].map(hex);
  const BLUE_WHITE=hex('#dcecff'),SHADOW=rgb(2,1,5),HOLE_LIGHT=rgb(255,170,90),JET_CORE=hex('#f4fbff'),JET=hex('#9fd8ff'),JET_EDGE=hex('#7a5cff');
  const VIOLET=hex('#b37bff'),VOID=rgb(26,12,44),SHREDS=['#e4ddf4','#b5abd4','#8b80b4','#5d5488'].map(hex),STONE=hex('#4a3f69'),OUTLINE=hex('#1a1422');
  const DISK_COLORS=[BH_RAMP[4],BH_RAMP[5],BH_RAMP[6],BH_RAMP[7]];
  function blackHole(o={}){
    const X=o.x??760,Y=o.y??430,RAD=o.radius??34,LIFE=o.life??3.8,PULL=o.pull??1,S=o.scale??1,NK=o.count??1;
    const FORM=o.form??.4,COLLAPSE=o.collapse??.42,END=FORM+LIFE+COLLAPSE,REACH=RAD*12.4,G=4.2e7*Math.pow(RAD/34,3)*PULL,SWIRL=.55;
    const R=new Rng(o.seed??3),N=k=>Math.max(1,Math.round(k*NK)),TS=(FORM+LIFE)/4.2;
    const groundAt=x=>o.ground===undefined?Infinity:typeof o.ground==='number'?o.ground:o.ground(x);
    const ps=new HoleParticles(R,groundAt),fx=new Rings(o.flat??1),slabs=[];
    const u=R.next();
    const h={t:0,tilt:o.tilt??(u<.5?-1:1)*(.14+(u%.5)*.5),flare:0,gulp:0,grow:0,jet:0,jetCd:0,colors:[]};fx.ct=Math.cos(h.tilt);fx.st=Math.sin(h.tilt);
    const bursts=[];let collapsed=false,ended=0,slabAcc=0;
    const implosion=()=>clamp((h.t-FORM-LIFE)/COLLAPSE);
    const beat=()=>{if(h.t<FORM||implosion()>0)return 0;const p=((h.t-FORM)%.85)/.85,b=x=>Math.exp(-Math.pow((p-x)/.045,2));return b(.06)+.7*b(.26);};
    const radius=()=>{const Rr=RAD*(1+h.grow)*(1+.1*h.gulp)*(1+.045*beat());
      if(h.t<FORM){const k=h.t/FORM;return Rr*(1+1.7*Math.pow(k-1,3)+.7*Math.pow(k-1,2))*Math.min(1,k*3);}
      const breath=1+Math.sin(h.t*3.1)*.025+Math.sin(h.t*7.3)*.01,k=implosion();if(k<=0)return Rr*breath;
      if(k<.3)return Rr*breath*(1+.14*Math.sin((k/.3)*(Math.PI/2)));return Rr*breath*1.14*(1-Math.pow((k-.3)/.7,2));};
    const strength=()=>smooth(0,FORM*.8,h.t)*(1+.8*implosion()+.45*beat());
    const gloom=()=>smooth(0,FORM,h.t)*(.35+.65*smooth(0,2.5,h.t)+.3*beat()+.6*implosion());
    function feed(amount,col=0){if(collapsed)return;
      h.flare=Math.min(2.5,h.flare+amount*.05);h.gulp=Math.min(1,h.gulp+amount*.06);h.grow=Math.min(.3,h.grow+amount*.0015);
      if(col){if(h.colors.length<32)h.colors.push(col);else h.colors[R.int(0,31)]=col;}
      if(amount>=3&&h.jetCd<=0&&implosion()<=0){h.jet=1;h.jetCd=1.1;const Rr=radius(),nx=-Math.sin(h.tilt),ny=Math.cos(h.tilt);
        for(let side=-1;side<=1;side+=2){const px=X+nx*Rr*side,py=Y+ny*Rr*side,a0=Math.atan2(ny*side,nx*side);
          for(let i=0,n=N(18);i<n;i++){const a=a0+R.range(-.14,.14),sp=R.range(500,1300)*S;ps.spawn(B.PLASMA,px,py,Math.cos(a)*sp,Math.sin(a)*sp,R.range(.15,.4));}
          fx.light(px,py,110*S,JET,1,.25);fx.ring(px,py,3*S,22*S,.14,1,JET_CORE);}
        o.shake?.(.12);}}
    o.ripple?.(X,Y,RAD*5.5,RAD*.8,.3,.14,RAD*.7);
    fx.ring(X,Y,190*S,6*S,.34,2,VIOLET);fx.ring(X,Y,115*S,4*S,.24,1.2,WHITE);
    bursts.push({t:0,dur:.18,s:.35});fx.light(X,Y,280*S,VIOLET,1.3,.4);
    for(let i=0,n=N(70);i<n;i++){const a=R.range(0,TAU),r=R.range(70,230)*S,sp=R.range(60,160)*S;
      ps.spawn(B.MOTE,X+Math.cos(a)*r,Y+Math.sin(a)*r,Math.sin(a)*sp,-Math.cos(a)*sp,R.range(.6,1.2),R.chance(.45)?VIOLET:R.pick(DISK_COLORS),R.range(.8,1.4));}
    o.shake?.(.35);
    function collapse(){collapsed=true;
      o.ripple?.(X,Y,RAD*.6,RAD*7,.6,.2,RAD*.7);o.flash?.(.7,'235,220,255');
      bursts.push({t:0,dur:.45,s:1});
      fx.ring(X,Y,RAD*1.4,RAD*7,.5,3,WHITE);fx.ring(X,Y,RAD*.8,RAD*4.5,.6,1.8,VIOLET);fx.ring(X,Y,RAD*2.2,RAD*9.5,.32,1,JET);
      fx.light(X,Y,420*S,rgb(255,232,210),o.burstK??1.5,.5);fx.light(X,Y,280*S,VIOLET,(o.burstK??1.5)/1.5,.8);
      for(let i=0,n=N(150);i<n;i++){const a=R.range(0,TAU),sp=R.range(180,950)*S;ps.spawn(B.MOTE,X,Y,Math.cos(a)*sp,Math.sin(a)*sp,R.range(.3,.9),R.chance(.3)?VIOLET:R.chance(.3)?WHITE:R.pick(DISK_COLORS),R.range(1,1.8));}
      for(let i=0,n=N(40);i<n;i++){const a=R.range(0,TAU),sp=R.range(400,1200)*S;ps.spawn(B.PLASMA,X,Y,Math.cos(a)*sp,Math.sin(a)*sp,R.range(.15,.45));}
      const cols=h.colors.length?h.colors:[WHITE];
      for(let i=0,n=N(130);i<n;i++){const a=R.range(0,TAU),sp=R.range(200,900)*S;ps.spawn(B.INK,X+Math.cos(a)*RAD*.3,Y+Math.sin(a)*RAD*.3,Math.cos(a)*sp,Math.sin(a)*sp-R.range(0,200)*S,R.range(1.2,2.4),R.pick(cols),R.chance(.4)?2:1);}
      ps.impulse(X,Y,RAD*9,950*S);
      for(const s of slabs){const dx=s.x-X,dy=s.y-Y,d=Math.hypot(dx,dy)||1,f=850*S*Math.max(0,1-d/(RAD*7));s.vx+=(dx/d)*f;s.vy+=(dy/d)*f-150*S;s.va+=R.range(-8,8);s.pull=0;}
      o.shake?.(.6);}
    function stepSlabs(dt,pulling){const Rr=Math.max(1,radius()),k=strength();
      for(let i=slabs.length-1;i>=0;i--){const s=slabs[i],dx=X-s.x,dy=Y-s.y,d=Math.hypot(dx,dy)||1,size=Math.max(s.w,s.h)*PX;
        if(pulling){if(d<Rr*.9+size*.15){slabs.splice(i,1);feed(2+Math.min(6,size/10),s.c);continue;}
          const a=((G*k)/(d*d+Rr*Rr))*Math.min(1,(REACH-d)/(REACH*.25)),ux=dx/d,uy=dy/d,lift=GRAVITY*Math.min(1,k)*Math.sqrt(Math.max(0,1-d/REACH));
          s.vx+=(ux-uy*SWIRL)*a*dt;s.vy+=((uy+ux*SWIRL)*a-lift)*dt;const drag=Math.min(.2,(1-d/REACH)*2*dt);s.vx-=s.vx*drag;s.vy-=s.vy*drag;
          s.pull=Math.max(s.pull*.9,Math.min(1,Math.max(0,(Rr*3.4-d)/(Rr*2.6)))*.8);s.pullA=Math.atan2(dy,dx);}else s.pull*=.9;
        s.vy+=GRAVITY*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.a+=s.va*dt;if(s.y>groundAt(s.x)+40)slabs.splice(i,1);}}
    return{feed,
      update(dt){const before=implosion(),beat0=beat();h.t+=dt;
        for(let i=bursts.length-1;i>=0;i--)if((bursts[i].t+=dt)>=bursts[i].dur)bursts.splice(i,1);
        if(!collapsed&&h.t>=END)collapse();
        if(collapsed){ended+=dt;stepSlabs(dt,false);ps.update(dt);fx.update(dt);return;}
        h.flare-=h.flare*3*dt;h.gulp-=h.gulp*5*dt;h.jet=Math.max(0,h.jet-dt/.5);h.jetCd-=dt;
        const Rr=Math.max(1,radius()),imp=implosion(),k=strength();
        feed(ps.attract(X,Y,G*k,REACH,SWIRL,Rr,dt)*.03);
        if(imp<=0){const b=beat();if(beat0<.5&&b>=.5)o.shake?.(.1);
          const n=(R.chance(.5)?1:0)+Math.round(3*b);
          for(let i=0;i<n;i++){const a=R.range(0,TAU),r=R.range(Rr*1.8,Rr*7),px=X+Math.cos(a)*r,py=Y+Math.sin(a)*r;
            const pc0=o.sample?.(px,py)??0,pc=pc0&&luma(pc0)>.22?pc0:R.pick(SHREDS),vin=R.range(220,520)*S*(1+b),vt=R.range(200,400)*S;
            const vx=Math.sin(a)*vt-Math.cos(a)*vin,vy=-Math.cos(a)*vt-Math.sin(a)*vin;
            if(i%4===3)ps.spawn(B.DUST,px,py,vx*.35,vy*.35,R.range(.5,.9),mix(pc,VOID,.5),R.range(1.6,3.4));
            else ps.spawn(B.MOTE,px,py,vx,vy,Math.min(1.1,(r/vin)*1.3),R.chance(.35)?pc:mix(pc,VOID,R.range(.45,.8)),R.range(.8,1.5));}
          if(R.chance(.5)){const side=R.sign(),r=R.range(Rr*2.4,Rr*3.4);ps.spawn(B.MOTE,X+Math.cos(h.tilt)*r*side,Y+Math.sin(h.tilt)*r*side,-Math.sin(h.tilt)*side*120*S,Math.cos(h.tilt)*side*120*S,R.range(.3,.6),R.pick(DISK_COLORS),1);}
          o.shake?.(.006*k+h.gulp*.01);
          const gy=groundAt(X);
          if(o.slabs!==false&&gy-Y<REACH*.85&&(slabAcc+=dt*(.7+2.2*b)*smooth(.3*TS,1.2*TS,h.t))>1){slabAcc-=1;
            const sx=X+R.range(-1,1)*Math.sqrt(Math.max(0,(REACH*.7)**2-(gy-Y)**2))*.6,w=S<.75?R.int(3,7):R.int(4,9),hh=S<.75?R.int(2,4):R.int(3,5),gc=o.groundColor??STONE;
            slabs.push({x:sx,y:groundAt(sx)-hh,vx:0,vy:-R.range(60,160)*S,a:R.range(-.2,.2),va:R.range(-3,3),w,h:hh,pull:0,pullA:0,c:gc});
            for(let i=0;i<4;i++)ps.spawn(B.DUST,sx+R.range(-6,6),groundAt(sx)-2,R.range(-40,40)*S,-R.range(20,70)*S,R.range(.5,.9),mix(gc,rgb(150,140,150),.35),R.range(1.5,3));}}
        else{if(before<=0)fx.ring(X,Y,Rr*6,Rr,COLLAPSE,1.6,VIOLET);
          for(let i=0;i<5;i++){const a=R.range(0,TAU),r=R.range(Rr*2,Rr*6);ps.spawn(B.MOTE,X+Math.cos(a)*r,Y+Math.sin(a)*r,(-Math.cos(a)*500+Math.sin(a)*200)*S,(-Math.sin(a)*500-Math.cos(a)*200)*S,.4,R.chance(.5)?WHITE:VIOLET,1.2);}
          o.shake?.(.02+.03*imp);}
        stepSlabs(dt,true);ps.update(dt);fx.update(dt);
        o.darken?.(.3*smooth(0,FORM,h.t)+.15*imp);},
      draw(f,layer){const buf=new Px(f,f.color),light=new Px(f,f.light);
        if(layer!=='front'){if(!collapsed)drawGloom(buf,X/PX,Y/PX,radius()/PX,gloom());ps.draw(buf,light,'back');}
        if(layer==='back')return;
        for(const s of slabs)drawSlab(buf,s);
        if(!collapsed)drawHole(buf,light,X,Y,radius(),h,implosion(),smooth(0,FORM,h.t));
        for(const b of bursts)drawBurst(buf,light,X/PX,Y/PX,h.tilt,b.t/b.dur,(RAD/PX)*b.s,o.burstGlow??1);
        ps.draw(buf,light,'front');fx.draw(buf,light);},
      lamp(){const L=fx.lights;let i=0;for(const l of L)i+=l.k*(l.life/l.max)**2;return i>.05?{i:Math.min(1.6,i*.7),c:[.72,.5,1],r:200*S+80,h:o.lampH??40}:null;},
      done:()=>collapsed&&ended>2.5&&ps.list.length===0};}
  function tone(I,x,y,blue){if(I<.08&&bayer(x,y)>I/.08)return 0;const n=BH_RAMP.length-1,f=Math.max(0,Math.min(n,(I/1.12)*n));let idx=Math.floor(f);
    if(f-idx>bayer(x,y))idx=Math.min(n,idx+1);const c=BH_RAMP[idx];return blue>.05&&idx>=n-2?mix(c,BLUE_WHITE,Math.min(1,blue)):c;}
  function tex(rho,th,t){const a=th+5*Math.pow(rho,-1.5)*t,streak=.66+.2*Math.sin(a*6+rho*9.5)+.14*Math.sin(a*13-rho*21+1.7),lane=.78+.22*Math.cos(rho*12.5+Math.sin(a*2)*.6);
    const knot=Math.max(0,Math.sin(a*3+rho*7+Math.sin(t*1.3)*2)*Math.sin(a*5-rho*11+t*.9));return streak*lane+knot*knot*knot*.55;}
  function drawHole(buf,light,x,y,Rw,h,imp,form){if(Rw<.6)return;
    const Rs=Rw/PX,t=h.t,shake=h.gulp*.9+imp*.8,ax=x/PX+Math.sin(t*71)*shake,ay=y/PX+Math.cos(t*63)*shake;
    const bright=form*(1+2.2*imp)*(1+.45*Math.min(2,h.flare)),q=.2,rin=1.4,rout=3.5;
    const tilt=h.tilt+Math.sin(t*1.7)*.04,ct=Math.cos(tilt),st=Math.sin(tilt),ext=Math.ceil(Rs*rout*1.05)+2;
    const flicker=1+Math.sin(t*23)*.04+Math.sin(t*57)*.03+h.flare*.15*Math.sin(t*90);
    let blue=0;const dop=s=>{const D=1+.5*-s;blue=Math.max(0,D-1.25)*1.6;return Math.pow(D,1.25);};
    for(let py=Math.floor(ay-ext);py<=Math.ceil(ay+ext);py++)for(let px=Math.floor(ax-ext);px<=Math.ceil(ax+ext);px++){
      const dx=(px+.5-ax)/Rs,dy=(py+.5-ay)/Rs,u=dx*ct+dy*st,v=-dx*st+dy*ct,r=Math.hypot(u,v);if(r>rout*1.05)continue;
      let I=0,lit=false;blue=0;
      if(r>=1){const s=Math.max(0,-v/r),hh=.1+.62*Math.pow(s,1.3),e=(r-1)/hh;
        if(v<.25&&e<1){I=Math.max(I,(1-Math.pow(e,1.6))*(.72+.28*tex(rin+e*1.5,Math.atan2(v,u),t))*.9*dop(u/r));lit=true;}
        const s2=Math.max(0,v/r),h2=.04+.2*Math.pow(s2,1.3),e2=(r-1)/h2;
        if(v>-.25&&e2<1){I=Math.max(I,(1-Math.pow(e2,1.4))*.5*dop(u/r));lit=true;}
        if(r<1.075+.04*h.flare){I=Math.max(I,1.05*flicker*(.75+.25*dop(u/r)));lit=true;}}
      let shadow=r<1;const rho=Math.hypot(u,v/q);
      if(rho>=rin&&rho<=rout&&(v>=0||r>=1)){const k=(rho-rin)/(rout-rin);
        const Id=1.25*Math.pow(1-k,1.1)*(.7+.3*smooth(0,.05,k))*(1-smooth(.72,1,k))*tex(rho,Math.atan2(v/q,u),t)*dop(u/rho);
        if(v>=0){if(Id>.08){I=Id;shadow=false;lit=true;}}else if(Id>I){I=Id;lit=true;}}
      const c=shadow||!lit?0:tone(I*bright,px,py,blue);
      if(!c){if(r<1)buf.set(px,py,SHADOW);continue;}
      buf.set(px,py,c);if(I*bright>.35&&((px+py)&1)===0)light.add(px,py,c,.22*Math.min(1.3,I*bright));}
    const jetL=h.jet>.02?Rs*(4+6*h.jet):0;
    if(jetL>0){const nx=-st,ny=ct;
      for(let side=-1;side<=1;side+=2)for(let s=Rs*.9;s<jetL;s+=.7){const f=(s-Rs*.9)/(jetL-Rs*.9),wob=Math.sin(s*.45-t*40+side)*.35*f;
        const px=ax+nx*s*side+ct*wob,py=ay+ny*s*side+st*wob,w=(1+3.2*h.jet)*Math.pow(1-f,.6)*(.8+.2*Math.sin(t*70+s));
        if(w>1.3)buf.disc(px,py,w+.6,JET_EDGE);if(w>.6)buf.disc(px,py,w,JET);buf.disc(px,py,Math.max(.5,w*.6),JET_CORE);
        if(((s*2)|0)%5===0)light.glow(px,py,8+12*h.jet*(1-f),JET,.45*h.jet);}}
    light.glow(ax,ay,Rs*5.5,HOLE_LIGHT,.42*bright);light.glow(ax,ay,Rs*2.2,rgb(255,225,190),.25*bright);}
  /* Embervale: what's left of SF's lens without scene access, its darkening as a dithered void (opacity min(.85, .55 gloom) at the
     shadow, min(.5, .26 gloom) at 2.2 radii, nothing at 4.5) and its rim shade (0.5 at 0.9 radii to 0 at 1.6) */
  function drawGloom(buf,ax,ay,rs,g){if(rs<1||g<.02)return;const E=Math.ceil(rs*3.2),a0=Math.min(.85,.55*g)*.8,a1=Math.min(.5,.26*g)*.8;
    for(let py=Math.floor(ay-E);py<=Math.ceil(ay+E);py++)for(let px=Math.floor(ax-E);px<=Math.ceil(ax+E);px++){const d=Math.hypot(px+.5-ax,py+.5-ay)/rs;if(d<.9||d>3.2)continue;
      const a=d<2.2?lerp(a0,a1,(d-1)/1.2):a1*(1-(d-2.2)),rim=d<1.6?.5*(1.6-d)/.7:0,b=bayer(px,py);
      if(rim>b)buf.set(px,py,SHADOW);else if(a>b)buf.set(px,py,VOID);}}
  function drawBurst(buf,light,ax,ay,tilt,k,R,BK=1){const e=1-Math.pow(1-k,3),fade=1-k,rc=R*(.5+1.3*e);
    for(let py=Math.floor(ay-rc);py<=Math.ceil(ay+rc);py++)for(let px=Math.floor(ax-rc);px<=Math.ceil(ax+rc);px++){const d=Math.hypot(px+.5-ax,py+.5-ay)/rc;if(d>1)continue;
      const a=fade*(1-d*d);if(a<bayer(px,py))continue;buf.set(px,py,a>.55?JET_CORE:a>.3?BLUE_WHITE:VIOLET);}
    const ct=Math.cos(tilt),st=Math.sin(tilt),spikes=[[ct,st,1],[-ct,-st,1],[-st,ct,.8],[st,-ct,.8],[ct-st,st+ct,.45],[-ct+st,-st-ct,.45],[ct+st,st-ct,.45],[-ct-st,-st+ct,.45]];
    for(const [dx,dy,l] of spikes){const n=Math.hypot(dx,dy),L=R*(2+6*fade)*l;
      for(let r=rc*.6;r<rc+L;r+=.8){const f=(r-rc*.6)/(rc*.4+L),px=Math.round(ax+(dx/n)*r),py=Math.round(ay+(dy/n)*r);if(f>fade*1.2||(f>.6&&bayer(px,py)<f-.4))continue;buf.set(px,py,f<.35?JET_CORE:JET);}}
    light.glow(ax,ay,R*(4+5*e),JET_CORE,.9*fade*BK);light.glow(ax,ay,R*(6+6*e),VIOLET,.5*fade*BK);}
  function drawSlab(buf,s){const cx=s.x/PX,cy=s.y/PX,sx=1+2.2*s.pull,sy=1-.55*s.pull,cp=Math.cos(s.pullA),sp=Math.sin(s.pullA),ca=Math.cos(s.a),sa=Math.sin(s.a);
    const r=Math.ceil(Math.hypot(s.w,s.h)*.5*sx)+2,hw=s.w/2+.5,hh=s.h/2+.5,lit=mix(s.c,WHITE,.25),dark=mix(s.c,SHADOW,.45);
    for(let py=Math.floor(cy-r);py<=Math.ceil(cy+r);py++)for(let px=Math.floor(cx-r);px<=Math.ceil(cx+r);px++){const dx=px+.5-cx,dy=py+.5-cy,along=(dx*cp+dy*sp)/sx,across=(-dx*sp+dy*cp)/sy;
      const wx=along*cp-across*sp,wy=along*sp+across*cp,u=wx*ca+wy*sa,v=-wx*sa+wy*ca,au=Math.abs(u),av=Math.abs(v);if(au>hw+.7||av>hh+.7)continue;
      buf.set(px,py,au>hw||av>hh?OUTLINE:v<-hh+1?lit:v>hh-1?dark:s.c);}}
  const B={PLASMA:0,MOTE:1,DUST:2,INK:3};
  class HoleParticles{
    constructor(R,ground){this.list=[];this.R=R;this.ground=ground;}
    spawn(k,x,y,vx,vy,life,col=0,size=1){this.list.push({k,x,y,vx,vy,life,max:life,col,size});}
    attract(x,y,G,reach,swirl,eat,dt){let eaten=0;const soft=eat*eat;
      for(let i=this.list.length-1;i>=0;i--){const p=this.list[i],dx=x-p.x,dy=y-p.y,d2=dx*dx+dy*dy;if(d2>reach*reach)continue;const d=Math.sqrt(d2)||1;
        if(d<eat){this.list.splice(i,1);eaten++;continue;}
        const mote=p.k===B.MOTE,w=p.k===B.DUST?.55:mote?1.4:1,a=(G/(d2+soft))*Math.min(1,(reach-d)/(reach*.25))*w*dt,ux=dx/d,uy=dy/d;
        p.vx+=(ux-uy*swirl)*a;p.vy+=(uy+ux*swirl)*a;const drag=Math.min(.2,(1-d/reach)*(mote?1:3.2)*dt);p.vx-=p.vx*drag;p.vy-=p.vy*drag;}
      return eaten;}
    impulse(x,y,r,force){for(const p of this.list){const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy)||1;if(d>r)continue;const f=force*(1-d/r)*(p.k===B.DUST?.35:1);p.vx+=(dx/d)*f;p.vy+=(dy/d)*f-f*.3;}}
    update(dt){const L=this.list,R=this.R;
      for(let i=L.length-1;i>=0;i--){const p=L[i];if((p.life-=dt)<=0){L.splice(i,1);continue;}const g=this.ground(p.x);
        switch(p.k){
          case B.PLASMA:{p.vy+=GRAVITY*.45*dt;p.vx-=p.vx*2.2*dt;p.vy-=p.vy*2.2*dt;const ny=p.y+p.vy*dt;p.x+=p.vx*dt;if(p.vy>0&&p.y<=g&&ny>=g){p.vy=-p.vy*.45;p.vx*=.7;p.y=g-.5;}else p.y=ny;break;}
          case B.MOTE:p.vx-=p.vx*.6*dt;p.vy-=p.vy*.6*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case B.DUST:p.vx-=p.vx*4*dt;p.vy-=p.vy*4*dt+10*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case B.INK:{p.vy+=GRAVITY*dt;p.vx-=p.vx*.5*dt;const ny=p.y+p.vy*dt;p.x+=p.vx*dt;
            if(p.vy>0&&p.y<=g&&ny>=g){p.y=g-.5;if(p.vy>260&&R.chance(.45)){p.vy=-p.vy*.22;p.vx=p.vx*.55+R.range(-30,30);}else{p.vx=p.vy=0;p.life=Math.min(p.life,.5);}}else p.y=ny;break;}}}}
    draw(buf,light,layer){
      for(const p of this.list){if((p.k===B.DUST||p.k===B.INK)!==(layer==='back'))continue;const k=p.life/p.max,ax=p.x/PX,ay=p.y/PX,px=Math.floor(ax),py=Math.floor(ay);
        switch(p.k){
          case B.DUST:buf.alphaDisc(ax,ay,p.size*(.6+(1-k)*.9),p.col,Math.pow(k,1.3)*.7);break;
          case B.INK:if(k>.25||bayer(px,py)<k*4){buf.set(px,py,p.col);if(p.size>=2){buf.set(px+1,py,p.col);buf.set(px,py+1,scale(p.col,.85));buf.set(px+1,py+1,scale(p.col,.75));}}break;
          case B.PLASMA:{const hot=k>.5?PAL.white:k>.25?PAL.cyan:PAL.cyanDeep,sp=Math.hypot(p.vx,p.vy)||1,ux=p.vx/sp,uy=p.vy/sp,len=Math.min(9,1+sp*.011);
            buf.line(ax-ux*len,ay-uy*len,ax-ux*len*.4,ay-uy*len*.4,k>.5?hot:PAL.cyanDeep);buf.line(ax-ux*len*.45,ay-uy*len*.45,ax,ay,hot);light.glow(ax,ay,3,hot,.45*k);break;}
          case B.MOTE:{const sp=Math.hypot(p.vx,p.vy)||1,ux=p.vx/sp,uy=p.vy/sp,len=Math.min(16,.5+sp*.013)*p.size;if(k<.35&&bayer(px,py)>k/.35)break;
            buf.line(ax-ux*len,ay-uy*len,ax-ux*len*.35,ay-uy*len*.35,scale(p.col,.55));buf.line(ax-ux*len*.4,ay-uy*len*.4,ax,ay,p.col);light.glow(ax,ay,2.5+p.size,p.col,.4*k);break;}}}}}
  class Rings{
    constructor(q=1){this.rings=[];this.lights=[];this.q=q;this.ct=1;this.st=0;}
    ring(x,y,r0,r1,life,thick,color){this.rings.push({x,y,r0,r1,life,max:life,thick,color});}
    light(x,y,r,color,k,life){this.lights.push({x,y,r,color,k,life,max:life});}
    update(dt){for(const a of [this.rings,this.lights])for(let i=a.length-1;i>=0;i--)if((a[i].life-=dt)<=0)a.splice(i,1);}
    draw(buf,light){for(const r of this.rings){const k=r.life/r.max,e=1-Math.pow(k,3),rr=(r.r0+(r.r1-r.r0)*e)/PX,th=Math.max(1,r.thick*k+.4),al=Math.min(1,k*1.6);
        if(this.q<1)ellRing(buf,r.x/PX,r.y/PX,rr,th,r.color,al,this.q,this.ct,this.st);else ring(buf,r.x/PX,r.y/PX,rr,th,r.color,al);}
      for(const l of this.lights){const k=l.life/l.max;light.glow(l.x/PX,l.y/PX,(l.r/PX)*(.55+.45*k),l.color,l.k*k*k);}}}

  /* ---------- Embervale wrappers ---------- */
  let seed=1;
  const calm=()=>reduceMotion||!settings.shake;
  const rumble=()=>{const hold=holder(PXK.shake);let last=gameTime;return tr=>{const dt=Math.max(0,Math.min(.1,gameTime-last));last=gameTime;hold(tr,dt);};};
  const flashK=k=>(c,s)=>PXK.flash(k*(calm()?.5:1),s);
  /* any energy effect at a ground point (lab and other modules): o = SF options in effect units relative to the anchor */
  function pxEnergy(x,y,o={},b={}){return pxfx(c=>energy({...o,x:c.x+(o.dx||0)*PX,y:c.y-(o.up||0)*PX,to:o.toPx?[c.x+o.toPx[0]*PX,c.y-o.toPx[1]*PX]:o.to,ground:c.y,seed:seed++,shake:calm()?null:PXK.shake}),{x,y,w:b.w??160,hh:b.hh??128,ay:b.ay,pri:b.pri??1,ttl:b.ttl??8,lamp:b.lamp});}
  /* ORB RIDER on a game projectile */
  const RIDE={orb:{colors:'violet',radius:5.5},starorb:{colors:'pink',head:'bolt',size:.85,trailW:.75},parc:{colors:'violet',head:'bolt',size:.6,trailW:.5},voidorb:{colors:'void',radius:5,foe:true,pri:0}};
  function pxEnergyOrb(pr,k=RIDE[pr.kind]||RIDE.orb){
    return pxfx(c=>energy({kind:'rider',head:k.head,colors:k.colors,radius:k.radius,size:k.size,trailW:k.trailW,handle:c.handle,src:pr,ground:c.y,seed:seed++,pop:k.foe?.4:.55}),
      {x:pr.x,y:pr.y,w:PERF.lite?72:96,hh:56,ay:52,follow:pr,pri:k.pri??1,ttl:Math.max(1,(pr.life||2)+1),nolight:PERF.lite&&k.foe});}
  const riders=new Map();
  function rideTick(){if(!projs.length&&!riders.size)return;const cap=PERF.lite?6:12;
    for(const [pr,H] of riders)if(pr.dead||!PXFX.list.includes(H))riders.delete(pr);
    for(const pr of projs){const k=RIDE[pr.kind];if(!k||pr.dead||riders.has(pr))continue;
      if(riders.size>=cap){if(k.foe)continue;let far=null,fd=-1;for(const [q,H] of riders){if(!RIDE[q.kind].foe)continue;const d=Math.hypot(q.x-P.x,q.y-P.y);if(d>fd){fd=d;far=q;}}
        if(!far)continue;const H=riders.get(far);H.fade=.25;H.follow=null;H.stopped=true;riders.delete(far);}
      const H=pxEnergyOrb(pr,k);if(H)riders.set(pr,H);}}
  /* CHARGE at the hero's hands, for an Ultimate (or any charge pose: p.chargeT) */
  const DTR={fire:'ember',ice:'cyan',lightning:'cyan',sword:'cyan',wind:'jade',bow:'jade',light:'gold',hammer:'gold',dark:'violet',dagger:'violet',axe:'crimson','*':'pink'};
  function pxEnergyCharge(o={}){const p=o.follow||P;if(!p)return null;const C=o.colors||'violet',REL=o.charge??Math.max(.3,p.chargeT||.5),RS=o.size??.75;
    return pxfx(c=>{const hand=()=>({x:c.x+(p.face||1)*(o.hx??7)*PX,y:c.y-(o.hy??25)*PX,a:p.ang||0});
      return energy({kind:'charge',colors:C,actor:{hand},charge:REL,size:RS,reach:o.reach??.7,burst:o.burst??.7,rings:o.sf?RS:.42,lights:o.sf?RS*.6:.42,spread:o.sf?RS*.7:.5,seed:seed++,until:o.sf?null:()=>!(p.chargeT>0)||p.dead,
        shake:calm()?null:rumble(),flash:o.sf?flashK(.4):flashK(.25),
        release:()=>{if(PERF.lite)return;
          pxfx(cc=>energy({kind:'shock',colors:C,x:cc.x,y:cc.y,size:(o.ring??.8),seed:seed++}),{x:p.x,y:p.y,mode:'flat',w:150,hh:150,ax:75,ay:75,pri:1,ttl:1.2});}});},
      {x:p.x,y:p.y,w:160,hh:136,ay:124,follow:p,pri:2,ttl:REL+2.5,lamp:false});}
  /* BEAM along a ground line: from (x0, y0) at height h0 to the line's end at height h1 (world units) */
  function pxEnergyBeam(x0,y0,a,len,o={}){const x1=x0+Math.cos(a)*len,y1=y0+Math.sin(a)*len,h0=o.h0??60,h1=o.h1??4,fwd=o.fwd??12;
    const sx0=x0+Math.cos(a)*fwd,sy0=y0+Math.sin(a)*fwd,near=y1>sy0?[x1,y1]:[sx0,sy0],cp=CAM.cp,sp=CAM.sp;
    const pj=(x,h,y)=>[(x-near[0])/PIX,-(h*cp-(y-near[1])*sp)/PIX];
    const S=pj(sx0,h0,sy0),E=pj(x1,h1,y1),SG=pj(sx0,0,sy0),EG=pj(x1,0,y1),M=o.margin??28,TOP=o.top??34;
    const left=Math.min(S[0],E[0])-M,right=Math.max(S[0],E[0])+M,top=Math.min(S[1],E[1])-TOP,bot=Math.max(SG[1],EG[1])+6;
    const w=Math.min(512,Math.ceil(right-left)),hh=Math.min(512,Math.ceil(bot-top)),ax=Math.round(-left),ay=Math.round(-top);
    const U=q=>[(ax+q[0])*PX,(ay+q[1])*PX],Su=U(S),Eu=U(E),SGu=U(SG),EGu=U(EG);
    const ground=x=>Math.abs(EGu[0]-SGu[0])<4?EGu[1]:lerp(SGu[1],EGu[1],clamp((x-SGu[0])/(EGu[0]-SGu[0]))),lean=Eu[0]>Su[0]?1:-1;
    return pxfx(()=>energy({kind:'beam',colors:o.colors||'gold',actor:{hand:()=>({x:Su[0],y:Su[1],a})},to:Eu,ground,charge:o.charge??.3,hold:o.hold??.3,taper:o.taper??.3,
        width:o.width??6,flare:o.flare??1,lean,seed:seed++,aim:o.aim?[SGu,EGu]:null,glowEvery:PERF.lite?24:15,shake:calm()?null:PXK.shake,flash:o.flash?flashK(o.flash):null}),
      {x:near[0],y:near[1],w,hh,ax,ay,pri:2,ttl:(o.charge??.3)+(o.hold??.3)+(o.taper??.3)+3});}
  let prismK=0;
  const BEAMS={dawn:g=>({colors:'gold',width:g.len<400?4.5:6.5,hold:g.len<400?.2:.32,h0:g.len<400?40:60,flash:g.len<400?0:.12}),
    prismbeam:g=>({colors:'pink',width:6,hold:.36,aim:true,src:'boss'}),riftbeam:g=>({colors:'violet',width:6.5,hold:.4,aim:true,src:'boss'}),
    prismbeam2:g=>({colors:['cyan','pink','violet'][prismK++%3],width:5,hold:.4,h0:36,fwd:4})};
  function beamFromGround(g){const f=BEAMS[g.kind];if(!f||g.shape!=='line')return;const o=f(g);
    if(o.src==='boss'){let b=null,bd=80;for(const e of enemies){if(!e.boss||e.dead)continue;const d=Math.hypot(e.x-g.x,e.y-g.y);if(d<bd){bd=d;b=e;}}
      const s=b?b.s||1:1;o.h0=Math.round(70*s);o.fwd=24*s;o.flare=1.5;}
    pxEnergyBeam(g.x,g.y,g.a,g.len,{...o,charge:Math.max(.02,g.delay||0)});}
  /* BLACK HOLE over a 'singularity' ground */
  const holes=new Map();
  const zoneCol=()=>hex(ZDUST[curZone]||'#8a8a96');
  function pxEnergyHole(g,o={}){if(!g)return null;for(const [q,v] of holes)if(!PXFX.list.includes(v.H))holes.delete(q);if(holes.size>=(PERF.lite?1:3))return null;
    const RAD=(g.r||200)*.07,S=RAD/34,Rp=RAD/PX,hz=Math.round(Rp*3.1),D=g.dur||2.2,FORM=Math.min(.4,D*.2),COL=Math.min(.42,D*.22),LIFE=Math.max(.15,D-FORM-COL);
    const w=Math.min(256,Math.round(Rp*24)),hh=Math.min(200,Math.round(hz+Rp*10.5+8)),ay=hh-6;let fxo=null;
    const H=pxfx(c=>{const X=c.x,Y=c.y-hz*PX,gc=zoneCol();
      const sample=(x,y)=>{const wx=g.x+(x/PX-c.x/PX)*PIX,hp=(c.y-y)/PX;if(hp<3)return gc;
        for(const e of enemies){if(!live(e)||e.node)continue;if(Math.abs(e.x-wx)<e.r+6&&Math.abs(e.y-g.y)<70&&hp<34*(e.s||1))return hex(e.d.col||'#8a8a96');}return 0;};
      fxo=blackHole({x:X,y:Y,radius:RAD,scale:S,count:.4+.6*S,life:LIFE,form:FORM,collapse:COL,pull:g.pull||1,ground:c.y,groundColor:gc,sample,seed:seed++,flat:.5,
        slabs:!g.proc,burstK:1,burstGlow:.6,shake:calm()?null:rumble(),lampH:hz*PIX});return fxo;},
      {x:g.x,y:g.y,w,hh,ay,split:true,pri:2,ttl:D+4,lamp:true});
    if(H&&fxo)holes.set(g,{H,fx:fxo});return H;}
  function feedNear(x,y,amt,col){for(const [g,v] of holes){if(Math.hypot(x-g.x,y-g.y)<(g.r||200)*.55)try{v.fx.feed(amt,col);}catch(e){}}}

  /* ---------- wiring ---------- */
  {const o=ground;ground=function(g){const r=o(g);try{if(r&&r.kind==='singularity')pxEnergyHole(r);else if(r&&BEAMS[r.kind])beamFromGround(r);}catch(e){console.error(e);}return r;};}
  onEv('update',()=>{try{rideTick();}catch(e){console.error(e);}});
  onEv('pxUlt',ab=>{if(!P||!(P.chargeT>0))return;const d=dtOf(ab);pxEnergyCharge({colors:DTR[d]||'violet'});});
  onEv('killEnemy',e=>{if(holes.size&&e&&!e.node)feedNear(e.x,e.y,2+Math.min(6,(e.r||16)/6),hex(e.d&&e.d.col||'#8a8a96'));});
  onEv('pxHit',(e,dmg,src,opt)=>{if(holes.size&&opt&&opt.color==='#d8b8ff'&&!opt.big)feedNear(e.x,e.y,.4,hex(e.d&&e.d.col||'#8a8a96'));});
  onEv('resetWorld',()=>{riders.clear();holes.clear();});onEv('respawn',()=>{riders.clear();holes.clear();});

  /* ---------- lab ---------- */
  const shot=(x,y,kind,n,sp,o)=>{for(let k=0;k<n;k++){const an=(P.face<0?Math.PI:0)+(k-(n-1)/2)*.38;proj({x:P.x+Math.cos(an)*18,y:P.y+Math.sin(an)*18,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,dmg:0,kind,r:10,life:1.6,z:34,...o});}};
  pxlab('energy-orb','Plasma orb (hovering)','Energy','sf',(x,y)=>pxEnergy(x,y,{kind:'orb',colors:'pink',radius:12,up:30,life:2.6,firstZap:.5,every:[.6,.9]},{w:128,hh:96,ay:88}));
  pxlab('energy-charge','Charge (SF, 2.8 s)','Energy','sf',(x,y)=>pxEnergyCharge({charge:2.8,sf:true,colors:'cyan',size:.9}));
  pxlab('energy-ult','Ultimate charge (in game)','Energy','orig',(x,y)=>{P.chargeT=.6;return pxEnergyCharge({colors:'violet'});});
  pxlab('energy-beam','Beam (Dawnbreaker)','Energy','sf',(x,y)=>pxEnergyBeam(P.x,P.y,P.face<0?Math.PI:0,520,{colors:'gold',width:6.5,charge:.3,hold:.32,flash:.12}));
  pxlab('energy-beam-diag','Beam (Dawnbreaker, toward camera)','Energy','sf',(x,y)=>pxEnergyBeam(P.x,P.y,P.face<0?2.2:.95,520,{colors:'gold',width:6.5,charge:.3,hold:.32}));
  pxlab('energy-rift','Rift beams (Nyxara)','Energy','sf',(x,y)=>{for(let s=0;s<3;s++)ground({x:x+260,y:y-40,shape:'line',a:Math.PI+(s-1)*.62,len:680,w:70,delay:1,dmg:0,c:'#c07aff',kind:'riftbeam',fx:g=>{fxs.push({type:'lance',x:g.x,y:g.y,a:g.a,len:g.len,w:96,c:[.75,.4,1],t:0,max:.55});}});});
  pxlab('energy-prism','Prism beam (Glimmera)','Energy','sf',(x,y)=>ground({x:x+300,y,shape:'line',a:Math.PI,len:620,w:74,delay:.85,dmg:0,c:'#e0a8ff',kind:'prismbeam',fx:g=>{fxs.push({type:'lance',x:g.x,y:g.y,a:g.a,len:g.len,w:90,c:[.9,.65,1],t:0,max:.5});}}));
  pxlab('energy-bolts','Bolts (three, gold)','Energy','sf',(x,y)=>{const f=P.face||1;for(let k=0;k<3;k++)pxEnergy(P.x,P.y,{kind:'bolt',colors:'gold',up:22,dx:6*f,charge:.28+k*.42,toPx:[f*[96,80,104][k],[30,8,48][k]],speed:1100},{w:256,hh:120,ay:110});});
  pxlab('energy-arcorbs','Arcane Orbs (riders)','Energy','orig',(x,y)=>shot(x,y,'orb',6,300,{home:true,life:2.6}));
  pxlab('energy-starorb','Star orb / pet missile (riders)','Energy','orig',(x,y)=>{shot(x,y,'starorb',1,720,{life:.9,z:42});shot(x,y,'parc',2,560,{life:1,z:36});});
  pxlab('energy-voidorb','Void orbs (Nyxara, riders)','Energy','orig',(x,y)=>{for(let k=0;k<10;k++){const a=k/10*TAU;proj({x:x+120,y,vx:Math.cos(a)*230,vy:Math.sin(a)*230,dmg:0,team:'e',kind:'voidorb',r:12,life:2.6,z:40});}});
  pxlab('energy-hole','Black hole (Singularity)','Energy','sf',(x,y)=>ground({x:x+60,y,r:260,dur:2.2,tick:.25,team:'p',dmg:0,c:'#8a5aff',kind:'singularity',pull:1}));
  pxlab('energy-hole-proc','Black hole (void proc)','Energy','sf',(x,y)=>ground({x:x+40,y,r:140,dur:1.1,tick:.35,team:'p',dmg:0,pull:1,c:'#b48aff',kind:'singularity',proc:true}));
  return{pxEnergy,pxEnergyOrb,pxEnergyCharge,pxEnergyBeam,pxEnergyHole};})();
