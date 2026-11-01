/* CRITFX (original, in Sprite Fusion's style): the anime "Impact Frame" on the hero's critical hits. For two or three frames the
   struck enemy is repainted as a near-black silhouette with a white-hot rim over a pale burst, then flips to white over an ink burst,
   radial speed lines tear out of the hit point and a jagged comic star cracks it open; a small white-hot crack glyph lingers after.
   It complements fx/impact.js (the warm 8-spike hit star on every hit) with the inversion, the lines and the hollow jagged star.
   Recipe (S = 1; heavy = boss or Broken: S 1.35, a second white frame, 38 lines not 30, crack branches, lamp). One canvas
   (112x96, bosses 176x150) on the enemy, drawn in front of it in this order: burst, lines, silhouette, star, crack.
   frame 1 (t <= 1/60) a 16-spike pale burst r 22S (HOT[1] to 0.5, HOT[2] to 0.78, Bayer HOT[3] edge); 30 radial speed lines from
     r 12-17S, 18-40S long (1.5x along the blow), head WHITE, HOT[1], HOT[2], Bayer HOT[3] tail, 1 in 5 two px wide; the silhouette
     in 3 INK steps by the sprite's luminance with a WHITE rim (HOT[1] on the far side) and a HOT[2] inner rim facing the hit;
     a 10-spike star r 8S (WHITE, HOT[2] rim) on the hit point.
   frame 2 (heavy 2-3) the same burst in INK r 24S behind a WHITE silhouette with an INK rim (heavy frame 3 cools to HOT[1]/HOT[2]
     with an INK[2] rim); the star becomes a hollow INK outline 1.15x; lines run outward (inner end 300 px/s, outer 140 px/s).
   release (frame 3 / 4) to 0.11 s the star's rim expands 1.15 -> 1.7x, HOT[2] -> HOT[3], dithered out; lines step one ramp
     step cooler per frame and dither out by 0.13 s.
   crack glyph from the release for 0.15 s: a zig-zag fissure 2 x 3 segments of 2.5-4 px (heavy + 2 branches), WHITE -> HOT[2] ->
     HOT[3] core inside an INK outline, Bayer-faded over its last 0.06 s. All gone by 0.24 s.
   light pop e^(-t/0.045) r 24S HOT[3] 0.5 + 9S HOT[1] 0.45; shake 0.06 (heavy 0.14). At most 3 live, one per enemy. */
const {pxCritfx}=(function(){'use strict';const {Px,dot,Rng,hex,cl:clamp,TAU,PXW:PX,lum,WHITE}=PXK;
  const HOT=['#ffffff','#fff3d6','#ffd98e','#f2a552','#cf6a38','#8c3527','#4b1d22'].map(hex),INK=['#07050b','#120b17','#21152a'].map(hex);
  const REL=.11,LINE=.13,CRACK=.15,END=.24;
  function critFrame(o={}){
    const S=o.size??1,heavy=!!o.heavy,R=new Rng(o.seed??1),C=o.ramp??HOT;
    const hx=o.x/PX,hy=o.y/PX,side=o.side??1,whiteEnd=heavy?3:2,rel=whiteEnd/60;
    const NL=Math.round((heavy?38:30)*(o.lite?.6:1)),NS=heavy?12:10;
    const lines=Array.from({length:NL},(_,i)=>{const an=(i/NL)*TAU+R.range(-.12,.12),fw=Math.max(0,Math.cos(an-(side>0?0:Math.PI)));
      return{a:an,r0:R.range(12,17)*S,len:R.range(18,40)*S*(1+.5*fw),w:R.chance(.2)?2:1};});
    const spikes=Array.from({length:NS},(_,i)=>({a:(i/NS)*TAU+R.range(-.1,.1),r:R.range(.75,1.15),q:R.range(.36,.5)})),bsp=Array.from({length:16},(_,i)=>({a:(i/16)*TAU+R.range(-.08,.08),r:R.range(.8,1.2),q:R.range(.5,.62)}));
    const crack=[];const zig=(x,y,b,n,l0)=>{for(let k=0;k<n;k++){const b2=b+(k%2?.7:-.7)*R.range(.6,1.1),l=R.range(2.5,4)*S*l0,x2=x+Math.cos(b2)*l,y2=y+Math.sin(b2)*l;crack.push([x,y,x2,y2]);x=x2;y=y2;}return[x,y];};
    {const b=R.range(-.9,-.5);zig(0,0,b,3,1);const e=zig(0,0,b+Math.PI,3,1);if(heavy){zig(crack[1][2],crack[1][3],b-1.3,2,.7);zig(e[0]*.5,e[1]*.5,b+Math.PI+1.2,2,.7);}}
    let t=0,mask=new Uint8Array(0);
    o.shake?.(heavy?.14:.06);
    const frame=()=>Math.max(1,Math.ceil(t*60-1e-6));
    function starR(spikes,an){const n=spikes.length;let u=((an%TAU)+TAU)%TAU;
      for(let i=0;i<n;i++){const p=spikes[i],q=spikes[(i+1)%n],a0=p.a,a1=q.a+(i===n-1?TAU:0);let v=u;if(v<a0)v+=TAU;if(v>=a0&&v<a1){const m=(a0+a1)/2;
        return v<m?p.r+(p.q-p.r)*((v-a0)/(m-a0)):p.q+(q.r-p.q)*((v-m)/(a1-m));}}
      return spikes[0].r;}
    /* star radius by angle, baked once into 256 bins */
    const bake=sp=>{const L=new Float32Array(256);for(let i=0;i<256;i++)L[i]=starR(sp,(i+.5)/256*TAU);return L;},SL=bake(spikes),BL=bake(bsp),
      lut=(L,an)=>L[((an<0?an+TAU:an)/TAU*256)&255];
    function star(buf,R0,fill,core,rim,a){const B=Math.ceil(R0*1.2)+1;
      for(let y=-B;y<=B;y++)for(let x=-B;x<=B;x++){const yy=(y+.5)/.9,d=Math.sqrt((x+.5)*(x+.5)+yy*yy),rs=R0*lut(SL,Math.atan2(yy,x+.5));if(d>rs)continue;
        const px=Math.floor(hx)+x,py=Math.floor(hy)+y;if(d>rs-1.3)dot(buf,px,py,rim,a);else if(fill!==null)dot(buf,px,py,d<rs*.42?core:fill,a);}}
    function burst(buf,R0,c0,c1,c2){const B=Math.ceil(R0*1.2)+1;
      for(let y=-B;y<=B;y++)for(let x=-B;x<=B;x++){const yy=(y+.5)/.85,u=Math.sqrt((x+.5)*(x+.5)+yy*yy)/(R0*lut(BL,Math.atan2(yy,x+.5)));if(u>1)continue;
        const px=Math.floor(hx)+x,py=Math.floor(hy)+y;if(u<.5)buf.set(px,py,c0);else if(u<.78)buf.set(px,py,c1);else dot(buf,px,py,c2,(1-u)/.22*1.4);}}
    function silhouette(buf,s,F){const W=s.w,Hh=s.h,d=s.data,n=W*Hh;if(mask.length<n)mask=new Uint8Array(n);
      for(let i=0;i<n;i++)mask[i]=d[i]>>>24?3:0;
      for(let j=0;j<Hh;j++)for(let i=0;i<W;i++){const k=j*W+i;if(!mask[k])continue;if(i===0||j===0||i===W-1||j===Hh-1||!mask[k-1]||!mask[k+1]||!mask[k-W]||!mask[k+W])mask[k]=1;}
      for(let j=1;j<Hh-1;j++)for(let i=1;i<W-1;i++){const k=j*W+i;if(mask[k]===3&&(mask[k-1]===1||mask[k+1]===1||mask[k-W]===1||mask[k+W]===1))mask[k]=2;}
      const cx=s.x+W/2,cy=s.y+Hh/2,vx=hx-cx,vy=hy-cy,ink=F===1,cool=F===3;
      for(let j=0;j<Hh;j++)for(let i=0;i<W;i++){const k=j*W+i,m=mask[k];if(!m)continue;const x=s.x+i,y=s.y+j,l=lum(d[k]),lit=(x-cx)*vx+(y-cy)*vy>0;
        if(ink)buf.set(x,y,m===1?(lit?WHITE:C[1]):m===2&&lit?C[2]:l>.62?INK[2]:l>.32?INK[1]:INK[0]);
        else buf.set(x,y,m===1?(cool?INK[2]:INK[1]):cool?(l>.3?C[1]:C[2]):(l>.28?WHITE:C[1]));}}
    function speedLines(buf,light,F){const k=t<=rel?1:1-clamp((t-rel)/(LINE-rel)),step=F<=whiteEnd?0:Math.min(3,F-whiteEnd);if(k<=0)return;
      for(const L of lines){const r0=L.r0+300*t,r1=L.r0+L.len+140*t,cs=Math.cos(L.a),sn=Math.sin(L.a)*.85,nx=-sn,ny=cs;
        for(let dd=r0;dd<=r1;dd+=.5){const u=(dd-r0)/Math.max(1,r1-r0),x=hx+cs*dd,y=hy+sn*dd,
            c=u<.15?C[step]:u<.45?C[1+step]:u<.75?C[2+step]:C[3+step],a=(u<.75?1:(1-u)/.25*1.2)*(k<1?k*1.6-u*.6:1);
          dot(buf,x,y,c,a);if(L.w>1&&u<.5)dot(buf,x+nx,y+ny,C[2+step],a);}
        if(F<=whiteEnd)light.glow(hx+cs*(r0+4),hy+sn*(r0+4),4,C[2],.35*k);}}
    function crackGlyph(buf,light){const a=t-rel;if(a<0||a>CRACK)return;const k=a/CRACK,f=k<.92?1:1-(k-.92)/.08,fade=a>CRACK-.06?(CRACK-a)/.06:1,
        core=a<.05?WHITE:a<.1?C[2]:C[3],X=Math.floor(hx),Y=Math.floor(hy);
      for(const pass of [0,1])for(const [x0,y0,x1,y1] of crack){const n=Math.ceil(Math.hypot(x1-x0,y1-y0)*2)+1;
        for(let j=0;j<=n;j++){const x=X+x0+(x1-x0)*j/n,y=Y+y0+(y1-y0)*j/n;
          if(pass===0){for(const [ox,oy] of [[1,0],[-1,0],[0,1],[0,-1]])dot(buf,x+ox,y+oy,INK[1],fade*1.2);}else dot(buf,x,y,core,fade*1.2);}}
      if(f>0)light.glow(hx,hy,7*S,C[2],.4*fade);}
    return{
      update(dt){t+=dt;},
      draw(fr,layer){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light),F=frame();
        {if(F===1)burst(buf,22*S,C[1],C[2],C[3]);else if(F<=whiteEnd)burst(buf,24*S,INK[0],INK[1],INK[2]);
          if(t<LINE)speedLines(buf,light,F);
          const pop=Math.exp(-t/.045);if(pop>.02&&!o.lite){light.glow(hx,hy,24*S,C[3],.5*pop);light.glow(hx,hy,9*S,C[1],.45*pop);}}
        if(F<=whiteEnd){const s=o.actor?.silhouette?.();if(s)silhouette(buf,s,F);}
        const R0=8*S;
        if(F===1)star(buf,R0,WHITE,WHITE,C[2],1);
        else if(F<=whiteEnd)star(buf,R0*1.15,null,null,INK[1],1);
        else if(t<REL){const k=(t-rel)/(REL-rel);star(buf,R0*(1.15+.55*(1-(1-k)*(1-k))),null,null,k<.45?C[2]:C[3],1.2-k);}
        crackGlyph(buf,light);},
      done:()=>t>END,
      lamp:()=>{const pop=Math.exp(-t/.05);return pop>.05?{i:1.3*pop*S,c:[1,.86,.6],r:150*S,h:0}:null;}};}
  /* Embervale wrapper: e = the struck enemy, a = the blow's direction on the ground plane */
  let seed=1;const live=[];
  function pxCritfx(e,o={}){
    for(let i=live.length-1;i>=0;i--)if(live[i].H.dead)live.splice(i,1);
    if(!e||live.length>=3||live.some(q=>q.e===e&&q.H.t<.2))return null;
    const heavy=o.heavy??(!!e.boss||e.brk>0),S=heavy?1.35:1,big=!!e.boss,
      w=big?176:112,hh=big?150:96,ay=hh-26,hp=Math.round(((e.boss?60:32)*(e.s||1)+((e.d&&e.d.fly)||0))/PIX),
      a=o.a??(P?Math.atan2(e.y-P.y,e.x-P.x):0),dx=-Math.cos(a)*(e.r||16)*.45/PIX;
    const H=pxfx(c=>critFrame({x:c.x+dx*PX,y:c.y-hp*PX,size:S,heavy,side:Math.cos(a)>=0?-1:1,actor:c.actor,seed:seed++,lite:PERF.lite,shake:PXK.shake}),
      {follow:e,w,hh,ay,ttl:.3,pri:2,lamp:heavy&&!PERF.lite,nolight:PERF.lite});
    if(H)live.push({H,e});return H;}
  /* emit() forwards only 4 arguments, so pxHit's 5th (crit) arrives undefined: read the crit from stats.crits around hurt() instead */
  let base=null,seen=0;
  {const o=hurt;hurt=function(e,amt,src,opt){const b=base;base=stats.crits;try{return o(e,amt,src,opt);}finally{base=b;}};}
  onEv('pxHit',(e,dmg,src,opt,crit)=>{const c=stats.crits,isCrit=crit===true||(crit===undefined&&(base!==null?c>base:c>seen));seen=c;
    if(!isCrit||src!==P||!P||!e||(opt&&opt.dot))return;try{pxCritfx(e,{a:Math.atan2(e.y-P.y,e.x-P.x)});}catch(err){console.error(err);}});
  onEv('pxClear',()=>{live.length=0;});
  const subject=(type,x,y,brk)=>{let e=enemies.find(q=>q.type===type&&!q.dead&&Math.hypot(q.x-x-60,q.y-y)<160);
    if(!e){e=mkEnemy(type,x+60,y,Math.max(1,P.lvl-2),null);e.state='idle';e.spawn=null;enemies.push(e);}if(brk)e.brk=2;return e;};
  const hit=e=>{stats.crits++;emit('pxHit',e,50,P,{},true);};
  pxlab('critfx-a','Crit impact frame','Combat','orig',(x,y)=>hit(subject('wolf',x,y)));
  pxlab('critfx-b','Crit impact frame (Broken)','Combat','orig',(x,y)=>hit(subject('skeleton',x,y,true)));
  return{pxCritfx};})();
