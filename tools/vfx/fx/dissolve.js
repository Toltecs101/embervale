/* DISSOLVE (original, in Sprite Fusion's style; its tongues and fire puffs follow SF "Fire", its sparks, cinders and ash SF "Embers",
   MIT): "Ember Dissolve", every enemy death burns the body away. killEnemy snapshots the dying creature's sprite (the pixels it was
   drawn with on the last frame; deaths off screen keep the game's fade; the lab's stand-ins use their idle frame) and a noise-driven
   burn front sweeps it from the feet up: the body chars ahead of a 2 px white-hot line, small flame tongues lick up off the line, and
   the burnt pixels lift off as sparks, cinders, ash and a little smoke. While a dissolve owns a dying enemy, renderEnemy skips only its
   sprite (shadow, death motes and everything else stay the game's); the game's own death burst, flash and dust from killEnemy are kept.
   At most 10 dissolves at once (5 on lite): extra deaths fall back to the game's normal fade. Bosses burn slower (1.4 s) on a bigger
   canvas, shed burning chunks and light the arena.
   Recipe (art px; bh = body height in px; keys and bands in rows):
   - Timeline: frame 1 (t <= 1/60) the whole body white, frame 2 (to 2/60) the body in fire-ramp steps by its own luminance (> .62
     #fff3a6, > .4 #ffe26b, > .22 #ff8a2a, else #f2561d). From 2/60 s the front F runs from the feet to past the head over D = 0.7 s
     (bosses 1.4 s), easing in (u (0.7 + 0.3 u)). Until 0.1 s the body's outline glows #ff8a2a, until 0.16 s #c9281f. done() once every
     pixel is gone and the last spark / ash / puff / chunk has died (about D + 0.9 s).
   - Burn key per pixel: rows above the feet + A noise2(.085 x, .085 y) + 0.7 hash, A = clamp(.16 bh, 2.5, 10), so the front licks up
     in tongues of a few px. d = key - F. Ahead of it (d > 0) the creature keeps its lit colours, charring over the last
     W = clamp(.2 bh, 4, 11) rows: > .6 W 45 % to #4a2a26, > .3 W 80 % to #2a1a1e, > 1 row #170f14 with 20 % of those pixels flickering
     #c9281f, the last row #c9281f / #8a1f17 (the edge about to catch). The line: 1 row white, 1 row #ffe26b, then 1 row #ff8a2a at
     55 % Bayer dither. Below that the pixel is gone: 1 in ~6 lifts off as a spark or cinder, half as many as ash, 1 in ~50 as smoke
     (capped 120 particles, bosses 280, lite 60).
   - Tongues (SF Fire): on ~30 % of the columns (fixed by hash), rooted on the line's top pixel: 4 nested teardrops [width, height,
     step] [1, 1, #c9281f] [.76, .86, #ff8a2a] [.54, .68, #ffe26b] [.3, .42, white], height (2 - 5.5 px) x size (bh / 30, 1 - 2.2)
     x (1 +- .25 noise at 3.3/s), half-width 1 - 1.4 x sqrt size, swaying +-1.5 px and leaning in toward the body's middle; they fade
     in over the first 10 % of the sweep and shrink by a third toward its end. Drawn outermost first. Fire puffs (SF Fire): .7 per
     frame (bosses 1.6), radius 1 - 1.8 px x sqrt size, 40 - 80 up, 0.16 - 0.3 s, stacked discs cooling through the 9-step ramp.
   - Layers: one 'bill' canvas anchored at the feet, amb 0: the body, char, ash and smoke take the zone's ambient themselves (the
     sprite's x1.3 with 40 % ambient, so it matches the lit sprite), the fire stays emissive. Colour, back to front: smoke, body, tongues,
     puffs, chunks, ash, cinders, sparks. Light: the line glows r 4 (bosses 7) #ff8a2a .3 every 3rd column; every 3rd tongue a warm glow
     r 9 x sqrt size #ffb060 .3 x flicker; puffs r 2.4 r + 2 at .18 k; sparks r 3 .3 k; cinders r 5 .35 / r 9 .45; chunks r 5 .3 k;
     the death pop r .6 bh #ff8a2a .5 e^(-t/.07) plus r .3 bh #fff3a6 .4 e^(-t/.04). lamp (bosses): warm, .8 pop + .5 while burning, r 180.
   - Palette: fire #ffffff #fff3a6 #ffe26b #ffc23d #ff8a2a #f2561d #c9281f #8a1f17 #4a1712; char #4a2a26 #2a1a1e #170f14; ash #5a5160
     #3a3442; smoke #7b6f72 #5d5660 #433d48 #2b2630 #1a171e; glow #ffb060.
   - Motion (SF numbers, effect units): sparks 1 px, vx +-30 + 1.2 x offset from the body's middle, vy -60..-160, buoyancy
     (-90 + 40 sin(3t + seed)) dt, wiggle 90 cos(2.3t + seed) dt, damped 1.6/s, life .35-.8 s (bosses .5-1.1): yellow/orange flicker while
     k > .5, orange, then #c9281f below .2. Cinders (12 %, bosses 25 %; a third big) a plus sign or a core over a 60 % rim, core by heat.
     Ash 2 px #5a5160 over #3a3442 tumbling, vy -30..-70, sway 10 sin(2t + seed), dithered in over 1/8 and out over the last 1/3. Smoke
     (SF Fire) three alpha discs, 1.6-2.6 px, rising 20-40 at 32/s^2, .8-1.3 s. Boss chunks: 3-5 lumps r 3-5 px from 35-80 % up break off
     charred when the char band reaches them, thrown out 40-110 and up 60-160, .75 g, bounce x.3 above 140, rim cooling #ff8a2a ->
     #f2561d -> #c9281f, dithered out over the last 35 % of 1.3 s. Everything is faded by the Bayer dither within 6 px of the canvas
     sides and top.
   - Feel: no shake (the game's death has its own). The body reads as the creature for a beat, then a bright line eats it upward. */
const {pxDissolve}=(function(){'use strict';const {Px,dot,Rng,mix,scale,ramp,hex,rgb,cl:clamp,PXW:PX,hash,noise2,lum,WHITE}=PXK;
  const FIRE=['#ffffff','#fff3a6','#ffe26b','#ffc23d','#ff8a2a','#f2561d','#c9281f','#8a1f17','#4a1712'].map(hex);
  const CHAR=['#4a2a26','#2a1a1e','#170f14'].map(hex),ASH=['#5a5160','#3a3442'].map(hex),SMOKE=['#7b6f72','#5d5660','#433d48','#2b2630','#1a171e'].map(hex),WARM=hex('#ffb060');
  const LIT=1.3,AMB=.4,GRAVITY=1900,SPARK=0,CINDER=1,ASHK=2,PUFF=3,SMOKEK=4;
  const LAYERS=[[1,1,6],[.76,.86,4],[.54,.68,2],[.3,.42,0]];
  /* Sprite Fusion's tongue: 4 nested teardrops, rim to heart, drawn row by row up from its base */
  function tongue(buf,x,y,h,w,sx,t,n){if(h<1)return;
    for(const [lw,lh,ri] of LAYERS){const H=h*lh,col=FIRE[ri];
      for(let r=0;r<=H;r++){const u=r/Math.max(1,H),half=w*lw*Math.pow(1-u,.85)*Math.min(1,(r+1.5)/3.5)+noise2(t*9+r*.45,n)*.5,cx=x+sx*u*u*lh+noise2(t*4+r*.2,n+7)*u*1.1;
        if(half<.3)continue;for(let px=Math.round(cx-half);px<=Math.round(cx+half);px++)buf.set(px,Math.round(y-r),col);}}}
  function dissolve(o){
    const S=o.sil,R=new Rng(o.seed??1),D=o.dur??.7,boss=!!o.boss,lite=!!o.lite,G=o.ground,CW=o.w,T0=2/60,sd=(o.seed??1)%997;
    const W=S.w,HS=S.h,on=(i,j)=>i>=0&&j>=0&&i<W&&j<HS&&(S.data[j*W+i]>>>24)>0;let n=0;for(let i=0;i<W*HS;i++)if(S.data[i]>>>24)n++;
    const X=new Int16Array(n),Y=new Int16Array(n),COL=new Uint32Array(n),LC=new Uint32Array(n),LC1=new Uint32Array(n),LC2=new Uint32Array(n),FL=new Uint8Array(n),HOT=new Uint32Array(n),KEY=new Float32Array(n),ST=new Uint8Array(n),CHK=new Uint8Array(n),RIM=new Uint8Array(n);
    let top=1e9,bot=-1e9,cx=0;
    for(let j=0,k=0;j<HS;j++)for(let i=0;i<W;i++){const v=S.data[j*W+i];if(!(v>>>24))continue;X[k]=S.x+i;Y[k]=S.y+j;COL[k]=scale(v|0xff000000,LIT);
      const l=lum(v);HOT[k]=l>.62?FIRE[1]:l>.4?FIRE[2]:l>.22?FIRE[4]:FIRE[5];RIM[k]=on(i-1,j)&&on(i+1,j)&&on(i,j-1)&&on(i,j+1)?0:1;
      FL[k]=(hash(k,3)<.2?1:0)|(hash(k,5)<.5?2:0)|(hash(k,7)<.4?4:0)|(hash(k,7)<.16?8:0);cx+=X[k];k++;if(j<top)top=j;if(j>bot)bot=j;}
    const bh=Math.max(1,bot-top+1),A=clamp(bh*.16,2.5,10),WC=clamp(bh*.2,4,11),sz=clamp(bh/30,1,2.2),sS=Math.sqrt(sz);cx=n?cx/n:S.x+W/2;
    let kmin=1e9,kmax=-1e9;
    for(let k=0;k<n;k++){const v=(S.y+bot-Y[k])+A*noise2(X[k]*.085,Y[k]*.085,sd)+.7*(hash(k,sd)-.5);KEY[k]=v;if(v<kmin)kmin=v;if(v>kmax)kmax=v;}
    if(!n)kmin=kmax=0;
    const span=kmax-kmin+5,ORD=Uint32Array.from({length:n},(_,i)=>i).sort((a,b)=>KEY[a]-KEY[b]);
    const bcx=cx,bcy=S.y+top+bh*.55,maxP=lite?60:boss?280:120,pE=Math.min(.3,maxP*.55/Math.max(1,n)),pA=pE*.5,pS=pE*.12;
    const parts=[],chunks=[],colF=new Int16Array(CW),fcol=new Int16Array(CW),TG=new Uint8Array(CW);let t=0,ptr=0,nf=0;
    for(let x=0;x<CW;x++)TG[x]=hash(x*31+sd,11)<(lite?.12:.22)?1:0;
    /* the zone's ambient on the body, char, ash and smoke (x LIT, 40 % ambient, as the bridge's amb would), the fire stays emissive */
    const CL=CHAR.slice(),AL=ASH.slice();let a0=-1,a1=-1,a2=-1,ar=1,ag=1,ab=1;
    const amc=c=>rgb(Math.min(255,(c&255)*ar),Math.min(255,((c>>>8)&255)*ag),Math.min(255,((c>>>16)&255)*ab),c>>>24);
    function relight(){const a=ambCur;if(Math.abs(a[0]-a0)+Math.abs(a[1]-a1)+Math.abs(a[2]-a2)<.01)return;a0=a[0];a1=a[1];a2=a[2];
      ar=1-AMB+AMB*a0;ag=1-AMB+AMB*a1;ab=1-AMB+AMB*a2;for(let i=0;i<3;i++)CL[i]=amc(CHAR[i]);for(let k=0;k<n;k++){const c=amc(COL[k]);LC[k]=c;LC1[k]=mix(c,CL[0],.45);LC2[k]=mix(c,CL[1],.8);}AL[0]=amc(ASH[0]);AL[1]=amc(ASH[1]);}
    relight();
    /* boss chunks: lumps marked on the body, freed when the char band reaches them */
    const lumps=[];
    if(boss&&n>200)for(let c=0,tries=0;c<(lite?2:R.int(3,5))&&tries<60;tries++){const k=R.int(0,n-1),q0=(KEY[k]-kmin)/(kmax-kmin||1);if(q0<.35||q0>.8||CHK[k])continue;
      const r=R.range(3,5),id=lumps.length+1,mx=X[k],my=Y[k];for(let q=0;q<n;q++)if(!CHK[q]&&(X[q]-mx)**2+(Y[q]-my)**2<=r*r)CHK[q]=id;lumps.push({id,key:KEY[k],x:mx,y:my,free:false});c++;}
    const prog=()=>clamp((t-T0)/D),F=()=>{const u=prog();return kmin-1.5+span*u*(.7+.3*u);};
    function spawn(k){const x=X[k]*PX+PX/2,y=Y[k]*PX+PX/2,r=R.next();
      if(r<pE){const cin=R.chance(boss?.25:.12),life=boss?R.range(.5,1.1):R.range(.35,.8);
        parts.push({k:cin?CINDER:SPARK,x,y,vx:R.range(-30,30)+(X[k]-bcx)*1.2,vy:-R.range(60,160),life,max:life,seed:R.next()*100,s:cin&&R.chance(.35)?2:1});}
      else if(r<pE+pA){const life=R.range(.6,1.1);parts.push({k:ASHK,x,y,vx:R.range(-20,20),vy:-R.range(30,70),life,max:life,seed:R.next()*100});}
      else if(r<pE+pA+pS&&!lite){const life=R.range(.8,1.3);parts.push({k:SMOKEK,x,y:y-6,vx:R.range(-6,6),vy:-R.range(20,40),life,max:life,size:R.range(1.6,2.6)*sS,seed:R.next()*100});}}
    function free(L){L.free=true;const px=[],py=[],pc=[],pr=[],ids=new Set();
      for(let q=0;q<n;q++)if(CHK[q]===L.id&&!ST[q])ids.add(Y[q]*4096+X[q]);
      for(let q=0;q<n;q++)if(CHK[q]===L.id&&!ST[q]){ST[q]=2;px.push(X[q]-L.x);py.push(Y[q]-L.y);pc.push(mix(LC[q],CL[1],.7));pr.push(ids.has((Y[q]+1)*4096+X[q])?0:1);}
      if(!px.length)return;const life=1.3;
      chunks.push({x:L.x*PX,y:L.y*PX,vx:Math.sign(L.x-bcx||R.sign())*R.range(40,110),vy:-R.range(60,160),life,max:life,px,py,pc,pr,rest:false});}
    return{
      update(dt){t+=dt;const f=F();
        while(ptr<n&&KEY[ORD[ptr]]<f-4.5){const k=ORD[ptr++];if(ST[k])continue;ST[k]=1;spawn(k);}
        for(const L of lumps)if(!L.free&&f>L.key-WC*.5)free(L);
        /* fire puffs off the line (its columns as drawn last frame) */
        if(nf&&parts.length<maxP)for(let q=boss?2:1;q>0;q--)if(R.chance(lite?.25:boss?.7:.5)){const x=fcol[R.int(0,nf-1)];if(colF[x]<0)continue;const life=R.range(.16,.3);
          parts.push({k:PUFF,x:(x+.5)*PX,y:(colF[x]-.5)*PX,vx:R.range(-10,10),vy:-R.range(40,80),life,max:life,size:R.range(1,1.8)*sS,seed:R.next()*100});}
        for(let i=parts.length-1;i>=0;i--){const p=parts[i];if((p.life-=dt)<=0){parts.splice(i,1);continue;}
          if(p.k===ASHK){p.vx+=Math.sin(t*5.4+p.seed)*60*dt;p.vx-=p.vx*.8*dt;p.x+=p.vx*dt+Math.sin(t*2+p.seed)*10*dt;p.y+=p.vy*dt;continue;}
          if(p.k===PUFF){p.vy-=190*dt;p.vx+=Math.sin(t*17+p.seed)*60*dt;p.vx-=p.vx*5*dt;p.vy-=p.vy*3.2*dt;}
          else if(p.k===SMOKEK){p.vy-=32*dt;p.vx+=Math.sin(t*1.3+p.seed)*16*dt;p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.2*dt;}
          else{p.vy+=(-90+Math.sin(t*3+p.seed)*40)*dt;p.vx+=Math.cos(t*2.3+p.seed)*90*dt;p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.6*dt;}
          p.x+=p.vx*dt;p.y+=p.vy*dt;}
        for(let i=chunks.length-1;i>=0;i--){const c=chunks[i];if((c.life-=dt)<=0){chunks.splice(i,1);continue;}if(c.rest)continue;
          c.vy+=GRAVITY*.75*dt;c.vx-=c.vx*.3*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;
          if(c.y>G-PX&&c.vy>0){c.y=G-PX;if(c.vy>140){c.vy=-c.vy*.3;c.vx*=.6;}else{c.rest=true;c.vx=c.vy=0;}}
          if(!lite&&R.chance(.3)&&parts.length<maxP){const life=R.range(.3,.6);parts.push({k:SPARK,x:c.x,y:c.y,vx:R.range(-20,20),vy:-R.range(40,100),life,max:life,seed:R.next()*100,s:1});}}},
      draw(fr){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light),f=F(),u=prog(),fn=Math.max(1,Math.ceil(t*60-1e-6)),edge=(x,y)=>clamp(Math.min(x-1,CW-2-x,y-1)/6);
        relight();colF.fill(-1);
        for(const p of parts){if(p.k!==SMOKEK)continue;const k=p.life/p.max,age=1-k,x=p.x/PX,y=p.y/PX,e=edge(x,y);if(e<=0)continue;
          const r=p.size*(.65+Math.min(1,age*2.5)*.45+age*.4),a=Math.min(1,age*12)*Math.min(1,k*2.4)*.55*e,c=amc(ramp(SMOKE,age*1.05));
          buf.alphaDisc(x,y,r,c,a*.45);buf.alphaDisc(x+r*.05,y+r*.06,r*.74,c,a*.62);if(age<.5)buf.alphaDisc(x-r*.22,y-r*.3,r*.5,mix(c,FIRE[0],.12),a*.4*(1-age*2));}
        const rim=t<.1?FIRE[4]:t<.16?FIRE[6]:0;
        for(let k=0;k<n;k++){if(ST[k])continue;const x=X[k],y=Y[k];
          if(fn===1){buf.set(x,y,WHITE);continue;}if(fn===2){buf.set(x,y,HOT[k]);continue;}
          const d=KEY[k]-f;
          if(d>WC)buf.set(x,y,rim&&RIM[k]?rim:LC[k]);
          else if(d>.6*WC)buf.set(x,y,LC1[k]);
          else if(d>.3*WC)buf.set(x,y,LC2[k]);
          else if(d>1)buf.set(x,y,FL[k]&1&&Math.sin(t*24+k*1.7)>-.3?FIRE[6]:CL[2]);
          else if(d>0)buf.set(x,y,FL[k]&2?FIRE[6]:FIRE[7]);
          else if(d>-1){buf.set(x,y,WHITE);if(x>=0&&x<CW&&(colF[x]<0||y<colF[x]))colF[x]=y;}
          else if(d>-2)buf.set(x,y,FIRE[2]);
          else if(d>-3){if(FL[k]&4)buf.set(x,y,FIRE[4]);}
          else if(FL[k]&8)buf.set(x,y,Math.sin(t*19+k)>.2?FIRE[5]:FIRE[6]);}
        nf=0;for(let x=0;x<CW;x++)if(colF[x]>=0)fcol[nf++]=x;
        /* tongues, outermost first so the middle ones cover them; a warm glow on every 3rd */
        const env=Math.min(1,u*10)*(1-.35*u),fl=.74+.16*noise2(t*7.3,1,sd)+.1*noise2(t*19,2,sd),mid=Math.round(bcx);let g=0;
        if(env>.05&&fn>2)for(let s=2*CW;s>=0;s--){const x=s%2?mid-1-(s>>1):mid+(s>>1);if(x<0||x>=CW||colF[x]<0||!TG[x])continue;
          const h=(1.5+3.5*hash(x,12))*sz*(1+.25*noise2(t*3.3+x*1.7,x,sd))*env*(.9+.1*fl),w=(1+.4*hash(x,13))*sS,sx=noise2(t*2.2+x,x+40,sd)*1.5-clamp((x-bcx)*.08,-1.5,1.5);
          tongue(buf,x,colF[x]+1,h,w,sx,t,x*13+sd);if(!lite&&g++%3===0)light.glow(x+.5,colF[x]-h*.5,9*sS,WARM,.3*fl*env);}
        for(const p of parts){if(p.k!==PUFF)continue;const k=p.life/p.max,age=1-k,x=p.x/PX,y=p.y/PX;if(edge(x,y)<=0)continue;
          const heat=Math.min(.999,Math.pow(age,.62)+(p.seed%1)*.1),idx=Math.min(7,Math.floor(heat*8)),r=p.size*(.55+.45*Math.min(1,age*7))*(1-age*.55),c=FIRE[idx];
          if(idx>=7)buf.alphaDisc(x,y,r,c,Math.min(1,k*3)*.85);
          else{buf.disc(x,y,r,FIRE[Math.min(8,idx+2)]);buf.disc(x-r*.16,y-r*.22,r*.78,c);if(r>1.6)buf.disc(x,y-r*.9,r*.42,c);if(idx<=3&&r>1.8)buf.disc(x-r*.28,y-r*.34,r*.36,FIRE[Math.max(0,idx-1)]);if(idx<6&&!lite)light.glow(x,y,r*2.4+2,c,.18*k);}}
        for(const c of chunks){const k=c.life/c.max,a=k<.35?k/.35:1,age=1-k,bx=Math.round(c.x/PX),by=Math.round(c.y/PX),rc=age<.3?FIRE[4]:age<.6?FIRE[5]:FIRE[6];
          for(let i=0;i<c.px.length;i++)dot(buf,bx+c.px[i],by+c.py[i],c.pr[i]?rc:c.pc[i],a);
          light.glow(bx,by,5,FIRE[5],.3*k);}
        for(const p of parts){if(p.k===PUFF||p.k===SMOKEK)continue;const k=p.life/p.max,x=p.x/PX,y=p.y/PX,e=edge(x,y);if(e<=0)continue;
          if(p.k===ASHK){const a=Math.min(1,(1-k)*8)*Math.min(1,k*3)*e;dot(buf,x,y,AL[0],a);dot(buf,x+(Math.sin(t*3+p.seed)>0?1:0),y+1,AL[1],a);continue;}
          if(p.k===CINDER){const cf=.65+.35*noise2(t*9+p.seed,2,sd),hot=k*cf,core=hot>.55?FIRE[1]:hot>.35?FIRE[2]:FIRE[4],rc=hot>.45?FIRE[4]:FIRE[5],a=Math.min(1,k*3)*Math.min(1,(1-k)*8)*e;
            if(p.s===2){dot(buf,x-1,y,rc,a);dot(buf,x+1,y,rc,a);dot(buf,x,y-1,rc,a);dot(buf,x,y+1,rc,a);dot(buf,x,y,core,a);if(!lite)light.glow(x,y,9,FIRE[4],.45*a*cf);}
            else{dot(buf,x,y,core,a);dot(buf,x,y+1,rc,a*.6);if(!lite)light.glow(x,y,5,FIRE[4],.35*a*cf);}continue;}
          const c=k>.5?(Math.sin(t*22+p.seed*3)>-.2?FIRE[2]:FIRE[4]):k>.2?FIRE[4]:FIRE[6];dot(buf,x,y,c,e);if(!lite)light.glow(x,y,3,c,.3*k);}
        if(fn>2)for(let i=0;i<nf;i+=lite?2:1){const x=fcol[i];if(x%3===0)light.glow(x+.5,colF[x]+.5,boss?7:4,FIRE[4],.3);}
        const pop=Math.exp(-t/.07);if(pop>.03){light.glow(bcx,bcy,Math.min(48,Math.max(12,bh*.6)),FIRE[4],.5*pop);light.glow(bcx,bcy,Math.min(30,Math.max(6,bh*.3)),FIRE[1],.4*Math.exp(-t/.04));}},
      done:()=>t>T0+D&&ptr>=n&&parts.length===0&&chunks.length===0,
      lamp:()=>{const pop=Math.exp(-t/.07),i=.8*pop+(t>T0&&prog()<1?.5:0);return i>.03?{i,c:[1,.55,.25],r:180,h:bh*PIX*.5}:null;}};}

  /* the dying enemy's pixels as it was last drawn: its sprite record of the last frame, else its idle frame */
  function snap(e,need){const fr=ATL.frames[e.d&&e.d.spr];if(!fr)return null;let s=null,bd=40;
    for(let i=0;i<SPR.length;i++){const q=SPR[i];if(!q.f||fr.indexOf(q.f)<0)continue;const d=Math.abs(q.x-e.x)+Math.abs(q.y-e.y);if(d<bd){bd=d;s=q;}}
    if(s){const S=pxSilOf(s.f,s.s,s.sx,s.sy,s.flip);return S?{S,x:s.x,y:s.y,h:s.h||0}:null;}
    if(need)return null;const f=fr[F_IDLE]||fr[0];if(!f)return null;const S=pxSilOf(f,e.s||1,1,1,Math.cos(e.ang)<0);return S?{S,x:e.x,y:e.y,h:e.d.fly||0}:null;}
  let seed=1;
  /* burn enemy e's body away (its sprite as last drawn; o.drawn: only if it was on screen last frame); o.dur overrides the sweep */
  function pxDissolve(e,o={}){if(!e||e.node||e.hidden||!e.d)return null;const sn=snap(e,o.drawn);if(!sn)return null;
    const S=sn.S,boss=!!e.boss,lite=!!PERF.lite,up=Math.ceil(S.ay+sn.h/PIX),w=Math.min(512,S.w+(boss?40:28)),hh=Math.min(512,up+(boss?56:40)+6),ax=Math.round(w/2),ay=hh-6,dur=o.dur??(boss?1.4:.7);
    const sil={x:Math.round(ax-S.ax),y:Math.round(ay-sn.h/PIX-S.ay),w:S.w,h:S.h,data:S.data};
    return pxfx(c=>dissolve({sil,ground:c.y,w,dur,boss,lite,seed:seed++}),{x:sn.x,y:sn.y,w,hh,ax,ay,lamp:boss&&!lite,pri:boss?2:1,ttl:dur+3});}

  /* ---------- wiring ---------- */
  const own=new Map(),act=[],cap=()=>PERF.lite?5:10;
  const nLive=()=>{for(let i=act.length-1;i>=0;i--)if(!act[i]||act[i].dead)act.splice(i,1);return act.length;};
  {const o=killEnemy;killEnemy=function(e){const r=o(e);try{if(e&&e.dead&&!e.node&&!own.has(e)&&nLive()<cap()){const H=pxDissolve(e,{drawn:true});if(H){own.set(e,H);act.push(H);}}}catch(err){}return r;};}
  /* a dying enemy this module burns: the game draws everything of it but its sprite */
  {const o=renderEnemy;renderEnemy=function(e,now){const H=e&&e.dead?own.get(e):null;if(!H||H.dead)return o(e,now);
    const ps=pushS,spr=e.d&&e.d.spr;pushS=function(name){if(name===spr)return;return ps.apply(this,arguments);};
    try{return o(e,now);}finally{pushS=ps;}};}
  onEv('update',()=>{if(own.size)for(const [e,H] of own)if(!H||H.dead||!e.dead||!(e.deadT>0))own.delete(e);});
  onEv('pxClear',()=>{own.clear();act.length=0;});

  /* the lab burns a stand-in (not in the enemy list, so no rewards, quests or encounters fire) after killEnemy's own burst */
  const labKill=(type,x,y)=>{const e=mkEnemy(type,x,y,P.lvl,null);e.ang=Math.PI;burst(e.x,e.y,e.d.col,e.boss?90:20,e.boss?380:230);flash(e.x,e.y,30,e.boss?300:110,hexc(e.d.col),.25);
    dust(e.x,e.y,e.boss?16:6,'#8a7a6a');return pxDissolve(e);};
  pxlab('dissolve-wolf','Ember dissolve (wolf death)','Deaths','orig',(x,y)=>labKill('wolf',x,y));
  pxlab('dissolve-skeleton','Ember dissolve (skeleton death)','Deaths','orig',(x,y)=>labKill('skeleton',x,y));
  pxlab('dissolve-golem','Ember dissolve (golem death)','Deaths','orig',(x,y)=>labKill('golem',x+20,y));
  pxlab('dissolve-boss','Ember dissolve (boss, chunks)','Deaths','orig',(x,y)=>labKill('aldric',x+50,y));
  return{pxDissolve};})();
