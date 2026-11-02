/* IMPACT (Sprite Fusion "Impact", MIT, ported): a hit's star stretched along the blow breaking into shards, a ring, hot sparks,
   and on a surface hit the grounded chips, dust and smoke wisp. Every hit the hero lands shows one, in the damage's colour.
   The factory is Sprite Fusion's own code unchanged (runs/ref/impact.ts); the Embervale wrapper only picks parameters.
   Recipe (size S): frame 1 (t <= 1/60) an 8-spike star, white core / C2 inner / C1 body / C4 rim, spikes into the surface x0.3;
   frame 2 (to 2/60) 1.25x long, 0.55x thick, one ramp step cooler; 0.033-0.13 s the 4 longest open-side spikes break into crescent
   shards (5-8x their length per s); 0.033-0.2 s a ring 8 -> 20 S px, open (upper) side only, C1 -> C2 -> C3 dithered out;
   sparks 0.1-0.3 s (round(6 + 12S), ricochet 10 + 12S in a 0.3 rad cone, 1.2x faster), 0.45g, drag 2.2, bouncing x0.45 on the
   ground row; surface secondary layer: 3 + 5S chips of the surface colour (x1.25 / x1 / x0.7) at full g, bouncing x0.3 and settling,
   3 + 4S dust discs, one smoke wisp at 0.05 s; ricochet adds a white-hot streak along the bounce (1500 u/s for 0.16 s) and a hot
   scrape cooling to soot over 0.9 s; light pop e^(-t/0.05).
   Embervale parameters: a surface hit with normal up and the ground row at the target's feet; blow at SF's 0.19 rad (ricochet 0.3)
   toward the side it travels; surface #4a3f69; a 1 px C5 outline round the star on frames 1-2 only (reads on white hit flashes); size 0.75 (crits / big hits 0.95, bosses x1.1); damage colours as SF-style ramps,
   icy blues as SF's cyan ramp #ffffff #dffcff #7ff3ff #1ab8e6 #1a6fb8 #183a7a. */
const {pxImpact}=(function(){'use strict';const {Px,dot,bayer,Rng,mix,scale,ramp,hex,rgb,cl:clamp,TAU,PXW:PX}=PXK;
  const SOOT=hex('#0d0a12'),SMOKE_RAMP=['#7b6f72','#5d5660','#433d48','#2b2630','#1a171e'].map(hex),WARM_RAMP=['#ffffff','#fff3a6','#ffe26b','#ff8a2a','#f2561d','#c9281f'].map(hex),SMOKE=hex('#6a6278');
  const GRAVITY=1900,PT={SPARK:0,CHIP:1,DUST:2,SMOKE:3};
  function impact(o={}){
    const kind=o.kind??'hit',glance=kind==='ricochet';
    const X=o.x??760,Y=o.y??600,A=o.angle??.2,S=o.size??(glance?.9:1),C=o.ramp??WARM_RAMP;
    const R=new Rng(o.seed??1);
    const groundAt=x=>o.ground===undefined?Infinity:typeof o.ground==='number'?o.ground:o.ground(x);
    const ps=new Particles(R,groundAt,C);
    const ax=X/PX,ay=Y/PX,dx=Math.cos(A),dy=Math.sin(A);
    const onSurface=o.surface!==undefined,N=o.normal??-Math.PI/2;
    const nx=Math.cos(N),ny=Math.sin(N),dn=dx*nx+dy*ny;
    const B=onSurface?Math.atan2(dy-2*dn*ny,dx-2*dn*nx):A;
    const spikes=Array.from({length:8},(_,i)=>{const a=B+(i/8)*TAU+R.range(-.18,.18),cb=Math.cos(a-B),into=onSurface?Math.cos(a-N)<-.2:false;
      const len=(7+R.range(0,3))*S*(1+(glance?2.6:1.8)*Math.pow(Math.max(0,cb),3)+.6*Math.pow(Math.max(0,-cb),3))*(into?.3:1)*(glance&&Math.abs(Math.sin(a-B))>.6?.6:1);
      return{a,len,w:(1.5+R.range(0,.6))*S};});
    const open=a=>!onSurface||Math.cos(a-N)>-.25;
    const shards=[...spikes].filter(p=>open(p.a)).sort((p,q)=>q.len-p.len).slice(0,4).map(s=>({a:s.a+R.range(-.15,.15),r:s.len*.8,v:s.len*R.range(5,8),arc:R.range(.35,.6)}));
    let t=0;
    const n=Math.round((glance?10:6)+12*S);
    for(let i=0;i<n;i++){const back=!onSurface&&R.chance(.2),a=(back?A+Math.PI:B)+R.range(-1,1)*(glance?.3:onSurface?.85:.6),sp=R.range(260,900)*(.6+.4*S)*(glance?1.2:1);
      ps.spawn(PT.SPARK,X,Y,Math.cos(a)*sp,Math.sin(a)*sp-(glance?20:60),R.range(.1,.3)*(glance?1.3:1));}
    if(onSurface){const sc=o.surface,dc=mix(sc,rgb(150,140,150),.35);
      for(let i=0;i<Math.round((glance?2:3)+5*S);i++){const a=(glance?B:N)+R.range(-.8,.8)*(glance?.6:1),sp=R.range(150,420)*S;
        ps.spawn(PT.CHIP,X,Y+ny*2,Math.cos(a)*sp,Math.sin(a)*sp,R.range(.8,1.4),R.chance(.5)?scale(sc,1.25):R.chance(.5)?sc:scale(sc,.7),R.chance(.3)?2:1);}
      for(let i=0;i<Math.round(3+4*S);i++){const a=N+R.range(-1,1),sp=R.range(20,90)*S;ps.spawn(PT.DUST,X+nx*3,Y+ny*3,Math.cos(a)*sp,Math.sin(a)*sp,R.range(.35,.7),dc,R.range(1.4,2.8)*Math.sqrt(S));}
      ps.spawn(PT.SMOKE,X+nx*4,Y+ny*4,R.range(-8,8),R.range(-30,-14),R.range(.8,1.3),SMOKE,R.range(1.6,2.4)*Math.sqrt(S),.05);}
    o.shake?.(.03*S);
    const tx=Math.cos(B),ty=Math.sin(B),STREAK=.16,SPEED=1500;
    const sx=Math.cos(N+Math.PI/2)*Math.sign(Math.cos(A-(N+Math.PI/2))||1),sy=Math.sin(N+Math.PI/2)*Math.sign(Math.cos(A-(N+Math.PI/2))||1);
    return{
      update(dt){t+=dt;ps.update(dt);},
      draw(fr,layer){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light);
        if(layer!=='front'){
          if(glance&&onSurface&&t<1.1){const T=clamp(1-t/.9),L=9*S;
            for(let d=0;d<=L;d+=.5){const k=d/L,px=ax-sx*d,py=ay-sy*d,c=T*(1-k)>.5?C[1]:T*(1-k)>.25?C[3]:T>0?C[5]:SOOT;dot(buf,px,py,c,1-k*.6);if(T>.2&&(d|0)%3===0)light.glow(px,py,4,C[3],.3*T*(1-k));}}
          ps.draw(buf,light,'back');}
        if(layer==='back')return;
        const f=Math.max(1,Math.ceil(t*60-1e-6));
        if(f===1)star(buf,ax,ay,spikes,S,1,1,C[0],C[1],C[2],C[4],o.rim?C[5]:0);
        else if(f===2)star(buf,ax,ay,spikes,S,1.25,.55,C[1],C[2],C[3],C[4],o.rim?C[5]:0);
        if(f>=3&&t<.13){const k=(t-2/60)/(.13-2/60);for(const s of shards)crescent(buf,ax,ay,s.a,s.r+s.v*(t-2/60),s.arc*(1-.4*k),k<.4?C[2]:k<.7?C[3]:C[4],1-k);}
        if(f>=3&&t<.2){const k=(t-2/60)/(.2-2/60),r=(8+12*(1-Math.pow(1-k,3)))*S,th=Math.max(1,2*(1-k)*S),col=k<.3?C[1]:k<.6?C[2]:C[3];
          for(let j=0,n=Math.ceil(r*TAU*1.3);j<n;j++){const a=(j/n)*TAU;if(!open(a))continue;for(let q=-th/2;q<=th/2;q+=.5)dot(buf,ax+Math.cos(a)*(r+q),ay+Math.sin(a)*(r+q),col,1.15-k);}}
        if(glance&&t<STREAK){const head=(SPEED*t)/PX+6*S,tail=Math.max(2,head-(40+220*t)/PX),k=t/STREAK;
          for(let d=tail;d<=head;d+=.5){const u=(d-tail)/Math.max(1,head-tail);dot(buf,ax+tx*d,ay+ty*d,u>.8?C[0]:u>.4?C[1]:C[3],u>.4?1:1-k);}
          light.glow(ax+tx*head,ay+ty*head,9,C[2],.6*(1-k));}
        ps.draw(buf,light,'front');
        const pop=Math.exp(-t/.05);if(pop>.02){light.glow(ax,ay,22*S+6,C[3],.9*pop);light.glow(ax,ay,8*S+2,C[0],.7*pop);}},
      done:()=>t>(glance?1.1:.2)&&ps.list.length===0,
      lamp:()=>{const pop=Math.exp(-t/.05);return pop>.05?{i:1.1*pop*S,c:[(C[3]&255)/255,((C[3]>>>8)&255)/255,((C[3]>>>16)&255)/255],r:120*S,h:0}:null;}};}
  /* Embervale: an optional 1 px dark outline (out) on frames 1-2 keeps the star readable on white hit-flashed bodies */
  function star(buf,ax,ay,spikes,S,sc,th,core,body,inner,rim,out){if(out)for(const s of spikes){const c=Math.cos(s.a),sn=Math.sin(s.a),L=s.len*sc;
      for(let d=0;d<=L+1;d+=.5){const hw=s.w*th*Math.max(0,1-d/L)*Math.min(1,.5+d/3)+1.3;for(let q=-hw;q<=hw;q+=.5)buf.set(Math.floor(ax+c*d-sn*q),Math.floor(ay+sn*d+c*q),out);}}
    for(const pass of [0,1,2])for(const s of spikes){const c=Math.cos(s.a),sn=Math.sin(s.a),L=s.len*sc;
      for(let d=0;d<=L;d+=.5){const hw0=s.w*th*(1-d/L)*Math.min(1,.5+d/3),hw=pass===0?hw0+.8:pass===1?hw0:hw0*.45;if(pass===2&&d>L*.55)break;
        for(let q=-hw;q<=hw;q+=.5)buf.set(Math.floor(ax+c*d-sn*q),Math.floor(ay+sn*d+c*q),pass===0?rim:pass===1?(d<L*.35?inner:body):core);}}
    const r=2.4*S*sc*Math.sqrt(th);if(out)buf.disc(ax,ay,r+1.6,out);buf.disc(ax,ay,r+.8,inner);buf.disc(ax,ay,r,core);}
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
          case PT.DUST:p.vx-=p.vx*4*dt;p.vy-=p.vy*4*dt+10*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case PT.SMOKE:p.vy-=32*dt;p.vx+=Math.sin(t*1.3+p.seed)*16*dt;p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.2*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;}}}
    draw(buf,light,layer){const C=this.C;
      for(const p of this.list){if(p.delay>0||(p.k===PT.SPARK)===(layer==='back'))continue;const k=p.life/p.max,ax=p.x/PX,ay=p.y/PX,px=Math.floor(ax),py=Math.floor(ay);
        switch(p.k){
          case PT.SPARK:{const hot=k>.6?C[1]:k>.3?C[2]:C[3],sp=Math.hypot(p.vx,p.vy)||1,ux=p.vx/sp,uy=p.vy/sp,len=Math.min(9,1+sp*.011);
            buf.line(ax-ux*len,ay-uy*len,ax-ux*len*.4,ay-uy*len*.4,k>.5?hot:C[4]);buf.line(ax-ux*len*.45,ay-uy*len*.45,ax,ay,hot);light.glow(ax,ay,3,hot,.45*k);break;}
          case PT.CHIP:if(k>.25||bayer(px,py)<k*4){buf.set(px,py,p.col);if(p.size>=2){buf.set(px+1,py,p.col);buf.set(px,py+1,scale(p.col,.8));}}break;
          case PT.DUST:buf.alphaDisc(ax,ay,p.size*(.6+(1-k)*.9),p.col,Math.pow(k,1.3)*.7);break;
          case PT.SMOKE:{const age=1-k,r=p.size*(.65+Math.min(1,age*2.5)*.45+age*.4),a=Math.min(1,age*12)*Math.min(1,k*2.4)*.5,c=mix(p.col,ramp(SMOKE_RAMP,age),age);
            buf.alphaDisc(ax,ay,r,c,a*.45);buf.alphaDisc(ax+r*.05,ay+r*.06,r*.74,c,a*.62);break;}}}}}
  /* Embervale wrapper. hit point h world units above the ground at (x, y); a = the blow's direction on the ground plane */
  let seed=1;const SURF=hex('#4a3f69');
  const FROST=['#ffffff','#dffcff','#7ff3ff','#1ab8e6','#1a6fb8','#183a7a'].map(hex);
  function pxImpact(x,y,h,o={}){const a=o.a??0,c0=Math.cos(a),side=Math.abs(c0)>.15?Math.sign(c0):(P&&P.face<0?-1:1),glance=o.kind==='ricochet',
      tilt=glance?.3:.19,ang=side>0?tilt:Math.PI-tilt,hp=Math.max(0,Math.round(h/PIX)),S=o.size??.75,
      W=144,HH=Math.max(64,hp+48),AX=side>0?44:W-44;
    return pxfx(c=>impact({kind:o.kind,x:c.x,y:c.y-hp*PX,angle:ang,size:S,ramp:o.ramp,ground:c.y,surface:o.surface??SURF,rim:true,seed:seed++,shake:PXK.shake}),
      {x,y,w:W,hh:HH,ax:AX,ay:HH-12,pri:o.pri??1,lamp:o.lamp});}
  /* damage colours: SF-style rampOf (the game's tints are pastel, so they are pulled to 2.2x saturation first, and the last step
     deepened); icy blues use SF's cyan ramp, warm tints SF's WARM ramp */
  const DEEP=hex('#1c1430'),RAMPS={};
  const rampFor=c=>RAMPS[c]||(RAMPS[c]=(()=>{const v=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),mx=Math.max(...v);
    if(v[2]>v[0]+30&&v[1]>v[0])return FROST;if(v[0]>v[2]+60)return WARM_RAMP;
    const r=PXK.rampOf(v.map(q=>clamp((mx-(mx-q)*2.2)/255)));r[4]=mix(r[4],DEEP,.18);r[5]=mix(r[5],DEEP,.45);return r;})());
  onEv('pxHit',(e,dmg,src,opt,crit)=>{if(opt.dot||src!==P||!P)return;const hh=(e.boss?60:32)*e.s+(e.d.fly||0),a=Math.atan2(e.y-P.y,e.x-P.x),
    col=opt.color&&opt.color!=='#ffffff'?opt.color:null,big=crit||opt.big;
    pxImpact(e.x-Math.cos(a)*(e.r+12*e.s),e.y-Math.sin(a)*e.r*.4+6,hh,{a,size:(big?.95:.75)*(e.boss?1.1:1),ramp:col?rampFor(col):undefined,
      kind:Math.random()<.18&&!big?'ricochet':'hit',lamp:big});});
  pxlab('impact','Impact (hit)','Combat','sf',(x,y)=>pxImpact(x-24,y,30,{a:0,lamp:true}));
  pxlab('impact-ice','Impact (frost ramp)','Combat','sf',(x,y)=>pxImpact(x-24,y,30,{a:.1,ramp:FROST}));
  pxlab('ricochet','Ricochet','Combat','sf',(x,y)=>pxImpact(x-24,y,30,{a:.3,kind:'ricochet',size:.75}));
  return{pxImpact};})();
