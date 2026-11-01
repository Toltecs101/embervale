/* Portions of this module and of the PXFX EFFECT blocks below are ported from Sprite Fusion's pixel art VFX library
   (https://www.spritefusion.com/pixel-art-vfx), MIT License, Copyright (c) 2026 Hugo Duprez:
   Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
   (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge,
   publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
   subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or
   substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
   BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
   ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. */
/* PIXEL VFX (PXFX): Sprite Fusion-style pixel art effects (spritefusion.com/pixel-art-vfx, MIT) living in the HD-2D scene.
   An effect has Sprite Fusion's shape: {update(dt), draw(fr, layer?), done(), stop?(), lamp?()}. It draws into a frame
   fr = {w, h, ox, oy, color, light}: two Uint32Array ABGR pixel buffers at art resolution (the same layout as ATL.data).
   Every live effect owns a small canvas. Its buffers are rasterized on the CPU each frame, packed into one dynamic texture
   (PXFX.tex, nearest filtering) and drawn with the fx program, after the air layers:
     'bill'  stands up in the world, tilted with the camera like a sprite (art x -> world x, art y down -> height down)
     'flat'  lies on the ground like a decal (art x -> world x, art y down -> world y, toward the camera)
   1 art pixel = PIX world units (2.5), the sprites' own grid. Inside an effect, positions are Sprite Fusion world units,
   PXW (2) per art pixel, so ported code keeps its numbers. The light buffer is drawn additively (it also feeds the bloom),
   then the colour buffer alpha-blended over it. With split:true the 'back' layer is drawn just behind the anchor's depth and
   'front' just in front, so an effect can wrap a character.

   pxfx(make, o) -> handle | null. make(c) returns the effect; c = {x, y, w, h, PXW, actor} gives its anchor in effect units,
   the canvas size in effect units, and (with follow) a Sprite Fusion Actor for the followed entity (feet + live silhouette).
     o.x, o.y   world position of the anchor (a ground point)       o.h      height of the anchor above the ground (world units)
     o.mode     'bill' (default) or 'flat'                          o.w, o.hh canvas size in art px (default 96 x 96)
     o.ax, o.ay anchor pixel in the canvas (default w/2, hh-8)      o.split  separate back/front colour layers (bill only)
     o.follow   an entity {x,y} the anchor tracks; its death calls the effect's stop() (or fades it)
     o.fx, o.fy offset from the followed entity (world units)       o.ttl    hard lifetime cap in seconds (default 12)
     o.pri      budget priority (default 1; 0 = ambient, dropped first; 2 = keep)
     o.amb      0..1: how much the colour layer takes the zone's ambient light (smoke, dust, leaves, rain)
     o.lamp     true: the effect's lamp() -> {i, c:[r,g,b], r, h} adds a point light to the scene
     o.nolight  true: no light buffer (skips its raster clear and upload: weather, smoke, dust, stains)
     o.every    redraw and re-upload every Nth frame (default 2 for ambient loops: pri 0 living a minute or more, else 1). Such a handle keeps a
                fixed slot in the right half of the texture, so the frames in between draw its last picture at no CPU or upload cost.
   pxProj(H, x, h, y) -> [X, Y]: where the world point (x, height h, y) falls on H's canvas, in effect units (a 'bill' canvas
   projects along the view, so points nearer or further than the anchor still land where the camera sees them; 'flat' ignores h).
   Heights given in sprite pixels above the feet are plane units already: art px above the anchor = PXW * px effect units.
   PXK holds the shared Sprite Fusion helpers: Px, dot, bayer, Rng, rgb, hex, mix, scale, ramp, cl, smooth, outExpo, hash,
   noise2, lum, rampOf (a 6-step white-hot ramp from any colour), shake / flash hooks, WHITE, TAU, PXW.
   pxlab(id, name, cat, src, play(x, y)) registers an effect in the lab (open the game with #vfxlab). */
const PXW=2,PXT=1024,PXTW=2048;
/* PXLIB (the pixelfx bundle) is declared at the end of this block by the build when any effect module asks for pixelfx effects */
const PXFX={list:[],tex:null,jobs:[],pool:{},fr:0,ms:0,up:0,drop:0,sil:new Map(),nq:0,sfree:[],sx:PXT+1,sy:1,srow:0};
/* a fixed slot (w x h texels) in the right half of the texture for a handle that redraws every Nth frame: exact-size reuse, else a new shelf spot */
function pxSlot(w,h){const F=PXFX.sfree;for(let i=0;i<F.length;i++)if(F[i].w===w&&F[i].h===h)return F.splice(i,1)[0];
  if(PXFX.sx+w>PXTW){PXFX.sx=PXT+1;PXFX.sy+=PXFX.srow+1;PXFX.srow=0;}if(PXFX.sy+h+1>PXT)return null;const r={x:PXFX.sx,y:PXFX.sy,w,h};PXFX.sx+=w+1;PXFX.srow=Math.max(PXFX.srow,h);return r;}
LAY.pxD=mkLayer(10,768);LAY.pxA=mkLayer(10,768);
const PXK=(function(){'use strict';
  const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  const bayer=(x,y)=>(BAYER[((y&3)<<2)|(x&3)]+.5)/16;
  const rgb=(r,g,b,a=255)=>(((a&255)<<24)|((b&255)<<16)|((g&255)<<8)|(r&255))>>>0;
  const hex=h=>{const v=parseInt(String(h).replace('#',''),16);return rgb((v>>16)&255,(v>>8)&255,v&255);};
  function mix(c1,c2,t){const u=1-t,ch=(c,s)=>(c>>>s)&255;return rgb(ch(c1,0)*u+ch(c2,0)*t,ch(c1,8)*u+ch(c2,8)*t,ch(c1,16)*u+ch(c2,16)*t,ch(c1,24)*u+ch(c2,24)*t);}
  function scale(c,k){return rgb(Math.min(255,(c&255)*k),Math.min(255,((c>>>8)&255)*k),Math.min(255,((c>>>16)&255)*k),c>>>24);}
  function ramp(stops,t){const u=Math.max(0,Math.min(.9999,t))*(stops.length-1),i=Math.floor(u);return mix(stops[i],stops[i+1],u-i);}
  const cl=(v,a=0,b=1)=>v<a?a:v>b?b:v;
  const smooth=(a,b,x)=>{const t=cl((x-a)/(b-a));return t*t*(3-2*t);};
  const outExpo=t=>t>=1?1:1-Math.pow(2,-10*cl(t));
  const hash=(n,k=0)=>((Math.imul(n+1+k*7919,2654435761)>>>0)%100000)/100000;
  function noise2(x,y,seed=0){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),h=(a,b)=>hash(a*73+b*9301,seed)*2-1;
    const top=h(ix,iy)+(h(ix+1,iy)-h(ix,iy))*u,bot=h(ix,iy+1)+(h(ix+1,iy+1)-h(ix,iy+1))*u;return top+(bot-top)*v;}
  const lum=c=>((c&255)*.3+((c>>>8)&255)*.59+((c>>>16)&255)*.11)/255;
  class Px{
    constructor(f,data){this.w=f.w;this.h=f.h;this.ox=f.ox;this.oy=f.oy;this.data=data;}
    at(x,y){x=(x-this.ox)|0;y=(y-this.oy)|0;return x<0||y<0||x>=this.w||y>=this.h?-1:y*this.w+x;}
    get(x,y){const i=this.at(x,y);return i<0?0:this.data[i];}
    set(x,y,c){const i=this.at(x,y);if(i>=0)this.data[i]=c;}
    blend(x,y,c,a){const i=this.at(x,y);if(i<0)return;const d=this.data[i],oa=a+((d>>>24)/255)*(1-a);if(oa<=0)return;
      const k=a/oa,j=1-k,r=(c&255)*k+(d&255)*j,g=((c>>>8)&255)*k+((d>>>8)&255)*j,b=((c>>>16)&255)*k+((d>>>16)&255)*j;
      this.data[i]=(((oa*255)<<24)|((b&255)<<16)|((g&255)<<8)|(r&255))>>>0;}
    add(x,y,c,k){const i=this.at(x,y);if(i<0)return;const d=this.data[i],r=Math.min(255,(d&255)+(c&255)*k),g=Math.min(255,((d>>>8)&255)+((c>>>8)&255)*k),b=Math.min(255,((d>>>16)&255)+((c>>>16)&255)*k);
      this.data[i]=((255<<24)|((b&255)<<16)|((g&255)<<8)|(r&255))>>>0;}
    disc(cx,cy,r,c){if(r<=.5)return this.set(Math.round(cx),Math.round(cy),c);const r2=r*r;
      for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++){const dy=y+.5-cy;for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++){const dx=x+.5-cx;if(dx*dx+dy*dy<=r2)this.set(x,y,c);}}}
    alphaDisc(cx,cy,r,c,a){if(a<=.01)return;const r2=r*r;
      for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++){const dy=y+.5-cy;for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++){const dx=x+.5-cx;if(dx*dx+dy*dy<=r2)this.blend(x,y,c,a);}}}
    line(x0,y0,x1,y1,c){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let err=dx+dy;
      for(let n=0;n<4096;n++){this.set(x0,y0,c);if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}}}
    glow(cx,cy,r,c,k){if(r<1||k<=.01)return;const x0=Math.max(this.ox,Math.floor(cx-r)),x1=Math.min(this.ox+this.w-1,Math.ceil(cx+r)),y0=Math.max(this.oy,Math.floor(cy-r)),y1=Math.min(this.oy+this.h-1,Math.ceil(cy+r));
      for(let y=y0;y<=y1;y++){const dy=(y+.5-cy)/r;for(let x=x0;x<=x1;x++){const dx=(x+.5-cx)/r,d=dx*dx+dy*dy;if(d>=1)continue;const f=1-Math.sqrt(d);this.add(x,y,c,f*f*k);}}}
  }
  function dot(buf,x,y,c,a=1){const px=Math.floor(x),py=Math.floor(y);if(a>=1||a>bayer(px,py))buf.set(px,py,c);}
  class Rng{
    constructor(seed=1){this.s=(seed>>>0)||1;}
    next(){let t=(this.s=(this.s+0x6d2b79f5)>>>0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}
    range(a,b){return a+(b-a)*this.next();} int(a,b){return Math.floor(this.range(a,b+1));} sign(){return this.next()<.5?-1:1;}
    chance(p){return this.next()<p;} pick(a){return a[Math.floor(this.next()*a.length)];}
  }
  /* a 6-step ramp, white-hot to dark, from one colour ('#rrggbb' or [r,g,b] 0..1): highlights lean toward yellow-white, shadows
     toward a deeper, cooler hue, the way Sprite Fusion's hand-made ramps do (warm: #ffffff #fff3a6 #ffe26b #ff8a2a #f2561d #c9281f) */
  function rampOf(c){const v=Array.isArray(c)?c:[parseInt(c.slice(1,3),16)/255,parseInt(c.slice(3,5),16)/255,parseInt(c.slice(5,7),16)/255];
    const mx=Math.max(v[0],v[1],v[2]),mn=Math.min(v[0],v[1],v[2]),d=mx-mn;let h=0;if(d>0){h=mx===v[0]?((v[1]-v[2])/d)%6:mx===v[1]?(v[2]-v[0])/d+2:(v[0]-v[1])/d+4;h/=6;if(h<0)h+=1;}
    const s=mx>0?d/mx:0,hv=(H,S,V)=>{H=((H%1)+1)%1;const f=n=>{const k=(n+H*6)%6;return V-V*S*Math.max(0,Math.min(k,4-k,1));};return rgb(f(5)*255,f(3)*255,f(1)*255);};
    const toward=(a,b,k)=>{let dd=b-a;if(dd>.5)dd-=1;if(dd<-.5)dd+=1;return a+dd*k;},warm=1/6,cool=h>.08&&h<.6?.68:.98;
    return [rgb(255,255,255),hv(toward(h,warm,.35),s*.32,1),hv(toward(h,warm,.18),Math.min(1,s*.62),1),hv(h,Math.min(1,s*1.05),Math.max(.85,mx)),hv(toward(h,cool,.12),Math.min(1,s*1.08+.05),.72),hv(toward(h,cool,.24),Math.min(1,s*1.1+.1),.48)];}
  const shake=tr=>{if(settings.shake&&!reduceMotion)shake_add(tr*16);};
  const flash=(k,c)=>{const p=String(c).split(',').map(Number);tintFx([p[0]/255,p[1]/255,p[2]/255],Math.min(.7,k*1.4),.4);};
  return {PXW,TAU,BAYER,bayer,rgb,hex,mix,scale,ramp,cl,smooth,outExpo,hash,noise2,lum,Px,dot,Rng,rampOf,shake,flash,WHITE:rgb(255,255,255)};})();
function shake_add(v){shake=Math.min(16,shake+v);}

/* ---------- spawning ---------- */
const PXLAB=[];
function pxlab(id,name,cat,src,play){PXLAB.push({id,name,cat,src,play});}
function pxMax(){return PERF.lite?24:QUAL===2?72:48;}
function pxBuf(n){const L=PXFX.pool[n];return L&&L.length?L.pop():new Uint32Array(n);}
function pxFree(H){if(H.slot){PXFX.sfree.push(H.slot);H.slot=null;}const n=H.w*H.hh,L=PXFX.pool[n]||(PXFX.pool[n]=[]);if(L.length<12){L.push(H.c0);if(!H.nl)L.push(H.L);if(H.c1)L.push(H.c1);}}
/* nolight handles share one scratch light buffer per size: effects may still call light.glow on it, it is never shown */
PXFX.nlb=n=>PXFX['nl'+n]||(PXFX['nl'+n]=new Uint32Array(n));
function pxProj(H,x,h,y){if(H.mode==='flat')return[(H.ax+(x-H.x)/PIX)*PXW,(H.ay+(y-H.y)/PIX)*PXW];const u=((h||0)-H.h)*CAM.cp-(y-H.y)*CAM.sp;return[(H.ax+(x-H.x)/PIX)*PXW,(H.ay-u/PIX)*PXW];}
function pxfx(make,o={}){if(!gl||!G.fx)return null;
  const list=PXFX.list,pri=o.pri??1;
  if(list.length>=pxMax()){let vi=-1;for(let i=0;i<list.length;i++){const q=list[i];if(q.pri>pri||(q.pri===pri&&pri>=2))continue;if(vi<0||q.pri<list[vi].pri||(q.pri===list[vi].pri&&q.t>list[vi].t))vi=i;}
    if(vi<0){PXFX.drop++;return null;}list[vi].dead=true;pxFree(list[vi]);list.splice(vi,1);PXFX.drop++;}
  const w=Math.max(4,Math.min(512,Math.round(o.w||96))),hh=Math.max(4,Math.min(512,Math.round(o.hh||96))),mode=o.mode==='flat'?'flat':'bill';
  const H={x:o.x||0,y:o.y||0,h:o.h||0,mode,w,hh,ax:Math.round(o.ax??w/2),ay:Math.round(o.ay??hh-8),split:!!o.split&&mode==='bill',follow:o.follow||null,ox:o.fx||0,oy:o.fy||0,
    t:0,ttl:o.ttl??12,pri,amb:o.amb||0,lamp:!!o.lamp,nl:!!o.nolight,ev:Math.max(1,o.every??(pri===0&&(o.ttl??12)>=60?2:1)|0),ph:(Math.random()*4)|0,slot:null,a:1,fade:0,dead:false,fx:null,u:{}};
  if(H.follow){H.x=H.follow.x+H.ox;H.y=H.follow.y+H.oy;}
  H.c0=pxBuf(w*hh);H.L=H.nl?PXFX.nlb(w*hh):pxBuf(w*hh);if(H.split)H.c1=pxBuf(w*hh);
  H.frB={w,h:hh,ox:0,oy:0,color:H.c0,light:H.L};H.frF=H.split?{w,h:hh,ox:0,oy:0,color:H.c1,light:H.L}:H.frB;
  const c={x:H.ax*PXW,y:H.ay*PXW,w:w*PXW,h:hh*PXW,PXW,actor:H.follow?pxActor(H):null,handle:H};
  try{H.fx=make(c);}catch(err){console.error(err);pxFree(H);return null;}
  if(!H.fx){pxFree(H);return null;}
  list.push(H);return H;}
/* stop a handle: loops wind down through their own stop(); anything else fades out over .25 s */
function pxStop(H){if(!H||H.dead||H.stopped)return;H.stopped=true;if(H.fx&&H.fx.stop)try{H.fx.stop();}catch(e){H.fade=.25;}else H.fade=.25;}
/* a handle that left the list (done, ttl, cleared) has H.dead === true: modules keeping entity->handle maps test it and respawn */
function pxfx_clear(){for(const H of PXFX.list){H.dead=true;pxFree(H);}PXFX.list.length=0;PXFX.sfree.length=0;PXFX.sx=PXT+1;PXFX.sy=1;PXFX.srow=0;PXFX.jobs.length=0;PXFX.nq=0;emit('pxClear');}
function pxAlive(e){if(!e)return false;if(e===P)return !!P&&!P.dead;return !e.dead&&!e.hidden&&!(e.life!=null&&e.life<=0);}

/* ---------- actors: a followed entity's feet and live silhouette, in the effect's own units ---------- */
/* the character sprite drawn at (x, y) in the current (or, during update, the last) frame */
function pxSprAt(x,y,tol){tol=tol||22;let best=null,bd=1e9;for(let i=0,n=SPR.length;i<n;i++){const s=SPR[i];if(!s.f.ch)continue;const d=Math.abs(s.x-x)+Math.abs(s.y-y);if(d<tol&&d<bd){bd=d;best=s;}}return best;}
/* a sprite frame's pixels at scale s (nearest), mirrored when flip, normalized to opaque ABGR (ATL.data keeps rim codes in alpha) */
function pxSilOf(f,s,sx,sy,flip){const kx=Math.round(s*(sx||1)*(f.k||1)*20)/20,ky=Math.round(s*(sy||1)*(f.k||1)*20)/20,key=f.x+','+f.y+','+kx+','+ky+','+(flip?1:0);
  let r=PXFX.sil.get(key);if(r)return r;if(!ATL.data||f.t)return null;if(PXFX.sil.size>320)PXFX.sil.clear();
  const W=Math.max(1,Math.round(f.w*kx)),Hh=Math.max(1,Math.round(f.h*ky)),d=new Uint32Array(W*Hh),A=ATL.data,AW=ATL.w;
  for(let j=0;j<Hh;j++){const sj=Math.min(f.h-1,Math.floor(j/ky));for(let i=0;i<W;i++){let si=Math.min(f.w-1,Math.floor(i/kx));if(flip)si=f.w-1-si;const v=A[(f.y+sj)*AW+f.x+si];d[j*W+i]=v?(v|0xff000000)>>>0:0;}}
  r={w:W,h:Hh,ax:(flip?f.w-f.ax:f.ax)*kx,ay:f.ay*ky,data:d};PXFX.sil.set(key,r);return r;}
/* the followed entity's silhouette placed in H's canvas (art px), as Sprite Fusion's Actor.silhouette() returns it */
function pxSil(H){const e=H.follow;if(!e)return null;if(H.u.silF===PXFX.fr)return H.u.sil;H.u.silF=PXFX.fr;
  const s=pxSprAt(e.x,e.y);let out=null;
  if(s){const S=pxSilOf(s.f,s.s,s.sx,s.sy,s.flip);if(S)out={x:Math.round(H.ax+(s.x-H.x)/PIX-S.ax),y:Math.round(H.ay-(s.h-H.h)/PIX-S.ay),w:S.w,h:S.h,data:S.data};}
  H.u.sil=out;return out;}
function pxActor(H){return{feet:()=>[H.ax*PXW,H.ay*PXW],silhouette:()=>pxSil(H)};}

/* ---------- per frame ---------- */
function pxfx_update(dt){const L=PXFX.list;
  for(let i=L.length-1;i>=0;i--){const H=L[i];
    if(H.follow){if(pxAlive(H.follow)){H.x=H.follow.x+H.ox;H.y=H.follow.y+H.oy;}else{H.follow=null;pxStop(H);}}
    H.t+=dt;if(H.fade>0){H.a=Math.max(0,H.a-dt/.25);if(H.a<=0)H.dead=true;}
    if(!H.dead)try{H.fx.update(dt);}catch(err){console.error(err);H.dead=true;}
    if(H.dead||H.t>H.ttl||(H.fx.done&&H.fx.done())){H.dead=true;pxFree(H);L.splice(i,1);}}}
function pxfx_scene(now,b){PXFX.fr++;const L=PXFX.list,J=PXFX.jobs;J.length=0;PXFX.nq=0;if(!L.length)return;const t0=performance.now();
  let sx=1,sy=1,rowH=0,up=0;const amb=ambCur,cp=CAM.cp,sp=CAM.sp,DA=LAY.pxA,DD=LAY.pxD;
  for(const H of L){if(H.dead)continue;const m=H.mode==='flat'?H.hh*PIX:H.w*PIX;if(!(H.x>b.x0-m&&H.x<b.x1+m&&H.y>b.y0-m&&H.y<b.y1+m)){H.drawn=false;continue;}
    const nb=H.split?3:2,W=(H.w+1)*nb;let bx,by,fresh=true;
    if(H.ev>1){if(!H.slot)H.slot=pxSlot(W,H.hh);if(!H.slot)H.ev=1;}
    if(H.slot){bx=H.slot.x;by=H.slot.y;fresh=!H.drawn||(PXFX.fr+H.ph)%H.ev===0;}
    else{if(sx+W>PXT){sx=1;sy+=rowH+1;rowH=0;}if(sy+H.hh+1>PXT){PXFX.drop++;continue;}bx=sx;by=sy;sx+=W;rowH=Math.max(rowH,H.hh);}
    if(fresh){H.c0.fill(0);if(!H.nl)H.L.fill(0);if(H.split)H.c1.fill(0);
      try{if(H.split){H.fx.draw(H.frB,'back');H.fx.draw(H.frF,'front');}else H.fx.draw(H.frB);}catch(err){console.error(err);H.dead=true;continue;}H.drawn=true;}
    const bufs=H.split?[H.L,H.c0,H.c1]:[H.L,H.c0];
    for(let k=H.nl?1:0;k<bufs.length;k++){const x=bx+k*(H.w+1);if(fresh){J.push(x,by,H.w,H.hh,bufs[k]);up+=H.w*H.hh*4;}
      const u0=x/PXTW,v0=by/PXT,u1=(x+H.w)/PXTW,v1=(by+H.hh)/PXT,isL=k===0,Lr=isL?DD:DA,a=H.a,ak=isL?1:1-H.amb,
        r=isL?1:ak+H.amb*amb[0],g=isL?1:ak+H.amb*amb[1],bb=isL?1:ak+H.amb*amb[2],dz=!H.split?3:k===1?-3:3;
      if(Lr.n>=Lr.cap)continue;Lr.vi=0;
      if(H.mode==='flat'){const X0=-H.ax*PIX,X1=(H.w-H.ax)*PIX,Y0=-H.ay*PIX,Y1=(H.hh-H.ay)*PIX,lift=1.2+k*.2;
        for(let q=0;q<4;q++){const kr=q===1||q===2,kb=q>1,vx=H.x+(kr?X1:X0),vz=H.y+(kb?Y1:Y0);vtx(Lr,vx,lift+hdEH(vx,vz),vz,kr?u1:u0,kb?v1:v0,r,g,bb,a);}}
      else{const X0=-H.ax*PIX,X1=(H.w-H.ax)*PIX,T0=H.ay*PIX,T1=(H.ay-H.hh)*PIX,h=H.h+hdEH(H.x,H.y),y=H.y+dz;
        for(let q=0;q<4;q++){const kr=q===1||q===2,kb=q>1,dx=kr?X1:X0,dy=kb?T1:T0;vtx(Lr,H.x+dx,h+dy*cp,y-dy*sp,kr?u1:u0,kb?v1:v0,r,g,bb,a,0,0,dy);}}
      Lr.n++;}}
  PXFX.nq=J.length/5;PXFX.up=up;PXFX.ms=PXFX.ms*.9+(performance.now()-t0)*.1;}
function pxfx_tex(){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,PXTW,PXT,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);PXFX.tex=t;}
/* called by renderGL right after the air layers (fx program bound, depth test on, depth writes off, blending on) */
function pxfx_draw(){if(!PXFX.nq)return;if(!PXFX.tex)pxfx_tex();const J=PXFX.jobs;
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,PXFX.tex);gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  for(let i=0;i<J.length;i+=5){const b=J[i+4];gl.texSubImage2D(gl.TEXTURE_2D,0,J[i],J[i+1],J[i+2],J[i+3],gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(b.buffer,b.byteOffset,b.length*4));}
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE);drawLayer(LAY.pxD,G.fx);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);drawLayer(LAY.pxA,G.fx);}
/* effects that light the world: called by buildLights before it sorts */
function pxfx_lights(Ls){for(const H of PXFX.list){if(!H.lamp||H.dead||!H.fx.lamp)continue;let l=null;try{l=H.fx.lamp();}catch(e){}if(!l||!(l.i>.02))continue;
  Ls.push({x:H.x,h:H.h+(l.h??30)+hdEH(H.x,H.y),y:H.y,r:l.r||160,col:l.c||[1,.8,.5],i:l.i*H.a,pri:5.5});}}
onEv('update',dt=>pxfx_update(dt));
onEv('scene',(now,b)=>pxfx_scene(now,b));
onEv('resetWorld',pxfx_clear);onEv('respawn',pxfx_clear);

/* ---------- the lab: open the game with #vfxlab for a panel that plays every effect next to the hero ---------- */
function pxLabPlay(id){const e=PXLAB.find(q=>q.id===id);if(!e||!P)return false;try{e.play(P.x+(P.face<0?-90:90),P.y+10);}catch(err){console.error(err);return false;}return true;}
/* a small "FX" tab in the top row, left of MENU (index.html's G9 CSS places it there); it opens a compact list and folds itself away after an effect is played on
   narrow screens, so the effect is never hidden behind it. Shown with #vfxlab in the URL, or when window.EMBERVALE_VFXLAB is set. */
function pxLabUI(){if(document.getElementById('pxlab'))return;const d=document.createElement('div');d.id='pxlab';
  d.style.cssText='position:fixed;left:max(6px,env(safe-area-inset-left,0px));top:calc(env(safe-area-inset-top,0px) + 78px);z-index:60;font:12px "Pixelify Sans",system-ui,sans-serif;color:#f4e8c8;pointer-events:auto;text-align:right';
  const cats={};for(const e of PXLAB)(cats[e.cat]||(cats[e.cat]=[])).push(e);
  let h='<button data-pxt="1" style="padding:4px 9px;background:rgba(20,16,30,.82);color:#ffd27a;border:1px solid #c8a04a;border-radius:5px;font:inherit;cursor:pointer">FX ▸</button>'+
    '<div data-pxl="1" hidden style="margin-top:4px;width:min(190px,46vw);max-height:min(56vh,420px);overflow:auto;background:rgba(14,12,22,.88);border:1px solid #c8a04a;border-radius:6px;padding:4px">';
  for(const c in cats){h+=`<div style="margin:5px 2px 2px;color:#c8b8f8">${esc(c)}</div>`;for(const e of cats[c])h+=`<button data-px="${esc(e.id)}" style="display:block;width:100%;text-align:left;margin:1px 0;padding:3px 6px;background:#241e36;color:#f4e8c8;border:1px solid #3a3256;border-radius:3px;font:inherit;cursor:pointer">${esc(e.name)}</button>`;}
  d.innerHTML=h+'</div>';const L=d.querySelector('[data-pxl]'),B=d.querySelector('[data-pxt]'),set=o=>{L.hidden=!o;B.textContent=o?'FX ◂':'FX ▸';};
  d.addEventListener('click',ev=>{if(ev.target.closest('[data-pxt]')){set(L.hidden);return;}const b=ev.target.closest('button[data-px]');if(!b)return;pxLabPlay(b.dataset.px);if(innerWidth<900)set(false);});
  for(const k of ['pointerdown','touchstart','mousedown'])d.addEventListener(k,ev=>ev.stopPropagation(),{passive:true});const mw=document.querySelector('.mapwrap');
  if(mw){if(!document.getElementById('pxlabcss')){const st=document.createElement('style');st.id='pxlabcss';
      st.textContent='#pxlab.dock{position:absolute!important;left:auto!important;right:calc(100% + 76px)!important;top:2px!important}#pxlab button{white-space:nowrap}'+
        '@media (max-width:520px){#pxlab.dock{right:0!important;top:calc(100% + 6px)!important}}';document.head.appendChild(st);}
    d.classList.add('dock');mw.appendChild(d);}else document.body.appendChild(d);}
onEv('startGame',()=>{if(/vfxlab/.test(location.hash)||window.EMBERVALE_VFXLAB)setTimeout(pxLabUI,400);});

/* ---------- event taps: game moments the effect modules subscribe to with onEv (one wrapper each, in the house style) ----------
   pxHit (e, dmg, src, opt, crit)  a hit that landed on an enemy (opt.dot for damage over time; nodes excluded)
   pxPHurt (dmg, src)              the hero lost hp            pxHeal (amount)        the hero gained hp
   pxLevel (lvl)                   level up                    pxBreak (e)            an enemy's shield broke (Break)
   pxChest (o)                     a chest opened              pxDot (e, dps, t, col) a damage-over-time took hold
   pxMotes (x, y, col, n)          xp / gold motes burst        pxBoom (g)             a fire blast (meteor, trap, ember proc)
   pxElem (kind, x, y, R, k)       the elemental strikes: 'fire' 'ice' 'storm' 'wind' 'sun'
   pxCast (k, ab)                  the hero cast slot k (ability ab)   pxUlt (ab)  an Ultimate went off
   pxShield ()                     the hero's barrier ran out under a hit
   pxClear ()                      every pixel effect was cleared (world reset, respawn): drop your entity->handle maps */
{const o=hurt;hurt=function(e,amt,src,opt){const c0=stats.crits;const r=o(e,amt,src,opt);if(r>0&&e&&!e.node)emit('pxHit',e,r,src,opt||{},stats.crits>c0);return r;};}
{const o=hurtPlayer;hurtPlayer=function(amt,src){const p=P,h0=p?p.hp:0,s0=p?p.shield:0;const r=o(amt,src);if(p){if(p.hp<h0)emit('pxPHurt',h0-p.hp,src);if(s0>0&&p.shield<=0)emit('pxShield');}return r;};}
{const o=healP;healP=function(n,quiet){const h0=P?P.hp:0;const r=o(n,quiet);if(P&&P.hp>h0)emit('pxHeal',P.hp-h0);return r;};}
{const o=levelUp;levelUp=function(){const r=o();emit('pxLevel',P&&P.lvl);return r;};}
{const o=breakEnemy;breakEnemy=function(e){const r=o(e);emit('pxBreak',e);return r;};}
{const o=openChest;openChest=function(c){const r=o(c);emit('pxChest',c);return r;};}
{const o=addDot;addDot=function(e,dps,t,c){const r=o(e,dps,t,c);emit('pxDot',e,dps,t,c);return r;};}
{const o=motes;motes=function(x,y,c,n){const r=o(x,y,c,n);emit('pxMotes',x,y,c,n);return r;};}
{const o=boomFx;boomFx=function(g){const r=o(g);emit('pxBoom',g);return r;};}
{const o=firePillar;firePillar=function(x,y,R,k){const r=o(x,y,R,k);emit('pxElem','fire',x,y,R,k??1);return r;};}
{const o=iceBurst;iceBurst=function(x,y,R,k){const r=o(x,y,R,k);emit('pxElem','ice',x,y,R,k??1);return r;};}
{const o=skyStrike;skyStrike=function(x,y,R,k){const r=o(x,y,R,k);emit('pxElem','storm',x,y,R,k??1);return r;};}
{const o=windBlades;windBlades=function(x,y,R,k){const r=o(x,y,R,k);emit('pxElem','wind',x,y,R,k??1);return r;};}
{const o=sunburst;sunburst=function(x,y,R,k){const r=o(x,y,R,k);emit('pxElem','sun',x,y,R,k??1);return r;};}
{const o=tryCast;tryCast=function(k){const r=o(k);if(r&&P&&k!==6){const ai=k===0?0:P.load[k-1],ab=ai>=0?P.cls.abil[ai]:null;emit('pxCast',k,ab);}return r;};}
{const o=castUlt;castUlt=function(){const r=o();if(r&&P)emit('pxUlt',g2_ultAb(P));return r;};}

/* ---------- pixelfx (github.com/patch-gg/pixelfx, MIT): 244 effects drawn on this same frame layout ----------
   A module that plays pixelfx effects names them in a comment, "@pixelfx fire/brazier status/stunned", and the build bundles exactly
   those into PXLIB = {createFx, fx: {'cat/name': module}} (see the notice at the end of this block).
   pxLib(id, o, opts) -> handle: plays one through pxfx. The canvas is the effect's meta.size plus a margin (o.pad, default 4 px),
   anchored at its meta.origin (mirrored with opts.flip, grown to fit opts.angle); o = pxfx options (x, y, h, follow, pri, amb,
   nolight, lamp, ttl: default the effect's duration + 1 s, Infinity for loops), opts = the effect's own options (palette ramp
   dark -> bright, seed, flip, angle, light = glow strength, and its meta.options knobs). With o.follow, effects that wrap a
   character (meta.actor) get the followed entity's live silhouette as their actor every frame, so a pixelfx "burning" or
   "stunned" hugs the real sprite. Loops run until pxStop(handle) (or the followed entity dies), then fade out. */
const PXPFA=new WeakMap();
function pxPfxActor(sil,H){if(!sil)return null;let b=PXPFA.get(sil.data);
  if(!b){const n=sil.w*sil.h,m=new Uint8Array(n);let top=-1,tx=0,tn=0,cy=-1,cx=0,cn=0;for(let i=0;i<n;i++)if(sil.data[i])m[i]=1;
    for(let y=0;y<sil.h&&top<0;y++)for(let x=0;x<sil.w;x++)if(m[y*sil.w+x]){top=y;break;}
    if(top<0)top=0;for(let x=0;x<sil.w;x++)if(m[top*sil.w+x]){tx+=x;tn++;}cy=Math.min(sil.h-1,top+Math.round((sil.h-top)*.38));for(let x=0;x<sil.w;x++)if(m[cy*sil.w+x]){cx+=x;cn++;}
    b={mask:{w:sil.w,h:sil.h,data:m},top,hx:tn?tx/tn:sil.w/2,cy,cx:cn?cx/cn:sil.w/2};PXPFA.set(sil.data,b);}
  const x=sil.x-H.ax,y=sil.y-H.ay;return{mask:b.mask,pixels:sil.data,x,y,w:sil.w,h:sil.h,k:2,head:[Math.round(x+b.hx),y+b.top],chest:[Math.round(x+b.cx),y+b.cy]};}
function pxLib(id,o={},opts={}){if(typeof PXLIB==='undefined'||!PXLIB.fx[id]){if(!pxLib.warned)console.warn('pixelfx effect not bundled: '+id+' (declare it with an @pixelfx comment)');pxLib.warned=1;return null;}
  const mod=PXLIB.fx[id],m=mod.meta||{},sz=m.size||[64,64],org=m.origin||[sz[0]/2,sz[1]],pad=o.pad??4,fl=!!opts.flip,an=opts.angle||0;
  let L=fl?sz[0]-org[0]:org[0],R=sz[0]-L,U=org[1],Dn=sz[1]-org[1];
  if(an){const cs=Math.abs(Math.cos(an)),sn=Math.abs(Math.sin(an)),hx=Math.max(L,R),hy=Math.max(U,Dn),e=Math.ceil(hx*cs+hy*sn),f=Math.ceil(hx*sn+hy*cs);L=R=e;U=Dn=f;}
  const po=Object.assign({ttl:m.loop?Infinity:(m.duration||1)+1},o,{w:Math.ceil(L+R+pad*2),hh:Math.ceil(U+Dn+pad*2),ax:Math.round(L+pad),ay:Math.round(U+pad)});
  return pxfx(c=>{const H=c.handle,wantA=!!m.actor&&!!H.follow,op=Object.assign({seed:(Math.random()*1e6)|0},opts,{x:H.ax,y:H.ay});
      if(wantA){const a=pxPfxActor(pxSil(H),H);if(a)op.actor=a;}
      const fx=PXLIB.createFx(mod,op);
      const act=()=>{if(!wantA)return;const a=pxPfxActor(pxSil(H),H);if(a)fx.options.actor=a;};
      return{pfx:fx,update(dt){act();fx.update(dt);},draw(fr,layer){act();fx.draw(fr,layer);},done:()=>fx.done(),stop:()=>fx.stop(),lamp:o.lampFn||null};},po);}
