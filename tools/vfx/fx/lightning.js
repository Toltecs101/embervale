/* LIGHTNING (Sprite Fusion "Lightning", MIT, ported): jagged forked pixel bolts outlined against their own glare. Four situations:
   a strike from the sky, an electric impact, chain lightning hopping between targets, a character crackling with arcs (Electrified).
   In Embervale: every bolt the game throws from the sky (skyStrike's bolts, the 'zap' ground strikes of harpies, Vortigan and the
   Storm Lance, the Chain Lightning's opening bolt, thunder in cinematics, skyward and the stormlord ultimates) gets a pixel strike
   landing on the same spot at the same frame; 'zap' telegraphs grow SF's stepped leader in their last 0.42 s; every chain the game
   draws (Arcanist Chain Lightning, the Thunderous legendary, the Storm Imp's Chain Spark, Thunder Arrow, pet chains) becomes a pixel
   chain whose ends follow the foes, with an electric impact on each foe struck; Spirit Tempest leaves violet spirit arcs along each
   blink and a spirit impact on its finale; foes hit by lightning (and the hero, by enemy zaps) crackle Electrified for about 1 s.
   Recipe (V = the ramp, VOLT #ffffff #e9f8ff #a3dcff #5eb0ff #5b6cff #4733c4 #2a1b78; skyStrike's lavender bolts use STORM, the
   same roles shifted violet: #ffffff #f4eeff #d6c4ff #a78cff #7c5cff #5233c4 #2e1b78; Tempest SPIRIT #ffffff #f7efff #e6d2ff #c39cff
   #9a6ae8 #6a3aa8 #3a1a6a):
   - bolt shape: midpoint displacement from A to B, offset jag x length halving (x .52) each pass until a point every ~3 px; forks
     branch at chance forks/(1+depth)/max(4, pts/6), .35-.9 rad off, 25-55% of what is left, .55 as wide, to depth 2.
   - stroke: three passes of discs every .5 px: outline V5 r 2.1 (k > .6) / 1.6 trunk, 1.1 forks; body V2 r 1.3 / .8 trunk, forks .5
     in V3; 1 px V0 core on trunks while k > .3; forks skipped below k .5. Light along every 3rd point: r 14 (trunk) / 7 x thickness, V3.
   - Strike, 3 s: 0-.35 s night falls (SF darken), .2-.62 s stepped leader in 9 jumps ((step/9)^1.3), strokes at .62 / 1.02 / 1.36 s
     at brightness 1 / .85 / .55, each flickering 1, .55, .95, .4, .7 over .17 s, then a dotted V5 ghost fading by .45 s; foot discs
     V5 / V2 / V0 r 4k+1.5 / 4k+.5 / 2.6k; ground crawls (jag .35, 10-28 px, .08 s each) fewer and fewer for .4 s; round(60k) sparks
     (2/3 plasma white -> #7ff3ff -> #1ab8e6, 1/3 hot #fff3a6 -> #ffe26b -> #ff8a2a), 5 smoke puffs, 8 dust puffs; a white-hot scorch
     cooling over 2.2 s (heat ramp #ffffff .. #2a120e, soot #0d0a12 / #17121d). In the game the strokes land at once (the leader is
     skipped: the game's damage is instant), 1-3 strokes by the strike's k, sparks x.5 at x.55 speed, the scorch is a ground decal.
   - Impact, 1.6 s: 0-.05 s white disc ringed V3/V1, a 7-bolt star struck anew 30x/s, outBack 0 -> 1 in .07 s (overshoot 2.2) then
     shrinking; ring 4 -> 38 px x size over .32 s, 3 -> 1 px thick, dithered; crawls .04-.9 s; static pixels .15-1.5 s; light
     strobing 1/.7 per frame for .3 s then flickering out. In the game: size .55 per chained foe, delayed to its hop.
   - Arc: hop i lands at i x .05 s (14 sparks, a light, flash .35 + shake .2 on the first, shake .08 after); links struck anew 30x/s,
     flicker (every third frame .6 for .12 s, then .8 + .2 sin(61t) sin(23t)), hold, fade .18 s, dotted ghost .27 s. In the game:
     one canvas per link anchored between its ends, ends tracked on the foes, hold = the game bolt's life + .06 s.
   - Crackle (Electrified): fades in .08 s; every other 30 Hz frame 2-3 arcs (jag .42, 6-15 px, .05-.09 s) jump across the outline,
     snapping back onto it; 25% also one to the ground; shocks at .12 s then every .5-.8 s (twitch, 6 sparks, shake .05, glow +.35).
   Layers: back = storm cloud, smoke, dust; front = bolts, leader, ghosts, crawls, rings, discs, static, sparks. Light buffer additive,
   (1 - d/r)^2 falloff; a glow never runs past its canvas (radius clipped to fit). Feel: SF's flash / shake hooks, scaled for the game. */
const {pxLightning,pxLightningStrike,pxLightningChain,pxLightningImpact,pxLightningShock}=(function(){'use strict';
  const {Px:PxBase,dot,bayer,Rng,mix,ramp,hex,rgb,cl:clamp,smooth,hash,TAU,PXW:PX}=PXK;
  const lerp=(a,b,t)=>a+(b-a)*t;
  const outBack=(t,s=1.7)=>{const u=clamp(t)-1;return 1+(s+1)*u*u*u+s*u*u;};
  const noise=(x,seed=0)=>{const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);return lerp(hash(i,seed)*2-1,hash(i+1,seed)*2-1,u);};
  class Px extends PxBase{
    ring(cx,cy,r,thick,c,alpha=1){const ro=r+thick*.5,ri=Math.max(0,r-thick*.5),ro2=ro*ro,ri2=ri*ri;
      for(let y=Math.floor(cy-ro);y<=Math.ceil(cy+ro);y++){const dy=y+.5-cy;for(let x=Math.floor(cx-ro);x<=Math.ceil(cx+ro);x++){const dx=x+.5-cx,d2=dx*dx+dy*dy;
        if(d2<=ro2&&d2>=ri2&&(alpha>=1||alpha>bayer(x,y)))this.set(x,y,c);}}}
    /* Embervale: the canvas is a small window in the world, not the screen; a glow cut by its edge would show as a hard line, so a
       glow's radius shrinks to what fits round its centre */
    glow(cx,cy,r,c,k){const m=Math.min(cx-this.ox,this.ox+this.w-cx,cy-this.oy,this.oy+this.h-cy);if(m>=1)super.glow(cx,cy,Math.min(r,m),c,k);}
  }
  const VOLT=['#ffffff','#e9f8ff','#a3dcff','#5eb0ff','#5b6cff','#4733c4','#2a1b78'].map(hex);
  const STORM=['#ffffff','#f4eeff','#d6c4ff','#a78cff','#7c5cff','#5233c4','#2e1b78'].map(hex);
  const SPIRIT=['#ffffff','#f7efff','#e6d2ff','#c39cff','#9a6ae8','#6a3aa8','#3a1a6a'].map(hex);
  const PLASMA=['#ffffff','#7ff3ff','#1ab8e6'].map(hex);
  const SPARKS=['#fff3a6','#ffe26b','#ff8a2a','#f2561d'].map(hex);
  const HEAT_RAMP=['#ffffff','#fff3a6','#ffe26b','#ffc23d','#ff8a2a','#f2561d','#c9281f','#8a1f17','#4f1a13','#2a120e'].map(hex);
  const SMOKE_RAMP=['#7b6f72','#5d5660','#433d48','#2b2630','#1a171e'].map(hex);
  const SMOKE_TINT=hex('#5b5566'),DUST=hex('#7a6e8e'),SOOT=hex('#0d0a12'),SOOT2=hex('#17121d');
  const GRAVITY=1900,K={SPARK:0,PLASMA:1,SMOKE:2,DUST:3};

  /* ---------- the Sprite Fusion effect ---------- */
  function lightning(o={}){
    const R=new Rng(o.seed??1),V=o.colors??VOLT,kind=o.kind??'strike';
    const groundAt=x=>o.ground===undefined?(kind==='strike'?600:Infinity):typeof o.ground==='number'?o.ground:o.ground(x);
    const ps=new Particles(R,groundAt,o.plasma??(o.colors?[V[0],V[2],V[4]]:PLASMA),o.spd??1),lights=[];
    const c={o,R,V,ps,lights,groundAt};
    const run=kind==='impact'?impact(c):kind==='arc'?arc(c):kind==='crackle'?crackle(c):strike(c);
    return{
      update(dt){run.update(dt);ps.update(dt);stepLights(lights,dt);},
      draw(f,layer){const buf=new Px(f,f.color),light=new Px(f,f.light);
        if(layer!=='front'){run.back?.(buf,light);ps.draw(buf,light,'back');}
        if(layer!=='back'){run.front(buf,light);ps.draw(buf,light,'front');if(!o.lamp)drawLights(light,lights);}},
      stop:()=>run.stop?.(),
      hold:d=>run.hold?.(d),
      done:()=>run.over()&&ps.list.length===0&&lights.length===0,
      /* Embervale: the SF scene lights (a light per stroke / hop) become a point light in the world */
      lamp:()=>{if(run.lamp)return run.lamp();let b=null,bi=0;for(const l of lights){const k=l.life/l.max,i=l.k*k*k;if(i>bi){bi=i;b=l;}}
        if(!b)return null;const g=groundAt(b.x),c3=[(b.color&255)/255,((b.color>>>8)&255)/255,((b.color>>>16)&255)/255];
        return{i:bi*1.5,c:c3,r:b.r*1.25*(.55+.45*b.life/b.max),h:Number.isFinite(g)?Math.max(10,(g-b.y)*PIX/PX):30};}};}
  function strike({o,R,V,ps,lights,groundAt}){
    const X=o.x??790,G=groundAt(X),cx=X/PX,cy=G/PX,TOP=(o.top??G-408)/PX,lean=o.lean??18,hit=(o.hit??0)/PX,ey=cy-hit,SPK=o.spark??1,SMK=o.smoke!==false;
    const strokes=[
      {t:.62,k:1,b:forked(R,cx+lean,TOP,cx,ey,.2,.75)},
      {t:1.02,k:.85,b:forked(R,cx-14,TOP,cx+1,ey,.2,.6)},
      {t:1.36,k:.55,b:forked(R,cx+6,TOP,cx,ey,.24,.4)}].slice(0,Math.max(1,Math.min(3,o.strokes??3)));
    const LEAD=.42,END=o.end??3,SMOKE_T=o.smokeT??2.6;
    const clouds=Array.from({length:24},(_,i)=>({x:(X-490)/PX+i*15+hash(i,1)*8,y:TOP+22+hash(i,2)*10,r:12+hash(i,3)*10}));
    const crawls=[];
    let t=o.t0??0,struck=-1,flash=0;
    const now=()=>{for(let i=strokes.length-1;i>=0;i--){const s=strokes[i],a=t-s.t;if(a<0)continue;
        const f=a<.03?1:a<.06?.55:a<.1?.95:a<.14?.4:a<.17?.7:0;return{s,a,k:f*s.k};}return null;};
    return{
      update(dt){t+=dt;
        o.darken?.(.55*smooth(-.3,.35,t)*(1-smooth(2.1,2.9,t))*(1-.7*flash));
        flash=Math.max(0,flash-dt*6);
        for(let i=0;i<strokes.length;i++){const s=strokes[i];if(struck>=i||t<s.t)continue;struck=i;flash=s.k;
          o.flash?.(s.k,'225,236,255');o.shake?.(.5*s.k);o.ripple?.(X,G-4,20,260*s.k,.5,.18*s.k,22);
          const n=Math.round(60*s.k*SPK),Y=ey*PX;
          for(let j=0;j<n;j++){const a=-Math.PI/2+R.range(-1.4,1.4)+(hit?R.range(0,TAU):0),sp=R.range(240,980)*s.k;ps.spawn(j%3?K.PLASMA:K.SPARK,X,Y-3,Math.cos(a)*sp,Math.sin(a)*sp,R.range(.2,.7));}
          if(SMK)for(let j=0;j<5;j++)ps.spawn(K.SMOKE,X+R.range(-12,12),Y-6,R.range(-20,20),R.range(-50,-20),R.range(1.4,2.4),mix(SMOKE_TINT,V[5],.3),R.range(3,6),R.range(.1,.5));
          if(!hit)dustPuffs(ps,R,X,G,8,1.6);
          lights.push({x:X,y:Y-60,r:320,color:V[4],k:.7*s.k,life:.3,max:.3});}
        if(struck>=0&&!hit&&R.chance(.6*clamp(1-(t-strokes[struck].t)/.4))){const side=R.sign(),l=R.range(10,28);
          crawls.push({b:forked(R,cx+side*R.range(1,4),cy-.5,cx+side*l,cy-R.range(0,2),.35,.2,.6),t});}
        for(let i=crawls.length-1;i>=0;i--)if(t-crawls[i].t>.08)crawls.splice(i,1);
        if(SMK&&!hit&&t>strokes[0].t&&t<SMOKE_T&&R.chance(.12))ps.spawn(K.SMOKE,X+R.range(-10,10),G-2,R.range(-8,8),R.range(-34,-18),R.range(1.4,2.2),0,R.range(2,3.5));},
      back(buf,light){const first=strokes[0],s=now();
        if(struck>=0&&o.scorch!==false)scorch(buf,light,cx,cy,20,Math.pow(clamp(1-(t-first.t)/2.2),1.3));
        if(o.clouds!==false){const lead=t>first.t-LEAD&&t<first.t?.35+.35*Math.sin(t*50):0;
          const lit=Math.max(s?.k??0,lead*.5,Math.max(0,Math.sin(t*9+1))*.2*smooth(0,.3,t)*(t<.5?1:0));
          storm(buf,light,clouds,cx,lit,t,V,o.cloudEnds);}},
      front(buf,light){const first=strokes[0],s=now();
        if(t>first.t-LEAD&&t<first.t){const reach=TOP+(ey-TOP)*Math.pow(Math.floor(((t-first.t+LEAD)/LEAD)*9)/9,1.3);
          for(const p of first.b.paths)for(let i=0;i<p.pts.length-1;i++){const [ax,ay]=p.pts[i],[bx,by]=p.pts[i+1];if(by>reach)break;
            buf.line(ax,ay,bx,by,p.w>=1?V[3]:V[5]);if(i%4===0)light.glow(ax,ay,6,V[4],.25);}}
        if(s&&s.k>0){stroke(buf,light,s.s.b,s.k,V,1);
          buf.disc(cx,ey-1,4*s.k+1.5,V[5]);buf.disc(cx,ey-1,4*s.k+.5,V[2]);buf.disc(cx,ey-1,2.6*s.k,V[0]);
          light.glow(cx,ey-10,110,V[4],.55*s.k);light.glow(cx,ey-4,26,V[2],.45*s.k);}
        else if(s&&s.a<.45){const k=1-(s.a-.17)/.28;for(const p of s.s.b.paths)if(p.w>=1)for(const [x,y] of p.pts)dot(buf,x,y,V[5],k*.8);}
        for(const c of crawls)drawBolt(buf,light,c.b,V,1-(t-c.t)/.1,.4);
        if(struck>=0)light.glow(cx,ey-2,20,V[3],.35*clamp(1-(t-first.t)/1.5));},
      over:()=>t>END};}
  function impact({o,R,V,ps}){
    const X=o.x??780,Y=o.y??524,S=o.size??1,ax=X/PX,ay=Y/PX;
    let star=[],starAt=-1,t=0;const arcs=[];
    o.flash?.(.7,'200,226,255');o.shake?.(.4*Math.min(1.5,S));
    for(let i=0;i<(o.sparks??64);i++){const a=R.range(0,TAU),sp=R.range(240,900)*Math.sqrt(S);ps.spawn(K.PLASMA,X,Y,Math.cos(a)*sp,Math.sin(a)*sp-100,R.range(.2,.75));}
    for(let i=0;i<(o.puffs??5);i++)ps.spawn(K.SMOKE,X+R.range(-14,14)*S,Y+R.range(-10,10)*S,R.range(-10,10),R.range(-30,-12),R.range(1.2,2),mix(SMOKE_TINT,V[4],.35),R.range(3,5)*S,R.range(.08,.25));
    return{
      update(dt){t+=dt;const f=Math.floor(t*30);
        if(t<.3&&f!==starAt){starAt=f;const len=t<.07?outBack(t/.07,2.2):1-(t-.07)/.3;star=[];
          for(let i=0;i<7;i++){const a=(i/7)*TAU+hash(i,3)*.6+R.range(-.12,.12),L=(18+18*hash(i,5))*Math.max(.15,len)*S;star.push(forked(R,ax,ay,ax+Math.cos(a)*L,ay+Math.sin(a)*L,.28,.5));}}
        if(t>.04&&t<.9&&R.chance(.5*(1-t/.9))){const a=R.range(0,TAU),d=R.range(6,26)*S,a2=a+R.range(-1.4,1.4),l=R.range(6,14)*S,x0=ax+Math.cos(a)*d,y0=ay+Math.sin(a)*d;
          arcs.push({b:forked(R,x0,y0,x0+Math.cos(a2)*l,y0+Math.sin(a2)*l,.4,.2,.6),t});
          if(R.chance(.4))ps.spawn(K.PLASMA,x0*PX,y0*PX,R.range(-200,200),R.range(-260,40),R.range(.12,.3));}
        for(let i=arcs.length-1;i>=0;i--)if(t-arcs[i].t>.07)arcs.splice(i,1);},
      front(buf,light){
        if(t<.05){buf.disc(ax,ay,(10-t*60)*S,V[3]);buf.disc(ax,ay,(8-t*60)*S,V[1]);buf.disc(ax,ay,(6-t*50)*S,V[0]);}
        if(t<.32){const k=t/.32,r=(4+34*(1-Math.pow(1-k,3)))*S;buf.ring(ax,ay,r,Math.max(1,3*(1-k)),k<.4?V[1]:V[3],1.2-k);}
        if(t<.3)for(const b of star)drawBolt(buf,light,b,V,1-t/.36,.6);
        for(const a of arcs)drawBolt(buf,light,a.b,V,1-(t-a.t)/.1,.35);
        if(t>.15&&t<1.5)for(let i=0;i<10*(1-t/1.5);i++){const s=Math.floor(t*40)*13+i,a=hash(s,1)*TAU,d=(4+hash(s,2)*30)*S,x=ax+Math.cos(a)*d,y=ay+Math.sin(a)*d;
          dot(buf,x,y,hash(s,3)<.3?V[0]:V[2]);if(hash(s,4)<.4)dot(buf,x+(hash(s,5)<.5?1:-1),y+1,V[3]);}
        const strobe=t<.3?(Math.floor(t*60)%2?.7:1):.5+.5*Math.sin(t*70);
        light.glow(ax,ay,70*S*Math.max(0,1-t/1.7),V[3],.9*Math.exp(-t*4)*strobe);
        light.glow(ax,ay,26*S,V[0],.9*Math.exp(-t*9));},
      over:()=>t>1.6,
      /* Embervale: the strobing light as a point light in the world */
      lamp:()=>{const k=.9*Math.exp(-t*4)*(t<.3?(Math.floor(t*60)%2?.7:1):.5+.5*Math.sin(t*70));const g=o.ground;
        return k>.04?{i:k*1.3,c:[(V[3]&255)/255,((V[3]>>>8)&255)/255,((V[3]>>>16)&255)/255],r:150*S,h:typeof g==='number'?Math.max(10,(g-Y)*PIX/PX):30}:null;}};}
  function arc({o,R,V,ps,lights,groundAt}){
    const hops=o.to??[[640,600],[760,600],[880,600]],D=o.duration??.9,LINK=o.link??.05,at=p=>typeof p==='function'?p():p;
    const src=()=>{const h=o.actor?.hand?.();return h?[h.x,h.y]:o.from?at(o.from):[o.x??520,o.y??520];};
    const links=hops.map((_,i)=>({on:i*LINK,hit:false,b:null}));
    const crawls=[],marks=[];
    let t=0,tick=-1,stopAt=D;
    const level=()=>{const flick=t<.12?(Math.floor(t*60)%3===1?.6:1):.8+.2*Math.sin(t*61)*Math.sin(t*23);return t<stopAt?flick:flick*clamp(1-(t-stopAt)/.18);};
    const pointsNow=()=>[src(),...hops.map(at)];
    return{
      update(dt){t+=dt;const P=pointsNow(),k=level(),f=Math.floor(t*30);
        for(let i=0;i<links.length;i++){const l=links[i];if(l.hit||t<l.on)continue;l.hit=true;
          const [x,y]=P[i+1],g=groundAt(x),onGround=Math.abs(g-y)<8;
          for(let j=0;j<14;j++){const a=(onGround?-Math.PI/2:0)+R.range(-1.4,1.4)+(onGround?0:R.range(0,TAU)),sp=R.range(200,620);ps.spawn(K.PLASMA,x,y-2,Math.cos(a)*sp,Math.sin(a)*sp,R.range(.15,.45));}
          if(onGround){dustPuffs(ps,R,x,g,4,.9);marks.push({x,y:g,t});}
          lights.push({x,y,r:120,color:V[3],k:.8,life:.2,max:.2});
          if(i===0){o.flash?.(.35,'215,232,255');o.shake?.(.2);}else o.shake?.(.08);}
        if(f!==tick&&k>0){tick=f;
          for(let i=0;i<links.length;i++){const l=links[i];if(!l.hit)continue;
            const [x0,y0]=P[i],[x1,y1]=P[i+1],g0=Math.abs(groundAt(x0)-y0)<8,g1=Math.abs(groundAt(x1)-y1)<8;
            l.b=g0&&g1?hop(R,x0/PX,y0/PX,x1/PX,y1/PX):forked(R,x0/PX,y0/PX,x1/PX,y1/PX,.22,.45);}}
        if(k>.3){
          for(let i=0;i<links.length;i++){const l=links[i];if(!l.hit||!R.chance(.3))continue;const [x,y]=P[i+1],a=R.range(0,TAU),d=R.range(4,14);
            crawls.push({b:forked(R,x/PX,y/PX,x/PX+Math.cos(a)*d,y/PX+Math.sin(a)*d*(Math.abs(groundAt(x)-y)<8?.3:1),.4,.2,.6),t});}
          if(R.chance(.5)){const i=R.int(0,links.length-1),u=R.next(),[x0,y0]=P[i],[x1,y1]=P[i+1];
            if(links[i].hit)ps.spawn(K.PLASMA,lerp(x0,x1,u),lerp(y0,y1,u),R.range(-120,120),R.range(-160,40),R.range(.1,.25));}}
        for(let i=crawls.length-1;i>=0;i--)if(t-crawls[i].t>.07)crawls.splice(i,1);},
      back(buf,light){for(const m of marks)scorch(buf,light,m.x/PX,m.y/PX,6,Math.pow(clamp(1-(t-m.t)/1.6),1.3));},
      front(buf,light){const P=pointsNow(),k=level();
        if(k>0){
          for(const l of links)if(l.hit&&l.b)stroke(buf,light,l.b,k,V,.7);
          for(let i=0;i<links.length;i++){if(!links[i].hit)continue;const [x,y]=P[i+1],ax=x/PX,ay=y/PX,r=(2.2+Math.sin(t*47+i)*.6)*k;
            buf.disc(ax,ay,r+1.4,V[5]);buf.disc(ax,ay,r+.6,V[2]);buf.disc(ax,ay,r*.6,V[0]);light.glow(ax,ay,20,V[3],.5*k);}
          if(o.hand!==false){const [hx,hy]=P[0],hr=(2+Math.sin(t*53)*.5)*k;buf.disc(hx/PX,hy/PX,hr+1,V[3]);buf.disc(hx/PX,hy/PX,hr,V[0]);light.glow(hx/PX,hy/PX,16,V[2],.6*k);}}
        else if(t-stopAt<.45){const g=1-(t-stopAt-.18)/.27;for(const l of links)if(l.b)for(const p of l.b.paths)if(p.w>=1)for(const [x,y] of p.pts)dot(buf,x,y,V[5],g*.7);}
        for(const c of crawls)drawBolt(buf,light,c.b,V,1-(t-c.t)/.09,.3);},
      over:()=>t>stopAt+1.7*(o.tail??1),
      stop(){stopAt=Math.min(stopAt,t);}};}
  function hop(R,x0,y0,x1,y1){const mx=(x0+x1)/2+R.range(-4,4),my=Math.min(y0,y1)-Math.hypot(x1-x0,y1-y0)*R.range(.16,.28);
    const a=forked(R,x0,y0,mx,my,.2,.4),b=forked(R,mx,my,x1,y1,.2,.4);
    return{paths:[{pts:[...a.paths[0].pts,...b.paths[0].pts.slice(1)],w:1},...a.paths.slice(1),...b.paths.slice(1)]};}
  function crackle({o,R,V,ps,groundAt}){
    const D=o.duration??1.8,RAD=(o.radius??36)/PX;const arcs=[];
    let t=0,tick=-1,stopAt=D,shock=0,nextShock=.12,edge=[],centre=[0,0];
    const level=()=>smooth(0,.08,t)*(t<stopAt?1:clamp(1-(t-stopAt)/.3));
    const outline=()=>{const s=o.actor?.silhouette?.();edge=[];
      if(s){const on=(x,y)=>x>=0&&y>=0&&x<s.w&&y<s.h&&(s.data[y*s.w+x]>>>24)>0;
        for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++)if(on(x,y)&&(!on(x-1,y)||!on(x+1,y)||!on(x,y-1)||!on(x,y+1)))edge.push([s.x+x+.5,s.y+y+.5]);}
      if(!edge.length){const cx=(o.x??640)/PX,cy=(o.y??540)/PX;for(let i=0;i<48;i++){const a=R.range(0,TAU),d=RAD*Math.sqrt(R.next());edge.push([cx+Math.cos(a)*d,cy+Math.sin(a)*d]);}}
      let sx=0,sy=0;for(const [x,y] of edge){sx+=x;sy+=y;}centre=[sx/edge.length,sy/edge.length];};
    return{
      update(dt){t+=dt;shock=Math.max(0,shock-dt);const f=Math.floor(t*30),k=level();
        if(f!==tick&&f%2===0&&k>.05&&t<stopAt){tick=f;outline();
          for(let n=0;n<2+R.int(0,1);n++){const a=R.pick(edge),ux=a[0]-centre[0],uy=a[1]-centre[1],l=Math.hypot(ux,uy)||1;
            const ang=Math.atan2(uy/l,ux/l)+R.range(-1.2,1.2),d=R.range(6,15);let b=[a[0]+Math.cos(ang)*d,a[1]+Math.sin(ang)*d];
            for(let tries=0;tries<10;tries++){const c=R.pick(edge);if(Math.hypot(c[0]-b[0],c[1]-b[1])<4&&Math.hypot(c[0]-a[0],c[1]-a[1])>4)b=c;}
            arcs.push({b:forked(R,a[0],a[1],b[0],b[1],.42,.35),t,life:R.range(.05,.09)});
            if(R.chance(.4))ps.spawn(K.PLASMA,b[0]*PX,b[1]*PX,R.range(-140,140),R.range(-200,20),R.range(.1,.25));}
          let low=edge[0];for(const p of edge)if(p[1]>low[1])low=p;const g=groundAt(low[0]*PX)/PX;
          if(R.chance(.25)&&g-low[1]<14)arcs.push({b:forked(R,low[0],low[1],low[0]+R.range(-9,9),g-.5,.45,.3),t,life:.07});}
        if(t>=nextShock&&t<stopAt&&edge.length){nextShock=t+R.range(.5,.8);shock=.05;o.cue?.('hurt',{t:.04});o.shake?.(.05);
          for(let i=0;i<6;i++){const a=R.range(0,TAU),sp=R.range(150,400),[x,y]=R.pick(edge);ps.spawn(K.PLASMA,x*PX,y*PX,Math.cos(a)*sp,Math.sin(a)*sp-60,R.range(.1,.3));}}
        for(let i=arcs.length-1;i>=0;i--)if(t-arcs[i].t>arcs[i].life)arcs.splice(i,1);},
      front(buf,light){const k=level();
        for(const a of arcs)stroke(buf,light,a.b,Math.max(.35,(1-(t-a.t)/(a.life+.04))*k),V,.45);
        if(k>.02)light.glow(centre[0],centre[1],34,V[3],(.18+.12*Math.sin(t*57)+(shock>0?.35:0))*k);},
      over:()=>t>stopAt+.4&&arcs.length===0,
      stop(){stopAt=Math.min(stopAt,t);},
      /* Embervale: struck again while crackling, the status holds on for d more seconds */
      hold(d){stopAt=Math.max(stopAt,t+d);}};}
  function stroke(buf,light,b,k,V,s){
    for(const pass of [0,1,2])for(const p of b.paths){const trunk=p.w>=1;if(!trunk&&(k<.5||(pass===2&&p.w<.5)))continue;
      for(let i=0;i<p.pts.length-1;i++){const [ax,ay]=p.pts[i],[bx,by]=p.pts[i+1],l=Math.max(1,Math.hypot(bx-ax,by-ay));
        for(let d=0;d<=l;d+=.5){const x=ax+((bx-ax)*d)/l,y=ay+((by-ay)*d)/l;
          if(pass===0)buf.disc(x,y,(trunk?(k>.6?2.1:1.6):1.1)*s,V[5]);
          else if(pass===1)buf.disc(x,y,(trunk?(k>.6?1.3:.8):.5)*s,trunk?V[2]:V[3]);
          else if(trunk&&k>.3)buf.set(Math.floor(x),Math.floor(y),V[0]);}
        if(pass===0&&i%3===0)light.glow(ax,ay,(trunk?14:7)*s,V[3],.5*k*p.w);}}}
  function storm(buf,light,clouds,cx,lit,t,V,ends){const body=hex('#0f0c1d'),under=hex('#1b1631'),rim=hex('#29224a');
    for(let x=buf.ox;x<buf.ox+buf.w;x++){let yb=-1e9,yb2=-1e9;
      /* Embervale: the cloud bank hangs in the world, not across a screen: it thins to nothing toward the canvas's sides */
      const taper=ends?clamp(Math.min(x-buf.ox,buf.ox+buf.w-1-x)/ends):1;
      for(let i=0;i<clouds.length;i++){const c=clouds[i],r=c.r*taper,dx=x+.5-(c.x+noise(t*.4+c.x,9)*2);if(Math.abs(dx)>=r)continue;
        const y=c.y-c.r+r+Math.sqrt(r*r-dx*dx);if(y>yb)yb=y;const y2=c.y-c.r+r-9+(i%3)*2+Math.sqrt(r*r-dx*dx)*.7;if(i%2&&y2>yb2)yb2=y2;}
      if(yb<-1e8)continue;const l=lit*Math.max(0,1-Math.abs(x-cx)/120);
      for(let y=buf.oy;y<yb;y++)buf.set(x,y,body);
      dot(buf,x,yb,body,.5);dot(buf,x,yb+1,body,.25);
      dot(buf,x,yb-1,l>.55?V[3]:l>.2?V[5]:rim);dot(buf,x,yb-2,l>.55?V[5]:under,.85);dot(buf,x,yb-3,under,.45);
      if(yb2>-1e8&&yb2<yb-4){dot(buf,x,yb2,l>.4?V[5]:under,.9);dot(buf,x,yb2-1,under,.4);}
      if((x&7)===0&&l>.05)light.glow(x,yb-2,22,V[4],.3*l);}}
  function scorch(buf,light,cx,cy,rx,T0){const ry=Math.max(2.5,rx*.09);
    for(let y=Math.floor(cy);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){
      const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,d=Math.sqrt(dx*dx+dy*dy);if(d>1)continue;const k=hash(x*31+y*7),T=T0*(1.25-d)-k*.35;
      if(T>.06){const c=HEAT_RAMP[Math.min(HEAT_RAMP.length-1,Math.floor((1-Math.min(1,T))*(HEAT_RAMP.length-1)))];buf.set(x,y,c);if((x&3)===0)light.glow(x+.5,y,6,c,.18*T);}
      else if(d<.95-k*.3||bayer(x,y)<1-d)buf.set(x,y,d<.5?SOOT:SOOT2);}}
  function dustPuffs(ps,R,x,y,n,spread){for(let i=0;i<n;i++)ps.spawn(K.DUST,x+R.range(-3,3),y-1,R.sign()*R.range(20,110)*spread,-R.range(5,45),R.range(.3,.65),DUST,R.range(1.3,2.8));}
  class Particles{
    constructor(R,ground,plasma,spd=1){this.list=[];this.t=0;this.R=R;this.ground=ground;this.plasma=plasma;this.spd=spd;}
    spawn(k,x,y,vx,vy,life,col=0,size=1,delay=0){if(k<=K.PLASMA){vx*=this.spd;vy*=this.spd;}this.list.push({k,x,y,vx,vy,life,max:life,col,size,seed:this.R.next()*100,delay});}
    update(dt){this.t+=dt;const t=this.t,L=this.list;
      for(let i=L.length-1;i>=0;i--){const p=L[i];if(p.delay>0){p.delay-=dt;continue;}if((p.life-=dt)<=0){L.splice(i,1);continue;}
        switch(p.k){
          case K.SPARK:case K.PLASMA:{p.vy+=GRAVITY*.45*dt;p.vx-=p.vx*2.2*dt;p.vy-=p.vy*2.2*dt;const g=this.ground(p.x),ny=p.y+p.vy*dt;p.x+=p.vx*dt;
            if(p.vy>0&&p.y<=g&&ny>=g){p.vy=-p.vy*.45;p.vx*=.7;p.y=g-.5;}else p.y=ny;break;}
          case K.SMOKE:p.vy-=32*dt;p.vx+=Math.sin(t*1.3+p.seed)*16*dt;p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.2*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;
          case K.DUST:p.vx-=p.vx*4*dt;p.vy-=p.vy*4*dt+10*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;break;}}}
    draw(buf,light,layer){const back=layer==='back';for(const p of this.list)if(p.delay<=0&&(p.k===K.SMOKE||p.k===K.DUST)===back)this.drawOne(p,buf,light);}
    drawOne(p,buf,light){const k=p.life/p.max,ax=p.x/PX,ay=p.y/PX;
      switch(p.k){
        case K.SMOKE:{const age=1-k,r=p.size*(.65+Math.min(1,age*2.5)*.45+age*.4),a=Math.min(1,age*12)*Math.min(1,k*2.4)*.58;
          const c=p.col?mix(p.col,ramp(SMOKE_RAMP,age),age):ramp(SMOKE_RAMP,age*1.05);
          buf.alphaDisc(ax,ay,r,c,a*.45);buf.alphaDisc(ax+r*.05,ay+r*.06,r*.74,c,a*.62);
          if(age<.5)buf.alphaDisc(ax-r*.22,ay-r*.3,r*.5,mix(c,VOLT[0],.12),a*.4*(1-age*2));break;}
        case K.DUST:buf.alphaDisc(ax,ay,p.size*(.6+(1-k)*.9),p.col,Math.pow(k,1.3)*.7);break;
        case K.SPARK:case K.PLASMA:{const C=p.k===K.PLASMA?this.plasma:SPARKS,hot=p.k===K.PLASMA?(k>.5?C[0]:k>.25?C[1]:C[2]):k>.6?C[0]:k>.3?C[1]:C[2];
          const sp=Math.hypot(p.vx,p.vy)||1,ux=p.vx/sp,uy=p.vy/sp,len=Math.min(9,1+sp*.011);
          buf.line(ax-ux*len,ay-uy*len,ax-ux*len*.4,ay-uy*len*.4,k>.5?hot:C[C.length-1]);buf.line(ax-ux*len*.45,ay-uy*len*.45,ax,ay,hot);light.glow(ax,ay,3,hot,.45*k);break;}}}}
  function stepLights(lights,dt){for(let i=lights.length-1;i>=0;i--)if((lights[i].life-=dt)<=0)lights.splice(i,1);}
  function drawLights(light,lights){for(const l of lights){const k=l.life/l.max;light.glow(l.x/PX,l.y/PX,(l.r/PX)*(.55+.45*k),l.color,l.k*k*k);}}
  /* SF's bolt(): a forked polyline by midpoint displacement (renamed: the game's own bolt() is wrapped below) */
  function forked(R,x0,y0,x1,y1,jag=.32,forks=.35,w=1,depth=0){const out={paths:[]},L=Math.hypot(x1-x0,y1-y0);
    let pts=[[x0,y0],[x1,y1]],off=L*jag;
    while(pts.length<2+L/3){const nxt=[pts[0]];
      for(let i=0;i<pts.length-1;i++){const [ax,ay]=pts[i],[bx,by]=pts[i+1],l=Math.hypot(bx-ax,by-ay)||1,o=R.range(-off,off);
        nxt.push([(ax+bx)/2+(-(by-ay)/l)*o,(ay+by)/2+((bx-ax)/l)*o],[bx,by]);}
      pts=nxt;off*=.52;}
    out.paths.push({pts,w});
    if(depth<2)for(let i=2;i<pts.length-3;i++)if(R.chance(forks/(1+depth)/Math.max(4,pts.length/6))){
      const [ax,ay]=pts[i],[bx,by]=pts[Math.min(pts.length-1,i+3)],a=Math.atan2(by-ay,bx-ax)+R.sign()*R.range(.35,.9),l=(L-(i/pts.length)*L)*R.range(.25,.55);
      out.paths.push(...forked(R,ax,ay,ax+Math.cos(a)*l,ay+Math.sin(a)*l,jag*1.1,forks,w*.55,depth+1).paths);}
    return out;}
  const NB4=[[1,0],[-1,0],[0,1],[0,-1]],NB2=[[1,0],[0,1]];
  function drawBolt(buf,light,b,V,k=1,glowK=.5){
    for(const p of b.paths){const thick=p.w>=1;
      for(let i=0;i<p.pts.length-1;i++){const [ax,ay]=p.pts[i],[bx,by]=p.pts[i+1],l=Math.max(1,Math.hypot(bx-ax,by-ay));
        for(let d=0;d<=l;d+=.5){const x=ax+((bx-ax)*d)/l,y=ay+((by-ay)*d)/l;
          if(k>.45&&thick)for(const [dx,dy] of NB4)dot(buf,x+dx*1.5,y+dy*1.5,V[4],(k-.45)*1.6);
          if(k>.25&&(thick||p.w>.4))for(const [dx,dy] of NB2)dot(buf,x+dx,y+dy,V[2]);
          buf.set(Math.floor(x),Math.floor(y),thick&&k>.3?V[0]:V[2]);}
        if(i%3===0)light.glow(ax,ay,(thick?9:5)*(.5+k*.5),V[3],glowK*k*p.w);}}}
  /* Embervale: the scorch as a ground decal ('flat' canvas): SF's heat mapping on the whole ellipse (SF draws the near half into its
     side-on ground), cooling over 2.2 s, its soot dithering away from 2.4 to 3.4 s */
  function scorchDecal(o){const cx=o.x/PX,cy=o.y/PX,rx=o.rx,ry=o.ry??rx*.72;let t=-(o.delay??0);
    return{update(dt){t+=dt;},
      draw(fr){if(t<0)return;const buf=new Px(fr,fr.color),light=new Px(fr,fr.light),T0=Math.pow(clamp(1-t/2.2),1.3),fade=clamp(1-(t-2.4));
        for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){
          const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,d=Math.sqrt(dx*dx+dy*dy);if(d>1)continue;const k=hash(x*31+y*7),T=T0*(1.25-d)-k*.35;
          if(T>.06){const c=HEAT_RAMP[Math.min(HEAT_RAMP.length-1,Math.floor((1-Math.min(1,T))*(HEAT_RAMP.length-1)))];dot(buf,x,y,c,fade+.3);if((x&3)===0&&(y&1)===0)light.glow(x+.5,y,6,c,.18*T);}
          else if(d<.95-k*.3||bayer(x,y)<1-d)dot(buf,x,y,d<.5?SOOT:SOOT2,fade*(1.15-d*.4));}},
      done:()=>t>3.4};}
  /* an effect that starts d seconds later (made then, so its hooks fire on time) */
  function delayed(make,d){let w=d,fx=d>0?null:make();
    return{update(dt){if(!fx){w-=dt;if(w>0)return;fx=make();}fx.update(dt);},draw(fr,l){if(fx)fx.draw(fr,l);},done:()=>!!fx&&fx.done(),
      stop:()=>{if(fx)fx.stop?.();else w=1e9;},hold:x=>fx?.hold?.(x),lamp:()=>fx&&fx.lamp?fx.lamp():null};}

  /* ---------- Embervale wrappers ---------- */
  let seed=1;
  const LIVE={strike:[],shock:new Map()};
  const alive=H=>!!H&&!H.dead&&PXFX.list.includes(H);
  const RAMPS={};
  /* a game colour ([r,g,b] 0..1 or '#rrggbb') -> a 7-step SF ramp: blue bolts VOLT, lavender ones STORM, anything else its own */
  function rampFor(c){if(!c)return VOLT;const v=Array.isArray(c)?c:[parseInt(c.slice(1,3),16)/255,parseInt(c.slice(3,5),16)/255,parseInt(c.slice(5,7),16)/255];
    if(v[2]>=.93&&v[0]<.95)return v[1]>v[0]+.02?VOLT:STORM;const key=v.map(n=>Math.round(n*20)).join(',');
    return RAMPS[key]||(RAMPS[key]=(()=>{const r=PXK.rampOf(v);return[...r,mix(r[5],rgb(20,12,40),.5)];})());}
  /* game hooks, scaled: the game already flashes, tints and shakes for its own lightning */
  const hookShake=m=>tr=>PXK.shake(tr*m),hookFlash=m=>(k,c)=>PXK.flash(k*m,c);

  /* a strike from the sky landing on the ground point (x, y). o: k (the strike's strength), strokes, primary (smoke, lamp, the big
     scorch), t0 (.62: strokes at once; less: the leader shows first), lean (art px the first stroke starts off its column), hit (world
     height the bolt ends at, for foes in the air), colors, flash, sky (the full SF scene: leader, storm cloud, night) */
  function pxLightningStrike(x,y,o={}){
    for(let i=LIVE.strike.length-1;i>=0;i--)if(!alive(LIVE.strike[i]))LIVE.strike.splice(i,1);
    if(LIVE.strike.length>=(PERF.lite?3:8)&&!o.force)return null;
    const k=o.k??1,prim=o.primary!==false,lite=PERF.lite,sky=!!o.sky,sd=seed++;
    const strokes=o.strokes??(sky?3:prim?(k>=1.15?3:k>=.75?2:1):1),t0=o.t0??(sky?0:.62),last=[1.02,1.36][strokes-2]??.62;
    const w=sky?256:lite?84:112,hh=sky?236:lite?168:204,ay=hh-12,V=o.colors||VOLT,hit=o.hit||0;
    const H=pxfx(c=>{let lean=o.lean??18;
        /* lean the first stroke onto the game's own bolt: where its polyline crosses the canvas top */
        if(o.pts&&o.lean==null){const Q=o.pts.map(p=>pxProj(c.handle,p[0],p[1],p[2]));for(let i=0;i<Q.length-1;i++){const [ax0,ay0]=Q[i],[bx0,by0]=Q[i+1];
          if(ay0<=0&&by0>0){const u=(0-ay0)/(by0-ay0);lean=clamp((ax0+(bx0-ax0)*u-c.x)/PX,-40,40);break;}}}
        return lightning({kind:'strike',x:c.x,ground:c.y,top:sky?0:-6,strokes,t0,lean,hit,colors:V,seed:sd,clouds:sky,cloudEnds:sky?70:0,scorch:false,
          smoke:(prim||sky)&&!hit,smokeT:sky?2.6:1.7,end:sky?3:prim&&!hit?2.2:last+.5,spark:sky?1:lite?.25:.5,spd:sky?.7:.55,lamp:!lite&&(prim||sky),
          shake:hookShake(sky?.6:prim?.3:.12),flash:o.flash?hookFlash(sky?.6:.3):undefined});},
      {x,y,w,hh,ay,pri:prim?1:0,lamp:!lite&&(prim||sky),ttl:sky?6:4});
    if(!H)return null;LIVE.strike.push(H);
    if(!hit&&o.scorch!==false){const rx=Math.round((o.rx??(prim?15:9))*(sky?1.3:1)*Math.min(1.3,.75+.3*k)),ry=Math.round(rx*.72),d=Math.max(0,.62-t0);
      pxfx(c=>scorchDecal({x:c.x,y:c.y,rx,ry,delay:d}),{x,y,mode:'flat',w:rx*2+14,hh:ry*2+14,ax:rx+7,ay:ry+7,pri:0,ttl:d+3.6});}
    return H;}
  /* an electric hit h world units above the ground point (x, y): o.size (1 = SF's), colors, delay, flash, shake, lamp */
  function pxLightningImpact(x,y,h,o={}){const S=o.size??1,hp=Math.round(h/PIX),sd=seed++,V=o.colors||VOLT,lite=PERF.lite;
    const w=Math.round(Math.min(160,64+70*S)),hh=Math.round(Math.min(160,hp+44*S+26)),ay=hh-10;
    return pxfx(c=>delayed(()=>lightning({kind:'impact',x:c.x,y:c.y-hp*PX,size:S,ground:c.y,colors:V,plasma:V===VOLT?undefined:[V[0],V[2],V[4]],seed:sd,
        sparks:Math.round((o.sparks??64)*(lite?.35:.6)),spd:.6,puffs:lite?2:5,lamp:!!o.lamp&&!lite,
        flash:o.flash?hookFlash(.45):undefined,shake:o.shake?hookShake(.5):undefined}),o.delay||0),
      {x,y,w,hh,ay,pri:o.pri??1,lamp:!!o.lamp&&!lite,ttl:3+(o.delay||0)});}
  /* the canvas for one chain link: anchored on the ground between its ends, big enough for both ends, their ground and forks */
  function linkBox(a,b){const cp=CAM.cp,sp=CAM.sp,mx=(a[0]+b[0])/2,my=(a[2]+b[2])/2,u=(p,h)=>[(p[0]-mx)/PIX,-(h*cp-(p[2]-my)*sp)/PIX];
    const A=u(a,a[1]||0),B=u(b,b[1]||0),Ag=u(a,0),Bg=u(b,0),M=24;
    const x0=Math.min(A[0],B[0])-M,x1=Math.max(A[0],B[0])+M,y0=Math.min(A[1],B[1],0)-M,y1=Math.max(Ag[1],Bg[1],0)+8;
    return{mx,my,w:Math.min(320,Math.ceil(x1-x0)),hh:Math.min(240,Math.ceil(y1-y0)),ax:Math.round(-x0),ay:Math.round(-y0)};}
  /* a world point that follows its entity: [x, h, y] -> () => [x, h, y] now */
  function track(p,e){if(!e)return()=>p;const ox=p[0]-e.x,oy=p[2]-e.y,hand=e===P||pets.includes(e);let lx=p[0],ly=p[2];
    return()=>{if(pxAlive(e)){lx=e.x+(hand?ox:0);ly=e.y+(hand?oy:0);}return[lx,p[1],ly];};}
  /* the entity a game point sits on: a foe (its body), the hero or a pet (a hand) */
  function entAt(p){let best=null,bd=38;for(const e of enemies){if(!live(e)||e.node)continue;const d=Math.hypot(e.x-p[0],e.y-p[2]);if(d<bd){bd=d;best=e;}}
    if(best)return best;if(P&&!P.dead&&Math.hypot(P.x-p[0],P.y-p[2])<44)return P;for(const w of pets)if(Math.hypot(w.x-p[0],w.y-p[2])<30)return w;return null;}
  /* chain lightning through world points pts = [[x, h, y], ...] (the hand first). One canvas per link; hop i lands at i x .05 s.
     o: colors, dur (hold), impacts (an electric impact on each foe struck), shock (Electrified seconds), flash, hand (draw the hand) */
  function pxLightningChain(pts,o={}){if(!pts||pts.length<2)return[];const V=o.colors||VOLT,ents=pts.map(p=>entAt(p)),T=pts.map((p,i)=>track(p,ents[i])),out=[],LINK=.05;
    for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];if(Math.hypot(b[0]-a[0],b[2]-a[2])<6)continue;const B=linkBox(a,b),sd=seed++;
      const H=pxfx(c=>{const Hd=c.handle,pr=q=>{const [X,Y]=pxProj(Hd,q[0],q[1],q[2]);return[clamp(X,6,c.w-6),clamp(Y,6,c.h-4)];};
          const g0=pxProj(Hd,a[0],0,a[2]),g1=pxProj(Hd,b[0],0,b[2]),gr=x=>Math.abs(g1[0]-g0[0])<1?c.y:lerp(g0[1],g1[1],clamp((x-g0[0])/(g1[0]-g0[0]))),fa=T[i],fb=T[i+1];
          return delayed(()=>lightning({kind:'arc',from:()=>pr(fa()),to:[()=>pr(fb())],ground:gr,duration:o.dur??.4,colors:V,plasma:V===VOLT?undefined:[V[0],V[2],V[4]],seed:sd,spd:.6,tail:.35,
            hand:i===0&&o.hand!==false,flash:i===0&&o.flash!==false?hookFlash(.5):undefined,shake:i===0?hookShake(.6):hookShake(.4)}),i*LINK);},
        {x:B.mx,y:B.my,w:B.w,hh:B.hh,ax:B.ax,ay:B.ay,pri:1,ttl:3});
      if(H)out.push(H);
      const e=ents[i+1];
      if(o.impacts!==false&&(e&&e!==P||!e))pxLightningImpact(b[0],b[2],b[1],{size:o.impactS??(e&&e.boss?.8:.55),colors:V,delay:i*LINK,sparks:40,pri:0});
      if(o.shock!==false&&e&&e!==P&&!pets.includes(e))pxLightningShock(e,o.shock||1,{colors:V,delay:i*LINK});}
    return out;}
  /* Electrified: arcs crackle over the entity's live outline for dur seconds (struck again, it holds on); at most 8 (lite 4) at once,
     the ones nearest the hero kept. The shocks make the entity twitch (its hit flash and a squash) */
  function pxLightningShock(e,dur=1,o={}){if(!e||!pxAlive(e))return null;const M=LIVE.shock,cap=PERF.lite?4:8;
    for(const [q,H] of M)if(!alive(H)||H.stopped)M.delete(q);
    const cur=M.get(e);if(cur){cur.fx.hold?.(dur);return cur;}
    if(M.size>=cap){let far=null,fd=-1;for(const [q] of M){const d=Math.hypot(q.x-P.x,q.y-P.y);if(d>fd){fd=d;far=q;}}
      if(!far||Math.hypot(e.x-P.x,e.y-P.y)>=fd)return null;pxStop(M.get(far));M.delete(far);}
    const s=pxSprAt(e.x,e.y),f=s&&s.f,fly=(e.d&&e.d.fly||0)+(e.pz||0),sd=seed++,V=o.colors||VOLT;
    const sw=f?f.w*s.s*(s.sx||1)*(f.k||1):e.boss?110:44,sh=f?f.h*s.s*(s.sy||1)*(f.k||1):e.boss?110:44;
    const w=Math.round(clamp(sw+40,64,256)),hh=Math.round(clamp(sh+fly/PIX+34,56,220)),ay=hh-12;
    const H=pxfx(c=>delayed(()=>lightning({kind:'crackle',actor:c.actor,x:c.x,y:c.y-sh*PX*.5,radius:sw*.6,ground:c.y,duration:dur,colors:V,plasma:V===VOLT?undefined:[V[0],V[2],V[4]],seed:sd,spd:.7,
        shake:e===P?hookShake(.6):undefined,cue:()=>{if(!pxAlive(e))return;e.flash=Math.max(e.flash||0,.45);if(!e.boss)kick(e,e===P?-.08:.12);}}),o.delay||0),
      {follow:e,w,hh,ay,pri:1,ttl:dur+6});
    if(H)M.set(e,H);return H;}
  /* the full Sprite Fusion strike scene (leader, storm cloud, three strokes) at a ground point: the lab's and big moments' */
  function pxLightning(x,y,o={}){return pxLightningStrike(x,y,Object.assign({sky:true,primary:true,flash:true,force:true},o));}

  /* ---------- wiring ---------- */
  /* skyStrike throws round(3 + 2k) bolts over .06 s steps: the first lands on (x, y) and leads, the rest follow it */
  let burst=null;
  onEv('pxElem',(kind,x,y,R,k)=>{if(kind==='storm')burst={x,y,R,k,t:gameTime,n:0};});
  /* 'zap' ground strikes: their last .42 s grow SF's stepped leader down to the spot; the stroke lands with the game's bolt */
  const zaps=[],leads=[];
  {const o=ground;ground=function(g){const r=o(g);try{if(r&&r.kind==='zap'&&r.delay>.05&&!r.dur)zaps.push(r);}catch(err){console.error(err);}return r;};}
  onEv('update',dt=>{
    for(let i=zaps.length-1;i>=0;i--){const g=zaps[i];g.pxA=(g.pxA||0)+dt;const left=g.delay-g.t;
      if(g.dead||left<=0||g.pxA>g.delay+.5){zaps.splice(i,1);continue;}
      if(left>.42||g.pxL)continue;g.pxL=1;zaps.splice(i,1);
      if(leads.some(L=>Math.hypot(L.x-g.x,L.y-g.y)<70&&Math.abs(L.at-(gameTime+left))<.15))continue;
      if(P&&Math.hypot(g.x-P.x,g.y-P.y)>1100)continue;
      const H=pxLightningStrike(g.x,g.y,{k:g.team==='p'?.8:.7,t0:.62-left,primary:true,strokes:1,lean:Math.round((hash(seed,7)-.5)*36),rx:12});
      if(H)leads.push({x:g.x,y:g.y,at:gameTime+left,used:false});}
    for(let i=leads.length-1;i>=0;i--)if(gameTime-leads[i].at>.4)leads.splice(i,1);});
  function skyBolt(pts,c){const z=pts[pts.length-1],x=z[0],y=z[2],zh=z[1]>45?z[1]:0;
    let k=1,primary=true;
    if(burst&&gameTime-burst.t<.45&&Math.hypot(x-burst.x,y-burst.y)<=burst.R+90){k=burst.k;primary=burst.n++===0;}
    for(const L of leads)if(!L.used&&Math.hypot(L.x-x,L.y-y)<34&&Math.abs(L.at-gameTime)<.25){L.used=true;return;}
    if(P&&Math.hypot(x-P.x,y-P.y)>1100)return;
    pxLightningStrike(x,y,{k,primary,colors:rampFor(c),pts,hit:zh,flash:primary&&k>=1.15});}
  function chainBolt(pts,c,max){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][2]-pts[i-1][2]);if(L<40)return;
    if(P&&Math.hypot(pts[0][0]-P.x,pts[0][2]-P.y)>1100)return;
    pxLightningChain(pts,{colors:rampFor(c),dur:clamp((max??.32)+.06,.24,.5)});}
  /* every bolt the game draws: from the sky (first point >= 250 up, last <= 120) -> a strike; low chains (all <= 80) -> chain arcs.
     Bolts shorter-lived than .2 s are the game's flickers (telegraphs, muzzles, ambient sparks) and stay as they are */
  {const o=bolt;bolt=function(pts,c,max){const r=o(pts,c,max);
    try{if(Array.isArray(pts)&&pts.length>=2&&(max??.32)>=.2&&state==='play'){const a=pts[0],z=pts[pts.length-1];
      if(a[1]>=250&&z[1]<=120)skyBolt(pts,c);else if(pts.every(p=>p[1]<=80))chainBolt(pts,c,max);}}catch(err){console.error(err);}
    return r;};}
  /* Spirit Tempest (Blademaster ultimate): each blink-slash trails a violet spirit arc onto its foe; the finale bursts in a spirit impact */
  {const o=runTempest2;runTempest2=function(p,Tm){const e=Tm.list[Tm.k],ok=!!e&&live(e)&&Tm.k<Tm.list.length,x0=p.x,y0=p.y,fin=Tm.k>=Tm.list.length;
    const r=o(p,Tm);
    try{if(ok&&p===P)pxLightningChain([[x0,36,y0],[e.x,30+(e.d.fly||0),e.y]],{colors:SPIRIT,dur:.2,flash:false,hand:false,shock:.6,impactS:.5});
      if(fin&&p===P&&!p.tempest)pxLightningImpact(p.x,p.y,40,{colors:SPIRIT,size:1.35,sparks:90,flash:true,shake:true,lamp:true});}catch(err){console.error(err);}
    return r;};}
  /* Electrified: foes hit by the hero's lightning (the cast's damage type, the strike's dt, or the game's lightning hit colours) */
  const LCOL={'#c8d8ff':VOLT,'#c8e4ff':VOLT,'#bfe4ff':VOLT,'#e4d0ff':STORM,'#fff6b0':null};
  onEv('pxHit',(e,dmg,src,opt,crit)=>{if(!P||src!==P||opt.dot||!e||e.node||!live(e))return;
    const col=opt.color,lit=opt.dt==='lightning'||curDT==='lightning'||(col&&col in LCOL);if(!lit)return;
    pxLightningShock(e,Math.max(1,Math.min(2.5,e.stun||0)),{colors:col&&LCOL[col]!==undefined?(LCOL[col]||rampFor(col)):VOLT});});
  /* the hero zapped: harpy bolts and storm strikes ('zap' projectiles / grounds), the Stormcrown Knight's and Vortigan's spears */
  onEv('pxPHurt',(dmg,src)=>{if(!P||P.dead||!src)return;if(src.kind==='zap'||src.type==='stormknight'||src.type==='vortigan')pxLightningShock(P,.8);});
  onEv('resetWorld',()=>{zaps.length=0;leads.length=0;LIVE.strike.length=0;LIVE.shock.clear();burst=null;});
  onEv('respawn',()=>{zaps.length=0;leads.length=0;LIVE.strike.length=0;LIVE.shock.clear();burst=null;});

  /* ---------- lab ---------- */
  const foe=(type,x,y)=>{const e=mkEnemy(type,x,y,Math.max(1,P.lvl-2),null);e.state='idle';e.spawn=null;enemies.push(e);return e;};
  pxlab('lightning-sky','Strike from the sky (full scene)','Lightning','sf',(x,y)=>pxLightning(x+40,y-20));
  pxlab('lightning-strike','Strike (game bolt)','Lightning','sf',(x,y)=>pxLightningStrike(x+30,y,{k:1,primary:true,flash:true}));
  pxlab('lightning-skystrike','skyStrike burst (game)','Lightning','sf',(x,y)=>skyStrike(x+40,y,90,1));
  pxlab('lightning-zap','Zap strike with leader (game)','Lightning','sf',(x,y)=>ground({x:x+30,y,r:66,delay:.62,team:'p',dmg:0,c:'#bfe8ff',kind:'zap',fx:zapFx}));
  pxlab('lightning-impact','Electric impact','Lightning','sf',(x,y)=>pxLightningImpact(x,y,40,{size:1,flash:true,shake:true,lamp:true}));
  pxlab('lightning-chain','Chain arc','Lightning','sf',(x,y)=>{const L=[foe('wolf',x+10,y-30),foe('wolf',x+120,y+20),foe('wolf',x+210,y-40)];
    pxLightningChain([[P.x+24,40,P.y],...L.map(e=>[e.x,30,e.y])],{dur:.6});});
  pxlab('lightning-shock','Electrified (wolf)','Lightning','sf',(x,y)=>{const e=foe('wolf',x+20,y);e.stun=1.8;pxLightningShock(e,1.8);});
  pxlab('lightning-shock-hero','Electrified (hero)','Lightning','sf',()=>pxLightningShock(P,1.8));
  pxlab('lightning-tempest','Spirit arc (Tempest)','Lightning','orig',(x,y)=>{const e=foe('skeleton',x+60,y-10);
    pxLightningChain([[P.x,36,P.y],[e.x,30,e.y]],{colors:SPIRIT,dur:.4,hand:false,shock:1.2,impactS:.6});});
  return{pxLightning,pxLightningStrike,pxLightningChain,pxLightningImpact,pxLightningShock};})();
