/* SNOW & LEAVES (Sprite Fusion "Snow" and "Falling Leaves", MIT, ported; "Bough Snow", "Rustle" and "Leaf Whirl" original, in
   Sprite Fusion's style): pixel snowfall over the frost zones and leaves swinging down from the trees around the hero.
   SNOW (SF, ported). A loop, full on its first frame. Breeze wind(t) = wind + 16 noise(0.3 t) (1-D value noise, wind 14 by default).
     Flakes enter 0-40 u above the area's top at x in [x - 60, x + w]; three depths fall at 26 / 52 / 86 u/s (x 0.75-1.25) and move
     wind x 0.5 / 0.9 / 1.3 + cos(f t + ph) x sway 8 / 16 / 30 u/s (x 0.6-1.2, f 0.8-1.8 rad/s); 40 u past the right edge they wrap by w + 100.
     Far (260): 1 px, #6c7cb8 or #9fb1e6, gone at the ground (40 % already within 30 u of it). Mid (150): 2x2, W top-left, w top-right
     and bottom-left, b bottom-right. Near (30): 7x7 crystals flipping every 1/3 s between two frames, or a still 5x5 diamond.
     Mid and near flakes lie 1-2.6 s one row above the ground (a near one 3 px: w W b) and Bayer-dither out over their last 0.8 s.
     Layers: back = far, drift, mid; front = near. Palette W #ffffff, w #e3edff, b #9fb1e6, d #6c7cb8; drift top #e9f0ff, body
     #c3cff0, ground line #8e9ccc (stacks 1-5 px from two noise octaves). Opaque pixels only, no light, no hooks.
     Embervale: the snow lives in camera slabs ('bill' canvases 240 x 128 / 144 art px, amb .8, no light, pri 0) laid out from the
     screen itself: a near row whose ground row is the bottom edge of the view (2 slabs, perspective draws its pixels ~1.5x) and a row
     behind the hero reaching the top edge (3 slabs, ~0.9x); the near row weighs crystals 1.5x and far specks .55x, the back row the
     reverse (.45x / 1.15x). Slabs follow the camera on the art-pixel grid and pan their flakes back by the same amount (wrapping
     toroidally), so the snow stays put in the world while the view moves. Each flake lands at its own depth (spread over .5 of the
     slab), so landings dot the ground instead of lining up. Live density by zone (snowfield 1, frostholm .6, whitepine .55, g3downs .8,
     g3coast .85, peak .5 in a violet ramp #ece6ff #b2a4ea #7466b8, Stormcrown .8 as a blizzard: wind 130 u/s, far and mid flakes drawn
     as streaks 0.05 s of their velocity long); it eases .3/s across zone edges: flakes above the live share park when they land
     (thinning without pops) and re-enter from the top when it rises.
   FALLING LEAVES (SF, ported). A leaf falls swinging: x = x0 + sin(ph) amp (amp 14-34 u, ph at 1.8-2.8 rad/s), y at vy 34-56 u/s x
     (0.45 + 0.9 |cos ph|), tilt cos(ph) x 0.75 rad (far ones +0.3), width 0.35 + 0.65 |cos flip| (0.4 rad/s, 6 rad/s on 25 % of half
     swings); within 2 u of the ground it lies 2.5-5 s at 0.3x its tilt, dithering out over the last 1 s, then re-enters. 65 % back,
     35 % front. Sprites: oval 12x7, round 9x8, maple 11x10; L light lobes, B body, S shade, D 1 px outline, rib R = S, stem T = D;
     palettes orange #ffc86a #f08a2a #b8521a #5e240e, red #ff8a66 #d8382a #9a1f22 #470f15, yellow #fff09a #f0c83a #b88a1c #5a3f10,
     brown #c99a62 #9a6a3b #6b4424 #33200f. Rotation by inverse-mapped nearest sampling: no holes, no smoothing.
     Embervale: one emitter per tree on the 6 trees nearest the hero (oak, aoak and birch: objGrid props and the forest decoGrid), sized
     from the tree's atlas frame. Leaves are born inside the crown ellipse and dither in over .35 s, in 9x5 / 7x7 / 9x8 versions of SF's
     three shapes (the game's own leaves are 7 px at 1.4x), coloured from the tree's FPAL ramp as [5th, 4th, 3rd, 1st] (autumnR, autumnO,
     gold; village greens with one yellow or brown leaf in three; birch yellow-green). Two canvases share one simulation: far leaves
     30 u behind the crown (hidden by it until they clear it), near ones 40 u in front; each lands at its own depth (near -6..38 u,
     far -80..-32 u) and lies flat (0.5x vertical foreshortening, random yaw). Drift 8 u/s x (0.5 + 0.7 windAt): the gusts that bend
     the trees carry the leaves, and a strong gust (> 1.5) shakes waiting leaves loose 3x sooner. aoak 6 leaves (re-entry gap 0.4-2.5 s),
     gold oak 5, birch 4, green oak 3 (gap 3-9 s). */
const {pxSnowleaves,pxSnowleavesTree,pxSnowleavesRustle,pxSnowleavesBough,pxSnowleavesWhirl}=(function(){'use strict';
  const {Px,dot,bayer,Rng,hex,cl:clamp,TAU,PXW:PX,hash}=PXK;
  const GRAVITY=1900,K=PX/PIX;
  const noise=(x,seed=0)=>{const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);return hash(i,seed)*2-1+(hash(i+1,seed)-hash(i,seed))*2*u;};
  function sprite(rows,pal){const h=rows.length,w=Math.max(...rows.map(r=>r.length)),data=new Uint32Array(w*h);
    rows.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch!=='.')data[y*w+x]=pal[ch]??0;}));return{w,h,data};}
  function blitC(buf,s,cx,cy,a=1){const x0=Math.round(cx-s.w/2),y0=Math.round(cy-s.h/2);
    for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){const c=s.data[y*s.w+x];if(c>>>24&&(a>=1||a>bayer(x0+x,y0+y)))buf.set(x0+x,y0+y,c);}}
  /* SF's rotate-and-squash blit (sx: squash in the sprite's own frame), plus sy: a vertical foreshortening after the rotation, for a
     sprite lying flat on the ground (sy 1 = SF) */
  function blitRot(buf,s,cx,cy,ang,a=1,sx=1,sy=1){const c=Math.cos(ang),sn=Math.sin(ang),r=Math.ceil(Math.hypot(s.w*Math.abs(sx),s.h)/2)+1,ry=Math.ceil(r*sy),px0=Math.round(cx),py0=Math.round(cy);
    for(let y=-ry;y<=ry;y++){const yy=y/sy;for(let x=-r;x<=r;x++){
      const u=(c*x+sn*yy)/(sx||1e-3)+s.w/2,v=-sn*x+c*yy+s.h/2,iu=Math.floor(u),iv=Math.floor(v);
      if(iu<0||iv<0||iu>=s.w||iv>=s.h)continue;
      const col=s.data[iv*s.w+iu],px=px0+x,py=py0+y;
      if(!(col>>>24)||(a<1&&a<=bayer(px,py)))continue;
      buf.set(px,py,col);}}}

  /* ---------- Snow (SF) ---------- */
  const FALL=[26,52,86],SWAY=[8,16,30];
  const CRYSTAL=[["...b...",".b.w.b.","..bwb..","bwwWwwb","..bwb..",".b.w.b.","...b..."],["b..b..b",".b.w.b.","..wWw..","bwWWWwb","..wWw..",".b.w.b.","b..b..b"],["..b..",".bwb.","bwWwb",".bwb.","..b.."]];
  const CLUMP=[[".Ww.","wWWb",".bb."],["Ww","wb"],["W"]],HEAP=[[".WWW.","wWWWb"],[".W.","wWb"],["W"]];
  function flakeSet(W,w,b,d){const F={W:hex(W),w:hex(w),b:hex(b),d:hex(d)};F.cr=CRYSTAL.map(r=>sprite(r,F));F.cl=CLUMP.map(r=>sprite(r,F));F.hp=HEAP.map(r=>sprite(r,F));return F;}
  const FLAKE=flakeSet('#ffffff','#e3edff','#9fb1e6','#6c7cb8'),VIOLET=flakeSet('#ffffff','#f1ecff','#d4caf6','#b8aaee');
  /* Embervale's flakes fall over lit snow, not SF's night sky: the same roles shifted two steps lighter, so a flake never reads as a dark speck */
  const FLAKE_EV=flakeSet('#ffffff','#f2f6ff','#d8e2f8','#bccaee');
  const DRIFT=['#e9f0ff','#c3cff0','#8e9ccc'].map(hex);
  /* snow(o): SF's options (area, ground, density, wind, drift, seed) plus Embervale's: mix (per-depth count multipliers), land (each
     flake lands up to this far above the ground, i.e. further back), live ({d, wind, streak, F}: the share of flakes falling, the
     breeze, the streak length and the palette, read every frame), streak; pan(dx, dy) shifts every flake (camera slabs) */
  function snow(o={}){
    const A=o.area??{x:300,y:230,w:680,h:370},X0=A.x,X1=A.x+A.w,TOP=A.y,GB=A.y+A.h;
    const groundAt=x=>o.ground===undefined?GB:typeof o.ground==='number'?o.ground:o.ground(x);
    const R=new Rng(o.seed??1),D=o.density??1,WIND=o.wind??14,LAND=o.land??0,L=o.live??null,MIX=o.mix??[1,1,1];
    const flakes=[];
    const reset=(f,top)=>{
      f.x=R.range(X0-60,X1);if(LAND)f.gj=R.range(0,LAND);
      f.y=top?TOP-R.range(0,40):R.range(TOP,groundAt(f.x)-f.gj);
      f.vy=FALL[f.layer]*R.range(.75,1.25);f.sway=SWAY[f.layer]*R.range(.6,1.2);f.f=R.range(.8,1.8);f.ph=R.range(0,TAU);f.rest=-1;f.kind=R.int(0,2);f.off=false;};
    for(const [layer,n] of [[0,260],[1,150],[2,30]])
      for(let i=0;i<Math.round(n*D*MIX[layer]);i++){const f={x:0,y:0,vy:0,vx:0,sway:0,f:0,ph:0,layer,rest:-1,kind:0,gj:0,q:hash(i,layer+31),off:false};
        reset(f,false);if(L&&f.q>=L.d)f.off=true;flakes.push(f);}
    let t=0,stopped=false;
    const again=i=>{const f=flakes[i];if(stopped){flakes.splice(i,1);return;}if(L&&f.q>=L.d){f.off=true;f.rest=-1;return;}reset(f,true);};
    const draw=(buf,layer)=>{const F=L?L.F:FLAKE,S=L?L.streak:o.streak||0;
      for(const f of flakes){if(f.layer!==layer||f.off)continue;const x=f.x/PX,y=f.y/PX;
        if(f.rest>=0){const a=Math.min(1,f.rest/.8),fy=(f.y+1)/PX;dot(buf,x,fy-1,F.W,a);if(layer===2){dot(buf,x-1,fy-1,F.w,a);dot(buf,x+1,fy-1,F.b,a);}continue;}
        if(S>.05&&layer<2){const k=.05*S,tx=x-f.vx*k/PX,ty=y-f.vy*k/PX;buf.line(tx,ty,x,y,layer?F.b:F.d);if(layer){dot(buf,x,y,F.W);dot(buf,x+1,y,F.w);}else dot(buf,x,y,F.b);continue;}
        if(layer===0)dot(buf,x,y,hash(Math.floor(f.ph*100),1)<.5?F.d:F.b);
        else if(layer===1){dot(buf,x,y,F.W);dot(buf,x+1,y,F.w);dot(buf,x,y+1,F.w);dot(buf,x+1,y+1,F.b);}
        else blitC(buf,F.cr[f.kind===2?2:Math.floor(t*3+f.ph)&1],x,y);}};
    return{
      update(dt){t+=dt;const wind=(L?L.wind:WIND)+16*noise(t*.3,5);
        for(let i=flakes.length-1;i>=0;i--){const f=flakes[i];
          if(f.off){if(stopped)flakes.splice(i,1);else if(L&&f.q<L.d)reset(f,true);continue;}
          if(f.rest>=0){if((f.rest-=dt)<0)again(i);continue;}
          f.vx=wind*(.5+f.layer*.4)+Math.cos(t*f.f+f.ph)*f.sway;
          f.y+=f.vy*dt;f.x+=f.vx*dt;
          const g=groundAt(f.x)-f.gj;
          if(f.y>=g-1){if(f.layer===0)again(i);else{f.y=g-1;f.rest=R.range(1,2.6);}continue;}
          if(f.layer===0&&f.y>g-30&&hash(Math.floor(f.ph*1000))<.4){again(i);continue;}
          if(f.x>X1+40)f.x-=X1-X0+100;}},
      pan(dx,dy){const top=TOP-40,span=GB-top,W=X1-X0+100;
        for(let i=flakes.length-1;i>=0;i--){const f=flakes[i];if(f.off)continue;f.x+=dx;f.y+=dy;
          if(f.x>X1+40||f.x<X0-60)f.x=X0-60+(((f.x-X0+60)%W)+W)%W;
          if(f.rest>=0){if(f.y<TOP||f.y>GB)again(i);continue;}
          if(f.y>GB||f.y<top){f.y=top+(((f.y-top)%span)+span)%span;f.gj=Math.min(f.gj,Math.max(0,GB-f.y-4));}}},
      draw(fr,layer){const buf=new Px(fr,fr.color);
        if(layer!=='front'){draw(buf,0);
          if(o.drift??true)for(let x=Math.floor(X0/PX)-30;x<Math.ceil(X1/PX)+30;x++){
            const fy=Math.round(groundAt(x*PX)/PX),h=1+Math.round(1.6+noise(x*.09,11)*1.4+noise(x*.31,12)*.6);
            for(let r=0;r<h;r++)buf.set(x,fy-1-r,r===h-1?DRIFT[0]:DRIFT[1]);
            buf.set(x,fy,DRIFT[2]);if(hash(x,13)<.3)buf.set(x,fy+1,DRIFT[2]);}
          draw(buf,1);}
        if(layer!=='back')draw(buf,2);},
      stop(){stopped=true;},
      done:()=>stopped&&flakes.length===0};}

  /* ---------- Falling Leaves (SF) ---------- */
  const SHAPES=[
    ["......DDDD..","...DDDLLLBD.",".DDLLLRLBBBD","TRRRRRRRRRRD",".DDBBBBBRSSD","...DDDSSSSD.","......DDDD.."],
    ["...DDD...","..DLLBD..",".DLLLBBD.","DLLRBBBSD","DLBBRBSSD",".DBBBRSD.","..DDSSD..","....T...."],
    [".....D.....","....DLD....",".DD.DLD.DD.",".DLDDLDDLD.","..DLLLBBD..","DDDLLRBBDDD",".DLLBRBSSD.","..DDBRSDD..","....DRD....",".....T....."]];
  /* Embervale's leaves: the same three shapes and roles at ~70 % (the game's own falling leaves are 7 px drawn at 1.4x) */
  const EV_SHAPES=[
    ["....DDD..","..DDLLBD.","TRRRRRRRD","..DBBSSD.","....DDD.."],
    ["..DDD..",".DLLBD.","DLLRBSD","DLBRBSD",".DBRSD.","..DSD..","...T..."],
    ["....D....","...DLD...",".D.DLD.D.",".DLDRDBD.","DDLLRBBDD",".DLBRBSD.","..DDRDD..","....T...."]];
  const PALETTES=[["#ffc86a","#f08a2a","#b8521a","#5e240e"],["#ff8a66","#d8382a","#9a1f22","#470f15"],["#fff09a","#f0c83a","#b88a1c","#5a3f10"],["#c99a62","#9a6a3b","#6b4424","#33200f"]];
  const SFP={orange:PALETTES[0],red:PALETTES[1],yellow:PALETTES[2],brown:PALETTES[3]};
  const LSPR=new Map();
  function leafSprites(colors,shapes){const key=colors.map(p=>p.join('')).join('|')+(shapes===SHAPES?'s':'e');let S=LSPR.get(key);if(S)return S;
    const pals=colors.map(p=>{const [L,B,S2,D]=p.map(hex);return{L,B,S:S2,D,R:S2,T:D};});S=shapes.map(rows=>pals.map(p=>sprite(rows,p)));if(LSPR.size>64)LSPR.clear();LSPR.set(key,S);return S;}
  /* fallingLeaves(o): SF's options (area, ground, leaves, colors, drift, litter, seed) plus Embervale's: shapes, spawn (leaves are born
     inside a band this tall under the area's top instead of above it, dithering in over .35 s), crown {cx,cy,rx,ry} (born inside
     this ellipse), fill (false: start empty, staggered over `stagger` s), gap [a,b] (wait before re-entering), flat (vertical
     foreshortening of a lying leaf), lay {n:[a,b], f:[a,b]} + sp (near / far leaves land at these depths, world units, projected with
     the camera's sin(pitch)), gust() (drift multiplier); burst(n, bx, k) shakes n extra leaves loose, kicked away from bx */
  function fallingLeaves(o={}){
    const A=o.area??{x:300,y:230,w:680,h:370},X0=A.x,X1=A.x+A.w,TOP=A.y;
    const groundAt=x=>o.ground===undefined?A.y+A.h:typeof o.ground==='number'?o.ground:o.ground(x);
    const R=new Rng(o.seed??1),DRIFT_=o.drift??12,SPAWN=o.spawn||0,FLAT=o.flat??1,LAY=o.lay||null,GAP=o.gap||null,CROWN=o.crown||null,SP=o.sp??.5;
    const colors=o.colors??PALETTES,LEAVES=leafSprites(colors,o.shapes??SHAPES),NP=colors.length;
    const leaves=[];
    const mk=()=>({x0:0,x:0,y:0,vy:0,amp:0,w:0,ph:0,flip:0,shape:0,pal:0,near:false,rest:-1,ang:0,gd:0,yaw:0,age:0,kx:0,once:false,wait:0});
    const reset=(l,top)=>{
      l.x0=R.range(X0-40,X1);
      l.y=top?(SPAWN?TOP+R.range(0,SPAWN):TOP-R.range(0,40)):R.range(TOP,groundAt(l.x0)-20);
      l.vy=R.range(34,56);l.amp=R.range(14,34);l.w=R.range(1.8,2.8);l.ph=R.range(0,TAU);l.flip=R.range(0,TAU);l.near=R.chance(.35);
      l.shape=R.int(0,LEAVES.length-1);l.pal=R.int(0,NP-1);l.rest=-1;l.ang=0;l.x=l.x0;
      if(CROWN&&top){const u=(l.y-CROWN.cy)/CROWN.ry,hw=CROWN.rx*Math.sqrt(Math.max(0,1-u*u)),x=CROWN.cx+(l.x0-(X0-40))/(X1-X0+40)*2*hw-hw;l.x0=x-Math.sin(l.ph)*l.amp;l.x=x;}
      l.gd=LAY?(l.near?R.range(LAY.n[0],LAY.n[1]):R.range(LAY.f[0],LAY.f[1]))*SP*K:0;l.yaw=FLAT<1?R.range(-1.1,1.1):0;l.age=0;l.kx=0;l.once=false;l.wait=0;};
    for(let i=0;i<(o.leaves??80);i++){const l=mk();const fill=o.fill??true;reset(l,!fill);if(fill)l.age=9;else l.wait=R.range(0,o.stagger??4);leaves.push(l);}
    const litter=(o.litter??true)?Array.from({length:40},(_,i)=>({x:X0/PX-20+hash(i,1)*((X1-X0)/PX+40),shape:Math.floor(hash(i,2)*LEAVES.length),pal:Math.floor(hash(i,4)*NP),ang:(hash(i,5)-.5)*.6})):[];
    let stopped=false;
    const again=i=>{const l=leaves[i];if(stopped||l.once){leaves.splice(i,1);return;}reset(l,true);if(GAP)l.wait=R.range(GAP[0],GAP[1]);};
    const drawL=(buf,near,off)=>{
      for(const l of leaves){if(l.near!==near||l.wait>0)continue;const s=LEAVES[l.shape][l.pal];
        if(l.rest>=0)blitRot(buf,s,l.x/PX,(l.y+2+off)/PX-s.h*FLAT/2+1,l.ang*.3+l.yaw,Math.min(1,l.rest),1,FLAT);
        else blitRot(buf,s,l.x/PX,(l.y+off)/PX,l.ang,SPAWN?Math.min(1,l.age/.35):1,.35+.65*Math.abs(Math.cos(l.flip)));}};
    return{
      update(dt){const gust=o.gust?o.gust():1;
        for(let i=leaves.length-1;i>=0;i--){const l=leaves[i];
          if(l.wait>0){l.wait-=dt*(gust>1.5?3:1);continue;}
          if(l.rest>=0){if((l.rest-=dt)<0)again(i);continue;}
          l.age+=dt;l.ph+=l.w*dt;l.x0+=DRIFT_*gust*dt;
          if(l.kx){l.x0+=l.kx*dt;l.kx-=l.kx*2.4*dt;if(Math.abs(l.kx)<2)l.kx=0;}
          l.x=l.x0+Math.sin(l.ph)*l.amp;
          l.y+=l.vy*(.45+.9*Math.abs(Math.cos(l.ph)))*dt;
          l.ang=Math.cos(l.ph)*.75+(l.near?0:.3);
          l.flip+=(Math.abs(l.kx)>30||hash(Math.floor(l.ph/Math.PI),Math.floor(l.x0))<.25?6:.4)*dt;
          const g=groundAt(l.x)+l.gd;
          if(l.y>=g-2){l.y=g-2;l.rest=R.range(2.5,5);}}},
      burst(n,bx,k=1){if(stopped)return;for(let i=0;i<n;i++){const l=mk();reset(l,true);l.once=true;l.age=.22;l.kx=(l.x<bx?-1:1)*R.range(40,110)*k;leaves.push(l);}},
      draw(f,layer,dz=0){const buf=new Px(f,f.color),off=-dz*SP*K;
        if(layer!=='front'){for(const l of litter)blitRot(buf,LEAVES[l.shape][l.pal],l.x,groundAt(l.x*PX)/PX-1,l.ang);drawL(buf,false,off);}
        if(layer!=='back')drawL(buf,true,off);},
      stop(){stopped=true;},
      done:()=>stopped&&leaves.length===0};}

  /* BOUGH SNOW (original, in Sprite Fusion's style): a clump of snow slides off a snow-laden pine bough, falls, breaks and bursts into
     powder on the ground. Recipe (size S): 0-0.12 s the clump (4x3: .Ww. / wWWb / .bb.) slips outward at 0.6 x 18-34 u/s along the
     bough tip; then it drops under 0.8 g (1520 u/s2, drag 0.8), shedding powder at 40 px/s (single w / b pixels falling 16-30 u/s with a
     +-14 u/s sway, 0.5-1.1 s, Bayer-faded); halfway down it breaks into the main lump plus 1-2 bits (Ww / wb, W) kicked +-20-50 u/s.
     Each lump that lands: frame 1 (<= 1/60 s after) a white splat 6 px (bits 3) with a w spray row above it, frame 2 an 8 px w line with
     b ends; 3 powder discs (alpha .7 -> 0 over 0.45-0.8 s, r 1.6-2.8 px growing 1.5x, rising 8-24 u/s, drag 4; the only alpha in the
     effect, dust as SF does it) and 6 chips (W / w / b, 40-150 u/s out, 90-260 u/s up, full g, bouncing x0.3 above 220 u/s, then
     settling and dithering out); a heap (.WWW. / wWWWb, bits .W. / wWb) lies 2-3 s and dithers out over its last 1 s. Colours from
     SF Snow's flake ramp and drift body (#c3cff0, #e9f0ff powder). No light. Feel: a soft, cold "pff" and nothing on the camera. */
  const PT={POWDER:0,CHIP:1,DUST:2};
  function boughSnow(o={}){
    const X=o.x??64,Y=o.y??40,G=o.ground??150,S=o.size??1,dir=o.dir??1,R=new Rng(o.seed??1),F=o.pal??FLAKE,LAND=o.land??6;
    const lumps=[{x:X,y:Y,vx:dir*R.range(18,34)*S,vy:0,sz:0,land:-1,heap:R.range(2,3),gj:R.range(0,LAND)}];
    const ps=[];let t=0,split=false,shed=0;
    const spawn=(k,x,y,vx,vy,life,col,size=1)=>ps.push({k,x,y,vx,vy,life,max:life,col,size,seed:R.next()*100,g:G-R.range(0,LAND)});
    const land=L=>{const n=L.sz===0?6:L.sz===1?3:1;
      for(let i=0;i<Math.round(n*S);i++)spawn(PT.CHIP,L.x,L.y-1,R.range(-1,1)*R.range(40,150)*S,-R.range(90,260)*S,R.range(.6,1.2),R.pick([F.W,F.w,F.b]));
      for(let i=0;i<(L.sz===0?3:1);i++)spawn(PT.DUST,L.x+R.range(-4,4),L.y-2,R.range(-40,40),-R.range(8,24),R.range(.45,.8),i?DRIFT[0]:DRIFT[1],R.range(1.6,2.8)*Math.sqrt(S)*(L.sz?.65:1));};
    return{
      update(dt){t+=dt;
        for(const L of lumps){if(L.land>=0){L.land+=dt;continue;}
          if(t<.12)L.x+=L.vx*.6*dt;
          else{L.vy+=GRAVITY*.8*dt;L.vx-=L.vx*.8*dt;L.x+=L.vx*dt;L.y+=L.vy*dt;}
          if((shed+=dt*40)>=1){shed-=1;spawn(PT.POWDER,L.x+R.range(-2,2),L.y,R.range(-6,6),R.range(16,30),R.range(.5,1.1),R.chance(.6)?F.w:F.b);}
          const g=G-L.gj;if(L.y>=g){L.y=g;L.land=0;land(L);}}
        if(!split&&t>.12&&lumps[0].land<0&&lumps[0].y>Y+(G-Y)*.5){split=true;const M=lumps[0],n=R.chance(.5)?2:1;
          for(let i=0;i<n;i++)lumps.push({x:M.x+R.range(-2,2),y:M.y,vx:M.vx+R.sign()*R.range(20,50),vy:M.vy*R.range(.8,1),sz:i?2:1,land:-1,heap:R.range(1.4,2.2),gj:R.range(0,LAND)});}
        for(let i=ps.length-1;i>=0;i--){const p=ps[i];if((p.life-=dt)<=0){ps.splice(i,1);continue;}
          switch(p.k){
            case PT.POWDER:p.vx+=Math.sin(t*3+p.seed)*14*dt;p.vx-=p.vx*1.5*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.y>=p.g)p.life=Math.min(p.life,.15);break;
            case PT.CHIP:{p.vy+=GRAVITY*dt;p.vx-=p.vx*.6*dt;const ny=p.y+p.vy*dt;p.x+=p.vx*dt;
              if(p.vy>0&&p.y<=p.g&&ny>=p.g){p.y=p.g-.5;if(p.vy>220){p.vy=-p.vy*.3;p.vx=p.vx*.5+R.range(-20,20);}else{p.vx=p.vy=0;p.life=Math.min(p.life,.5);}}else p.y=ny;break;}
            case PT.DUST:p.vx-=p.vx*4*dt;p.vy-=p.vy*4*dt+10*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;}}},
      draw(fr){const buf=new Px(fr,fr.color);
        for(const p of ps){if(p.k!==PT.DUST)continue;const k=p.life/p.max;buf.alphaDisc(p.x/PX,p.y/PX,p.size*(.6+(1-k)*.9),p.col,Math.pow(k,1.3)*.7);}
        for(const L of lumps){const x=L.x/PX,y=L.y/PX;
          if(L.land<0){blitC(buf,F.cl[L.sz],x,y);continue;}
          const w=(L.sz?3:6)*S,lt=L.land;
          if(lt<=1/60){for(let i=-w/2;i<=w/2;i++){dot(buf,x+i,y-1,F.W);if((i&1)===0)dot(buf,x+i,y-2,F.w);}continue;}
          if(lt<=2/60){const w2=w+2;for(let i=-w2/2;i<=w2/2;i++)dot(buf,x+i,y-1,Math.abs(i)>=w2/2-1?F.b:F.w);continue;}
          if(L.sz<2&&lt<L.heap)blitC(buf,F.hp[L.sz],x,y-1,Math.min(1,L.heap-lt));}
        for(const p of ps){if(p.k===PT.DUST)continue;const k=p.life/p.max,px=Math.floor(p.x/PX),py=Math.floor(p.y/PX);
          if(p.k===PT.POWDER)dot(buf,px,py,p.col,Math.min(1,k*1.6));
          else if(k>.25||bayer(px,py)<k*4)buf.set(px,py,p.col);}},
      done:()=>t>.3&&ps.length===0&&lumps.every(L=>L.land>=0&&(L.sz===2||L.land>=L.heap))};}

  /* LEAF WHIRL (original, in Sprite Fusion's style): a gust spins the litter up into a little whirlwind, then lets it go. Recipe (size S):
     12 leaves (x sqrt S) lie flat where the gust touches down and dither in over 0.2 s; each lifts after 0-0.6 s, rising at 60-95 u/s
     slowing as it nears 110 u (x S), orbiting the axis at 5-7.5 rad/s (spinning up 1.6x over the first second) on a funnel radius
     6-13 u + 0.22 h, the near half of the orbit drawn in front of the axis and the far half behind it, turning edge-on (width
     0.35 + 0.65 |cos|) twice per turn. At 1.4-2.2 s each leaf is let go: it keeps 0.35 of its orbit speed as a kick (decaying 2.4/s)
     and falls the SF way (swing 10-24 u, vy 34-56 u/s), lands at its depth and lies flat 1.5-3 s before dithering out. Air: three 1 px
     arcs (1.4 rad of the funnel at 0.3 / 0.55 / 0.8 of the height) sweep around at 0.9x the spin, Bayer at 0.6 strength, 0.1-2.1 s;
     dust: 4 SF dust discs (alpha .32) and 10 grit pixels orbit the foot at 1-9 u for 1.3 s, in the zone's dust colour. No light, no hooks. */
  function leafWhirl(o={}){
    const X=o.x??128,G=o.ground??150,S=o.size??1,R=new Rng(o.seed??1),SP=o.sp??.5,CP=o.cp??.87,HM=(o.height??110)*S,N=Math.round((o.leaves??12)*Math.sqrt(S));
    const colors=o.colors??PALETTES,LV=leafSprites(colors,o.shapes??EV_SHAPES),DUST=hex(o.dust??'#a89060'),AIR=hex(o.air??'#eef2e4'),ZB=o.zb??8,ZF=o.zf??44;
    const lv=[];for(let i=0;i<N;i++)lv.push({st:0,dl:R.range(0,.6),th:R.range(0,TAU),om:R.range(5,7.5),r0:R.range(6,13)*S,h:0,vh:R.range(60,95)*S,rel:R.range(1.4,2.2),
      shape:R.int(0,LV.length-1),pal:R.int(0,colors.length-1),flip:R.range(0,TAU),yaw:R.range(-1.1,1.1),x0:0,x:0,y:0,ph:0,amp:0,w:0,vy:0,kx:0,ang:0,rest:-1,gy:G,z:0,near:false});
    const grit=Array.from({length:Math.round(10*S)},(_,i)=>({th:R.range(0,TAU),r:R.range(8,24)*S,h:R.range(1,9),om:R.range(4,7),d:i<4}));
    let t=0;
    const orbit=l=>{const r=l.r0+l.h*.22;l.z=Math.sin(l.th)*r;l.x=X+Math.cos(l.th)*r*K;l.y=G-(l.h*CP-l.z*SP)*K;l.near=l.z>0;};
    for(const l of lv)orbit(l);
    return{
      update(dt){t+=dt;
        for(const g of grit)g.th+=g.om*dt;
        for(let i=lv.length-1;i>=0;i--){const l=lv[i];
          if(l.st===0){if(t>=l.dl)l.st=1;else continue;}
          if(l.st===1){const tl=t-l.dl;l.h+=l.vh*Math.max(.12,1-l.h/HM)*dt;l.th+=l.om*(1+.6*Math.min(1,tl))*dt;orbit(l);l.flip=l.th;l.ang=Math.sin(l.th*.5)*.6;
            if(tl>=l.rel){const r=l.r0+l.h*.22,vt=-Math.sin(l.th)*r*l.om*1.6*K;l.st=2;l.ph=R.range(0,TAU);l.amp=R.range(10,24);l.w=R.range(1.8,2.8);l.vy=R.range(34,56);
              l.x0=l.x-Math.sin(l.ph)*l.amp;l.kx=clamp(vt*.35,-120,120);l.gy=G+(l.near?clamp(l.z,0,ZF-4):clamp(l.z,-70,-ZB-2))*SP*K;}
            continue;}
          if(l.st===2){l.ph+=l.w*dt;if(l.kx){l.x0+=l.kx*dt;l.kx-=l.kx*2.4*dt;}l.x0+=8*dt;l.x=l.x0+Math.sin(l.ph)*l.amp;l.y+=l.vy*(.45+.9*Math.abs(Math.cos(l.ph)))*dt;
            l.ang=Math.cos(l.ph)*.75+(l.near?0:.3);l.flip+=(Math.abs(l.kx)>30?6:.4)*dt;if(l.y>=l.gy-2){l.y=l.gy-2;l.st=3;l.rest=R.range(1.5,3);}continue;}
          if((l.rest-=dt)<0)lv.splice(i,1);}},
      draw(fr,layer,dz=0){const buf=new Px(fr,fr.color),off=-dz*SP*K,front=layer!=='back',back=layer!=='front';
        const e=clamp((t-.1)/.3)*clamp((2.1-t)/.5),eg=clamp((1.3-t)/.4);
        if(eg>0){for(const g of grit){const z=Math.sin(g.th)*g.r;if((z>0?!front:!back))continue;const x=X+Math.cos(g.th)*g.r*K,y=G-(g.h*CP-z*SP)*K+off;
            if(g.d)buf.alphaDisc(x/PX,y/PX,2+g.r*.06,DUST,.32*eg);else dot(buf,x/PX,y/PX,DUST,eg);}}
        if(e>0)for(let k=0;k<3;k++){const h=HM*(.3+.25*k),r=(9*S+h*.22)*1.15,a0=t*6.2*.9+k*2.1;
          for(let j=0;j<=16;j++){const a=a0+j/16*1.4,z=Math.sin(a)*r;if(z>0?!front:!back)continue;dot(buf,(X+Math.cos(a)*r*K)/PX,(G-(h*CP-z*SP)*K+off)/PX,AIR,.6*e*(1-Math.abs(j/8-1)*.5));}}
        for(const l of lv){if(l.near?!front:!back)continue;const s=LV[l.shape][l.pal];
          if(l.st===0)blitRot(buf,s,l.x/PX,(l.y+off)/PX,l.yaw,Math.min(1,t/.2),1,.5);
          else if(l.st===3)blitRot(buf,s,l.x/PX,(l.y+2+off)/PX-s.h*.25+1,l.ang*.3+l.yaw,Math.min(1,l.rest),1,.5);
          else blitRot(buf,s,l.x/PX,(l.y+off)/PX,l.ang,1,.35+.65*Math.abs(Math.cos(l.flip)));}},
      done:()=>t>1&&lv.length===0};}

  /* ---------- Embervale: shared helpers ---------- */
  let NOW=0;
  const frameOf=(spr,fi)=>{const fr=ATL.frames&&ATL.frames[spr];return fr?fr[fi]||fr[0]:null;};
  /* one simulation drawn in two canvases: 'back' dzB world units behind the anchor, 'front' dzF in front (lite: front only) */
  function duo(E,o,dzB,dzF){let gt=-1;const tick=dt=>{if(gt!==gameTime){gt=gameTime;E.update(dt);}};
    const mk=(layer,dz)=>()=>({update:tick,draw:fr=>E.draw(fr,layer,dz),stop:()=>{if(E.stop)E.stop();},done:()=>E.done()});
    const F=pxfx(mk(PERF.lite?undefined:'front',dzF),Object.assign({},o,{y:o.y+dzF})),B=PERF.lite||!F?null:pxfx(mk('back',dzB),Object.assign({},o,{y:o.y+dzB}));
    return{F,B};}
  const alive=H=>!!H&&PXFX.list.includes(H);
  /* trees around (px, py) whose sprite is in `set` (objGrid props and decoGrid trees), nearest first */
  function scanTrees(px,py,set,out){out.length=0;const tx=Math.floor(px/T),ty=Math.floor(py/T);
    for(let y=Math.max(0,ty-9);y<=Math.min(MH-1,ty+8);y++)for(let x=Math.max(0,tx-13);x<=Math.min(MW-1,tx+13);x++){const i=y*MW+x,o=objGrid[i];
      if(o&&o.type==='prop'&&set[o.spr])out.push({o,x:o.x,y:o.y,h:o.h||0,s:o.sc||1,spr:o.spr,fi:o.fi|0,d:(o.x-px)**2+(o.y-py)**2});
      const dl=decoGrid[i];if(dl)for(const d of dl)if(set[d.spr])out.push({o:d,x:d.x,y:d.y,h:d.h||0,s:d.s||1,spr:d.spr,fi:d.fi|0,d:(d.x-px)**2+(d.y-py)**2});}
    return out.sort((a,b)=>a.d-b.d);}

  /* ---------- Embervale: snow slabs ---------- */
  const SNOWZ={snowfield:{d:1,wind:24},frostholm:{d:.6,wind:10},whitepine:{d:.55,wind:6},storm:{d:.8,wind:130,streak:1},peak:{d:.5,wind:30,F:VIOLET},g3downs:{d:.8,wind:16},g3coast:{d:.85,wind:34}};
  const DBG=false;
  const SW=240,SN={H:[],S:[],key:'',kq:'',t:0,full:true,force:null,live:{d:0,wind:14,streak:0,F:FLAKE_EV}};
  let sseed=1;
  /* a slab sits at the camera target + its offset, snapped so it moves by whole art pixels (x by PIX, depth by PIX / sin(pitch)) */
  function slabPos(S){const q=PIX/(CAM.sp||.5);return[Math.round((CAM.x+S.dx)/PIX)*PIX,Math.round((CAM.z+S.dy)/q)*q];}
  function slab(c,S){const H=c.handle;
    const fx=snow({area:{x:0,y:0,w:c.w,h:c.y},ground:c.y,density:S.dens,mix:S.mix,drift:false,seed:S.seed,land:c.y*S.land,live:SN.live});
    let lx=H.x,ly=H.y,le=hdEH(H.x,H.y);
    return{update(dt){const p=slabPos(S);
        if(p[0]!==lx||p[1]!==ly){const e=hdEH(p[0],p[1]);H.x=p[0];H.y=p[1];fx.pan(-(p[0]-lx)*K,((e-le)*CAM.cp-(p[1]-ly)*CAM.sp)*K);lx=p[0];ly=p[1];le=e;}
        fx.update(dt);},
      draw:(fr,layer)=>{fx.draw(fr,layer);if(DBG){const b=new Px(fr,fr.color),c=PXK.rgb(255,40,40);for(let x=0;x<fr.w;x++){b.set(x,0,c);b.set(x,fr.h-1,c);b.set(x,fr.h-3,PXK.rgb(40,255,40));}for(let y=0;y<fr.h;y++){b.set(0,y,c);b.set(fr.w-1,y,c);}}},stop:()=>fx.stop(),done:()=>fx.done()};}
  /* rows of slabs from the screen: row 0's ground row is the view's bottom edge; each next row starts just under the previous top */
  function snowLayout(){if(!VW||!VH||!CAM.sp)return null;const cap=PERF.lite?4:QUAL>=2?6:5,rows=[];let sy=VH*.995,n=0;
    for(let k=0;k<4&&n<cap;k++){const g=screenToGround(VW/2,sy,VW,VH),l=screenToGround(0,sy,VW,VH),r=screenToGround(VW,sy,VW,VH);
      if(!isFinite(g.x+g.y+l.x+r.x))break;
      const hh=k?144:128,up=(hh-2)*PIX,top=toScreen(g.x,up*CAM.cp,g.y-up*CAM.sp,VW,VH).y,m=Math.min(cap-n,clamp(Math.ceil((r.x-l.x)*1.04/(SW*PIX)),1,4));
      rows.push({dx:(l.x+r.x)/2-CAM.x,dy:g.y-CAM.z,n:m,hh});n+=m;if(top<VH*.06)break;sy=Math.min(sy-VH*.1,top+VH*.04);}
    const slabs=[];rows.forEach((r,k)=>{for(let i=0;i<r.n;i++)slabs.push({row:k,dx:r.dx+(i-(r.n-1)/2)*SW*PIX,dy:r.dy,hh:r.hh,mix:k?[1.15,1,.45]:[.55,1,1.5],land:k?.5:.55,seed:0,dens:0});});
    return{key:rows.map(r=>r.n+':'+r.hh).join(','),slabs};}
  function snowSlab(S){if(!S.seed)S.seed=sseed++*977+13;S.dens=(SW*PX)*((S.hh-2)*PX)/(680*370);const p=slabPos(S);
    return pxfx(c=>slab(c,S),{x:p[0],y:p[1],w:SW,hh:S.hh,ay:S.hh-2,pri:0,amb:.8,nolight:true,ttl:1e9});}
  function snowDrop(){for(const H of SN.H)if(H)pxStop(H);SN.H=[];SN.S=[];SN.key='';SN.kq='';}
  function snowTick(dt){const L=SN.live;if(SN.force&&(SN.force.t-=dt)<=0)SN.force=null;
    const zid=ZONES[curZone]&&ZONES[curZone].id,Z=SN.force?SN.force.z:!P||riftRun?null:SNOWZ[zid]||null,td=Z?Z.d*(PERF.lite?.7:1):0;
    if(Z&&SN.full){L.d=td;L.wind=Z.wind;L.streak=Z.streak||0;}
    else{L.d+=clamp(td-L.d,-.3*dt,.3*dt);if(Z){L.wind+=clamp(Z.wind-L.wind,-40*dt,40*dt);L.streak+=clamp((Z.streak||0)-L.streak,-.6*dt,.6*dt);}}
    if(Z)L.F=Z.F||FLAKE_EV;SN.full=false;
    if(!Z&&L.d<=0){if(SN.H.length)snowDrop();return;}
    if(!SN.H.length){const lay=snowLayout();if(lay){SN.key=lay.key;SN.S=lay.slabs;SN.H=SN.S.map(snowSlab);}SN.t=1;return;}
    if((SN.t-=dt)>0)return;SN.t=1;
    const lay=snowLayout();if(!lay)return;
    if(lay.key===SN.key){lay.slabs.forEach((s,i)=>{SN.S[i].dx=s.dx;SN.S[i].dy=s.dy;});SN.kq='';}
    else if(SN.kq===lay.key){snowDrop();SN.key=lay.key;SN.S=lay.slabs;SN.H=SN.S.map(snowSlab);return;}
    else SN.kq=lay.key;
    for(let i=0;i<SN.H.length;i++)if(!alive(SN.H[i]))SN.H[i]=snowSlab(SN.S[i]);}
  /* force a zone's snowfall for `sec` seconds wherever the hero is (the lab; scripted moments) */
  function pxSnowleaves(kind='snowfield',sec=30){SN.force={z:SNOWZ[kind]||SNOWZ.snowfield,t:sec};SN.full=true;snowTick(0);return SN.H;}

  /* ---------- Embervale: leaves under the trees ---------- */
  const LEAFY={oak:{top:.88,bot:.34,hw:.4},aoak:{top:.88,bot:.34,hw:.4},birch:{top:.92,bot:.42,hw:.34}},PINEY={snowpine:1};
  const fp=P5=>[P5[4],P5[3],P5[2],P5[0]];
  function leafPal(spr,fi){const F=FPAL;
    if(spr==='aoak')return fi===0?[fp(F.autumnR),fp(F.autumnR),SFP.red,SFP.orange]:fi===1?[fp(F.autumnO),fp(F.autumnO),SFP.orange,SFP.yellow]:[fp(F.gold),fp(F.gold),SFP.yellow,SFP.brown];
    if(spr==='birch')return[fp(F.birch),fp(F.birch),SFP.yellow,SFP.yellow];
    if(fi===4)return[fp(F.gold),fp(F.gold),SFP.yellow,SFP.orange];
    const g=fp([F.vill,F.wood,F.wild,F.fruit][fi]||F.vill);return[g,g,g,g,SFP.yellow,SFP.brown];}
  let lseed=1;
  /* leaves for one tree {x, y, h, s, spr, fi}: returns {E, F, B, tr, cx} or null */
  function pxSnowleavesTree(tr,o={}){if(!tr)return null;
    const f=frameOf(tr.spr,tr.fi),s=tr.s||1,k=(f?(f.k||1):.5)*s,W=f?f.w*k:64*s,Ab=f?f.ay*k:82*s,Lf=LEAFY[tr.spr]||LEAFY.oak;
    const hw=Math.max(10,Math.round(W*Lf.hw)),top=Math.round(Ab*Lf.top),bot=Math.round(Ab*Lf.bot);
    const w=2*hw+80,hh=top+30,ay=hh-3,ax=hw+28,cx=ax*PX,cy=ay*PX,sp=CAM.sp||.5;
    const aoak=tr.spr==='aoak',gold=tr.spr==='oak'&&tr.fi===4,birch=tr.spr==='birch';
    const E=fallingLeaves({area:{x:cx-hw*PX+40,y:cy-top*PX,w:2*hw*PX-40,h:top*PX},ground:cy,leaves:o.n??(aoak?6:gold?5:birch?4:3),colors:o.colors??leafPal(tr.spr,tr.fi),shapes:EV_SHAPES,
      drift:8,litter:false,seed:lseed++*7919+3,spawn:(top-bot)*PX,crown:{cx,cy:cy-(top+bot)/2*PX,rx:hw*PX,ry:(top-bot)/2*PX*1.15},flat:.5,lay:{n:[-6,38],f:[-80,-32]},sp,
      gap:aoak?[.4,2.5]:gold?[1,3.5]:birch?[1.5,4.5]:[3,9],fill:o.fill??false,stagger:5,gust:()=>clamp(.5+.7*windAt(tr.x,tr.y,NOW),-.3,1.8)});
    const H=duo(E,{x:tr.x,y:tr.y,h:tr.h||0,w,hh,ax,ay,pri:0,amb:.8,nolight:true,ttl:1e9},-30,40);
    return H.F||H.B?{E,F:H.F,B:H.B,tr,cx,d:0}:null;}
  const TR={m:new Map(),t:0,fresh:true,c:[]};
  const stopEm=o=>{const em=TR.m.get(o);if(em){if(em.F)pxStop(em.F);if(em.B)pxStop(em.B);}TR.m.delete(o);};
  function treeTick(dt){if((TR.t-=dt)>0)return;TR.t=.4;
    const N=PERF.lite?3:6,c=P&&!riftRun?scanTrees(P.x,P.y,LEAFY,TR.c):(TR.c.length=0,TR.c),top=new Set(),near=new Set();
    for(let i=0;i<c.length&&i<N+3;i++){near.add(c[i].o);if(i<N&&c[i].d<700*700)top.add(c[i].o);const em=TR.m.get(c[i].o);if(em)em.d=c[i].d;}
    for(const [o,em] of TR.m)if(!near.has(o)||!(alive(em.F)||alive(em.B)))stopEm(o);
    for(const cd of c){if(!top.has(cd.o)||TR.m.has(cd.o))continue;
      if(TR.m.size>=N){let worst=null,wd=-1;for(const [o,em] of TR.m)if(!top.has(o)&&em.d>wd){wd=em.d;worst=o;}if(!worst)break;stopEm(worst);}
      const em=pxSnowleavesTree(cd,{fill:TR.fresh});if(em){em.d=cd.d;TR.m.set(cd.o,em);}}
    TR.fresh=false;}

  /* ---------- Embervale: rustle (original): blasts, wind strikes, ultimates and dodges shake leaves (and bough snow) loose ---------- */
  function pxSnowleavesRustle(x,y,r,k=1){let n=0;
    for(const em of TR.m.values()){const d=Math.hypot(em.tr.x-x,em.tr.y-y);if(d>r)continue;
      em.E.burst(Math.max(1,Math.round((2+3*k)*(1-.6*d/r)*(em.tr.spr==='aoak'?1.3:1))),em.cx+(x-em.tr.x)*K,k);n++;}
    if(k>=.8&&P){let b=0;for(const cd of scanTrees(x,y,PINEY,[])){if(cd.d>r*r||b>=3)break;if(pxSnowleavesBough(cd,{size:Math.min(1.4,.9+.3*k)}))b++;}}
    return n;}

  /* ---------- Embervale: bough snow on the snow-laden pines ---------- */
  let bseed=1;const BG={m:new Map(),t:0,H:[],c:[]};
  function pxSnowleavesBough(tr,o={}){if(!tr)return null;BG.H=BG.H.filter(alive);if(BG.H.length>=6)return null;
    const f=frameOf(tr.spr,tr.fi),s=tr.s||1,k=(f?(f.k||1):.5)*s,A=f?f.ay*k:90*s,W=f?f.w*k:52*s,u=o.u??(.26+Math.random()*.42);
    const hb=Math.round(A*u),hwb=Math.max(4,Math.round(W*.46*(1-u)+2)),dir=o.dir??(Math.random()<.5?-1:1),w=Math.max(56,2*hwb+48),hh=hb+22,ay=hh-4,sp=CAM.sp||.5;
    const H=pxfx(c=>boughSnow({x:c.x+dir*hwb*PX,y:c.y-hb*PX-30*sp*K,ground:c.y,size:o.size??1,dir,seed:bseed++*613+7,land:8}),{x:tr.x,y:tr.y+30,h:tr.h||0,w,hh,ay,pri:0,amb:.85,nolight:true,ttl:8});
    if(H)BG.H.push(H);return H;}
  function boughTick(dt){if((BG.t-=dt)>0)return;BG.t=.5;if(!P||riftRun)return;
    const c=scanTrees(P.x,P.y,PINEY,BG.c),N=PERF.lite?3:5;
    for(let i=0;i<c.length&&i<N;i++){const cd=c[i];let tm=BG.m.get(cd.o);if(tm===undefined)tm=1+Math.random()*7;tm-=.5;
      if(tm<=0){tm=4+Math.random()*9;if(cd.d<620*620)pxSnowleavesBough(cd);}BG.m.set(cd.o,tm);}
    if(BG.m.size>60)BG.m.clear();}

  /* ---------- Embervale: leaf whirl ---------- */
  let wseed=1;const WH={t:24,H:[],last:-9};
  function pxSnowleavesWhirl(x,y,o={}){WH.H=WH.H.filter(alive);if(WH.H.length>=2)return null;
    const S=o.size??1,c0=TR.c.length?TR.c[0]:null,colors=o.colors??(c0?leafPal(c0.spr,c0.fi):PALETTES),sp=CAM.sp||.5,cp=CAM.cp||.87,ZB=8,ZF=44;
    const hm=110*S,rmax=13*S+hm*.22,w=2*Math.round(rmax/PIX+40),hh=Math.ceil((hm*cp+(rmax+ZF)*sp)/PIX)+18,ay=hh-3,dust=(typeof ZDUST!=='undefined'&&ZDUST[curZone])||'#a89060';
    const E=leafWhirl({x:Math.round(w/2)*PX,ground:ay*PX,size:S,seed:wseed++*331+5,sp,cp,colors,dust,zb:ZB,zf:ZF});
    const D=duo(E,{x,y,h:0,w,hh,ay,pri:1,amb:.85,nolight:true,ttl:14},-ZB,ZF);
    if(D.F)WH.H.push(D.F);if(D.B)WH.H.push(D.B);return D.F||D.B;}
  function whirlTick(dt){if(!P||riftRun||reduceMotion||PERF.lite||TR.m.size<2||P.combatT>0)return;if((WH.t-=dt)>0)return;WH.t=28+Math.random()*30;
    for(let k=0;k<8;k++){const a=Math.random()*TAU,r=130+Math.random()*170,x=P.x+Math.cos(a)*r,y=P.y+Math.sin(a)*r*.7;if(!isSolid(Math.floor(x/T),Math.floor(y/T))){pxSnowleavesWhirl(x,y);break;}}}

  /* ---------- wiring ---------- */
  onEv('scene',now=>{NOW=now;});
  onEv('update',dt=>{snowTick(dt);treeTick(dt);boughTick(dt);whirlTick(dt);});
  const clearAll=()=>{for(const H of SN.H)if(H)pxStop(H);for(const o of [...TR.m.keys()])stopEm(o);SN.H=[];SN.S=[];SN.key='';SN.kq='';SN.full=true;TR.fresh=true;BG.H.length=0;WH.H.length=0;};
  onEv('resetWorld',clearAll);onEv('respawn',clearAll);onEv('startGame',clearAll);
  onEv('pxBoom',g=>{if(g)pxSnowleavesRustle(g.x,g.y,(g.r||80)+160,1.2);});
  onEv('pxElem',(kind,x,y,R,k)=>{pxSnowleavesRustle(x,y,(R||100)+140,kind==='wind'?1.6:1);
    if(kind==='wind'&&TR.m.size&&!reduceMotion&&gameTime-WH.last>2){WH.last=gameTime;pxSnowleavesWhirl(x,y,{size:1.1});}});
  onEv('pxUlt',()=>{if(P)pxSnowleavesRustle(P.x,P.y,340,1.4);});
  onEv('dodge',()=>{if(P)pxSnowleavesRustle(P.x,P.y,100,.5);});

  /* ---------- lab ---------- */
  const timed=(fx,s)=>{let t=0;return{update(dt){t+=dt;if(t>s)fx.stop();fx.update(dt);},draw:(f,l)=>fx.draw(f,l),stop:()=>fx.stop(),done:()=>fx.done()};};
  const labTree=(x,y,set,spr,fi)=>{const c=scanTrees(x,y,set,[]);return c.length&&c[0].d<600*600?c[0]:{o:null,x,y:y-30,h:0,s:1,spr,fi,d:0};};
  const labLeaves=(x,y)=>{const tr=labTree(x,y,LEAFY,'aoak',1);let em=tr.o&&TR.m.get(tr.o);if(!em){em=pxSnowleavesTree(tr,{fill:true});if(em&&tr.o)TR.m.set(tr.o,em);}return em;};
  pxlab('snowleaves-snow','Snowfall (camera slabs)','Weather','sf',()=>pxSnowleaves('snowfield',40));
  pxlab('snowleaves-blizzard','Blizzard (Stormcrown)','Weather','orig',()=>pxSnowleaves('storm',40));
  pxlab('snowleaves-peak','Peak snow (violet ramp)','Weather','sf',()=>pxSnowleaves('peak',40));
  pxlab('snowleaves-sf-snow','Snow (SF scene with drift)','Weather','sf',(x,y)=>pxfx(c=>timed(snow({area:{x:0,y:0,w:c.w,h:c.y},ground:c.y,density:.45,seed:7}),6),{x,y:y-40,w:240,hh:128,ay:124,pri:1,amb:.8,nolight:true,ttl:30}));
  pxlab('snowleaves-leaves','Falling leaves (nearest tree)','Weather','sf',(x,y)=>labLeaves(x,y));
  pxlab('snowleaves-sf-leaves','Falling leaves (SF autumn scene)','Weather','sf',(x,y)=>pxfx(c=>timed(fallingLeaves({area:{x:0,y:0,w:c.w,h:c.y},ground:c.y,leaves:22,seed:5}),6),{x,y:y-40,w:240,hh:128,ay:124,pri:1,amb:.8,nolight:true,ttl:30}));
  pxlab('snowleaves-rustle','Rustle (leaves shaken loose)','Weather','orig',(x,y)=>{const em=labLeaves(x,y);if(em)em.E.burst(8,em.cx-30,1.3);return em;});
  pxlab('snowleaves-bough','Bough snow','Weather','orig',(x,y)=>pxSnowleavesBough(labTree(x,y,PINEY,'snowpine',0),{u:.5}));
  pxlab('snowleaves-whirl','Leaf whirl','Weather','orig',(x,y)=>pxSnowleavesWhirl(x,y));
  return{pxSnowleaves,pxSnowleavesTree,pxSnowleavesRustle,pxSnowleavesBough,pxSnowleavesWhirl};})();
