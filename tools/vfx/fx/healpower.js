/* HEAL + POWER UP (Sprite Fusion "Heal & Mana" and "Power Up", MIT, ported): the hero's heals, resource refills and buffs as SF's
   pixel effects. Every heal (pxHeal) raises outlined green crosses round the hero with a floor glow, a soft column and bands of light
   climbing the sprite (potions biggest, tiny lifesteal / regen heals pooled and rate-limited); a resource jump of more than 25 % of
   resMax drops SF's elixir drops, bubbles and helix in the class resource's colour; a buff starting in P.buffs (surge avatar starsurge
   titan bloodlust unbreak dguard venom warcry dragon) plays SF's Power Up in the stat's colour, the aura gripping the hero's own outline.
   HEAL recipe (SF numbers; sizes in art px, positions and speeds in SF world units, 2 per art px; S = tier size, D = tier time scale):
   - Timeline: 0-0.45 s the floor glow spreads to +-19.5 S px (outCubic); sweeps climb the sprite at 0.1, 0.65, 1.2 s (0.4 s each, carry
     on to 0.52 s); crosses pop in one every 0.085 s from 0.06 s (+0-0.05 s), rise 50-90/s, sway sin(4.5 age + seed) x 16/s, live 1-1.4 s,
     dither out over their last 40 %; streaks loop; sparkles until 2 D s; everything fades 1.9 D - 2.7 D s; done after 2.8 D s.
     Tiers: potion (drinkPotion) 20 crosses S 1.1 D 1.05; big (>= 20 % maxHp) 16, S 1, D 1; mid (>= 7 %) 9 crosses, S .85, D .8, 2 sweeps;
     small (pooled heals < 7 %, at most one every 1.4 s once 1.2 % maxHp has pooled) 4 crosses, S .65, D .6, 1 sweep. A heal within 0.5 s
     of the last one adds 3-6 crosses to it instead of starting another.
   - Layers: back = column (13 light glows every 6 px to 78 S px, r 22, step 3, .13 (1 - h/90 S)), 22 S streaks (5 px: step 1, 2, 2, 4, 4,
     x (1 - d/6), rising 2 -> 76 S px in 0.53-0.9 s, spread +-17 S narrowing 30 %). Front = floor glow (step 1 < .3, 2 < .65, 3; row above
     at 35 %; light r 10 every 5 px) with 8 looping motes (22 px climb, white then step 1), the sweep (band row white at 1.5, 3 rows step 1,
     6 rows step 2 at (1 - d/10) 1.4, the outline 1 px outside step 1, light r 14 step 2), crosses (big: 3 px wide arms L 4, top / left step 1,
     bottom / right step 4, inside step 2; small: 1 px arms L 2, top-left halves step 1, rest step 3; pop L-1 / L+1 / L; outline #1a1422;
     glint white while sin(14 age + seed) > .75; light r 9 / 12 step 2 .4), sparkles (45 % per update within +-34 / 76 up, 30 % plus stars
     1.6-2.6, drag 1.6, lift 10/s^2). Mana adds the helix (2 strands x 4 comets, 14 dots, r 17 -> 10 px, 70 px climb in 2 s, near side front
     white / step 1 / step 2 / step 3, far side back step 3 / 4 at 75 %), drops (5 x 8 and 3 x 5 pixel sprites) and bubbles (16 % per update,
     ring r 1 or 2, step 1 upper left, step 4 bottom, pop to 4 diagonal pixels in the last 0.07 s).
   - Palette: heal #ffffff #e6ffdc #acff92 #62e26a #30b55b #20804c #175237 #0f3125 (the game's heal text is #7dffa0); mana #ffffff #e4f2ff
     #a9d4ff #64a4ff #4170f0 #3449b8 #26307c #171c4a; spirit jade, focus gold, energy violet, rage crimson, valor sky ramps of the same shape.
   POWER UP recipe (BURST 0.32, HOLD 1.75, FADE 2.35; S size, B box scale 1.38 for Titan's giant sprite):
   - 0-0.32 s 3 S streaks per update fly in from an ellipse 34-64 sqrt S px round the body middle (22 px up), squashed 0.8, at 260-420/s
     (7 px lines, white 2.5 px heads). 0.32 s burst: shake .32 S x .35, flash .22 S x .6 in C3, the sprite tinted (lum > .5 C1 / C0 at
     peak, > .22 C2, else C4, at 1.5 e), a shock runs both ways along the floor row (R = 72 z, z = .45 S: white flare +-14 z, heads with
     crests 6 z, trails white / C1 / C2 / C3, afterglow glints, 24 z sparks), 18 S dust puffs (alpha discs), 22 S burst stars.
   - Aura (back): every pixel within 24 px of the body (3-4 chamfer distance of the live silhouette in a 64 x 76 B box) lit to
     reach = aura S (3.4 + 14 n (.3 + 1.15 up)) (1 + .3 flare), n = value noise (.5 x, .26 (y + 34 t)) ^1.4 scrolling up, up = 0 at the
     body middle -> 1 16 px above: bands C1 < .22 (C0 < .14 in a flare), C2 < .45, C3 < .7, then Bayer-dithered C4 / C5. Flares at 0.32,
     0.87, 1.32 s (Gaussian .08 / .07 s), tint again at 0.87 and 1.32 s. Speed streaks (6-16 px, white top, lower half dithered), wisps off
     the upper body, rising stars. Light: body glow r (34 + 20 flare) S C3, foot glow r 30 S C2.
   - Embervale: while the buff lasts the aura eases from full to 45 % over 1.75-2.35 s and holds there, a soft rim flare every 2.6 s, streaks
     ~18/s, wisps and stars thinned; it fades over 0.6 s when the buff ends (0.25 s when replaced: one aura at a time, the newest buff wins;
     when it ends and another tracked buff still runs, that one's aura comes back quietly without the burst). Motes and crosses are
     world-anchored (they stay where they were shed when the hero moves). Palettes (7 steps, white -> darkest): surge SF cyan, avatar sun gold,
     starsurge star pink, titan strength red, bloodlust crimson, unbreak bronze, dguard steel blue, venom toxic green, warcry rage orange,
     dragon fire, Shadow Form void violet. */
const {pxHealpower,pxHealpowerMana,pxHealpowerAura}=(function(){'use strict';
  const {Px,dot,Rng,mix,scale,hex,cl:clamp,smooth,outExpo,hash,noise2,lum,bayer,TAU,PXW:PX,WHITE}=PXK;
  const OUTLINE=hex('#1a1422'),frac=x=>x-Math.floor(x);
  const HEAL_RAMP=['#ffffff','#e6ffdc','#acff92','#62e26a','#30b55b','#20804c','#175237','#0f3125'];
  const MANA_RAMP=['#ffffff','#e4f2ff','#a9d4ff','#64a4ff','#4170f0','#3449b8','#26307c','#171c4a'];
  const RES_RAMP={mana:MANA_RAMP,
    valor:['#ffffff','#e4f8ff','#aae2ff','#66bcff','#3f86e6','#2f56b0','#22347a','#141e48'],
    spirit:['#ffffff','#e8fff2','#b0f5c8','#6adca0','#33b07c','#20805e','#165244','#0f312b'],
    focus:['#ffffff','#fff7dc','#ffe49a','#ffc84a','#e8961f','#b0621a','#6e3c14','#3a210e'],
    energy:['#ffffff','#f6e9ff','#dcbcff','#b88cff','#8c5ce8','#6038b4','#3c2478','#21143f'],
    rage:['#ffffff','#ffe4da','#ffb09a','#ff6e56','#e0382e','#a82024','#6a1420','#3a0d14']};
  const ER=(f,m)=>(x,y)=>clamp((Math.min(x,f.w-1-x,y)-1)/m);

  /* ---------- Heal & Mana (SF heal.ts), with tier scales S / D, an anchor for world-anchored crosses and more() for merged heals ---------- */
  function cross(buf,x,y,L,w,r,a,glint){const px=Math.round(x),py=Math.round(y);
    const ins=(dx,dy)=>(Math.abs(dx)<=w&&Math.abs(dy)<=L)||(Math.abs(dy)<=w&&Math.abs(dx)<=L);
    for(let dy=-L-1;dy<=L+1;dy++)for(let dx=-L-1;dx<=L+1;dx++){let c;
      if(ins(dx,dy)){const top=!ins(dx,dy-1),left=!ins(dx-1,dy),bottom=!ins(dx,dy+1),right=!ins(dx+1,dy);
        c=w===0?(dy<0||dx<0?r[1]:r[3]):top||left?r[1]:bottom||right?r[4]:r[2];
        if(glint&&((dx===0&&dy===0)||(w>0&&dx===-w&&dy===-L)))c=WHITE;}
      else if(ins(dx-1,dy)||ins(dx+1,dy)||ins(dx,dy-1)||ins(dx,dy+1))c=OUTLINE;else continue;
      dot(buf,px+dx,py+dy,c,a);}}
  const DROP=[['..1..','..2..','.122.','.1223','1W223','12223','22234','.334.'],['.1.','.2.','1W3','223','.3.']];
  function drop(buf,x,y,s,r,a,glint){const m=DROP[s],h=m.length,w=m[0].length,x0=Math.round(x)-(w>>1),y0=Math.round(y)-(h>>1);
    const ins=(i,j)=>j>=0&&j<h&&i>=0&&i<w&&m[j][i]!=='.';
    for(let j=-1;j<=h;j++)for(let i=-1;i<=w;i++){const ch=ins(i,j)?m[j][i]:ins(i-1,j)||ins(i+1,j)||ins(i,j-1)||ins(i,j+1)?'o':'';if(!ch)continue;
      dot(buf,x0+i,y0+j,ch==='o'?OUTLINE:ch==='W'||(glint&&ch==='1')?WHITE:r[+ch],a);}}
  function bubble(buf,x,y,r,c,a){const px=Math.round(x),py=Math.round(y);
    for(let j=-r-1;j<=r+1;j++)for(let i=-r-1;i<=r+1;i++){const d=Math.hypot(i,j);
      if(Math.abs(d-r)<.6||(r===1&&Math.abs(i)+Math.abs(j)===1))dot(buf,px+i,py+j,i<0&&j<0?c[1]:j>0?c[4]:c[2],a);}}
  /* SF's sparkle particles (twinkling pixels and plus stars), drawn shifted by the world anchor (ox, oy art px) */
  class Sparks{constructor(R){this.list=[];this.t=0;this.R=R;}
    spawn(x,y,vx,vy,life,col,size){this.list.push({x,y,vx,vy,life,max:life,col,size,seed:this.R.next()*100});}
    update(dt){this.t+=dt;for(let i=this.list.length-1;i>=0;i--){const p=this.list[i];if((p.life-=dt)<=0){this.list.splice(i,1);continue;}
      p.vx-=p.vx*1.6*dt;p.vy-=p.vy*1.6*dt+10*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}}
    draw(buf,light,ox,oy,E){for(const p of this.list){const k=p.life/p.max,ax=p.x/PX+ox,ay=p.y/PX+oy,px=Math.floor(ax),py=Math.floor(ay),e=E(px,py);if(e<=0)continue;
      const tw=.6+.4*Math.sin(this.t*(8+(p.seed%5))+p.seed);
      if(p.size<1){if(tw*k*e>.25)buf.set(px,py,tw>.8?WHITE:p.col);light.glow(ax,ay,3,p.col,.4*k*tw*e);continue;}
      const arm=Math.max(1,Math.round(p.size*tw*Math.min(1,k*3))),tip=scale(p.col,.75);
      for(let d=1;d<=arm;d++){const cc=d===arm&&arm>1?tip:p.col;dot(buf,px+d,py,cc,e*2);dot(buf,px-d,py,cc,e*2);dot(buf,px,py+d,cc,e*2);dot(buf,px,py-d,cc,e*2);}
      if(arm>=3)for(let j=0;j<4;j++)dot(buf,px+(j&1?-1:1),py+(j&2?-1:1),tip,e*2);
      dot(buf,px,py,WHITE,e*2);light.glow(ax,ay,3+arm*2,p.col,.5*k*tw*e);}}}
  function heal(o){
    const MANA=o.kind==='mana',L=(o.palette||(MANA?MANA_RAMP:HEAL_RAMP)).map(hex),R=new Rng(o.seed??1),S=o.size??1,D=o.dur??1;
    const feet=()=>o.actor?o.actor.feet():[o.x,o.y],[X0,Y0]=feet(),off=[0,0],SW=o.sweeps||[.1,.65,1.2],NS=o.streaks??22,SPK=o.sparkle??.45;
    const ps=new Sparks(R),glyphs=[],bubbles=[];let t=0;
    const add=d0=>{const life=R.range(1,1.4)*(o.life??1);glyphs.push({x:X0+R.range(-46,46)*S,y:Y0-R.range(4,70)*S,vy:-R.range(50,90),life,max:life,delay:d0,s:R.chance(o.big??.45)?1:0,seed:R.next()*1000});};
    for(let i=0;i<(o.count??(MANA?14:18));i++)add(.06+i*.085*(o.gap??1)+R.range(0,.05));
    const fade=t=>1-smooth(1.9*D,2.7*D,t);
    const floor=(buf,light,cx,fy)=>{const k=fade(t),w=19.5*S*(1-(1-clamp(t/.45))**3);
      for(let dx=-Math.ceil(w);dx<=w;dx++){const u=Math.abs(dx)/Math.max(1,w),a=k*Math.sqrt(1-Math.min(1,u))*1.04;
        dot(buf,cx+dx,fy,u<.3?L[1]:u<.65?L[2]:L[3],a);
        if(u<.75)dot(buf,cx+dx,fy-1,u<.35?L[2]:L[3],a*.35);
        if(dx%5===0)light.glow(cx+dx,fy,10,L[3],.22*k*(1-u));}
      for(let i=0;i<8;i++){const ph=frac(t*(.9+hash(i,1)*.6)+hash(i,2)),x=cx+(hash(i,3)-.5)*2*w,a=Math.sin(ph*Math.PI)*k;
        dot(buf,x,fy-1-ph*22*S,ph<.25?WHITE:L[1],a);dot(buf,x,fy-ph*22*S,L[2],a*.6);}};
    const sweep=(buf,light)=>{const s=o.actor&&o.actor.silhouette(),k=smooth(0,.25,t)*fade(t);if(!s||k<=0)return;
      const inside=(i,j)=>i>=0&&j>=0&&i<s.w&&j<s.h&&s.data[j*s.w+i]>>>24>0;
      let top=s.h,bot=-1,sx=0,n=0;for(let j=0;j<s.h;j++)for(let i=0;i<s.w;i++)if(inside(i,j)){top=Math.min(top,j);bot=j;sx+=i;n++;}
      for(const p of SW){const q=(t-p)/.4;if(q<0||q>1.3||bot<0)continue;const yb=bot+2-q*(bot-top+6);
        for(let j=top-1;j<=bot+1;j++){const d=j-yb;if(d<-1||d>=10)continue;
          for(let i=-1;i<=s.w;i++)
            if(inside(i,j))dot(buf,s.x+i,s.y+j,d<1?WHITE:d<4?L[1]:L[2],k*(d<1?1.5:(1-d/10)*1.4));
            else if(d<1.5&&(inside(i+1,j)||inside(i-1,j)||inside(i,j+1)||inside(i,j-1)))dot(buf,s.x+i,s.y+j,L[1],k);}
        light.glow(s.x+sx/n,s.y+yb,14,L[2],.5*k*(1-q/1.3));}};
    const helix=(buf,light,cx,fy,front)=>{const k=fade(t)*smooth(0,.25,t);if(k<=0)return;
      for(let s=0;s<2;s++)for(let i=0;i<4;i++){const ph=frac(t*.5+i/4+s*.125),a=Math.sin(ph*Math.PI)*k,rx=(17-ph*7)*S;
        for(let d=0;d<14;d++){const th=ph*TAU*1.6+s*Math.PI+t*2.4-d*.13,z=Math.sin(th);if(z>=0!==front)continue;
          const px=cx+Math.cos(th)*rx,py=fy-3-ph*70*S+d*.7,c=z<0?(d<5?L[3]:L[4]):d<1?WHITE:d<4?L[1]:d<8?L[2]:L[3],ad=a*(1-d/15)*(z<0?.75:1);
          dot(buf,px,py,c,ad);if(d<6&&z>=0)dot(buf,px,py+1,d<3?L[2]:L[3],ad);}
        if(front)light.glow(cx+Math.cos(ph*TAU*1.6+s*Math.PI+t*2.4)*rx,fy-3-ph*70*S,6,L[2],.4*a);}};
    return{
      update(dt){t+=dt;if(o.anchor){const a=o.anchor();off[0]=a[0]-X0;off[1]=a[1]-Y0;}
        const f=feet(),x=f[0]-off[0],y=f[1]-off[1];
        for(let i=glyphs.length-1;i>=0;i--){const b=glyphs[i];if(b.delay>0){b.delay-=dt;continue;}if((b.life-=dt)<=0){glyphs.splice(i,1);continue;}
          b.y+=b.vy*dt;b.x+=Math.sin((b.max-b.life)*4.5+b.seed)*16*dt;}
        if(MANA&&t<1.9*D&&R.chance(.16)){const life=R.range(.6,1.1);bubbles.push({x:x+R.range(-30,30)*S,y:y-R.range(0,40)*S,vy:-R.range(60,110),life,max:life,r:R.chance(.3)?2:1,seed:R.next()*10});}
        for(let i=bubbles.length-1;i>=0;i--){const b=bubbles[i];if((b.life-=dt)<=0)bubbles.splice(i,1);b.y+=b.vy*dt;b.x+=Math.sin(t*7+b.seed)*22*dt;}
        if(t<2*D&&R.chance(SPK))ps.spawn(x+R.range(-34,34)*S,y-R.range(0,76)*S,R.range(-8,8),-R.range(30,80),R.range(.5,.95),R.chance(.5)?L[1]:L[2],R.chance(.3)?R.range(1.6,2.6):R.range(.4,.9));
        ps.update(dt);},
      draw(f,layer){const buf=new Px(f,f.color),light=new Px(f,f.light),[x,y]=feet(),cx=x/PX,fy=y/PX,ox=off[0]/PX,oy=off[1]/PX,E=ER(f,6),Eg=ER(f,12);
        if(layer!=='front'){const k=fade(t)*smooth(0,.2,t);
          for(let h=0;h<78*S;h+=6)light.glow(cx,fy-h,22,L[3],.13*k*(1-h/(90*S))*(o.col??1));
          if(MANA)helix(buf,light,cx,fy,false);
          else for(let i=0;i<NS;i++){const ph=(t*(1.1+hash(i,3)*.8)+hash(i,1))%1,sx=cx+(hash(i,2)-.5)*34*S*(1-ph*.3),sy=fy-2-ph*74*S,a=Math.sin(ph*Math.PI)*k;
            for(let d=0;d<5;d++)dot(buf,sx,sy+d,d===0?L[1]:d<3?L[2]:L[4],a*(1-d/6));}}
        if(layer!=='back'){floor(buf,light,cx,fy);sweep(buf,light);if(MANA)helix(buf,light,cx,fy,true);
          for(const b of glyphs){if(b.delay>0)continue;const age=b.max-b.life,k=b.life/b.max,glint=Math.sin(age*14+b.seed)>.75,gx=b.x/PX+ox,gy=b.y/PX+oy,e=E(gx,gy-5);if(e<=0)continue;
            if(MANA)drop(buf,gx,gy,age<.05?1:b.s?0:1,L,(k<.4?k/.4:1)*e,glint||age<.1);
            else{const big=b.s?4:2,Lc=age<.05?big-1:age<.1?big+1:big;cross(buf,gx,gy,Lc,b.s,L,(k<.4?k/.4:1)*e,glint);}
            light.glow(gx,gy,9+b.s*3,L[2],.4*Math.min(1,k*2)*Eg(gx,gy));}
          for(const b of bubbles){const bx=b.x/PX+ox,by=b.y/PX+oy;
            if(b.life<.07){for(let j=0;j<4;j++)buf.set(Math.round(bx+(j&1?-1:1)*(b.r+1)),Math.round(by+(j&2?-1:1)*(b.r+1)),L[1]);continue;}
            bubble(buf,bx,by,b.r,L,Math.min(1,b.life/.3)*E(bx,by));light.glow(bx,by,4+b.r*2,L[3],.25*Eg(bx,by));}
          ps.draw(buf,light,ox,oy,E);}},
      /* a heal landing while this one is young: n more crosses, popping over the next 0.3 s */
      more(n){if(t>1.1*D)return false;for(let i=0;i<n;i++)add(R.range(0,.05)+i*.06);return true;},
      lamp(){const k=fade(t)*smooth(0,.2,t)*(o.lampI??.8),c=L[3];return{i:k,c:[(c&255)/255,((c>>>8)&255)/255,((c>>>16)&255)/255],r:120*S,h:28};},
      done:()=>t>2.8*D&&ps.list.length===0&&bubbles.length===0&&glyphs.length===0};}

  /* ---------- Power Up (SF power-up.ts): live-silhouette aura, with a held sustain while the buff lasts ---------- */
  const BURST=.32,HOLD=1.75,FADE=2.35,PULSE1=BURST+.55,PULSE2=BURST+1,IN=0,DUST=1,STREAK=2,STAR=3,WISP=4,DUSTC=hex('#6a5e82');
  function drawMote(buf,light,m,ox,oy,E){const k=m.life/m.max,x=m.x+ox,y=m.y+oy,e=E(x,y);if(e<=0)return;
    if(m.k===IN){const sp=Math.hypot(m.vx,m.vy)||1,ux=m.vx/sp,uy=m.vy/sp;
      if(e<1&&e<bayer(Math.floor(x),Math.floor(y)))return;
      buf.line(x-ux*7,y-uy*7,x-ux*3,y-uy*3,m.c);buf.line(x-ux*2.5,y-uy*2.5,x,y,WHITE);}
    else if(m.k===STREAK){const l=m.s*(.5+.5*k);
      for(let j=0;j<=l;j++)dot(buf,x,y+j,j<1.5?WHITE:m.c,(j<l*.5?1:(1-j/(l+1))*1.6)*e);
      light.glow(x,y+l*.3,4,m.c,.3*k*e);}
    else if(m.k===WISP){const r=m.s*(.35+.65*k);if(e<.5)return;
      buf.disc(x,y,r+.7,k>.5?m.c:scale(m.c,.7));if(k>.35)buf.disc(x-.3,y-.4,r*.55,k>.7?WHITE:m.c);
      light.glow(x,y,5+r*2,m.c,.3*k*e);}
    else if(m.k===STAR){const px=Math.floor(x),py=Math.floor(y),tw=.6+.4*Math.sin(m.life*26+m.x);if(tw*k*e<.2)return;
      const arm=Math.round(m.s*tw*Math.min(1,k*2.5));
      for(let d=1;d<=arm;d++){const c=d===arm&&arm>1?scale(m.c,.75):m.c;buf.set(px+d,py,c);buf.set(px-d,py,c);buf.set(px,py+d,c);buf.set(px,py-d,c);}
      buf.set(px,py,tw>.75?WHITE:m.c);light.glow(x,y,3+arm*2,m.c,.45*k*tw*e);}}
  function shock(buf,light,cx,fy,t,z,L,E){const R=72*z,q=t/.55;if(q<0||q>=1.8)return;
    if(q<.5)for(let dx=-Math.round(14*z);dx<=14*z;dx++){const u=Math.abs(dx)/(14*z),a=(1-q/.5)*(1-u)*2.2;
      dot(buf,cx+dx,fy,u<.3?WHITE:u<.6?L[1]:L[2],a);dot(buf,cx+dx,fy-1,u<.4?L[1]:L[2],a*.7);dot(buf,cx+dx,fy+1,L[2],a*.5);}
    const reach=4+R*outExpo(Math.min(1,q)),after=1-clamp((q-.25)/1.4),f=Math.floor(t*20);
    for(let dx=-Math.round(reach);dx<=reach;dx++){const u=Math.abs(dx)/reach,g=hash(Math.round(cx+dx)*7+f*613)<.04*after;
      dot(buf,cx+dx,fy,g?WHITE:u<.5?L[2]:L[3],g?1:after*.8*(1-u*.5));dot(buf,cx+dx,fy-1,L[3],after*.3*(1-u));}
    if(q<1){const head=4+R*outExpo(q),len=(6+22*(1-q))*z,crest=6*z*(1-q)**.7;
      for(const sd of[-1,1]){for(let j=0;j<len;j++){const x=cx+sd*(head-j),a=(1-j/len)*(1-q)*2.2,lift=Math.round(crest*Math.max(0,1-j/(len*.5)));
          dot(buf,x,fy,j<2?WHITE:j<len*.35?L[1]:j<len*.7?L[2]:L[3],a);
          for(let r=1;r<=lift;r++)dot(buf,x,fy-r,j<2&&r>lift-2?WHITE:r===lift?L[1]:L[2],a*(1-r/(lift+2))*1.4);}
        for(let r=0;r<crest+3;r++)dot(buf,cx+sd*head,fy-r,WHITE,(1-q)*1.6*(1-r/(crest+3)));
        light.glow(cx+sd*head,fy-3,12*z,L[2],.8*(1-q));}
      light.glow(cx,fy,reach,L[3],.25*(1-q));}
    for(let i=0;i<Math.round(24*z);i++){const t0=hash(i,1)*.32,age=t-t0,life=.3+hash(i,4)*.3;if(age<0||age>life)continue;
      const sd=i%2?1:-1,x=cx+sd*(4+R*outExpo(t0/.55))+sd*(15+hash(i,2)*70)*age,y=fy-1-((60+hash(i,3)*90)*age-110*age*age),k=(1-age/life)*E(x,y);if(y>fy-1||k<=0)continue;
      dot(buf,x,y,age<life*.3?WHITE:L[1],1.4*k);
      if(hash(i,5)<.4&&k>.4){dot(buf,x+1,y,L[2],k*1.2);dot(buf,x-1,y,L[2],k*1.2);dot(buf,x,y+1,L[2],k*1.2);dot(buf,x,y-1,L[2],k*1.2);}
      light.glow(x,y,4,L[2],.45*k);}}
  function powerUp(o){
    const C=o.palette.map(hex),TOP=[C[0],C[1],C[2]],S=o.size??1,B=o.box??1,R=new Rng(o.seed??1),SUS=o.live?(o.sustain??.45):0,QT=o.quiet?FADE:0;
    const BW=Math.round(64*B),BH=Math.round(76*B),MID=Math.round(22*B),UP=16*B,feet=()=>o.actor?o.actor.feet():[o.x,o.y],[X0,Y0]=feet();
    const motes=[],mask=new Uint8Array(BW*BH),dist=new Uint8Array(BW*BH),off=[0,0];
    let t=QT,burst=!!o.quiet,bx0=0,by0=0,midY=0,ended=false,endT=1e9,quick=false,acc=[0,0,0];
    const base=()=>smooth(BURST-.04,BURST+.12,t)*(1-(1-SUS)*smooth(HOLD,FADE,t))*(o.quiet?smooth(QT,QT+.4,t):1);
    const env=()=>base()*(ended?1-smooth(endT,endT+(quick?.25:.6),t):1);
    const aura=()=>env()*(.85+.15*Math.sin(t*13));
    const sus=()=>{if(t<FADE)return 0;const ph=frac((t-FADE)/2.6)-.5;return .45*Math.exp(-((ph*2.6/.09)**2));};
    const flare=()=>(Math.max(Math.exp(-(((t-PULSE1)/.07)**2)),Math.exp(-(((t-PULSE2)/.07)**2)))+Math.exp(-(((t-BURST)/.08)**2)))*(o.quiet?0:1)+sus()*env();
    function body(){const [fx,fy]=feet(),cx=Math.round(fx/PX),cy=Math.round(fy/PX);bx0=cx-(BW>>1);by0=cy-BH+Math.round(6*B);midY=cy-MID;mask.fill(0);
      const s=o.actor&&o.actor.silhouette();let any=false;
      if(s)for(let y=0;y<BH;y++){const sy=by0+y-s.y;if(sy<0||sy>=s.h)continue;for(let x=0;x<BW;x++){const sx=bx0+x-s.x;if(sx>=0&&sx<s.w&&s.data[sy*s.w+sx]>>>24){mask[y*BW+x]=1;any=true;}}}
      if(!any)for(let y=0;y<BH;y++)for(let x=0;x<BW;x++){const px=bx0+x+.5-cx,py=by0+y+.5-cy;
        const head=Math.hypot(px,py+38)<4.5,trunk=Math.abs(px)<2.2&&py>-34&&py<-14,legs=py>=-14&&py<0&&Math.abs(Math.abs(px)-(py+14)*.28)<1.4;if(head||trunk||legs)mask[y*BW+x]=1;}
      for(let i=0;i<mask.length;i++)dist[i]=mask[i]?0:255;
      const rl=(i,j,w)=>{const v=dist[j]+w;if(v<dist[i])dist[i]=v;};
      for(let y=0;y<BH;y++)for(let x=0;x<BW;x++){const i=y*BW+x;if(x>0)rl(i,i-1,3);if(y>0){rl(i,i-BW,3);if(x>0)rl(i,i-BW-1,4);if(x<BW-1)rl(i,i-BW+1,4);}}
      for(let y=BH-1;y>=0;y--)for(let x=BW-1;x>=0;x--){const i=y*BW+x;if(x<BW-1)rl(i,i+1,3);if(y<BH-1){rl(i,i+BW,3);if(x<BW-1)rl(i,i+BW+1,4);if(x>0)rl(i,i+BW-1,4);}}}
    function onBody(){for(let n=0;n<40;n++){const x=R.int(0,BW-1),y=R.int(0,BH-1);if(mask[y*BW+x])return[bx0+x+.5,by0+y+.5];}return[bx0+BW/2,midY];}
    const push=(k,x,y,vx,vy,life,max,c,s,front)=>motes.push({k,x:x-off[0],y:y-off[1],vx,vy,life,max,c,s,front});
    return{
      update(dt){t+=dt;if(o.live&&!ended&&!o.live()){ended=true;endT=Math.max(t,HOLD);}
        if(o.anchor){const a=o.anchor();off[0]=(a[0]-X0)/PX;off[1]=(a[1]-Y0)/PX;}
        body();const [fx,fy]=feet(),ccx=fx/PX,ccy=midY;
        if(t<BURST)for(let i=0;i<Math.round(3*S);i++){const a=R.range(0,TAU),r=R.range(34,64)*Math.sqrt(S),sp=R.range(260,420);
          push(IN,ccx+Math.cos(a)*r,ccy+Math.sin(a)*r*.8,-Math.cos(a)*sp,-Math.sin(a)*sp*.8,r*PX/sp,r*PX/sp,R.chance(.3)?C[1]:C[2],1,true);}
        if(!burst&&t>=BURST){burst=true;
          if(o.shake)o.shake(.32*S);if(o.flash)o.flash(.22*S,`${C[3]&255},${(C[3]>>>8)&255},${(C[3]>>>16)&255}`);
          for(let i=0;i<18*S;i++){const side=R.sign();push(DUST,ccx+side*R.range(2,10),fy/PX-R.range(0,3),side*R.range(60,170),-R.range(2,16),R.range(.45,.8),.8,mix(DUSTC,C[4],.25),R.range(1.5,3),false);}
          for(let i=0;i<22*S;i++){const [x,y]=onBody();push(STAR,x,y,R.range(-40,40),-R.range(30,110),R.range(.6,1.3),1.3,R.pick(TOP),R.chance(.35)?2:R.chance(.5)?1:0,R.chance(.6));}}
        const a=aura(),fl=flare();
        if(burst&&a>.05&&!quick){
          /* SF's spawn counts during the burst and hold (at least one per update), a measured trickle once the aura holds at its sustain */
          const hold=t<HOLD,nS=(5+5*fl)*a*S*dt*10,nW=9*a*S*dt;
          if(hold)for(let n=0;n<nS;n++){const [x]=onBody(),side=R.sign();push(STREAK,x+side*R.range(5,16)*Math.sqrt(S),ccy+R.range(-16,26),0,-R.range(220,420),R.range(.14,.3),.3,R.chance(.5)?C[2]:C[1],R.range(6,16),R.chance(.5));}
          else for(acc[0]+=nS*.8;acc[0]>=1;acc[0]--){const [x]=onBody(),side=R.sign();push(STREAK,x+side*R.range(5,16)*Math.sqrt(S),ccy+R.range(-16,26),0,-R.range(220,420),R.range(.14,.3),.3,R.chance(.5)?C[2]:C[1],R.range(6,16),R.chance(.5));}
          for(acc[1]+=hold?Math.max(1,nW):.45;acc[1]>=1;acc[1]--){const [x,y]=onBody(),up=clamp((midY-y)/UP);if(R.chance(1-up*.8))continue;
            push(WISP,x+R.range(-4,4),y-R.range(6,12)*S,R.range(-15,15),-R.range(70,130),R.range(.3,.55),.55,C[2],R.range(1.4,2.4)*Math.sqrt(S),false);}
          if(R.chance(.5*a*(hold?1:.6))){const [x,y]=onBody();push(STAR,x+R.range(-8,8),y,R.range(-10,10),-R.range(25,70),R.range(.6,1.1),1.1,R.pick(TOP),R.chance(.25)?1:0,R.chance(.5));}}
        for(let i=motes.length-1;i>=0;i--){const m=motes[i];if((m.life-=dt)<=0){motes.splice(i,1);continue;}
          const drag=m.k===DUST?3.5:m.k===STAR?1.4:0;m.vx-=m.vx*drag*dt;m.vy-=m.vy*drag*dt;if(m.k===STAR)m.vy-=18*dt;m.x+=m.vx*dt/PX;m.y+=m.vy*dt/PX;}},
      draw(f,layer){const buf=new Px(f,f.color),light=new Px(f,f.light),[fx,fy]=feet(),cx=fx/PX,gy=fy/PX,a=aura(),fl=flare(),ox=off[0],oy=off[1],E=ER(f,8);
        if(layer!=='front'){
          for(const m of motes)if(m.k===DUST)buf.alphaDisc(m.x+ox,m.y+oy,m.s*(1.6-(m.life/m.max)*.6),m.c,(m.life/m.max)*.6*E(m.x+ox,m.y+oy));
          if(a>.02){const K=a*S*(1+.3*fl),D=buf.data,W=f.w;
            for(let y=0;y<BH;y++){const py=by0+y;if(py<0||py>=f.h)continue;const up=clamp((midY-py)/UP),g=.3+1.15*up,rmax=K*(3.4+14*g),ry=(py+t*34)*.26;
              for(let x=0;x<BW;x++){const dv=dist[y*BW+x];if(dv===0||dv>72)continue;const d=dv/3;if(d>rmax)continue;const px=bx0+x;if(px<0||px>=W)continue;
                const n=Math.pow(noise2(px*.5,ry,7)*.5+.5,1.4),reach=K*(3.4+14*n*g);if(d>reach)continue;const band=d/reach,i=py*W+px;
                if(band<.22)D[i]=fl>.35&&band<.14?C[0]:C[1];else if(band<.45)D[i]=C[2];else if(band<.7)D[i]=C[3];
                else if(bayer(px,py)<(1-band)*2.6)D[i]=band<.86?C[4]:C[5];}}}
          for(const m of motes)if(!m.front&&m.k!==DUST)drawMote(buf,light,m,ox,oy,E);
          const hk=t<FADE?1:.6;light.glow(cx,midY,(34+20*fl)*S*hk,C[3],(.35*a+.3*fl)*Math.min(1.4,S));light.glow(cx,gy-2,30*S*hk,C[2],.25*a);}
        if(layer==='back')return;
        if(burst&&!o.quiet)shock(buf,light,cx,gy,t-BURST,.45*S,C,E);
        const e=burst&&!o.quiet?Math.max(Math.exp(-(((t-BURST)/.07)**2)),Math.exp(-(((t-PULSE1)/.07)**2)),Math.exp(-(((t-PULSE2)/.07)**2))):0;
        if(e>.03){const s=o.actor&&o.actor.silhouette();let n=0,sx=0,top=1e9,bot=-1;
          const tint=(x,y,l)=>{n++;sx+=x;if(y<top)top=y;bot=y;dot(buf,x,y,l>.5?(e>.75?C[0]:C[1]):l>.22?C[2]:C[4],e*1.5);};
          if(s){for(let j=0;j<s.h;j++)for(let i=0;i<s.w;i++){const c=s.data[j*s.w+i];if(c>>>24)tint(s.x+i,s.y+j,lum(c));}}
          else for(let i=0;i<BW*BH;i++)if(mask[i])tint(bx0+(i%BW),by0+Math.floor(i/BW),.6);
          if(n)light.glow(sx/n,(top+bot)/2,26,C[3],.45*e);}
        for(const m of motes)if(m.front)drawMote(buf,light,m,ox,oy,E);},
      lamp(){const c=C[3];return{i:.35*env()+.8*flare(),c:[(c&255)/255,((c>>>8)&255)/255,((c>>>16)&255)/255],r:130*S,h:30};},
      ending:()=>ended,
      stop(){if(!ended||!quick){ended=true;quick=true;endT=Math.min(endT,t);}},
      done:()=>ended&&t>endT+(quick?.25:.6)&&motes.length===0};}

  /* ---------- Embervale wrappers ---------- */
  const TIERS={potion:{count:20,size:1.1,dur:1.05,streaks:24,sparkle:.5,lampI:.9},big:{count:16,size:1,dur:1,streaks:22,sparkle:.45,lampI:.75},
    mid:{count:9,size:.85,dur:.8,sweeps:[.1,.6],streaks:14,sparkle:.3,gap:.9,lampI:.45},
    small:{count:4,size:.65,dur:.6,sweeps:[.08],streaks:8,sparkle:.18,gap:.7,big:.25,life:.85,lampI:0,col:.6}};
  let seed=1,clock=0,potion=0,lastHeal=-9,healH=null,healAcc=0,accT=-9,aura=null,auraKey=null,auraT=-9,prevB={},lastRes=null,lastP=null,hurtT=-9;
  const anchorOf=H=>{const x=H.x,y=H.y;return()=>pxProj(H,x,0,y);};
  /* a heal of `amount` hp on the hero; tier potion | big | mid | small (default from the amount) */
  function pxHealpower(amount,tier){if(!P||P.dead)return null;const k=(amount||0)/Math.max(1,P.maxHp);tier=tier||(k>=.2?'big':k>=.07?'mid':'small');
    const T=TIERS[tier]||TIERS.big,lite=PERF.lite;
    const H=pxfx(c=>heal(Object.assign({},T,{actor:c.actor,anchor:anchorOf(c.handle),seed:seed++,count:Math.max(2,Math.round(T.count*(lite?.6:1)))})),
      {follow:P,split:true,w:96,hh:124,ay:114,pri:1,ttl:4,lamp:!lite&&T.lampI>0});
    if(H){healH=H;lastHeal=clock;}return H;}
  /* a resource refill: j = the jump as a fraction of resMax, res = the class resource id (mana valor spirit focus energy rage) */
  function pxHealpowerMana(j=.6,res='mana'){if(!P||P.dead)return null;const lite=PERF.lite,q=clamp((j-.25)/.75);
    return pxfx(c=>heal({kind:'mana',palette:RES_RAMP[res]||MANA_RAMP,actor:c.actor,anchor:anchorOf(c.handle),seed:seed++,count:Math.round((10+5*q)*(lite?.6:1)),size:.9+.1*q,dur:.85+.15*q,lampI:.55}),
      {follow:P,split:true,w:96,hh:124,ay:114,pri:1,ttl:4,lamp:!lite});}
  const PAL={surge:['#ffffff','#e0fcff','#8ff0ff','#3fd0ff','#2290e6','#1f4fab','#172a68'],
    avatar:['#ffffff','#fff8d8','#ffe48a','#ffc23d','#f08a1f','#b8521a','#6e2c14'],
    starsurge:['#ffffff','#ffeefc','#ffc4f2','#f08ae6','#c45ad6','#8a3aae','#4e2270'],
    titan:['#ffffff','#ffeadc','#ffb48c','#ff7848','#e0442c','#a82420','#5e1418'],
    bloodlust:['#ffffff','#ffe2e6','#ff9cac','#f2506c','#c42448','#86163a','#4a0e24'],
    unbreak:['#ffffff','#fff2da','#ffd292','#e8a44c','#b87630','#7e4c22','#4a2c16'],
    dguard:['#ffffff','#eef6ff','#c6dcf6','#8cb4e8','#5a80c8','#3a5294','#232e5c'],
    venom:['#ffffff','#f0ffd8','#caff8c','#8ce84c','#4eb030','#2c7a28','#174a1d'],
    warcry:['#ffffff','#fff0c8','#ffc86a','#ff8a2a','#e0501a','#a82a14','#5e1a10'],
    dragon:['#ffffff','#fff3a6','#ffd06b','#ff8a2a','#f2561d','#c9281f','#6e1a14'],
    shadow:['#ffffff','#f0e6ff','#ceb2ff','#9c74f0','#6a46c8','#442a8a','#24164e']};
  const KEYS=['titan','avatar','dragon','starsurge','surge','bloodlust','warcry','unbreak','dguard','venom'];
  /* the power-up aura for buff `key` on the hero (one at a time: the newest replaces the last). o.quiet: no intro (a buff that outlived
     a newer one's aura); o.pal: palette key override */
  function pxHealpowerAura(key,o={}){if(!P||P.dead)return null;
    if(aura&&!aura.dead)pxStop(aura);
    const titan=(P.buffs.titan||0)>0,B=titan?1.38:1,S=titan?1.15:1,lite=PERF.lite;
    const pk=o.pal||((key==='warcry'||key==='dguard')&&P.g2a&&P.g2a.k==='shadow'?'shadow':key),w=titan?168:144,hh=titan?156:128;
    prevB[key]=P.buffs[key]||0;
    aura=pxfx(c=>powerUp({actor:c.actor,anchor:anchorOf(c.handle),palette:PAL[pk]||PAL.surge,size:S,box:B,seed:seed++,quiet:!!o.quiet,
      live:()=>!!P&&!P.dead&&(P.buffs[key]||0)>0,sustain:.45,shake:tr=>PXK.shake(tr*.35),flash:(k,c)=>PXK.flash(k*(reduceMotion?.25:.6),c)}),
      {follow:P,split:true,w,hh,ay:hh-12,pri:1,ttl:40,lamp:!lite});
    if(aura){auraKey=key;auraT=clock;}return aura;}

  /* ---------- wiring ---------- */
  {const o=drinkPotion;drinkPotion=function(){potion++;try{return o.apply(this,arguments);}finally{potion--;}};}
  onEv('pxHeal',amt=>{try{if(!P||P.dead||!(amt>0))return;const k=amt/Math.max(1,P.maxHp);
    if(potion>0){pxHealpower(amt,'potion');return;}
    if(k>=.07){const big=k>=.2;if(healH&&!healH.dead&&clock-lastHeal<.5&&healH.fx.more&&healH.fx.more(big?6:3))return;pxHealpower(amt,big?'big':'mid');return;}
    healAcc+=amt;accT=clock;}catch(e){console.error(e);}});
  onEv('pxPHurt',()=>{hurtT=clock;});
  onEv('update',dt=>{try{clock+=dt;const p=P;if(!p)return;
    if(p!==lastP){lastP=p;prevB={};for(const k of KEYS)prevB[k]=p.buffs[k]||0;lastRes=p.res;return;}
    if(p.dead){lastRes=p.res;healAcc=0;return;}
    let st=null;for(const k of KEYS){const v=p.buffs[k]||0,pv=prevB[k]||0;if(v>.3&&pv<=.05&&!st)st=k;prevB[k]=v;}
    if(st)pxHealpowerAura(st);
    else if(!aura||aura.dead||(aura.fx&&aura.fx.ending&&aura.fx.ending())){let best=null,bv=1.2;for(const k of KEYS){const v=p.buffs[k]||0;if(v>bv&&k!==auraKey){best=k;bv=v;}}
      if(best&&clock-auraT>.5)pxHealpowerAura(best,{quiet:true});}
    const r=p.res||0,rm=p.resMax||100;
    if(lastRes!=null&&r-lastRes>.25*rm&&!st&&clock-auraT>.3&&clock-hurtT>.1)pxHealpowerMana((r-lastRes)/rm,p.cls&&p.cls.res&&p.cls.res.id);
    lastRes=r;
    if(healAcc>0){if(clock-accT>2.5)healAcc=0;else if(clock-lastHeal>=1.4&&healAcc>=p.maxHp*.012){pxHealpower(healAcc,'small');healAcc=0;}}
  }catch(e){console.error(e);}});
  onEv('pxClear',()=>{aura=null;auraKey=null;healH=null;healAcc=0;});
  onEv('respawn',()=>{lastP=null;});onEv('startGame',()=>{lastP=null;});

  const NAME={titan:'Titan',avatar:'Avatar of Dawn',dragon:'Dragonheart',starsurge:'Starsurge',surge:'Spirit Surge',bloodlust:'Bloodlust',warcry:'War Cry',unbreak:'Unbreakable',dguard:'Divine Guard',venom:'Venom Blades'};
  const DUR={titan:10,avatar:10,dragon:8,starsurge:6,surge:6,bloodlust:8,warcry:6,unbreak:5,dguard:6,venom:8};
  pxlab('healpower-potion','Potion heal (drink)','Heal & Power','sf',()=>{P.potions=Math.max(1,P.potions);P.potCd=0;P.hp=Math.round(P.maxHp*.4);drinkPotion();});
  pxlab('healpower-heal','Heal 25%','Heal & Power','sf',()=>{P.hp=Math.round(P.maxHp*.5);healP(P.maxHp*.25);});
  pxlab('healpower-mid','Heal 10%','Heal & Power','sf',()=>{P.hp=Math.round(P.maxHp*.5);healP(P.maxHp*.1);});
  pxlab('healpower-small','Small heal (pooled lifesteal)','Heal & Power','sf',()=>pxHealpower(P.maxHp*.03,'small'));
  pxlab('healpower-mana','Mana refill','Heal & Power','sf',()=>pxHealpowerMana(.8,'mana'));
  pxlab('healpower-res','Resource refill (class colour)','Heal & Power','sf',()=>{P.res=0;lastRes=0;P.res=P.resMax;});
  for(const k of KEYS)pxlab('healpower-'+k,NAME[k]+' power up','Heal & Power','sf',()=>{P.buffs[k]=DUR[k];});
  pxlab('healpower-shadow','Shadow Form power up','Heal & Power','sf',()=>{P.buffs.warcry=8;pxHealpowerAura('warcry',{pal:'shadow'});});
  return{pxHealpower,pxHealpowerMana,pxHealpowerAura};})();
