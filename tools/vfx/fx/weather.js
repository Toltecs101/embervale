/* WEATHER (Sprite Fusion "Rain" and "Fog", MIT, ported; the weather director, the camera slabs, gusts, water rings and the
   lightning glint are original, in Sprite Fusion's style): rain showers and ground fog standing in the HD-2D diorama.
   Showers in Whisperwood, Old Vael, the Ashen Reach, Highmoor, the Icefang Coast and Stormcrown (a gale while Vortigan holds
   the storm); ground fog in Whisperwood, Old Vael, Highmoor, Mirefen and Glimmerdeep. Never in Hearthmere or the Ember Rift.
   Recipe (header numbers are the code's):
   - Director: every rain zone runs its own clock, showers 40-120 s and dry spells 60-170 s (Stormcrown while Vortigan lives:
     storms 90-160 s, lulls 14-30 s). The live rain level eases 1/4 per s toward the zone (a ~4 s fade), fog the same; fog
     breathes on a 97 s sine (.88-1) and thickens 15% under a shower. Zone tones cross-fade over ~2 s at borders.
   - Slabs: 'bill' canvases (nolight, pri 0) standing across the view at three depths, 254 px wide (2 per atlas row):
     rain 254x112 on the ground seen at 33% of the view height (far) and 36 units behind the hero (mid), 254x128 below the
     bottom edge (near, in front of everyone); fog 254x64 at 33% (far bank, d 0), 52 behind the hero (d .45) and 44 in front
     (d .9). Each row puts ceil(view width at its depth / 635) slabs side by side (cap 3 / 3 / 2). Each redraw a slab re-centres
     on the camera snapped to the art grid (x by 2.5 units, depth by 2.5 / sin(pitch)) and shifts its contents back by the same
     art px, so drops, rings and fog stay locked to the world and seamless across neighbours (fog samples world x).
   - Rain (rain.ts): far / mid / near drops: 1 px Bresenham lines 3 / 6 / 12 px along (slant, 1), 760 / 1050 / 1450 units/s
     (+-10%), trailing 60% body, leading 40% head. Counts per slab 230 / 120 / 34 x the row's mix (far .6/.25/0, mid .25/.55/.2,
     near 0/.2/.6) x 2.1 headroom, the live share = level x zone density / 2.1 (drops above it park at the top: a shower
     thins and fills drop by drop). Zone densities 1.05 (woods) to 1.5 (coast), 2 in Stormcrown: the slabs cover a taller
     view than rain.ts's 200 px frame, so 1.3x its counts per area keeps the same rain. Far drops vanish 10-140 units above their ground; mid (60%) and near drops splash: the lower
     half of an ellipse rx 1 -> 6 px (rx = 1 + 5 sqrt u), ry = rx / 4, over .4 s, dithered 1 - u; 3 droplets (near) / 0-2 (mid)
     thrown vx -90..70, vy -110..-230, 1900 g, .18-.32 s. Embervale: each drop lands on a ground point picked uniformly through
     its slab's depth band (up to the next row) and across the slab +-20 units plus the slant's reach upwind (all drops cross it), on the real terrain height; on water it leaves a full ring (.6 s, rx 1 -> 7 px),
     on walls and trunks nothing. Wet ground: rain.ts's strip (9 px of dithered mist, two 1-D value noises drifting +-, opacity
     m x .32 x (1 - row/9), and 4% glints re-rolled 8 / s) spread through the band, since the floor is a plane here: 6 mist lanes
     at (l + .5) / 6 of the band wandering +-.07 band and +-2 px along x, 8 px tall near to 5 px far; v = m x lens profile
     1 - |2r/h - 1| steps as fog.ts's tones do (v > .3: mist at alpha .2, v > .5: .34, Bayer only across the .07 above each step), so
     the mist lies in flat wisps, not dotted rows; each glint at a hashed depth in the band on the real terrain, none on walls.
     Slant +.18 (woods) to +.3 (coast), the game's wind blowing east; Stormcrown +.55 with gusts +-.12 (sines .9 and 2.3 rad/s).
     Lightning glint (original): any storm strike lifts every streak one ramp step (k > .2) or two (k > .55: heads white),
     k = e^(-t/.09).
     Palette (rain.ts, light to dark): #d6e5ff near heads, droplets; #9ab0e0 mid heads, glints, young splashes; #6f86bd near bodies;
     #5f74ab mid bodies, old splashes; #56659a far heads; #4b5a8c mist; #38446e far bodies; lit by the zone (amb .35: rain
     catches the sky, it does not sink into the forest shade).
   - Fog (fog.ts): a 256x128 value-noise field (4 octaves, lattices 4/8/16/32) baked once, sampled bilinearly, wrapping. A bank
     at depth d: top H(1 - .62d) above its ground, profile smoothstep to 80% then out over its last 4 px, spill H(.03 + .16d)
     below; domain warp w = field(.35x + 9c, .6y - 3c) - .5 every other column, c = t(.6 + .5d); n = field(x(.3 + .25d) - drift
     + 30w, (y + breath)(1.5 + .8d) + 12w), breath 2.4 sin(.35t + .013x); thickness f = (.72P + .95(clamp(2.6(n - .5) + .5) - .5))
     (.6 + .5 density); tones step at .30 / .52 / .74, each Bayer-dithered over the .07 above it; a 2 px crest (thick tone mixed
     .14 + .12d toward white) where f two px higher falls under the threshold; alpha (.2 + .16d) x density, tones x .6/.8/1.0,
     crest x 1.1/1.25; drift t x wind 22 x (.4 + .8d) / 2. Embervale: x is world art px, so neighbours tile; zone tones
     (thin / mid / thick): woods #2c4440 #4e6a62 #7e9a8a, ruins #384260 #586688 #8896b4, Highmoor #5a4c46 #86725e #b8a486,
     Mirefen #334434 #56684e #8a9c78, Glimmerdeep #30284e #54467e #8a78b4; lit by the zone (amb .45).
   - Layers: one plane per slab; the near rows (rain below the frame, fog 44 in front) stand in front of the hero, so their
     streaks and wisps pass in front of characters' legs, the rest behind. Colour buffer only, opaque streaks, dithered fades,
     fog alpha-blended as in fog.ts. Feel: no shake, no flash; the scene reads through it. Raster: about 1 ms with rain + fog. */
const {pxWeather,pxWeatherRain,pxWeatherFog}=(function(){'use strict';const {Px,dot,bayer,Rng,mix,hex,rgb,cl:clamp,smooth,hash,TAU,PXW:PX,WHITE,BAYER}=PXK;
  /* ---------------- Sprite Fusion "Rain" (rain.ts), ported. Embervale options: colors, mix, band, level, land, flash, ox, mist ---------------- */
  const RC={far:hex('#38446e'),farH:hex('#56659a'),mid:hex('#5f74ab'),midH:hex('#9ab0e0'),near:hex('#6f86bd'),nearH:hex('#d6e5ff'),mist:hex('#4b5a8c')};
  const SPEED=[760,1050,1450],LEN=[3,6,12],COUNT=[230,120,34],MT0=.3,MT1=.5;
  function noise(x,seed=0){const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);return hash(i,seed)*2-1+(hash(i+1,seed)-hash(i,seed))*2*u;}
  function rain(o={}){
    const A=o.area??{x:300,y:230,w:680,h:370},X0=A.x,X1=A.x+A.w,TOP=A.y;
    const groundAt=x=>o.ground===undefined?A.y+A.h:typeof o.ground==='number'?o.ground:o.ground(x);
    const R=new Rng(o.seed??1),D=o.density??1;
    const C=o.colors??RC,MIX=o.mix??[1,1,1],BAND=o.band??(()=>0),LEVEL=o.level??(()=>1),LAND=o.land??null,FLASH=o.flash??(()=>0),OX=o.ox??(()=>0),MIST=o.mist??0,MISTK=o.mistK??(()=>1);
    const dyn=typeof o.slant==='function',slantOf=dyn?o.slant:()=>o.slant??-.22;
    let DX=slantOf(),DL=Math.hypot(DX,1),ux=DX/DL,uy=1/DL;
    /* rain.ts spreads entries over [area.x, area.x + w + 180] for its -.22 slant. Embervale picks each drop's landing x instead, over
       the area +-20 units plus the live slant's reach upwind over the longest fall (200 above the top down to the ground): every
       drop crosses the canvas, none is spent outside it (a fixed +-413 margin on both sides used to leave 62% of a slab's drops
       off canvas), and the upwind top corner stays filled */
    const FALL=groundAt(X0)-TOP+200,XL=[0,0],span=()=>{XL[0]=X0-20+Math.min(0,DX)*FALL;XL[1]=X1+20+Math.max(0,DX)*FALL;return XL;};
    const drops=[],splashes=[],bits=[],freeS=[],freeB=[],LR={lift:0,k:0};
    /* where a drop meets the ground: its depth in the band, then the terrain (lift), water (k 1) or a wall (k 2, no splash) */
    const ground=d=>{d.g=groundAt(d.x)-d.gb;d.k=0;if(LAND){LAND(d.x+DX*Math.max(0,d.g-d.y),d.gb,LR);d.g-=LR.lift;d.k=LR.k;}};
    const reset=(d,top)=>{
      d.sp=SPEED[d.layer]*R.range(.9,1.1);
      d.gb=d.layer?R.range(0,BAND()):R.range(0,BAND())*.7;
      const L=span(),xl=R.range(L[0],L[1]),g=groundAt(xl)-d.gb;
      d.y=top?TOP-R.range(0,200):R.range(TOP-200,g);
      d.x=xl-DX*Math.max(0,g-d.y);ground(d);
      d.stop=d.g-R.range(10,140);
    };
    const lv0=LEVEL();
    for(const [layer,n] of [[0,COUNT[0]],[1,COUNT[1]],[2,COUNT[2]]])
      for(let i=0;i<Math.round(n*D*MIX[layer]);i++){const d={x:0,y:0,layer,sp:0,stop:0,g:0,gb:0,k:0,q:R.next(),park:false};reset(d,false);d.park=d.q>=lv0;drops.push(d);}
    let t=0,stopped=false;
    const again=(i,lv)=>{const d=drops[i];if(stopped)drops.splice(i,1);else if(d.q>=lv)d.park=true;else reset(d,true);};
    const BODY=l=>l===0?C.far:l===1?C.mid:C.near,HEAD=l=>l===0?C.farH:l===1?C.midH:C.nearH;
    const draw=(buf,layer)=>{
      const L=LEN[layer],fl=FLASH(),st=fl>.55?2:fl>.2?1:0,up=Math.min(2,layer+1);
      const c=st===2?HEAD(layer):st===1?BODY(up):BODY(layer),h=st===2?WHITE:st===1?HEAD(up):HEAD(layer);
      const xa=buf.ox-14,xb=buf.ox+buf.w+14,yb=buf.oy+buf.h+14;
      for(const d of drops){
        if(d.layer!==layer||d.park)continue;
        const x=d.x/PX,y=d.y/PX;if(y<buf.oy-1||y-L>yb||x<xa||x>xb)continue;
        buf.line(x-ux*L,y-uy*L,x-ux*L*.4,y-uy*L*.4,c);
        buf.line(x-ux*L*.4,y-uy*L*.4,x,y,h);
      }
    };
    return{
      update(dt){
        t+=dt;
        if(dyn){DX=slantOf();DL=Math.hypot(DX,1);ux=DX/DL;uy=1/DL;}
        const lv=LEVEL();
        for(let i=drops.length-1;i>=0;i--){
          const d=drops[i];
          if(d.park){if(stopped)drops.splice(i,1);else if(d.q<lv){d.park=false;reset(d,true);}continue;}
          d.x+=ux*d.sp*dt;
          d.y+=uy*d.sp*dt;
          if(d.layer===0&&d.y>d.stop)again(i,lv);
          else if(d.y>=d.g){
            if(d.x>X0-40&&d.x<X1+40&&d.k!==2){
              if(d.layer===2||d.k===1||R.chance(.6)){const s=freeS.pop()||{x:0,y:0,t:0,k:0};s.x=d.x;s.y=d.g;s.t=t;s.k=d.k;splashes.push(s);}
              for(let k=0;k<(d.layer===2?3-d.k:R.int(0,2-d.k));k++){const b=freeB.pop()||{x:0,y:0,g:0,vx:0,vy:0,life:0};b.x=d.x;b.y=d.g-1;b.g=d.g;b.vx=R.range(-90,70);b.vy=-R.range(110,230);b.life=R.range(.18,.32);bits.push(b);}
            }
            again(i,lv);
          }
        }
        for(let i=bits.length-1;i>=0;i--){
          const b=bits[i];
          if((b.life-=dt)<=0||b.y>b.g){freeB.push(b);bits[i]=bits[bits.length-1];bits.pop();continue;}
          b.vy+=1900*dt;
          b.x+=b.vx*dt;
          b.y+=b.vy*dt;
        }
        for(let i=splashes.length-1;i>=0;i--){const s=splashes[i];if(t-s.t>(s.k===1?.6:.4)){freeS.push(s);splashes[i]=splashes[splashes.length-1];splashes.pop();}}
      },
      draw(f,layer){
        const buf=new Px(f,f.color);
        if(layer!=='front'){
          draw(buf,0);
          draw(buf,1);
          const ox=OX(),mk=MISTK(),BD=BAND(),tb=Math.floor(t*8);
          /* rain.ts's wet ground strip lies on its one floor row. Embervale: the floor is a plane, so a slab with a depth band spreads
             it through the band: 6 mist lanes at (l + .5) / 6 of the band, each wandering +-.07 band and +-2 px (an 11 px wave) along x,
             8 px tall near to 5 px far. A lane's value v = m x the lens profile 1 - |2r/h - 1| steps like fog.ts's tones instead of
             rain.ts's per-pixel dither (low-alpha dither over a lit floor reads as rows of dots): v > .3 blends the mist at .2, v > .5
             at .34, each step Bayer-dithered only across the .07 above it, so the mist lies in flat wisps; glints at a hashed depth
             per column and 1/8 s, on the real ground (lifted by the terrain, none on walls) */
          for(let x=Math.max(buf.ox,Math.floor(X0/PX)-30);x<Math.min(buf.ox+buf.w,Math.ceil(X1/PX)+30);x++){
            const xw=x+ox,gx=groundAt(x*PX);
            if(BD<12){
              const fy=Math.round((gx-MIST)/PX),m=(noise(xw*.06+t*.5,3)+noise(xw*.15-t*.8,4)*.5+1)/2.5*mk;
              if(mk>.3&&hash(xw,tb)<.04)dot(buf,x,fy,C.midH);
              for(let r=0;r<9;r++)dot(buf,x,fy-r,C.mist,m*.32*(1-r/9));
              continue;
            }
            if(mk>.3&&hash(xw,tb)<.04){const gb=hash(xw*7+3,tb)*BD;let lift=0,k=0;if(LAND){LAND(x*PX,gb,LR);lift=LR.lift;k=LR.k;}if(k!==2)dot(buf,x,Math.round((gx-gb-lift)/PX),C.midH);}
            for(let l=0;l<6;l++){
              const m=(noise(xw*.06+t*.5+l*17.3,3+l*2)+noise(xw*.15-t*.8+l*9.1,4+l*2)*.5+1)/2.5*mk;
              if(m<=MT0)continue;
              const f=(l+.5)/6+noise(xw*.021+l*7.3,11+l)*.07,hh=Math.round(8-3*f),fy=Math.round((gx-f*BD)/PX+noise(xw*.11+l*3.7,23+l)*2.2);
              for(let r=0;r<hh;r++){
                const v=m*(1-Math.abs(2*(r+.5)/hh-1)),y=fy-r,b=bayer(x,y);
                if(v>MT1+.07||(v>MT1&&(v-MT1)/.07>b))buf.blend(x,y,C.mist,.34);
                else if(v>MT0+.07||(v>MT0&&(v-MT0)/.07>b))buf.blend(x,y,C.mist,.2);
              }
            }
          }
          for(const s of splashes){
            if(s.k===1){const u=(t-s.t)/.6,rx=1+6*Math.sqrt(u);splash(buf,s.x/PX,s.y/PX,rx,rx*.25,u<.3?C.midH:C.mid,1-u,true);continue;}
            const u=(t-s.t)/.4,rx=1+5*Math.sqrt(u);
            splash(buf,s.x/PX,s.y/PX,rx,rx*.25,u<.3?C.midH:C.mid,1-u,false);
          }
          for(const b of bits)dot(buf,b.x/PX,b.y/PX,C.nearH);
        }
        if(layer!=='back')draw(buf,2);
      },
      /* Embervale: the canvas moved (dx, dy effect units): move everything back so it stays where it was in the world; drops wrap */
      shift(dx,dy){
        if(!dx&&!dy)return;
        const L=span(),a=L[0],w=L[1]-L[0];
        for(const d of drops){d.x-=dx;d.y-=dy;d.g-=dy;d.stop-=dy;const xl=d.x+DX*Math.max(0,d.g-d.y);if(xl<a||xl>=a+w){d.x+=a+(((xl-a)%w)+w)%w-xl;ground(d);d.stop=d.g-10-(d.q*130);}}
        for(const s of splashes){s.x-=dx;s.y-=dy;}
        for(const b of bits){b.x-=dx;b.y-=dy;b.g-=dy;}
      },
      stop(){stopped=true;},
      done:()=>stopped&&drops.length===0&&bits.length===0,
      count:()=>drops.length};
  }
  /* rain.ts's splash: the lower half (sin >= -.2) of an ellipse rx, ry = rx / 4, 1-2 px thick, dithered by a. Embervale: the pixels
     of each rx (quarter-px steps) are worked out once and deduplicated, the centre snapped to its pixel; full = a water ring
     (its far half at .7 a) */
  const SHAPES=new Map();
  function shapeOf(q,full){
    const key=q*2+(full?1:0);let S=SHAPES.get(key);if(S)return S;
    const rx=q/4,ry=rx*.25,n=Math.ceil(Math.max(rx,ry)*TAU*1.3),seen=new Set(),out=[];
    for(let j=0;j<n;j++){
      const ang=(j/n)*TAU,ca=Math.cos(ang),sa=Math.sin(ang);
      if(!full&&sa<-.2)continue;
      for(let o=-.5;o<=.5;o+=.5){const px=Math.floor(.5+ca*(rx+o)),py=Math.floor(.5+sa*(ry+o*(ry/Math.max(1,rx)))),k=px*64+py;if(seen.has(k))continue;seen.add(k);out.push(px,py,full&&sa<0?1:0);}
    }
    S=Int8Array.from(out);SHAPES.set(key,S);return S;
  }
  function splash(buf,cx,cy,rx,ry,c,a,full){
    const S=shapeOf(Math.round(rx*4),full),bx=Math.floor(cx),by=Math.floor(cy);
    for(let k=0;k<S.length;k+=3)dot(buf,bx+S[k],by+S[k+1],c,S[k+2]?a*.7:a);
  }
  /* ---------------- Sprite Fusion "Fog" (fog.ts), ported. Embervale options: tones (live), ox (world x), depth, bank, level, ends ---------------- */
  const T0=.3,T1=.52,T2=.74,BW=.07,FW=256,FH=128,FIELDS=new Map();
  function bake(seed){
    const out=new Float32Array(FW*FH);
    let amp=.5,total=0;
    for(const cells of [4,8,16,32]){
      const cs=FW/cells,rows=FH/cs;
      const h=(a,b)=>hash((((a%cells)+cells)%cells)+(((b%rows)+rows)%rows)*1000,seed*31+cells);
      for(let y=0;y<FH;y++)
        for(let x=0;x<FW;x++){
          const gx=x/cs,gy=y/cs,ix=Math.floor(gx),iy=Math.floor(gy),u=gx-ix,v=gy-iy;
          const su=u*u*(3-2*u),sv=v*v*(3-2*v);
          const top=h(ix,iy)+(h(ix+1,iy)-h(ix,iy))*su,bot=h(ix,iy+1)+(h(ix+1,iy+1)-h(ix,iy+1))*su;
          out[y*FW+x]+=(top+(bot-top)*sv)*amp;
        }
      total+=amp;
      amp*=.5;
    }
    for(let i=0;i<out.length;i++)out[i]=out[i]/total;
    return out;
  }
  const fieldOf=seed=>{let f=FIELDS.get(seed);if(!f){f=bake(seed);FIELDS.set(seed,f);}return f;};
  function sample(f,u,v){
    const x=Math.floor(u),y=Math.floor(v),fx=u-x,fy=v-y;
    const x0=x&(FW-1),x1=(x0+1)&(FW-1),y0=y&(FH-1),y1=(y0+1)&(FH-1);
    const a=f[y0*FW+x0],b=f[y0*FW+x1],c=f[y1*FW+x0],d=f[y1*FW+x1];
    return a+(b-a)*fx+(c-a+(a-b-c+d)*fx)*fy;
  }
  function fog(o={}){
    const A=o.area??{x:0,y:470,w:1280,h:150},D=o.density??1,WIND=o.wind??22,N=Math.max(1,Math.min(4,o.layers??3));
    const TONES=o.tones??(o.colors??['#3b3f63','#5a6185','#8389a8']).map(hex);
    const field=fieldOf(o.seed??1);
    const X0=A.x/PX,X1=(A.x+A.w)/PX,BOT=(A.y+A.h)/PX,H=A.h/PX;
    const OX=o.ox??(()=>0),LV=o.level??(()=>1),ENDS=o.ends??true,DEP=o.depth;
    let t=0,stopAt=Infinity,edges=new Float32Array(0),breaths=edges,F=edges;
    const level=()=>clamp(1-(t-stopAt)/2.5);
    function bank(buf,d,i){
      const top=BOT-H*(1-.62*d),base=top+(BOT-top)*.8,bottom=BOT+H*(.03+.16*d);
      const sx=.3+.25*d,sy=1.5+.8*d;
      const drift=(t*WIND*(.4+.8*d))/PX,curl=t*(.6+.5*d);
      const alpha=(.2+.16*d)*D*level()*LV(),off=i*97.3,ox=OX();
      const y0=Math.max(buf.oy,Math.floor(top)),y1=Math.min(buf.oy+buf.h-1,Math.ceil(bottom));
      const x0=Math.max(buf.ox,Math.floor(X0)),x1=Math.min(buf.ox+buf.w-1,Math.ceil(X1));
      if(alpha<=.01||y0>y1||x0>x1)return;
      const crest=mix(TONES[2],WHITE,.14+.12*d),dense=.6+.5*D;
      const thick=(P,n)=>(P*.72+(clamp((n-.5)*2.6+.5)-.5)*.95)*dense;
      const prof=y=>smooth(top,base,y)*(1-smooth(bottom-3,bottom+1,y));
      /* Embervale: the thickness is worked out on even world columns (and from two rows up, for the crest test) and halved in
         between: one field sample per pixel instead of two and a half, the same banks */
      const e0=Math.floor((x0+ox)/2)*2,ne=((x1+ox-e0)>>1)+2,nr=y1-y0+3;
      if(F.length<ne*nr)F=new Float32Array(ne*nr);
      if(edges.length<ne){edges=new Float32Array(ne);breaths=new Float32Array(ne);}
      for(let j=0;j<ne;j++){
        const xw=e0+2*j,x=xw-ox;
        edges[j]=ENDS?smooth(X0,X0+40,x)*(1-smooth(X1-40,X1,x)):1;
        breaths[j]=2.4*Math.sin(t*.35+xw*.013+i*1.7);
      }
      for(let r=0;r<nr;r++){
        const y=y0-2+r,p=prof(y),row=r*ne;
        if(p<=.02){F.fill(0,row,row+ne);continue;}
        for(let j=0;j<ne;j++){
          const edge=edges[j];
          if(edge<=.02){F[row+j]=0;continue;}
          const xw=e0+2*j,wu=sample(field,xw*.35+curl*9+off,y*.6-curl*3)-.5,u=xw*sx-drift+wu*30+off;
          F[row+j]=thick(p,sample(field,u,(y+breaths[j])*sy+wu*12))*edge;
        }
      }
      /* the five words a pixel can take over an empty canvas (blend onto nothing = the tone at that alpha): tones x .6/.8/1, crests x 1.1/1.25 */
      const pk=(c,a)=>((Math.round(clamp(a)*255)<<24)|(c&0xffffff))>>>0,WD=[pk(TONES[0],alpha*.6),pk(TONES[1],alpha*.8),pk(TONES[2],alpha),pk(crest,alpha*1.1),pk(crest,alpha*1.25)],data=buf.data;
      for(let y=y0;y<=y1;y++){
        if(prof(y)<=.02)continue;
        const row=(y-y0+2)*ne,up=(y-y0)*ne,ro=(y-buf.oy)*buf.w-buf.ox;
        for(let x=x0;x<=x1;x++){
          const xw=x+ox,j=(xw-e0)>>1,odd=(xw-e0)&1;
          const f=odd?(F[row+j]+F[row+j+1])*.5:F[row+j];
          if(f<=T0)continue;
          const b=(BAYER[((y&3)<<2)|(x&3)]+.5)/16;
          let c=-1;
          if(f>T2+BW||(f>T2&&(f-T2)/BW>b))c=2;
          else if(f>T1+BW||(f>T1&&(f-T1)/BW>b))c=1;
          else if(f>T0+BW||(f>T0&&(f-T0)/BW>b))c=0;
          if(c<0)continue;
          const cr=c>=1&&(odd?(F[up+j]+F[up+j+1])*.5:F[up+j])<(c===2?T2:T1)-.03,q=ro+x;
          if(data[q]===0){data[q]=WD[cr?c+2:c];continue;}
          if(cr){buf.blend(x,y,crest,alpha*(.95+.15*c));continue;}
          buf.blend(x,y,TONES[c],alpha*(.6+.2*c));
        }
      }
    }
    return{
      update(dt){t+=dt;},
      draw(f,layer){
        const buf=new Px(f,f.color);
        if(DEP!=null){if(layer!=='front')bank(buf,DEP,o.bank??0);return;}
        for(let i=0;i<N;i++){if(layer===(N>1&&i===N-1?'back':'front'))continue;bank(buf,N===1?.5:i/(N-1),i);}
      },
      stop(){if(stopAt===Infinity)stopAt=t;},
      done:()=>level()<=0};
  }

  /* ---------------- Embervale: zones, the weather director and the camera slabs ---------------- */
  /* rain zones: density (x the slab counts), slant (east wind), gusts; fog zones: density, tones thin / mid / thick */
  const RZ={woods:{d:1.05,s:.18},ruins:{d:1.3,s:.14},reach:{d:1.1,s:.22},g3moor:{d:1.3,s:.24},g3coast:{d:1.5,s:.3},storm:{d:2,s:.55,g:.12}};
  const FZ={woods:{d:1,c:['#2c4440','#4e6a62','#7e9a8a']},ruins:{d:1,c:['#384260','#586688','#8896b4']},g3moor:{d:.85,c:['#5a4c46','#86725e','#b8a486']},
    g3fen:{d:1.1,c:['#334434','#56684e','#8a9c78']},glimmer:{d:.9,c:['#30284e','#54467e','#8a78b4']}};
  const DMAX=2.1,SW=254,RAIN_AMB=.35,FOG_AMB=.45;
  /* rows: s = screen row (fraction of the view height) of the slab's ground line, or hero = depth from the hero (units);
     mix = far / mid / near drop shares (rain), d = bank depth and H = bank height in art px (fog); cap / lite = max slabs */
  const RAIN_ROWS=[{k:'F',s:.33,hh:112,mix:[.6,.25,0],cap:3,lite:2},{k:'M',hero:-36,hh:112,mix:[.25,.55,.2],cap:3,lite:0},{k:'N',s:1.14,hh:128,mix:[0,.2,.6],cap:2,lite:1}];
  const FOG_ROWS=[{k:'F',s:.33,hh:64,d:0,H:46,cap:3,lite:0},{k:'M',hero:-52,hh:64,d:.45,H:44,cap:3,lite:2},{k:'N',hero:44,hh:64,d:.9,H:40,cap:2,lite:1}];
  for(const r of RAIN_ROWS)r.sl=[];for(const r of FOG_ROWS)r.sl=[];
  const W={rain:0,fog:0,rk:null,fk:null,flash:0,force:null,tk:0,retry:0,
    RP:{d:1,s:.2,g:0},TONES:FZ.woods.c.map(hex),RCOL:Object.assign({},RC),CLK:{},R:new Rng((Math.random()*1e9)|0)};
  const vortigan=()=>typeof bossesDown!=='undefined'&&bossesDown.has('vortigan');
  const clock=z=>W.CLK[z]||(W.CLK[z]={wet:W.R.chance(.45),t:W.R.range(8,70)});
  const spell=(z,wet)=>z==='storm'&&!vortigan()?(wet?W.R.range(90,160):W.R.range(14,30)):wet?W.R.range(40,120):W.R.range(60,170);
  /* the ground depth of a row and the view's width there (once per rendered frame) */
  function layoutRow(R){
    if(R.fr===PXFX.fr&&R.cam===CAM.x+CAM.z)return R;R.fr=PXFX.fr;R.cam=CAM.x+CAM.z;
    let sy;if(R.hero!=null)sy=toScreen(CAM.x,0,P.y+R.hero,VW,VH).y;else sy=R.s*VH;
    const a=screenToGround(0,sy,VW,VH),b=screenToGround(VW,sy,VW,VH);
    const gy=R.hero!=null?P.y+R.hero:(a.y+b.y)/2,W=Math.abs(b.x-a.x);
    if(!(isFinite(gy)&&isFinite(W)&&isFinite(a.x+b.x))){if(R.n==null){R.gy=P.y;R.cx=P.x;R.W=0;R.n=0;}return R;}
    R.gy=gy;R.cx=(a.x+b.x)/2;R.W=W;
    R.n=clamp(Math.ceil(R.W/(SW*PIX)-.03),1,PERF.lite?R.lite:R.cap);
    return R;}
  /* the next row back from R (for the depth band its drops land in) */
  const bandOf=(rows,R)=>{const i=rows.indexOf(R),far=R.k==='N'?P.y+8:i>0?layoutRow(rows[i-1]).gy:R.gy-700;return clamp((R.gy-far)*CAM.sp/PIX,0,R.hh-24)*PX;};
  /* re-centre a slab on its row, snapped to the art grid, and shift its contents back: they stay put in the world */
  function place(S){
    if(!P)return;const R=layoutRow(S.row),H=S.H,Q=PIX/CAM.sp;
    const X=Math.round((R.cx+(S.i-(R.n-1)/2)*SW*PIX)/PIX)*PIX,Y=Math.round(R.gy/Q)*Q;
    if(S.px!=null&&(X!==S.px||Y!==S.py))S.fx.shift?.((X-S.px)/PIX*PX,(Y-S.py)*CAM.sp/PIX*PX);
    S.px=X;S.py=Y;H.x=X;H.y=Y;H.h=-hdEH(X,Y);}
  /* rain lands on the real ground: band depth -> world point -> water, wall, terrain height */
  function landOf(S){return(x,gb,out)=>{const H=S.H,wx=H.x+(x/PX-H.ax)*PIX,wy=H.y-(gb/PX)*PIX/CAM.sp,tx=wx/T|0,ty=wy/T|0;out.k=0;out.lift=0;
    if(tx<0||ty<0||tx>=MW||ty>=MH)return;const i=ty*MW+tx;if(solid[i]===1){out.k=2;return;}if(tiles[i]===WA)out.k=1;
    const e=hdEH(wx,wy);if(e>0)out.lift=e*CAM.cp/PIX*PX;};}
  function slab(kind,R,i,rows){
    const S={kind,row:R,i,H:null,fx:null,px:null,py:null,seen:W.tk,df:-9};
    const H=pxfx(c=>{S.H=c.handle;const w=c.w,g=c.y;
      if(kind==='rain')S.fx=rain({area:{x:0,y:0,w,h:g},ground:g,density:PERF.lite?DMAX*.7:DMAX,mix:R.mix,slant:()=>W.RP.s+W.RP.g*(.6*Math.sin(W.t*.9+i)+.4*Math.sin(W.t*2.3+1)),
        colors:W.RCOL,seed:(hash(i,R.k.charCodeAt(0))*1e6)|0,band:()=>bandOf(rows,R),level:()=>W.rain*W.RP.d/DMAX,land:landOf(S),flash:()=>W.flash,ox:()=>S.H.x/PIX-S.H.ax,
        mistK:()=>W.rain});
      else{S.fx=fog({area:{x:-4*PX,y:g-R.H*PX,w:w+8*PX,h:R.H*PX},tones:W.TONES,depth:R.d,bank:R.k==='F'?0:R.k==='M'?1:2,ends:false,level:()=>W.fog,ox:()=>S.H.x/PIX-S.H.ax,seed:1});
        /* fog moves under a pixel a frame: a slab re-rasters into a cache 2 px wider each side once 2 (near) or 3 frames have
           passed since its last raster (counted in frames, not by frame parity: the bridge only draws ambient loops every 2nd
           frame, so a parity test could miss forever and freeze the bank), and the draws between show the cache shifted by the
           slab's own moves */
        S.cache=new Uint32Array((SW+4)*R.hh);S.cfr={w:SW+4,h:R.hh,ox:-2,oy:0,color:S.cache,light:S.cache};S.cox=null;S.rate=R.d>=.7?2:3;S.lf=-99;}
      place(S);
      /* the slab moves only when it is redrawn (the bridge redraws ambient loops every 2nd frame and shows the last picture at the
         handle's position between): moving it in between would carry the old picture with the camera for a frame, a 1 px shimmer.
         A slab that has not been drawn for 3 frames (culled after a teleport) re-centres in update. */
      return{update(dt){if(PXFX.fr-S.df>2)place(S);S.fx.update(dt);S.seen=W.tk;},
        draw(fr){place(S);S.df=PXFX.fr;if(!S.cache){S.fx.draw(fr);return;}
          const ox=S.H.x/PIX-S.H.ax;let d=S.cox==null?99:ox-S.cox;
          if(Math.abs(d)>2||PXFX.fr-S.lf>=S.rate){S.cache.fill(0);S.fx.draw(S.cfr);S.cox=ox;S.lf=PXFX.fr;d=0;}
          const cw=SW+4,dst=fr.color;for(let y=0;y<R.hh;y++){const o=y*cw+2+d;dst.set(S.cache.subarray(o,o+SW),y*SW);}},
        done:()=>S.fx.done(),stop(){S.fx.stop();}};},
      {x:P.x,y:P.y,w:SW,hh:R.hh,ay:kind==='rain'?R.hh-4:R.hh-10,nolight:true,pri:0,amb:kind==='rain'?RAIN_AMB:FOG_AMB,ttl:1e9});
    return H?S:null;}
  /* keep each row filled with as many slabs as the view is wide there; replace slabs the budget evicted or a world reset cleared */
  function manage(rows,kind,on){
    for(const R of rows){
      const cap=PERF.lite?R.lite:R.cap;
      if(!on||!cap){for(const S of R.sl)if(S)pxStop(S.H);R.sl.length=0;continue;}
      const n=layoutRow(R).n;if(!n)continue;
      for(let i=0;i<Math.max(n,R.sl.length);i++){
        const S=R.sl[i];
        if(i>=n){if(S)pxStop(S.H);continue;}
        if(S&&W.tk-S.seen<=2)continue;
        if(W.retry>0&&!S)continue;
        R.sl[i]=slab(kind,R,i,rows);if(!R.sl[i])W.retry=.5;}
      R.sl.length=n;}}
  const ease=(v,to,dt)=>v+clamp(to-v,-dt/4,dt/4);
  W.t=0;
  onEv('update',dt=>{if(!P)return;W.tk++;W.t+=dt;W.retry-=dt;W.flash*=Math.exp(-dt/.09);
    for(const z in RZ){const c=clock(z);if((c.t-=dt)<=0){c.wet=!c.wet;c.t=spell(z,c.wet);}}
    const zid=ZONES[curZone]?ZONES[curZone].id:'',F=W.force&&gameTime<W.force.until?W.force:null;if(!F)W.force=null;
    const rz0=riftRun?null:RZ[zid]&&clock(zid).wet?RZ[zid]:null,fz0=riftRun?null:FZ[zid]||null;
    const rz=F&&F.rain!=null?F.rz:rz0,fz=F&&F.fog!=null?F.fz:fz0;
    const rainT=F&&F.rain!=null?F.rain:rz?1:0,fogT=F&&F.fog!=null?F.fog:fz?fz.d*(.88+.12*Math.sin(gameTime*TAU/97))*(1+.15*W.rain):0;
    W.rain=ease(W.rain,rainT,dt);W.fog=ease(W.fog,fogT,dt);
    if(rz){const k=Math.min(1,dt*.5),G=W.RP;G.d+=(rz.d-G.d)*k;G.s+=(rz.s-G.s)*k;G.g+=((rz.g||0)-G.g)*k;}
    if(fz){const k=Math.min(1,dt*.5);for(let j=0;j<3;j++)W.TONES[j]=mix(W.TONES[j],hex(fz.c[j]),k);}
    manage(RAIN_ROWS,'rain',W.rain>.004||rainT>0);
    manage(FOG_ROWS,'fog',W.fog>.004||fogT>0);});
  /* storm light catches the rain: every sky or storm strike (skyStrike, the arcanist's storm, procs) */
  onEv('pxElem',kind=>{if(kind==='storm'&&W.rain>.05&&!reduceMotion)W.flash=1;});
  onEv('resetWorld',()=>{for(const R of RAIN_ROWS)R.sl.length=0;for(const R of FOG_ROWS)R.sl.length=0;});

  /* the director's handle (lab, tests, other modules): force a look for a while, read the state */
  const pxWeather={
    set(o){if(!o){W.force=null;return;}const rz=o.zone?RZ[o.zone]||null:RZ[ZONES[curZone].id]||RZ.ruins,fz=o.zone?FZ[o.zone]||null:FZ[ZONES[curZone].id]||FZ.woods;
      W.force={rain:o.rain==null?null:+o.rain,fog:o.fog==null?null:+o.fog,rz:o.rain?(o.rz||rz||RZ.ruins):null,fz:o.fog?(fz||FZ.woods):null,until:gameTime+(o.hold??90)};
      if(o.instant){if(o.rain!=null)W.rain=W.force.rain;if(o.fog!=null)W.fog=W.force.fog;const z=W.force.rz;if(z)Object.assign(W.RP,{d:z.d,s:z.s,g:z.g||0});const f=W.force.fz;if(f)for(let j=0;j<3;j++)W.TONES[j]=hex(f.c[j]);}},
    clear(){W.force={rain:0,fog:0,rz:null,fz:null,until:gameTime+(arguments[0]??30)};},
    state:()=>({rain:W.rain,fog:W.fog,slabs:RAIN_ROWS.reduce((n,R)=>n+R.sl.length,0)+FOG_ROWS.reduce((n,R)=>n+R.sl.length,0),clocks:W.CLK,force:!!W.force})};
  /* one Sprite Fusion slab on its own, at a ground point (the lab's reference views of rain.ts and fog.ts) */
  let seed=1;
  function pxWeatherRain(x,y,o={}){
    return pxfx(c=>rain({area:{x:0,y:0,w:c.w,h:c.y},ground:c.y,density:o.density??.55,slant:o.slant??-.22,seed:seed++}),{x,y:y-40,w:SW,hh:112,ay:108,nolight:true,pri:1,amb:RAIN_AMB,ttl:o.ttl??6});}
  function pxWeatherFog(x,y,o={}){
    return pxfx(c=>fog({area:{x:0,y:c.y-56*PX,w:c.w,h:56*PX},colors:o.colors,layers:3,seed:1}),{x,y:y-60,w:SW,hh:80,ay:64,nolight:true,pri:1,amb:FOG_AMB,ttl:o.ttl??6});}
  pxlab('weather-rain','Rain shower (zone)','Weather','sf',()=>pxWeather.set({rain:1,fog:0,instant:true,hold:120}));
  pxlab('weather-storm','Stormcrown gale','Weather','sf',()=>pxWeather.set({rain:1,fog:0,zone:'storm',instant:true,hold:120}));
  pxlab('weather-fog','Ground fog (zone)','Weather','sf',()=>pxWeather.set({rain:0,fog:1,instant:true,hold:120}));
  pxlab('weather-rainfog','Shower in the fog','Weather','sf',()=>pxWeather.set({rain:1,fog:1,instant:true,hold:120}));
  pxlab('weather-clear','Clear skies (fade out)','Weather','orig',()=>pxWeather.clear(60));
  pxlab('weather-sf-rain','Rain slab (rain.ts)','Weather','sf',(x,y)=>pxWeatherRain(x,y));
  pxlab('weather-sf-fog','Fog slab (fog.ts)','Weather','sf',(x,y)=>pxWeatherFog(x,y));
  return{pxWeather,pxWeatherRain,pxWeatherFog};})();
