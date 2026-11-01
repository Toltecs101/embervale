/* BREAKFX (original, in Sprite Fusion's style; palette, cracks, shards and glints follow SF "Ice", MIT): the Octopath-style shield
   in pixels. "Break Shatter": when an enemy's shield breaks (pxBreak, after breakEnemy) a cage of 6-10 hexagonal crystal plates
   flashes into view round it, cracks with white lines and explodes into tumbling shards and glints, with a flat pixel shockwave
   ring on the ground and a light pop. "Shield chip": every weakness hit that takes a point off the shield (shieldHit wrapped;
   e.sh went down and is still > 0) shows the remaining plates for a beat and knocks one plate off with a crack, on the side the
   hero struck. "Weakness ping": the first time a weakness is discovered (shieldHit sets e.reveal = gameTime) a diamond ping in the
   element's colour pops over the enemy's head. All on top of the game's own BREAK text, shard particles and rings.
   Recipe (cage round the body: centre at half its height, radii rx = max(.85 ry, r s / 2.5 + 8), ry = height / 2 + 3 art px;
   n = clamp(4 + shMax, 6, 9) plates, bosses 10; plate radius rp = clamp(.42 min(rx, ry), 4, 9), squashed .72-1 sideways):
   - Break timeline: frame 1 (t <= 1/60) every plate white, a light pop; frame 2 plates #dcfbff with white rims; 2/60 s to TC - .034
     (TC = .15 s, bosses .2) shaded plates while 3 crack walkers per plate race out from a point near its middle (steps 1.5-2.6 px,
     turning +-.55 rad, 5 steps), white with a #2c58aa pixel under each; TC - .034 to TC all white; TC: the plates burst into 8
     shards each (bosses 12, lite x.6, 20 % chunks) thrown out from the cage centre at 120-300 (bosses x1.3) and up 80-240, .8 g,
     drag .6, bounce x.3 above 140 else rest, life .6-1.1 s, dithered out over their last .4 s; 10 glints (bosses 16) over the next
     .3 s; the ground ring 0.6 rx -> 2.6 rx + 16 px over .42 s (ease-out cubic), 2.5 -> 1 px, white / #dcfbff / #a6ecff / #62c8f4
     by quarter, dithered out, with a #62c8f4 inner ring at .72 r. shake .1 (bosses .18).
   - Layers: one split 'bill' canvas at the enemy's feet: even plates and their shards in front of it, odd plates (one ramp step
     darker, interiors dithered .55) and theirs behind; a 'flat' nolight canvas for the ring. Light: front plates r 1.6 rp #62c8f4
     .18 while the cage stands; pop at TC r min(48, 2.2 rx) #62c8f4 .8 e^(-dt/.08) + r min(30, rx) white .6 e^(-dt/.04); glints
     r 3 white .35 k. lamp (not lite): 1.2 pop + .4 in the first frames, [.55, .8, 1], r 170.
   - Chip timeline (.8 s): 0-.2 s the remaining plates (min(9, e.sh)) as rims, #a6ecff dithered out; the struck plate white for
     1 frame, bright for 1, cracks to TP = .09 s, then it spalls off toward the hero side (80-160 out, 140-240 up, .8 g, spin
     14 rad/s: width |cos|, back face one step darker) and breaks into 5 shards and a glint on the ground or at TP + .4 s.
     Light: r 10 #62c8f4 .6 e^(-dt/.06) and r 5 white .5 at TP.
   - Ping timeline (.45 s): frame 1 a 4-point star (arms 3 px) white, frame 2 arms 5 px; then a 1 px diamond 3 -> 14 px
     (ease-out cubic) stepping white / C1 / C2 / C3 by quarter of the element's ramp, dithered out, a second diamond at .55 r for
     the first half, white tips flickering; light r 9 C2 .7 e^(-t/.08). Ramps: ICE #ffffff #dcfbff #a6ecff #62c8f4 #3a8bd8 #2c58aa
     #212f6b #151a3d (SF Ice); a ping's from the element (fire #ff8a3d, ice #7fd8ff, lightning #ffe26b, wind #8affc8, light
     #fff3a6, dark #c08aff, weapons #dfe8ff) through rampOf.
   - Caps: one break per enemy and 6 at once, 8 chips, 6 pings; lite: fewer shards and glints, no lamp, no plate glows. */
const {pxBreakfx,pxBreakfxChip,pxBreakfxPing}=(function(){'use strict';const {Px,dot,bayer,Rng,hex,cl:clamp,TAU,PXW:PX,WHITE}=PXK;
  const ICE=['#ffffff','#dcfbff','#a6ecff','#62c8f4','#3a8bd8','#2c58aa','#212f6b','#151a3d'].map(hex);
  const GRAVITY=1900,SHARD=0,CHUNK=1;
  const hexIn=(X,Y,r)=>{const ax=Math.abs(X),ay=Math.abs(Y);return ay<=r*.866&&ax*.866+ay*.5<=r*.866;};
  /* a hex plate: mode 0 white, 1 bright, 2 shaded (front), 3 shaded one step darker (back), 4 rim only (ghost), dithered by a */
  function plate(buf,x,y,r,sq,mode,a=1){const N=Math.ceil(r)+1,ix=Math.round(x),iy=Math.round(y);
    for(let py=-N;py<=N;py++)for(let px=-N;px<=N;px++){const X=(px+.5)/sq,Y=py+.5;if(!hexIn(X,Y,r))continue;const edge=!hexIn(X,Y,r-1.15),lit=X+Y<0;let c,al=a;
      if(mode===0)c=WHITE;
      else if(mode===1)c=edge?WHITE:ICE[1];
      else if(mode===4){if(!edge)continue;c=lit?ICE[1]:ICE[3];}
      else if(mode===2){if(edge)c=lit?ICE[1]:ICE[4];else{c=Math.abs(X*.5+Y+r*.25)<.8?ICE[1]:Y<0?ICE[2]:ICE[3];al*=.8;}}
      else{if(edge)c=lit?ICE[2]:ICE[5];else{c=Y<0?ICE[3]:ICE[4];al*=.55;}}
      dot(buf,ix+px,iy+py,c,al);}}
  /* SF Ice cracks: n walkers from a point near the middle, stopping at the plate's edge */
  function cracksOf(R,r,n){const ix=R.range(-r*.3,r*.3),iy=R.range(-r*.25,r*.25),W=[];
    for(let i=0;i<n;i++){let a=i/n*TAU+R.range(-.5,.5),x=ix,y=iy;const pts=[x,y];
      for(let s=0;s<5;s++){a+=R.range(-.55,.55);const L=R.range(1.5,2.6)*Math.max(.8,r/7);const nx=x+Math.cos(a)*L,ny=y+Math.sin(a)*L;if(!hexIn(nx,ny,r-.6))break;x=nx;y=ny;pts.push(x,y);}
      W.push(pts);}return W;}
  function crackDraw(buf,x,y,sq,W,k){for(const pts of W){const m=Math.floor((pts.length/2-1)*k+1e-6);
    for(const pass of [0,1])for(let s=0;s<m;s++){const x0=pts[s*2]*sq,y0=pts[s*2+1],x1=pts[s*2+2]*sq,y1=pts[s*2+3],L=Math.hypot(x1-x0,y1-y0);
      for(let d=0;d<=L;d+=.5){const px=Math.floor(x+x0+(x1-x0)*d/Math.max(.01,L)),py=Math.floor(y+y0+(y1-y0)*d/Math.max(.01,L));if(pass===0)buf.set(px,py+1,ICE[5]);else buf.set(px,py,WHITE);}}}}
  function ringPx(buf,cx,cy,r,th,c,alpha){const ro=r+th*.5,ri=Math.max(0,r-th*.5),ro2=ro*ro,ri2=ri*ri;
    for(let y=Math.floor(cy-ro);y<=Math.ceil(cy+ro);y++){const dy=y+.5-cy;for(let x=Math.floor(cx-ro);x<=Math.ceil(cx+ro);x++){const dx=x+.5-cx,d2=dx*dx+dy*dy;
      if(d2<=ro2&&d2>=ri2&&(alpha>=1||alpha>bayer(x,y)))buf.set(x,y,c);}}}
  function star(buf,light,x,y,L,core,arm,a){x=Math.floor(x);y=Math.floor(y);dot(buf,x,y,core,a);for(let i=1;i<=L;i++){const aa=a*(1-(i-1)/(L+1));dot(buf,x+i,y,arm,aa);dot(buf,x-i,y,arm,aa);dot(buf,x,y+i,arm,aa);dot(buf,x,y-i,arm,aa);}
    if(light)light.glow(x+.5,y+.5,3,WHITE,.35*a);}
  /* SF Ice bits: shards (a 1 px sliver turning, its leading pixel white) and chunks (a little faceted lump) */
  class Bits{
    constructor(R,ground){this.R=R;this.ground=ground;this.list=[];}
    add(b){this.list.push(b);}
    update(dt){const L=this.list;for(let i=L.length-1;i>=0;i--){const b=L[i];if((b.life-=dt)<=0){L.splice(i,1);continue;}if(b.rest)continue;
      b.vy+=GRAVITY*b.g*dt;b.vx-=b.vx*b.drag*dt;b.vy-=b.vy*b.drag*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.a+=b.va*dt;const sp=b.vy;
      if(b.y<this.ground||sp<=0)continue;b.y=this.ground-.01;if(b.k===SHARD)b.vx*=1.3;if(sp>140){b.vy=-sp*b.bounce;b.vx*=.7;b.va*=.6;}else{b.rest=true;b.vx=b.vy=0;}}}
    draw(buf,back,W){for(const b of this.list){if(!!b.back!==back)continue;const x=b.x/PX,y=b.y/PX,e=clamp(Math.min(x-1,W-2-x,y-1)/8),a=Math.min(1,b.life/.4)*e;if(a<=0)continue;
      const ca=Math.cos(b.a),sa=Math.sin(b.a);
      if(b.k===SHARD){for(let d=-b.s/2;d<=b.s/2;d+=.5)dot(buf,x+ca*d,y+sa*d,d>b.s/2-.6?WHITE:b.c,a);continue;}
      const cx=Math.round(x),cy=Math.round(y),r=Math.ceil(b.s)+1;
      for(let py=-r;py<=r;py++)for(let px=-r;px<=r;px++){const u=(px+.5)*ca+(py+.5)*sa,v=-(px+.5)*sa+(py+.5)*ca,d=Math.abs(u)/b.s+Math.abs(v)/(b.s*.62);
        if(d<=1.3)dot(buf,cx+px,cy+py,d>1?ICE[6]:v<0?(u<0?ICE[1]:ICE[2]):u<0?ICE[3]:ICE[5],a);}}}}
  function burst(R,bits,x,y,ux,uy,n,K,back,lite){for(let i=0;i<n;i++){const ch=R.chance(.2),sp=R.range(120,300)*K;
    bits.add({k:ch?CHUNK:SHARD,x:x+R.range(-4,4),y:y+R.range(-4,4),vx:ux*sp+R.range(-40,40),vy:uy*sp*.6-R.range(80,240),g:.8,drag:.6,bounce:.3,life:R.range(.6,1.1),
      a:R.range(0,TAU),va:R.range(-18,18),s:ch?R.range(1.2,2.2):R.range(1.5,3.5),c:R.pick([ICE[1],ICE[2],ICE[3],ICE[4]]),back});}}

  /* Break Shatter. o: x, y cage centre and ground (effect units), rx, ry, rp (art px), n plates, boss, lite, seed, W canvas width */
  function shatter(o){const R=new Rng(o.seed??1),cx=o.x/PX,cy=o.y/PX,TC=o.boss?.2:.15,lite=!!o.lite,bits=new Bits(R,o.ground),stars=[],plates=[];
    for(let i=0;i<o.n;i++){const a=-Math.PI/2+i/o.n*TAU+R.range(-.1,.1),r=o.rp*R.range(.88,1.1);
      plates.push({x:cx+Math.cos(a)*o.rx,y:cy+Math.sin(a)*o.ry,a,r,sq:R.range(.72,1),back:i%2===1,W:cracksOf(R,r,3)});}
    let t=0,burstDone=false;
    return{
      update(dt){t+=dt;
        if(!burstDone&&t>=TC){burstDone=true;const m=Math.round((o.boss?12:8)*(lite?.6:1)),K=o.boss?1.3:1;
          for(const p of plates)burst(R,bits,p.x*PX,p.y*PX,Math.cos(p.a),Math.sin(p.a),m,K,p.back,lite);
          for(let i=0,g=Math.round((o.boss?16:10)*(lite?.6:1));i<g;i++){const p=R.pick(plates);stars.push({x:p.x+R.range(-o.rx*.4,o.rx*.4),y:p.y+R.range(-6,4),vy:-R.range(4,14),d:R.range(0,.3),life:R.range(.25,.5),max:0,L:R.int(1,3),c:R.chance(.5)?ICE[1]:ICE[2]});}
          for(const s of stars)s.max=s.life;o.shake&&o.shake(o.boss?.18:.1);}
        bits.update(dt);
        for(let i=stars.length-1;i>=0;i--){const s=stars[i];if(s.d>0){s.d-=dt;continue;}if((s.life-=dt)<=0){stars.splice(i,1);continue;}s.y+=s.vy*dt/PX;}},
      draw(fr,layer){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light),back=layer==='back',f=Math.max(1,Math.ceil(t*60-1e-6));
        if(t<TC){const white=f===1||t>=TC-.034,ck=clamp((t-2/60)/Math.max(.01,TC-.034-2/60));
          for(const p of plates){if(p.back!==back)continue;plate(buf,p.x,p.y,p.r,p.sq,white?0:f===2?1:back?3:2);
            if(!white&&f>2)crackDraw(buf,p.x,p.y,p.sq,p.W,ck);if(!back&&!lite)light.glow(p.x,p.y,p.r*1.6,ICE[3],.18);}}
        bits.draw(buf,back,o.W);
        if(back)return;
        for(const s of stars){if(s.d>0)continue;const k=s.life/s.max,L=Math.max(0,Math.round(s.L*Math.sin(Math.PI*k)));star(buf,lite?null:light,s.x,s.y,L,WHITE,s.c,1);}
        if(t<2/60)light.glow(cx,cy,Math.min(40,o.rx*1.5),ICE[2],.4);
        if(t>=TC){const u=t-TC,pop=Math.exp(-u/.08);if(pop>.02){light.glow(cx,cy,Math.min(48,o.rx*2.2),ICE[3],.8*pop);light.glow(cx,cy,Math.min(30,o.rx),WHITE,.6*Math.exp(-u/.04));}}},
      done:()=>burstDone&&bits.list.length===0&&stars.length===0,
      lamp:()=>{const i=t<2/60?.4:t>=TC?1.2*Math.exp(-(t-TC)/.08):0;return i>.03?{i,c:[.55,.8,1],r:170,h:o.lampH}:null;}};}

  /* the ground ring of a Break (flat canvas): o: x, y centre, R0, R1 (art px), delay, dur */
  function shock(o){let t=0;const cx=o.x/PX,cy=o.y/PX;return{update(dt){t+=dt;},
    draw(fr){const u=t-o.delay;if(u<0)return;const k=u/o.dur;if(k>=1)return;const buf=new Px(fr,fr.color),e=1-Math.pow(1-k,3),r=o.R0+(o.R1-o.R0)*e;
      ringPx(buf,cx,cy,r,Math.max(1,2.5*(1-k)),k<.25?WHITE:k<.5?ICE[1]:k<.75?ICE[2]:ICE[3],1.15-k);if(k<.6)ringPx(buf,cx,cy,r*.72,1,ICE[3],.5*(1-k/.6));},
    done:()=>t>o.delay+o.dur};}

  /* Shield chip. o: x, y cage centre and ground (effect units), rx, ry, rp, left (number of plates left), side (+1: the struck
     plate faces +x), seed */
  function chip(o){const R=new Rng(o.seed??1),cx=o.x/PX,cy=o.y/PX,TP=.09,bits=new Bits(R,o.ground),stars=[];
    const phi=o.side>0?R.range(-.45,.25):Math.PI+R.range(-.25,.45),r=o.rp*R.range(.95,1.08),W=cracksOf(R,r,2),ghost=[];
    for(let j=0,g=Math.min(9,o.left);j<g;j++){const a=phi+(j+1)/(g+1)*TAU;ghost.push([cx+Math.cos(a)*o.rx,cy+Math.sin(a)*o.ry,o.rp*R.range(.88,1.05),R.range(.72,1)]);}
    const P0={x:(cx+Math.cos(phi)*o.rx)*PX,y:(cy+Math.sin(phi)*o.ry)*PX,vx:0,vy:0,spin:0,sq:R.range(.8,1)};let t=0,off=false,gone=false,u=0;
    return{
      update(dt){t+=dt;
        if(!off&&t>=TP){off=true;P0.vx=Math.cos(phi)*R.range(80,160);P0.vy=-R.range(140,240);}
        if(off&&!gone){u+=dt;P0.vy+=GRAVITY*.8*dt;P0.vx-=P0.vx*.4*dt;P0.x+=P0.vx*dt;P0.y+=P0.vy*dt;P0.spin+=14*dt;
          if(P0.y>=o.ground-PX||u>.4){gone=true;P0.y=Math.min(P0.y,o.ground-PX);burst(R,bits,P0.x,P0.y,Math.sign(P0.vx)||1,-.2,5,.6,false,false);
            stars.push({x:P0.x/PX,y:P0.y/PX-2,life:.35,max:.35});}}
        bits.update(dt);for(let i=stars.length-1;i>=0;i--)if((stars[i].life-=dt)<=0)stars.splice(i,1);},
      draw(fr){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light),f=Math.max(1,Math.ceil(t*60-1e-6));
        if(t<.2)for(const g of ghost)plate(buf,g[0],g[1],g[2],g[3],f<=2?1:4,f<=2?.8:.75*(1-t/.2));
        if(!gone){const x=P0.x/PX,y=P0.y/PX;
          if(!off){plate(buf,x,y,r,P0.sq,f===1?0:f===2?1:2);if(f>2)crackDraw(buf,x,y,P0.sq,W,clamp((t-2/60)/(TP-2/60)));}
          else{const c=Math.cos(P0.spin);plate(buf,x,y,r,Math.max(.2,Math.abs(c))*P0.sq,c<0?3:2);}}
        bits.draw(buf,false,o.W);
        for(const s of stars){const k=s.life/s.max;star(buf,light,s.x,s.y,Math.round(2*Math.sin(Math.PI*k)),WHITE,ICE[1],1);}
        if(t>=TP){const p=Math.exp(-(t-TP)/.06),x=(cx+Math.cos(phi)*o.rx),y=(cy+Math.sin(phi)*o.ry);if(p>.02){light.glow(x,y,10,ICE[3],.6*p);light.glow(x,y,5,WHITE,.5*p);}}},
      done:()=>gone&&bits.list.length===0&&stars.length===0};}

  /* Weakness ping. o: x, y centre (effect units), C (6-step ramp, white first) */
  function ping(o){const cx=Math.floor(o.x/PX),cy=Math.floor(o.y/PX),C=o.C,D=.4;let t=0;
    const diamond=(buf,r,c,a)=>{const R=Math.round(r);for(let i=0;i<=R;i++){const j=R-i;dot(buf,cx+i,cy+j,c,a);dot(buf,cx-i,cy+j,c,a);dot(buf,cx+i,cy-j,c,a);dot(buf,cx-i,cy-j,c,a);}};
    return{update(dt){t+=dt;},
      draw(fr){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light),f=Math.max(1,Math.ceil(t*60-1e-6));
        if(f<=2){star(buf,null,cx,cy,f===1?3:5,WHITE,f===1?WHITE:C[1],1);}
        else{const k=clamp((t-2/60)/D),r=3+11*(1-Math.pow(1-k,3));diamond(buf,r,k<.25?WHITE:k<.5?C[1]:k<.75?C[2]:C[3],1.1-k);
          if(k<.5)diamond(buf,r*.55,C[2],1-k*2);
          if(k<.7&&Math.sin(t*50)>-.2){const R=Math.round(r);buf.set(cx+R+1,cy,WHITE);buf.set(cx-R-1,cy,WHITE);buf.set(cx,cy+R+1,WHITE);buf.set(cx,cy-R-1,WHITE);}}
        light.glow(cx+.5,cy+.5,9,C[2],.7*Math.exp(-t/.08));},
      done:()=>t>D+2/60+.02};}

  /* ---------- Embervale wrappers ---------- */
  let seed=1;
  /* the cage round enemy e, in art px relative to its feet */
  function cageOf(e){const s=e.s||1,top=((e.boss?110:60)*s)/PIX,fly=(e.d&&e.d.fly||0)/PIX,ry=top*.5+3,rx=Math.max(ry*.85,(e.r||16)*s/PIX+8);
    return{cy:-(fly+top*.5),rx,ry,top,fly,rp:clamp(Math.min(rx,ry)*.42,4,9)};}
  const live=[],chips=[],pings=[],alive=a=>{for(let i=a.length-1;i>=0;i--)if(!a[i]||a[i].dead)a.splice(i,1);return a.length;};
  /* the Break: cage, cracks, shatter, ground ring */
  function pxBreakfx(e){if(!e||!e.d||alive(live)>=6)return null;const C=cageOf(e),boss=!!e.boss,lite=!!PERF.lite,n=boss?10:clamp(4+(e.shMax||2),6,9);
    const w=boss?256:200,hh=boss?200:150,ay=hh-14,R1=C.rx*2.6+16,N=Math.ceil(R1)+3;
    pxfx(c=>shock({x:c.x,y:c.y,R0:C.rx*.6,R1,delay:boss?.2:.15,dur:.42}),{mode:'flat',x:e.x,y:e.y,w:N*2,hh:N*2,ax:N,ay:N,nolight:true,pri:1,ttl:1.2});
    const H=pxfx(c=>shatter({x:c.x,y:c.y+C.cy*PX,ground:c.y,rx:C.rx,ry:C.ry,rp:C.rp,n,boss,lite,W:w,seed:seed++,lampH:-C.cy*PIX,shake:PXK.shake}),
      {x:e.x,y:e.y,w,hh,ay,split:true,lamp:!lite,pri:boss?2:1,ttl:3});
    if(H)live.push(H);return H;}
  /* a shield point knocked off: one plate spalls off on the side facing the hero */
  function pxBreakfxChip(e){if(!e||!e.d||alive(chips)>=8)return null;const C=cageOf(e),side=P&&P.x>e.x?1:-1;
    const H=pxfx(c=>chip({x:c.x,y:c.y+C.cy*PX,ground:c.y,rx:C.rx,ry:C.ry,rp:C.rp,left:Math.max(0,e.sh||0),side,W:128,seed:seed++}),{x:e.x,y:e.y+2,w:128,hh:112,ay:100,pri:1,ttl:2});
    if(H)chips.push(H);return H;}
  const ELEM={fire:'#ff8a3d',ice:'#7fd8ff',lightning:'#ffe26b',wind:'#8affc8',light:'#fff3a6',dark:'#c08aff'},RAMPS={};
  const rampFor=k=>{const c=ELEM[k]||'#dfe8ff';return RAMPS[c]||(RAMPS[c]=PXK.rampOf(c));};
  /* a weakness discovered: a diamond ping over the head, in the element's colour (kind: fire ice lightning wind light dark or a weapon) */
  function pxBreakfxPing(e,kind){if(!e||!e.d||alive(pings)>=6)return null;const C=cageOf(e),h=(C.fly+C.top)*PIX+18,R=rampFor(kind);
    const H=pxfx(c=>ping({x:c.x,y:c.y,C:R}),{x:e.x,y:e.y+3,h,w:40,hh:40,ax:20,ay:20,pri:1,ttl:1});if(H)pings.push(H);return H;}

  /* ---------- wiring ---------- */
  const brk=new Map();
  onEv('pxBreak',e=>{try{if(!e||e.dead)return;const H0=brk.get(e);if(H0&&!H0.dead)return;const H=pxBreakfx(e);if(H)brk.set(e,H);}catch(err){}});
  {const o=shieldHit;shieldHit=function(e,dt){const sh0=e?e.sh:0,rv0=e?e.reveal:null;const r=o(e,dt);
    try{if(e&&!e.dead){
      if(e.reveal!=null&&e.reveal!==rv0){const W=weakOf(e.type)||[];let k=dt;if(dt==='*')k=W.find(w=>ELEM[w])||W[0];pxBreakfxPing(e,k);}
      if(sh0>0&&e.sh<sh0&&e.sh>0)pxBreakfxChip(e);}}catch(err){}
    return r;};}
  onEv('update',()=>{if(brk.size)for(const [e,H] of brk)if(!H||H.dead)brk.delete(e);});
  onEv('pxClear',()=>{brk.clear();live.length=0;chips.length=0;pings.length=0;});

  const labFoe=(x,y)=>{const e=mkEnemy('wolf',x,y,Math.max(1,P.lvl-2),null);e.state='idle';e.ang=Math.PI;enemies.push(e);return e;};
  pxlab('breakfx-break','Break Shatter (wolf)','Combat','orig',(x,y)=>breakEnemy(labFoe(x,y)));
  pxlab('breakfx-boss','Break Shatter (boss cage)','Combat','orig',(x,y)=>{const e=mkEnemy('aldric',x+50,y,P.lvl,null);pxBreakfx(e);});
  pxlab('breakfx-chip','Shield chip (fire weakness hit)','Combat','orig',(x,y)=>{const e=labFoe(x,y);e.shCd=0;e.sh=Math.max(3,e.sh);shieldHit(e,'fire');});
  pxlab('breakfx-ping','Weakness reveal ping','Combat','orig',(x,y)=>pxBreakfxPing(labFoe(x,y),'fire'));
  return{pxBreakfx,pxBreakfxChip,pxBreakfxPing};})();
