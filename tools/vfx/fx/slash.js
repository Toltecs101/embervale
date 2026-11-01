/* SLASH (Sprite Fusion "Slash", MIT, ported; the thrust, the dash cut and the foe mark are original, in Sprite Fusion's style):
   a blade's cut drawn as light, white-hot edge to a fading tail. Every melee basic attack of the hero (the three-hit chains of the
   blademaster, shadowblade, dragoon, berserker and the lightwarden's hammer) cuts a pixel arc around the hero in the weapon's colour,
   the third hit (finisher) bigger and hotter; dash cuts (iaido, tempest, gale rush, sky split...) leave a straight pixel cut line.
   Recipe, Slash (SF timeline, one call is one cut; sweep .06 / hold .06 / trail .24 s for hits 1-2):
     0-sweep      the crescent smears out of nothing, head on outExpo 1 - 2^(-10 t/sweep), tail at the start; a light follows the head
                  (r 40 x size, C3, .5 x (1 - t/.3)).  .017 s an echo (radius 33/42, thickness 4.5/42 of the radius, ramp without C0).
     .6 x sweep   a four-point glint pops at the arc's end (arm 9 x size, outBack, gone by .22 s after it).
     sweep        the cut lands: 10 hot sparks off the end along the cut (+-.5 rad, 300-800 x speed, .12-.35 s, .45 g, drag 2.2,
                  bouncing x.45), 16 motes flung out off the last 70% of the arc (60-200, drag .6, .25-.55 s); shake .12 x size.
     sweep+hold   the tail slides after the head (smoothstep over trail), the crescent thins to 45% and steps down its ramp; the
                  white edge (outer 22% of the thickness) is gone at age .5; a 1 px C5 thread stays behind the tail, out by +.2 s.
     Crescent pixel step = round(q x (n-1) x .75 + age x 2.4 - v x .8 + .4) (q 0 edge -> 1 inner, v 0 tail -> 1 head), flat bands;
     thickness W x sin(pi v^2.2)^.6 (pointed both ends, thickest 3/4 toward the head); its last 40% toward the tail dithered (Bayer).
     Ramps (7 steps, cutting edge -> back): SF steel #ffffff #e8f1ff #b8c9e8 #62c8f4 #3a8bd8 #2c58aa #212f6b for plain steel,
     else a hand-made hue-shifted 7-step ramp from the class colour with the same HSV steps (C1 s.09 v1, C2 s.22 v.93, C3 s.6 v.97
     highlights leaning yellow (warm) or cyan/pink (cool), C4 s.75 v.87, C5 s.77 v.66 and C6 s.7 v.42 leaning crimson or indigo).
     Sparks: SF hot #fff3a6 #ffe26b #ff8a2a #f2561d.
   Embervale: arcs are ground ellipses around the hero at weapon height (16-20 art px above the feet), squashed by the camera
     (CAM.sp, ~.5), so an arc's param angle is the blow's ground angle a; hits 1/3 sweep forehand (behind -> around -> in front),
     hit 2 backhand on a steeper tilted plane. Layers: the arc's far half ('back', drawn behind the hero) and near half ('front')
     wrap the hero (canvas split). Radius 30 / 31 / 42 art px (sword), finisher: sweep .08 hold .08 trail .3, 5.4 rad spin, outer
     30% of the thickness white until age .62, brighter C1-C2, 16 sparks, a lamp. Axe and hammer finishers are SF's own overhead
     chop (screen plane, from -2.55 over the top to the ground in front, tilt -.3), daggers cut twice (.08 s apart, like the game's
     double hit) and carve an X on the finisher. Sparks fly at .55x SF speed (hero-sized arcs, not 320 px screens).
   Recipe, Cut (original): a straight line of light. Frame 1-2 (t <= 2/60) the head races on outExpo over .05 s; band 10 wu (5 px)
     thick, pointed both ends (sin(pi v^1.6)^.6, thickest near the head), white core (inner 34% while age < .5), ramp steps outward and
     with age, tail 40% dithered; .05 s lands: glint at the end, sparks along the cut, motes flung off both sides; hold .11 s
     (the iaido's damage lands at .16 s), then the line splits in two 1 px lines that drift apart 1 -> 3.5 px and dither out over
     trail + .15 s while the tail slides after the head (.26 s), leaving the C5 thread. Spear thrust = Cut with a bow wave: two mirrored
     SF crescents (r 7 px, squash .45) around the head, the dragoon's finisher three thrusts .07 s apart (the game's triple hit).
   Mark (original): a small SF slash (size .6, sweep .05) cut across a foe hit by cutFx (shadowstep, blade flurries, deathmarks). */
const {pxSlash,pxSlashThrust,pxSlashCut,pxSlashMark}=(function(){'use strict';const {Px,dot,bayer,Rng,mix,scale,hex,rgb,cl:clamp,smooth,outExpo,TAU,PXW:PX,WHITE}=PXK;
  const STEEL=['#ffffff','#e8f1ff','#b8c9e8','#62c8f4','#3a8bd8','#2c58aa','#212f6b'].map(hex),HOT=['#fff3a6','#ffe26b','#ff8a2a','#f2561d'].map(hex);
  const GRAVITY=1900,K={SPARK:0,MOTE:1};
  const outBack=(t,s=1.7)=>{const u=clamp(t)-1;return 1+(s+1)*u*u*u+s*u*u;};

  /* ---------- Sprite Fusion "Slash" (port). Embervale options: delay (s), wrap (draw the arc's far half on 'back', near half on
     'front'), edge / white (thickness fraction and age the white edge holds: the finisher's heat), speed (spark and mote speed),
     motes, echo:false, glow (sweeping light multiplier) ---------- */
  function slash(o={}){
    const S=o.size??1,F=o.facing??1,C=o.ramp??STEEL,R=new Rng(o.seed??1),sv=o.speed??1;
    const groundAt=x=>o.ground===undefined?Infinity:typeof o.ground==='number'?o.ground:o.ground(x);
    const ps=new Particles(groundAt,o.sparkRamp??HOT);
    const RA=((o.radius??84)*S)/PX,a0=o.from??-2.55,a1=o.to??.95,ang=a=>F<0?Math.PI-a:a;
    const A={cx:(o.x??690)/PX,cy:(o.y??530)/PX,R:RA,sy:o.squash??.6,rot:(o.tilt??-.38)*F,a0:ang(a0),a1:ang(a1),W:((o.width??24)*S)/PX,t0:0,sweep:o.sweep??.06,hold:o.hold??.06,trail:o.trail??.24,ramp:C,edge:o.edge??.22,white:o.white??.5,wrap:!!o.wrap};
    const E={...A,R:RA*(33/42),W:RA*(4.5/42),a0:ang(a0+(a1-a0)*.1),a1:ang(a1-(a1-a0)*(.15/3.5)),t0:.017,hold:A.hold*.5,trail:A.trail*(5/6),ramp:C.slice(1),edge:.22,white:.5};
    const end=slashEnd(A);
    let t=-(o.delay??0),landed=false;
    return{
      update(dt){t+=dt;
        if(!landed&&t>=A.sweep){landed=true;
          for(let i=0;i<(o.sparks??10);i++){const a=Math.atan2(end.dy,end.dx)+R.range(-.5,.5),sp=R.range(300,800)*sv;
            ps.spawn(K.SPARK,end.x*PX,end.y*PX,Math.cos(a)*sp,Math.sin(a)*sp,R.range(.12,.35));}
          shavings(ps,R,A,o.motes??16,C,sv);o.shake?.(.12*S);}
        ps.update(dt);},
      draw(f,layer){if(t<0)return;const back=layer==='back';if(back&&!A.wrap)return;
        const buf=new Px(f,f.color),light=back?null:new Lx(f,f.light),side=A.wrap?(back?-1:1):0;
        if(o.echo!==false)drawSlash(buf,light,E,t,side);
        drawSlash(buf,light,A,t,side);
        glint(buf,light,A,t,9*S,.22,C,side);
        if(back)return;
        if(t<.3){const [x,y]=onArc(A.cx,A.cy,A.R-4,A.sy,A.rot,A.a0+(A.a1-A.a0)*outExpo(t/A.sweep));light.glow(x,y,40*S,C[3],.5*(1-t/.3)*(o.glow??1));}
        ps.draw(buf,light);},
      done:()=>t>.5&&ps.list.length===0,
      age:()=>t};}
  function onArc(cx,cy,R,sy,rot,a){const lx=Math.cos(a)*R,ly=Math.sin(a)*R*sy,c=Math.cos(rot),s=Math.sin(rot);return[cx+lx*c-ly*s,cy+lx*s+ly*c];}
  /* side: 0 all, -1 only the far half of the ellipse (local y < 0), 1 only the near half */
  function crescent(buf,light,cx,cy,R,sy,rot,ta,L,W,ramp,age,edge,white,side){
    if(Math.abs(L)<.02||W<.3)return;
    const dir=Math.sign(L),span=Math.abs(L),c=Math.cos(rot),s=Math.sin(rot),n=ramp.length;
    const bx=Math.ceil(Math.hypot(R*c,R*sy*s)+2),by=Math.ceil(Math.hypot(R*s,R*sy*c)+2),Ro=(R+.5)*(R+.5),ri=Math.max(0,R-W-1),Ri=ri*ri;
    for(let py=Math.floor(cy-by);py<=Math.ceil(cy+by);py++){const dy=py+.5-cy;
      for(let px=Math.floor(cx-bx);px<=Math.ceil(cx+bx);px++){
        const dx=px+.5-cx,lx=dx*c+dy*s,ly=(-dx*s+dy*c)/sy,r2=lx*lx+ly*ly;
        if(r2>Ro||r2<Ri)continue;
        if(side&&(side<0?ly>=0:ly<0))continue;
        let u=(dir*(Math.atan2(ly,lx)-ta))%TAU;if(u<0)u+=TAU;if(u>span)continue;
        const v=u/span,w=W*Math.pow(Math.sin(Math.PI*Math.pow(v,2.2)),.6);if(w<.35)continue;
        const q=(R-Math.sqrt(r2))/w;if(q<0||q>1)continue;
        const f=Math.min(1,v/.4);if(f<1&&f<=bayer(px,py))continue;
        const ci=q<edge&&age<white?0:Math.round(q*(n-1)*.75+age*2.4-v*.8+.4);
        buf.set(px,py,ramp[Math.max(0,Math.min(n-1,ci))]);}}
    if(light)for(let u=0;u<=span;u+=.3){const [x,y]=onArc(cx,cy,R-W*.4,sy,rot,ta+dir*u);light.glow(x,y,5+W,ramp[2],.22*(1-age)*(u/span));}}
  function drawSlash(buf,light,s,t,side){
    const u=t-s.t0;if(u<0)return;
    const head=outExpo(u/s.sweep),tail=smooth(s.sweep+s.hold,s.sweep+s.hold+s.trail,u),span=s.a1-s.a0;
    const age=clamp(u/(s.sweep+s.hold+s.trail));
    if(tail<1)crescent(buf,light,s.cx,s.cy,s.R,s.sy,s.rot,s.a0+span*tail,span*(head-tail),s.W*(1-tail*.55),s.ramp,age,s.edge,s.white,side);
    const th=.7*(1-clamp((u-s.sweep-s.hold)/(s.trail+.2)));
    if(tail>.02&&th>0)for(let k=0;k<=tail;k+=.6/(Math.abs(span)*s.R)){const a=s.a0+span*k;if(side&&(Math.sin(a)<0)!==(side<0))continue;
      const [x,y]=onArc(s.cx,s.cy,s.R-.5,s.sy,s.rot,a);dot(buf,x,y,s.ramp[s.ramp.length-2],th*(.4+.6*k));}}
  function slashEnd(s){const [x,y]=onArc(s.cx,s.cy,s.R-s.W*.3,s.sy,s.rot,s.a1),[x2,y2]=onArc(s.cx,s.cy,s.R-s.W*.3,s.sy,s.rot,s.a1+Math.sign(s.a1-s.a0)*.05);
    const l=Math.hypot(x2-x,y2-y)||1;return{x,y,dx:(x2-x)/l,dy:(y2-y)/l};}
  function glint(buf,light,s,t,arm,life,C,side){const g=t-s.t0-s.sweep*.6;if(g<=0||g>=life)return;
    const e=slashEnd(s),k=arm*outBack(Math.min(1,g/.05))*(1-g/life);
    if(!side||(Math.sin(s.a1)<0)===(side<0))sparkle(buf,null,e.x,e.y,k,C[1],C[3]);if(light&&k>=1)light.glow(e.x,e.y,4+Math.round(k)*2,C[1],.6);}
  function shavings(ps,R,s,n,C,sv){
    for(let i=0;i<n;i++){const a=s.a0+(s.a1-s.a0)*R.range(.3,1),[x,y]=onArc(s.cx,s.cy,s.R,s.sy,s.rot,a);
      const ox=x-s.cx,oy=y-s.cy,l=Math.hypot(ox,oy)||1,sp=R.range(60,200)*sv;
      ps.spawn(K.MOTE,x*PX,y*PX,(ox/l)*sp,(oy/l)*sp-20,R.range(.25,.55),C[2+R.int(0,1)],.6);}}
  function sparkle(buf,light,x,y,arm,c,tip){const px=Math.round(x),py=Math.round(y),n=Math.round(arm);if(n<1)return;
    for(let d=1;d<=n;d++){const cc=d>n*.6?tip:c;buf.set(px+d,py,cc);buf.set(px-d,py,cc);buf.set(px,py+d,cc);buf.set(px,py-d,cc);}
    if(n>=3)for(const [dx,dy] of [[1,1],[1,-1],[-1,1],[-1,-1]])buf.set(px+dx,py+dy,c);
    if(n>=6)for(const [dx,dy] of [[2,2],[2,-2],[-2,2],[-2,-2]])buf.set(px+dx,py+dy,tip);
    buf.set(px,py,WHITE);if(light)light.glow(x,y,4+n*2,c,.6);}
  /* the light buffer's Px with Sprite Fusion's glow ((1 - d/r)^2 x k, additive) written straight into the array: same pixels, 3x cheaper */
  class Lx extends Px{glow(cx,cy,r,c,k){if(r<1||k<=.01)return;const W=this.w,D=this.data,ox=this.ox,oy=this.oy,ir=1/r,cr=c&255,cg=(c>>>8)&255,cb=(c>>>16)&255,
      x0=Math.max(ox,Math.floor(cx-r)),x1=Math.min(ox+W-1,Math.ceil(cx+r)),y0=Math.max(oy,Math.floor(cy-r)),y1=Math.min(oy+this.h-1,Math.ceil(cy+r));
    for(let y=y0;y<=y1;y++){const dy=(y+.5-cy)*ir,dy2=dy*dy;if(dy2>=1)continue;
      for(let x=x0,i=(y-oy)*W+(x0-ox);x<=x1;x++,i++){const dx=(x+.5-cx)*ir,d=dx*dx+dy2;if(d>=1)continue;const g=1-Math.sqrt(d),a=g*g*k,v=D[i];
        D[i]=((255<<24)|(Math.min(255,((v>>>16)&255)+cb*a)<<16)|(Math.min(255,((v>>>8)&255)+cg*a)<<8)|Math.min(255,(v&255)+cr*a))>>>0;}}}}
  class Particles{
    constructor(ground,sparks){this.list=[];this.ground=ground;this.sparks=sparks;}
    spawn(k,x,y,vx,vy,life,col=0,size=1){this.list.push({k,x,y,vx,vy,life,max:life,col,size});}
    update(dt){const L=this.list;
      for(let i=L.length-1;i>=0;i--){const p=L[i];if((p.life-=dt)<=0){L.splice(i,1);continue;}
        if(p.k===K.SPARK){p.vy+=GRAVITY*.45*dt;p.vx-=p.vx*2.2*dt;p.vy-=p.vy*2.2*dt;const g=this.ground(p.x),ny=p.y+p.vy*dt;p.x+=p.vx*dt;
          if(p.vy>0&&p.y<=g&&ny>=g){p.vy=-p.vy*.45;p.vx*=.7;p.y=g-.5;}else p.y=ny;}
        else{p.vx-=p.vx*.6*dt;p.vy-=p.vy*.6*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}}}
    draw(buf,light){
      for(const p of this.list){const k=p.life/p.max,ax=p.x/PX,ay=p.y/PX,px=Math.floor(ax),py=Math.floor(ay),sp=Math.hypot(p.vx,p.vy)||1,ux=p.vx/sp,uy=p.vy/sp;
        if(p.k===K.SPARK){const S=this.sparks,head=k>.6?S[0]:k>.3?S[1]:S[2],len=Math.min(9,1+sp*.011);
          buf.line(ax-ux*len,ay-uy*len,ax-ux*len*.4,ay-uy*len*.4,k>.5?head:S[S.length-1]);buf.line(ax-ux*len*.45,ay-uy*len*.45,ax,ay,head);light.glow(ax,ay,3,head,.45*k);}
        else{const len=Math.min(16,.5+sp*.013)*p.size;if(k<.35&&bayer(px,py)>k/.35)continue;
          buf.line(ax-ux*len,ay-uy*len,ax-ux*len*.35,ay-uy*len*.35,scale(p.col,.55));buf.line(ax-ux*len*.4,ay-uy*len*.4,ax,ay,p.col);light.glow(ax,ay,2.5+p.size,p.col,.4*k);}}}}

  /* ---------- CUT (original, in Sprite Fusion's style): a straight blade line of light from (x0, y0) to (x1, y1), world units.
     bow: a spear's bow wave around the head; split: the air parts in two drifting threads after the hold ---------- */
  function cut(o={}){
    const S=o.size??1,C=o.ramp??STEEL,R=new Rng(o.seed??1),sv=o.speed??1,n=C.length;
    const groundAt=x=>o.ground===undefined?Infinity:typeof o.ground==='number'?o.ground:o.ground(x);
    const ps=new Particles(groundAt,o.sparkRamp??HOT);
    const x0=o.x0/PX,y0=o.y0/PX,L=Math.max(1,Math.hypot(o.x1-o.x0,o.y1-o.y0)/PX),ux=(o.x1-o.x0)/PX/L,uy=(o.y1-o.y0)/PX/L,nx=-uy,ny=ux,A=Math.atan2(uy,ux);
    const W=((o.width??10)*S)/PX,sw=o.sweep??.05,hold=o.hold??.11,trail=o.trail??.26,bow=o.bow?7*S:0;
    let t=-(o.delay??0),landed=false;
    const at=d=>[x0+ux*d,y0+uy*d];
    return{
      update(dt){t+=dt;
        if(!landed&&t>=sw){landed=true;const [ex,ey]=at(L);
          for(let i=0;i<(o.sparks??10);i++){const a=A+R.range(-.45,.45),sp=R.range(300,800)*sv;ps.spawn(K.SPARK,ex*PX,ey*PX,Math.cos(a)*sp,Math.sin(a)*sp,R.range(.12,.35));}
          for(let i=0;i<(o.motes??12);i++){const d=L*R.range(.3,1),[x,y]=at(d),sd=R.chance(.5)?1:-1,sp=R.range(60,200)*sv;
            ps.spawn(K.MOTE,x*PX,y*PX,(nx*sd+ux*.4)*sp,(ny*sd+uy*.4)*sp-20,R.range(.25,.55),C[2+R.int(0,1)],.6);}
          o.shake?.(.12*S);}
        ps.update(dt);},
      draw(f,layer){if(t<0||layer==='back')return;const buf=new Px(f,f.color),light=new Lx(f,f.light);
        const hk=outExpo(t/sw),head=hk*L,tl=smooth(sw+hold,sw+hold+trail,t),tail=tl*head,age=clamp(t/(sw+hold+trail)),fr1=t<=2/60;
        /* the parting air: two 1 px threads drifting apart over the whole cut */
        if(o.split&&t>sw+hold){const s=clamp((t-sw-hold)/(trail+.15)),gap=1+2.5*outExpo(s),col=s<.4?C[2]:C[3];
          if(s<1)for(let d=0;d<=head;d+=.5){const k=d/Math.max(1,head),[x,y]=at(d);for(const sd of [-1,1])dot(buf,x+nx*gap*sd,y+ny*gap*sd,col,(1-s)*(.45+.55*k));}}
        /* the thread the tail leaves */
        const th=.7*(1-clamp((t-sw-hold)/(trail+.2)));
        if(tail>.5&&th>0)for(let d=0;d<=tail;d+=.6){const [x,y]=at(d);dot(buf,x,y,C[n-2],th*(.4+.6*d/tail));}
        /* the band */
        if(tl<1&&head-tail>.5){const span=head-tail,w0=W*(1-tl*.55)*(fr1?1.25:1);
          for(let d=0;d<=span;d+=.5){const v=d/span,hw=.5*w0*Math.pow(Math.sin(Math.PI*Math.pow(v,1.6)),.6);if(hw<.3)continue;
            const [x,y]=at(tail+d),f=Math.min(1,v/.4);
            for(let q=-hw;q<=hw;q+=.5){const qq=Math.abs(q)/hw,X=x+nx*q,Y=y+ny*q,ix=Math.floor(X),iy=Math.floor(Y);if(f<1&&f<=bayer(ix,iy))continue;
              const ci=fr1||(qq<.34&&age<.5)?0:Math.round(qq*(n-1)*.6+age*2.4-v*.8+.5);buf.set(ix,iy,C[Math.max(0,Math.min(n-1,ci))]);}}
          for(let d=0;d<=span;d+=6){const [x,y]=at(tail+d);light.glow(x,y,4+W,C[2],.3*(1-age)*(d/span));}}
        /* the spear's bow wave: two mirrored crescents around the head, thinning as it ages */
        if(bow&&t<sw+hold+trail*.6){const k=clamp((t-sw-hold)/(trail*.6)),r=bow*(.6+.4*outBack(Math.min(1,t/.05))),[hx,hy]=at(head),sy=.45,
            cx=hx-ux*r*sy*.6,cy=hy-uy*r*sy*.6,wb=Math.max(.4,r*.45*(1-k*.7));
          crescent(buf,light,cx,cy,r,sy,A+Math.PI/2,-Math.PI/2-1.25,1.25,wb,C,age,.3,.5,0);crescent(buf,light,cx,cy,r,sy,A+Math.PI/2,-Math.PI/2+1.25,-1.25,wb,C,age,.3,.5,0);}
        /* the glint where the cut ends, and the light riding the head */
        const g=t-sw*.6;if(g>0&&g<.22){const [ex,ey]=at(L);sparkle(buf,light,ex,ey,(o.arm??8)*S*outBack(Math.min(1,g/.05))*(1-g/.22),C[1],C[3]);}
        if(t<.3){const [x,y]=at(head);light.glow(x,y,30*S,C[3],.5*(1-t/.3)*(o.glow??1));}
        ps.draw(buf,light);},
      done:()=>t>sw+hold+trail+.2&&ps.list.length===0};}

  /* ---------- Embervale ---------- */
  /* a 7-step blade ramp from a class colour ([r,g,b] 0..1): SF's steel for plain steel, else SF steel's own HSV steps on the colour's hue */
  const RAMPS=new Map();
  function hsv(c){const [r,g,b]=c,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d>0){h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h/=6;if(h<0)h+=1;}return[h,mx>0?d/mx:0,mx];}
  const hv=(H,S,V)=>{H=((H%1)+1)%1;const f=n=>{const k=(n+H*6)%6;return V-V*S*Math.max(0,Math.min(k,4-k,1));};return rgb(f(5)*255,f(3)*255,f(1)*255);};
  const tw=(a,b,k)=>{let d=b-a;if(d>.5)d-=1;if(d<-.5)d+=1;return a+d*k;};
  function bladeRamp(c){if(typeof c==='string')c=[parseInt(c.slice(1,3),16)/255,parseInt(c.slice(3,5),16)/255,parseInt(c.slice(5,7),16)/255];
    c=c||[.9,.95,1];const key=c.map(v=>v.toFixed(3)).join();let r=RAMPS.get(key);if(r)return r;const [h,s]=hsv(c);
    if(s<.16)r=STEEL;else{const warm=h<.2||h>.9,hi=warm?1/6:h<.68?.5:.9,lo=warm?.98:.7;
      r=[WHITE,hv(tw(h,hi,.15),.09,1),hv(tw(h,hi,.05),.22,.93),hv(tw(h,hi,.18),.6,.97),hv(h,.75,.87),hv(tw(h,lo,.25),.77,.66),hv(tw(h,lo,.45),.7,.42)];}
    RAMPS.set(key,r);return r;}
  /* the finisher's heat: every step one notch brighter, so the white edge and the pale bands read thicker */
  const hotOf=C=>[C[0],mix(C[1],WHITE,.5),mix(C[2],C[1],.5),mix(C[3],C[2],.3),C[3],C[4],C[5]];
  const camSp=()=>clamp(CAM&&CAM.sp||.45,.3,.8);
  const lite=()=>!!(PERF&&PERF.lite);
  let seed=1;
  /* combo moves per weapon and chain step, in art px: R radius, W width x SF's (24 x size), h centre height above the feet, off
     centre pushed along the blow, sq squash x the camera's, tilt (x facing), span (rad), dir 1 forehand / -1 backhand, wrap: a ground
     ellipse around the hero, else Sprite Fusion's screen-plane arc (from, to, sq absolute) placed in front. d: delay (s) */
  const MOVES={
    blade:[[{R:25,W:1,h:16,off:3,sq:1,tilt:.22,span:3.4,dir:1,wrap:1}],
           [{R:26,W:1,h:18,off:3,sq:1.45,tilt:-.5,span:3.2,dir:-1,wrap:1}],
           [{R:34,W:1.1,h:15,off:2,sq:1,tilt:.1,span:5.4,dir:1,wrap:1,fin:1}]],
    dagger:[[{R:20,W:.95,h:15,off:4,sq:1,tilt:.28,span:3,dir:1,wrap:1,quick:1},{R:19,W:.95,h:18,off:5,sq:1.5,tilt:-.45,span:2.8,dir:-1,wrap:1,quick:1,d:.08}],
            [{R:19,W:.95,h:18,off:5,sq:1.5,tilt:-.45,span:2.9,dir:-1,wrap:1,quick:1},{R:21,W:.95,h:15,off:4,sq:1,tilt:.3,span:3,dir:1,wrap:1,quick:1,d:.08}],
            [{R:26,W:1,h:18,off:12,sq:.32,tilt:.72,from:-2.85,to:-.2,quick:1,fin:1},{R:26,W:1,h:18,off:12,sq:.32,tilt:-.72,from:-.25,to:-2.9,quick:1,fin:1,d:.07,alt:1}]],
    axe:[[{R:28,W:1.3,h:15,off:3,sq:1,tilt:.28,span:3.6,dir:1,wrap:1}],
         [{R:28,W:1.3,h:17,off:3,sq:1.4,tilt:-.5,span:3.4,dir:-1,wrap:1}],
         [{R:36,W:1.35,h:19,off:10,sq:.65,tilt:-.3,from:-2.65,to:1.2,fin:1,chop:1}]],
    hammer:[[{R:24,W:1.5,h:16,off:3,sq:1,tilt:.25,span:3.1,dir:1,wrap:1,heavy:1}],
            [{R:25,W:1.5,h:18,off:3,sq:1.4,tilt:-.45,span:3,dir:-1,wrap:1,heavy:1}],
            [{R:33,W:1.55,h:17,off:9,sq:.7,tilt:-.25,from:-2.5,to:1.25,fin:1,chop:1,heavy:1}]]};
  const KIND={blademaster:'blade',shadowblade:'dagger',berserker:'axe',lightwarden:'hammer'};
  /* one hit of a chain: every move of the step becomes one SF slash in a single canvas that follows the hero */
  function pxSlash(p,a,st,col,kind){if(!p)return null;st=clamp(st|0,0,2);kind=MOVES[kind]?kind:KIND[p.cls&&p.cls.id]||'blade';
    const list=MOVES[kind][st],fin=st===2,C0=bladeRamp(col),C=fin?hotOf(C0):C0,Calt=kind==='dagger'?bladeRamp([1,.6,.85]):null,sp=camSp(),
      F=Math.cos(a)<-.2?-1:Math.cos(a)>.2?1:(p.face<0?-1:1),lt=lite(),w=fin?176:144,hh=fin?104:96,ay=hh-20;
    return pxfx(c=>{const cuts=list.map((m,i)=>{const S=m.R/42,ox=(m.off||0)*Math.cos(a),oy=(m.off||0)*Math.sin(a)*sp;
        let from,to,tilt,sq,facing=1;
        if(m.wrap){const s=m.dir*F,hs=m.span/2;from=a-s*hs;to=a+s*hs;tilt=m.tilt*F;sq=Math.min(.95,sp*m.sq);}
        else{facing=F;from=m.from;to=m.to;tilt=m.tilt;sq=m.sq;}
        return slash({x:c.x+ox*PX,y:c.y-(m.h-oy)*PX,size:S,squash:sq,tilt,from,to,facing,wrap:!!m.wrap,width:24*(m.W||1),delay:m.d||0,seed:seed++,
          ramp:m.alt?hotOf(Calt):C,sweep:m.fin?(m.quick?.05:.08):m.heavy?.075:m.quick?.045:.06,hold:m.fin?(m.quick?.06:.08):m.heavy?.07:m.quick?.04:.06,trail:m.fin?.3:m.quick?.2:.24,
          edge:m.fin?.3:.22,white:m.fin?.62:.5,sparks:Math.round((m.fin?16:m.quick?6:10)*(lt?.5:1)),motes:Math.round((m.fin?20:m.quick?10:16)*(lt?.5:1)),
          speed:m.chop?.55:.5,ground:c.y+(m.chop?0:6*PX),echo:!lt||m.fin,glow:lt?.6:1,shake:tr=>PXK.shake(tr*(m.fin?.7:.25))});});
      return{update(dt){for(const f of cuts)f.update(dt);},draw(fr,layer){for(const f of cuts)f.draw(fr,layer);},done:()=>cuts.every(f=>f.done()),
        lamp:fin?()=>{const t=cuts[0].age(),k=t<0?0:Math.exp(-t/.12);return k>.05?{i:.9*k,c:[(C[3]&255)/255,((C[3]>>>8)&255)/255,((C[3]>>>16)&255)/255],r:150,h:20}:null;}:undefined};},
      {follow:p,w,hh,ay,split:true,pri:fin?2:1,lamp:fin&&!lt,ttl:2});}
  /* the dragoon's thrust: a Cut with a bow wave from the hero's hands along the blow, at weapon height; the finisher thrusts three times */
  function pxSlashThrust(p,a,st,col,reach){if(!p)return null;st=clamp(st|0,0,2);const fin=st===2,sp=camSp(),C0=bladeRamp(col||[.75,.9,1]),lt=lite(),
      L=(reach||[130,138,170][st])/PIX,w=208,hh=112,ay=72,ax=Math.round(104-Math.cos(a)*44);
    return pxfx(c=>{const list=(fin?[[0,0,1],[.07,.07,.9],[.14,-.07,1.12]]:[[0,0,1]]).map(([d,da,lk],i)=>{const ca=Math.cos(a+da),sa=Math.sin(a+da)*sp,
        sx=c.x+ca*6*PX,sy=c.y-15*PX+sa*6*PX,len=L*lk*PX;
        return cut({x0:sx,y0:sy,x1:sx+ca*len,y1:sy+sa*len,size:fin&&i===2?1.3:1,width:fin?12:9,bow:true,ramp:fin&&i===2?hotOf(C0):C0,sweep:.045,hold:.05,trail:.2,
          sparks:Math.round((fin&&i===2?14:7)*(lt?.5:1)),motes:Math.round(8*(lt?.5:1)),speed:.5,arm:fin&&i===2?9:6,delay:d,seed:seed++,ground:c.y+6*PX,glow:lt?.5:1,
          shake:tr=>PXK.shake(tr*(fin&&i===2?.6:.2))});});
      return{update(dt){for(const f of list)f.update(dt);},draw(fr,layer){for(const f of list)f.draw(fr,layer);},done:()=>list.every(f=>f.done())};},
      {follow:p,w,hh,ax,ay,pri:fin?2:1,ttl:2});}
  /* a dash cut between two ground points, at the game's cut height (26 wu) */
  function pxSlashCut(x0,y0,x1,y1,col,o={}){const sp=camSp(),dx=Math.abs(x1-x0)/PIX,dy=Math.abs(y1-y0)*sp/PIX,M=26,lt=lite(),
      w=Math.min(512,Math.ceil(dx+2*M)),hh=Math.min(400,Math.ceil(dy+2*M+24)),C=bladeRamp(col||[.92,.82,1]);
    return pxfx(c=>{const H=c.handle,[ax,ay]=pxProj(H,x0,26,y0),[bx,by]=pxProj(H,x1,26,y1);
      return cut({x0:ax,y0:ay,x1:bx,y1:by,width:10,split:true,ramp:C,sweep:.05,hold:.11,trail:.26,sparks:lt?5:10,motes:lt?6:14,speed:.6,arm:9,
        delay:-(o.t||0),seed:seed++,ground:c.y+10*PX,glow:lt?.5:1,shake:o.shake===false?undefined:tr=>PXK.shake(tr*.3)});},
      {x:(x0+x1)/2,y:(y0+y1)/2,w,hh,ay:Math.round(hh/2+10),pri:1,ttl:2});}
  /* a quick SF slash across a foe (cutFx): screen-plane, random tilt, at the foe's middle */
  const marks=[];
  function pxSlashMark(x,y,a,col,o={}){const now=gameTime;while(marks.length&&now-marks[0]>.5)marks.shift();if(marks.length>=6)return null;marks.push(now);
    const F=Math.cos(a)<0?-1:1,C=bladeRamp(col||[.85,.7,1]),r=new Rng(seed*7+3);
    return pxfx(c=>slash({x:c.x,y:c.y-(o.h??20)*PX,size:o.size??.6,squash:.5,tilt:-.38+r.range(-.5,.5),facing:F,ramp:C,sweep:.05,hold:.04,trail:.18,
      sparks:lite()?3:6,motes:lite()?4:8,speed:.5,ground:c.y,seed:seed++,glow:.7}),{x,y,w:112,hh:96,ay:80,pri:1,ttl:2});}

  /* ---------- wiring ---------- */
  /* smearFx is the one place every melee basic attack (blademaster slash, lightwarden hammer, shadowblade twin fangs, berserker
     cleave) draws its smear: the pixel arc rides on top of it, in the colour the game passes (the blademaster's is his weapon's) */
  {const o=smearFx;smearFx=function(p,a,st,c){const r=o(p,a,st,c);try{if(p&&p===P)pxSlash(p,a,st,c||wcol,KIND[p.cls&&p.cls.id]||'blade');}catch(e){console.error(e);}return r;};}
  /* the dragoon's lance thrust has no smear: wrap the ability itself (the step is the chain's, set by comboStep inside it) */
  {const o=ABIL.thrust;ABIL.thrust=function(p,i,a,ab){const r=o(p,i,a,ab);try{if(p&&p===P&&a)pxSlashThrust(p,a.a,p.combo|0,[.75,.9,1],[130,138,170][p.combo|0]);}catch(e){console.error(e);}return r;};}
  /* dash cuts: every hero 'cut' fx (iaido, tempest, gale rush, sky split, the nyx cuts) gets its pixel line once, aged like the fx */
  onEv('update',()=>{if(!P||!G.fx)return;for(let i=fxs.length-1;i>=0;i--){const f=fxs[i];if(f.type!=='cut'||f.pxs)continue;f.pxs=1;
    try{pxSlashCut(f.x0,f.y0,f.x1,f.y1,f.c,{t:f.t||0});}catch(e){console.error(e);}}});
  /* cutFx: a cut that lands on a foe (shadowstep, blade flurries, deathmarks) */
  {const o=cutFx;cutFx=function(x,y,a,c){const r=o(x,y,a,c);try{pxSlashMark(x,y,a,c);}catch(e){console.error(e);}return r;};}

  /* ---------- lab ---------- */
  const pose=(st,a)=>{if(!P)return;P.ang=a;P.face=Math.cos(a)<0?-1:1;P.anim=['atk','atk2','atk3'][st];P.swing=P.swingMax=[.24,.26,.34][st];};
  const hit=(kind,st,col)=>()=>{pose(st,P.face<0?Math.PI:0);pxSlash(P,P.ang,st,col,kind);};
  pxlab('slash-blade1','Blade arc: hit 1','Combat','sf',hit('blade',0,[.9,.95,1]));
  pxlab('slash-blade2','Blade arc: hit 2 (backhand)','Combat','sf',hit('blade',1,[.9,.95,1]));
  pxlab('slash-blade3','Blade arc: finisher','Combat','sf',hit('blade',2,[.9,.95,1]));
  pxlab('slash-combo','Blade combo (3 hits)','Combat','sf',()=>{hit('blade',0,[.9,.95,1])();later(.3,hit('blade',1,[.9,.95,1]));later(.62,hit('blade',2,[.9,.95,1]));});
  pxlab('slash-dagger1','Twin fangs (shadowblade)','Combat','sf',hit('dagger',0,[.85,.7,1]));
  pxlab('slash-dagger3','Twin fangs X finisher','Combat','sf',hit('dagger',2,[.85,.7,1]));
  pxlab('slash-axe1','Cleave arc (berserker)','Combat','sf',hit('axe',0,[1,.6,.45]));
  pxlab('slash-axe3','Overhead chop (berserker)','Combat','sf',hit('axe',2,[1,.6,.45]));
  pxlab('slash-hammer1','Hammer arc (lightwarden)','Combat','sf',hit('hammer',0,[1,.92,.6]));
  pxlab('slash-hammer3','Hammer slam (lightwarden)','Combat','sf',hit('hammer',2,[1,.92,.6]));
  pxlab('slash-thrust1','Lance thrust (dragoon)','Combat','orig',()=>{pose(0,0);pxSlashThrust(P,0,0,[.75,.9,1]);});
  pxlab('slash-thrust3','Triple thrust (dragoon)','Combat','orig',()=>{pose(2,0);pxSlashThrust(P,0,2,[.75,.9,1]);});
  pxlab('slash-cut','Iaido dash cut','Combat','orig',()=>pxSlashCut(P.x-150,P.y+6,P.x+190,P.y-14,[.92,.82,1]));
  pxlab('slash-cut-gale','Gale rush cut','Combat','orig',()=>pxSlashCut(P.x-60,P.y+70,P.x+200,P.y-50,[.6,1,.8]));
  pxlab('slash-mark','Cut across a foe','Combat','orig',(x,y)=>pxSlashMark(x,y,.4,[.85,.7,1]));
  return{pxSlash,pxSlashThrust,pxSlashCut,pxSlashMark};})();
