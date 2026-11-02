/* WAYFINDER (original, in Sprite Fusion's style): a trail of small gold chevrons lying on the ground that leads to the next checkpoint along a
   walkable route (A* over the tile grid, recomputed twice a second), so "follow the arrow" never means walking into a wall or a river.
   It shows while the goal is more than 7 tiles away, outside combat, dialogs and cinematics, and only with the quest tracker switched on.
   Recipe (per chevron, a 24 x 32 art px billboard standing on the route at ground height; pri 0, so the bridge redraws it every 2nd frame):
   - Ground read: the chevron is drawn as the camera sees a shape lying on the ground (ground depth shrinks to SQ = 0.36 of its width on
     screen, measured in game), standing at h = 0 with its lowest row on the anchor, so it never floats and never sinks into kerbs or steps
     the way a deep flat decal does. Sprites write no depth, so a chevron that a nearer prop or character covers on screen (the notice board,
     a lamp post) dithers out over 0.15 s instead of showing through it.
   - Placement: from 1.6 tiles ahead of the hero, one chevron every 1.75 tiles (~1.5 hero widths) along the route (Chaikin-smoothed),
     up to 7 (6 in lite mode); each points along the route as the camera sees it, snapped to 8 ways (direction averaged over +-0.7 tiles).
   - Shape: one design, a compact ">" 9 px tall and 7 px long, arms 3 px thick (4 px by the tip) with a V-notched tail; diagonals are a
     7 x 7 corner, arms 2 px, the inside filled to a V notch. Closed 1 px dark amber rim, a 1 px darker contact row under it. Top-lit:
     open space above -> one step lighter, open space below -> one step darker, the spine one step lighter.
   - Distance (from the 3rd chevron on): the rim always stays; up to 40 % of body pixels dither to holes, the shape loses 1 px of arm past
     the 5th, and far rims go one step darker (#2e1c0c) while their top edge goes one step brighter, so they hold on grass and cobbles.
   - Pulse: every 1.8 s a pulse runs out from the hero, 0.16 s per chevron (+-0.03 s jitter): heat rises in 0.05 s, holds 0.22 s (the
     body is the warm-white / cream core for 2-3 frames at 0.1 s steps), then falls back to gold over 0.3 s; the body step is
     3.2 - 3.2h through the ramp, Bayer-dithered between neighbouring steps. Rest brightness varies +-0.05 per chevron. The pulsing one
     lifts 1 px; at rest each bobs 1 px on its own phase (sin(3.1 t + 1.9 k) > .55).
   - Ground glow: under each, a 17 x 6 px stepped pool round its foot drawn in the colour layer (a denser dithered core in pale yellow /
     muted gold, a sparse dithered rim in muted / old gold, both brighter while pulsing), then the light buffer: a 12 x 4.5 px warm
     pool (0.12 + 0.2 h, #c08840) and a 10 x 9 px bloom halo (0.8 h^1.5, #f0c060) round the pulsing one.
   - Glints on the pulsing chevron: a white plus on its tip (2 px arms for 0.12 s, then 1 px) with a 5 px glow, a second small plus
     twinkling beside it (a new spot every 0.1 s, 0.2 s), and one pale cyan sparkle pixel behind it; 3 motes of 1 px rise 15 px over
     0.9 s with a 1 px sway (warm white -> cream -> pale yellow, dither out).
   - Palette: R0 #fffbea warm white, R1 #fff0c2 cream, R2 #f5dc90 pale yellow, R3 #d9b05c muted gold, R4 #a97c34 old gold,
     R5 #64401a dark amber rim, R6 #2e1c0c drop shadow; accent #c8f0ff (the sparkle pixel only).
   - Feel: calm, a heartbeat running out along the path; fades in over 0.4 s and out over 0.3 s. */
const {pxWayfinder}=(function(){'use strict';const {Px,bayer,hex,hash}=PXK;
  const R=['#fffbea','#fff0c2','#f5dc90','#d9b05c','#a97c34','#64401a','#2e1c0c'].map(hex),CYAN=hex('#c8f0ff'),POOL=hex('#c08840'),HALO=hex('#f0c060');
  const ELO=[0,-1,-2,-3,-3,-4],EHI=[3,2,0,-1,-2,-3],NMAX=13,STEP=1,FIRST=2.1,MY=.5,LOOP=2,STAG=.15,SQ=.36,CW=24,LH=32,CX=12,CY=21;
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
    for(let k=0;k<NMAX;k++){let d=tp-k*STAG-(hash(k,3)-.5)*.06;d=((d+.3)%LOOP+LOOP)%LOOP-.3;st.dd[k]=d;
      st.h[k]=d<-.05?0:d<0?1+d/.05:d<.15?1:Math.max(0,1-(d-.15)/.25);}}
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
    for(let k=0;k<NMAX;k++)st.oc[k]=O[k]?Math.min(1,st.oc[k]+dt/.15):Math.max(0,st.oc[k]-dt/.15);}
  /* ---------- one chevron (Sprite Fusion shape: update / draw / done / stop), a flat decal on the route ---------- */
  function chevron(k){let stop=false,fade=0;const base=.05+(hash(k,7)-.5)*.1;
    const put=(buf,x,Y,c,a)=>{if(x<0||Y<0||x>=CW||Y>=LH)return;if(a<1&&a<=bayer(x,Y))return;buf.data[Y*CW+x]=c;};
    /* an elliptic glow (falloff (1 - d)^2 * k) in the light buffer */
    const eglow=(L,cx,cy,rx,ry,c,k)=>{if(k<=.01)return;for(let y=Math.max(0,Math.floor(cy-ry));y<Math.min(LH,cy+ry);y++){const ey=(y+.5-cy)/ry;
      for(let x=Math.max(0,Math.floor(cx-rx));x<Math.min(CW,cx+rx);x++){const ex=(x+.5-cx)/rx,d=ex*ex+ey*ey;if(d>=1)continue;const f=1-Math.sqrt(d);L.add(x,y,c,f*f*k);}}};
    return{update(dt){fade=stop?Math.max(0,fade-dt/.3):Math.min(1,fade+dt/.4);},
      draw(fr){const c=st.pts[k];if(!c||fade<=0)return;const buf=new Px(fr,fr.color),light=new Px(fr,fr.light),M=st.m;
        /* every chevron has the same material; only the last two thin their body (outline kept). oc: a nearer sprite covers it, so it
           drops to a faint dithered ghost (45 %, rim and body) that still flashes with the pulse, and the route reads through the prop */
        const n=st.pts.length,h=Math.min(1,st.h[k]+base),dd=st.dd[k],oc=st.oc[k],a=fade*(1-oc),gh=fade*oc*.45;if(a+gh<=.02)return;
        const hole=k>=n-2?(k-(n-3))*.22:0,hot=dd>=-.02&&dd<.2,big=dd>=-.02&&dd<.15,cy=CY-(hot||Math.sin(st.t*3.1+k*1.9)>.55?1:0);
        let ux=Math.cos(c.a),uy=Math.sin(c.a)*SQ;const ul=Math.hypot(ux,uy)||1;ux/=ul;uy/=ul;
        if(a>.02){/* contact smudge (soft alpha shadow) and the stepped warm ground glow round its foot, drawn first */
          for(let Y=CY+1;Y<=CY+6;Y++)for(let x=CX-9;x<=CX+9;x++){const ex=(x+.5-CX-.5)/8.5,ey=(Y+.5-CY-3.5)/2.6,e=ex*ex+ey*ey;if(e>=1)continue;
            if(e<.5)buf.blend(x,Y,R[6],.3*(1-e)*a);if(e<.35)put(buf,x,Y,h>.5?R[1]:R[3],(.25+.35*h)*a);else if(e>.6)put(buf,x,Y,h>.5?R[2]:R[4],(.12+.25*h)*a);}}
        /* the chevron mask on the art grid, the direction snapped to 8 ways so its arms are clean 1:1 stairs or straight runs:
           E is a ">" 9 px tall, 7 px long, arms 3 px thick, 4 px next to the tip, V-notched tail (rows ELO..EHI); SE is its 45-degree
           turn, a 7 x 7 corner, arms 2 px thick, the inside of the corner filled to a V notch; the other six are quarter turns of these.
           As the wave passes it grows 1 px (|j| <= 5, corner arms from -4). 1 = body, 2 = spine */
        const d=((Math.round(Math.atan2(uy,ux)/(Math.PI/4))%8)+8)%8,rq=d>>1,dg=d&1,lim=dg?(big?-4:-3):(big?5:4);
        M.fill(0);for(let Y=cy-7;Y<=cy+7;Y++)for(let x=CX-7;x<=CX+7;x++){let i=x-CX,j=Y-cy;for(let r=0;r<rq;r++){const t=i;i=j;j=-t;}
          let on=0;if(!dg){const aj=Math.abs(j);if(aj<=lim&&i>=ELO[aj]&&i<=EHI[aj])on=j===0&&i>=0?2:1;}else if(i<=3&&j<=3&&i>=lim&&j>=lim&&(i>=2||j>=2||(i>=0&&j>=0&&i+j>=1)))on=i===j&&i>=1?2:1;
          M[Y*CW+x]=on;}
        let tx=3,ty=dg?3:0;for(let r=0;r<rq;r++){const t=tx;tx=-ty;ty=t;}
        /* ramp: rest body 3.0 (muted gold / old gold), the wave lifts it to 0 (warm white / cream); the fall back is Bayer-dithered
           between steps, the afterglow behind the wave */
        const m=(x,Y)=>x>=0&&Y>=0&&x<CW&&Y<LH&&M[Y*CW+x]>0,lv=3-3*h;
        for(let Y=cy-8;Y<=cy+9;Y++)for(let x=CX-8;x<=CX+8;x++){
          if(m(x,Y)){const edge=!m(x,Y-1),sp=M[Y*CW+x]===2;let i=Math.floor(lv+bayer(x,Y));if(edge||sp)i--;else if(!m(x,Y+1))i++;
            const col=R[Math.max(0,Math.min(4,i))];if(a>.02){if(!edge&&!sp&&bayer(x+3,Y+1)<hole)continue;put(buf,x,Y,col,a);}else put(buf,x,Y,col,gh+.4*h*oc);}
          else if(m(x-1,Y)||m(x+1,Y)||m(x,Y-1)||m(x,Y+1)||m(x-1,Y-1)||m(x+1,Y-1))put(buf,x,Y,R[5],a>.02?a:gh);
          else if(a>.02&&(m(x,Y-2)||m(x-1,Y-1)||m(x+1,Y-1)))put(buf,x,Y,R[6],a*.6);}
        /* the cream highlight pixel on the tip */
        if(a>.02)put(buf,CX+tx-Math.sign(tx),cy+ty-Math.sign(ty),R[0],a);
        const A2=Math.max(a,gh);
        /* light: a warm pool on the ground (12 x 4.5 px), a soft warm-white bloom core on every chevron, a bigger halo on the wave */
        eglow(light,CX+.5,CY+2.5,12,4.5,POOL,(.14+.24*h)*A2);eglow(light,CX+.5,cy+.5,7,6,HALO,(.16+.5*h)*A2);
        if(h>.12&&!PERF.lite)eglow(light,CX+.5,cy+.5,11,10,R[1],.5*Math.pow(h,1.5)*A2);
        /* two four-point plus sparkles per chevron, each on its own period (1.3-2.1 s) and phase, lit for 0.25 s at a new spot each
           cycle: white core, cream arms, pale cyan tips while large; on the wave both fire at once round the tip */
        for(let q=0;q<2;q++){const per=1.3+hash(k*2+q,13)*.8,u=st.t/per+hash(k*2+q,17),cyc=Math.floor(u),f=u-cyc,on=hot&&q===0?1:f<.25/per?1:0;if(!on)continue;
          const ph=hot&&q===0?dd/.2:f*per/.25,L=ph<.5?2:1;let sx,sy;
          if(hot&&q===0){sx=CX+tx;sy=cy+ty;}else{sx=CX+Math.round((hash(cyc*7+k,5+q)-.5)*14);sy=cy-3-Math.round(hash(cyc*3+k,9+q)*4);}
          put(buf,sx,sy,R[0],A2);for(let s2=1;s2<=L;s2++){const col=s2===2?CYAN:R[1];put(buf,sx+s2,sy,col,A2);put(buf,sx-s2,sy,col,A2);put(buf,sx,sy-s2,col,A2);put(buf,sx,sy+s2,col,A2);}
          light.glow(sx+.5,sy+.5,4,R[1],.35*A2);}
        if(hot&&a>.02)put(buf,CX-tx+(dg?0:-1),cy-5+(Math.floor(dd/.1)&1),CYAN,a);
        /* motes lifting off as the pulse passes */
        if(dd>=0&&dd<.9&&!PERF.lite&&a>.02)for(let j=0;j<3;j++){const ag=dd-j*.1;if(ag<0)continue;const q=ag/.8;if(q>=1)continue;
          const mx=Math.round(CX-.5+(hash(k*5+j,11)-.5)*8+Math.sin(ag*9+j*2)*.8),my=Math.round(cy-2-q*15-j);
          put(buf,mx,my,q<.3?R[0]:q<.6?R[1]:R[2],(1-q*q)*a);}},
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
    st.pts=sample(st.rt?st.rt.slice():null,P.x,P.y,nMax());occlude(dt);show(st.pts.length>0);
    for(let k=0;k<NMAX;k++){const h=H[k],c=st.pts[k];if(!h||h.dead)continue;if(c){/* a covered chevron's ghost stands just in front of the prop, raised by 0.35 of the shift so it stays on the same screen spot */
      const lift=st.oc[k]>0?Math.max(0,st.oy[k]-c.y+8):0;h.x=c.x;h.y=c.y+lift;h.h=lift?lift*.35+hdEH(c.x,c.y)-hdEH(c.x,c.y+lift):0;}}});
  onEv('pxClear',()=>{H.length=0;st.on=false;st.re=0;});
  pxlab('wayfinder-trail','Wayfinder: trail to the next checkpoint','World','orig',()=>{settings.trk=true;P.combatT=0;st.re=0;st.t=0;});
  return{pxWayfinder:st};})();
