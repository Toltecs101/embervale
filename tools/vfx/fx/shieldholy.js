/* SHIELD + HOLY LIGHT (Sprite Fusion "Shield" and "Holy Light", MIT, ported): the hero's barrier as SF's hex-cell dome, and SF's golden
   pillar of light slamming down from the sky (Judgement, Holy Light, Avatar of Dawn, waystones, the Phoenix Heart) plus SF's quick smites.
   SHIELD recipe (radius RAD 38 art px here, SF 40; sizes in art px, speeds in world units, 2 per art px):
   - 0.05-0.73 s build: hex cells appear from the ground up, a cell at 0.05 + 0.6 x lat/90deg + 0-0.08 s, flashing 0.1 s as it locks in;
     until 0.75 s, 3 sparkles per update climb its front. Ground ring fades in over 0-0.15 s. Then it holds (Infinity here: until the
     barrier is gone), a shimmer band sweeping diagonally (|frac(.35 lon + .45 lat - .55 t) - .5| < .04).
   - A hit: a glint (r 1.8 -> 0.9 over 0.05 s, #fff3a6 rimmed #f2561d), 14 warm sparks (10 in game, 0.6x speed) fanned over +-1 rad at
     200-600 +80 up, 0.45 g, drag 2.2, bouncing x0.45; a light r 40 -> 22 at 0.9 k^2 over 0.18 s; a ripple ring running over the
     sphere at 3.2 rad/s, 0.22 rad wide, strength 1 - age/0.7 (0.4 inside within 0.5 rad); struck cells go white / step 1; shake 0.18.
   - Break-up (drop: barrier timed out): each cell goes at hold + 0-0.55 s, flashing its last 0.08 s; the ring fades over hold-0.05 ->
     hold+0.45; 4 stars or motes per update drift up until hold+0.6. Shatter (original, on pxShield: the barrier broke under a hit):
     cells go from the struck point outward, hold + 0.3 x dist/pi + 0-0.06 s, and every near cell drops as a tumbling hex pane
     (4 frames at 14 fps, 0.55 g, drag 0.8, bounce x0.35 on the ground row, dithered out over its last 40%), light pop r 34, shake 0.3.
   - Layers: back = the far half's cell edges (e > .82, 50% dither, step 4); front = near half (edges e > .8: white flashing / under
     ripple > .6, step 1 under ripple > .2 / sweep / rim > .75, step 2 rim .4-.75, step 3 facing you, dithered at .5 + rim; fill
     dithered at .08 + .3 rim^2 (.7 flashing) + .6 ripple, step 1 / 3 / 4), sparks, glints, sparkles, motes, panes. Light: 1 px in 32
     glows r 7 step 3 at .15 + .4 ripple, the dome r 1.3 RAD at .22 x ring. Ground (flat decal, Embervale): the base ring on the floor,
     near half step 2, far half step 3, 2 px, plus a floor glow r 1.05 RAD step 4. Palette: SF's ice ramp (#ffffff #dcfbff #a6ecff
     #62c8f4 #3a8bd8 #2c58aa); Divine Shield recolours it to the holy gold ramp with a full-dome flash.
   HOLY LIGHT recipe (slam at `windup`, SF 0.42 s; narrowing at slam + hold, SF 2.13; out at narrowing + 0.5):
   - wind-up: scene darkens (tint .3, judge), a 1 px step-1 guide line fades in down to the base (.4 -> 1 of .7 by .34 s), a gold pool
     grows on the floor (r 10 + 14 t), sparks drawn in to the base (40% per update, 40-90 units out, life .38 s).
   - slam: the column drops in 0.07 s (cubic in from 1/8 down) at 1.35x width settling to width (x 1 + .35 e^-9t); screen flash
     (255,240,196), shake, a burst of light 0.12 s; 50 stars thrown sideways (120-520 x canvas fit, 40-260 up, life .4-1 s, size .8-2.2);
     two floor rings racing out over 0.55 s (the second 0.1 s later at 0.7x), 3.5 -> 0.5 px, white then step 2; 8 feathers drift down.
   - stands: column across its width white q < .2, step 1 < .42, step 2 < .66, step 3 < .88, dithered step 4 fringe to 1.3;
     11 fibres one step brighter wobbling .05 w; pulses 3.5 px every 50 px running down at 95 px/s; a halo ring (rx 1.35 w -> +30%,
     ry 2.2) rising every 0.42 s over 0.9 s; stars and bokeh rising 60-170 inside it. The canvas top dissolves in Bayer dither (Embervale).
   - narrowing: w -> 0.6 px over 0.4 s (outCubic); pool fades narrowing -> out; column fades out - 0.25 -> out + 0.2 (outer part first).
   - feathers: 5x3 pixel sprites (white / step 1 / step 2 rows), fall 28-50 units/s, sway sin(2.4 t + seed) x 34, tilt .5 sin(...);
     life 2.2-3 s, fading in 0.3 s and out 0.6 s, dithered. Pool / rings live on a flat floor decal so they read in perspective.
   - Smite: width 6-7, hold 0.3-0.6, slam immediately (or staggered along a line), 2 feathers: Beacon, Dawnbreaker, Chains of Light.
   Feel: shimmering glass that sings when struck; holy light that hits like a hammer, then lingers in feathers and motes. */
const {pxShieldholyDome,pxShieldholyPillar,pxShieldholySmite}=(function(){'use strict';const {Px,dot,bayer,Rng,mix,scale,ramp,hex,rgb,cl:clamp,hash,TAU,PXW:PX,WHITE}=PXK;
  const HOT=hex('#fff3a6'),YELLOW=hex('#ffe26b'),ORANGE=hex('#ff8a2a'),DEEP_ORANGE=hex('#f2561d');
  const ICE=['#ffffff','#dcfbff','#a6ecff','#62c8f4','#3a8bd8','#2c58aa','#212f6b','#151a3d'].map(hex);
  const HOLY=['#ffffff','#fffbe2','#fff0a6','#ffd862','#f6aa3c','#cf722b','#7e3c1f'].map(hex);
  const FIRE=['#ffffff','#fff3a6','#ffd36a','#ff9a3d','#f2561d','#c9281f','#7a1a14'].map(hex);
  const TRACER=hex('#ffd65a'),TRACER_TAIL=hex('#ff8a2a'),TRACER_CORE=hex('#fffbe8');
  const HITS=[{t:1.05,lon:.75,lat:.55},{t:1.38,lon:1.05,lat:.95},{t:1.62,lon:.5,lat:.25},{t:2.05,lon:.9,lat:1.2}];
  const FEATHER=[['.##..','#####','..###'],['..##.','#####','###..']];
  /* a falling hex pane tumbling: face-on, tilted, edge-on, tilted back. a = step 1 (white while fresh), b = step 2, c = step 3 */
  const PANE=[['.aab.','a...c','a...c','.bcc.'],['.aab.','abbcc'],['abbc'],['abbcc','.bcc.']];
  const GRAVITY=1900,K={STAR:0,MOTE:1,GLINT:2,SPARK:3,BOKEH:4,PANE:5};
  const frac=x=>x-Math.floor(x),lerp=(a,b,t)=>a+(b-a)*t,outCubic=t=>1-Math.pow(1-clamp(t),3),inCubic=t=>Math.pow(clamp(t),3);
  const smooth=(a,b,x)=>{const t=(x-a)/(b-a);return x<=a?0:x>=b?1:t*t*(3-2*t);};
  const groundAt=(g,x)=>g===undefined?Infinity:typeof g==='number'?g:g(x);
  const c3=c=>[(c&255)/255,((c>>>8)&255)/255,((c>>>16)&255)/255];
  /* per-x scratch for the column (fibres are vertical bands: one level per column x per frame) */
  const LV=new Int8Array(512),AL=new Float32Array(512),TH=new Float32Array(512),GW=new Float32Array(512);

  /* ---------------- Shield (SF shield.ts) ---------------- */
  /* the dome's sphere geometry per art pixel, cached per (radius, centre): the canvas follows the hero, so it never changes */
  const GEO=new Map();
  function geo(RAD,cx,cy){const key=RAD+','+cx+','+cy;let G=GEO.get(key);if(G)return G;
    const S3=Math.sqrt(3),GRID=6.2,cells=new Map(),CL=[],near=[],far=[];
    const cell=(gx,gy)=>{const q=(S3/3)*gx-gy/3,r=(2/3)*gy,s=-q-r;let rq=Math.round(q),rr=Math.round(r);const rs=Math.round(s),dq=Math.abs(rq-q),dr=Math.abs(rr-r),ds=Math.abs(rs-s);
      if(dq>dr&&dq>ds)rq=-rr-rs;else if(dr>ds)rr=-rq-rs;
      const hx=S3*(rq+rr/2),hy=1.5*rr,dx=Math.abs(gx-hx),dy=gy-hy;
      return[(rq*73856093)^(rr*19349663),Math.max(dx,Math.abs(dx/2+(dy*S3)/2),Math.abs(dx/2-(dy*S3)/2))/(S3/2)];};
    for(const fr of [true,false])
      for(let y=Math.floor(cy-RAD-1);y<=cy;y++)for(let x=Math.floor(cx-RAD-1);x<=Math.ceil(cx+RAD+1);x++){
        const u=(x+.5-cx)/RAD,v=(cy-y-.5)/RAD,q=u*u+v*v;if(q>1||v<0)continue;
        const z=Math.sqrt(1-q)*(fr?-1:1),lon=Math.atan2(u,z),lat=Math.asin(clamp(v,0,1)),[id,e]=cell(lon*GRID,lat*GRID*1.15),h=hash(id&0xffff,id>>>16);
        const ck=fr?'f'+id:'n'+id;let ci=cells.get(ck);
        if(ci===undefined){ci=CL.length;cells.set(ck,ci);CL.push({x:0,y:0,n:0,lat:0,lon:0,h,far:fr});}
        const C=CL[ci];C.x+=x;C.y+=y;C.n++;C.lat+=lat;C.lon+=lon;
        (fr?far:near).push({x,y,lon,lat,e,h,rim:1-Math.abs(z),cl:Math.cos(lat),sl:Math.sin(lat),co:Math.cos(lon),so:Math.sin(lon),ci});}
    for(const C of CL){C.x=C.x/C.n+.5;C.y=C.y/C.n+.5;C.lat/=C.n;C.lon/=C.n;C.cl=Math.cos(C.lat);C.sl=Math.sin(C.lat);C.co=Math.cos(C.lon);C.so=Math.sin(C.lon);}
    G={near,far,cells:CL};if(GEO.size>6)GEO.clear();GEO.set(key,G);return G;}
  const trig=h=>{h.cl=Math.cos(h.lat);h.sl=Math.sin(h.lat);h.co=Math.cos(h.lon);h.so=Math.sin(h.lon);return h;};
  const sd=(n,h)=>Math.acos(clamp(n.cl*h.cl*(n.co*h.co+n.so*h.so)+n.sl*h.sl,-1,1));
  function shield(o={}){
    const R=new Rng(o.seed??1),ground=x=>groundAt(o.ground,x);
    const ps=new Particles(R,ground),lights=[],lite=!!o.lite;
    const actor=o.actor??{feet:()=>[o.x??600,o.y??600]};
    const RAD=o.radius??40,TR=o.tracer??170,SPK=o.spark??1,NSP=o.sparks??14,LK=o.light??1;
    let C=o.colors??ICE,SPARKS=[WHITE,C[1],C[2]];ps.C=C;
    let GONE=o.hold??2.75,t=0,brk=null,flashT=-1,ringA=0,pulse=0,panes=0;
    const hits=(o.hits??HITS).map(h=>trig({...h,traced:true,done:false})),A=[],GT=[];
    const centre=()=>{const [x,y]=actor.feet();return [x/PX,y/PX];};
    const surf=(lon,lat)=>{const [cx,cy]=centre();return [cx+RAD*Math.sin(lon)*Math.cos(lat),cy-RAD*Math.sin(lat)];};
    /* when each cell goes: SF's staggered break-up, or (shatter) a crack front spreading from the struck point */
    const goneOf=c=>brk?GONE+.3*sd(c,brk)/Math.PI+c.h*.06:GONE+c.h*.55;
    const ripple=n=>{let hit=0;for(let i=0;i<A.length;i++){const a=A[i],d=sd(n,a),front=a.k*3.2;
      if(Math.abs(d-front)<.22)hit=Math.max(hit,1-a.k/.7);else if(d<front&&d<.5)hit=Math.max(hit,.4*(1-a.k/.7));}return hit;};
    function dome(buf,light,far){const [cx,cy]=centre(),g=geo(RAD,cx,cy),L=far?g.far:g.near;
      for(let i=0;i<L.length;i++){const n=L[i],x=n.x,y=n.y,appear=.05+(n.lat/(Math.PI/2))*.6+n.h*.08,gone=GT[n.ci];
        if(t<appear||t>gone)continue;
        if(far){if(n.e>.82&&bayer(x,y)<.5)buf.set(x,y,C[4]);continue;}
        const age=t-appear,end=gone-t,rim=n.rim,hit=A.length?ripple(n):0;
        const flash=age<.1||end<.08||t-flashT<.1;
        const sweep=Math.abs(frac(n.lon*.35+n.lat*.45-t*.55)-.5)<.04;
        if(n.e>.8){const c=flash||hit>.6?WHITE:hit>.2||sweep||rim>.75?C[1]:rim>.4?C[2]:C[3];
          if(flash||hit>.2||sweep||.5+rim>bayer(x,y))buf.set(x,y,c);}
        else{const a=(flash?.7:.08+.3*rim*rim)+hit*.6;if(a>bayer(x,y))buf.set(x,y,flash||hit>.5?C[1]:rim>.7?C[3]:C[4]);}
        if(!lite&&((x*7+y*3)&31)===0)light.glow(x,y,7,C[3],.15*LK+.4*hit);}
      if(!far)light.glow(cx,cy-RAD*.5,RAD*1.3,C[3],.22*LK*ringA);}
    /* Embervale: the base ring lies on the floor (a flat decal), so the dome stands in the diorama's perspective */
    function base(f){const gc=self.gc;if(!gc||ringA<=.01)return;const buf=new Px(f,f.color),light=new Px(f,f.light),[gx,gy]=gc;
      ringE(buf,gx,gy,RAD,RAD,2,pulse>.5?C[1]:C[2],ringA,a=>Math.sin(a)>0);
      ringE(buf,gx,gy,RAD,RAD,1.5,C[3],ringA*.8,a=>Math.sin(a)<=0);
      if(!lite)light.glow(gx,gy,RAD*1.05,C[4],(.16*LK+.35*pulse)*ringA);}
    function pane(c,cx,cy){if(panes>=(lite?14:44))return;panes++;
      const dx=c.x-cx,dy=c.y-(cy-RAD*.35),d=Math.hypot(dx,dy)||1,push=brk?-brk.so*R.range(20,70):0;
      ps.spawn(K.PANE,c.x*PX,c.y*PX,(dx/d)*R.range(50,150)+push,(dy/d)*R.range(30,90)-R.range(60,160),R.range(.75,1.2),R.pick([C[1],C[2],C[2]]),1);}
    const self={
      update(dt){t+=dt;const [cx,cy]=centre(),g=geo(RAD,cx,cy);
        for(let i=0;i<g.cells.length;i++)GT[i]=goneOf(g.cells[i]);
        if(t<.75)for(let i=0;i<(lite?1:3);i++){const [x,y]=surf(R.range(-Math.PI/2,Math.PI/2),Math.min((t/.65)*(Math.PI/2),1.5));
          ps.spawn(K.STAR,x*PX,y*PX,R.range(-20,20),R.range(-30,10),R.range(.2,.4),R.pick(SPARKS),R.range(.6,1.2));}
        for(const h of hits)if(t>=h.t&&!h.done){h.done=true;const [x,y]=surf(h.lon,h.lat);o.shake?.(.18);pulse=1;
          lights.push({x:x*PX,y:y*PX,r:80,color:C[2],k:.9,life:.18,max:.18});ps.spawn(K.GLINT,x*PX,y*PX,0,0,.05,WHITE,1.8);
          const base=h.traced?(h.lat>.9?-.6:0):Math.atan2(y-cy,x-cx),fan=h.traced?1:.85;
          for(let j=0;j<NSP;j++){const a=base+R.range(-1,1)*fan,sp=R.range(200,600)*SPK;ps.spawn(K.SPARK,x*PX,y*PX,Math.cos(a)*sp,Math.sin(a)*sp-80*SPK,R.range(.1,.35));}}
        for(let i=hits.length-1;i>=0;i--)if(hits[i].done&&t-hits[i].t>.75)hits.splice(i,1);
        A.length=0;for(const h of hits){const k=t-h.t;if(h.done&&k>=0&&k<=.7){h.k=k;A.push(h);}}
        if(t>GONE-.05&&t<GONE+.6)for(let i=0;i<(lite?1:brk?2:4);i++){const [x,y]=surf(R.range(-1.4,1.4),R.range(0,1.4));
          ps.spawn(R.chance(.5)?K.STAR:K.MOTE,x*PX,y*PX,R.range(-30,30),-R.range(20,80),R.range(.3,.7),R.pick(SPARKS),R.range(.6,1.4));}
        if(brk)for(let i=0;i<g.cells.length;i++){const c=g.cells[i];if(!c.far&&GT[i]>t-dt&&GT[i]<=t)pane(c,cx,cy);}
        ringA=smooth(0,.15,t)*(1-smooth(GONE-.05,GONE+.45,t));pulse=Math.max(0,pulse-dt/.2);
        ps.update(dt);stepLights(lights,dt);},
      draw(f,layer){if(layer==='ground')return base(f);const buf=new Px(f,f.color),light=new Px(f,f.light);
        if(layer!=='front')dome(buf,light,true);
        if(layer==='back')return;
        dome(buf,light,false);
        for(const h of hits){const k=(h.t-t)/.12;if(!h.traced||k<0||k>1)continue;
          const [x1,y1]=surf(h.lon,h.lat),x=x1+TR*k,y=y1-30*(TR/170)*k;
          seg(buf,x+14,y-2.5,x+6,y-1,TRACER_TAIL);seg(buf,x+6,y-1,x,y,TRACER);buf.set(Math.floor(x),Math.floor(y),TRACER_CORE);light.glow(x,y,8,TRACER,.5);}
        ps.draw(buf,light);drawLights(light,lights);},
      hit(x,y){const [cx,cy]=centre(),lat=Math.asin(clamp((cy-y/PX)/RAD,0,1));
        hits.push(trig({t,lon:Math.asin(clamp((x/PX-cx)/RAD/Math.max(.05,Math.cos(lat)),-1,1)),lat,traced:false,done:false}));},
      /* Embervale: a round from a direction on the sphere (lon 0 facing the camera, + to the right; lat 0 at the floor) */
      strike(lon,lat){if(hits.length<8)hits.push(trig({t,lon,lat,traced:false,done:false}));},
      drop(){GONE=Math.min(GONE,t);},
      shatter(lon,lat){if(brk||t>GONE)return;GONE=Math.min(GONE,t);brk=trig({lon,lat});const [x,y]=surf(lon,lat);
        o.shake?.(.3);lights.push({x:x*PX,y:y*PX,r:68,color:C[1],k:1,life:.22,max:.22});flashT=t-.04;},
      recolor(c){if(c===C)return;C=c;SPARKS=[WHITE,C[1],C[2]];ps.C=C;flashT=t;},
      stop(){self.drop();},
      done:()=>t>GONE+.6&&ps.list.length===0};
    return self;}

  /* ---------------- Holy Light (SF holy-light.ts) ---------------- */
  function holyLight(o={}){
    const R=new Rng(o.seed??1),ps=new Particles(R,()=>Infinity);
    const X=o.x??790,g=groundAt(o.ground,X),Y=o.y??(Number.isFinite(g)?g:600),cx=X/PX,cy=Y/PX;
    const H=o.colors??HOLY,W=o.width??13,SPARKS=[WHITE,H[1],H[2],H[3]],lite=!!o.lite;ps.C=H;
    /* Embervale fit: sideways throw (SP), feather spread (FS) and height (FH) scaled to the canvas; floor pool (PK) and rings (RK) */
    const SP=o.spread??1,FS=o.fspread??1,FH=o.fheight??1,PK=o.poolK??1,RK=o.ringK??1,NF=o.feathers??8,NST=lite?.5:1;
    const SLAM=o.windup??.42,NARROW=SLAM+(o.hold??2.13),OUT=NARROW+.5,TOP=o.top??0,FT=(cy-TOP)*(o.topFade??.28);
    const fitB=o.fitB??1e9,fitG=o.fitG??1e9;
    let t=0,slammed=false,lastHalo=-1;
    const halos=[],feathers=[];
    const width=t=>t<SLAM?0:t<NARROW?W*(1+.35*Math.exp(-(t-SLAM)*9)):lerp(W,.6,outCubic((t-NARROW)/.4));
    const strands=Array.from({length:11},(_,i)=>({o:(hash(i,1)-.5)*1.7,w:.04+hash(i,2)*.07,f:1+hash(i,3)*2,wob:0}));
    const topK=y=>FT>0?clamp((y-TOP)/FT):1;
    const self={
      update(dt){t+=dt;
        o.darken?.(.35*smooth(0,.4,t)*(1-smooth(NARROW,OUT+.2,t)));
        if(t>=SLAM&&!slammed){slammed=true;o.flash?.(.85,'255,240,196');o.shake?.(.55);o.ripple?.(X,Y-20,20,340,.6,.18,40);
          for(let i=0;i<Math.round(50*NST);i++){const s=R.sign(),sp=R.range(120,520)*SP;
            ps.spawn(K.STAR,X+s*R.range(0,20),Y-4,s*sp,-R.range(40,260),R.range(.4,1),R.pick(SPARKS),R.range(.8,2.2));}
          for(let i=0;i<NF;i++){const life=R.range(2.2,3);
            feathers.push({x:X+R.range(-120,120)*FS,y:Y-R.range(260,420)*FH,vy:R.range(28,50),a:0,life,max:life,s:R.int(0,1),seed:R.next()*10});}}
        const w=width(t);
        if(t>SLAM&&t<OUT){
          for(let i=0;i<2;i++)if(R.chance(.7*NST*clamp(w/W)))ps.spawn(R.chance(.7)?K.STAR:K.BOKEH,X+R.range(-w,w)*PX*1.4,Y-R.range(0,200)*FH,R.range(-10,10),-R.range(60,170),R.range(.6,1.3),R.pick(SPARKS),R.range(.7,2));
          if(t-lastHalo>.42&&t<NARROW){lastHalo=t;halos.push(t);}}
        else if(t<SLAM&&R.chance(.4)){const a=R.range(0,TAU),d=R.range(40,90);
          ps.spawn(K.STAR,X+Math.cos(a)*d,Y-6+Math.sin(a)*d*.3,-Math.cos(a)*d*2.5,-Math.sin(a)*d*.6,.38,H[2],R.range(.6,1.2));}
        for(let i=feathers.length-1;i>=0;i--){const f=feathers[i];if((f.life-=dt)<=0)feathers.splice(i,1);
          if(f.y>Y-4)f.vy=0;f.x+=Math.sin(t*2.4+f.seed)*34*dt;f.y+=f.vy*dt;f.a=Math.sin(t*2.4+f.seed-.6)*.5;}
        for(let i=halos.length-1;i>=0;i--)if(t-halos[i]>.9)halos.splice(i,1);
        for(const s of strands)s.wob=.05*Math.sin(t*s.f+s.o*9);
        ps.update(dt);},
      draw(f,layer){const buf=new Px(f,f.color),light=new Px(f,f.light);
        if(layer==='ground'){floor(buf,light);return;}
        if(layer!=='front')column(buf,light);
        if(layer!=='back'){
          if(t>SLAM&&t<SLAM+.12)light.glow(cx,cy-20,Math.min(140,fitB),H[2],1.2*(1-(t-SLAM)/.12));
          for(const fe of feathers){const a=Math.min(1,fe.life/.6,(fe.max-fe.life)/.3),sp=FEATHER[fe.s],fx=fe.x/PX,fy=fe.y/PX,ca=Math.cos(fe.a),sa=Math.sin(fe.a);
            for(let r=0;r<3;r++)for(let k=0;k<5;k++){if(sp[r][k]!=='#')continue;const lx=k-2,ly=r-1;
              dot(buf,fx+lx*ca-ly*sa,fy+lx*sa+ly*ca,r===0?WHITE:r===1?H[1]:H[2],a);}
            light.glow(fx,fy,5,H[2],.2*a);}
          ps.draw(buf,light);}},
      lamp:()=>{const k=t<SLAM?smooth(0,SLAM,t)*.25:(1-smooth(NARROW,OUT,t))*(.7+1.1*Math.exp(-(t-SLAM)/.12));return k>.02?{i:k*(o.lampI??1.2),c:c3(H[3]),r:o.lampR??220,h:60}:null;},
      groundDone:()=>t>OUT&&t>SLAM+.7,
      done:()=>t>OUT+.5&&ps.list.length===0&&feathers.length===0};
    /* the floor: SF's pool and ground rings, drawn on a flat decal centred on the base (self.gc) */
    function floor(buf,light){const gc=self.gc;if(!gc)return;const [gx,gy]=gc;
      const gl=t<SLAM?smooth(0,SLAM,t)*.5:1-smooth(NARROW,OUT,t);
      if(gl>.01){const rx=(10+(t<SLAM?14*t:34+4*Math.sin(t*5)))*PK,ry=rx*.86;
        for(let y=Math.floor(gy-ry);y<=gy+ry;y++)for(let x=Math.floor(gx-rx);x<=gx+rx;x++){
          const dx=(x+.5-gx)/rx,dy=(y+.5-gy)/ry,d=Math.sqrt(dx*dx+dy*dy);if(d>1)continue;const u=d/Math.max(.05,gl);
          if(d<.7*gl||bayer(x,y)<gl*(1-d)*2.2)buf.set(x,y,u<.35?H[1]:u<.65?H[2]:u<.9?H[3]:H[4]);}
        light.glow(gx,gy,Math.min(rx*2.2,fitG),H[3],.5*gl);}
      for(let i=0;i<2;i++){const k=(t-SLAM-.1*i)/.55,sc=i?.7:1;if(k<0||k>1)continue;const e=outCubic(k),r=(14+90*e*sc)*RK;
        ringE(buf,gx,gy,r,r*.94,(3*(1-k)+.5)*1.25,k<.25?WHITE:H[2],1.15-k);}}
    function column(buf,light){const w=width(t),top=TOP-2;
      if(t<SLAM){const a=smooth(0,SLAM*.8,t)*.7;for(let y=top;y<cy;y++)dot(buf,cx,y,H[1],a*(.4+.6*((y-top)/(cy-top)))*topK(y));
        light.glow(cx,top+10+FT*.6,40,H[3],a*.4);return;}
      if(w<=.05||t>OUT+.2)return;
      const fade=1-smooth(OUT-.25,OUT+.2,t);
      const yEnd=t-SLAM<.07?lerp(top,cy,inCubic(clamp((t-SLAM)/.07)*.5+.5)):cy;
      const x0=Math.floor(cx-w*1.3),x1=Math.ceil(cx+w*1.3),n=Math.min(512,x1-x0+1);
      for(let i=0;i<n;i++){const xx=(x0+i+.5-cx)/w,q=Math.abs(xx);let lvl=q<.2?0:q<.42?1:q<.66?2:q<.88?3:4;
        for(const s of strands)if(Math.abs(xx-s.o-s.wob)<s.w)lvl=Math.max(0,lvl-1);
        LV[i]=lvl;AL[i]=(q<.88?1:(1.3-q)/.42)*fade;TH[i]=q<.66?.2:1;}
      for(let y=Math.max(top,0);y<=yEnd;y++){const pulse=frac((y-top)*.02-t*1.9)<.07?1:0,tk=topK(y);
        for(let i=0;i<n;i++){const x=x0+i,a=AL[i]*tk;if(a<=bayer(x,y)*TH[i])continue;const lvl=Math.max(0,LV[i]-pulse);buf.set(x,y,lvl===0?WHITE:H[lvl]);}}
      bandGlow(light,cx,Math.max(top,0),yEnd,w*2.4+6,H[2],.32*fade);
      light.glow(cx,top+8+FT*.6,Math.min(70,fitB),H[3],.4*fade);
      for(const h0 of halos){const k=(t-h0)/.9;if(k<0||k>1)continue;
        ringE(buf,cx,cy-4-k*(cy-top)*.9,w*1.35*(1+k*.3),2.2,1,k<.3?WHITE:H[1],(1-k)*fade*topK(cy-4-k*(cy-top)*.9));}}
    return self;}
  /* SF lights the column with a glow every 8 rows (r = 2.4 w + 6); its sum is a band, so the light is laid row by row from one
     precomputed horizontal profile (same picture, a fraction of the cost), half strength at the column's ends like the sum */
  function bandGlow(light,cx,y0,y1,r,c,k){if(k<=.01||r<1)return;const x0=Math.max(light.ox,Math.floor(cx-r)),x1=Math.min(light.ox+light.w-1,Math.ceil(cx+r)),n=Math.min(512,x1-x0+1);
    for(let i=0;i<n;i++){const dx=(x0+i+.5-cx)/r;let s=0;for(let j=-Math.ceil(r/8);j<=Math.ceil(r/8);j++){const dy=j*8/r,d=dx*dx+dy*dy;if(d<1){const f=1-Math.sqrt(d);s+=f*f;}}GW[i]=s*k;}
    for(let y=Math.max(light.oy,Math.floor(y0)),ye=Math.min(light.oy+light.h-1,Math.floor(y1));y<=ye;y++){const e=Math.min(1,.5+.5*Math.min(y-y0,y1-y)/r);
      for(let i=0;i<n;i++)if(GW[i]>.004)light.add(x0+i,y,c,GW[i]*e);}}

  /* ---------------- shared SF particles: stars, motes, glints, sparks (shield), bokeh (holy), panes (shatter) ---------------- */
  class Particles{
    constructor(R,ground){this.list=[];this.t=0;this.R=R;this.ground=ground;this.C=ICE;}
    spawn(k,x,y,vx,vy,life,col=0,size=1){this.list.push({k,x,y,vx,vy,life,max:life,col,size,seed:this.R.next()*100});}
    update(dt){this.t+=dt;const L=this.list;
      for(let i=L.length-1;i>=0;i--){const p=L[i];if((p.life-=dt)<=0){L.splice(i,1);continue;}
        switch(p.k){
          case K.STAR:p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.6*dt+10*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case K.MOTE:p.vx-=p.vx*.6*dt;p.vy-=p.vy*.6*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case K.BOKEH:p.vx-=p.vx*.8*dt;p.vy-=p.vy*.8*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case K.GLINT:break;
          case K.SPARK:{p.vy+=GRAVITY*.45*dt;p.vx-=p.vx*2.2*dt;p.vy-=p.vy*2.2*dt;const g=this.ground(p.x),ny=p.y+p.vy*dt;p.x+=p.vx*dt;
            if(p.vy>0&&p.y<=g&&ny>=g){p.vy=-p.vy*.45;p.vx*=.7;p.y=g-.5;}else p.y=ny;break;}
          case K.PANE:{p.vy+=GRAVITY*.55*dt;p.vx-=p.vx*.8*dt;const g=this.ground(p.x),ny=p.y+p.vy*dt;p.x+=p.vx*dt;
            if(p.vy>0&&p.y<=g&&ny>=g){p.y=g-.5;if(p.vy>160){p.vy=-p.vy*.35;p.vx*=.6;}else{p.vy=0;p.vx*=.4;p.size=0;p.life=Math.min(p.life,.4);}}else p.y=ny;break;}}}}
    draw(buf,light){for(const p of this.list)this.drawOne(p,buf,light);}
    drawOne(p,buf,light){const k=p.life/p.max,ax=p.x/PX,ay=p.y/PX,px=Math.floor(ax),py=Math.floor(ay),C=this.C;
      switch(p.k){
        case K.STAR:{const tw=.6+.4*Math.sin(this.t*(8+(p.seed%5))+p.seed);
          if(p.size<1){if(tw*k>.25)buf.set(px,py,tw>.8?WHITE:p.col);light.glow(ax,ay,3,p.col,.4*k*tw);break;}
          const arm=Math.max(1,Math.round(p.size*tw*Math.min(1,k*3))),tip=scale(p.col,.75);
          for(let d=1;d<=arm;d++){const cc=d===arm&&arm>1?tip:p.col;buf.set(px+d,py,cc);buf.set(px-d,py,cc);buf.set(px,py+d,cc);buf.set(px,py-d,cc);}
          if(arm>=3)for(let j=0;j<4;j++)buf.set(px+(j&1?-1:1),py+(j&2?-1:1),tip);
          buf.set(px,py,WHITE);light.glow(ax,ay,3+arm*2,p.col,.5*k*tw);break;}
        case K.MOTE:{const sp=Math.hypot(p.vx,p.vy)||1,ux=p.vx/sp,uy=p.vy/sp,len=Math.min(16,.5+sp*.013)*p.size;
          if(k<.35&&bayer(px,py)>k/.35)break;
          buf.line(ax-ux*len,ay-uy*len,ax-ux*len*.35,ay-uy*len*.35,scale(p.col,.55));buf.line(ax-ux*len*.4,ay-uy*len*.4,ax,ay,p.col);light.glow(ax,ay,2.5+p.size,p.col,.4*k);break;}
        case K.GLINT:{const r=p.size*(.5+k*.5);buf.disc(ax,ay,r+.8,DEEP_ORANGE);buf.disc(ax,ay,r,p.col===WHITE?HOT:p.col);light.glow(ax,ay,p.size*4,p.col,.6*k);break;}
        case K.SPARK:{const hot=k>.6?HOT:k>.3?YELLOW:ORANGE,sp=Math.hypot(p.vx,p.vy)||1,ux=p.vx/sp,uy=p.vy/sp,len=Math.min(9,1+sp*.011);
          buf.line(ax-ux*len,ay-uy*len,ax-ux*len*.4,ay-uy*len*.4,k>.5?hot:DEEP_ORANGE);buf.line(ax-ux*len*.45,ay-uy*len*.45,ax,ay,hot);light.glow(ax,ay,3,hot,.45*k);break;}
        case K.BOKEH:{const br=.7+.3*Math.sin(this.t*(2+(p.seed%3))+p.seed),a=Math.min(1,(1-k)*5)*Math.min(1,k*3)*br;if(a<.05)break;
          buf.alphaDisc(ax,ay,p.size,p.col,.45*a);buf.alphaDisc(ax,ay,p.size*.5,WHITE,.5*a);light.glow(ax,ay,3+p.size*3,p.col,.35*a);break;}
        case K.PANE:{const F=PANE[p.size?Math.floor(this.t*14+p.seed)&3:0],a=Math.min(1,k/.4),hi=k>.8?WHITE:C[1],h=F.length,w=F[0].length;
          for(let r=0;r<h;r++)for(let q=0;q<w;q++){const ch=F[r][q];if(ch==='.')continue;dot(buf,px-(w>>1)+q,py-(h>>1)+r,ch==='a'?hi:ch==='b'?C[2]:C[3],a);}
          light.glow(ax,ay,4,C[2],.3*a);break;}}}}
  function stepLights(lights,dt){for(let i=lights.length-1;i>=0;i--)if((lights[i].life-=dt)<=0)lights.splice(i,1);}
  function drawLights(light,lights){for(const l of lights){const k=l.life/l.max;light.glow(l.x/PX,l.y/PX,(l.r/PX)*(.55+.45*k),l.color,l.k*k*k);}}
  function seg(buf,x0,y0,x1,y1,c,a=1){const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)*2));for(let i=0;i<=n;i++)dot(buf,x0+((x1-x0)*i)/n,y0+((y1-y0)*i)/n,c,a);}
  function ringE(buf,cx,cy,rx,ry,thick,c,a=1,keep){const n=Math.ceil(Math.max(rx,ry)*TAU*1.3);
    for(let j=0;j<n;j++){const ang=(j/n)*TAU;if(keep&&!keep(ang))continue;const ca=Math.cos(ang),sa=Math.sin(ang);
      for(let o=-thick/2;o<=thick/2;o+=.5)dot(buf,cx+ca*(rx+o),cy+sa*(ry+o*(ry/Math.max(1,rx))),c,a);}}

  /* ---------------- Embervale wrappers ---------------- */
  let seed=1;
  const DOME={RAD:38};
  /* the dome on an entity (the hero): a split bill canvas following it (far half behind, near half in front) + its floor ring */
  function pxShieldholyDome(o={}){const p=o.follow||P;if(!p||!gl)return null;const RAD=o.radius??DOME.RAD,w=o.w??(2*RAD+64),hh=RAD+30,lite=!!PERF.lite;
    let fx=null;
    const H=pxfx(c=>(fx=shield({actor:c.actor,ground:c.y,radius:RAD,hold:o.hold??Infinity,colors:o.colors,hits:o.hits??[],tracer:o.tracer,light:o.light??clamp(1.3-(ambCur[0]*.3+ambCur[1]*.59+ambCur[2]*.11),.3,1),spark:o.spark??.6,sparks:o.sparks??(lite?6:10),lite,
      seed:o.seed??seed++,shake:tr=>PXK.shake(tr*(o.shk??.45))})),{follow:p,split:true,w,hh,ay:hh-4,ttl:o.ttl??900,pri:2});
    if(!H||!fx)return null;
    const gw=2*RAD+8;
    const G=pxfx(c=>{fx.gc=[c.x/PX,c.y/PX];return{update(){},draw(fr){fx.draw(fr,'ground');},done:()=>fx.done()||!PXFX.list.includes(H)};},
      {follow:p,mode:'flat',w:gw,hh:gw,ax:gw/2,ay:gw/2,ttl:o.ttl??900,pri:2,nolight:lite});
    return{H,G,fx};}
  /* a pillar of light at a floor point: a bill canvas for the column, feathers and motes + a flat floor decal for the pool and rings */
  function pxShieldholyPillar(x,y,o={}){if(!gl)return null;const w=o.w??160,hh=o.hh??200,ring=o.ring??80,lite=!!PERF.lite,pri=o.pri??1;
    let fx=null,dk=false;const fl=o.flash||0,sh=o.shake||0,col=o.colors??HOLY;
    const H=pxfx(c=>(fx=holyLight({x:c.x,y:c.y,width:o.width??13,hold:o.hold,windup:o.windup,colors:col,seed:o.seed??seed++,feathers:lite?Math.min(3,o.feathers??8):o.feathers,lite,
      spread:o.spread??clamp((w/2-12)/150,.2,1),fspread:clamp((w/2-14)/60,.2,1),fheight:clamp((hh-14)/210,.3,1),poolK:o.pool??.7,ringK:ring/104,topFade:o.topFade,
      fitB:w/2-2,fitG:ring+4,lampI:o.lampI,lampR:o.lampR,
      shake:sh?tr=>PXK.shake(tr*sh):null,flash:fl?(k,cc)=>PXK.flash(k*fl,o.flashC||cc):null,
      darken:o.darken?k=>{if(dk||k<.02)return;dk=true;tintFx([.3,.26,.46],o.darken,Math.max(.6,(o.windup??.42)/.12));}:null})),
      {x,y,w,hh,ay:hh-4,lamp:o.lamp!==false&&!lite,pri,ttl:9});
    if(!H||!fx)return null;
    const gw=Math.min(256,Math.ceil(2*ring+14));
    pxfx(c=>{fx.gc=[c.x/PX,c.y/PX];return{update(){},draw(fr){fx.draw(fr,'ground');},done:()=>fx.groundDone()||!PXFX.list.includes(H)};},
      {x,y,mode:'flat',w:gw,hh:gw,ax:gw/2,ay:gw/2,pri,ttl:9,nolight:!!o.nolight||lite});
    return H;}
  /* a quick smite on a foe (Beacon, Dawnbreaker, Chains of Light): SF's Smite, narrower and quicker, at most 8 at once */
  const SMITES=new Set();
  function pxShieldholySmite(x,y,o={}){let n=0;for(const H of SMITES){if(PXFX.list.includes(H))n++;else SMITES.delete(H);}
    if(n>=(PERF.lite?3:8))return null;
    const H=pxShieldholyPillar(x,y,{width:o.width??6,hold:o.hold??.3,windup:o.delay??0,feathers:o.feathers??2,w:72,hh:o.hh??150,ring:o.ring??30,pool:.42,
      shake:o.shake??.1,lamp:false,nolight:true,colors:o.colors,seed:o.seed});
    if(H)SMITES.add(H);return H;}
  function smiteAll(L,x0,y0,k){const seen=new Set();for(const e of L){if(!e||seen.has(e))continue;seen.add(e);
    pxShieldholySmite(e.x,e.y+2,{delay:Math.min(.28,Math.hypot(e.x-x0,e.y-y0)*k)+Math.random()*.03,width:e.boss?8:6});}}

  /* ---------- the hero's barrier: one dome while P.shield > 0 (Aegis, Barrier, Dragon Guard, Aurora, Shell Ward...) or Divine Shield holds ---------- */
  let dome=null,curSrc=null;
  const wantDome=()=>!!(P&&!P.dead&&(P.shield>0||P.divine));
  /* where a blow lands on the dome: its source's direction on the floor (lon) and height (lat) */
  function hitDir(src){const p=P;if(src&&typeof src.x==='number'&&Math.hypot(src.x-p.x,src.y-p.y)>4){
      const z=typeof src.z==='number'?src.z:src.d?(src.d.fly||0)+26*(src.s||1):24;return[Math.atan2(src.x-p.x,src.y-p.y),Math.asin(clamp(z/(DOME.RAD*PIX),.12,.92))];}
    return[(Math.random()*2-1)*1.2,.3+Math.random()*.6];}
  onEv('pxShield',()=>{try{if(dome){const [lon,lat]=hitDir(curSrc);dome.fx.strike(lon,lat);dome.fx.shatter(lon,lat);dome=null;}}catch(err){}});
  {const o=hurtPlayer;hurtPlayer=function(amt,src){const p=P,s0=p?p.shield:0,pc=p?p.phoenixCd||0:0,dv=!!(p&&p.divine&&p.invul>0&&!p.dead);curSrc=src;let r;
    try{r=o(amt,src);}finally{curSrc=null;}
    try{if(p&&p===P){if(dome&&((s0>0&&p.shield<s0&&p.shield>0)||(dv&&amt>0))){const [lon,lat]=hitDir(src);dome.fx.strike(lon,lat);}
      if(p.phoenixCd>pc+60&&!p.dead){claimBeams();phoenixPillar(p);}}}catch(err){}
    return r;};}

  /* ---------- pillars: Judgement (lands at the ground's delay), Holy Light (+ Beacon smites), Avatar, Dawnbreaker, Chains, Phoenix, waystones ---------- */
  const HIT={on:null};
  onEv('pxHit',(e,dmg,src,opt)=>{if(src!==P||!e||opt.dot)return;if(HIT.on){HIT.on.push(e);return;}
    if(opt.big&&opt.dt==='light'&&opt.color==='#fff0a0')pxShieldholySmite(e.x,e.y+2,{delay:Math.random()*.14,width:e.boss?9:7,hold:.4});});
  const claimBeams=()=>{for(const f of fxs)if(f.type==='beam')f.pxh=1;};
  const JUDGE={width:15,hold:.75,ring:72,pool:.8,flash:.38,shake:.35,darken:.3};
  function judgePillar(x,y,windup){return pxShieldholyPillar(x,y,{...JUDGE,windup});}
  function phoenixPillar(p){return pxShieldholyPillar(p.x,p.y,{windup:0,width:14,hold:1.1,ring:80,pool:.75,colors:FIRE,flash:.35,flashC:'255,190,120',shake:.3,feathers:10,lampI:1.4});}
  {const o=ground;ground=function(g){const r=o(g);try{if(r&&r.kind==='judge'&&r.team==='p'&&P)judgePillar(r.x,r.y,Math.max(.05,(r.delay||0)-(r.t||0)));}catch(err){}return r;};}
  {const o=ABIL.holy;ABIL.holy=function(p,i,a,ab){HIT.on=p===P&&p.flags&&p.flags.has('smite')?[]:null;let r;
    try{r=o.call(this,p,i,a,ab);}finally{const L=HIT.on;HIT.on=null;
      try{if(p===P){claimBeams();pxShieldholyPillar(p.x,p.y,{windup:0,width:11,hold:.55,ring:40,pool:.55,flash:.22,shake:.25,feathers:6});if(L&&L.length)smiteAll(L,p.x,p.y,.0014);}}catch(err){}}
    return r;};}
  {const o=ABIL.avatar;ABIL.avatar=function(p,i,a,ab){const r=o.call(this,p,i,a,ab);
    try{if(p===P){claimBeams();pxShieldholyPillar(p.x,p.y,{windup:0,width:14,hold:2.13,ring:96,pool:.75,flash:.35,shake:.25,feathers:8,lampI:1.5,lampR:300});}}catch(err){}return r;};}
  {const o=applyG;applyG=function(g){const dawn=!!(g&&g.kind==='dawn'&&g.team==='p');if(dawn)HIT.on=[];let r;
    try{r=o(g);}finally{if(dawn){const L=HIT.on;HIT.on=null;try{if(L&&L.length)smiteAll(L,g.x,g.y,.0005);}catch(err){}}}return r;};}
  const wayAt=(x,y)=>{for(const w of WAYSTONES)if(Math.abs(w.wx-x)<220&&Math.abs(w.wy-y)<220)return w;return null;};
  onEv('update',()=>{try{
    /* the barrier dome follows the game state */
    if(dome&&!PXFX.list.includes(dome.H))dome=null;
    const want=wantDome(),gold=!!(P&&P.divine);
    if(want&&!dome){dome=pxShieldholyDome({colors:gold?HOLY:ICE});if(dome)dome.gold=gold;}
    else if(!want&&dome){dome.fx.drop();dome=null;}
    else if(dome&&dome.gold!==gold){dome.gold=gold;dome.fx.recolor(gold?HOLY:ICE);}
    /* waystone beams (attune, travel, region arrival): every new fxs beam standing in a waystone's light */
    for(const f of fxs){if(f.type!=='beam'||f.pxh)continue;f.pxh=1;if(f.t>.35||!wayAt(f.x,f.y))continue;const c=f.c||[1,.85,.45],warm=c[0]>.9&&c[2]<.7;
      pxShieldholyPillar(f.x,f.y,{windup:0,width:Math.round(clamp((f.w||90)/7,9,14)),hold:.85,ring:60,pool:.6,colors:warm?HOLY:PXK.rampOf(c),flash:.14,shake:.12,feathers:6});}
  }catch(err){}});
  onEv('respawn',()=>{dome=null;});onEv('resetWorld',()=>{dome=null;});

  /* ---------- lab ---------- */
  const at=(x,y,z)=>({x,y,z});
  pxlab('shieldholy-dome','Hex dome (SF demo: 4 rounds, breaks)','Shield','sf',()=>pxShieldholyDome({hold:2.75,hits:HITS,tracer:96,w:212,spark:1,sparks:14}));
  pxlab('shieldholy-barrier','Barrier: absorbs, then shatters','Shield','orig',(x,y)=>{if(!P)return;P.invul=0;P.shield=Math.max(P.shield,90);P.shieldT=9;
    later(.9,()=>{P.invul=0;hurtPlayer(24,at(x,y,30));});later(1.35,()=>{P.invul=0;hurtPlayer(24,at(P.x-70,P.y-30,64));});later(1.8,()=>{P.invul=0;hurtPlayer(26,at(P.x+20,P.y+80,20));});later(2.3,()=>{P.invul=0;hurtPlayer(60,at(x,y,40));});});
  pxlab('shieldholy-fade','Barrier: times out (SF break-up)','Shield','sf',()=>{if(!P)return;P.shield=Math.max(P.shield,40);P.shieldT=1.6;});
  pxlab('shieldholy-divine','Divine Shield (gold dome)','Shield','orig',(x,y)=>{if(!P)return;P.divine={t:2.5,tick:0,i:7};P.invul=Math.max(P.invul,2.5);
    later(.95,()=>hurtPlayer(20,at(x,y,30)));later(1.5,()=>hurtPlayer(20,at(P.x-60,P.y-40,50)));});
  pxlab('shieldholy-pillar','Holy Light pillar (SF)','Holy','sf',(x,y)=>pxShieldholyPillar(x,y,{flash:.5,shake:.4,darken:.3}));
  pxlab('shieldholy-smite','Smite (SF)','Holy','sf',(x,y)=>pxShieldholyPillar(x,y,{width:7,hold:.6,seed:4,w:96,hh:180,ring:44,pool:.5,shake:.2,feathers:8,lamp:false}));
  pxlab('shieldholy-judge','Judgement (hammer of light)','Holy','orig',(x,y)=>judgePillar(x+40,y,.55));
  pxlab('shieldholy-smites','Quick smites (Beacon / Dawnbreaker)','Holy','orig',(x,y)=>{for(let k=0;k<4;k++)pxShieldholySmite(x-30+k*46,y+(k%2?22:-14),{delay:k*.06});});
  pxlab('shieldholy-phoenix','Phoenix Heart (fire pillar)','Holy','orig',()=>P&&phoenixPillar(P));
  pxlab('shieldholy-way','Waystone pillar (frost)','Holy','orig',(x,y)=>pxShieldholyPillar(x,y,{windup:0,width:12,hold:.85,ring:60,pool:.6,colors:PXK.rampOf([.6,.9,1]),shake:.12,feathers:6}));
  return{pxShieldholyDome,pxShieldholyPillar,pxShieldholySmite};})();
