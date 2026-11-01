/* IMPACT (Sprite Fusion "Impact", MIT, ported): a hit's star stretched along the blow breaking into shards, a half ring, hot sparks, grey-violet chips, dust and a smoke wisp.
   Every melee or projectile hit of the hero lands one on the enemy's near edge, in the damage's colour (SF WARM, a FROST ramp for icy
   blues, else a 2.2x-saturated rampOf ending in a deep violet shadow), size 0.62 (crits 0.85, bosses x1.15): ~third of the hero's height.
   Recipe (size S, SF's surface hit: normal up, blow at a glancing 0.19 rad toward the side it travels, so B = -0.19, forward-up):
   frame 1 (t <= 1/60) an 8-spike star at 1.4x SF's size (width x1.22): C4 outline / C3 rim / C2 body / C1 inner / C0 centre (3 px),
   spikes into the surface x0.3, a 1 px white-hot streak along B (1.15x the longest spike, C0 -> C1 -> C2); frame 2 (to 2/60) the same
   1.25x long, 0.55x thick; warm bloom e^(-t/0.065) (C3 r 26S+8, C1 r 10S+3, +C2 r 16S+4 for 3 frames).
   0.033-0.13 s the 4 longest open-side spikes break into crescent shards (5-8x their length per s, C2 -> C3 -> C4, dithered);
   0.033-0.2 s a ring 8 -> 20 S px, only its open (upper) half, C2 body with a crisp C3 outer edge, then C3/C4, dithered out.
   Sparks 0.1-0.3 s (round(6 + 12S)) within +-0.6 rad of B, 260-900 u/s, 0.45g, drag 2.2, bounce x0.45: C0 head pixel, C1/C2/C3 body,
   C3/C4 tail, a C4 under-edge while young (reads on pale bodies). 4 embers (0.48-0.58 s) arc down at full g, bounce once x0.25,
   lie on the ground row as C2/C3 pixels and dither out by ~f34. Secondary layer: 3 + 5S grey-violet chips (#4a3f69 x1.25/x1/x0.7)
   flung up, falling to the ground row, bounce x0.3, settle, dither; 5 grey-blue ground chips popping at the feet from 0.06-0.12 s;
   1 + 2S dust discs, a 3-disc dust kick at the feet for low hits, one smoke wisp (SF's smoke ramp).
   Ricochet: 0.45 rad, no ring, a 0.2 rad spark cone (10 + 12S, 1.2x faster), a 3 px thick white-hot streak along B (1500 u/s for
   0.16 s) that dithers out over its second half, 2 chips, 3 ground chips, 2 embers (SF's soot scorch only at ground level).
   Ramps: SF WARM; FROST #fff / #c8f4ff / #7fd8f4 / #3fa0dc / #2c5fae / #1f2f6e; other damage colours 2.2x saturated rampOf ending
   in deep violet. Canvas 144 x (hit height + 40), anchored 44 px from the side the blow comes from. */
const {pxImpact}=(function(){'use strict';const {Px,dot,bayer,Rng,mix,scale,ramp,hex,rgb,cl:clamp,TAU,PXW:PX}=PXK;
  const SOOT=hex('#0d0a12'),SMOKE_RAMP=['#7b6f72','#5d5660','#433d48','#2b2630','#1a171e'].map(hex),WARM_RAMP=['#ffffff','#fff3a6','#ffe26b','#ff8a2a','#f2561d','#c9281f'].map(hex),SMOKE=hex('#6a6278');
  const GRAVITY=1900,PT={SPARK:0,CHIP:1,DUST:2,SMOKE:3,EMBER:4},GREYBLUE=['#8a8cab','#6e7090','#4f4d68'].map(hex);
  function impact(o={}){
    const kind=o.kind??'hit',glance=kind==='ricochet';
    const X=o.x??760,Y=o.y??600,A=o.angle??.2,S=o.size??(glance?.9:1),C=o.ramp??WARM_RAMP;
    const R=new Rng(o.seed??1);
    const groundAt=x=>o.ground===undefined?Infinity:typeof o.ground==='number'?o.ground:o.ground(x);
    const ps=new Particles(R,groundAt,C);
    const ax=X/PX,ay=Y/PX,dx=Math.cos(A),dy=Math.sin(A);
    const onSurface=o.surface!==undefined,N=o.normal??-Math.PI/2;
    const nx=Math.cos(N),ny=Math.sin(N),dn=dx*nx+dy*ny;
    const B=onSurface?Math.atan2(dy-2*dn*ny,dx-2*dn*nx):A,K=o.starK??1;
    const spikes=Array.from({length:8},(_,i)=>{const a=B+(i/8)*TAU+R.range(-.18,.18),cb=Math.cos(a-B),into=onSurface?Math.cos(a-N)<-.2:false;
      const len=(7+R.range(0,3))*S*(1+(glance?2.6:1.8)*Math.pow(Math.max(0,cb),3)+.6*Math.pow(Math.max(0,-cb),3))*(into?.3:1)*(glance&&Math.abs(Math.sin(a-B))>.6?.6:1);
      return{a,len,w:(1.5+R.range(0,.6))*S};});
    const open=a=>!onSurface||Math.cos(a-N)>-.25;
    const shards=[...spikes].filter(p=>open(p.a)).sort((p,q)=>q.len-p.len).slice(0,4).map(s=>({a:s.a+R.range(-.15,.15),r:s.len*.8,v:s.len*R.range(5,8),arc:R.range(.35,.6)}));
    let t=0;
    const n=Math.round(((glance?10:6)+12*S)*(o.sparks??1));
    for(let i=0;i<n;i++){const back=!onSurface&&R.chance(.2),a=(back?A+Math.PI:B)+R.range(-1,1)*(glance?.2:onSurface?.6:.6),sp=R.range(260,900)*(.6+.4*S)*(glance?1.2:1);
      ps.spawn(PT.SPARK,X,Y,Math.cos(a)*sp,Math.sin(a)*sp-(glance?20:60),R.range(.1,.3)*(glance?1.3:1));}
    if(onSurface){const sc=o.surface,dc=mix(sc,rgb(150,140,150),.35);
      for(let i=0;i<(glance?2:Math.round(3+5*S));i++){const a=(glance?B:N)+R.range(-.8,.8)*(glance?.6:1),sp=R.range(150,420)*S;
        ps.spawn(PT.CHIP,X,Y+ny*2,Math.cos(a)*sp,Math.sin(a)*sp,R.range(.8,1.4),R.chance(.5)?scale(sc,1.25):R.chance(.5)?sc:scale(sc,.7),R.chance(.3)?2:1);}
      for(let i=0;i<(glance?0:Math.round(1+2*S));i++){const a=N+R.range(-1,1),sp=R.range(20,90)*S;ps.spawn(PT.DUST,X+nx*3,Y+ny*3,Math.cos(a)*sp,Math.sin(a)*sp,R.range(.35,.7),dc,R.range(1.4,2.8)*Math.sqrt(S));}
      ps.spawn(PT.SMOKE,X+nx*4,Y+ny*4,R.range(-8,8),R.range(-30,-14),R.range(.8,1.3),SMOKE,R.range(1.6,2.4)*Math.sqrt(S),.05);}
    if(o.kick!==undefined){const g=o.kick,dc=mix(o.surface??SMOKE,rgb(150,140,150),.35);
      for(let i=0;i<3;i++){const sd=(i-1)||R.sign(),sp=R.range(40,110)*S;ps.spawn(PT.DUST,X+sd*R.range(2,6),g-R.range(1,3),sd*sp+Math.cos(B)*30,-R.range(6,22),R.range(.3,.55),dc,R.range(1.2,2.2)*Math.sqrt(S),R.range(.02,.06));}
      for(let i=0,m=glance?3:5;i<m;i++)ps.spawn(PT.CHIP,X+R.range(-6,12)*PX*Math.sign(Math.cos(B)||1),g-1,R.range(-50,50)+Math.cos(B)*40,-R.range(60,170),R.range(.55,.75),GREYBLUE[i%3],R.chance(.35)?2:1,R.range(.06,.12));}
    for(let i=0,m=glance?2:4;i<m;i++){const a=B+R.range(-.7,.3),sp=R.range(200,460)*S;ps.spawn(PT.EMBER,X,Y,Math.cos(a)*sp,Math.sin(a)*sp-R.range(60,180),R.range(.48,.58));}
    o.shake?.(.03*S);
    const tx=Math.cos(B),ty=Math.sin(B),STREAK=.16,SPEED=1500,scorch=o.scorch??true,scT=scorch===true?1.1:scorch===false?0:+scorch||0,scK=scorch===true?.9:scT;
    const sx=Math.cos(N+Math.PI/2)*Math.sign(Math.cos(A-(N+Math.PI/2))||1),sy=Math.sin(N+Math.PI/2)*Math.sign(Math.cos(A-(N+Math.PI/2))||1);
    return{
      update(dt){t+=dt;ps.update(dt);},
      draw(fr,layer){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light);
        if(layer!=='front'){
          if(glance&&onSurface&&t<scT){const T=clamp(1-t/scK),L=9*S;
            for(let d=0;d<=L;d+=.5){const k=d/L,px=ax-sx*d,py=ay-sy*d,c=T*(1-k)>.5?C[1]:T*(1-k)>.25?C[3]:T>0?C[5]:SOOT;dot(buf,px,py,c,1-k*.6);if(T>.2&&(d|0)%3===0)light.glow(px,py,4,C[3],.3*T*(1-k));}}
          ps.draw(buf,light,'back');}
        if(layer==='back')return;
        const f=Math.max(1,Math.ceil(t*60-1e-6));
        if(f<=2){const sc=f===1?1:1.25,L=spikes.reduce((m,p)=>Math.max(m,p.len),0)*sc*K*1.15;
          star(buf,ax,ay,spikes,S,sc,f===1?1:.55,C[0],C[2],C[1],C[3],C[4],K);
          for(let d=0;d<=L;d+=.5){const u=d/L;buf.set(Math.floor(ax+tx*d),Math.floor(ay+ty*d),u<.55?C[0]:u<.8?C[1]:C[2]);}
          buf.disc(ax,ay,f===1?1.5:1.1,C[0]);}
        if(f>=3&&t<.13){const k=(t-2/60)/(.13-2/60);for(const s of shards)crescent(buf,ax,ay,s.a,s.r+s.v*(t-2/60),s.arc*(1-.4*k),k<.4?C[2]:k<.7?C[3]:C[4],1-k);}
        if(!glance&&f>=3&&t<.2){const k=(t-2/60)/(.2-2/60),r=(8+12*(1-Math.pow(1-k,3)))*S,th=Math.max(1.5,2.5*(1-k)*S+1),col=k<.45?C[2]:k<.75?C[3]:C[4],edge=k<.45?C[3]:C[4];
          for(let j=0,n=Math.ceil(r*TAU*1.3);j<n;j++){const a=(j/n)*TAU;if(!open(a))continue;for(let q=-th/2;q<=th/2;q+=.5)dot(buf,ax+Math.cos(a)*(r+q),ay+Math.sin(a)*(r+q),q>th/2-.6?edge:col,1.15-k);}}
        if(glance&&t<STREAK){const head=(SPEED*t)/PX+6*S,tail=Math.max(2,head-(40+220*t)/PX),k=t/STREAK;
          const fade=k<.55?1:1-(k-.55)/.45;
          for(let d=tail;d<=head;d+=.5){const u=(d-tail)/Math.max(1,head-tail),x=ax+tx*d,y=ay+ty*d;
            dot(buf,x+ty,y-tx,u>.6?C[1]:C[3],(u>.4?fade:(1-k)*fade)*.9);dot(buf,x-ty*.6,y+tx*.6,u>.75?C[2]:C[4],(u>.4?fade:(1-k)*fade)*.8);
            dot(buf,x,y,u>.8?C[0]:u>.4?C[1]:C[3],u>.4?fade:(1-k)*fade);}
          light.glow(ax+tx*head,ay+ty*head,9,C[2],.6*(1-k));}
        ps.draw(buf,light,'front');
        const pop=Math.exp(-t/.065);if(pop>.02){light.glow(ax,ay,26*S+8,C[3],1.1*pop);light.glow(ax,ay,10*S+3,C[1],.85*pop);if(t<=3/60+1e-6)light.glow(ax,ay,16*S+4,C[2],.5);}},
      done:()=>t>(glance?Math.max(.2,scT):.2)&&ps.list.length===0,
      lamp:()=>{const pop=Math.exp(-t/.05);return pop>.05?{i:1.1*pop*S,c:[(C[3]&255)/255,((C[3]>>>8)&255)/255,((C[3]>>>16)&255)/255],r:120*S,h:0}:null;}};}
  /* Embervale: K scales the star (spikes x K, width x K^0.6) and an outline pass in the ramp's dark step keeps it readable on pale bodies */
  function star(buf,ax,ay,spikes,S,sc,th,core,body,inner,rim,out=rim,K=1){const wk=Math.pow(K,.6);
    for(const pass of [-1,0,1,2])for(const s of spikes){const c=Math.cos(s.a),sn=Math.sin(s.a),L=s.len*sc*K;
      for(let d=0;d<=L+(pass<0?1:0);d+=.5){const hw0=s.w*wk*th*Math.max(0,1-d/L)*Math.min(1,.5+d/3),hw=pass<0?hw0+1.5:pass===0?hw0+.8:pass===1?hw0:hw0*.45;if(pass===2&&d>L*.55)break;
        for(let q=-hw;q<=hw;q+=.5)buf.set(Math.floor(ax+c*d-sn*q),Math.floor(ay+sn*d+c*q),pass<0?out:pass===0?rim:pass===1?(d<L*.35?inner:body):core);}}
    const r=2.4*S*sc*Math.sqrt(th)*wk;buf.disc(ax,ay,r+1.2,out);buf.disc(ax,ay,r+.8,rim);buf.disc(ax,ay,r+.3,inner);buf.disc(ax,ay,r-.4,core);}
  function crescent(buf,ax,ay,a,r,arc,c,k){const n=Math.ceil(r*arc*2.2);
    for(let j=0;j<=n;j++){const u=j/n-.5,th=a+u*arc,w=1.4*(1-Math.abs(u)*2);for(let q=-w*.5;q<=w*.5+.01;q+=.5)dot(buf,ax+Math.cos(th)*(r+q),ay+Math.sin(th)*(r+q),c,k);}}
  class Particles{
    constructor(R,ground,C){this.list=[];this.t=0;this.R=R;this.ground=ground;this.C=C;}
    spawn(k,x,y,vx,vy,life,col=0,size=1,delay=0){this.list.push({k,x,y,vx,vy,life,max:life,col,size,seed:this.R.next()*100,delay});}
    update(dt){this.t+=dt;const t=this.t,R=this.R,L=this.list;
      for(let i=L.length-1;i>=0;i--){const p=L[i];if(p.delay>0){p.delay-=dt;continue;}if((p.life-=dt)<=0){L.splice(i,1);continue;}const g=this.ground(p.x);
        switch(p.k){
          case PT.SPARK:{p.vy+=GRAVITY*.45*dt;p.vx-=p.vx*2.2*dt;p.vy-=p.vy*2.2*dt;const ny=p.y+p.vy*dt;p.x+=p.vx*dt;if(p.vy>0&&p.y<=g&&ny>=g){p.vy=-p.vy*.45;p.vx*=.7;p.y=g-.5;}else p.y=ny;break;}
          case PT.CHIP:{p.vy+=GRAVITY*dt;p.vx-=p.vx*.6*dt;const ny=p.y+p.vy*dt;p.x+=p.vx*dt;
            if(p.vy>0&&p.y<=g&&ny>=g){p.y=g-.5;if(p.vy>220){p.vy=-p.vy*.3;p.vx=p.vx*.5+R.range(-20,20);}else{p.vx=p.vy=0;p.life=Math.min(p.life,.5);}}else p.y=ny;break;}
          case PT.EMBER:{if(p.rest){p.vx-=p.vx*8*dt;p.x+=p.vx*dt;break;}p.vy+=GRAVITY*dt;p.vx-=p.vx*1.1*dt;const ny=p.y+p.vy*dt;p.x+=p.vx*dt;
            if(p.vy>0&&p.y<=g&&ny>=g){p.y=g-.5;if(p.vy>260&&!p.b){p.b=1;p.vy=-p.vy*.25;p.vx*=.5;}else{p.rest=1;p.vy=0;}}else p.y=ny;break;}
          case PT.DUST:p.vx-=p.vx*4*dt;p.vy-=p.vy*4*dt+10*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case PT.SMOKE:p.vy-=32*dt;p.vx+=Math.sin(t*1.3+p.seed)*16*dt;p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.2*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;}}}
    draw(buf,light,layer){const C=this.C;
      for(const p of this.list){if(p.delay>0||(p.k===PT.SPARK)===(layer==='back'))continue;const k=p.life/p.max,ax=p.x/PX,ay=p.y/PX,px=Math.floor(ax),py=Math.floor(ay);
        switch(p.k){
          case PT.SPARK:{const hot=k>.6?C[1]:k>.3?C[2]:C[3],sp=Math.hypot(p.vx,p.vy)||1,ux=p.vx/sp,uy=p.vy/sp,len=Math.min(9,1+sp*.011);
            if(k>.55&&p.max-p.life>.045)buf.line(ax-ux*len*.5,ay-uy*len*.5+1,ax,ay+1,C[4]);
            buf.line(ax-ux*len,ay-uy*len,ax-ux*len*.4,ay-uy*len*.4,k>.6?C[3]:C[4]);buf.line(ax-ux*len*.45,ay-uy*len*.45,ax,ay,hot);if(k>.7)buf.set(px,py,C[0]);light.glow(ax,ay,3,hot,.45*k);break;}
          case PT.EMBER:{if(!p.rest){const sp=Math.hypot(p.vx,p.vy)||1,len=Math.min(4,1+sp*.006);buf.line(ax-p.vx/sp*len,ay-p.vy/sp*len,ax,ay,C[3]);buf.set(px,py,k>.6?C[1]:C[2]);light.glow(ax,ay,2,C[3],.35*k);}
            else if(k>.45||bayer(px,py)<k/.45){const c=k>.7?C[2]:k>.45?C[3]:C[4];buf.set(px,py,c);if(k>.6)buf.set(px+1,py,C[3]);if(k>.6)light.glow(ax,ay,2,C[3],.25);}break;}
          case PT.CHIP:if(k>.25||bayer(px,py)<k*4){buf.set(px,py,p.col);if(p.size>=2){buf.set(px+1,py,p.col);buf.set(px,py+1,scale(p.col,.8));}}break;
          case PT.DUST:buf.alphaDisc(ax,ay,p.size*(.6+(1-k)*.9),p.col,Math.pow(k,1.3)*.7);break;
          case PT.SMOKE:{const age=1-k,r=p.size*(.65+Math.min(1,age*2.5)*.45+age*.4),a=Math.min(1,age*12)*Math.min(1,k*2.4)*.5,c=mix(p.col,ramp(SMOKE_RAMP,age),age);
            buf.alphaDisc(ax,ay,r,c,a*.45);buf.alphaDisc(ax+r*.05,ay+r*.06,r*.74,c,a*.62);break;}}}}}
  /* Embervale wrapper. hit point h world units above the ground at (x, y); a = the blow's direction on the ground plane.
     Every hit is SF's surface hit (normal up, like the reference): the blow reads in screen space as SF's glancing angle
     (0.19 rad, ricochet 0.38) toward the side it travels, so the star stretches along the blow, the ring shows its open (upper) side,
     sparks spray forward-up, and grey-violet chips (the surface: #4a3f69 tinted 20% by the creature) fall to the ground row,
     with a dust kick at the feet for low hits and a smoke wisp. Size 0.62 (crit 0.85, bosses x1.15): about a third of the hero's height. */
  let seed=1;const SURF=hex('#4a3f69');
  function pxImpact(x,y,h,o={}){const a=o.a??0,c0=Math.cos(a),side=Math.abs(c0)>.15?Math.sign(c0):(P&&P.face<0?-1:1),glance=o.kind==='ricochet',
      tilt=(glance?.45:.19)+(o.jit??0),ang=side>0?tilt:Math.PI-tilt,hp=Math.max(0,Math.round(h/PIX)),S=o.size??.62,
      W=PERF.lite?128:144,HH=Math.max(60,hp+40),AX=side>0?44:W-44,low=hp<=20;
    return pxfx(c=>impact({kind:o.kind,x:c.x,y:c.y-hp*PX,angle:ang,size:S,ramp:o.ramp,ground:c.y,surface:o.surface??SURF,scorch:hp<4,starK:1.4,
      sparks:PERF.lite?.8:1,kick:low?c.y:undefined,seed:seed++,shake:PXK.shake}),{x,y,w:W,hh:HH,ax:AX,ay:HH-12,pri:o.pri??1,lamp:o.lamp});}
  /* damage-colour ramps: SF-style rampOf, with the last step pushed to a deep cool shadow so the ramp ends dark */
  const DEEP=hex('#1c1430'),RAMPS={};
  /* the game's damage colours are pastel tints (#bfefff, #d8b8ff...): pull them to 2.2x saturation before ramping, icy blues use FROST, warm tints SF's WARM */
  const rampFor=c=>RAMPS[c]||(RAMPS[c]=(()=>{const v=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),mx=Math.max(...v);
    if(v[2]>v[0]+30&&v[1]>v[0])return FROST;if(v[0]>v[2]+60)return WARM_RAMP;
    const r=PXK.rampOf(v.map(q=>clamp((mx-(mx-q)*2.2)/255)));r[4]=mix(r[4],DEEP,.18);r[5]=mix(r[5],DEEP,.45);return r;})());
  const FROST=['#ffffff','#c8f4ff','#7fd8f4','#3fa0dc','#2c5fae','#1f2f6e'].map(hex);
  const surfFor=()=>SURF;
  onEv('pxHit',(e,dmg,src,opt,crit)=>{if(opt.dot||src!==P||!P)return;const hh=(e.boss?60:32)*e.s+(e.d.fly||0),a=Math.atan2(e.y-P.y,e.x-P.x),
    col=opt.color&&opt.color!=='#ffffff'?opt.color:null,big=crit||opt.big;
    pxImpact(e.x-Math.cos(a)*(e.r+12*e.s),e.y-Math.sin(a)*e.r*.4+6,hh,{a,size:(big?.85:.62)*(e.boss?1.15:1),ramp:col?rampFor(col):undefined,
      surface:surfFor(e.d&&e.d.col),jit:Math.random()*.12-.06,kind:Math.random()<.18&&!big?'ricochet':'hit',lamp:big});});
  pxlab('impact','Impact (hit)','Combat','sf',(x,y)=>pxImpact(x,y,30,{a:0,lamp:true}));
  pxlab('impact-ice','Impact (frost ramp)','Combat','sf',(x,y)=>pxImpact(x,y,30,{a:.1,size:.7,ramp:FROST,surface:surfFor('#8fe6ff')}));
  pxlab('ricochet','Ricochet','Combat','sf',(x,y)=>pxImpact(x,y,30,{a:.3,kind:'ricochet'}));
  return{pxImpact};})();
