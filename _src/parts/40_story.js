/* ================= the story: who stands where, what they say, saving, scenes, the ending ================= */
const SAVE_KEY='xorka.save.v1';
function populateField(S){SC=S;S.cols.length=S.baseCols;S.things=[];BOSS=null;const fh=(x,z)=>fieldH(x,z);
 // the village
 thing('npc',-4,-55,{who:'hoot',face:0});thing('npc',11,-43,{who:'bun',face:-1.2});const cat=thing('cat',1,-50);cat.hx=1;cat.hz=-50;
 thing('sign',3,-38,{text:['NORTH: THE MOSSY SHRINE','EAST: LOOKOUT HILL    WEST: THE BRAMBLE NOOK','NORTH-WEST: WHISPER LAKE']});
 thing('sign',-50,-15,{text:['THE BRAMBLE NOOK','"MUSHROOMS GROW WHERE BRAMBLES FEAR TO TREAD." - AN OLD SAYING']});
 thing('sign',-20,12,{text:['WHISPER LAKE','THE LILIES HERE ARE SLEEPY. A LITTLE WATER WAKES THEM UP.']});
 thing('sign',14,37,{text:['THE MOSSY SHRINE','"THREE LIGHTS OPEN THE DOOR. ONE HIGH, ONE HIDDEN, ONE ON THE WATER."']});
 // grandma bun's garden: five thirsty flowers
 [[0,-43.5],[2.2,-41.5],[3.4,-44.6],[5.2,-42],[6.2,-44.2]].forEach(([x,z],i)=>thing('flower',x,z,{garden:1,petal:[[1,.55,.7],[1,.8,.3],[.7,.6,1],[1,.6,.4],[.6,.85,1]][i],bloom:FLAGS.gardenDone?1:0,drops:FLAGS.gardenDone?3:0}));
 // wild flowers along the paths, mushrooms in the shade
 const R=srand(4242),petals=[[1,.55,.7],[1,.8,.3],[.7,.6,1],[1,.95,.95],[1,.6,.4]];let n=0;
 for(let t=0;t<900&&n<30;t++){const x=(R()-.5)*150,z=(R()-.5)*150,h=fh(x,z);if(h<1.2||fieldN(x,z)[1]<.85||SC.cols.some(c=>inCol(c,x,z,.6)))continue;if(pathDist(x,z)>9)continue;thing('flower',x,z,{petal:petals[n%5]});n++}
 const mushes=[[-56.8,-14.6],[30,-16],[46,6],[-12,-34],[24,26],[-44,2],[6,46],[-36,-36]];mushes.forEach(([x,z])=>thing('mush',x,z));
 // wisp 1: on top of Lookout Hill
 thing('wisp',LAND.hill.x,LAND.hill.z,{i:0,y:fh(LAND.hill.x,LAND.hill.z)+1.4});
 // wisp 2: in the bramble nook
 thing('bramble',-59.6,LAND.alcove.z);thing('wisp',LAND.alcove.x-.5,LAND.alcove.z,{i:1,y:fh(LAND.alcove.x,LAND.alcove.z)+1.3});
 // wisp 3: on the island, after the lanterns are lit; lily buds lead across the lake
 const L=LAND.lake,I=LAND.isle;thing('campfire',I.x+1.6,I.z-1.4);for(let k=0;k<3;k++){const a=k/3*TAU+.4;thing('lantern',I.x+Math.cos(a)*3.9,I.z+Math.sin(a)*3.9)}
 thing('wisp',I.x-.4,I.z+.4,{i:2,y:fh(I.x,I.z)+1.5});
 {const zs=[];let z=I.z-I.r+.5;while(z>L.z-L.r&&fh(I.x,z)>-.55)z-=.2;const deep=z;while(z>L.z-L.r&&fh(I.x,z)<-.55)z-=.2;const shore=z;for(let q=deep-.5;q>shore+.6;q-=2.3)zs.push(q);zs.forEach((q,i)=>thing('lily',I.x+(i%2?.4:-.4),q,{id:i,y:0}))}
 // boing blooms: one to play with in the village, one to reach the ridge's secret chest, one on the hill
 thing('boing',8,-50,{id:0,pow:16});thing('boing',-61,-36,{id:1,pow:25});thing('boing',30,-2,{id:2,pow:18});
 thing('chest',-71.4,-35.5,{id:'ridge',item:'heartseed',y:fh(-71.4,-35.5)});
 // the shrine door
 thing('door',LAND.shrine.x,LAND.shrine.z+2.6,{y:LAND.shrine.h});
 // bushes near trees, and slimes
 for(const tr of S.trees.slice(0,18)){const a=Math.random()*TAU;const x=tr.x+Math.cos(a)*2.4,z=tr.z+Math.sin(a)*2.4;if(fh(x,z)>1)thing('bush',x,z)}
 for(const [x,z] of[[34,-14],[45,-1],[32,4],[8,-22],[-22,-21],[-40,-17],[-12,22],[-42,14],[12,30],[24,40],[-30,-4],[50,-20]]){const s=makeSlime(x,z);S.things.push(s)}}
function populateDungeon(S){SC=S;S.cols.length=S.baseCols;S.things=[];BOSS=null;const G2=[];
 for(const it of S.items){const {c,x,z}=it;
  if(c==='K')thing('block',x,z,{i:it.i,j:it.j,y:0});else if(c==='P')thing('plate',x,z,{y:0});else if(c==='F')thing('brazier',x,z,{fixed:1,y:0});else if(c==='U')thing('brazier',x,z,{y:0});
  else if(c==='W')thing('curtain',x,z,{y:0});else if(c==='S')thing('sprout',x,z,{y:0});else if(c==='X')thing('crystal',x,z,{y:0});else if(c==='C')thing('chest',x,z,{id:'key',item:'key',y:0});
  else if(c==='G')G2.push(it);else if(c==='B')thing('bossdoor',x,z,{y:0});else if(c==='f')thing('flower',x,z,{petal:[1,.7,.85],y:0});else if(c==='m')thing('mush',x,z,{y:0,boss:1});
  else if(c==='s')S.things.push(makeSlime(x,z,[.6,.9,.5]));else if(c==='E')thing('exit',x,z-1.5,{y:0})}
 G2.sort((a,b)=>b.j-a.j).forEach((it,k)=>thing('gate',it.x,it.z,{n:k+1,y:0}));for(const [x,y,z] of S.sconces)S.things.push({k:'sconce',x,y,z,t:0})}
/* ---------- talking ---------- */
const NAMES={hoot:'ELDER HOOT',bun:'GRANDMA BUN'};
function talkTo(o){if(o.who==='hoot'){
  if(!FLAGS.intro){say(NAMES.hoot,['HOO HOO! GOOD MORNING, LITTLE ORKA!','THE OLD SHRINE TO THE NORTH IS RUMBLING AGAIN. MOSSMAW, THE GRUMPY GOLEM, HAS WOKEN UP ON THE WRONG SIDE OF THE BED.',
    'ITS DOOR ONLY OPENS FOR THREE WISPS: ONE ON LOOKOUT HILL TO THE EAST, ONE BEHIND THE BRAMBLES IN THE WEST, AND ONE ON THE LITTLE ISLAND IN WHISPER LAKE.',
    'TAKE THIS BIG LEAF. JUMP, THEN PRESS JUMP AGAIN IN THE AIR TO GLIDE!','AND KEEP THAT WATER GUN HANDY. FLOWERS LOVE A DRINK... BUT MUSHROOMS GET VERY, VERY CRANKY.'],()=>{FLAGS.intro=1;FLAGS.glider=1;itemGet('BIG LEAF','JUMP, THEN JUMP AGAIN IN THE AIR TO GLIDE.');save()});return}
  if(FLAGS.bossDone){say(NAMES.hoot,['YOU DID IT, ORKA! THE SHRINE IS QUIET, AND MOSSMAW IS SNORING LIKE A HAPPY KITTEN.','THE WHOLE VALE IS BLOOMING. WHAT A BRAVE LITTLE SPROUT YOU ARE.']);return}
  const tips=[];if(!FLAGS.wisp0)tips.push('THE HILL WISP WAITS AT THE VERY TOP OF LOOKOUT HILL, EAST OF HERE. THE VIEW IS LOVELY!');
  if(!FLAGS.wisp1)tips.push('THE BRAMBLE NOOK IS IN THE WEST, UNDER THE RIDGE. BRAMBLES HATE A CRANKY MUSHROOM\'S PURPLE PUFF...');
  if(!FLAGS.wisp2)tips.push('WHISPER LAKE IS NORTH-WEST. WATER THE SLEEPY LILY BUDS TO MAKE A PATH, OR GLIDE THERE FROM SOMEWHERE HIGH.');
  if(!tips.length)tips.push('ALL THREE WISPS! TAKE THEM TO THE MOSSY SHRINE UP NORTH. BE GENTLE WITH MOSSMAW... BUT NOT TOO GENTLE.');
  say(NAMES.hoot,['HOO! HOW IS YOUR ADVENTURE GOING?',tips[0]]);return}
 if(o.who==='bun'){
  if(FLAGS.bunGift){say(NAMES.bun,['MY GARDEN HAS NEVER LOOKED SO HAPPY. COME BACK FOR TEA ANYTIME, DEAR.']);return}
  if(FLAGS.gardenDone){say(NAMES.bun,['LOOK AT THEM ALL! YOU HAVE A GREEN THUMB, LITTLE ONE.','HERE: A CARROT PIE, STILL WARM. I BAKED A HEART SEED INSIDE FOR GOOD LUCK.'],()=>{FLAGS.bunGift=1;P.maxHp+=2;P.hp=P.maxHp;itemGet('HEART SEED','YOUR HEART GROWS A LITTLE BIGGER!');save()});return}
  FLAGS.bunAsk=1;say(NAMES.bun,['OH, HELLO DEAR! IT HAS BEEN SUCH A DRY SUMMER.','MY FIVE GARDEN FLOWERS ARE SO THIRSTY. WOULD YOU GIVE THEM A LITTLE SQUIRT FROM THAT WATER GUN?','HOLD THE WATER BUTTON TO AIM, AND KEEP IT HELD TO SPRAY. I WILL BAKE YOU SOMETHING NICE!'])}}
function gardenCheck(){const g=SC.things.filter(q=>q.k==='flower'&&q.garden);if(g.every(q=>q.bloom)&&!FLAGS.gardenDone){FLAGS.gardenDone=1;SFX.solved();toast('THE GARDEN IS IN FULL BLOOM! GRANDMA BUN WAVES YOU OVER.');save()}}
/* ---------- wisps, the shrine door, chests ---------- */
const WISPN=['WISP OF THE HILL','WISP OF THE BRAMBLES','WISP OF THE LAKE'];
function getWisp(o){if(o.dead)return;o.dead=true;FLAGS['wisp'+o.i]=1;SFX.wisp();shake(.1);puff(o.x,o.y,o.z,40,[[1,1,.7],[.7,1,1],[1,.85,1]],{k:1,spd:4,up:3,size:.45,life:1.3,g:-.5});
 const n=wispCount();itemGet(WISPN[o.i],n<3?n+' OF 3 WISPS. '+(3-n)+' TO GO!':'ALL THREE WISPS! THE SHRINE AWAITS UP NORTH.');save()}
function placeWisps(o){G.cut={kind:'door',t:0,dur:5.2,o,focus:[o.x,o.y+4,o.z],yaw:Math.PI,dist:13,pitch:.22};SFX.click()}
function openChest(o){SFX.chest();puff(o.x,o.y+1,o.z,24,[[1,.9,.4],[1,1,.8]],{k:1,spd:3,up:3,size:.4,life:1.2,g:-.5});
 if(o.item==='heartseed'){P.maxHp+=2;P.hp=P.maxHp;itemGet('HEART SEED','YOUR HEART GROWS A LITTLE BIGGER!')}
 else if(o.item==='key'){FLAGS.key=1;itemGet('BIG KEY','IT OPENS THE MOSSY LOCK ON THE GREAT DOOR.')}save()}
/* ---------- scenes ---------- */
function useScene(id){const S=SCENES[id]||(SCENES[id]=id==='field'?buildField():buildDungeon());if(S.baseCols==null)S.baseCols=S.cols.length;SC=S;(id==='field'?populateField:populateDungeon)(S);DROPS.length=0;PT.length=0}
function placeP(x,y,z,face){P.x=x;P.y=y;P.z=z;P.vx=P.vz=P.vy=0;P.face=face;P.safe=[x,y,z];P.ground=true;P.glide=false;CAM.yaw=face;CAM.pitch=.32}
function fadeTo(fn){G.fade={t:0,fn,done:false}}
function enterDungeon(){if(G.fade)return;fadeTo(()=>{useScene('dungeon');const [x,,z]=SC.spawn;placeP(x,0,z,0);playSong('dungeon');banner('THE MOSSY SHRINE','PUZZLES WAIT INSIDE');save()})}
function leaveDungeon(){if(G.fade)return;fadeTo(()=>{useScene('field');placeP(LAND.shrine.x,LAND.shrine.h,LAND.shrine.z-2,Math.PI);playSong('field');save()})}
/* ---------- the boss, and the ending ---------- */
function dungeonUpdate(dt){if(SC.id!=='dungeon')return;const bd=SC.things.find(q=>q.k==='bossdoor');if(!bd)return;
 if(FLAGS.bossDoor&&!FLAGS.bossDone&&!BOSS&&P.z>bd.z+2.2){FLAGS.bossSeal=1;const s=SC.items.find(q=>q.c==='*');BOSS=makeBoss(s.x,s.z+2);playSong('boss');
  G.cut={kind:'boss',t:0,dur:3.6,focus:[s.x,3,s.z+2],yaw:Math.PI,dist:14,pitch:.18};banner('MOSSMAW','THE GRUMPY GOLEM')}
 if(BOSS)bossUpdate(dt)}
function bossDefeated(){SFX.victory();shake(.6);FLAGS.bossDone=1;FLAGS.bossSeal=0;const B=BOSS;
 G.cut={kind:'bossEnd',t:0,dur:6,focus:[B.x,1.5,B.z],yaw:B.face+Math.PI,dist:9,pitch:.2};
 for(let i=0;i<8;i++)setTimeout(()=>puff(B.x+(Math.random()-.5)*4,1+Math.random()*3,B.z+(Math.random()-.5)*4,14,[[1,.6,.8],[1,1,.7],[.6,1,.6],[1,1,1]],{k:1,spd:4,up:3,size:.5,life:1.2}),i*300)}
function endingTalk(){say('MOSSY',['...HUH? WHERE AM I? I HAD SUCH A GRUMPY, GRUMBLY DREAM.','YOU WOKE ME UP WITH THAT PURPLE SNEEZE CLOUD! THANK YOU, LITTLE ONE.','THE SHRINE FEELS SO LIGHT NOW. PLEASE, TAKE THIS. IT IS A PIECE OF MY MOSSY HEART.'],
 ()=>{P.maxHp+=2;P.hp=P.maxHp;itemGet('HEART OF MOSS','THANK YOU FOR PLAYING!');setTimeout(()=>{G.state='end';G.endT=0;playSong('title');clearSaveOnEnd()},2600)})}
function clearSaveOnEnd(){FLAGS.cleared=1;save()}
function die(){G.state='dead';G.deadT=0;P.glide=false;SFX.hurt();setTimeout(()=>tone(220,.6,'triangle',.08,.5),200)}
/* ---------- saving ---------- */
function save(){if(BOSS&&BOSS.alive&&!FLAGS.bossDone)return;try{const f={...FLAGS};delete f.bossSeal;localStorage.setItem(SAVE_KEY,JSON.stringify({v:1,scene:SC.id,p:[P.safe[0],P.safe[1],P.safe[2]],face:P.face,hp:P.hp,maxHp:P.maxHp,flags:f,time:G.time,stats:G.stats,at:Date.now()}));G.saved=1.6}catch(e){}}
function peekSave(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');return s&&s.v===1&&s.flags?s:null}catch(e){return null}}
function resetFlags(){for(const k in FLAGS)delete FLAGS[k]}
function newGame(){resetFlags();P.maxHp=6;P.hp=6;P.water=100;P.st=100;P.fire=0;G.time=0;G.stats={bloom:0,slimes:0,pets:0,boing:0};useScene('field');placeP(0,fieldH(0,-47),-47,Math.PI);
 playSong('field');G.state='play';G.cut={kind:'intro',t:0,dur:4,focus:[-4,fieldH(-4,-55)+2,-55],yaw:Math.PI*.85,dist:9,pitch:.2};save()}
function continueGame(){const s=peekSave();if(!s){newGame();return}resetFlags();Object.assign(FLAGS,s.flags);P.maxHp=s.maxHp||6;P.hp=P.maxHp;P.water=100;P.st=100;P.fire=0;G.time=s.time||0;G.stats=s.stats||{bloom:0,slimes:0,pets:0,boing:0};
 useScene(s.scene==='dungeon'?'dungeon':'field');placeP(s.p[0],s.p[1],s.p[2],s.face||0);playSong(SC.id==='dungeon'?'dungeon':'field');G.state='play';G.cut=null}
