/* PICKUP (Sprite Fusion "Pickup" and "Sparkle", MIT, ported; the loot beam original, after pixelfx's loot beam column, in Sprite Fusion's style):
   the pixel layer over everything the hero collects and everything worth collecting. Hearts, eggs, heart shards and loot hop into the
   hero's chest along an arc and pop there, their sparks curving back in; xp and gold motes that reach the hero end in small pops of their
   own (rate limited); unopened chests, ore and star nodes, crystal props and rare loot on the ground catch the light with Sparkle's
   twinkles; an opened chest throws one big Sparkle glint; loot of Epic rarity and up stands in a pillar of its rarity's light.
   Recipe (SF numbers in effect units, 2 per art px, gravity none unless stated):
   - Collect (SF Pickup with an actor, the hero): the item is the game's own sprite (heart, egg k, shard, the loot icon at its rarity;
     a salvaged common is the game's coin and spins, |cos 5.2t| wide, edge-on in step 4). Lift 0-0.1 s: up 8 units (outCubic),
     0.85 x 1.2. Flight 0.1-0.44 s: a quadratic arc to the chest (21 px over the feet), control point max(40, 0.35 dist) units above
     the higher end, progress^2.2, shrinking to 75 %, a 7-point trail (2 newest segments C2, older C3). Loot dropped by a foe or a chest
     flies in from where it fell (start clamped to the 144 x 120 px canvas that rides with the hero).
     Pop at 0.44 s: 0-0.05 s squash 1.5 x 0.6 in its own colours, 0.05-0.1 s stretch 0.7 x 1.45 all white; a white disc 8 -> 1 px over
     0.08 s; light r 30 px C2 0.9 -> 0 over 0.3 s; 14 sparks at even angles +-0.2 rad, 150-300 units/s, +40 up, drag 3, sag 60, homing
     on the chest after 0.12 s (target speed 380 + 900 age, turn min(1, dt (3 + 22 age))), absorbed within 9 units, each releasing 2
     rising motes (30-80 up, life 0.4-0.8, flicker life (0.6 + 0.4 sin 30 life) > 0.25). Embervale: the owner's rule bans shockwave
     rings, so SF's pop ring (2 -> 22 px) and its absorption rings (2 -> 14 px, every third) are drawn as Sparkle's own 8-ray flares
     (11 px and 4 px rays, outBack in over 0.1 s, smoothstep out by 0.3 s), the same white -> C2 -> C3 ray steps.
   - Mote pop: no item; at the chest, a 4 -> 1 px white disc over 0.06 s, a 6 px flare, 5-12 sparks (4 + 1.2 per mote that arrived in
     the window), light r 18. Gold uses SF's coin ramp, xp SF's orb ramp. At most one every 0.2 s, two alive.
   - Sparkle twinkles (SF Sparkle "Twinkle": size 9, 3 flares) on things worth taking, time x1.35, spread 0.36 (satellites 3-12 px
     out, particles in a 14 x 12 px ellipse, 12 twinkle spots): each thing glints every 1.8-3.6 s at a random point of its body. Up to
     16 at once within 700 units, pri 0, nolight. Warm ramp on chests and gold ore, cool on crystals (main flare in cool[2]/cool[3]),
     violet on star nodes and glimmer crystals, the rarity ramp on loot and eggs.
   - Chest glint (SF Sparkle "Glint", size 15, 7 flares) once over a chest as it opens, 22 px up.
   - Loot beam (r >= 3, a loop following the item): 104 / 136 / 150 px tall for Epic / Legendary / Mythic. The column's half width is
     (3.6 (1 - .45 u) + 2.8 e^(-h/7)) (1 + .2 beat), bands out from a white core: core < .2-.38 w white, < .47 C6, < .72 C5, < 1 C4,
     then C3 dithered by (1.55 - q)/.75 and the height fade; three strands drift through it a step lighter; a climb band every 30 px
     moves up at 3 loops/s; above 58 % it thins into a 1 px thread and above 66 % breaks into flickering dashes. A 2.4 s loop: two
     beats (at 8 % and 58 %) swell it 20 % and brighten its floor pool; a 4-point glint races up the shaft at 22-64 % (inQuad).
     A small 8-ray flare burns at its foot behind the item. 12 motes stream up round it (22-52 px/s, inner ones x1.5), a 3 px streak
     (white or C6 head, C4, C3), 22 % of them twinkle as plus stars. A flat floor pool under it (r 14 px, C6 / C5 / C4 by distance,
     dithered). Light: r 2w + 5 C5 every 8 rows (0.3), r 18 at the foot, mote and glint glows. Grows in 0.3 s, falls away 0.35 s.
     Ramps (dark -> bright): Epic #140a24 #2c1250 #4b1d86 #7330c0 #a050f0 #c890ff #ecd4ff #fff (pixelfx's own), Legendary #1e0c06
     #4a1f0e #8a3c14 #cf6a1f #f6a03c #ffcf6a #fff0b8 #fff, Mythic #1e0612 #480f2a #861d48 #c8326a #f5588e #ff8cb2 #ffd6e4 #fff.
   - Feel: a 0.05 shake at an item pop (none for motes, none with reduced motion). No flashes. */
const {pxPickup,pxPickupMote,pxPickupLoot,pxPickupSparkle,pxPickupBeam}=(function(){'use strict';
  const {Px,dot,Rng,scale,hex,cl:clamp,TAU,PXW:PX,hash,smooth,WHITE}=PXK;
  const outCubic=t=>1-Math.pow(1-clamp(t),3),outBack=(t,s=1.7)=>{const u=clamp(t)-1;return 1+(s+1)*u*u*u+s*u*u;};
  const pal=a=>a.map(hex);
  /* SF Pickup palettes: white, highlight, light, mid, dark, outline */
  const PP={gem:pal(['#ffffff','#e0faff','#7fe0ff','#2f9ee8','#1d4aa8','#101a3e']),orb:pal(['#ffffff','#e6ffe0','#8cff7a','#2fc95a','#157a46','#0b2e1f']),
    coin:pal(['#fffbe8','#ffec92','#ffd243','#f4a923','#a8601a','#3a1d0c']),heart:pal(['#ffffff','#ffe2e8','#ff9cac','#f2566e','#a82840','#3a0c18']),
    shard:pal(['#ffffff','#fff3d0','#ffc874','#f58a3a','#b8481c','#3e160a']),silver:pal(['#ffffff','#f2f4f8','#cdd2dc','#9aa2b4','#5c6274','#1e2230']),
    epic:pal(['#ffffff','#f4e6ff','#d8aaff','#a864f0','#6a2eb0','#22103e']),legend:pal(['#ffffff','#fff0c8','#ffca72','#f8962a','#bc5816','#3e1806']),
    myth:pal(['#ffffff','#ffe2ec','#ff9cba','#f8588c','#ae2a5a','#3a0c1e'])};
  const RARP=[PP.silver,PP.orb,PP.gem,PP.epic,PP.legend,PP.myth];
  /* SF Sparkle ramps, light -> dark (warm 7, cool 8), plus violet and rose ones built the same way */
  const WARM=pal(['#ffffff','#fffbe2','#fff0a6','#ffd862','#f6aa3c','#cf722b','#7e3c1f']),COOL=pal(['#ffffff','#dcfbff','#a6ecff','#62c8f4','#3a8bd8','#2c58aa','#212f6b','#151a3d']);
  const VIOL=pal(['#ffffff','#fbefff','#e8c8ff','#c890ff','#a050f0','#7330c0','#3a1660']),ROSE=pal(['#ffffff','#fff0f6','#ffc8de','#ff9ac0','#f0609a','#b03270','#561838']);
  const GREEN=pal(['#ffffff','#f0ffe6','#c6ffb0','#8cff7a','#4cd85c','#2a9446','#124a26']),SILV=pal(['#ffffff','#f6f8fc','#e2e6ee','#c4cad8','#9aa2b4','#6a7284','#383e4e']);
  const SPARK_RAR=[SILV,GREEN,COOL,VIOL,WARM,ROSE];
  /* loot beam ramps, dark -> bright */
  const BEAM=[null,null,null,pal(['#140a24','#2c1250','#4b1d86','#7330c0','#a050f0','#c890ff','#ecd4ff','#ffffff']),
    pal(['#1e0c06','#4a1f0e','#8a3c14','#cf6a1f','#f6a03c','#ffcf6a','#fff0b8','#ffffff']),pal(['#1e0612','#480f2a','#861d48','#c8326a','#f5588e','#ff8cb2','#ffd6e4','#ffffff'])];

  /* ---------- Sprite Fusion helpers (pickup.ts / sparkle.ts) ---------- */
  function blitScaled(buf,s,cx,cy,sx,sy,tint=0){const hw=s.w*sx/2,hh=s.h*sy/2;
    for(let y=Math.floor(cy-hh);y<=Math.ceil(cy+hh);y++)for(let x=Math.floor(cx-hw);x<=Math.ceil(cx+hw);x++){
      const u=Math.floor((x+.5-cx)/sx+s.w/2),v=Math.floor((y+.5-cy)/sy+s.h/2);if(u<0||v<0||u>=s.w||v>=s.h)continue;const c=s.data[v*s.w+u];if(c>>>24)buf.set(x,y,tint||c);}}
  function star(buf,light,x,y,arm,c){const px=Math.floor(x),py=Math.floor(y);
    for(let d=1;d<=arm;d++){const cc=d===arm&&arm>1?scale(c,.8):c;buf.set(px+d,py,cc);buf.set(px-d,py,cc);buf.set(px,py+d,cc);buf.set(px,py-d,cc);}
    buf.set(px,py,arm>0?WHITE:c);if(light)light.glow(x,y,3+arm*2.5,c,.4);}
  function flare(buf,light,x,y,L,ang,c1,c2,a=1){if(L<.8)return;
    for(let i=0;i<8;i++){const diag=i%2===1,an=ang+i*TAU/8,len=diag?L*.42:L,ca=Math.cos(an),sa=Math.sin(an);
      for(let d=0;d<=len;d+=.5){const u=d/len,c=diag?(u<.5?c1:c2):u<.3?WHITE:u<.65?c1:c2;dot(buf,x+ca*d,y+sa*d,c,a*(u<.7?1:1-(u-.7)/.35));
        if(!diag&&u<.22&&L>4){dot(buf,x+ca*d-sa,y+sa*d+ca,c1,a);dot(buf,x+ca*d+sa,y+sa*d-ca,c1,a);}}}
    dot(buf,x,y,WHITE,a);if(light){light.glow(x,y,4+L*1.4,c1,.5*a);light.glow(x,y,2+L*.5,WHITE,.4*a);}}
  /* a trail as a fixed ring of points (newest first), so nothing is allocated per update */
  function Trail(n){const a=new Float32Array(n*2);let k=0;return{get n(){return k;},push(x,y){a.copyWithin(2,0,(n-1)*2);a[0]=x;a[1]=y;if(k<n)k++;},pop(){if(k)k--;},x:i=>a[i*2],y:i=>a[i*2+1],clear(){k=0;}};}

  /* ---------- Sprite Fusion "Pickup" (collected at once: the game has already pulled the item to the hero). o.tg() is the chest in
     effect units, read every update; o.spr the item's pixels (none: a bare pop, the mote pop) ---------- */
  const LIFT=.1,FLY=.34;
  function pickup(o){
    const R=new Rng(o.seed??1),C=o.pal,WH=C[0],HI=C[1],LI=C[2],MI=C[3],DK=C[4],BURST=[WH,HI,LI],MOTE=[HI,LI],spr=o.spr||null,coin=!!o.coin,lite=!!o.lite;
    const N=o.n??14,FL=o.flare??11,DISC=o.disc??7,GL=o.glow??24;
    const sparks=[],motes=[],flares=[],trail=Trail(7);
    let t=0,popT=-1,px=o.x,py=o.y,absorbed=0;const tc=0,fx0=o.x,fy0=o.y;
    function pop(){popT=t;if(o.shake)o.shake(.05);flares.push({x:px,y:py,t,L:FL,a:R.range(0,.6)});
      for(let i=0;i<N;i++){const a=i/N*TAU+R.range(-.2,.2),sp=R.range(150,300)*(o.sp??1);
        sparks.push({x:px,y:py,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-40,life:R.range(.75,1.05),max:1.05,s:R.chance(.4)?2:1,c:R.pick(BURST),tr:Trail(5)});}}
    return{
      update(dt){t+=dt;const tg=o.tg();
        if(spr&&popT<0){const k=t-tc;
          if(k<LIFT)py=fy0-8*outCubic(k/LIFT);
          else{const u=Math.pow(clamp((k-LIFT)/FLY),2.2),sx=fx0,sy=fy0-8,mx=(sx+tg[0])/2,my=Math.min(sy,tg[1])-Math.max(40,Math.hypot(tg[0]-sx,tg[1]-sy)*.35);
            px=(1-u)*(1-u)*sx+2*(1-u)*u*mx+u*u*tg[0];py=(1-u)*(1-u)*sy+2*(1-u)*u*my+u*u*tg[1];trail.push(px,py);if(u>=1)pop();}}
        else trail.pop();
        for(let i=sparks.length-1;i>=0;i--){const s=sparks[i],age=s.max-s.life;s.tr.push(s.x,s.y);
          if((s.life-=dt)<=0){sparks.splice(i,1);continue;}
          if(age>.12){const dx=tg[0]-s.x,dy=tg[1]-s.y,d=Math.hypot(dx,dy)||1,want=380+900*age,k=Math.min(1,dt*(3+22*age));
            s.vx+=(dx/d*want-s.vx)*k;s.vy+=(dy/d*want-s.vy)*k;
            if(d<9){sparks.splice(i,1);if(absorbed++%3===0)flares.push({x:tg[0],y:tg[1],t,L:4,a:R.range(0,.8)});
              for(let j=0;j<(lite?1:2);j++)motes.push({x:tg[0]+R.range(-10,10),y:tg[1]+R.range(-14,10),vx:R.range(-12,12),vy:-R.range(30,80),life:R.range(.4,.8),max:.8,s:R.chance(.3)?1:0,c:R.pick(MOTE)});
              continue;}}
          else{s.vx-=s.vx*3*dt;s.vy-=s.vy*3*dt;s.vy+=60*dt;}
          s.x+=s.vx*dt;s.y+=s.vy*dt;}
        for(let i=motes.length-1;i>=0;i--){const m=motes[i];if((m.life-=dt)<=0){motes.splice(i,1);continue;}m.vx-=m.vx*1.5*dt;m.x+=m.vx*dt;m.y+=m.vy*dt;}
        for(let i=flares.length-1;i>=0;i--)if(t-flares[i].t>.32)flares.splice(i,1);},
      draw(fr){const buf=new Px(fr,fr.color),light=lite?null:new Px(fr,fr.light),ax=px/PX,ay=py/PX,alive=popT<0;
        for(let i=1;i<trail.n;i++)buf.line(trail.x(i-1)/PX,trail.y(i-1)/PX,trail.x(i)/PX,trail.y(i)/PX,i<3?LI:MI);
        if(alive&&spr){const flying=clamp((t-tc-LIFT)/FLY),spin=coin?Math.cos(t*5.2):1,sx=Math.max(.15,Math.abs(spin))*(1-.25*flying),sy=1-.25*flying;
          const lift=t-tc<LIFT?outCubic((t-tc)/LIFT):0;
          blitScaled(buf,spr,ax,ay,sx*(1-.15*lift),sy*(1+.2*lift),coin&&Math.abs(spin)<.3?DK:0);
          if(light){light.glow(ax,ay,12+2*Math.sin(t*4),MI,.3+.25*flying);light.glow(ax,ay,5,WH,.2);}}
        else if(!alive){const k=t-popT;
          if(spr&&k<.1)blitScaled(buf,spr,ax,ay,k<.05?1.5:.7,k<.05?.6:1.45,k<.05?0:WH);
          if(k<.08*DISC/7)buf.disc(ax,ay,DISC*(1-k/(.08*DISC/7))+1,WH);
          if(light&&k<.3)light.glow(ax,ay,GL,LI,.5*(1-k/.3));}
        for(const f of flares){const k=(t-f.t)/.32,L=f.L*outBack(clamp(k/.3),2)*(1-smooth(.4,1,k));flare(buf,light,f.x/PX,f.y/PX,L,f.a+k*.9,LI,MI);}
        for(const s of sparks){const k=s.life/s.max;for(let i=1;i<s.tr.n;i++)dot(buf,s.tr.x(i)/PX,s.tr.y(i)/PX,i<2?LI:MI,1-i/5);
          star(buf,light,s.x/PX,s.y/PX,Math.round(s.s*Math.min(1,k*3)),s.c);}
        for(const m of motes){const k=m.life/m.max;if(k*(.6+.4*Math.sin(m.life*30))>.25)star(buf,light,m.x/PX,m.y/PX,m.s,m.c);}},
      done:()=>popT>=0&&t-popT>.5&&sparks.length===0&&motes.length===0,
      init(){if(!spr)pop();return this;}};}

  /* ---------- Sprite Fusion "Sparkle": o.size main flare, o.flares satellites; Embervale knobs: spread (scales every distance), ts (time
     scale), ice (share of icy satellites), pk (particle rate), spots (twinkle spots), nolight ---------- */
  function sparkle(o){
    const H=o.warm??WARM,I=o.cool??COOL,SIZE=o.size??19,R=new Rng(o.seed??1),cx=o.x/PX,cy=o.y/PX,S=o.spread??1,TS=o.ts??1,NS=o.spots??26,lit=!o.nolight,hs=R.int(0,5000);
    const ps=[],sats=[];for(let i=0;i<(o.flares??11);i++){const a=R.range(0,TAU),d=R.range(9,32)*S;
      sats.push({x:cx+Math.cos(a)*d,y:cy+Math.sin(a)*d*.85,t0:.1+i*.17+R.range(0,.08),dur:R.range(.35,.6),L:R.range(4,8.5)*(o.satK??1),spin:R.range(-2,2),ice:R.chance(o.ice??.35)});}
    let t=0,pt=0;
    return{
      update(dt){t+=dt*TS;pt+=dt*TS;
        if(t<2.3&&R.chance(.35*(o.pk??1))){const a=R.range(0,TAU),d=R.range(4,40)*S;
          ps.push({x:o.x+Math.cos(a)*d*2,y:o.y+Math.sin(a)*d*1.7,vx:R.range(-10,10),vy:R.range(-14,6),life:R.range(.5,.9),max:.9,col:R.chance(.5)?H[1]:R.chance(.5)?I[2]:WHITE,size:R.range(.4,2.2),seed:R.next()*100});}
        for(let i=ps.length-1;i>=0;i--){const p=ps[i];if((p.life-=dt*TS)<=0){ps.splice(i,1);continue;}const d=dt*TS;p.vx-=p.vx*1.6*d;p.vy-=p.vy*1.6*d+10*d;p.x+=p.vx*d;p.y+=p.vy*d;}},
      draw(fr){const buf=new Px(fr,fr.color),light=lit?new Px(fr,fr.light):null;
        const grow=outBack(clamp(t/.25),2),gone=1-smooth(1.9,2.5,t),pulse=1+.35*Math.exp(-((t-.9)**2)/.01)+.3*Math.exp(-((t-1.5)**2)/.01);
        flare(buf,light,cx,cy,SIZE*grow*gone*pulse,t*.7,H[2],H[3]);
        if(light&&grow*gone>.1)light.glow(cx,cy,34*gone*Math.min(1,SIZE/19),H[2],.35*gone);
        for(const s of sats){const u=(t-s.t0)/s.dur;if(u<=0||u>=1)continue;flare(buf,light,s.x,s.y,s.L*Math.sin(u*Math.PI)**.7,s.spin*u+.4,s.ice?I[2]:H[2],s.ice?I[3]:H[3]);}
        for(let i=0;i<NS;i++){const f=Math.floor(t*12)+i*3;if(hash(f,i+hs)>=.3*gone)continue;const a=hash(i+hs,1)*TAU,d=(6+hash(i+hs,2)*40)*S;
          dot(buf,cx+Math.cos(a)*d,cy+Math.sin(a)*d*.8,hash(f,5)<.5?WHITE:H[1]);}
        for(const p of ps){const k=p.life/p.max,ax=p.x/PX,ay=p.y/PX,X=Math.floor(ax),Y=Math.floor(ay),tw=.6+.4*Math.sin(pt*(8+p.seed%5)+p.seed);
          if(p.size<1){if(tw*k>.25)buf.set(X,Y,tw>.8?WHITE:p.col);if(light)light.glow(ax,ay,3,p.col,.4*k*tw);continue;}
          const arm=Math.max(1,Math.round(p.size*tw*Math.min(1,k*3))),tip=scale(p.col,.75);
          for(let d=1;d<=arm;d++){const cc=d===arm&&arm>1?tip:p.col;buf.set(X+d,Y,cc);buf.set(X-d,Y,cc);buf.set(X,Y+d,cc);buf.set(X,Y-d,cc);}
          if(arm>=3)for(let j=0;j<4;j++)buf.set(X+(j&1?-1:1),Y+(j&2?-1:1),tip);
          buf.set(X,Y,WHITE);if(light)light.glow(ax,ay,3+arm*2,p.col,.5*k*tw);}},
      done:()=>t>2.5&&ps.length===0};}

  /* ---------- the loot beam (original, in SF's style; the column after pixelfx's loot beam): foot at (o.x, o.y), o.H px tall, o.C ramp
     dark -> bright. 'back' = the column, its glint and foot flare (behind the item); 'front' = the motes. A loop: stop() lets it fall ---------- */
  function lootBeam(o){
    const C=o.C,X0=o.x/PX,Y0=o.y/PX,HH=o.H,T=2.4,sd=(o.seed??1)%9973,NM=o.motes??12,W0=3.6,W1=2.8;
    const h2=(a,b)=>hash((a|0)*7919+(b|0)*131,sd);let t=0,st=-1;
    const beatAt=ph=>{let b=0;for(const r of [.08,.58]){const s=(((ph-r)%1)+1)%1*T;b=Math.max(b,s<.5?Math.exp(-s*7):0,Math.exp(-(T-s)*30));}return b;};
    function column(buf,light,f,ph,beat){const top=HH*f,gq=(ph-.22)/.42,gh=gq>0&&gq<1?4+(HH-4)*gq*gq:-100,shim=Math.floor(ph*24),flick=Math.floor(ph*12);
      for(let y=-1;y>=-top;y--){const h=-y-.5,u=h/HH,fade=1-smooth(.25,1,u),w=(W0*(1-.45*u)+W1*Math.exp(-h/7))*(1+.2*beat);
        const seg=Math.floor(h/3+h2(Math.floor(h/9),5)*2);if(u>.66&&h2(seg,flick+7)>1.75-u*1.65)continue;
        const thread=u>.58&&h2(seg,flick+9)<(u-.58)*3,climb=((h/30-ph*3)%1+1)%1<.1?1:0,tr=gh-h>0&&gh-h<18?1-(gh-h)/18:0,sh=h2(y,shim+3)<.05?1:0;
        const XX=thread?0:Math.ceil(w*1.6),cw=.2+.18*(1-smooth(0,.5,u)),top2=-y>top-6?(top-(-y))/6:1;
        for(let x=-XX;x<=XX;x++){const q=Math.abs(x)/w;let lvl=q<cw?0:q<.47?1:q<.72?2:q<1?3:4;
          for(let s=0;s<3;s++){const sx=(s-1)*w*.55+Math.sin(h*.09+ph*TAU*(s+1)+s*2)*.9;if(Math.abs(x-sx)<.5)lvl=Math.max(0,lvl-1);}
          if(sh&&lvl>0)lvl--;if(q<.72)lvl=Math.max(0,lvl-climb-(tr>.3?1:0));
          const a=(lvl<=2?1:(1.55-q)/.75*fade*1.2)*Math.min(1,top2);if(a<=0)continue;
          dot(buf,X0+x,Y0+y,thread?(u>.85?C[6]:WHITE):lvl===0?(u>.8?C[6]:WHITE):C[7-lvl],a);}
        if(light&&(y&7)===0)light.glow(X0+.5,Y0+y,w*2+5,C[5],.3*smooth(8,20,h)*(.3+.7*fade)*(1+.4*beat)*f);}
      if(gh>0&&gh<top){star(buf,light,X0,Y0-gh,Math.round(3.5*(1-gq*.5)),C[6]);if(light)light.glow(X0+.5,Y0-gh,12,C[5],.4);}
      flare(buf,light,X0+.5,Y0-5,(6+2.5*beat+Math.sin(ph*TAU*4)*.6)*f,0,C[6],C[5]);
      if(light)light.glow(X0+.5,Y0-10,18,C[4],(.15+.25*beat)*f);}
    function motes(buf,light,f){for(let i=0;i<NM;i++){const life=1+h2(i,1)*1.2,off=h2(i,2)*life,cyc=Math.floor((t+off)/life),age=(t+off)-cyc*life,r=(k)=>h2(i*31+cyc,k);
        const inner=r(3)<.3,side=r(4)<.5?-1:1,x0=inner?(r(5)-.5)*6:side*(4+r(5)*11),vy=(22+r(6)*30)*(inner?1.5:1);
        const x=x0+Math.sin(age*(1.5+r(7)*2)+r(8)*TAU)*1.6,y=-1-r(9)*9-vy*age,k=Math.min(1,age/.25,(life-age)/.5)*f;
        if(k<=0||-y>HH*f)continue;
        if(r(10)<.22){const tw=.5+.5*Math.sin(age*(9+r(11)*5)+r(12)*TAU);if(tw*k>.3)star(buf,light,X0+x,Y0+y,tw>.75?2:1,C[6]);continue;}
        dot(buf,X0+x,Y0+y,inner?WHITE:C[6],k*1.5);dot(buf,X0+x,Y0+y+1,inner?C[6]:C[4],k);dot(buf,X0+x,Y0+y+2,C[3],k*.6);
        if(light)light.glow(X0+x+.5,Y0+y+.5,3.5,C[5],.35*k);}}
    return{update(dt){t+=dt;if(st>=0)st+=dt;},stop(){if(st<0)st=0;},done:()=>st>=.35,
      draw(fr,layer){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light),f=st<0?outCubic(t/.3):1-clamp(st/.35),ph=(t%T)/T,beat=beatAt(ph);
        if(layer!=='front')column(buf,light,f,ph,beat);if(layer!=='back')motes(buf,light,f);}};}
  /* its floor pool: a flat decal, light C5 and dithered C6 / C5 / C4 by distance, brighter on the beat */
  function beamPool(o){const C=o.C,X0=o.x/PX,Y0=o.y/PX,T=2.4;let t=0,st=-1;
    return{update(dt){t+=dt;if(st>=0)st+=dt;},stop(){if(st<0)st=0;},done:()=>st>=.35,
      draw(fr){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light),f=st<0?outCubic(t/.3):1-clamp(st/.35),ph=(t%T)/T;let b=0;
        for(const r of [.08,.58]){const s=(((ph-r)%1)+1)%1*T;b=Math.max(b,s<.6?Math.exp(-s*5):0);}
        const R0=14*(1+.12*b);
        for(let y=-16;y<=16;y++)for(let x=-16;x<=16;x++){const q=Math.hypot(x+.5,y+.5)/R0;if(q>=1)continue;const a=(1-q)**1.4*(.55+.4*b)*f*1.3;
          dot(buf,X0+x,Y0+y,q<.28?C[6]:q<.6?C[5]:C[4],a);}
        light.glow(X0,Y0,18,C[5],(.22+.25*b)*f);}};}

  /* ---------- Embervale wrappers ---------- */
  let seed=1,clock=0;
  const pops=[],motePops=[],glints=[];
  const prune=L=>{for(let i=L.length-1;i>=0;i--)if(L[i].dead)L.splice(i,1);};
  const CH=50,lite=()=>PERF.lite;
  /* the game's sprite as plain pixels (nearest, scale 1): null when the atlas keeps it as a texture only */
  function sprOf(name,fi){const L=ATL.frames&&ATL.frames[name],f=L&&L[fi||0];if(!f)return null;const S=pxSilOf(f,1,1,1,false);return S?{w:S.w,h:S.h,data:S.data}:null;}
  const shk=tr=>{if(!reduceMotion)PXK.shake(tr);};
  /* an item collected by the hero: name/fi its sprite, pal its SF palette, (x, h, y) where it was (world units) */
  function pxPickup(name,fi,palette,x,h,y,o={}){if(!P||P.dead)return null;prune(pops);if(pops.length>=4)return null;
    const spr=sprOf(name,fi)||null,W=144,HH=120,AX=72,AY=104,FY=16;
    const Hd=pxfx(c=>{const H=c.handle,s=pxProj(H,x,h,y),tg=pxProj(H,P.x,CH,P.y);
        const sx=clamp(s[0],10*PX,(W-10)*PX),sy=clamp(s[1],10*PX,(AY-4)*PX);
        return pickup({x:sx,y:sy,pal:palette,spr,coin:!!o.coin,seed:seed++,n:lite()?8:14,lite:lite(),tg:()=>tg,shake:o.shake===false?null:shk}).init();},
      {follow:P,fy:FY,w:W,hh:HH,ax:AX,ay:AY,pri:1,ttl:3,nolight:lite()});
    if(Hd)pops.push(Hd);return Hd;}
  /* a mote pop at the hero's chest: col '#ffd84a' gold (coin ramp) or xp (orb ramp); n sparks */
  function pxPickupMote(col,n=8){if(!P||P.dead)return null;prune(motePops);if(motePops.length>=2)return null;
    const palette=col==='#ffd84a'?PP.coin:PP.orb;
    const Hd=pxfx(c=>{const tg=pxProj(c.handle,P.x,CH,P.y);
        return pickup({x:tg[0],y:tg[1],pal:palette,seed:seed++,n:Math.round(clamp(n,5,12)*(lite()?.6:1)),flare:6,disc:4,glow:18,sp:.8,lite:lite(),tg:()=>tg}).init();},
      {follow:P,fy:12,w:96,hh:88,ax:48,ay:78,pri:1,ttl:2.5,nolight:lite()});
    if(Hd)motePops.push(Hd);return Hd;}
  /* loot taken straight into the bag (dropLoot): its icon at its rarity flies in from where it fell; gold: the coin, spinning */
  function pxPickupLoot(it,x,y,gold){if(!it)return null;
    return gold?pxPickup('coin',0,PP.coin,x,22,y,{coin:true,shake:false}):pxPickup(itemIcon(it),it.r,RARP[it.r]||PP.gem,x,26,y);}
  /* a Sparkle at a world point (x, h, y): kind 'twinkle' (small, ambient) or 'glint' (SF's Glint) */
  function pxPickupSparkle(x,h,y,kind='twinkle',o={}){
    if(kind==='glint')return pxfx(c=>sparkle({x:c.x,y:c.y,size:o.size??15,flares:o.flares??7,spread:o.spread??.7,warm:o.warm,cool:o.cool,seed:seed++}),
      {x,y,h,w:96,hh:96,ax:48,ay:48,pri:1,ttl:4,nolight:lite()});
    prune(glints);if(glints.length>=16)return null;
    const Hd=pxfx(c=>sparkle({x:c.x,y:c.y,size:o.size??8,flares:3,spread:.36,ts:1.35,pk:.45,spots:12,ice:o.ice??.3,warm:o.warm,cool:o.cool,nolight:true,seed:seed++}),
      {x,y,h,w:48,hh:48,ax:24,ay:24,pri:0,ttl:3,nolight:true});
    if(Hd)glints.push(Hd);return Hd;}
  /* the loot beam over a ground item k (follows it until it is taken) */
  function pxPickupBeam(k,r){const C=BEAM[Math.min(5,r)];if(!C)return null;const HHt=r>=5?150:r>=4?136:104,hh=HHt+18,sd=seed++;
    const Hb=pxfx(c=>lootBeam({x:c.x,y:c.y,H:HHt,C,seed:sd}),{follow:k,w:56,hh,ax:28,ay:hh-3,split:true,pri:1,ttl:Infinity,every:2});
    const Hp=pxfx(c=>beamPool({x:c.x,y:c.y,C}),{follow:k,mode:'flat',w:40,hh:40,ax:20,ay:20,pri:0,ttl:Infinity,every:2});
    return Hb?{b:Hb,p:Hp}:null;}

  /* ---------- wiring ---------- */
  /* collected pickups: anything that died close to the hero inside updatePickups was taken (the game's own rule: d < 32) */
  const COLL={heart:k=>pxPickup('heart',0,PP.heart,k.x,(k.z||0)+18,k.y),egg:k=>pxPickup('egg',k.k|0,RARP[[1,2,3,4,5][k.k|0]]||PP.gem,k.x,(k.z||0)+16,k.y),
    shard:k=>pxPickup('shard',0,PP.shard,k.x,(k.z||0)+24,k.y),item:k=>pxPickup(itemIcon(k.it),k.it.r,RARP[k.it.r]||PP.gem,k.x,(k.z||0)+20,k.y)};
  {const o=updatePickups;updatePickups=function(dt){const n=pickups.length,was=n?pickups.slice():null;const r=o(dt);
    if(was&&P)try{for(const k of was)if(k.dead&&Math.hypot(P.x-k.x,P.y-k.y)<48&&COLL[k.type])COLL[k.type](k);}catch(e){}return r;};}
  /* loot that goes straight to the bag (foes, chests, rifts): collectItem inside dropLoot is noted, then flies in from the drop */
  let dl=null;
  {const o=collectItem;collectItem=function(it,q){const r=o(it,q);if(dl&&it&&dl.length<4)dl.push([it,!gear.bag.includes(it)]);return r;};}
  {const o=dropLoot;dropLoot=function(x,y,op){dl=[];let r;try{r=o(x,y,op);}finally{const L=dl;dl=null;
      try{if(L&&L.length&&P){L.sort((a,b)=>b[0].r-a[0].r);for(let i=0;i<Math.min(2,L.length);i++)pxPickupLoot(L[i][0],x+(i?18:0),y,L[i][1]);}}catch(e){}}return r;};}
  /* xp / gold motes: the game's own homing particles are tracked; when they reach the hero the arrivals are counted and popped */
  const mt=[],mtT=[],late=[],arr={gold:0,xp:0};let lastPop=-9;
  onEv('pxMotes',(x,y,col,n)=>{if(col!=='#ffd84a'&&col!=='#8af08a')return;let k=0;
    for(let i=parts.length-1;i>=0&&k<n&&mt.length<96;i--){const q=parts[i];if(q.home&&q.c===col&&q.life>=q.max-1e-6){mt.push(q);mtT.push(clock);k++;}else break;}
    if(!k&&late.length<8)late.push(clock+.8,col==='#ffd84a'?1:0);});
  onEv('pxChest',o=>{if(o)pxPickupSparkle(o.x,22*PIX,o.y+4,'glint');});
  /* glints: things worth taking within 700 units glint every 1.8-3.6 s, at most 16 at once */
  const nextG=new WeakMap();let scanT=0;
  const HOLD=[];
  function want(o,x,y,ox,h0,h1,opt){let nt=nextG.get(o);if(nt===undefined){nextG.set(o,clock+Math.random()*2.2);return;}
    if(clock<nt)return;nextG.set(o,clock+1.8+Math.random()*1.8);const g=pxPickupSparkle(x+(Math.random()*2-1)*ox*PIX,(h0+Math.random()*(h1-h0))*PIX,y+2,'twinkle',opt);if(!g)nextG.set(o,clock+.4);}
  const CRYS=[{warm:COOL,ice:.5},{warm:VIOL,ice:.35},{warm:ROSE,ice:.25}],GOLD={warm:WARM,ice:.12},STAR={warm:VIOL,ice:.35};
  onEv('update',dt=>{clock+=dt;
    /* mote arrivals */
    for(let i=mt.length-1;i>=0;i--){const q=mt[i];if(q.life<=0||clock-mtT[i]>3.2){if(q.life<=0&&P&&Math.hypot(P.x-q.x,P.y-q.y)<44)arr[q.c==='#ffd84a'?'gold':'xp']++;mt.splice(i,1);mtT.splice(i,1);}}
    for(let i=late.length-2;i>=0;i-=2)if(clock>=late[i]){arr[late[i+1]?'gold':'xp']+=4;late.splice(i,2);}
    if(P&&!P.dead&&(arr.gold||arr.xp)&&clock-lastPop>=.2){const g=arr.gold>=arr.xp,n=g?arr.gold:arr.xp;if(pxPickupMote(g?'#ffd84a':'#8af08a',4+Math.round(n*1.2))){lastPop=clock;if(g)arr.gold=0;else arr.xp=0;}}
    if((scanT-=dt)>0||!P)return;scanT=.25;
    /* loot beams over Epic+ ground loot */
    for(const k of pickups)if(k.type==='item'&&k.it&&k.it.r>=3&&!k.dead&&!HOLD.some(b=>b.k===k)&&Math.hypot(k.x-P.x,k.y-P.y)<1100){const b=pxPickupBeam(k,k.it.r);if(b)HOLD.push({k,b});}
    for(let i=HOLD.length-1;i>=0;i--){const q=HOLD[i];if(q.k.dead||q.b.b.dead||!pickups.includes(q.k)){pxStop(q.b.b);pxStop(q.b.p);HOLD.splice(i,1);}}
    prune(glints);if(glints.length>=16)return;
    const R2=700*700,tx=Math.floor(P.x/T),ty=Math.floor(P.y/T),RT=15;
    for(const k of pickups){if(k.dead)continue;const d2=(k.x-P.x)**2+(k.y-P.y)**2;if(d2>R2)continue;
      if(k.type==='item'&&k.it&&k.it.r>=2)want(k,k.x,k.y,5,4,14,{warm:SPARK_RAR[k.it.r],ice:.2,size:8});
      else if(k.type==='egg')want(k,k.x,k.y,4,4,12,{warm:SPARK_RAR[(k.k|0)+1]||WARM,ice:.2,size:7});}
    for(const e of enemies){if(!e.node||e.broken||e.dead||e.hidden)continue;if((e.x-P.x)**2+(e.y-P.y)**2>R2)continue;
      want(e,e.x,e.y,10,6,e.type==='starnode'?26:22,e.type==='starnode'?STAR:GOLD);}
    for(let y=ty-RT;y<=ty+RT;y++)for(let x=tx-RT;x<=tx+RT;x++){if(x<0||y<0||x>=MW||y>=MH)continue;const o=objGrid[idx(x,y)];if(!o)continue;
      if((o.x-P.x)**2+(o.y-P.y)**2>R2)continue;
      if(o.type==='chest'){if(!chestsOpened.has(o.id))want(o,o.x,o.y,9,8,18,{warm:WARM,ice:.15,size:8});}
      else if(o.type==='prop'&&(o.spr==='crystal'||o.spr==='crystal2')){const c2=o.spr==='crystal2';want(o,o.x,o.y,c2?9:14,10,c2?36:42,c2?CRYS[o.fi|0]||CRYS[0]:CRYS[0]);}
      if(glints.length>=16)break;}});
  onEv('pxClear',()=>{pops.length=0;motePops.length=0;glints.length=0;HOLD.length=0;mt.length=0;mtT.length=0;late.length=0;arr.gold=arr.xp=0;});
  onEv('resetWorld',()=>{mt.length=0;mtT.length=0;late.length=0;});

  /* ---------- lab ---------- */
  const near=(x,y)=>[P.x+(x>P.x?34:-34),y-6];
  pxlab('pickup-heart','Heart collected','Pickups','sf',(x,y)=>{const [a,b]=near(x,y);pxPickup('heart',0,PP.heart,a,18,b);});
  pxlab('pickup-egg','Egg collected','Pickups','sf',(x,y)=>{const [a,b]=near(x,y);pxPickup('egg',2,RARP[3],a,16,b);});
  pxlab('pickup-shard','Heart shard collected','Pickups','sf',(x,y)=>{const [a,b]=near(x,y);pxPickup('shard',0,PP.shard,a,24,b);});
  pxlab('pickup-loot','Legendary loot flies in','Pickups','sf',(x,y)=>{const it=makeItem('weapon',4,P.lvl);pxPickupLoot(it,x+30,y,false);});
  pxlab('pickup-coin','Salvaged coin flies in','Pickups','sf',(x,y)=>pxPickupLoot({r:0},x,y,true));
  pxlab('pickup-gold','Gold motes pop','Pickups','sf',()=>pxPickupMote('#ffd84a',10));
  pxlab('pickup-xp','Xp motes pop','Pickups','sf',()=>pxPickupMote('#8af08a',8));
  pxlab('pickup-twinkle','Chest twinkle','Pickups','sf',(x,y)=>{for(let i=0;i<3;i++)pxPickupSparkle(x+(i-1)*40,(10+i*5)*PIX,y,'twinkle',i===1?{warm:COOL,ice:.5}:{warm:WARM,ice:.15});});
  pxlab('pickup-glint','Chest opens: glint','Pickups','sf',(x,y)=>pxPickupSparkle(x,22*PIX,y,'glint'));
  pxlab('pickup-beam','Epic and Legendary loot beams','Pickups','orig',(x,y)=>{for(const [r,dx] of [[3,-30],[4,50]]){const it=makeItem('weapon',r,P.lvl);pickups.push({type:'item',it,x:x+dx,y,z:0,vz:0,vx:0,vy:0,t:-60});}});
  return{pxPickup,pxPickupMote,pxPickupLoot,pxPickupSparkle,pxPickupBeam};})();
