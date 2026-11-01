#!/usr/bin/env node
/* Capture a module for rating and write its manifest (see RATING.md). No agent needed.
   node rateprep.cjs <module> [<module> ...]
   For each module: runs shot.cjs on all its lab ids (frames and zone picked per module), then writes runs/rate-<module>/manifest.json
   listing each lab entry's in-game contact sheet and the module's reference sheets (runs/ref/<slug>/*_sheet.png, rendered from Sprite
   Fusion's own source by sfref.mjs; originals point at the closest Sprite Fusion effects as a style reference). */
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const D=__dirname;
const REFS={impact:['impact'],slash:['slash'],explosion:['explosion'],burning:['fire'],lightning:['lightning'],energy:['energy','black-hole'],
  shieldholy:['shield','holy-light'],weather:['rain','fog'],snowleaves:['snow','falling-leaves'],ice:['ice'],poison:['poison'],healpower:['heal','power-up'],
  pickup:['pickup','sparkle'],movement:['movement'],dissolve:['fire','power-up'],breakfx:['ice','impact'],critfx:['impact','slash'],timeecho:['movement','power-up'],
  levelup:['holy-light','power-up'],wayfinder:['sparkle','pickup']};
const ORIGINAL=new Set(['dissolve','breakfx','critfx','timeecho','levelup','wayfinder']);
const LONG=new Set(['weather','snowleaves','wayfinder','levelup','burning','poison','healpower','shieldholy']);
const ZONE={weather:'woods',snowleaves:'snowfield'};
const SUMMARY={impact:'A hit star with shards, a ring and sparks on every hit the hero lands, in the damage colour.',
  slash:'Pixel blade arcs on melee combo hits, wrapping the hero; the finisher is bigger; straight cut lines for dash attacks.',
  explosion:'Fireball, thrown earth chunks, a ground shockwave and a scorch mark for meteors, traps and fire pillars.',
  burning:'Flames licking up the outline of an enemy that is on fire, for as long as the burn lasts.',
  lightning:'Bolts from the sky, chain arcs between enemies, electric impacts and an electrified state on struck enemies.',
  energy:'Plasma orbs riding the mage\'s orb spells, an Ultimate charge-up, energy beams, and a black hole for the Singularity spell.',
  shieldholy:'A hex-cell barrier dome around the hero that flashes when hit and shatters; golden light pillars and smites.',
  weather:'Rain showers with splashes and ripples, and ground fog drifting past the characters, in forest and ruin zones.',
  snowleaves:'Snowfall in the snow region, and leaves falling from trees near the hero.',
  ice:'Frost nova, ice bursts and spikes, enemies encased in ice when frozen, shattering when they die.',
  poison:'Poisoned enemies bubbling and dripping, toxic puddles and gas clouds.',
  healpower:'Healing crosses rising round the hero, mana refill drops, and a power-up aura gripping the hero\'s outline when a buff starts.',
  pickup:'Pops and homing sparkles when coins and xp are collected, glints on rare loot and chests, light beams over rare loot.',
  movement:'Afterimages, speed lines and dust for the hero\'s dodge roll and dashes; blinks that come apart in light and re-form.',
  dissolve:'Original: a defeated enemy burns away bottom-up behind a glowing ember line, embers and ash lifting off.',
  breakfx:'Original: an enemy\'s crystal shield cage cracks and shatters into tumbling shards when its weakness breaks it.',
  critfx:'Original: a critical hit freezes into a 2-3 frame comic-style impact frame: dark silhouette, white rim, speed lines.',
  timeecho:'Original: a perfect dodge leaves a clockwork rune ring and two chromatic afterimages of the hero drifting apart.',
  levelup:'Original: level up: a golden rune circle, glyphs climbing the hero in a pillar of light, the new level number popping overhead.',
  wayfinder:'Original: small gold arrowheads on the ground along a walkable route to the next quest checkpoint (a navigation aid).'};
for(const m of process.argv.slice(2)){const src=fs.readFileSync(path.join(D,'fx',m+'.js'),'utf8');
  const labs=[...src.matchAll(/pxlab\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/g)].map(x=>({id:x[1],name:x[2]}));
  const out=path.join('runs','rate-'+m),frames=LONG.has(m)?'0,15,30,60,90,120':'0,2,4,8,14,22,34,50';
  const a=['shot.cjs','--out',out,'--fx',m,'--play',labs.map(l=>l.id).join(','),'--frames',frames];if(ZONE[m])a.push('--zone',ZONE[m]);
  let log='';try{log=execFileSync('node',a,{cwd:D,encoding:'utf8',timeout:1500000});}catch(e){log=String(e.stdout||'')+String(e.stderr||'');}
  /* a close-up pass (tight crop, 3x) so 1-2 px sparks, chips and dither survive the sheet's downscale */
  const out2=out+'-close',a2=a.slice();a2[2]=out2;a2.push('--crop','200x130','--zoom','3');
  try{execFileSync('node',a2,{cwd:D,encoding:'utf8',timeout:1500000});}catch(e){}
  let errors=[];try{errors=JSON.parse(log.slice(log.indexOf('{\n'))).errors;}catch(e){errors=['capture failed: '+log.slice(-300)];}
  const refs=[];for(const s of REFS[m]||[]){const d=path.join(D,'runs','ref',s);if(fs.existsSync(d))for(const f of fs.readdirSync(d).sort())if(f.endsWith('_sheet.png'))refs.push(path.join(d,f));}
  const man={module:m,summary:SUMMARY[m]||'',refKind:ORIGINAL.has(m)?'style reference: the closest Sprite Fusion effects rendered from their own source (this effect is original, so match the style, not the subject)':'Sprite Fusion\'s own source of the ported effect, rendered on a dark floor at the same frame times',
    refs,items:labs.map(l=>({name:l.name,lab:l.id,game:[path.join(D,out,l.id+'_sheet.png'),path.join(D,out2,l.id+'_sheet.png')].filter(f=>fs.existsSync(f)),notes:`frames ${frames} at 60 fps; the effect is fired next to the hero (left of centre) in the game scene; the second sheet is a 3x close-up of the same frames`}))};
  fs.writeFileSync(path.join(D,out,'manifest.json'),JSON.stringify(man,null,1));
  console.log(`${m}: ${labs.length} items, ${refs.length} refs, errors ${errors.length}${errors.length?' '+String(errors[0]).slice(0,160):''}`);}
