/* MOVEMENT (Sprite Fusion "Dash & Blink", MIT, ported; the game wiring, the voidling charge-blink and the ramps for the dash abilities
   original, in Sprite Fusion's style): the pixel layer over every fast move of the game. A dash leaves afterimages shaded from the
   character's own sprite pixels, speed lines and a skid of dust, sparks and smoke; a blink pulls the character apart in light, darts
   across as a streak and streams it back in. Wired to the hero's dodge ('dodge' event: the roll, the Arcanist's floating Drift, perfect
   dodges), every dash ability (a new P.dash: Dash Slash, Recoil, Tumble, Charge, Wyvern Dive, the comet, the chained ultimates), the
   Arcanist's Blink (ABIL.blink) and the voidlings' and hollows' marked blinks (e.g1a_bl: the 0.42 s mark is SF's charge).
   Recipe (SF numbers in effect units, 2 per art px; times from the move's start):
   - Dash timeline: no wind-up (the game moves at once). t 0: take-off at the feet, 12 dust puffs (spread 1.6 along the dash axis),
     6 smoke puffs thrown back, a flash ellipse rx 5 -> 15 px, ry 2.5 and a ring rx 6 -> 24, ry 2 -> 5, both dithered out over 0.08 s.
     While the game's P.dash lives (0.13-0.34 s): an afterimage on the first tick, then each 40-44 units moved after 0.06 s, each lives
     0.4 s; 4 speed lines a tick (2 in lite), 0.2 s each; a glow r 32-40 px in colors[3] at 0.35 on the body. At the stop: skid speed
     700 (roll 490) falling 4600/s^2 to 60, throwing dust, sparks (60 %, roll 30 %) and smoke forward every tick; a skid mark from
     56 units behind to 10 ahead of the stop, 0.8 alpha, dithered away 0.6-1.4 s after; done 1.2 s after the stop once particles end.
   - Blink timeline (the game teleports at once, so SF's 0.55 s crossing is pressed into 0.31 s): voidlings first charge for their
     0.42 s mark (outline crackle 35 -> 95 % re-rolled 30/s, plasma sparks sucked in from 40-80 units, a glow r 30 growing to 0.5).
     OUT (cast, or the voidling's jump): screen flash 0.18 (hero only), a burst light r 75 -> 41 px in C[3] 0.75 k^2 over 0.3 s, 85 % of
     the silhouette's pixels fly off (0.35-0.8 s), a ring opens at the feet (0.45 s). OUT..+0.1 the silhouette squeezes into its centre
     column, +0.1..+0.18 the line left shrinks away, +0.18..+0.9 an afterimage (A[2] body, A[4] outline) at 45 % fades. +0.02..+0.22 a
     streak darts from chest to chest (head out-expo, tail 0.25 behind). IN = OUT + 0.05: 80 % of the pixels stream in from 14-34 px
     round, landing at ARRIVE = IN + 0.26; a white line opens to the figure's height (first 55 %), then the silhouette unfolds sideways,
     white from 85 %. ARRIVE - 0.02 a ring at the arrival, ARRIVE 30 stars (voidling 18) and a light shake. The character's own sprite is
     hidden from OUT to ARRIVE (the hero's through pushS, a voidling's through its spawn-in scale), so the effect is the character then.
   - Layers: dash canvas split: back = dust, smoke, skid mark, afterimages, speed lines; front = take-off flash and ring, sparks, stars,
     body glow. It stands 4 units behind the nearer end of the dash so the trail never covers the hero. Blink canvas: everything front,
     standing 4 units in front of the nearer of start and arrival. Light buffer: (1 - d/r)^2 k glows (sparks r 3, stars r 3 + 2 arm).
   - Palette: dash DASH #ffffff #ccf6ff #a3dcff #5eb0ff #5b6cff #773ae4 #4c25ab (the dodge roll and blue dashes); the Drift and violet
     dashes ARCANE's first 7; gold #ffffff #fff6cc #ffe08a #ffc24a #f08f2c #c4561f #7a2c1c, wind #ffffff #e2fff0 #aef5cf #66dca6 #2fae8a
     #1f7a7e #1c4a5e, ember #ffffff #ffe6d6 #ffb39a #ff7058 #d8404a #9a2440 #5a1834 picked from the ability's ghost colour. Afterimages:
     each sprite pixel sorted by luminance into dark (< 60, its outline), mid (< 170), light; a 3-step window slides down the ramp with
     age (light C[0] mid C[1] dark C[3], ... old C[3] C[4] C[6]). Speed lines first 3 px C[0], to 40 % C[1], rest C[3]. Blink: ICE
     #ffffff #dcfbff #a6ecff #62c8f4 #3a8bd8 #2c58aa #212f6b #151a3d with ARCANE #ffffff #f4ddff #d6a0ff #a862ff #773ae4 #4c25ab #2b1569
     #170b3b (hero); voidlings ARCANE with a void pink #ffffff #ffe2f7 #ffb8f0 #f07ad8 #c04ab8 #7e2a8a #45185a #220c30 (hollows swapped).
     Ground: take-off dust = the zone's dust x0.92 mixed 35 % to #968c96; skid dust and smoke = zone dust x0.62 mixed 50 % to #605470,
     smoke ageing through #7b6f72 #5d5660 #433d48 #2b2630 #1a171e; skid mark zone x0.38 mixed 50 % to #221a33. Sparks #fff3a6 #ffe26b
     #ff8a2a, tail #f2561d; plasma white, #7ff3ff, #1ab8e6.
   - Shapes and motion: afterimages are the sprite as captured (a rolling hero's ghost is turned to the roll's angle). Speed lines 1 px,
     16-64 px x (dash length / 130 px, 0.5..1), 4-16 px behind, spread across the body (44 px up for a sideways dash, 20 px across for
     an up or down one), kept inside the canvas. Dust: drag 4, rising 10/s^2, alpha discs. Smoke: rises 32/s^2, sways, three alpha discs,
     peak 0.58. Sparks 0.45 g, drag 2.2, bounce x0.45, two-segment streaks 1 + speed x0.011 px (max 9). Flying pixels: sideways 3-9x
     their distance from the centre column +-14 px/s, up 10-60 px/s rising 60 px/s^2, drag 2.5. Stars: plus shapes, arms to 2 px.
     Everything near a canvas side is dithered out before the edge.
   - Feel: dash abilities shake 0.12 at the stop (the roll and Drift none: the game kicks the camera itself); a perfect dodge adds a white
     ring and 16 ice stars. Blink: flash 0.18 rgb(200,240,255) at the vanish, shake 0.08 on arrival. Caps: 4 dashes, 4 blinks live. */
const {pxMovementDash,pxMovementBlink}=(function(){'use strict';
  const {Px,dot,bayer,Rng,mix,scale,ramp,hex,rgb,cl:clamp,TAU,PXW:PX,hash,outExpo,WHITE}=PXK;
  const lerp=(a,b,t)=>a+(b-a)*t,outCubic=t=>1-Math.pow(1-clamp(t),3),smooth=PXK.smooth,H=a=>a.map(hex);
  const DASH=H(['#ffffff','#ccf6ff','#a3dcff','#5eb0ff','#5b6cff','#773ae4','#4c25ab']);
  const ICE=H(['#ffffff','#dcfbff','#a6ecff','#62c8f4','#3a8bd8','#2c58aa','#212f6b','#151a3d']);
  const ARCANE=H(['#ffffff','#f4ddff','#d6a0ff','#a862ff','#773ae4','#4c25ab','#2b1569','#170b3b']),ARC7=ARCANE.slice(0,7);
  const VOIDP=H(['#ffffff','#ffe2f7','#ffb8f0','#f07ad8','#c04ab8','#7e2a8a','#45185a','#220c30']);
  const GOLD=H(['#ffffff','#fff6cc','#ffe08a','#ffc24a','#f08f2c','#c4561f','#7a2c1c']);
  const WIND=H(['#ffffff','#e2fff0','#aef5cf','#66dca6','#2fae8a','#1f7a7e','#1c4a5e']);
  const EMBER=H(['#ffffff','#ffe6d6','#ffb39a','#ff7058','#d8404a','#9a2440','#5a1834']);
  const DUST=rgb(96,84,112),SKID=hex('#221a33');
  const SPARKS={hot:hex('#fff3a6'),yellow:hex('#ffe26b'),orange:hex('#ff8a2a'),tail:hex('#f2561d')},PLASMA={cyan:hex('#7ff3ff'),deep:hex('#1ab8e6')};
  const SMOKE_RAMP=H(['#7b6f72','#5d5660','#433d48','#2b2630','#1a171e']);
  const GRAVITY=1900,K={SPARK:0,PLASMA:1,STAR:2,SMOKE:3,DUST:4};
  /* 0 at the canvas sides, 1 at m px inside: what reaches an edge is dithered out instead of cut */
  const edge=(b,x,y,m)=>clamp(Math.min(x-b.ox,b.ox+b.w-x,y-b.oy,b.oy+b.h-y)/m);
  function ellipse(buf,cx,cy,rx,ry,c,a=1){if(rx<=0||ry<=0)return;
    for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry;if(dx*dx+dy*dy<=1&&(a>=1||a>bayer(x,y)))buf.set(x,y,c);}}
  function ringE(buf,cx,cy,rx,ry,thick,c,a=1){const n=Math.ceil(Math.max(rx,ry)*TAU*1.3);
    for(let j=0;j<n;j++){const an=j/n*TAU,ca=Math.cos(an),sa=Math.sin(an);for(let off=-thick/2;off<=thick/2;off+=.5)dot(buf,cx+ca*(rx+off),cy+sa*(ry+off*(ry/Math.max(1,rx))),c,a);}}
  function shade(c){const l=(c&255)*.3+((c>>>8)&255)*.59+((c>>>16)&255)*.11;return c>>>24!==255?0:l<60?1:l<170?2:3;}
  /* Sprite Fusion's shade() over a whole sprite, with the mid/light split moved up to the sprite's own 70th percentile when it is a
     bright one (the white-haired hero would otherwise come out as a white blob): outline < 60, then mid, then the brightest ~30 % */
  const LH=new Uint16Array(32);
  function shadeMask(d,m){LH.fill(0);let n=0;for(let i=0;i<d.length;i++){const c=d[i];if(c>>>24!==255)continue;const l=(c&255)*.3+((c>>>8)&255)*.59+((c>>>16)&255)*.11;if(l>=60){LH[Math.min(31,l>>3)]++;n++;}}
    let k=0,acc=0;for(;k<32;k++){acc+=LH[k];if(acc>=n*.7)break;}const L2=Math.max(170,(k+1)*8);
    for(let i=0;i<d.length;i++){const c=d[i];if(c>>>24!==255){m[i]=0;continue;}const l=(c&255)*.3+((c>>>8)&255)*.59+((c>>>16)&255)*.11;m[i]=l<60?1:l<L2?2:3;}}
  function drawSil(buf,s,cx,sx,c,edgeC,a,dx=0,dy=0){if(sx<=.02)return;const half=s.w/2+2;
    for(let y=0;y<s.h;y++)for(let x=Math.floor(cx-half*sx);x<=Math.ceil(cx+half*sx);x++){
      const i=Math.round(cx+(x+.5-cx)/sx-.5)-s.x0,v=i<0||i>=s.w?0:s.px[y*s.w+i];if(v)dot(buf,x+dx,s.y0+y+dy,v===1?edgeC:c,a);}}

  /* ---------- Sprite Fusion's particles (one ground line per particle: a dash can run up or down the screen) ---------- */
  class Particles{
    constructor(R){this.list=[];this.t=0;this.R=R;}
    spawn(k,x,y,vx,vy,life,col=0,size=1,g=1e9){this.list.push({k,x,y,vx,vy,life,max:life,col,size,seed:this.R.next()*100,g});}
    update(dt){this.t+=dt;const t=this.t,L=this.list;
      for(let i=L.length-1;i>=0;i--){const p=L[i];if((p.life-=dt)<=0){L.splice(i,1);continue;}
        switch(p.k){
          case K.SPARK:case K.PLASMA:{p.vy+=GRAVITY*.45*dt;p.vx-=p.vx*2.2*dt;p.vy-=p.vy*2.2*dt;const ny=p.y+p.vy*dt;p.x+=p.vx*dt;
            if(p.vy>0&&p.y<=p.g&&ny>=p.g){p.vy=-p.vy*.45;p.vx*=.7;p.y=p.g-.5;}else p.y=ny;break;}
          case K.STAR:p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.6*dt+10*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case K.SMOKE:p.vy-=32*dt;p.vx+=Math.sin(t*1.3+p.seed)*16*dt;p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.2*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case K.DUST:p.vx-=p.vx*4*dt;p.vy-=p.vy*4*dt+10*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;}}}
    draw(buf,light,layer){const all=!layer,back=layer==='back';
      for(const p of this.list){const behind=p.k===K.SMOKE||p.k===K.DUST;if(!all&&behind!==back)continue;
        const k=p.life/p.max,ax=p.x/PX,ay=p.y/PX,px=Math.floor(ax),py=Math.floor(ay);
        switch(p.k){
          case K.SMOKE:{const age=1-k,r=p.size*(.65+Math.min(1,age*2.5)*.45+age*.4),e=edge(buf,ax,ay,r+5);if(e<=0)break;
            const a=Math.min(1,age*12)*Math.min(1,k*2.4)*.58*e,c=mix(p.col,ramp(SMOKE_RAMP,age),age);
            buf.alphaDisc(ax,ay,r,c,a*.45);buf.alphaDisc(ax+r*.05,ay+r*.06,r*.74,c,a*.62);
            if(age<.5)buf.alphaDisc(ax-r*.22,ay-r*.3,r*.5,mix(c,WHITE,.12),a*.4*(1-age*2));break;}
          case K.DUST:{const r=p.size*(.6+(1-k)*.9),e=edge(buf,ax,ay,r+4);if(e>0)buf.alphaDisc(ax,ay,r,p.col,Math.pow(k,1.3)*.7*e);break;}
          case K.SPARK:case K.PLASMA:{if(edge(buf,ax,ay,11)<=bayer(px,py))break;
            const hot=p.k===K.PLASMA?(k>.5?WHITE:k>.25?PLASMA.cyan:PLASMA.deep):k>.6?SPARKS.hot:k>.3?SPARKS.yellow:SPARKS.orange;
            const sp=Math.hypot(p.vx,p.vy)||1,ux=p.vx/sp,uy=p.vy/sp,len=Math.min(9,1+sp*.011);
            buf.line(ax-ux*len,ay-uy*len,ax-ux*len*.4,ay-uy*len*.4,k>.5?hot:p.k===K.PLASMA?PLASMA.deep:SPARKS.tail);
            buf.line(ax-ux*len*.45,ay-uy*len*.45,ax,ay,hot);light.glow(ax,ay,3,hot,.45*k);break;}
          case K.STAR:{if(edge(buf,ax,ay,6)<=bayer(px,py))break;const tw=.6+.4*Math.sin(this.t*(8+(p.seed%5))+p.seed);
            if(p.size<1){if(tw*k>.25)buf.set(px,py,tw>.8?WHITE:p.col);light.glow(ax,ay,3,p.col,.4*k*tw);break;}
            const arm=Math.max(1,Math.round(p.size*tw*Math.min(1,k*3))),tip=scale(p.col,.75);
            for(let d=1;d<=arm;d++){const cc=d===arm&&arm>1?tip:p.col;buf.set(px+d,py,cc);buf.set(px-d,py,cc);buf.set(px,py+d,cc);buf.set(px,py-d,cc);}
            if(arm>=3){buf.set(px+1,py+1,tip);buf.set(px+1,py-1,tip);buf.set(px-1,py+1,tip);buf.set(px-1,py-1,tip);}
            buf.set(px,py,WHITE);light.glow(ax,ay,3+arm*2,p.col,.5*k*tw);break;}}}}
  }

  /* ---------- Sprite Fusion "Dash" (driven by the game: it reads the hero's feet each tick instead of moving it) ----------
     o: C ramp (7, light to dark), S style {kick, smoke, skid, spark, shake, glowR, fl, endStars}, U unit dash direction on the canvas,
     W/HH canvas size, dur, feet() effect units, dashing(), grab() -> silhouette, dust/smoke/skidC ground colours, nl lines a tick,
     lineK line length factor, spacing (units between afterimages), first (s before the second), perfect */
  function dashFx(o){
    const R=new Rng(o.seed),ps=new Particles(R),C=o.C,S=o.S,UX=o.U[0],UY=o.U[1],NX=-UY,NY=UX,EXT=Math.abs(NX)*10+Math.abs(NY)*21;
    const F0=o.feet(),ghosts=[],lines=[];
    let t=0,last=null,stopped=false,stopT=0,skidV=0,stopF=null,pT=-1;
    const capture=()=>{const g=o.grab();if(g)ghosts.push({x0:g.x0,y0:g.y0,w:g.w,h:g.h,m:g.m,t});};
    const lim=(p,u,max)=>u>.01?(p-2)/u:u<-.01?(max-2-p)/(-u):1e9;
    for(let i=0;i<S.kick;i++){const s=R.sign()*R.range(20,110)*1.6;ps.spawn(K.DUST,F0[0]+R.range(-3,3),F0[1]-1,UX*s,UY*s-R.range(5,45),R.range(.3,.65),o.dust,R.range(1.3,2.8));}
    for(let i=0;i<S.smoke;i++){const s=R.range(80,260);ps.spawn(K.SMOKE,F0[0]+R.range(-6,6),F0[1]-R.range(2,12),-UX*s,-UY*s-R.range(10,50),R.range(.6,1.1),o.smoke,R.range(3,6));}
    const perfect=()=>{if(pT>=0)return;pT=t;const f=o.feet();
      for(let i=0;i<16;i++){const a=R.range(0,TAU),sp=R.range(60,170);ps.spawn(K.STAR,f[0],f[1]-36,Math.cos(a)*sp,Math.sin(a)*sp*.7-40,R.range(.4,.8),R.pick([WHITE,ICE[1],ICE[2],ICE[3]]),R.range(.6,1.5));}};
    if(o.perfect)perfect();
    return{
      perfect,
      update(dt){t+=dt;const f=o.feet(),dashing=!stopped&&o.dashing()&&t<o.dur+.15;
        if(dashing){
          if(!last||(Math.hypot(f[0]-last[0],f[1]-last[1])>o.spacing&&t>o.first)){last=f;capture();}
          for(let k=0;k<o.nl;k++){const b=R.range(4,16),s=R.range(-1,1)*EXT,x=f[0]/PX-UX*b+NX*s,y=f[1]/PX-23-UY*b+NY*s;
            lines.push({x,y,l:Math.max(2,Math.min(R.range(16,64)*o.lineK,lim(x,UX,o.W),lim(y,UY,o.HH))),t});}
        }else if(!stopped&&t>0){stopped=true;stopT=t;stopF=f;skidV=700*S.skid;if(S.shake)PXK.shake(S.shake);
          for(let i=0;i<S.endStars;i++){const a=R.range(0,TAU),sp=R.range(40,130);ps.spawn(K.STAR,f[0]+R.range(-8,8),f[1]-30,Math.cos(a)*sp,Math.sin(a)*sp*.6-30,R.range(.35,.7),R.pick([WHITE,C[1],C[2],C[3]]),R.range(.5,1.3));}}
        if(stopped&&skidV>60){skidV=Math.max(0,skidV-4600*dt);const x=f[0],y=f[1],g=y+2+Math.max(0,UY)*24;
          let s=R.range(60,260);ps.spawn(K.DUST,x+UX*8,y-2+UY*8,UX*s,UY*s-R.range(20,90),R.range(.4,.8),o.smoke,R.range(1.5,3));
          if(R.chance(S.spark)){s=R.range(200,600);ps.spawn(K.SPARK,x+UX*6,y-1,UX*s,UY*s*.6-R.range(40,200),R.range(.1,.25),0,1,g);}
          if(R.chance(.4)){s=R.range(40,140);ps.spawn(K.SMOKE,x,y-4,UX*s,UY*s-R.range(10,40),R.range(.6,1),o.smoke,R.range(3,5));}}
        for(let i=lines.length-1;i>=0;i--)if(t-lines[i].t>.2)lines.splice(i,1);
        for(let i=ghosts.length-1;i>=0;i--)if(t-ghosts[i].t>.4)ghosts.splice(i,1);
        ps.update(dt);},
      draw(fr,layer){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light);
        if(layer!=='front'){ps.draw(buf,light,'back');
          if(stopped&&S.skid){const a=.8*(1-smooth(.6,1.4,t-stopT));if(a>0){const x0=stopF[0]/PX-UX*28,y0=stopF[1]/PX-UY*28,x1=stopF[0]/PX+UX*5,y1=stopF[1]/PX+UY*5,n=Math.ceil(Math.hypot(x1-x0,y1-y0));
            for(let i=0;i<=n;i++){const u=i/Math.max(1,n);dot(buf,x0+(x1-x0)*u,y0+(y1-y0)*u,o.skidC,a*Math.min(1,i/12));}}}
          for(const gh of ghosts){const k=(t-gh.t)/.4,i=Math.min(C.length-3,1+Math.floor(k*(C.length-3))),a=k<.45?1:(1-k)/.55;
            for(let y=0;y<gh.h;y++)for(let x=0;x<gh.w;x++){const v=gh.m[y*gh.w+x];if(v)dot(buf,gh.x0+x,gh.y0+y,v===1?C[i+2]:C[i+2-v],a);}}
          for(const l of lines){const k=(t-l.t)/.2;for(let d=0;d<l.l*(1-k*.6);d++)dot(buf,l.x-UX*d,l.y-UY*d,d<3?C[0]:d<l.l*.4?C[1]:C[3],(1-d/l.l)*(1-k));}}
        if(layer!=='back'){
          if(t<.08){const k=t/.08,x=F0[0]/PX,y=F0[1]/PX;if(S.fl>0)ellipse(buf,x,y,10*(.5+k)*S.fl,2.5,C[0],1-k);ringE(buf,x,y,(6+18*k)*(S.fl||.9),2+3*k,1.5,C[2],1-k);}
          if(pT>=0&&t-pT<.45){const k=(t-pT)/.45,f=o.feet(),e=outCubic(k);ringE(buf,f[0]/PX,f[1]/PX,4+30*e,1.5+10*e,2*(1-k)+.5,k<.3?WHITE:ICE[2],1.1-k);}
          if(!stopped||t-stopT<.1){const f=o.feet();light.glow(f[0]/PX,f[1]/PX-20,S.glowR,C[3],.35);}
          ps.draw(buf,light,'front');}},
      done:()=>stopped&&t-stopT>1.2&&ps.list.length===0};}

  /* ---------- Sprite Fusion "Blink" (the game moves the character; the effect hides it from the vanish to the arrival) ----------
     o: C, A ramps; sil (captured, canvas art px) or null; from [x, y] start feet (effect units); cur() the character's feet now;
     charge s (0: vanish at once); watch() -> 'go' | 'fizzle' | null while charging; grab(); hide(); show(); k size; stars; flash; shake */
  function blinkFx(o){
    const R=new Rng(o.seed),ps=new Particles(R),C=o.C,A=o.A,KS=o.k||1,COLS=[WHITE,C[1],C[2],A[1],A[2],C[3]],lights=[],bits=[],inbound=[];
    const AX=o.from[0],AY=o.from[1],cx=Math.round(AX/PX);
    let t=0,OUT=o.charge>0?Infinity:0,sil=o.sil||null,out=false,unhid=false,arrived=false,fizz=false;
    const myOf=()=>sil?sil.y0+sil.top+(sil.bot-sil.top)*.55:AY/PX-20;
    const shiftNow=()=>{const c=o.cur();return[Math.round((c[0]-AX)/PX),Math.round((c[1]-AY)/PX)];};
    return{
      hidden:()=>out&&!arrived,
      update(dt){t+=dt;
        if(t<OUT&&!fizz){const w=o.watch?o.watch(t):null;if(w==='go')OUT=t;else if(w==='fizzle')fizz=true;}
        if(t<OUT&&!fizz){sil=o.grab()||sil;
          if(R.chance(.6)){const a=R.range(0,TAU),d=R.range(40,80)*KS;ps.spawn(K.PLASMA,AX+Math.cos(a)*d,AY-36*KS+Math.sin(a)*d,-Math.cos(a)*d*5,-Math.sin(a)*d*5,R.range(.14,.2),0,1,AY);}}
        if(!fizz&&t>=OUT&&!out){out=true;if(o.flash&&!reduceMotion)PXK.flash(o.flash,'200,240,255');
          lights.push({x:AX,y:AY-36*KS,r:150*KS,color:C[3],k:.75,life:.3,max:.3});
          if(sil){const keep=PERF.lite?.45:.85;for(let y=0;y<sil.h;y++)for(let x=0;x<sil.w;x++){if(!sil.px[y*sil.w+x]||!R.chance(keep))continue;const px=sil.x0+x,py=sil.y0+y;
            bits.push({x:px,y:py,vx:(px-cx)*R.range(3,9)+R.range(-14,14),vy:-R.range(10,60),life:R.range(.35,.8),max:.8,c:R.pick(COLS),d:(y/sil.h)*.1});}}}
        const IN=OUT+.05,ARR=IN+.26;
        if(out&&t>=IN&&!unhid){unhid=true;
          if(sil)for(let y=0;y<sil.h;y++)for(let x=0;x<sil.w;x++){if(!sil.px[y*sil.w+x]||R.chance(PERF.lite?.6:.2))continue;const a=R.range(0,TAU),d=R.range(14,34);
            inbound.push({tx:sil.x0+x,ty:sil.y0+y,ox:Math.cos(a)*d,oy:Math.sin(a)*d-10,t0:IN+R.range(0,.09),c:R.pick(COLS)});}}
        if(out&&!arrived){if(t>=ARR){arrived=true;if(o.show)o.show();PXK.shake(o.shake||0);const c=o.cur();
            for(let i=0;i<o.stars;i++){const a=R.range(0,TAU),sp=R.range(60,260)*KS;ps.spawn(K.STAR,c[0],c[1]-36*KS,Math.cos(a)*sp,Math.sin(a)*sp*.7-40,R.range(.4,.9),R.pick(COLS),R.range(.6,1.6));}}
          else if(o.hide)o.hide();}
        for(let i=bits.length-1;i>=0;i--){const b=bits[i];if(b.d>0){b.d-=dt;continue;}if((b.life-=dt)<=0){bits.splice(i,1);continue;}
          b.vy-=60*dt;b.vx-=b.vx*2.5*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;}
        for(let i=lights.length-1;i>=0;i--)if((lights[i].life-=dt)<=0)lights.splice(i,1);
        ps.update(dt);},
      draw(fr){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light),IN=OUT+.05,ARR=IN+.26,[dx,dy]=shiftNow(),my=myOf(),ax=AX/PX,ay=AY/PX;
        for(const [x,y,t0] of [[ax,ay,OUT],[ax+dx,ay+dy,ARR-.02]]){const k=(t-t0)/.45;if(!(k>=0&&k<=1))continue;const e=outCubic(k);
          ringE(buf,x,y,(4+30*e)*KS,(1.5+9*e)*KS,2*(1-k)+.5,k<.3?WHITE:C[2],1.1-k);}
        if(t>OUT+.02&&t<OUT+.22){const k=(t-OUT-.02)/.2,hx=lerp(ax,ax+dx,outExpo(k)),hy=lerp(my,my+dy,outExpo(k)),tx=lerp(ax,ax+dx,outExpo(k-.25)),ty=lerp(my,my+dy,outExpo(k-.25));
          const n=Math.max(1,Math.ceil(Math.hypot(hx-tx,hy-ty)*2)),flat=Math.abs(dx)>=Math.abs(dy);
          for(let i=0;i<=n;i++){const u=i/n,x=tx+(hx-tx)*u,y=ty+(hy-ty)*u;dot(buf,x,y,u>.8?WHITE:C[2],u+.1);dot(buf,x+(flat?0:1),y+(flat?1:0),A[2],u*.6);}
          light.glow(hx,hy,14*KS,C[2],.6);}
        if(sil){
          if(t<OUT&&!fizz&&o.charge>0){const k=clamp(t/o.charge),S=sil,n=(xx,yy)=>xx>=0&&yy>=0&&xx<S.w&&yy<S.h&&S.px[yy*S.w+xx];
            for(let y=0;y<S.h;y++)for(let x=0;x<S.w;x++)if(!S.px[y*S.w+x]&&(n(x-1,y)||n(x+1,y)||n(x,y-1)||n(x,y+1))&&hash(x*61+y+Math.floor(t*30)*977)<.35+.6*k)buf.set(S.x0+x,S.y0+y,k>.7&&hash(x+y*7)<.5?WHITE:C[2]);
            light.glow(cx,S.y0+S.top+(S.bot-S.top)*.4,30*KS,C[3],.5*k);}
          if(out&&t<OUT+.18){const k=(t-OUT)/.1;
            if(k<1)drawSil(buf,sil,cx,1-k,k<.5?WHITE:C[1],C[2],1);
            else{const hh=((sil.bot-sil.top)/2)*(1-(t-OUT-.1)/.08);for(let y=-hh-4;y<=hh+4;y++)dot(buf,cx,my+y,Math.abs(y)<hh?WHITE:C[2]);}
            light.glow(cx,my,40*KS,C[2],.8);}
          if(out&&t>OUT+.18&&t<OUT+.9)drawSil(buf,sil,cx,1,A[2],A[4],.45*(1-(t-OUT-.18)/.72));
          if(out&&t>IN&&t<ARR+.02){const k=(t-IN)/(ARR-IN);
            if(k<.55){const hh=((sil.bot-sil.top)/2+3)*outCubic(k/.55);for(let y=-hh;y<=hh;y++)dot(buf,cx+dx,my+dy+y,WHITE,1-(Math.abs(y)/(hh+1))*.6);}
            else drawSil(buf,sil,cx,outCubic((k-.55)/.45),k>.85?WHITE:C[1],k>.85?C[2]:C[3],1,dx,dy);
            light.glow(cx+dx,my+dy,34*KS,C[2],.7*k);}}
        else if(out&&t>IN&&t<ARR+.02){const k=(t-IN)/(ARR-IN),hh=28*KS*outCubic(k/.55)*(1-smooth(.8,1,k));
          for(let y=-hh;y<=hh;y++)dot(buf,cx+dx,my+dy+y,WHITE,1-(Math.abs(y)/(hh+1))*.6);light.glow(cx+dx,my+dy,34*KS,C[2],.7*k);}
        for(const p of inbound){const k=(t-p.t0)/(ARR-p.t0);if(k<0||k>=1)continue;const e=outCubic(k);dot(buf,p.tx+dx+p.ox*(1-e),p.ty+dy+p.oy*(1-e),k>.8?WHITE:p.c,.4+.6*k);}
        for(const b of bits)if(b.d<=0)dot(buf,b.x,b.y,b.life/b.max>.75?WHITE:b.c,Math.min(1,(b.life/b.max)*1.6)*edge(buf,b.x,b.y,10));
        for(const l of lights){const k=l.life/l.max;light.glow(l.x/PX,l.y/PX,(l.r/PX)*(.55+.45*k),l.color,l.k*k*k);}
        ps.draw(buf,light);},
      done:()=>fizz?ps.list.length===0:out&&t>Math.max(OUT+.05+.26+.5,OUT+.92)&&bits.length===0&&ps.list.length===0};}

  /* ---------- reading a character's live sprite (Sprite Fusion's Actor.silhouette(), placed by our own projection) ---------- */
  /* the sprite record that drew e last frame (the hero's frames only for the hero, so a nearby foe is never captured) */
  function sprOf(e){const nm=e===P?'hero':e.d&&e.d.spr,F=nm&&ATL.frames[nm];let best=null,bd=56;
    for(let i=0;i<SPR.length;i++){const s=SPR[i];if(!s.f||!s.f.ch)continue;const d=Math.abs(s.x-e.x)+Math.abs(s.y-e.y);if(d<bd&&(!F||F.indexOf(s.f)>=0)){bd=d;best=s;}}return best;}
  /* nearest-neighbour turn of a shade mask round its pixels' centre (a rolling hero's afterimage keeps the roll's angle) */
  function rotMask(m,w,h,a){let x0=w,x1=-1,y0=h,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(m[y*w+x]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
    if(x1<0)return null;const cx=(x0+x1+1)/2,cy=(y0+y1+1)/2,D=Math.ceil(Math.hypot(x1-x0+1,y1-y0+1))+2,o=new Uint8Array(D*D),c=Math.cos(a),s=Math.sin(a);
    for(let j=0;j<D;j++)for(let i=0;i<D;i++){const u=i+.5-D/2,v=j+.5-D/2,sx=Math.floor(cx+u*c+v*s),sy=Math.floor(cy-u*s+v*c);if(sx>=0&&sy>=0&&sx<w&&sy<h)o[j*D+i]=m[sy*w+sx];}
    return{m:o,w:D,h:D,dx:Math.round(cx-D/2),dy:Math.round(cy-D/2)};}
  /* pj(x, h, y) -> art px on the canvas; returns {x0, y0, w, h, m (= px): 0 empty, 1 dark, 2 mid, 3 light, top, bot} */
  function grabSil(e,pj){const s=sprOf(e);if(!s)return null;const S=pxSilOf(s.f,s.s,s.sx,s.sy,s.flip);if(!S)return null;
    const q=pj(s.x,s.h,s.y);let w=S.w,h=S.h,m=new Uint8Array(w*h),x0=Math.round(q[0]-S.ax),y0=Math.round(q[1]-S.ay);
    shadeMask(S.data,m);
    if(Math.abs(s.rot||0)>.08){const r=rotMask(m,w,h,s.rot);if(r){m=r.m;w=r.w;h=r.h;x0+=r.dx;y0+=r.dy;}}
    let top=h,bot=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(m[y*w+x]){if(y<top)top=y;bot=y;break;}
    return bot<0?null:{x0,y0,w,h,m,px:m,top,bot};}

  /* ---------- Embervale wrappers ---------- */
  let seed=1,heroBlink=null,lastDodge=null,seen=null,noGhost=false;const dashes=new Set(),blinks=new Set(),tried=new WeakSet();
  const zoneCol=()=>hex((typeof ZDUST!=='undefined'&&ZDUST[curZone])||'#8a7a6a');
  const count=S=>{let n=0;for(const H of S)if(H.dead)S.delete(H);else n++;return n;};
  /* a dash ability's ramp from its ghost tint */
  function rampOfTint(c){if(!c)return DASH;const [r,g,b]=c;if(r>.9&&g>.7&&b<.6)return GOLD;if(g>=r&&g>=b&&r<.7)return WIND;if(r>.9&&g<.6)return EMBER;if(b>=.9&&g<.6)return ARC7;return DASH;}
  /* the pixel layer of one dash: ent (the hero), d its P.dash, o.style 'roll' | 'drift' | 'dash', o.perfect */
  function pxMovementDash(ent,d,o={}){if(!ent||!d||count(dashes)>=4)return null;
    const sty=o.style||'dash',roll=sty==='roll',drift=sty==='drift',lite=PERF.lite,sp=CAM.sp,v=Math.hypot(d.vx,d.vy)||1,dur=d.t0||d.t||.25,dist=v*dur,wx=d.vx/v,wy=d.vy/v;
    const x0=ent.x,y0=ent.y,x1=x0+wx*dist,y1=y0+wy*dist,Hy=Math.min(y0,y1)-4,dX=(x1-x0)/PIX,ys=(y0-Hy)*sp/PIX,ye=(y1-Hy)*sp/PIX,fly=(ent.g1b_fh||0)/PIX;
    const xl=Math.min(dX>=0?-30:dX-40,-30),xr=Math.max(dX>=0?dX+40:30,30),top=Math.min(ys,ye)-56-fly,bot=Math.max(ys,ye)+12;
    const w=Math.min(320,Math.ceil(xr-xl)),hh=Math.min(180,Math.ceil(bot-top)),ax=Math.round(-xl),ay=Math.round(-top);
    const ul=Math.hypot(wx,wy*sp)||1,U=[wx/ul,wy*sp/ul],zc=zoneCol(),C=drift?ARC7:roll?DASH:rampOfTint(d.ghost);
    const S={kick:drift?0:lite?6:12,smoke:drift?0:lite?3:6,skid:drift?0:roll?.7:1,spark:roll?.3:.6,shake:roll||drift?0:.12,glowR:roll?32:drift?34:40,fl:drift?0:roll?.8:1,endStars:drift?(lite?4:8):0};
    const Hd=pxfx(c=>{const pj=(x,h,y)=>[ax+(x-x0)/PIX,ay-h/PIX+(y-Hy)*sp/PIX];
      return dashFx({seed:seed++,C,S,U,W:w,HH:hh,dur,perfect:!!o.perfect,nl:lite?2:4,lineK:clamp(dist/PIX/130,.5,1),spacing:roll||drift?40:44,first:.06,
        dust:mix(scale(zc,.92),rgb(150,140,150),.35),smoke:mix(scale(zc,.62),DUST,.5),skidC:mix(scale(zc,.38),SKID,.5),
        feet:()=>{const q=pj(ent.x,0,ent.y);return[q[0]*PX,q[1]*PX];},dashing:()=>ent.dash===d&&!ent.dead,grab:()=>grabSil(ent,pj)});},
      {x:x0,y:Hy,w,hh,ax,ay,split:true,amb:.25,pri:1,ttl:dur+2.8});
    if(Hd)dashes.add(Hd);return Hd;}
  /* the pixel layer of one blink: ent moved (hero) or will move (o.to: a voidling's mark) from (fx0, fy0); o.sil the hero's silhouette
     captured before the jump (art px from its feet); o.charge, o.watch for a marked blink */
  function pxMovementBlink(ent,fx0,fy0,o={}){if(!ent||count(blinks)>=4)return null;
    const hero=ent===P,sp=CAM.sp,tx=o.to?o.to.x:ent.x,ty=o.to?o.to.y:ent.y,Hy=Math.max(fy0,ty)+4,fly=((ent.d&&ent.d.fly)||ent.g1b_fh||0)/PIX,KS=hero?1:.85;
    const dX=(fx0-tx)/PIX,yo=(fy0-Hy)*sp/PIX,yd=(ty-Hy)*sp/PIX,xl=Math.min(dX,0)-46,xr=Math.max(dX,0)+46,top=Math.min(yo,yd)-96-fly,bot=Math.max(yo,yd)+12;
    const w=Math.min(300,Math.ceil(xr-xl)),hh=Math.min(200,Math.ceil(bot-top)),ax=Math.round(-xl),ay=Math.round(-top);
    const pink=ent.type==='hollow',C=hero?ICE:pink?VOIDP:ARCANE,A=hero?ARCANE:pink?ARCANE:VOIDP;
    const Hb=pxfx(c=>{const pj=(x,h,y)=>[ax+(x-tx)/PIX,ay-h/PIX+(y-Hy)*sp/PIX],o0=pj(fx0,0,fy0);
      let sil=o.sil?Object.assign({},o.sil,{x0:o.sil.x0+Math.round(o0[0]),y0:o.sil.y0+Math.round(o0[1])}):hero?null:grabSil(ent,pj);
      return blinkFx({seed:seed++,C,A,sil,from:[o0[0]*PX,o0[1]*PX],charge:o.charge||0,watch:o.watch,k:KS,stars:Math.round((hero?30:18)*(PERF.lite?.5:1)),
        flash:hero?.18:0,shake:hero?.08:.04,grab:()=>grabSil(ent,pj),cur:()=>{const q=pj(ent.x,0,ent.y);return[q[0]*PX,q[1]*PX];},
        hide:hero?null:()=>{ent.spawnT=Math.max(ent.spawnT||0,.52);},show:hero?null:()=>{ent.spawnT=Math.min(ent.spawnT||0,.1);}});},
      {x:tx,y:Hy,w,hh,ax,ay,amb:.12,pri:1,ttl:(o.charge||0)+3});
    if(Hb)blinks.add(Hb);return Hb;}

  /* ---------- wiring ---------- */
  /* the hero's sprite is hidden while a blink re-forms it (its pixels are the effect then) */
  {const o=pushS;pushS=function(name,fi,x,h,y,s,flip,r,g,b,a,fl,em,rot,dk,sx,sy){
    if(heroBlink!==null&&name==='hero'){if(heroBlink.dead)heroBlink=null;else if(P&&heroBlink.fx.hidden()&&Math.abs(x-P.x)<48&&Math.abs(y-P.y)<48)a=0;}
    return o(name,fi,x,h,y,s,flip,r,g,b,a,fl,em,rot,dk,sx,sy);};}
  /* the Blink's own tinted ghost at the start is replaced by the pixel squeeze and afterimage (it covers the same 0.4 s) */
  {const o=ghost;ghost=function(p,c,fi,max){if(noGhost)return;return o(p,c,fi,max);};}
  {const o=ABIL.blink;ABIL.blink=function(p,i,a,ab){const me=!!p&&p===P,x0=me?p.x:0,y0=me?p.y:0;let sil=null,r;
    if(me)try{sil=grabSil(p,(x,h,y)=>[(x-x0)/PIX,-h/PIX+(y-y0)*CAM.sp/PIX]);}catch(e){}
    noGhost=me;try{r=o.call(this,p,i,a,ab);}finally{noGhost=false;}
    if(me)try{if(Math.hypot(p.x-x0,p.y-y0)>8){const Hb=pxMovementBlink(p,x0,y0,{sil});if(Hb)heroBlink=Hb;}}catch(e){console.error(e);}
    return r;};}
  onEv('dodge',perf=>{const p=P;if(!p||!p.dash)return;seen=p.dash;try{lastDodge=pxMovementDash(p,p.dash,{style:p.dash.g1b===2?'drift':'roll',perfect:!!perf});}catch(e){console.error(e);}});
  onEv('perfectDodge',()=>{if(lastDodge&&!lastDodge.dead&&lastDodge.fx.perfect)lastDodge.fx.perfect();});
  onEv('update',()=>{
    /* a new P.dash that was not a dodge: a dash ability */
    const d=P&&!P.dead?P.dash:null;if(d!==seen){seen=d;if(d&&!d.g1b)try{pxMovementDash(P,d,{style:'dash'});}catch(e){console.error(e);}}
    /* voidlings and hollows marking a blink (g1a_blink): the mark is the charge, their jump the vanish */
    if(!P)return;for(const e of enemies){const B=e.g1a_bl;if(!B||tried.has(B))continue;tried.add(B);
      if(e.dead||e.hidden||Math.abs(e.x-P.x)>1100||Math.abs(e.y-P.y)>800)continue;
      try{pxMovementBlink(e,e.x,e.y,{to:B,charge:Math.max(.1,B.t||.42),watch:t=>{if(!pxAlive(e))return'fizzle';if(e.g1a_bl===B)return t>(B.max||.42)+.6?'fizzle':null;
        return Math.abs(e.x-B.x)<2&&Math.abs(e.y-B.y)<2?'go':'fizzle';}});}catch(err){console.error(err);}}});
  onEv('pxClear',()=>{dashes.clear();blinks.clear();heroBlink=null;lastDodge=null;seen=null;});

  /* lab: the real game paths (the dodge, P.dash, ABIL.blink, a voidling's mark) */
  const dashLab=(an,v,t,c)=>{if(!P)return;P.ang=an;P.face=Math.cos(an)>=0?1:-1;P.dash={vx:Math.cos(an)*v,vy:Math.sin(an)*v,t,ghost:c};};
  const dodgeLab=an=>{if(!P)return;P.dash=null;P.g1b_cd=0;P.ang=an;P.face=Math.cos(an)>=0?1:-1;g1b_dodge();};
  pxlab('movement-dodge','Dodge roll','Movement','sf',()=>dodgeLab(0));
  pxlab('movement-dodge-down','Dodge roll toward the camera','Movement','sf',()=>dodgeLab(2.3));
  pxlab('movement-perfect','Perfect dodge','Movement','sf',()=>{dodgeLab(Math.PI);if(lastDodge&&lastDodge.fx)lastDodge.fx.perfect();});
  pxlab('movement-drift','Arcanist Drift (violet)','Movement','sf',()=>{if(!P)return;const dur=.34;P.face=1;P.ang=0;P.dash={vx:218/dur,vy:0,t:dur,t0:dur,roll:false,g1b:2};seen=P.dash;lastDodge=pxMovementDash(P,P.dash,{style:'drift'});});
  pxlab('movement-dashslash','Dash Slash (blue)','Movement','sf',()=>dashLab(0,1120,.21,[.55,.85,1]));
  pxlab('movement-charge','Charge (gold)','Movement','sf',()=>dashLab(-.35,900,.3,[1,.85,.45]));
  pxlab('movement-blink','Arcanist Blink','Movement','sf',()=>{if(P)ABIL.blink(P,0,{a:0});});
  pxlab('movement-voidblink','Voidling blink (marked)','Movement','sf',(x,y)=>{if(!P)return;const e=mkEnemy('voidling',x+10,y-30,Math.max(1,P.lvl-2),null);
    e.state='chase';e.g1a_alert=0;e.blinkT=9;e.cd=2;enemies.push(e);e.g1a_bl={x:x+150,y:y+20,t:.42,max:.42};});
  return{pxMovementDash,pxMovementBlink};})();
