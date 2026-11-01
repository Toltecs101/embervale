/* LEVELUP (original, in Sprite Fusion's style): "Ascension", the hero's level up. A golden rune circle unfolds on the ground, a
   stepped white-gold pillar rises round the hero with rune glyphs and light motes spiralling up it, the new level pops above the head
   as a chunky pixel numeral (a 5x7 font, drawn 2x, 5 px over the head) and settles, then embers drift down as the light fades. ~2.2 s, lights the world.
   Recipe (palette G = WHITE #fff6d0 #ffe08a #f2b84a #c87a2a #6a3a1a, outline #3a1e10; two canvases following the hero:
   CIRCLE flat 96x96, PILLAR bill 88x150 split; the back layer skips the hero's live silhouette so it stays behind him):
   circle 0-0.5 s the outer double ring (r 36 G[2] + 35.4 G[1] / 33 G[3], G[5] edges at 37 and 32.2, Bayer G[4] between) sweeps on from the top (outExpo) with a WHITE spark at its head; 12 runes (5x5)
     at r 29.5 light up as the sweep passes them (WHITE for 0.08 s, then G[2]); 0.15-0.6 s the inner ring r 24 (G[2] over G[5]) sweeps the other way;
     0.3-0.75 s a hexagram grows inside it (G[3]); a hub ring r 6. Turns +0.25 rad/s. Brightness pulses at 0.55 and 1.1 s (one step
     up); 1.7-2.2 s steps down to G[3]/G[4] and Bayer-fades.
   pillar envelope smooth(0.3, 0.6) x (1 - smooth(1.4, 1.9)); half width (11 + 1.5 sin 11t) x env; bands |dx|/W < .22 G[1] (WHITE in
     pulses), < .5 G[2], < .78 G[3], else G[4], drawn at densities .85 / .6 / .4 / .22 through the Bayer matrix (no alpha), thinning
     with height above 80 px; 4 light glows r 20 (0.14, pulses 0.3) up the column; streaks (4-10 px, WHITE head, 170-280 px/s) 34/s while env > .1.
   glyphs 12 runes (5x5 with a 1 px dark drop shadow) spawned 0.2-1.3 s spiral up (r 12-17 px, 3 rad/s, 50-75 px/s), front half G[1]/G[2] in front of the hero,
     back half G[3] behind; motes: 22 four-arm sparkles rising 20-60 px/s, twinkling, WHITE/G[1]/G[2].
   numeral pops at 0.55 s: frames 1-2 at 3x in WHITE with a G[2] outline, then 2x with rows stepped G[1] G[1] G[2] G[2] G[3] G[3] G[4],
     a WHITE top-left texel per font pixel, a #3a1e10 outline; settles with a damped bounce 5 px x e^(-7t) cos 18t;
     from 1.85 s rises 4 px and Bayer-dissolves by 2.2 s. Glow r 16 G[3] 0.2 behind it, pop r 34 G[3] 0.35 e^(-(t-0.55)/0.12), shake 0.08.
   embers 0.7-1.55 s, 26 of them (life 0.5-0.9 s) from the numeral and the pillar top, falling 22-44 px/s with a sway, cooling G[2] > G[3] > G[4],
     resting on the ground row and Bayer-fading. lamp i 0.9 x env, warm gold, r 220. */
const {pxLevelup}=(function(){'use strict';const {Px,dot,bayer,Rng,hex,cl:clamp,smooth,TAU,PXW:PX,outExpo,WHITE}=PXK;
  const G=['#ffffff','#fff6d0','#ffe08a','#f2b84a','#c87a2a','#6a3a1a'].map(hex),OUT=hex('#3a1e10');
  const FONT={0:['01110','10001','10011','10101','11001','10001','01110'],1:['00100','01100','00100','00100','00100','00100','01110'],
    2:['01110','10001','00001','00010','00100','01000','11111'],3:['11110','00001','00001','01110','00001','00001','11110'],
    4:['00010','00110','01010','10010','11111','00010','00010'],5:['11111','10000','11110','00001','00001','10001','01110'],
    6:['00110','01000','10000','11110','10001','10001','01110'],7:['11111','00001','00010','00100','01000','01000','01000'],
    8:['01110','10001','10001','01110','10001','10001','01110'],9:['01110','10001','10001','01111','00001','00010','01100']};
  const RUNE5=[[4,14,21,4,4],[17,10,4,10,17],[31,1,15,1,31],[4,10,17,31,17],[14,17,21,17,14],[16,24,20,18,31],[1,3,5,9,31],[27,4,31,4,27]];
  const POP=.55,END=2.2;
  const pulse=t=>Math.max(Math.exp(-(((t-POP)/.07)**2)),Math.exp(-(((t-1.1)/.08)**2)));
  function circle(o={}){
    const cx=o.x/PX,cy=o.y/PX,R=new Rng(o.seed??1);let t=0;const runes=Array.from({length:12},()=>R.int(0,RUNE5.length-1));
    return{
      update(dt){t+=dt;},
      draw(fr){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light);if(t>END)return;
        const rot=.25*t,pl=pulse(t),fade=t<1.7?1:1-(t-1.7)/.5,cool=t>1.7?1:0,up=pl>.4?-1:0,c=k=>G[clamp(k+up+cool,0,5)],
          pt=(r,an,col,a)=>dot(buf,cx+Math.cos(an)*r,cy+Math.sin(an)*r,col,a),top=-Math.PI/2;
        const sw=outExpo(Math.min(1,t/.5))*TAU;
        for(let j=0,n=Math.ceil(36*TAU*1.5);j<n;j++){const u=j/n*TAU;if(u>sw)break;const an=top+u+rot;pt(37,an,G[5],fade);pt(36,an,c(2),fade*1.1);pt(35.4,an,c(1),fade*1.1);pt(33,an,c(3),fade);pt(32.2,an,G[5],fade*.7);
          if(j%2===0)pt(34.2,an,c(4),fade*.6);}
        if(t<.5){const an=top+sw+rot;light.glow(cx+Math.cos(an)*35,cy+Math.sin(an)*35,7,G[2],.8);dot(buf,cx+Math.cos(an)*35,cy+Math.sin(an)*35,WHITE,1);}
        const sw2=outExpo(clamp((t-.15)/.45))*TAU;
        for(let j=0,n=Math.ceil(24*TAU*1.5);j<n;j++){const u=j/n*TAU;if(u>sw2)break;pt(24,top-u-rot*1.6,c(2),fade);pt(25,top-u-rot*1.6,G[5],fade*.8);}
        for(let k=0;k<12;k++){const ua=k/12*TAU,t0=.5*Math.log2(1/(1-Math.min(.999,ua/TAU)))/10;if(ua>sw)continue;
          const an=top+ua+rot,gx=Math.round(cx+Math.cos(an)*29.5),gy=Math.round(cy+Math.sin(an)*29.5),g=RUNE5[runes[k]],hot=t-t0<.08;
          for(let y=0;y<5;y++)for(let x=0;x<5;x++)if(g[y]>>(4-x)&1)dot(buf,gx-2+x,gy-2+y,hot?WHITE:c(2),fade*1.2);
          if(fade>.3)light.glow(gx,gy,4,G[3],.3*fade*(hot?2:1));}
        const hx=smooth(.3,.75,t);
        if(hx>0)for(let tri=0;tri<2;tri++)for(let s=0;s<3;s++){const a0=top+rot*1.6+tri*Math.PI+s/3*TAU,a1=a0+TAU/3,x0=cx+Math.cos(a0)*24,y0=cy+Math.sin(a0)*24,x1=cx+Math.cos(a1)*24,y1=cy+Math.sin(a1)*24;
          for(let q=0;q<=hx;q+=1/48)dot(buf,x0+(x1-x0)*q,y0+(y1-y0)*q,c(3),fade);}
        for(let j=0;j<40;j++){const an=j/40*TAU;pt(6,an,c(2),fade*smooth(.2,.4,t));}
        const env=smooth(.1,.5,t)*fade;if(env>.02)light.glow(cx,cy,34,G[3],.28*env+.3*pl);},
      done:()=>t>END};}
  function pillar(o={}){
    const R=new Rng(o.seed??1),act=o.actor;let t=0,lvl=o.lvl??1,shaken=false;const cx=o.x/PX,gy=o.y/PX;
    const ps=[];let gN=0,mN=0,eN=0,acc=0,mask=new Uint8Array(0);
    const env=()=>smooth(.3,.6,t)*(1-smooth(1.4,1.9,t));
    let S=null,head=0;const hid=(x,y)=>{if(!S)return false;const i=x-S.x,j=y-S.y;return i>=0&&j>=0&&i<S.w&&j<S.h&&!!(S.data[j*S.w+i]>>>24);};
    const bdot=(buf,x,y,c,a)=>{x=Math.floor(x);y=Math.floor(y);if(!hid(x,y))dot(buf,x,y,c,a);};
    function numeral(buf,light){const a=t<1.85?1:1-(t-1.85)/.35;if(t<POP||a<=0)return;const big=t<POP+2/60,sc=big?3:2,str=String(lvl);
      const tt=t-POP,by=Math.round((head||gy-44)-5-(t>1.85?4*(t-1.85)/.35:0)-(big?0:5*Math.exp(-7*tt)*Math.cos(18*tt))),
        W=str.length*6*sc-sc,x0=Math.round(cx-W/2),y0=by-7*sc;
      light.glow(cx,y0+3.5*sc,16,G[3],.2*a);
      const MW=W+2,MH=7*sc+2;if(mask.length<MW*MH)mask=new Uint8Array(MW*MH);else mask.fill(0,0,MW*MH);
      for(let n=0;n<str.length;n++){const ch=str[n],F=FONT[ch];for(let fy=0;fy<7;fy++)for(let fx=0;fx<5;fx++)if(F[fy][fx]==='1')
        for(let j=0;j<sc;j++)for(let i=0;i<sc;i++)mask[(1+fy*sc+j)*MW+1+n*6*sc+fx*sc+i]=i===0&&j===0?3:1;}
      for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const m=mask[y*MW+x],px=x0-1+x,py=y0-1+y;
        if(m){const fy=Math.floor((y-1)/sc),col=big?WHITE:m===3?(fy<4?WHITE:G[1]):fy<2?G[1]:fy<4?G[2]:fy<6?G[3]:G[4];dot(buf,px,py,col,a*1.2);}
        else if((x>0&&mask[y*MW+x-1])||(x<MW-1&&mask[y*MW+x+1])||(y>0&&mask[(y-1)*MW+x])||(y<MH-1&&mask[(y+1)*MW+x]))dot(buf,px,py,big?G[2]:OUT,a*1.2);}}
    return{
      setLvl(v){lvl=v;},
      update(dt){t+=dt;const e=env();
        if(!shaken&&t>=POP){shaken=true;o.shake?.(.08);}
        while(gN<12&&t>.2+gN*.09){gN++;ps.push({k:0,ph:R.range(0,TAU),r:R.range(12,17),y:gy-R.range(0,6),vy:-R.range(50,75),life:R.range(1,1.3),max:1.3,g:R.int(0,RUNE5.length-1)});}
        while(mN<22&&t>.25+mN*.05){mN++;ps.push({k:1,x:cx+R.range(-14,14),y:gy-R.range(2,40),vy:-R.range(20,60),vx:R.range(-6,6),life:R.range(.6,1.1),max:1.1,c:R.pick([WHITE,G[1],G[2]]),s:R.chance(.3)?2:1,f:R.chance(.5)});}
        if(e>.1){acc+=34*dt*e;while(acc>=1){acc--;ps.push({k:2,x:cx+R.range(-1,1)*8*e,y:gy-R.range(0,60),vy:-R.range(170,280),life:R.range(.18,.3),max:.3,l:R.range(4,10),f:R.chance(.4)});}}
        while(eN<26&&t>.7+eN*.034){eN++;const fromNum=R.chance(.55);ps.push({k:3,x:cx+R.range(-1,1)*(fromNum?12:9),y:fromNum?gy-R.range(54,68):gy-R.range(80,110),vx:R.range(-8,8),vy:R.range(22,44),life:R.range(.5,.9),max:.9,ph:R.range(0,TAU),f:R.chance(.6)});}
        for(let i=ps.length-1;i>=0;i--){const p=ps[i];if((p.life-=dt)<=0){ps.splice(i,1);continue;}
          if(p.k===0){p.ph+=3*dt;p.y+=p.vy*dt;}
          else if(p.k===3){p.vy+=40*dt;p.vy-=p.vy*.8*dt;p.x+=(p.vx+Math.sin(p.life*7+p.ph)*10)*dt;p.y=Math.min(gy,p.y+p.vy*dt);}
          else{p.vx=(p.vx||0)*(1-1.5*dt);p.x+=(p.vx||0)*dt;p.y+=p.vy*dt;if(p.k===1)p.vy-=p.vy*1.2*dt;}}},
      draw(fr,layer){const buf=new Px(fr,fr.color),light=new Px(fr,fr.light),e=env(),pl=pulse(t);
        const front=layer==='front';if(!front){S=act?.silhouette?.()||null;head=gy-44;if(S){const D=S.data;let k=D.findIndex(v=>v>>>24);if(k>=0)head=S.y+Math.floor(k/S.w);}}
        const B=front?(x,y,c,a)=>dot(buf,x,y,c,a):(x,y,c,a)=>bdot(buf,x,y,c,a);
        if(!front&&e>.02){const W=(11+1.5*Math.sin(t*11))*e,top=Math.max(0,gy-150);
          for(let y=Math.floor(gy);y>=top;y--){const h=gy-y,vf=h<80?1:1-(h-80)/60;if(vf<=0)break;const wob=Math.sin(y*.35+t*9)*.8;
            for(let x=Math.floor(cx-W-2);x<=Math.ceil(cx+W+2);x++){const u=Math.abs(x+.5-cx-wob)/Math.max(.5,W);if(u>=1)continue;
              const col=u<.22?(pl>.5?WHITE:G[1]):u<.5?G[2]:u<.78?G[3]:G[4],den=(u<.22?.85:u<.5?.6:u<.78?.4:.22)*vf*Math.min(1,e*1.4);
              if(den>=1||bayer(x,y)<den)bdot(buf,x,y,col,1);}}
          for(let k=0;k<4;k++)light.glow(cx,gy-12-k*24,20,G[3],(.14+.16*pl)*e*(1-k*.18));}
        for(const p of ps){const k=p.life/p.max;
          if(p.k===0){const fr0=Math.sin(p.ph)>0;if(fr0!==front)continue;const x=Math.round(cx+Math.cos(p.ph)*p.r),y=Math.round(p.y),g=RUNE5[p.g],a=Math.min(1,k*2.2)*(gy-y<95?1:.5);
            for(const pass of [0,1])for(let yy=0;yy<5;yy++)for(let xx=0;xx<5;xx++)if(g[yy]>>(4-xx)&1){if(pass===0)B(x-1+xx,y-1+yy,front?G[5]:OUT,a);else B(x-2+xx,y-2+yy,front?(yy<2?G[1]:G[2]):G[3],a);}
            if(front)light.glow(x,y,5,G[2],.3*k);}
          else if(p.k===1){if(p.f!==front)continue;const tw=.6+.4*Math.sin(p.life*24+p.x);if(tw*k<.2)continue;const arm=Math.round(p.s*tw*Math.min(1,k*2.5)),x=Math.floor(p.x),y=Math.floor(p.y);
            for(let d=1;d<=arm;d++){const c=d===arm&&arm>1?G[3]:p.c;B(x+d,y,c,1);B(x-d,y,c,1);B(x,y+d,c,1);B(x,y-d,c,1);}B(x,y,tw>.75?WHITE:p.c,1);light.glow(p.x,p.y,3+arm*2,G[2],.4*k*tw);}
          else if(p.k===2){if(p.f!==front)continue;const l=p.l*(.5+.5*k);for(let j=0;j<=l;j++)B(p.x,p.y+j,j<1.5?WHITE:j<l*.5?G[1]:G[2],j<l*.5?1:(1-j/(l+1))*1.6);}
          else{if(p.f!==front)continue;const c=k>.6?G[2]:k>.3?G[3]:G[4],a=p.y>=gy?k*2:Math.min(1,k*3);B(p.x,p.y,c,a);if(k>.5)B(p.x,p.y-1,G[4],a*.6);if(k>.4)light.glow(p.x,p.y,3,G[3],.35*k);}}
        if(front){numeral(buf,light);const pp=t>=POP?Math.exp(-(t-POP)/.12):0;if(pp>.03)light.glow(cx,gy-30,34,G[3],.35*pp);}},
      done:()=>t>END&&ps.length===0,
      lamp:()=>{const i=.9*Math.max(env(),.6*pulse(t));return i>.03?{i,c:[1,.82,.45],r:220,h:40}:null;}};}
  /* Embervale wrapper: both canvases follow the hero; several level-ups in one frame share one Ascension showing the last level */
  let seed=1,last=null;
  function pxLevelup(lvl,p=P){if(!p||p.dead)return null;lvl=lvl||p.lvl||1;
    if(last&&!last.dead&&last.t<.5){last.fx.setLvl(lvl);return last;}const s=seed++,lite=PERF.lite;
    pxfx(c=>circle({x:c.x,y:c.y,seed:s}),{follow:p,mode:'flat',w:96,hh:96,ax:48,ay:48,ttl:2.6,pri:2,nolight:lite});
    last=pxfx(c=>pillar({x:c.x,y:c.y,actor:c.actor,lvl,seed:s,shake:PXK.shake}),{follow:p,split:true,w:88,hh:150,ay:140,ttl:3.2,pri:2,lamp:!lite,nolight:lite});
    return last;}
  onEv('pxLevel',lvl=>{try{pxLevelup(lvl);}catch(err){console.error(err);}});
  onEv('pxClear',()=>{last=null;});
  pxlab('levelup','Ascension (level up)','Character','orig',()=>pxLevelup(P&&P.lvl));
  pxlab('levelup-7','Ascension, single digit','Character','orig',()=>pxLevelup(7));
  return{pxLevelup};})();
