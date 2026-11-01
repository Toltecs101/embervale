/* TIMEECHO (original, in Sprite Fusion's style): the "Time Echo" of a perfect dodge. A clockwork rune ring with ticks and two hands
   sweeping backwards unfolds on the ground round the hero, two afterimages of the hero (cyan and magenta stepped ramps) stay behind
   and drift apart, an expanding ripple shell rings out from the chest and small clock-glyph motes float up. ~0.8 s.
   Recipe (two canvases: RING flat 104x104 on the ground where the dodge turned perfect; ECHO bill 144x80 on the hero, split):
   ring  R = 8 + 34 outExpo(t / 0.32) + 3t px; rim circle CY[2] with a gear tooth every 6 deg (CY[3]); inner circle R - 7 CY[3];
         60 minor ticks 1 px, 12 major ticks 4 px (CY[1]); 4 runes (3x5) at R - 11 turning +0.9 rad/s while the dial turns -1.6 rad/s;
         minute hand 0.75R sweeping backwards 1.8 turns/s, hour hand 0.45R at 0.4 turns/s, WHITE; Bayer CY[4] haze in the band.
         Steps WHITE/CY[1] (t < 0.12) -> CY[1]/CY[2] -> CY[2]/CY[3] (t > 0.4); Bayer fade 0.5 -> 0.8 s.
   echo  the hero's silhouette captured on the first frame, left at the dodge point (it lags as the hero moves on), split into a cyan
         and a magenta copy drifting apart +-(1 + 9 outExpo(t / 0.5)) px and 2 px up; 3 shades (rim / light / dark) on ramp steps 1-3,
         one step darker every 0.2 s, every third row thinned (a temporal interlace), Bayer fade 0.3 -> 0.72 s; back layer.
   shell a ripple ring from the chest r 8 -> 48 outExpo(t / 0.4), lit upper-left WHITE/CY[1], lower-right CY[3], with an inner
         echo ring 0.82r, Bayer fade by 0.45 s; front layer.
   motes 9 clock glyphs (5x5 dial + 2 hands, or a 3x3 cog) spawned 0.03-0.3 s at 10-24 px round the chest, rising 18-46 px/s,
         life 0.3-0.5 s, 1 in 3 magenta; Bayer fade over their last half.
   light pop e^(-t/0.1) r 30 CY[3] 0.35 at the chest; ring glints at the 12 major ticks 0.25. */
const {pxTimeecho}=(function(){'use strict';const {Px,dot,Rng,hex,cl:clamp,TAU,PXW:PX,outExpo,lum,WHITE}=PXK;
  const CY=['#ffffff','#e2fbff','#a6eef6','#5fcde0','#3796b8','#2a6488','#1e3d5c'].map(hex),
    MG=['#ffffff','#ffe6f6','#f4aedc','#d877bd','#a64c98','#73346f','#45224a'].map(hex);
  const SH=[0,1,3,4],RUNES=[[7,5,7,1,1],[5,7,2,7,5],[2,7,5,7,2],[6,1,7,4,3]];
  const END=.8;
  function ring(o={}){
    const cx=o.x/PX,cy=o.y/PX,R=new Rng(o.seed??1),C=o.ramp??CY;let t=0;
    const runeOff=R.range(0,TAU);
    return{
      update(dt){t+=dt;},
      draw(fr){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light);if(t>END)return;
        const r=8+27*outExpo(Math.min(1,t/.32))+3*t,rot=-1.6*t,a=t<.5?1:1-(t-.5)/.3,hot=t<.12?0:t<.4?1:2,
          rim=C[1+hot],tick=C[Math.min(3,hot+1)],inner=C[2+hot>4?4:2+hot],ri=r-7;
        const pt=(rad,an,c,al)=>dot(buf,cx+Math.cos(an)*rad,cy+Math.sin(an)*rad,c,al);
        for(let j=0,n=Math.ceil(r*TAU*1.6);j<n;j++){const an=j/n*TAU;pt(r,an,rim,a*1.1);
          const deg=((an-rot)/TAU*360+720)%6;if(deg<1.5)pt(r+1,an,C[3],a);
          pt(ri,an,inner,a);if(j%2===0)pt((r+ri)/2+((j>>1)%2?1:-1),an,C[4],a*.35);}
        for(let k=0;k<60;k++){const an=rot+k/60*TAU,maj=k%5===0,l=maj?4:1;
          for(let d=0;d<l;d++)pt(r-1-d,an,maj?(k===0?WHITE:C[1+Math.min(hot,1)]):tick,a);
          if(maj&&a>.2)light.glow(cx+Math.cos(an)*(r-2),cy+Math.sin(an)*(r-2),3,C[3],.25*a*(1-hot*.3));}
        if(r>22)for(let k=0;k<4;k++){const an=runeOff+.9*t+k/4*TAU,gx=Math.round(cx+Math.cos(an)*(r-11)),gy=Math.round(cy+Math.sin(an)*(r-11)),g=RUNES[k];
          for(let y=0;y<5;y++)for(let x=0;x<3;x++)if(g[y]>>(2-x)&1)dot(buf,gx-1+x,gy-2+y,C[2+Math.min(hot,1)],a);}
        const hand=(len,an)=>{for(let d=2;d<=len;d+=.5)pt(d,an,d>len-2?C[1]:WHITE,a);};
        hand(r*.75,-t*TAU*1.8-Math.PI/2);hand(r*.45,-t*TAU*.4-Math.PI/2+1.1);
        const pop=Math.exp(-t/.1);if(pop>.03)light.glow(cx,cy,26,C[3],.4*pop);},
      done:()=>t>END};}
  function echo(o={}){
    const R=new Rng(o.seed??1),act=o.actor,H=o.handle;let t=0,ghost=null,g0=null;
    const motes=[];let spawned=0;
    function capture(){const s=act?.silhouette?.();if(!s)return;const n=s.w*s.h,m=new Uint8Array(n),d=s.data;
      for(let j=0;j<s.h;j++)for(let i=0;i<s.w;i++){const k=j*s.w+i;if(!(d[k]>>>24))continue;
        const edge=i===0||j===0||i===s.w-1||j===s.h-1||!(d[k-1]>>>24)||!(d[k+1]>>>24)||!(d[k-s.w]>>>24)||!(d[k+s.w]>>>24);m[k]=edge?1:lum(d[k])>.45?2:3;}
      ghost={x:s.x-H.ax,y:s.y-H.ay,w:s.w,h:s.h,m};g0=[H.x,H.y];}
    const at=()=>{if(!g0)return[H.ax,H.ay];const p=pxProj(H,g0[0],0,g0[1]);return[p[0]/PX,p[1]/PX];};
    /* the bridge's 'back' layer still draws over the hero's sprite, so the echoes skip the hero's live silhouette to stay behind him */
    function drawGhost(buf,C,dx,dy,a,step,s){const [ax,ay]=at(),g=ghost,sh=Math.floor(t*24);
      for(let j=0;j<g.h;j++){if((j+sh)%4===0)continue;const y=Math.floor(ay+g.y+j+dy),sj=s?y-s.y:-1,row=s&&sj>=0&&sj<s.h;
        for(let i=0;i<g.w;i++){const v=g.m[j*g.w+i];if(!v)continue;const x=Math.floor(ax+g.x+i+dx);
          if(row){const si=x-s.x;if(si>=0&&si<s.w&&s.data[sj*s.w+si]>>>24)continue;}
          dot(buf,x,y,C[Math.min(6,SH[v]+step)],a);}}}
    function glyph(buf,m,c,a){const x=Math.floor(m.x),y=Math.floor(m.y);
      if(m.big){for(const [i,j] of [[-1,-2],[0,-2],[1,-2],[-1,2],[0,2],[1,2],[-2,-1],[-2,0],[-2,1],[2,-1],[2,0],[2,1]])dot(buf,x+i,y+j,c,a);
        dot(buf,x,y,WHITE,a);dot(buf,x,y-1,WHITE,a);dot(buf,x+m.h,y,m.C[1],a);}
      else{dot(buf,x,y,WHITE,a);for(const [i,j] of [[-1,0],[1,0],[0,-1],[0,1]])dot(buf,x+i,y+j,c,a);}}
    return{
      update(dt){t+=dt;
        while(spawned<9&&t>.03+spawned*.03){spawned++;const an=R.range(0,TAU),rr=R.range(10,24),mg=R.chance(.33);
          motes.push({x:H.ax+Math.cos(an)*rr,y:H.ay-20+Math.sin(an)*rr*.8,vx:Math.cos(an)*R.range(6,16),vy:-R.range(18,46),life:R.range(.3,.5),max:.5,C:mg?MG:CY,big:R.chance(.6),h:R.chance(.5)?1:-1});}
        for(let i=motes.length-1;i>=0;i--){const m=motes[i];if((m.life-=dt)<=0){motes.splice(i,1);continue;}m.vx-=m.vx*2*dt;m.vy-=m.vy*1.2*dt;m.x+=m.vx*dt;m.y+=m.vy*dt;}},
      draw(fr,layer){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light);if(!ghost&&t<.2)capture();
        if(layer!=='front'){
          if(ghost&&t<.72){const a=t<.3?1:1-(t-.3)/.42,step=Math.min(2,Math.floor(t/.25)),e=outExpo(Math.min(1,t/.5)),d=1+9*e,[ax,ay]=at();
            const s=act?.silhouette?.();drawGhost(buf,MG,Math.round(d),-Math.round(2*e),a*.95,step,s);drawGhost(buf,CY,-Math.round(d),-Math.round(2*e),a,step,s);
            light.glow(ax-d,ay-20,18,CY[3],.22*a);light.glow(ax+d,ay-20,18,MG[3],.18*a);}
          for(const m of motes)if(m.h<0)glyph(buf,m,m.C[2],m.life/m.max*2);}
        if(layer==='back')return;
        const cx=H.ax,cy=H.ay-20;
        if(t<.45){const k=t/.45,r=8+34*outExpo(Math.min(1,t/.4)),a=1.2-k*1.2;
          for(let j=0,n=Math.ceil(r*TAU*1.5);j<n;j++){const an=j/n*TAU,l=Math.cos(an+2.4),c=l>.55?(k<.3?WHITE:CY[1]):l>-.2?CY[2]:CY[3];
            dot(buf,cx+Math.cos(an)*r,cy+Math.sin(an)*r*.9,c,a);if(j%2===0)dot(buf,cx+Math.cos(an)*r*.82,cy+Math.sin(an)*r*.82*.9,CY[3],a*.45);}}
        for(const m of motes)if(m.h>0)glyph(buf,m,m.C[2],m.life/m.max*2);
        for(const m of motes)light.glow(m.x,m.y,4,m.C[3],.3*m.life/m.max);
        const pop=Math.exp(-t/.1);if(pop>.03)light.glow(cx,cy,30,CY[3],.35*pop);},
      done:()=>t>END&&motes.length===0};}
  /* Embervale wrapper: the ring stays where the dodge turned perfect, the echo canvas follows the hero */
  let seed=1,last=null;
  function pxTimeecho(p=P){if(!p||p.dead)return null;if(last&&!last.dead&&last.t<.3)return last;const s=seed++;
    pxfx(c=>ring({x:c.x,y:c.y,seed:s}),{x:p.x,y:p.y,mode:'flat',w:88,hh:88,ax:44,ay:44,ttl:1.1,pri:1,nolight:PERF.lite});
    last=pxfx(c=>echo({actor:c.actor,handle:c.handle,seed:s}),{follow:p,split:true,w:144,hh:80,ay:70,ttl:1.2,pri:1,nolight:PERF.lite});
    return last;}
  onEv('perfectDodge',()=>{try{pxTimeecho(P);}catch(err){console.error(err);}});
  onEv('pxClear',()=>{last=null;});
  pxlab('timeecho','Time Echo (perfect dodge)','Movement','orig',()=>pxTimeecho(P));
  pxlab('timeecho-dodge','Time Echo on a real perfect dodge','Movement','orig',()=>{if(!P)return;P.dash=null;P.g1b_cd=0;P.ang=0;P.face=1;g1b_dodge();g1b_perfect(P);});
  return{pxTimeecho};})();
