/* WAYFINDER (original, in Sprite Fusion's style): a trail of gold pixel chevrons on the ground that leads to the next checkpoint along a
   walkable route (A* over the tile grid, recomputed twice a second), so "follow the arrow" never means walking into a wall or a river.
   It shows while the goal is more than 7 tiles away, outside combat, dialogs and cinematics, and only with the quest tracker switched on.
   Recipe (per chevron, a 20 x 22 art px billboard standing on the route, the arrowhead hovering 10 px over the ground):
   - Placement: from 1.6 tiles ahead of the hero, one chevron every 1.25 tiles along the route, up to 12 (14 tiles); pri 0, nolight off.
   - Shape: an arrowhead pointing along the route as the camera sees it (depth shortened by sin pitch): two arms 4.6 px out at
     1.25 px back per px across, 3 px thick, cut square, inside a closed 1 px dark rim (#3a2410) that keeps it readable on grass,
     stone and snow. Top-lit bevel: pixels with open space above take the light step, open space below the dark step; the tip is
     the hottest. A soft alpha shadow on the ground row under it.
   - Colour: a pulse runs out along the trail every 2.4 s at 9 tiles/s. Heat h = 1 at the pulse, falling as e^(-dist/1.6 tiles) behind it,
     plus a 0.28 floor: h > .72 -> C0 #fff6d0 core with C1 #ffe08a arms; h > .45 -> C1 core, C2 #f2b84a arms; else C2 core, C3 #c87a2a arms,
     chevrons past the 7th Bayer-dither out toward the 12th. As the pulse passes, a chevron rises 1 px.
   - Light: a 6 px glow in C2 at the tip, 0.35 h. Feel: calm, never flashes; fades in over 0.4 s and out over 0.3 s. */
const {pxWayfinder}=(function(){'use strict';const {Px,dot,hex,TAU,PXW:PX}=PXK;
  const C=['#fff6d0','#ffe08a','#f2b84a','#c87a2a'].map(hex),RIM=hex('#3a2410');
  const N=12,STEP=1.25,FIRST=1.6,PULSE=2.4,SPD=9;
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
  /* points every STEP tiles along the polyline, starting FIRST tiles out, with the local direction */
  function sample(pts,hx,hy){const out=[];if(!pts||pts.length<2)return out;let want=FIRST*T,acc=0;
    pts[0]=[hx,hy];for(let k=1;k<pts.length&&out.length<N;k++){const a=pts[k-1],b=pts[k],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!L)continue;
      while(acc+L>=want&&out.length<N){const u=(want-acc)/L;out.push({x:a[0]+(b[0]-a[0])*u,y:a[1]+(b[1]-a[1])*u,a:Math.atan2(b[1]-a[1],b[0]-a[0]),d:want/T});want+=STEP*T;}acc+=L;}
    return out;}
  /* ---------- one chevron (Sprite Fusion shape: update / draw / done / stop): an upright arrowhead hovering over the route ---------- */
  function chevron(st,k){let t=0,stop=false,fade=0;
    return{update(dt){t+=dt;fade=stop?Math.max(0,fade-dt/.3):Math.min(1,fade+dt/.4);},
      draw(fr){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light),c=st.pts[k];if(!c||fade<=0)return;
        const ph=(st.t%PULSE)*SPD,dd=ph-c.d,hot=dd>=0?Math.exp(-dd/1.6):Math.max(0,1+dd*3),h=Math.min(1,hot),far=1-Math.max(0,k-6)/7,a=fade*far;
        /* the route's direction as the camera sees it: depth shortens by sin(pitch) */
        const sa=Math.atan2(Math.sin(c.a)*CAM.sp,Math.cos(c.a)),ux=Math.cos(sa),uy=Math.sin(sa),bob=h>.6?1:0,cx=10,cy=9-bob;
        const lit=h>.72?[C[0],C[0],C[1]]:h>.4?[C[0],C[1],C[2]]:[C[1],C[2],C[3]],W=fr.w,Hh=fr.h-3,M=st.m||(st.m=new Uint8Array(W*fr.h));M.fill(0);
        /* the arrowhead mask: two 3 px arms meeting at the tip, cut square at their ends */
        for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){const dx=x+.5-cx,dy=y+.5-cy,u=dx*ux+dy*uy,v=-dx*uy+dy*ux,av=Math.abs(v);if(av<=4.6&&Math.abs(u-(4-av*1.25))<=1.6)M[y*W+x]=1;}
        const m=(x,y)=>x>=0&&y>=0&&x<W&&y<Hh&&M[y*W+x]===1;
        for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){if(m(x,y)){const dx=x+.5-cx,dy=y+.5-cy,u=dx*ux+dy*uy,v=-dx*uy+dy*ux;
            const c2=u>1.4&&Math.abs(v)<1.4?lit[0]:!m(x,y-1)?lit[0]:!m(x,y+1)?lit[2]:lit[1];dot(buf,x,y,c2,a);}
          else if(m(x-1,y)||m(x+1,y)||m(x,y-1)||m(x,y+1)||m(x-1,y-1)||m(x+1,y+1)||m(x+1,y-1)||m(x-1,y+1))dot(buf,x,y,RIM,a);}
        /* a soft shadow on the ground row under it */
        for(let dx=-3;dx<=3;dx++)buf.blend(cx+dx,fr.h-2,RIM,.28*fade*(1-Math.abs(dx)/4));
        light.glow(cx+ux*3,cy+uy*3,7,C[2],(.18+.4*h)*fade);},
      done:()=>stop&&fade<=0,stop(){stop=true;}};}
  /* ---------- the trail ---------- */
  const st={pts:[],t:0,on:false,goal:null,rt:null,re:0,last:''};const H=[];
  function want(){if(!P||P.dead||state!=='play'||!settings.trk||cine||dlg||travelBusy||anyOverlay())return null;if(P.combatT>0)return null;
    const g=questTargetPos();if(!g)return null;if(Math.hypot(g.x-P.x,g.y-P.y)<7*T)return null;return g;}
  function show(on){if(on===st.on)return;st.on=on;if(on){for(let k=0;k<N;k++){if(H[k]&&!H[k].dead)continue;const c=st.pts[k]||{x:P.x,y:P.y};
        H[k]=pxfx(()=>chevron(st,k),{x:c.x,y:c.y,h:4,w:20,hh:22,ax:10,ay:20,pri:0,ttl:Infinity});}}
    else for(const h of H)if(h&&!h.dead)pxStop(h);}
  onEv('update',dt=>{st.t+=dt;const g=want();if(!g){show(false);return;}
    st.re-=dt;const key=Math.floor(g.x/T)+','+Math.floor(g.y/T)+','+Math.floor(P.x/T)+','+Math.floor(P.y/T);
    if(st.re<=0||key!==st.last&&st.re<.35){st.re=.5;st.last=key;st.rt=route(Math.floor(P.x/T),Math.floor(P.y/T),Math.floor(g.x/T),Math.floor(g.y/T));}
    st.pts=sample(st.rt?st.rt.slice():null,P.x,P.y);show(st.pts.length>0);
    for(let k=0;k<N;k++){const h=H[k],c=st.pts[k];if(!h||h.dead)continue;if(c){h.x=c.x;h.y=c.y;}}});
  onEv('pxClear',()=>{H.length=0;st.on=false;st.re=0;});
  pxlab('wayfinder-trail','Wayfinder: trail to the next checkpoint','World','orig',()=>{settings.trk=true;P.combatT=0;st.re=0;});
  return{pxWayfinder:st};})();
