/* EXPLOSION (Sprite Fusion "Explosion", MIT, ported; scorch decal, fire pillar jet, Shadowflare and meteor fall original, in Sprite Fusion's style):
   the pixel layer over every blast of the game. A white-hot flash, a fireball cooling into smoke, earth and rock chunks thrown in arcs,
   dust rolling out, sparks, embers and burning brands that light little ground fires; a shockwave racing along the floor and a scorch
   decal that cools from a glowing rim to soot. Wired to pxBoom (meteors, Hunter traps, pyro Cataclysm meteors, ember procs, Varkhul's
   meteors, Dragonfall), pxElem 'fire' (firePillar: Cataclysm, Supernova, merged into the meteor's own blast) and the Violet Star's
   Shadowflare (violet ramp, star glints). Falling meteors get a pixel rock with a flame trail until they land.
   Recipe (size S = clamp(blast radius / 86, .75, 1.8); radius RAD = 36 S effect units = 18 S art px):
   - Timeline: all spawned at the call, then physics and lifetimes. 0-0.06 s flash disc (r = 1.05 RAD/2 art px, shrinking to 80 %,
     #f2561d rim / #fff3a6 disc / white core, after 0.033 s #ffe26b / #fff3a6); white light 0.08 s, warm light 0.7 s (k^2).
     0-0.22 s an orange air ring 0.3 -> 1.6 RAD, 0-0.34 s a yellow one 0.45 -> 2.7 RAD (ease-out cubic, dithered out).
     0-0.5 s the shockwave on the ground, 0 -> blast radius + 14 units, one colour per 0.1 s: white, #fff3a6, #ff8a2a, stone light, body.
     0-0.3 s 5 core flames; 0.55-1.15 s round(28 power fire) fireball flames fly out and rise; column flames 0.8-1.3 s; sparks 0.18-0.7 s;
     embers 1.2-3.2 s; earth 0-2.2 s; chunks 2.4-3.2 s (dither out over the last 0.5 s); smoke up to 3 s; brands light ground fires
     2.2-4.5 s. Scorch: opens in 0.08 s white-hot, core cools over 1.2 + RAD/28 s, the rim and its cracks glow ~1.4x longer, then soot,
     dithered away over the last 1.3 s of 4 s.
   - Layers: 'flat' decals on the ground (scorch, pri 0, nolight; shockwave, nolight) under one 'bill' canvas standing 0.3 r in front of
     the blast centre (so the fireball engulfs what stands in it): back = smoke, dust, ground fires; front = chunks, flames, sparks,
     embers, grit, brands, flash, air rings. Light buffer: (1 - d/r)^2 k glows (flames r 2.4 r + 2, .18 k; sparks r 3; embers r 3;
     brands r 7; white and warm lights, the warm one capped at 64 px). lamp: warm, i 1.5 k^2 + white pop.
   - Palette: fire ramp #ffffff #fff3a6 #ffe26b #ffc23d #ff8a2a #f2561d #c9281f #8a1f17 #4a1712 (flame step floor(age^.62 * 8), rim two
     steps darker, highlight one step lighter, last steps alpha discs); heat ramp = first 8 + #4f1a13 #2a120e; soot #0d0a12 / #17121d;
     smoke #7b6f72 #5d5660 #433d48 #2b2630 #1a171e; stone from the zone's ground (light x1.35 +8 % white, shade x.64, dust x1.2 30 % to
     #968c96), outline #1a1422. Shadowflare: violet ramp #ffffff #fff0fb #ffc8f8 #ff9af0 #e46ae6 #b04ad6 #7a32b4 #4a1f7a #26123f.
   - Shapes and motion (SF numbers, effect units, g = 1900): flames stacked discs, rise 190/s^2, drag 5 x / 3.2 y; sparks 2-segment
     streaks, .45 g, drag 2.2, bounce x.45; grit (earth RAD 2.6, 45 % 2x2 clods) in a V within .5 rad of vertical; dust column
     round(earth 12) big puffs; rolling dust round(RAD/2) puffs; chunks 26 min(1.5, S), outlined, split light/body/shade by spin, bounce
     x.32; blast push 720 power within 2.6 RAD. Embervale: vertical throws x th / sqrt(max(1, S)) so heights grow with S, not S^2;
     everything that reaches the canvas sides or top is dithered / faded out before the edge.
   - Feel: one shake 0.6 min(1.3, sqrt S) (x0.35: the game's boomFx shakes too). Originals: the pillar jet throws flames up for 0.75 s;
     Shadowflare adds 4-point star glints; meteors drop a molten rock with a bow-shock crescent and a flame and smoke trail. */
const {pxExplosion,pxExplosionPillar,pxExplosionFlare,pxExplosionScorch,pxExplosionMeteor}=(function(){'use strict';
  const {Px:PxBase,dot,bayer,Rng,mix,scale,ramp,hex,rgb,cl:clamp,TAU,PXW:PX,hash,noise2,WHITE}=PXK;
  /* Sprite Fusion's Px, plus its ring() and an edge factor (0 at the canvas sides/top, 1 inside) so nothing is cut by the canvas.
     alphaDisc and glow give the same pixels as Sprite Fusion's, walked as clipped row spans with the blend/add inlined (smoke and
     glows are 70 % of an explosion's raster time) */
  class Px extends PxBase{
    alphaDisc(cx,cy,r,c,a){if(a<=.01)return;const D=this.data,W=this.w,ox=this.ox,oy=this.oy,r2=r*r,cr=c&255,cg=(c>>>8)&255,cb=(c>>>16)&255,xm=ox+W-1,E=(((a*255)<<24)|(cb<<16)|(cg<<8)|cr)>>>0;
      const y0=Math.max(Math.floor(cy-r),oy),y1=Math.min(Math.ceil(cy+r),oy+this.h-1);
      for(let y=y0;y<=y1;y++){const dy=y+.5-cy,s=r2-dy*dy;if(s<0)continue;const hw=Math.sqrt(s);let x0=Math.ceil(cx-hw-.5),x1=Math.floor(cx+hw-.5);if(x0<ox)x0=ox;if(x1>xm)x1=xm;
        for(let x=x0,i=(y-oy)*W+(x0-ox);x<=x1;x++,i++){const d=D[i];if(d<0x1000000){D[i]=E;continue;}const oa=a+((d>>>24)/255)*(1-a),k=a/oa,j=1-k;
          D[i]=(((oa*255)<<24)|(((cb*k+((d>>>16)&255)*j)&255)<<16)|(((cg*k+((d>>>8)&255)*j)&255)<<8)|((cr*k+(d&255)*j)&255))>>>0;}}}
    glow(cx,cy,r,c,k){if(r<1||k<=.01)return;const D=this.data,W=this.w,ox=this.ox,oy=this.oy,ir=1/r,cr=(c&255)*k,cg=((c>>>8)&255)*k,cb=((c>>>16)&255)*k;
      const X0=Math.max(ox,Math.floor(cx-r)),X1=Math.min(ox+W-1,Math.ceil(cx+r)),y0=Math.max(oy,Math.floor(cy-r)),y1=Math.min(oy+this.h-1,Math.ceil(cy+r));
      for(let y=y0;y<=y1;y++){const dy=(y+.5-cy)*ir,dy2=dy*dy;if(dy2>=1)continue;const hw=r*Math.sqrt(1-dy2);let x0=Math.floor(cx-hw-.5),x1=Math.ceil(cx+hw-.5);if(x0<X0)x0=X0;if(x1>X1)x1=X1;
        for(let x=x0,i=(y-oy)*W+(x0-ox);x<=x1;x++,i++){const dx=(x+.5-cx)*ir,d=dx*dx+dy2;if(d>=1)continue;let f=1-Math.sqrt(d);f*=f;const v=D[i],R=(v&255)+cr*f,G=((v>>>8)&255)+cg*f,B=((v>>>16)&255)+cb*f;
          D[i]=(0xff000000|((B>255?255:B)<<16)|((G>255?255:G)<<8)|(R>255?255:R))>>>0;}}}
    ring(cx,cy,r,thick,c,alpha=1){const ro=r+thick*.5,ri=Math.max(0,r-thick*.5),ro2=ro*ro,ri2=ri*ri;
      for(let y=Math.floor(cy-ro);y<=Math.ceil(cy+ro);y++){const dy=y+.5-cy;for(let x=Math.floor(cx-ro);x<=Math.ceil(cx+ro);x++){const dx=x+.5-cx,d2=dx*dx+dy*dy;
        if(d2<=ro2&&d2>=ri2&&(alpha>=1||alpha>bayer(x,y)))this.set(x,y,c);}}}
    edge(x,y,r,m){return clamp((Math.min(x-this.ox,this.ox+this.w-x,y-this.oy)-r)/m);}
  }
  const OUTLINE=hex('#1a1422'),SOOT=hex('#0d0a12'),SOOT2=hex('#17121d'),WARM=rgb(255,176,96),BLACK_SMOKE=rgb(34,29,38);
  const FIRE_RAMP=['#ffffff','#fff3a6','#ffe26b','#ffc23d','#ff8a2a','#f2561d','#c9281f','#8a1f17','#4a1712'].map(hex);
  const VIOLET_RAMP=['#ffffff','#fff0fb','#ffc8f8','#ff9af0','#e46ae6','#b04ad6','#7a32b4','#4a1f7a','#26123f'].map(hex);
  const HEAT_RAMP=[...FIRE_RAMP.slice(0,8),hex('#4f1a13'),hex('#2a120e')],VHEAT_RAMP=[...VIOLET_RAMP.slice(0,8),hex('#2e1640'),hex('#1a0e26')];
  const SMOKE_RAMP=['#7b6f72','#5d5660','#433d48','#2b2630','#1a171e'].map(hex);
  const palOf=F=>({hot:F[1],yellow:F[2],gold:F[3],orange:F[4],deepOrange:F[5],red:F[6]});
  const STONE_BODY=hex('#4a3f69'),MAGMA={light:hex('#5e4a52'),body:hex('#3b2c33'),shade:hex('#241a22'),dust:hex('#5a4e52')};
  function stone(c){return{light:mix(scale(c,1.35),WHITE,.08),body:c,shade:scale(c,.64),dust:mix(scale(c,1.2),rgb(150,140,150),.3)};}
  const GRAVITY=1900,PT={SPARK:0,EMBER:1,SMOKE:2,FIRE:3,BRAND:4,DUST:5,GRIT:6,STAR:7},SMOKES=1,BIG=2,BACK=4;
  const outCubic=t=>1-Math.pow(1-clamp(t),3);

  /* ---------- Sprite Fusion "Explosion" (the bill canvas: fireball, earth, chunks, sparks, smoke) ---------- */
  function explosion(o={}){
    const S=o.size??1,RAD=36*S,POWER=.9*Math.pow(S,.8),EARTH=o.earth??1.6,Q=o.detail??1,TH=(o.throw??1)/Math.sqrt(Math.max(1,S));
    const F=o.ramp??FIRE_RAMP,PAL=palOf(F),R=new Rng(o.seed??1);
    const gr=o.ground??o.y??600,groundAt=x=>typeof gr==='number'?gr:gr(x);
    const X=o.x??770,G=o.base??groundAt(X),Y=o.y??G;
    const ps=new Particles(R,groundAt,F,PAL),fx=new Fx(ps,F,PAL,o.warm??WARM),rocks=new Bits(groundAt);
    const ST=stone(o.surface??STONE_BODY),MOLT=o.molten??0;
    let t=0;
    fx.explosion(X,Math.min(Y,G-RAD*.3),RAD,POWER,o.fire??.3,{q:Q,th:TH,spark:o.spark??1,brands:o.brands??1,column:o.column??1,stars:o.stars??0,smoke:o.smoke??1,black:o.black});
    o.shake?.(.6*Math.min(1.3,Math.sqrt(S)));
    for(let i=0;i<Math.round(RAD*.5*Q*(o.roll??1));i++){const s=R.sign();
      ps.spawn(PT.SMOKE,X+s*R.range(0,RAD*.6),G-R.range(2,10+RAD*.08),s*R.range(3,9.5)*RAD*(o.rollV??1),-R.range(4,30),R.range(1.1,2.2)+RAD/80,ST.dust,R.range(4,7)+RAD/12,R.range(0,.06),BIG);}
    for(let i=0;i<(o.chunks??26)*Math.min(1.5,S)*Q;i++)rocks.add(X+R.range(-.4,.4)*RAD,G-6,R.range(-9,9)*RAD*.4,-R.range(7,16)*RAD*1.5*TH,R.range(1.8,2.6)+RAD/60,R.range(0,TAU),R.range(-16,16),R.int(1,3),R.chance(MOLT));
    for(let i=0;i<Math.round(EARTH*RAD*2.6*Q);i++){const u=R.range(-1,1),a=-Math.PI/2+u*.5,sp=R.range(6,19)*RAD*(1-.45*Math.abs(u))*TH;
      ps.spawn(PT.GRIT,X+u*.25*RAD,G-2,Math.cos(a)*sp,Math.sin(a)*sp,R.range(1.2,2.2),R.pick([ST.light,ST.body,ST.body,ST.shade]),R.chance(.45)?2:1);}
    for(let i=0;i<Math.round(EARTH*12*Q);i++)ps.spawn(PT.SMOKE,X+R.range(-.3,.3)*RAD,G-R.range(4,RAD*.6),R.range(-30,30),-R.range(120,380)*Math.sqrt(S)*EARTH*.6*TH,R.range(1.6,2.8),ST.dust,R.range(5,9)*Math.sqrt(S)+RAD/14,R.range(0,.15),BIG);
    return{
      update(dt){t+=dt;rocks.step(dt,(b,sp)=>sp>200&&fx.dust(b.x,b.y,3,.6,ST.body));fx.update(dt);ps.update(dt);},
      draw(fr,layer){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light);
        if(layer!=='front'){ps.draw(buf,light,'back');fx.drawBack(buf,light);}
        if(layer!=='back'){for(const b of rocks.list)rock(buf,light,b,b.m?MAGMA:ST,PAL);ps.draw(buf,light,'front');fx.drawFront(buf,light);}},
      done:()=>t>1&&ps.list.length===0&&!fx.busy&&rocks.list.length===0,
      /* the pillar: a jet of flames thrown up from the heart (original, the way Sprite Fusion's ground fires feed flames) */
      jet(power,life){fx.jet(X,G-2,life??.75,power,RAD/PX,Q);},
      lamp(){let i=0,c=fx.warm;for(const l of fx.lights){const k=l.life/l.max;i+=(l.color===WHITE?.9:1.5)*k*k;}for(const j of fx.jets)i+=.7*j.power*Math.min(1,j.life/j.max*2);
        return i>.03?{i,c:[(c&255)/255,((c>>>8)&255)/255,((c>>>16)&255)/255],r:o.lampR??220,h:o.lampH??40}:null;}};}
  function rock(buf,light,b,st,PAL){
    const x=b.x/PX,y=b.y/PX,r=.6+b.s*.75,fade=Math.min(1,b.life/.5),lx=Math.cos(b.a)*r*.4,ly=Math.sin(b.a)*r*.4;
    /* a molten chunk (meteor rock): its lit side steps from yellow through orange and red to stone over 1.4 s, and glows */
    const heat=b.m?clamp(1-b.age/1.4):0,lit=heat>.66?PAL.yellow:heat>.33?PAL.orange:heat>0?PAL.red:st.light;
    for(let py=Math.floor(y-r-1);py<=Math.ceil(y+r+1);py++)for(let px=Math.floor(x-r-1);px<=Math.ceil(x+r+1);px++){
      const dx=px+.5-x,dy=py+.5-y,d=Math.sqrt(dx*dx*1.3225+dy*dy);
      if(d>r+.9||(fade<1&&fade<=bayer(px,py)))continue;
      const l=dx*lx+dy*ly;buf.set(px,py,d>r?OUTLINE:l<-.4?lit:l>.6?st.shade:st.body);}
    if(heat>0)light.glow(x,y,3+r,PAL.orange,.3*heat);}

  class Particles{
    constructor(R,ground,F,PAL){this.list=[];this.t=0;this.R=R;this.ground=ground;this.F=F;this.PAL=PAL;this.onLand=null;}
    spawn(k,x,y,vx,vy,life,col=0,size=1,delay=0,flag=0){this.list.push({k,x,y,vx,vy,life,max:life,col,size,seed:this.R.next()*100,delay,flag});}
    impulse(x,y,r,force){for(const p of this.list){if(p.k===PT.FIRE)continue;const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy)||1;if(d>r)continue;
      const f=force*(1-d/r)*(p.k===PT.SMOKE||p.k===PT.DUST?.35:1);p.vx+=(dx/d)*f;p.vy+=(dy/d)*f-f*.3;}}
    update(dt){this.t+=dt;const t=this.t,R=this.R,L=this.list;
      for(let i=L.length-1;i>=0;i--){const p=L[i];
        if(p.delay>0){p.delay-=dt;continue;}
        if((p.life-=dt)<=0){if(p.k===PT.FIRE&&p.flag&SMOKES){const big=p.flag&BIG;
            this.spawn(PT.SMOKE,p.x,p.y,p.vx*.6,p.vy*.6-12,big?R.range(1.3,2.3):R.range(.8,1.4),0,p.size*(big?.85:.7),0,big?BIG:0);}
          L.splice(i,1);continue;}
        const g=this.ground(p.x);
        switch(p.k){
          case PT.SPARK:{p.vy+=GRAVITY*.45*dt;p.vx-=p.vx*2.2*dt;p.vy-=p.vy*2.2*dt;const ny=p.y+p.vy*dt;p.x+=p.vx*dt;
            if(p.vy>0&&p.y<=g&&ny>=g){p.vy=-p.vy*.45;p.vx*=.7;p.y=g-.5;}else p.y=ny;break;}
          case PT.EMBER:p.vy+=(-60+Math.sin(t*3+p.seed)*40)*dt;p.vx+=Math.cos(t*2.3+p.seed)*90*dt;p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.6*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case PT.STAR:p.vx-=p.vx*3*dt;p.vy-=p.vy*3*dt+14*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case PT.SMOKE:{const big=p.flag&BIG;p.vy-=(big?46:32)*dt;p.vx+=Math.sin(t*1.3+p.seed)*16*dt;p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.2*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;}
          case PT.FIRE:p.vy-=190*dt;p.vx+=Math.sin(t*17+p.seed)*60*dt;p.vx-=p.vx*5*dt;p.vy-=p.vy*3.2*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case PT.DUST:p.vx-=p.vx*4*dt;p.vy-=p.vy*4*dt+10*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case PT.GRIT:{p.vy+=GRAVITY*dt;p.vx-=p.vx*.8*dt;const ny=p.y+p.vy*dt;p.x+=p.vx*dt;
            if(p.vy>0&&p.y<=g&&ny>=g){p.y=g-.5;if(p.vy>260&&R.chance(.4)){p.vy=-p.vy*.25;p.vx=p.vx*.5+R.range(-20,20);}else{p.vx=p.vy=0;p.life=Math.min(p.life,.5);}}else p.y=ny;break;}
          case PT.BRAND:{p.vy+=GRAVITY*.8*dt;p.vx-=p.vx*.9*dt;
            if(R.chance(.9))this.spawn(PT.FIRE,p.x,p.y,p.vx*.1+R.range(-15,15),p.vy*.1-20,R.range(.16,.32),0,R.range(.9,1.7)*(.5+(p.life/p.max)*.6),0,R.chance(.4)?SMOKES:0);
            const ny=p.y+p.vy*dt;p.x+=p.vx*dt;if(p.vy>0&&p.y<=g&&ny>=g){this.onLand?.(p.x,g);L.splice(i,1);}else p.y=ny;break;}}}}
    draw(buf,light,layer){const back=layer==='back';
      if(back)for(const p of this.list)if(p.delay<=0&&(p.k===PT.SMOKE||p.k===PT.DUST))this.drawOne(p,buf,light);
      for(const p of this.list)if(p.delay<=0&&p.k!==PT.SMOKE&&p.k!==PT.DUST&&!(p.flag&BACK)!==back)this.drawOne(p,buf,light);}
    drawOne(p,buf,light){const F=this.F,PAL=this.PAL,k=p.life/p.max,ax=p.x/PX,ay=p.y/PX,px=Math.floor(ax),py=Math.floor(ay);
      switch(p.k){
        case PT.SMOKE:{const age=1-k,big=p.flag&BIG,r=p.size*(.65+Math.min(1,age*2.5)*.45+age*(big?.5:.4));
          const a=Math.min(1,age*12)*Math.min(1,k*2.4)*(big?.7:.58)*buf.edge(ax,ay,r*.95,r*.5+4);if(a<=.01)break;
          const c=p.col?mix(p.col,ramp(SMOKE_RAMP,age),age):ramp(SMOKE_RAMP,age*1.05);
          buf.alphaDisc(ax,ay,r,c,a*.45);buf.alphaDisc(ax+r*.05,ay+r*.06,r*.74,c,a*.62);
          if(age<.5)buf.alphaDisc(ax-r*.22,ay-r*.3,r*.5,mix(c,WHITE,.12),a*.4*(1-age*2));break;}
        case PT.DUST:buf.alphaDisc(ax,ay,p.size*(.6+(1-k)*.9),p.col,Math.pow(k,1.3)*.7*buf.edge(ax,ay,p.size,4));break;
        case PT.GRIT:{const e=buf.edge(ax,ay,1,10);if((k>.25||bayer(px,py)<k*4)&&(e>=1||bayer(px,py)<e)){buf.set(px,py,p.col);
            if(p.size>=2){buf.set(px+1,py,p.col);buf.set(px,py+1,scale(p.col,.8));buf.set(px+1,py+1,scale(p.col,.7));}}break;}
        case PT.FIRE:{const age=1-k,heat=Math.min(.999,Math.pow(age,.62)+(p.seed%1)*.1),idx=Math.min(F.length-2,Math.floor(heat*(F.length-1)));
          const r=p.size*(.55+.45*Math.min(1,age*7))*(1-age*.55),c=F[idx];
          if(idx>=F.length-2)buf.alphaDisc(ax,ay,r,c,Math.min(1,k*3)*.85);
          else{buf.disc(ax,ay,r,F[Math.min(F.length-1,idx+2)]);buf.disc(ax-r*.16,ay-r*.22,r*.78,c);
            if(r>1.6)buf.disc(ax,ay-r*.9,r*.42,c);
            if(idx<=3&&r>1.8)buf.disc(ax-r*.28,ay-r*.34,r*.36,F[Math.max(0,idx-1)]);
            if(idx<6)light.glow(ax,ay,Math.min(18,r*2.4+2),c,.18*k);}break;}
        case PT.BRAND:buf.disc(ax,ay,1.6,PAL.deepOrange);buf.set(px,py,Math.sin(this.t*40+p.seed)>0?PAL.hot:PAL.yellow);buf.set(px+1,py,PAL.yellow);light.glow(ax,ay,7,PAL.orange,.45);break;
        case PT.SPARK:{const e=buf.edge(ax,ay,1,14);if(e<=0)break;const hot=k>.6?PAL.hot:k>.3?PAL.yellow:PAL.orange,sp=Math.hypot(p.vx,p.vy)||1,ux=p.vx/sp,uy=p.vy/sp,len=Math.min(9,1+sp*.011);
          if(e<1){for(let d=0;d<=len;d+=.5)dot(buf,ax-ux*d,ay-uy*d,d<len*.45?hot:k>.5?hot:PAL.deepOrange,e);light.glow(ax,ay,3,hot,.45*k*e);break;}
          buf.line(ax-ux*len,ay-uy*len,ax-ux*len*.4,ay-uy*len*.4,k>.5?hot:PAL.deepOrange);buf.line(ax-ux*len*.45,ay-uy*len*.45,ax,ay,hot);light.glow(ax,ay,3,hot,.45*k);break;}
        case PT.EMBER:{const c=k>.5?(Math.sin(this.t*22+p.seed*3)>-.2?PAL.yellow:PAL.orange):k>.2?PAL.orange:PAL.red;dot(buf,px,py,c,buf.edge(ax,ay,0,8));light.glow(ax,ay,3,c,.3*k);break;}
        /* a star glint (original, Shadowflare): a 4-point cross whose arms shrink with life, white core, C2 arms, C4 tips; it twinkles */
        case PT.STAR:{const tw=.75+.25*Math.sin(this.t*30+p.seed*7),L=Math.round((1+3*k)*tw*p.size),core=k>.5?F[0]:F[1],arm=k>.4?F[2]:F[3],tip=k>.4?F[4]:F[5];
          buf.set(px,py,core);for(let d=1;d<=L;d++){const c=d===L&&L>1?tip:arm;buf.set(px+d,py,c);buf.set(px-d,py,c);buf.set(px,py+d,c);buf.set(px,py-d,c);}
          if(L>=3){buf.set(px+1,py+1,tip);buf.set(px-1,py-1,tip);buf.set(px+1,py-1,tip);buf.set(px-1,py+1,tip);}
          light.glow(ax,ay,4+L,F[3],.4*k);break;}}}}

  class Fx{
    constructor(ps,F,PAL,warm){this.flashes=[];this.rings=[];this.lights=[];this.blazes=[];this.jets=[];this.ps=ps;this.F=F;this.PAL=PAL;this.warm=warm;
      ps.onLand=(x,y)=>this.blaze(x,y-.5,ps.R.range(2.2,4.5),ps.R.range(.55,.85));}
    get busy(){return this.flashes.length+this.rings.length+this.lights.length+this.blazes.length+this.jets.length>0;}
    light(x,y,r,color,k,life){this.lights.push({x,y,r,color,k,life,max:life});}
    ring(x,y,r0,r1,life,thick,color){this.rings.push({x,y,r0,r1,life,max:life,thick,color});}
    blaze(x,y,life,power){this.blazes.push({x,y,life,max:life,acc:this.ps.R.next(),power});}
    jet(x,y,life,power,ar,q){this.jets.push({x,y,life,max:life,power,ar,q,acc:0});}
    update(dt){for(const a of [this.flashes,this.rings,this.lights])for(let i=a.length-1;i>=0;i--)if((a[i].life-=dt)<=0)a.splice(i,1);
      const ps=this.ps,R=ps.R,PAL=this.PAL;
      for(let i=this.blazes.length-1;i>=0;i--){const b=this.blazes[i];if((b.life-=dt)<=0){this.blazes.splice(i,1);continue;}
        const k=b.life/b.max,intensity=b.power*(k>.7?1:.35+(k/.7)*.65);
        for(b.acc+=dt*(6+16*intensity);b.acc>1;b.acc--){const s=R.range(1.2,2.8)*intensity;
          ps.spawn(PT.FIRE,b.x+R.range(-3,3),b.y-s*.6,R.range(-12,12),R.range(-60,-25),R.range(.28,.6),0,s,0,BACK|(R.chance(.3)?SMOKES:0));
          if(R.chance(.06))ps.spawn(PT.EMBER,b.x,b.y-3,R.range(-30,30),R.range(-90,-30),R.range(.6,1.4),PAL.orange,1,0,BACK);}}
      /* pillar jets: full for the first half of their life, then dwindle; flames thrown up hard, a third of them leave big smoke */
      for(let i=this.jets.length-1;i>=0;i--){const j=this.jets[i];if((j.life-=dt)<=0){this.jets.splice(i,1);continue;}
        const k=j.life/j.max,I=j.power*(k>.5?1:.25+(k/.5)*.75);
        for(j.acc+=dt*(24+30*I)*j.q;j.acc>1;j.acc--){const s=R.range(.2,.34)*j.ar*(.7+.3*I);
          ps.spawn(PT.FIRE,j.x+R.range(-.25,.25)*j.ar*PX,j.y-R.range(0,6),R.range(-30,30),-R.range(380,700)*Math.sqrt(I),R.range(.45,.85),0,s,0,R.chance(.35)?SMOKES|BIG:0);
          if(R.chance(.3))ps.spawn(PT.EMBER,j.x+R.range(-10,10),j.y-R.range(10,40),R.range(-120,120),-R.range(150,420),R.range(.9,2),PAL.orange);
          if(R.chance(.4))ps.spawn(PT.SPARK,j.x+R.range(-8,8),j.y-6,R.range(-160,160),-R.range(500,900)*Math.sqrt(I),R.range(.2,.5));}}}
    drawBack(buf,light){const PAL=this.PAL;
      for(const b of this.blazes){const k=b.life/b.max,ax=b.x/PX,ay=b.y/PX;
        buf.set(Math.floor(ax),Math.floor(ay),k>.4?(Math.sin(b.life*31+b.x)>0?PAL.yellow:PAL.orange):PAL.red);
        light.glow(ax,ay,6+5*k*b.power,PAL.orange,.3*k*b.power);}
      for(const j of this.jets){const k=Math.min(1,j.life/j.max*2),ax=j.x/PX,ay=j.y/PX;light.glow(ax,ay-j.ar*.6,j.ar*1.3,PAL.orange,.35*k*j.power);}}
    drawFront(buf,light){const PAL=this.PAL;
      for(const f of this.flashes){const k=f.life/f.max,ax=f.x/PX,ay=f.y/PX,r=f.r*(.8+.2*k);
        buf.disc(ax,ay,r+1.2,PAL.deepOrange);buf.disc(ax,ay,r,k>.45?PAL.hot:PAL.yellow);buf.disc(ax,ay,r*.6,k>.45?WHITE:PAL.hot);}
      for(const r of this.rings){const k=r.life/r.max,e=1-Math.pow(k,3);
        buf.ring(r.x/PX,r.y/PX,(r.r0+(r.r1-r.r0)*e)/PX,Math.max(1,r.thick*k+.4),r.color,Math.min(1,k*1.6));}
      for(const l of this.lights){const k=l.life/l.max;light.glow(l.x/PX,l.y/PX,Math.min(64,(l.r/PX)*(.55+.45*k)),l.color,l.k*k*k);}}
    explosion(x,y,rad,power=1,fire=1,o={}){
      const ps=this.ps,R=ps.R,ar=rad/PX,F=this.F,PAL=this.PAL,q=o.q??1,th=o.th??1,sk=o.spark??1;
      this.flashes.push({x,y,r:ar*1.05,life:.06,max:.06});
      this.ring(x,y,rad*.45,rad*2.7,.34,3,PAL.yellow);
      this.ring(x,y,rad*.3,rad*1.6,.22,1.8,PAL.orange);
      this.light(x,y,rad*3.4,this.warm,.6*power,.7);
      this.light(x,y,rad*1.6,WHITE,.6,.08);
      for(let i=0;i<5;i++)ps.spawn(PT.FIRE,x+R.range(-5,5),y+R.range(-5,5),R.range(-40,40),R.range(-80,-20),R.range(.18,.3),0,R.range(ar*.4,ar*.55));
      for(let i=0;i<Math.round(28*power*fire*q);i++){const a=R.range(0,TAU),d=R.range(0,rad*.55),sp=R.range(80,420)*power;
        ps.spawn(PT.FIRE,x+Math.cos(a)*d,y+Math.sin(a)*d,Math.cos(a)*sp,Math.sin(a)*sp*.8-80,R.range(.55,1.15),0,R.range(ar*.22,ar*.46),0,R.chance(.45)?SMOKES|BIG:0);}
      for(let i=0;i<Math.round(5*(o.smoke??1));i++){const a=R.range(0,TAU),d=R.range(rad*.1,rad*.5);
        ps.spawn(PT.SMOKE,x+Math.cos(a)*d,y+Math.sin(a)*d,Math.cos(a)*60,Math.sin(a)*40-60,R.range(.9,1.5),o.black??BLACK_SMOKE,R.range(ar*.15,ar*.26),R.range(.06,.2),BIG);}
      for(let i=0;i<Math.round(5*fire*(o.column??1));i++)ps.spawn(PT.FIRE,x+R.range(-rad*.25,rad*.25),y,R.range(-25,25),R.range(-360,-200)*Math.sqrt(o.column??1)*th,R.range(.8,1.3),0,R.range(ar*.24,ar*.36),R.range(0,.1),R.chance(.6)?SMOKES|BIG:0);
      for(let i=0;i<Math.round(10*power*q*(o.smoke??1));i++){const a=R.range(0,TAU),d=R.range(0,rad*.7),sp=R.range(30,200);
        ps.spawn(PT.SMOKE,x+Math.cos(a)*d,y+Math.sin(a)*d,Math.cos(a)*sp,Math.sin(a)*sp*.6-70,R.range(1.8,3),0,R.range(ar*.26,ar*.44),R.range(.12,.45),BIG);}
      for(let i=0;i<Math.round(80*power*q);i++){const a=R.range(0,TAU),sp=R.range(320,1200)*power*sk;
        ps.spawn(PT.SPARK,x,y,Math.cos(a)*sp,Math.sin(a)*sp-140,R.range(.18,.7));}
      for(let i=0;i<Math.round(40*power*fire*q);i++){const a=R.range(0,TAU),sp=R.range(60,360);
        ps.spawn(PT.EMBER,x+Math.cos(a)*rad*.4,y+Math.sin(a)*rad*.4,Math.cos(a)*sp,Math.sin(a)*sp-150,R.range(1.2,3.2),PAL.orange);}
      for(let i=0;i<Math.round(R.range(9,14)*Math.max(0,power-.55)*fire*(o.brands??1));i++){const a=-Math.PI/2+R.range(-1.35,1.35),sp=R.range(380,820)*th;
        ps.spawn(PT.BRAND,x,y,Math.cos(a)*sp*.6,Math.sin(a)*sp,R.range(.7,1.5));}
      for(let i=0;i<Math.round((o.stars??0)*q);i++){const a=R.range(0,TAU),sp=R.range(120,520)*power;
        ps.spawn(PT.STAR,x+Math.cos(a)*rad*.3,y+Math.sin(a)*rad*.3,Math.cos(a)*sp,Math.sin(a)*sp*.8-60,R.range(.5,1.2),0,R.range(.8,1.3),R.range(0,.12));}
      ps.impulse(x,y,rad*2.6,720*power);}
    dust(x,y,n,spread,color){const R=this.ps.R,dc=mix(color,rgb(150,140,150),.35);
      for(let i=0;i<n;i++)this.ps.spawn(PT.DUST,x+R.range(-3,3),y-1,R.sign()*R.range(20,110)*spread,-R.range(5,45),R.range(.3,.65),dc,R.range(1.3,2.8));}}

  class Bits{
    constructor(ground){this.list=[];this.ground=ground;}
    add(x,y,vx,vy,life,a,va,s,m){this.list.push({x,y,vx,vy,life,age:0,a,va,s,m,rest:false});}
    step(dt,onLand){for(let i=this.list.length-1;i>=0;i--){const b=this.list[i];b.age+=dt;
      if((b.life-=dt)<=0){this.list.splice(i,1);continue;}if(b.rest)continue;
      b.vy+=GRAVITY*dt;b.vx-=b.vx*.25*dt;b.vy-=b.vy*.25*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.a+=b.va*dt;
      const floor=this.ground(b.x);
      if(b.y>=floor&&b.vy>0){const sp=b.vy;b.y=floor-.01;onLand(b,sp);if(sp>140){b.vy=-sp*.32;b.vx*=.7;b.va*=.6;}else{b.rest=true;b.vx=b.vy=0;}}}}}

  function ringE(buf,cx,cy,rx,ry,thick,c,a,keep){const n=Math.ceil(Math.max(rx,ry)*TAU*1.3);
    for(let j=0;j<n;j++){const ang=(j/n)*TAU;if(!keep(ang))continue;const ca=Math.cos(ang),sa=Math.sin(ang);
      for(let off=-thick/2;off<=thick/2;off+=.5)dot(buf,cx+ca*(rx+off),cy+sa*(ry+off*(ry/Math.max(1,rx))),c,a);}}

  /* ---------- the shockwave, laid on the ground (SF's floorRing on a 'flat' canvas: a real circle, seen as a perspective ellipse) ---------- */
  function shockwave(o){const RING=o.reach,thick=o.thick,cols=o.cols,gx=o.x/PX,gy=o.y/PX;let t=0;
    return{update(dt){t+=dt;},
      draw(fr){const k=t/.5;if(k>=1||k<0)return;const buf=new Px(fr,fr.color),r=RING*outCubic(k),col=cols[Math.min(cols.length-1,Math.floor(k*cols.length))];
        ringE(buf,gx,gy,r,r,Math.max(1,thick*(1-k)),col,1.15-k,()=>true);},
      done:()=>t>=.5};}

  /* ---------- the scorch (SF's scorch, as a decal on the ground): it opens white-hot in 0.08 s, the core cools through the heat ramp,
     a ragged rim and a few radial cracks glow longer, all of it settles to soot, then dithers away from the rim inward ---------- */
  function scorch(o){const RX=o.r,cool=o.cool??2.4,L=o.life??4,HR=o.heat??HEAT_RAMP,cx=o.x/PX,cy=o.y/PX,sd=o.seed??1;
    const w=Math.round(o.w),h=Math.round(o.h),D=new Float32Array(w*h),K=new Float32Array(w*h),C=new Uint8Array(w*h),nc=5+(sd%3);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=x+.5-cx,dy=y+.5-cy,an=Math.atan2(dy,dx),e=1+.16*noise2(Math.cos(an)*1.8+3,Math.sin(an)*1.8+3,sd)+.06*noise2(Math.cos(an)*5+9,Math.sin(an)*5+9,sd+1);
      const d=Math.hypot(dx,dy)/(RX*e),i=y*w+x;D[i]=d;K[i]=hash(x*31+y*977,sd);
      /* cracks: thin wobbly spokes from 0.2 to 0.9 of the radius */
      const sp=(an/TAU+.5)*nc+noise2(d*3,sd*.37,sd+2)*.35,f=Math.abs(sp-Math.round(sp))*TAU/nc*Math.hypot(dx,dy);
      C[i]=d>.18&&d<.9&&f<.75?1:0;}
    let t=0;
    return{update(dt){t+=dt;},
      draw(fr){const buf=new Px(fr,fr.color),open=Math.min(1,t/.08),a=clamp((L-t)/1.3),cc=Math.pow(clamp(1-t/cool),1.4),cr=Math.pow(clamp(1-t/(cool*1.45)),1.2),ck=Math.pow(clamp(1-t/(cool*1.25)),1.3),n=HR.length-1;
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,d=D[i]/open;if(d>1)continue;const k=K[i];
          if(a<1&&a*1.3-d*.3<=bayer(x,y))continue;
          const rim=clamp((d-.7)/.16)*(1-clamp((d-.96)/.06));
          const T=Math.max(cc*(1.25-d)-k*.35,cr*rim*1.15-k*.5,C[i]?ck*(1.1-d*.5)-k*.3:-1);
          if(T>.06)buf.set(x,y,HR[Math.min(n,Math.floor((1-Math.min(1,T))*n))]);
          else if(d<.95-k*.3||bayer(x,y)<1-d)buf.set(x,y,C[i]&&d<.8?SOOT:d<.5?SOOT:SOOT2);}},
      done:()=>t>=L};}

  /* ---------- the meteor fall (original, in Sprite Fusion's style): a molten rock streaking down the game's meteor path, a bow-shock
     crescent ahead of it, a flame trail (fire ramp flames dropped every 1.5 px along its path), a smoke trail and shed sparks.
     pos() gives the rock in effect units (undefined while it is still too high to show, null once it has landed); the trail burns out ---------- */
  function meteorFall(o){
    const F=o.ramp??FIRE_RAMP,PAL=palOf(F),R=new Rng(o.seed??1),ps=new Particles(R,()=>Infinity,F,PAL),RR=o.r??3.4;
    let t=0,hx=null,hy=null,ux=0,uy=1,gone=false,acc=0,smk=0;
    return{
      update(dt){t+=dt;const p=gone?null:o.pos();
        if(p){if(hx!==null){const dx=p[0]-hx,dy=p[1]-hy,d=Math.hypot(dx,dy);if(d>.01){ux=dx/d;uy=dy/d;}
            for(acc+=d/(1.5*PX);acc>1;acc--){const u=acc*1.5*PX/Math.max(d,1e-3),x=p[0]-dx*clamp(u),y=p[1]-dy*clamp(u);
              ps.spawn(PT.FIRE,x+R.range(-2,2),y+R.range(-2,2),-ux*40+R.range(-20,20),-uy*40+R.range(-20,20),R.range(.14,.3),0,R.range(.8,1.15)*RR*.7,0,R.chance(.25)?SMOKES:0);}
            if((smk+=dt)>.05){smk=0;ps.spawn(PT.SMOKE,p[0]-ux*RR*PX*2,p[1]-uy*RR*PX*2,-ux*30+R.range(-10,10),-uy*30,R.range(.5,.8),BLACK_SMOKE,RR*R.range(.7,1));}
            if(R.chance(.35))ps.spawn(PT.SPARK,p[0],p[1],-ux*R.range(80,240)+R.range(-120,120),-uy*R.range(80,240)+R.range(-120,120),R.range(.12,.3));}
          hx=p[0];hy=p[1];}
        else if(p===null&&!gone)gone=true;
        ps.update(dt);},
      draw(fr){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light);ps.draw(buf,light,'back');ps.draw(buf,light,'front');
        if(gone||hx===null)return;const ax=hx/PX,ay=hy/PX,f=Math.floor(t*60)%2;
        /* bow shock: a crescent ahead of the rock, C1 inner / C2 outer, flickering a step every other frame */
        for(let j=-6;j<=6;j++){const th=Math.atan2(uy,ux)+j*.16,w=1.6*(1-Math.abs(j)/7);for(let q=0;q<=w;q+=.5)buf.set(Math.floor(ax+Math.cos(th)*(RR+1.6+q)),Math.floor(ay+Math.sin(th)*(RR+1.6+q)),q<.6?PAL.hot:f?PAL.yellow:PAL.gold);}
        buf.disc(ax,ay,RR+1,OUTLINE);buf.disc(ax,ay,RR,MAGMA.body);
        buf.disc(ax+ux*RR*.35,ay+uy*RR*.35,RR*.72,PAL.orange);buf.disc(ax+ux*RR*.5,ay+uy*RR*.5,RR*.42,f?PAL.yellow:PAL.hot);
        buf.disc(ax-ux*RR*.45-uy*RR*.2,ay-uy*RR*.45+ux*RR*.2,RR*.35,MAGMA.shade);
        light.glow(ax,ay,RR*4+6,PAL.orange,.55);light.glow(ax+ux*RR,ay+uy*RR,RR*1.6+2,WHITE,.5);},
      done:()=>gone&&ps.list.length===0,
      stop(){gone=true;}};}

  /* ---------- Embervale wrappers ---------- */
  let seed=1;const live=[],recent=[];let clock=0;
  const prune=()=>{for(let i=live.length-1;i>=0;i--)if(live[i].dead||!PXFX.list.includes(live[i]))live.splice(i,1);};
  const zoneEarth=()=>{const z=(typeof ZDUST!=='undefined'&&ZDUST[curZone])||'#8a7a6a';return scale(hex(z),.58);};
  /* blast at ground point (x, y), damage radius r (world units). o: ramp, heat, warm, fire, earth, chunks, molten, stars, jet, h (heart
     height above the ground, world units), k (size multiplier), scorch (false = none), surface, shake */
  function pxExplosion(x,y,r,o={}){prune();if(live.length>=8)return null;
    const lite=PERF.lite,q=(lite?.55:1)*(live.length>=4?.5:live.length>=2?.72:1)*(o.detail??1),S=clamp(r/86,.75,1.8)*(o.k??1);
    const big=S>1.15,w=big?256:208,hh=big?208:176,ay=hh-14,dz=Math.min(60,r*.3),sd=seed++;
    if(o.scorch!==false)pxExplosionScorch(x,y,53*S,{heat:o.heat,seed:sd});
    const reach=(r+14)/PIX,RN=Math.ceil(reach)+4,ST=stone(o.surface??zoneEarth()),P_=palOf(o.ramp??FIRE_RAMP);
    pxfx(c=>shockwave({x:c.x,y:c.y,reach,thick:2+(36*S)/18,cols:[WHITE,P_.hot,P_.orange,ST.light,ST.body]}),{mode:'flat',x,y,w:RN*2,hh:RN*2,ax:RN,ay:RN,nolight:true,pri:1,ttl:1});
    const H=pxfx(c=>{const base=pxProj(c.handle,x,0,y)[1],heart=pxProj(c.handle,x,o.h||0,y)[1];
      const fx=explosion({x:c.x,y:heart,base,ground:c.y,size:S,fire:o.fire??1,earth:(o.earth??1)*(lite?.6:1),chunks:o.chunks??18,molten:o.molten??0,stars:o.stars??0,
        ramp:o.ramp,warm:o.warm,black:o.black,surface:o.surface??zoneEarth(),detail:q,throw:o.throw??.9,spark:o.spark??.6,brands:o.brands??.45,column:o.column??1,
        roll:o.roll??1,rollV:o.rollV??.62,seed:sd,lampR:150+r*1.4,lampH:(o.h||0)+40,shake:tr=>PXK.shake(tr*(o.shake??.35))});
      if(o.jet)fx.jet(o.jet,o.jetT);return fx;},{x,y:y+dz,w,hh,ay,lamp:!lite,pri:1,ttl:9});
    if(H){live.push(H);recent.push({x,y,t:clock,H});}
    return H;}
  /* the scorch decal alone: radius r (world units) */
  function pxExplosionScorch(x,y,r,o={}){const R=Math.max(6,r/PIX),N=Math.ceil(R*1.25)+3;
    return pxfx(c=>scorch({x:c.x,y:c.y,r:R,w:N*2,h:N*2,cool:o.cool??(1+R/40),life:o.life??4,heat:o.heat,seed:o.seed??seed++}),{mode:'flat',x,y,w:N*2,hh:N*2,ax:N,ay:N,nolight:true,pri:0,ttl:(o.life??4)+.5});}
  /* firePillar: merged into a blast spawned on the same spot this instant (the meteor calls boomFx then firePillar), else its own */
  function pxExplosionPillar(x,y,R,k=1){
    for(const b of recent)if(clock-b.t<.06&&Math.abs(b.x-x)<30&&Math.abs(b.y-y)<30&&b.H&&!b.H.dead&&b.H.fx&&b.H.fx.jet){b.H.fx.jet(.55+.45*k,.5+.3*k);return b.H;}
    return pxExplosion(x,y,R*.85,{fire:1.15,earth:.45,chunks:10,molten:.5,jet:k,jetT:.6+.25*k,column:2.2,tall:true,throw:.85});}
  /* the Violet Star's Shadowflare: an air burst at the orb's height (44 units), violet ramp, star glints, little earth */
  const VWARM=rgb(226,138,255),VBLACK=rgb(40,22,56);
  function pxExplosionFlare(x,y,r=190,h=44){return pxExplosion(x,y,r*.82,{ramp:VIOLET_RAMP,heat:VHEAT_RAMP,warm:VWARM,black:VBLACK,h,fire:1,earth:.2,chunks:0,stars:26,brands:0,roll:.5,shake:.3});}
  /* a falling meteor (the game's own path: x + 90(1-p), height 760(1-p) + 20, y - 60(1-p), drawn from p = 0.3) */
  const falling=new Set();
  function pxExplosionMeteor(g){if(!g||falling.has(g))return null;falling.add(g);
    return pxfx(c=>{const H=c.handle;return meteorFall({seed:seed++,r:g.r>=110?3.6:3,pos:()=>{if(g.dead||g.t>=g.delay||!gfx.includes(g))return null;
      const p=clamp(g.t/Math.max(.01,g.delay));if(p<=.3)return undefined;const P1=pxProj(H,g.x+(1-p)*90,(1-p)*760+20,g.y-(1-p)*60);return[P1[0],P1[1]];}});},
      {x:g.x,y:g.y,w:104,hh:236,ax:40,ay:224,pri:1,ttl:Math.max(1,g.delay-g.t)+1.5});}

  /* ---------- wiring ---------- */
  onEv('update',dt=>{clock+=dt;for(let i=recent.length-1;i>=0;i--)if(clock-recent[i].t>.2)recent.splice(i,1);
    for(const g of gfx)if(g.kind==='meteor'&&!g.dead&&!falling.has(g)&&g.delay-g.t>.15)pxExplosionMeteor(g);
    if(falling.size>64)for(const g of falling)if(g.dead||!gfx.includes(g))falling.delete(g);});
  onEv('resetWorld',()=>{live.length=0;recent.length=0;falling.clear();});
  onEv('pxBoom',g=>{if(!g)return;const r=g.r||100;
    pxExplosion(g.x,g.y,r,{molten:g.kind==='meteor'?.55:0,fire:g.kind==='trap'?.8:1,earth:g.kind==='trap'?1.25:1,chunks:g.kind==='trap'?22:18,k:g.proc?.92:1});});
  onEv('pxElem',(kind,x,y,R,k)=>{if(kind==='fire')pxExplosionPillar(x,y,R,k??1);});
  {const o=shadowflareBoom;shadowflareBoom=function(pr){const was=!pr||pr.flared;const r=o(pr);if(!was&&pr.flared)try{pxExplosionFlare(pr.x,pr.y,190,pr.z||44);}catch(e){}return r;};}

  pxlab('explosion-meteor','Meteor blast (r 120 + jet)','Explosions','sf',(x,y)=>{pxExplosion(x+40,y,120,{molten:.55});pxExplosionPillar(x+40,y,90,.5);});
  pxlab('explosion-trap','Trap blast (r 150)','Explosions','sf',(x,y)=>pxExplosion(x+60,y,150,{fire:.8,earth:1.25,chunks:22}));
  pxlab('explosion-ember','Ember proc blast (r 80)','Explosions','sf',(x,y)=>pxExplosion(x+20,y,80,{k:.92}));
  pxlab('explosion-pillar','Fire pillar (Cataclysm)','Explosions','orig',(x,y)=>pxExplosionPillar(x+60,y,172,1));
  pxlab('explosion-flare','Shadowflare (violet)','Explosions','orig',(x,y)=>pxExplosionFlare(x+60,y,190,44));
  pxlab('explosion-sfblast','SF Blast (earth, stone)','Explosions','sf',(x,y)=>pxExplosion(x+40,y,100,{fire:.3,earth:1.6,chunks:26,surface:STONE_BODY,throw:1,spark:.8}));
  pxlab('explosion-scorch','Scorch decal','Explosions','orig',(x,y)=>pxExplosionScorch(x+40,y,75));
  pxlab('explosion-meteorfall','Meteor fall + impact','Explosions','orig',(x,y)=>ground({x:x+40,y,r:120,delay:.9,team:'p',dmg:0,c:'#ff8a3d',kind:'meteor',fx:g=>{boomFx(g);firePillar(g.x,g.y,90,.5);}}));
  return{pxExplosion,pxExplosionPillar,pxExplosionFlare,pxExplosionScorch,pxExplosionMeteor};})();
