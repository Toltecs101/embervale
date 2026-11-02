/* WAYFINDER (original, in Sprite Fusion's style): a trail of small gold chevrons lying on the ground that leads to the next checkpoint along a
   walkable route (A* over the tile grid, recomputed twice a second), so "follow the arrow" never means walking into a wall or a river.
   It shows while the goal is more than 7 tiles away, outside combat, dialogs and cinematics, and only with the quest tracker switched on.
   Recipe (per chevron; pri 0, so the bridge redraws it every 2nd frame):
   - Ground read: a 24 x 32 px billboard standing at h = 0 with the chevron's foot on the anchor, the chevron drawn as the camera sees a
     shape lying on the ground: squashed to 0.62 vertically, ~7 px wide and ~5 px tall on screen plus its rim (never floats, never sinks
     into kerbs the way a deep flat decal does). A soft alpha contact smudge under it.
   - Covered by a nearer prop (the notice board, a lamp post; tested against the sprite's own pixels): the whole chevron, sparkles
     included, dithers out in 0.1 s and comes back past it. The trail also stops where the ground steps more than 10 units between
     two chevrons (walls, banks), the last two thinning their body by dither.
   - Placement: from 2.5 tiles ahead of the hero (clear of the sword and the fountain's water arc), one every tile of a screen-like
     metric (depth counted at 0.5), so gaps stay about 1-1.5 chevron widths whichever way the route runs; up to 13 (8 in lite mode),
     along the Chaikin-smoothed route.
   - Shape and turn: a ">" chevron, tip 4 px ahead, wings 5 px out, front edges 1.3 back per px out, the V notch cut to 0.2 px ahead
     of the centre (arms ~2 px). It turns with the route as the camera sees it (depth weighted 0.6): within 40 degrees of level a ">" or
     "<" sheared up to 0.12 px per px so it climbs or dips with the route, steeper a "^" or "v" sheared up to 0.47; shearing keeps both
     arms whole at this size. 1 px dark amber rim, a darker contact row, a pale cream highlight on the tip; top-lit (open space above ->
     one step lighter, below -> one step darker). Size 0.95-1.05 per chevron, rest brightness +-0.06, its own 1 px bob phase.
   - Pulse: every 1.6 s a wave runs out from the hero, 0.15 s per chevron (+-0.05 s jitter): heat rises in 0.04 s, holds 0.08 s, falls
     over 0.45 s, read in steps so the wave is always visible as a staircase: leader pale cream (+1 px size, 1 px lift, tip glint),
     then light gold, gold, rest (muted / old gold).
   - Ground glow: a stepped dithered pool round it in the colour layer (cream / pale yellow under the wave, muted / old gold at rest),
     then the light buffer: a warm pool (12 x 4 px, 0.12 + 0.22 h, #c08840), a soft warm halo on every chevron (8 x 5 px,
     0.14 + 0.45 h) and a bigger cream bloom on the wave (12 x 8 px, 0.45 h^2).
   - Glints and motes: the wave leader carries a 4-spike cross glint on its tip (2 px arms with pale cyan ends for 0.1 s, then 1 px);
     after the wave each chevron lets 1-3 tiny cross motes drift up 14 px over 0.85 s (a plus while young, then 1 px; pale cream ->
     cream -> pale yellow, dither out), now and then (12 %) a cyan-white one.
   - Palette: R0 #fff3d6 pale cream, R1 #ffe7b4 cream, R2 #f2d58a pale yellow, R3 #d8ac58 muted gold, R4 #a77a33 old gold,
     R5 #5e3c18 dark amber rim, R6 #2e1c0c contact shadow; accent #d4f4ff (glint arm ends and rare motes only).
   - Feel: calm, a heartbeat running out along the path; fades in over 0.4 s and out over 0.3 s. */
const {pxWayfinder}=(function(){'use strict';const {Px,bayer,hex,hash}=PXK;
  const R=['#fff3d6','#ffe7b4','#f2d58a','#d8ac58','#a77a33','#5e3c18','#2e1c0c'].map(hex),CYAN=hex('#d4f4ff'),POOL=hex('#c08840'),HALO=hex('#f0c060');
  const NMAX=13,STEP=1,FIRST=2.5,MY=.5,LOOP=1.6,STAG=.15,VS=.62,CW=24,LH=32,CX=12,CY=21;
  /* ---------- A* on the tile grid (8 neighbours, no corner cutting); props cost extra so the route keeps to open ground ---------- */
  const NN=MW*MH,GC=new Float32Array(NN),FR=new Int32Array(NN),ST=new Uint32Array(NN),CL=new Uint32Array(NN),HP=new Int32Array(NN),HF=new Float32Array(NN);
  let stamp=0,hn=0;
  const pass=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH&&!isSolid(x,y);
  const cost=i=>solid[i]===2?3:1;
  function push(i,f){let k=hn++;while(k>0){const p=(k-1)>>1;if(HF[p]<=f)break;HP[k]=HP[p];HF[k]=HF[p];k=p;}HP[k]=i;HF[k]=f;}
  function pop(){const top=HP[0],li=HP[--hn],lf=HF[hn];let k=0;for(;;){let c=k*2+1;if(c>=hn)break;if(c+1<hn&&HF[c+1]<HF[c])c++;if(HF[c]>=lf)break;HP[k]=HP[c];HF[k]=HF[c];k=c;}HP[k]=li;HF[k]=lf;return top;}
  function nearestOpen(x,y){if(pass(x,y))return[x,y];for(let r=1;r<=3;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(pass(x+dx,y+dy))return[x+dx,y+dy];return null;}
  function route(sx,sy,gx,gy){const s=nearestOpen(sx,sy),g=nearestOpen(gx,gy);if(!s||!g)return null;stamp++;hn=0;
    const si=s[1]*MW+s[0],gi=g[1]*MW+g[0],h=(x,y)=>{const dx=Math.abs(x-g[0]),dy=Math.abs(y-g[1]);return Math.max(dx,dy)+.414*Math.min(dx,dy);};
    GC[si]=0;ST[si]=stamp;FR[si]=-1;push(si,h(s[0],s[1]));let n=0,best=si,bh=1e9;
    while(hn&&n++<14000){const i=pop();if(CL[i]===stamp)continue;CL[i]=stamp;if(i===gi){best=i;break;}const x=i%MW,y=i/MW|0,hh=h(x,y);if(hh<bh){bh=hh;best=i;}
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(!pass(nx,ny))continue;if(dx&&dy&&(!pass(x+dx,y)||!pass(x,y+dy)))continue;
        const j=ny*MW+nx;if(CL[j]===stamp)continue;const ng=GC[i]+(dx&&dy?1.414:1)*cost(j);if(ST[j]===stamp&&ng>=GC[j])continue;ST[j]=stamp;GC[j]=ng;FR[j]=i;push(j,ng+h(nx,ny));}}
    const pts=[];for(let i=best;i>=0;i=FR[i]){pts.push([(i%MW+.5)*T,((i/MW|0)+.5)*T]);if(pts.length>4000)break;}pts.reverse();return pts;}
  /* one Chaikin pass (1/4 cuts) over the first stretch of the route, so the chevrons follow a curve, not the grid's 45-degree zigzag */
  function chaikin(p){if(p.length<3)return p;const o=[p[0]],n=Math.min(p.length,40);
    for(let i=0;i<n-1;i++){const a=p[i],b=p[i+1];o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);}
    o.push(p[n-1]);for(let i=n;i<p.length;i++)o.push(p[i]);return o;}
  /* the point at arc length s along a polyline (with prefix lengths A) */
  function at(p,A,s){s=Math.max(0,Math.min(A[A.length-1],s));let k=1;while(k<A.length-1&&A[k]<s)k++;const L=A[k]-A[k-1]||1,u=(s-A[k-1])/L;
    return[p[k-1][0]+(p[k][0]-p[k-1][0])*u,p[k-1][1]+(p[k][1]-p[k-1][1])*u];}
  /* points every STEP tiles along the route, starting FIRST tiles out, with the local direction */
  function sample(pts,hx,hy,N){const out=[];if(!pts||pts.length<2)return out;pts[0]=[hx,hy];const p=chaikin(pts),A=[0];
    for(let k=1;k<p.length;k++)A.push(A[k-1]+Math.hypot(p[k][0]-p[k-1][0],(p[k][1]-p[k-1][1])*MY));const tot=A[A.length-1];
    for(let s=FIRST*T;s<=tot-.4*T&&out.length<N;s+=STEP*T){const c=at(p,A,s),f=at(p,A,s+.7*T),b=at(p,A,s-.7*T);out.push({x:c[0],y:c[1],a:Math.atan2(f[1]-b[1],f[0]-b[0])});}
    return out;}
  /* ---------- the shared trail state: heat per chevron, computed once per update ---------- */
  const st={pts:[],t:0,on:false,goal:null,rt:null,re:0,last:'',h:new Float32Array(NMAX),dd:new Float32Array(NMAX),oc:new Float32Array(NMAX),occ:new Uint8Array(NMAX),oy:new Float32Array(NMAX),m:new Uint8Array(CW*LH)};
  function heat(dt){st.t+=dt;const tp=st.t%LOOP;
    for(let k=0;k<NMAX;k++){let d=tp-k*STAG-(hash(k,3)-.5)*.1;d=((d+.3)%LOOP+LOOP)%LOOP-.3;st.dd[k]=d;
      st.h[k]=d<-.04?0:d<0?1+d/.04:d<.08?1:Math.max(0,1-(d-.08)/.45);}}
  /* sprites (props, the notice board, characters) do not write depth, so a ground decal behind one would show through it: find the
     chevrons a nearer sprite covers on screen and dither them out (st.oc eases to 1 over .15 s) */
  function occlude(dt){const n=st.pts.length,O=st.occ;O.fill(0);if(!n)return;const S=[],AD=ATL.data,AW=ATL.w;
    for(let k=0;k<n;k++){const c=st.pts[k],q=toScreen(c.x,0,c.y,VW,VH);S.push(q);}
    for(let i=0,m=SPR.length;i<m;i++){const s=SPR[i],f=s.f;if(!f||!(f.oc||f.ch))continue;const kk=PIX*s.s*(f.k||1),ky=kk*(s.sy||1),A=f.ay*ky;if(A<44)continue;
      const kx=kk*(s.sx||1),l=s.x-(s.flip?f.w-f.ax:f.ax)*kx,r=l+f.w*kx;let top=null,bot=null;
      for(let k=0;k<n;k++){if(O[k])continue;const c=st.pts[k];if(s.y<=c.y+4||s.y>c.y+8*T||c.x<l-14||c.x>r+14)continue;
        if(!top){top=toScreen(s.x,s.h+A*CAM.cp,s.y-A*CAM.sp,VW,VH);bot=toScreen(s.x,s.h,s.y,VW,VH);}const fy=(S[k].y-top.y)/((bot.y-top.y)||1);if(fy<-.05||fy>1)continue;
        /* the sprite's own pixels round the chevron (about its size, 6 x 4 art px each way): any opaque one hides it */
        if(!AD||f.t){if(c.x>l+(r-l)*.18&&c.x<r-(r-l)*.18){O[k]=1;st.oy[k]=s.y;}continue;}const col=(c.x-l)/kx,row=fy*f.ay,cw=Math.ceil(14/kx),rh=Math.ceil(10/ky);let hit=0;
        for(let y=Math.max(0,Math.floor(row-rh));y<=Math.min(f.h-1,row+rh)&&!hit;y++)for(let x=Math.max(0,Math.floor(col-cw));x<=Math.min(f.w-1,col+cw);x++){
          const sx=s.flip?f.w-1-x:x;if(AD[(f.y+y)*AW+f.x+sx]){hit=1;break;}}
        if(hit){O[k]=1;st.oy[k]=s.y;}}}
    for(let k=0;k<NMAX;k++)st.oc[k]=O[k]?Math.min(1,st.oc[k]+dt/.1):Math.max(0,st.oc[k]-dt/.1);}
  /* ---------- one chevron (Sprite Fusion shape: update / draw / done / stop), a flat decal on the route ---------- */
  function chevron(k){let stop=false,fade=0;const base=.04+(hash(k,7)-.5)*.12,sc=.95+hash(k,19)*.1;
    const put=(buf,x,Y,c,a)=>{if(x<0||Y<0||x>=CW||Y>=LH)return;if(a<1&&a<=bayer(x,Y))return;buf.data[Y*CW+x]=c;};
    /* an elliptic glow (falloff (1 - d)^2 * k) in the light buffer */
    const eglow=(L,cx,cy,rx,ry,c,k)=>{if(k<=.01)return;for(let y=Math.max(0,Math.floor(cy-ry));y<Math.min(LH,cy+ry);y++){const ey=(y+.5-cy)/ry;
      for(let x=Math.max(0,Math.floor(cx-rx));x<Math.min(CW,cx+rx);x++){const ex=(x+.5-cx)/rx,d=ex*ex+ey*ey;if(d>=1)continue;const f=1-Math.sqrt(d);L.add(x,y,c,f*f*k);}}};
    return{update(dt){fade=stop?Math.max(0,fade-dt/.3):Math.min(1,fade+dt/.4);},
      draw(fr){const c=st.pts[k];if(!c||fade<=0)return;const buf=new Px(fr,fr.color),light=new Px(fr,fr.light),M=st.m;
        /* a nearer prop covering it (oc) dithers it out fast and whole, sparkles included; the last two thin their body (rim kept) */
        const n=st.pts.length,a=fade*(1-st.oc[k]);if(a<=.02)return;const h=Math.min(1,st.h[k]+base),dd=st.dd[k];
        const hole=k>=n-2?(k-(n-3))*.22:0,hot=h>.85,lvl=h>.85?0:h>.55?1:h>.25?2:3,cy=CY-(hot||Math.sin(st.t*3.1+k*1.9)>.55?1:0);
        /* the shape is laid on the ground: a chevron (tip 4 px ahead, wings 5 px out, front edges 1.3 back per px out, the V notch
           cut to 0.2 px ahead of the centre, 0.85 back per px out, so the arms are ~2 px) squashed to VS = 0.62 vertically. It turns with the route as the camera sees it (depth weighted 0.6):
           within 40 degrees of level it is a ">" / "<" sheared up to 0.12 px per px so it climbs or dips with the route; steeper, a
           "^" / "v" sheared up to 0.47 px per px. Shearing (not rotating) keeps both arms whole at this size. Scaled 0.95-1.05 per
           chevron, x1.13 on the wave */
        const fa=Math.atan2(Math.sin(c.a)*.6,Math.cos(c.a)),fc=Math.cos(fa),fs=Math.sin(fa),hz=Math.abs(fa)<.7||Math.abs(fa)>Math.PI-.7,S=sc*(hot?1.13:1),
          sg=hz?Math.sign(fc):Math.sign(fs),tq=hz?Math.max(-.12,Math.min(.12,fs/Math.abs(fc))):Math.max(-.47,Math.min(.47,fc/Math.abs(fs)));
        const inD=(u,v)=>{v=Math.abs(v);return v<=5&&u<=4-1.3*v&&u>=.2-.85*v?(v<.9?2:1):0;};
        M.fill(0);let tu=-9,tx=CX,ty=cy;for(let Y=cy-6;Y<=cy+6;Y++)for(let x=CX-8;x<=CX+8;x++){const px=(x+.5-CX)/S,py=(Y+.5-cy)/S;
          const u=hz?px*sg:py*sg/VS*.85,v=hz?(py-px*sg*tq)/VS:px-py*sg*tq/VS,on=inD(u,v);if(on){M[Y*CW+x]=on;if(u>tu){tu=u;tx=x;ty=Y;}}}
        /* stepped warm ground glow round it, drawn first: a denser dithered core and a sparse dithered rim; a soft contact smudge */
        for(let Y=cy-3;Y<=cy+4;Y++)for(let x=CX-9;x<=CX+9;x++){const ex=(x+.5-CX)/9,ey=(Y+.5-cy-.5)/3.6,e=ex*ex+ey*ey;if(e>=1)continue;
          if(e<.4&&Y>cy)buf.blend(x,Y,R[6],.22*(1-e)*a);if(e<.35)put(buf,x,Y,lvl<2?R[1]:R[3],(.12+.3*h)*a);else if(e>.62)put(buf,x,Y,lvl<2?R[2]:R[4],(.06+.18*h)*a);}
        /* body: stepped ramp (wave leader cream > light gold > gold > rest), top-lit; 1 px dark amber rim; a darker contact row */
        const m=(x,Y)=>x>=0&&Y>=0&&x<CW&&Y<LH&&M[Y*CW+x]>0;
        for(let Y=cy-7;Y<=cy+8;Y++)for(let x=CX-9;x<=CX+9;x++){
          if(m(x,Y)){const edge=!m(x,Y-1),sp=M[Y*CW+x]===2;let i=lvl+1;if(edge||sp)i--;else if(!m(x,Y+1))i++;
            if(!edge&&!sp&&bayer(x+3,Y+1)<hole)continue;put(buf,x,Y,R[Math.max(0,Math.min(4,i))],a);}
          else if(m(x-1,Y)||m(x+1,Y)||m(x,Y-1)||m(x,Y+1)||m(x-1,Y-1)||m(x+1,Y-1))put(buf,x,Y,R[5],a);
          else if(m(x,Y-2)||m(x-1,Y-1)||m(x+1,Y-1))put(buf,x,Y,R[6],a*.6);}
        put(buf,tx,ty,lvl<2?R[0]:R[1],a);
        /* light: a warm pool on the ground and a soft warm halo on every chevron (squashed like the ground), bigger on the wave */
        eglow(light,CX+.5,cy+1,12,4,POOL,(.12+.22*h)*a);eglow(light,CX+.5,cy+.5,8,5,HALO,(.14+.45*h)*a);
        if(h>.2&&!PERF.lite)eglow(light,CX+.5,cy,12,8,R[1],.45*h*h*a);
        /* the wave leader: a 4-spike cross glint on its tip (2 px arms with pale cyan ends while fresh, then 1 px) */
        if(hot){const L=dd<.1?2:1;put(buf,tx,ty,R[0],a);for(let s2=1;s2<=L;s2++){const col=s2===2?CYAN:R[1];
            put(buf,tx+s2,ty,col,a);put(buf,tx-s2,ty,col,a);put(buf,tx,ty-s2,col,a);put(buf,tx,ty+s2,col,a);}light.glow(tx+.5,ty+.5,5,R[0],.45*a);}
        /* 1-3 tiny cross motes drifting up after the wave (a plus while young, then 1 px), now and then a cyan-white one */
        if(dd>=0&&dd<1&&!PERF.lite){const nm=1+Math.floor(hash(k,21)*3),cyc=Math.floor(st.t/LOOP);for(let j=0;j<nm;j++){const ag=dd-j*.12;if(ag<0)continue;const q=ag/.85;if(q>=1)continue;
          const mx=Math.round(CX-.5+(hash(k*5+j,11)-.5)*10+Math.sin(ag*7+j*2)*.8),my=Math.round(cy-2-q*14-j),cyn=hash(k*13+j+cyc*7,23)<.12;
          const col=cyn?CYAN:q<.3?R[0]:q<.6?R[1]:R[2],ma=(1-q*q)*a;put(buf,mx,my,col,ma);
          if(q<.35){const c2=cyn?R[0]:R[2];put(buf,mx+1,my,c2,ma);put(buf,mx-1,my,c2,ma);put(buf,mx,my-1,c2,ma);put(buf,mx,my+1,c2,ma);}}}},
      done:()=>stop&&fade<=0,stop(){stop=true;}};}
  /* ---------- the trail ---------- */
  const H=[];
  const nMax=()=>PERF.lite?8:NMAX;
  function want(){if(!P||P.dead||state!=='play'||!settings.trk||cine||dlg||travelBusy||anyOverlay())return null;if(P.combatT>0)return null;
    const g=questTargetPos();if(!g)return null;if(Math.hypot(g.x-P.x,g.y-P.y)<7*T)return null;return g;}
  function show(on){if(on===st.on)return;st.on=on;if(on){for(let k=0;k<nMax();k++){if(H[k]&&!H[k].dead)continue;const c=st.pts[k]||{x:P.x,y:P.y};
        H[k]=pxfx(()=>chevron(k),{x:c.x,y:c.y,h:0,w:CW,hh:LH,ax:CX,ay:CY+5,pri:0,ttl:Infinity});}}
    else for(const h of H)if(h&&!h.dead)pxStop(h);}
  onEv('update',dt=>{heat(dt);const g=want();if(!g){show(false);return;}
    st.re-=dt;const key=Math.floor(g.x/T)+','+Math.floor(g.y/T)+','+Math.floor(P.x/T)+','+Math.floor(P.y/T);
    if(st.re<=0||key!==st.last&&st.re<.35){st.re=.5;st.last=key;st.rt=route(Math.floor(P.x/T),Math.floor(P.y/T),Math.floor(g.x/T),Math.floor(g.y/T));}
    st.pts=sample(st.rt?st.rt.slice():null,P.x,P.y,nMax());for(let k=1,P2=st.pts;k<P2.length;k++)if(Math.abs(hdEH(P2[k].x,P2[k].y)-hdEH(P2[k-1].x,P2[k-1].y))>10){P2.length=k;break;}occlude(dt);show(st.pts.length>0);
    for(let k=0;k<NMAX;k++){const h=H[k],c=st.pts[k];if(!h||h.dead)continue;if(c){h.x=c.x;h.y=c.y;}}});
  onEv('pxClear',()=>{H.length=0;st.on=false;st.re=0;});
  pxlab('wayfinder-trail','Wayfinder: trail to the next checkpoint','World','orig',()=>{settings.trk=true;P.combatT=0;st.re=0;st.t=0;});
  return{pxWayfinder:st};})();
