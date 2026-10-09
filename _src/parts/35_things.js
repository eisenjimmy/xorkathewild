/* ================= things in the world: what water, the stick and a friendly E do to each ================= */
let BOSS=null;
const near=(o,r)=>Math.hypot(o.x-P.x,o.z-P.z)<r;
const thing=(k,x,z,o={})=>{const S=SC;const y=o.y??S.groundH(x,z);const t={k,x,y,z,t:Math.random()*10,...o};t.y=y;if(KIND[k].init)KIND[k].init(t);S.things.push(t);return t};
function dropHeart(x,y,z){if(P.hp<P.maxHp&&Math.random()<.45)SC.things.push({k:'heart',x,y:y+.5,z,vy:4,t:0,hr:0})}
const PURPLE=[[.72,.45,.95],[.85,.6,1],[.6,.35,.85]];
const KIND={
 /* --- flowers bloom when watered, and a bloom heals --- */
 flower:{init(o){o.hr=.55;o.hy=.4;o.drops=0;o.bloom=0},
  upd(o,dt){if(o.bloom>0&&!o.garden){o.bloomT=(o.bloomT||0)+dt;if(o.bloomT>60){o.bloom=0;o.bloomT=0;o.drops=0}}o.grow=lerp(o.grow||0,o.bloom?1:0,dt*6)},
  water(o){if(o.bloom){if(Math.random()<.3)puff(o.x,o.y+.6,o.z,1,[[1,.8,.9],[1,1,.8]],{k:1,size:.25,life:.5,spd:1});return}o.drops++;o.wig=1;puff(o.x,o.y+.5,o.z,2,[.7,.92,1],{spd:1,size:.18,life:.4});
   if(o.drops>=3){o.bloom=1;SFX.bloom();G.stats.bloom++;puff(o.x,o.y+.8,o.z,14,[o.petal,[1,1,.85],[1,1,1]],{k:1,spd:2.2,up:2.5,size:.35,life:1.1,g:-.6});
    if(P.hp<P.maxHp&&!o.garden)SC.things.push({k:'heart',x:o.x,y:o.y+1,z:o.z,vy:3,t:0,hr:0,seek:1});
    if(o.garden)gardenCheck()}},
  stick(o){o.wig=1;if(o.bloom)puff(o.x,o.y+.7,o.z,4,[o.petal,[1,1,.9]],{k:2,spd:1.6,size:.3,life:.8,g:-1})}},
 /* --- mushrooms puff a purple toxic cloud when watered --- */
 mush:{init(o){o.hr=.7;o.hy=.5;o.drops=0;o.cool=0},
  upd(o,dt){if(o.cool>0){o.cool-=dt;if(o.cool<=0){o.drops=0;puff(o.x,o.y+.6,o.z,5,PURPLE,{size:.3,life:.6,spd:1})}}o.squash=Math.max(0,(o.squash||0)-dt*3)},
  water(o){if(o.cool>0)return;o.drops++;o.squash=.6;if(o.drops>=2){o.cool=o.boss?5:9;o.squash=1;SFX.puff();toxic(o.x,o.y,o.z)}},
  stick(o){o.squash=.8;SFX.squish()}},
 cloud:{upd(o,dt){o.t+=dt;if(o.t>o.life){o.dead=true;return}const k=sat(o.t/.4)*sat((o.life-o.t)/.8);o.r=o.R*(.6+.4*k);
   if(Math.random()<dt*36)puff(o.x+(Math.random()-.5)*o.r*1.6,o.y+.3+Math.random()*1.4,o.z+(Math.random()-.5)*o.r*1.6,1,PURPLE,{size:.9,life:1.2,spd:.4,up:.3,g:.15,grow:1});
   if(near(o,o.r)&&P.y<o.y+2.5){P.cough+=dt;if(P.cough>1.15){P.cough=0;SFX.cough();hurt(1)}}
   for(const s of SC.things){if(s.k==='slime'&&!s.dead&&Math.hypot(s.x-o.x,s.z-o.z)<o.r+.4){s.hp-=dt*2.4;s.dizzy=1;if(s.hp<=0)slimeDie(s)}
    if(s.k==='bramble'&&!s.dead&&Math.hypot(s.x-o.x,s.z-o.z)<o.r+2)brambleWither(s)}
   if(BOSS&&BOSS.alive&&Math.hypot(BOSS.x-o.x,BOSS.z-o.z)<o.r+1.6)bossInCloud(o)}},
 /* --- sprouts: lily pads, boing blooms, the shrine's vine --- */
 lily:{init(o){o.hr=.8;o.hy=0;o.drops=0;o.grown=!!FLAGS['lily'+o.id];o.g=o.grown?1:0;if(o.grown){lilyCol(o);o.hr=0}},
  upd(o,dt){o.g=lerp(o.g,o.grown?1:0,dt*4);o.yy=Math.sin(G.clock*1.4+o.id)*.03},
  water(o){if(o.grown)return;o.drops++;o.wig=1;splash(o.x,0,o.z);if(o.drops>=5){o.grown=true;o.hr=0;FLAGS['lily'+o.id]=1;lilyCol(o);SFX.grow();puff(o.x,.3,o.z,12,[[.5,.9,.5],[1,.8,.9],[1,1,.9]],{k:1,spd:2,up:2,size:.3,life:.9});if(SC.things.filter(q=>q.k==='lily').every(q=>q.grown))toast('A PATH OF LILY PADS TO THE LITTLE ISLAND!')}}},
 boing:{init(o){o.hr=.7;o.hy=.3;o.drops=0;o.open=!!FLAGS['boing'+o.id];o.g=o.open?1:0;if(o.open){boingCol(o);o.hr=0}o.sq=0},
  upd(o,dt){o.g=lerp(o.g,o.open?1:0,dt*5);o.sq=Math.max(0,o.sq-dt*3);
   if(o.open&&P.ground&&Math.abs(P.y-(o.y+.75))<.08&&near(o,1.25)){P.vy=o.pow||22;P.ground=false;P.y+=.1;o.sq=1;SFX.jump();tone(300,.3,'sine',.12,3);puff(o.x,o.y+.9,o.z,10,[[1,.7,.85],[1,.95,.6]],{k:1,spd:2.5,up:1,size:.35,life:.7});G.stats.boing=(G.stats.boing||0)+1}},
  water(o){if(o.open)return;o.drops++;o.wig=1;if(o.drops>=4){o.open=true;o.hr=0;FLAGS['boing'+o.id]=1;boingCol(o);SFX.grow();puff(o.x,o.y+.8,o.z,12,[[1,.6,.8],[1,.9,.6]],{k:1,spd:2,up:2,size:.3,life:.9});if(!FLAGS.boingTip){FLAGS.boingTip=1;toast('A BOING BLOOM! STEP ON IT TO BOUNCE SKY HIGH.')}}}},
 sprout:{init(o){o.hr=FLAGS.vine?0:.7;o.hy=.3;o.drops=0},upd(o,dt){o.g=lerp(o.g||0,FLAGS.vine?1:0,dt*1.6)},
  water(o){if(FLAGS.vine)return;o.drops++;o.wig=1;if(o.drops>=5){FLAGS.vine=1;o.hr=0;SFX.grow();SFX.solved();shake(.15);toast('THE VINE GROWS A BRIDGE ACROSS THE PIT!');save()}}},
 bramble:{init(o){o.hr=1.2;o.hy=.9;o.sr=1.2;o.c=colB(SC,o.x,o.z,.7,3.2,o.y-1,o.y+2.6,'bramble');if(FLAGS.bramble){o.dead=true;o.c.on=false}},
  water(o){puff(o.x,o.y+1,o.z,1,[.7,.9,1],{size:.2,life:.3})},
  stick(o){if(P.fire>0){brambleWither(o);return}o.wig=1;if(!FLAGS.brambleTip){FLAGS.brambleTip=1;say('ORKA',['OUCH! THESE BRAMBLES ARE TOO TOUGH FOR MY STICK.','MAYBE THAT GRUMPY MUSHROOM NEARBY COULD HELP...'])}}},
 /* --- fire: the island campfire, lanterns, shrine braziers and a curtain of flame --- */
 campfire:{init(o){o.hr=.8;o.hy=.4;o.sr=.9;o.out=0;colC(SC,o.x,o.z,.6,o.y-1,o.y+.5)},
  upd(o,dt){if(o.out>0){o.out-=dt;return}flame(o,dt,1);if(near(o,1.5)&&P.fire<=0&&P.swing>0){lightStick()}},
  water(o){if(o.out<=0){o.out=6;SFX.hiss();puff(o.x,o.y+.6,o.z,8,[.85,.85,.9],{size:.5,life:1,up:2})}},stick(o){if(o.out<=0)lightStick()}},
 lantern:{init(o){o.hr=.6;o.hy=1.4;o.sr=.7;o.lit=FLAGS.lanterns?99:0;colC(SC,o.x,o.z,.4,o.y-1,o.y+1.9)},
  upd(o,dt){if(o.lit>0){if(!FLAGS.lanterns){o.lit-=dt;if(o.lit<=0)SFX.hiss()}flame({x:o.x,y:o.y+1.25,z:o.z},dt,.45)}},
  water(o){if(o.lit>0&&!FLAGS.lanterns){o.lit=0;SFX.hiss();puff(o.x,o.y+1.4,o.z,5,[.85,.85,.9],{size:.3,life:.7})}},
  stick(o){if(P.fire>0&&o.lit<=0){o.lit=16;SFX.fire();const L=SC.things.filter(q=>q.k==='lantern');const n=L.filter(q=>q.lit>0).length;
   if(n===L.length&&!FLAGS.lanterns){FLAGS.lanterns=1;SFX.solved();toast('ALL THREE LANTERNS GLOW!');const w=SC.things.find(q=>q.k==='wisp'&&q.i===2);if(w){w.hidden=false;puff(w.x,w.y,w.z,20,[[1,1,.7],[.7,1,1]],{k:1,spd:3,size:.4})}save()}
   else if(!FLAGS.lanterns)toast(n+' OF '+L.length+' LANTERNS LIT. HURRY BEFORE THEY FADE!')}}},
 brazier:{init(o){o.hr=.7;o.hy=1.1;o.sr=.8;colC(SC,o.x,o.z,.6,-1,1.2);if(o.fixed||FLAGS.g2)o.lit=1},
  upd(o,dt){if(o.lit)flame({x:o.x,y:o.y+1.2,z:o.z},dt,.8)},
  water(o){if(o.lit&&!o.fixed&&!FLAGS.g2){o.lit=0;SFX.hiss();puff(o.x,o.y+1.3,o.z,6,[.85,.85,.9],{size:.4,life:.8})}},
  stick(o){if(o.lit&&P.fire<=0)lightStick();else if(!o.lit&&P.fire>0){o.lit=1;SFX.fire();const U=SC.things.filter(q=>q.k==='brazier'&&!q.fixed);
   if(U.every(q=>q.lit)&&!FLAGS.g2){FLAGS.g2=1;SFX.solved();toast('BOTH BRAZIERS BURN. A GATE RUMBLES OPEN!');save()}}}},
 curtain:{init(o){o.hr=1.3;o.hy=1;o.hp=14;o.c=colB(SC,o.x,o.z,1.25,1.25,-1,3,'fire');if(FLAGS.curtain){o.dead=true;o.c.on=false}},
  upd(o,dt){for(let i=0;i<3;i++)if(Math.random()<dt*20)puff(o.x+(Math.random()-.5)*2.3,o.y+.2,o.z+(Math.random()-.5)*.6,1,[[1,.5,.15],[1,.75,.25],[1,.9,.4]],{spd:.3,up:3,size:.6,life:.6,g:2});
   if(near(o,1.9)&&P.y<2.5)hurt(1,o.x,o.z)},
  water(o){o.hp--;puff(o.x+(Math.random()-.5)*2,o.y+1,o.z,2,[.85,.85,.9],{size:.4,life:.6,up:2});SFX.hiss();if(o.hp<=0){o.dead=true;o.c.on=false;FLAGS.curtain=1;toast('THE FIRE CURTAIN FIZZLES OUT!');SFX.solved()}}},
 /* --- the three wisps and the shrine's door --- */
 wisp:{init(o){o.hr=0;o.hidden=o.i===2&&!FLAGS.lanterns;if(FLAGS['wisp'+o.i])o.dead=true},
  upd(o,dt){if(o.hidden)return;if(Math.random()<dt*14)puff(o.x+(Math.random()-.5)*.6,o.y+(Math.random()-.5)*.6,o.z+(Math.random()-.5)*.6,1,[[1,1,.7],[.7,1,1],[1,.85,1]],{k:1,spd:.3,up:.4,size:.25,life:.9,g:.3});
   if(Math.hypot(o.x-P.x,o.z-P.z,o.y-(P.y+.8))<1.9)getWisp(o)}},
 door:{init(o){o.hr=0;o.c=colB(SC,o.x,o.z+.4,2.3,.5,o.y-1,o.y+5,'door');if(FLAGS.shrineOpen)o.c.on=false},
  upd(o,dt){o.open=lerp(o.open||0,FLAGS.shrineOpen?1:0,dt*.8);if(FLAGS.shrineOpen&&o.open>.9&&Math.hypot(P.x-o.x,P.z-o.z-.6)<1.6)enterDungeon()},
  prompt(o){if(FLAGS.shrineOpen)return null;return near(o,4)?(wispCount()>=3?'PLACE THE WISPS':'THE DOOR ('+wispCount()+'/3 WISPS)'):null},
  act(o){if(wispCount()<3){say('ORKA',['THREE ROUND HOLES... THEY GLOW A LITTLE.','HOOT SAID THE WISPS WOULD OPEN THIS DOOR. I HAVE '+wispCount()+' OF 3.']);return}placeWisps(o)}},
 /* --- friends --- */
 npc:{init(o){o.hr=.7;o.hy=1;o.sr=.8;colC(SC,o.x,o.z,.6,o.y-1,o.y+1.8)},upd(o,dt){o.look=Math.atan2(P.x-o.x,P.z-o.z);o.happy=Math.max(0,(o.happy||0)-dt)},
  prompt(o){return near(o,2.6)?'TALK':null},act(o){o.happy=2;talkTo(o)},water(o){o.happy=1.5;o.wet=1;if(once('wetnpc'+o.who,2500))toast(o.who==='hoot'?'HOOT: HOO! THAT TICKLES!':'BUN: OH MY, A LITTLE RAIN SHOWER!')}},
 cat:{init(o){o.hr=.5;o.hy=.3;o.tx=o.x;o.tz=o.z;o.wt=0},
  upd(o,dt){o.wt-=dt;const d=Math.hypot(o.tx-o.x,o.tz-o.z);if(o.wt<=0&&d<.3){o.wt=2+Math.random()*4;const a=Math.random()*TAU;o.tx=o.hx+Math.cos(a)*3;o.tz=o.hz+Math.sin(a)*3}
   if(o.wt<=0&&d>.3){o.x+=(o.tx-o.x)/d*1.3*dt;o.z+=(o.tz-o.z)/d*1.3*dt;o.face=Math.atan2(o.tx-o.x,o.tz-o.z);o.walk=(o.walk||0)+dt*8}o.y=SC.groundH(o.x,o.z);o.purr=Math.max(0,(o.purr||0)-dt)},
  prompt(o){return near(o,1.8)?'PET MOCHI':null},act(o){o.purr=2;o.wt=3;SFX.meow();G.stats.pets=(G.stats.pets||0)+1;puff(o.x,o.y+.9,o.z,5,[[1,.55,.7]],{k:1,spd:1,up:2,size:.35,life:1,g:1});if(P.hp<P.maxHp&&!o.healed){o.healed=1;heal(2)}},
  water(o){o.wt=1;o.tx=o.x+(o.x-P.x);o.tz=o.z+(o.z-P.z);o.mad=1;if(once('catw',1500)){tone(900,.15,'square',.05,.6);toast('MOCHI DOES NOT LIKE BATH TIME!')}}},
 sign:{init(o){o.hr=.5;o.hy=1;colC(SC,o.x,o.z,.35,o.y-1,o.y+1.4)},prompt(o){return near(o,2.2)?'READ':null},act(o){say('SIGN',o.text)}},
 bush:{init(o){o.hr=.8;o.hy=.5;o.sr=.8;o.cut=0},upd(o,dt){if(o.cut>0){o.cut-=dt}},
  stick(o){if(o.cut>0)return;o.cut=45;SFX.whack();puff(o.x,o.y+.6,o.z,12,[[.4,.75,.35],[.55,.85,.4]],{k:2,spd:2.5,up:2.5,size:.35,life:1,g:-2});if(Math.random()<.5)dropHeart(o.x,o.y,o.z)},
  water(o){o.wig=1}},
 heart:{upd(o,dt){o.t+=dt;const g=SC.groundH(o.x,o.z);o.vy-=12*dt;o.y+=o.vy*dt;if(o.y<g+.4){o.y=g+.4;o.vy=0}
   const d=Math.hypot(o.x-P.x,o.z-P.z,o.y-(P.y+.8));if(d<(o.seek?6:2.4)){const k=Math.min(1,dt*6);o.x=lerp(o.x,P.x,k);o.z=lerp(o.z,P.z,k);o.y=lerp(o.y,P.y+.8,k)}
   if(d<.7){o.dead=true;heal(2)}if(o.t>30)o.dead=true}},
 chest:{init(o){o.hr=.7;o.hy=.5;o.open=FLAGS['chest'+o.id]?1:0;colB(SC,o.x,o.z,.7,.5,o.y-1,o.y+.9)},upd(o,dt){o.lid=lerp(o.lid||0,o.open?1:0,dt*4)},
  prompt(o){return !o.open&&near(o,2.2)?'OPEN':null},act(o){if(o.open)return;o.open=1;FLAGS['chest'+o.id]=1;openChest(o)}},
 /* --- the shrine's stone block, plate and gates --- */
 block:{init(o){o.hr=1;o.hy=1;o.c=colB(SC,o.x,o.z,1.2,1.2,-1,2.3,'block');const p=FLAGS.blockAt;if(p){o.i=p[0];o.j=p[1];[o.x,o.z]=dpos(o.i,o.j);o.c.x=o.x;o.c.z=o.z}o.tx=o.x;o.tz=o.z},
  upd(o,dt){if(o.mv>0){o.mv-=dt;const k=1-o.mv/.45;o.x=lerp(o.fx,o.tx,ease(k));o.z=lerp(o.fz,o.tz,ease(k));o.c.x=o.x;o.c.z=o.z;if(o.mv<=0){o.x=o.tx;o.z=o.tz;blockSettled(o)}return}
   // pushing: lean into the block for a moment along one of the four directions
   const dx=P.x-o.x,dz=P.z-o.z,ax=Math.abs(dx),az=Math.abs(dz);const m=Math.hypot(P.vx,P.vz);if(!P.ground||m<1){o.pt=0;return}
   let di=0,dj=0;if(ax>az&&ax<1.9&&az<1&&Math.sign(P.vx)===-Math.sign(dx)&&Math.abs(P.vx)>Math.abs(P.vz))di=-Math.sign(dx);else if(az>=ax&&az<1.9&&ax<1&&Math.sign(P.vz)===-Math.sign(dz)&&Math.abs(P.vz)>Math.abs(P.vx))dj=Math.sign(dz);
   if(!di&&!dj){o.pt=0;return}o.pt=(o.pt||0)+dt;G.pushing=1;if(o.pt<.35)return;o.pt=0;const ni=o.i+di,nj=o.j+dj,c=DMAP[nj]&&DMAP[nj][ni];
   if(!c||!'.PKfs'.includes(c)||SC.things.some(q=>(q.k==='brazier'||q.k==='chest')&&Math.abs(q.x-dpos(ni,nj)[0])<1&&Math.abs(q.z-dpos(ni,nj)[1])<1)){SFX.deny();return}
   o.i=ni;o.j=nj;o.fx=o.x;o.fz=o.z;[o.tx,o.tz]=dpos(ni,nj);o.mv=.45;noise(.45,.12,300,.7,0,'lowpass')}},
 plate:{init(o){o.hr=0}},
 gate:{init(o){o.c=colB(SC,o.x,o.z,1.25,.35,-1,4.5,'gate');o.h=FLAGS['g'+o.n]?0:1},upd(o,dt){const op=!!FLAGS['g'+o.n];o.h=lerp(o.h,op?0:1,dt*2.2);o.c.on=o.h>.3;if(op&&!o.snd){o.snd=1;SFX.door();shake(.2)}}},
 crystal:{init(o){o.hr=.7;o.hy=1.1;o.sr=.7;o.cd=0;colC(SC,o.x,o.z,.45,-1,1.6)},upd(o,dt){o.cd-=dt},
  water(o){crystalHit(o)},stick(o){crystalHit(o)}},
 bossdoor:{init(o){o.c=colB(SC,o.x,o.z,1.25,.4,-1,5,'bdoor');o.h=FLAGS.bossDoor&&!FLAGS.bossSeal?0:1},upd(o,dt){const op=FLAGS.bossDoor&&!FLAGS.bossSeal;o.h=lerp(o.h,op?0:1,dt*2);o.c.on=o.h>.3},
  prompt(o){return o.h>.5&&near(o,3)&&!FLAGS.bossDone&&P.z<o.z?(FLAGS.key?'UNLOCK':'LOCKED'):null},act(o){if(!FLAGS.key){say('ORKA',['A BIG MOSSY LOCK. I NEED A BIG KEY.','THERE MUST BE ONE SOMEWHERE IN THE SHRINE.']);return}FLAGS.bossDoor=1;SFX.door();shake(.3);toast('THE BIG KEY TURNS... CLUNK!');save()}},
 sconce:{upd(o,dt){flame(o,dt,.5)}},
 exit:{init(o){o.hr=0},prompt(o){return near(o,2)?'LEAVE THE SHRINE':null},act(o){leaveDungeon()}}};
function toxic(x,y,z){SC.things.push({k:'cloud',x,y,z,R:3.4,r:2,life:6.5,t:0});puff(x,y+.8,z,26,PURPLE,{spd:3,up:1.5,size:.8,life:1.4,g:.2,grow:1});shake(.08)}
function flame(o,dt,s){if(Math.random()<dt*24*s)puff(o.x+(Math.random()-.5)*.3*s,o.y+.2,o.z+(Math.random()-.5)*.3*s,1,[[1,.45,.12],[1,.7,.2],[1,.9,.45]],{spd:.3,up:2.2*s,size:.55*s+.1,life:.55,g:1.5,drag:2})}
function lightStick(){if(P.fire<=0){SFX.fire();toast('THE STICK CATCHES FIRE! IT WILL BURN FOR A WHILE.')}P.fire=22}
function lilyCol(o){if(!o.c)o.c=colC(SC,o.x,o.z,1.3,-3,.12,'lily');o.c.on=true}
function boingCol(o){if(!o.c)o.c=colC(SC,o.x,o.z,1.1,o.y-1,o.y+.75,'boing');o.c.on=true}
function brambleWither(o){if(o.dead)return;o.dead=true;o.c.on=false;FLAGS.bramble=1;SFX.puff();SFX.solved();puff(o.x,o.y+1,o.z,30,[[.45,.35,.25],[.55,.45,.3],[.4,.6,.3]],{k:2,spd:3,up:2,size:.45,life:1.2,g:-2,jit:3});toast('THE BRAMBLES WITHER AWAY!');save()}
function slimeDie(s){if(s.dead)return;s.dead=true;SFX.pop();G.stats.slimes++;puff(s.x,s.y+.5,s.z,16,[s.col,[1,1,1],mulc(s.col,1.2)],{k:1,spd:3,up:2.5,size:.4,life:.8});dropHeart(s.x,s.y,s.z)}
function crystalHit(o){if(o.cd>0){o.cd=Math.max(o.cd,.45);return}o.cd=.9;FLAGS.blue=FLAGS.blue?0:1;SFX.switch();puff(o.x,o.y+1.2,o.z,10,FLAGS.blue?[[.45,.65,1],[.7,.85,1]]:[[1,.6,.3],[1,.8,.5]],{k:1,spd:2,size:.3,life:.6});if(FLAGS.blue&&!FLAGS.blueTip){FLAGS.blueTip=1;toast('BLUE TILES RISE OUT OF THE PIT!')}}
function blockSettled(o){FLAGS.blockAt=[o.i,o.j];if(DMAP[o.j][o.i]==='P'&&!FLAGS.g1){FLAGS.g1=1;SFX.switch();SFX.solved();toast('CLICK! THE BLOCK HOLDS THE PLATE DOWN.');save()}}
function wispCount(){return(FLAGS.wisp0?1:0)+(FLAGS.wisp1?1:0)+(FLAGS.wisp2?1:0)}
/* ---------- slimes: round, wobbly, a little rude ---------- */
function makeSlime(x,z,col){return{k:'slime',x,z,y:SC.groundH(x,z),vy:0,vx:0,vz:0,hp:2.2,hop:Math.random(),hx:x,hz:z,col:col||[[.45,.8,1],[1,.6,.8],[.6,.9,.5]][(Math.random()*3)|0],hr:.65,hy:.4,sr:.6,t:Math.random()*5,sq:0,face:0}}
KIND.slime={upd(o,dt){o.t+=dt;o.sq=Math.max(0,o.sq-dt*4);o.dizzy=Math.max(0,(o.dizzy||0)-dt);o.wet=Math.max(0,(o.wet||0)-dt);const g=groundAt(o.x,o.z,o.y),dP=Math.hypot(P.x-o.x,P.z-o.z),air=o.y>g+.02;
  if(!air){o.vx*=Math.exp(-dt*8);o.vz*=Math.exp(-dt*8);o.hop-=dt*(o.wet?.4:1);
   if(o.hop<=0){o.hop=.8+Math.random()*.7;let tx,tz;if(dP<11&&G.state==='play'){tx=P.x;tz=P.z}else{tx=o.hx+(Math.random()-.5)*8;tz=o.hz+(Math.random()-.5)*8}
    const dx=tx-o.x,dz=tz-o.z,d=Math.hypot(dx,dz)||1,s=dP<11?3.6:1.6;o.vx=dx/d*s;o.vz=dz/d*s;o.vy=dP<11?6.5:4.5;o.face=Math.atan2(dx,dz);o.sq=.7;if(dP<14&&once('slh',220))tone(240+Math.random()*80,.08,'sine',.04,1.6)}}
  o.vy-=20*dt;o.x+=o.vx*dt;o.z+=o.vz*dt;pushOut(o,.5,.8);o.y+=o.vy*dt;const ng=groundAt(o.x,o.z,o.y);if(o.y<=ng){if(air)o.sq=.5;o.y=ng;o.vy=0}
  if(SC.id==='field'&&ng<-.4){o.x=o.hx;o.z=o.hz;o.y=SC.groundH(o.x,o.z)}if(o.y<-6){o.dead=true}
  if(dP<.95&&Math.abs(P.y-o.y)<1.1&&!o.dizzy)hurt(1,o.x,o.z)},
 water(o){const dx=o.x-P.x,dz=o.z-P.z,d=Math.hypot(dx,dz)||1;o.vx=dx/d*5;o.vz=dz/d*5;o.wet=2;o.sq=.4;if(Math.random()<.3)puff(o.x,o.y+.8,o.z,2,[.8,.95,1],{k:3,size:.3,life:.8,up:1,g:.5})},
 stick(o){o.hp-=1;o.sq=1;const dx=o.x-P.x,dz=o.z-P.z,d=Math.hypot(dx,dz)||1;o.vx=dx/d*7;o.vz=dz/d*7;o.vy=4;SFX.squish();puff(o.x,o.y+.5,o.z,5,[o.col,[1,1,1]],{k:1,spd:2,size:.3,life:.5});if(o.hp<=0)slimeDie(o)}};
/* ---------- Mossmaw, the grumpy golem of the shrine ---------- */
function makeBoss(x,z){return{x,z,y:0,face:Math.PI,alive:true,hp:6,max:6,state:'wake',t:0,slams:0,ring:-1,stun:0,hitsThisStun:0,flash:0,arm:0,mouth:0,vx:0,vz:0,rocks:[],hurtCD:0,phase:1}}
function bossUpdate(dt){const B=BOSS;if(!B||!B.alive)return;B.t+=dt;B.flash=Math.max(0,B.flash-dt*3);B.hurtCD-=dt;const dx=P.x-B.x,dz=P.z-B.z,d=Math.hypot(dx,dz);
 B.phase=B.hp>4?1:B.hp>2?2:3;const spd=[0,2.1,2.6,3.1][B.phase];
 if(B.state==='wake'){if(B.t>3.2){B.state='walk';B.t=0}}
 else if(B.state==='walk'){B.face+=angDiff(B.face,Math.atan2(dx,dz))*Math.min(1,dt*3);if(d>4.2){B.x+=Math.sin(B.face)*spd*dt;B.z+=Math.cos(B.face)*spd*dt;if(once('bstep',520)){SFX.stomp();shake(.06)}}
  if(d<6.5&&B.t>1.2){B.state='raise';B.t=0;SFX.roar()}else if(B.t>6){B.state='raise';B.t=0}}
 else if(B.state==='raise'){B.arm=ease(B.t/.9);if(B.t>.9){B.state='slam';B.t=0;B.ring=0;SFX.stomp();shake(.5);puff(B.x+Math.sin(B.face)*2.6,.3,B.z+Math.cos(B.face)*2.6,24,[[.7,.65,.55],[.55,.75,.45]],{spd:5,up:1,size:.6,life:.8});
   B.slams++;if(B.phase>=2)for(let i=0;i<B.phase+1;i++)B.rocks.push({x:P.x+(Math.random()-.5)*9,z:P.z+(Math.random()-.5)*9,y:16+Math.random()*5,vy:0});
   // after the slam, a few mushrooms pop up around the arena
   for(const m of SC.things)if(m.k==='mush'&&m.cool>2)m.cool=2}}
 else if(B.state==='slam'){B.arm=1-ease(B.t/.5);if(B.t>(B.phase===3&&B.slams%2?.6:1.3)){if(B.phase===3&&B.slams%2){B.state='raise';B.t=.3}else{B.state='walk';B.t=0}}}
 else if(B.state==='stun'){B.stun-=dt;B.arm=0;if(Math.random()<dt*6)puff(B.x,3,B.z,1,[[1,1,.6],[1,.85,1]],{k:1,size:.35,life:.7,spd:1.2,up:1});if(B.stun<=0||B.hitsThisStun>=2){B.state='getup';B.t=0}}
 else if(B.state==='getup'){if(B.t>1.1){B.state='walk';B.t=0;B.hitsThisStun=0}}
 else if(B.state==='end'){B.y-=dt*.4}
 // the shockwave ring rolls outward; jump it or be far away
 if(B.ring>=0){B.ring+=dt*9;const rr=Math.hypot(P.x-B.x,P.z-B.z);if(Math.abs(rr-B.ring)<.8&&P.y<.45&&G.state==='play')hurt(1,B.x,B.z);if(B.ring>16)B.ring=-1}
 for(let i=B.rocks.length-1;i>=0;i--){const r=B.rocks[i];r.vy-=22*dt;r.y+=r.vy*dt;if(r.y<=0){B.rocks.splice(i,1);SFX.stomp();puff(r.x,.3,r.z,12,[[.7,.65,.55],[.6,.55,.45]],{spd:3,size:.45,life:.6});if(Math.hypot(P.x-r.x,P.z-r.z)<1.5)hurt(1,r.x,r.z)}}
 // bumping into it
 if(d<2.4&&B.state!=='stun'&&B.state!=='end'&&P.inv<=0)hurt(1,B.x,B.z);
 if(B.state!=='stun'&&d<2.4){P.x=B.x+dx/(d||1)*2.4;P.z=B.z+dz/(d||1)*2.4}
 B.mouth=lerp(B.mouth,B.state==='raise'?1:B.state==='stun'?.6:0,dt*6)}
function bossInCloud(c){const B=BOSS;if(B.state==='stun'||B.state==='getup'||B.state==='wake'||B.state==='end')return;B.state='stun';B.stun=5.5;B.t=0;B.hitsThisStun=0;B.ring=-1;SFX.cough();setTimeout(()=>SFX.cough(),500);toast('MOSSMAW COUGHS AND FLOPS OVER! WHACK THE GLOWING GEM!');shake(.3)}
function bossStick(){const B=BOSS;if(B.state!=='stun'||B.hurtCD>0)return;const gx=B.x+Math.sin(B.face)*1.6,gz=B.z+Math.cos(B.face)*1.6;if(Math.hypot(P.x-gx,P.z-gz)>2.4)return;
 B.hp--;B.hitsThisStun++;B.flash=1;B.hurtCD=.3;SFX.bosshit();shake(.25);puff(gx,1.2,gz,14,[[1,.6,.85],[1,1,.7],[.7,1,.9]],{k:1,spd:3,size:.4,life:.7});
 if(B.hp<=0){B.state='end';B.t=0;bossDefeated()}}
