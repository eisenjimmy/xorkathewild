/* ================= the game loop: input from keys, mouse, pads and fingers; states; cutscenes ================= */
const G={state:'boot',clock:0,time:0,stats:{bloom:0,slimes:0,pets:0,boing:0},mx:-1,my:-1,toast:null,banner:null,item:null,dlg:null,cut:null,fade:null,confirm:null,confSel:0,menuSel:0,kbMenu:false,saveInfo:null,saved:0,heartBump:0,u:1,deadT:0,endT:0,showCtl:false};
const KEYS={},PREV={};let lockWas=false,mouseBtn={};
addEventListener('keydown',e=>{if(e.repeat&&KEYS[e.code])return;KEYS[e.code]=true;audioInit();if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();menuKey(e.code)});
addEventListener('keyup',e=>{KEYS[e.code]=false});
addEventListener('blur',()=>{for(const k in KEYS)KEYS[k]=false;mouseBtn={};if(G.state==='play')G.state='pause'});
const canvasPt=e=>[e.clientX*DPR,e.clientY*DPR];
function uiHit(x,y){for(let i=UZ.length-1;i>=0;i--){const z=UZ[i];if(x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h){z.fn();return true}}return false}
cv.addEventListener('mousedown',e=>{audioInit();cv.focus();const [x,y]=canvasPt(e);G.mx=x;G.my=y;G.kbMenu=false;
 if(G.state!=='play'||G.cut){uiHit(x,y);return}
 if(UZ.length&&uiHit(x,y))return;
 if(!document.pointerLockElement&&cv.requestPointerLock){try{const p=cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(err){}}
 mouseBtn[e.button]=true});
addEventListener('mouseup',e=>{mouseBtn[e.button]=false});
addEventListener('mousemove',e=>{const [x,y]=canvasPt(e);G.mx=x;G.my=y;if(document.pointerLockElement===cv&&G.state==='play'&&!G.cut){IN.camX+=e.movementX*.0026;IN.camY+=e.movementY*.0022}});
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('wheel',e=>{CAM.dist=clamp(CAM.dist+Math.sign(e.deltaY)*.8,4,12);e.preventDefault()},{passive:false});
document.addEventListener('pointerlockchange',()=>{const l=document.pointerLockElement===cv;if(lockWas&&!l&&G.state==='play')G.state='pause';lockWas=l});
/* ---------- touch: a stick on the left, the camera on the right, buttons by the right thumb ---------- */
const touches=new Map();
function touchStart(e){e.preventDefault();audioInit();TOUCH.on=true;for(const t of e.changedTouches){const x=t.clientX*DPR,y=t.clientY*DPR;G.mx=x;G.my=y;
  if(G.state!=='play'||G.cut){uiHit(x,y);continue}
  const b=TOUCH.btns.find(b=>Math.hypot(b.x-x,b.y-y)<b.r*1.25);if(b){touches.set(t.identifier,{k:'btn',b:b.k});TOUCH.held[b.k]=true;continue}
  if(uiHit(x,y))continue;
  if(x<VW*.42&&!TOUCH.stick){TOUCH.stick={id:t.identifier,ox:x,oy:y,x,y};touches.set(t.identifier,{k:'stick'})}else touches.set(t.identifier,{k:'cam',x,y})}}
function touchMove(e){e.preventDefault();for(const t of e.changedTouches){const s=touches.get(t.identifier);if(!s)continue;const x=t.clientX*DPR,y=t.clientY*DPR;
  if(s.k==='stick'){const S2=TOUCH.stick,dx=x-S2.ox,dy=y-S2.oy,d=Math.hypot(dx,dy),m=40*G.u;S2.x=S2.ox+dx/Math.max(d,m)*Math.min(d,m);S2.y=S2.oy+dy/Math.max(d,m)*Math.min(d,m)}
  else if(s.k==='cam'){IN.camX+=(x-s.x)*.0055/DPR;IN.camY+=(y-s.y)*.0045/DPR;s.x=x;s.y=y}}}
function touchEnd(e){e.preventDefault();for(const t of e.changedTouches){const s=touches.get(t.identifier);touches.delete(t.identifier);if(!s)continue;if(s.k==='btn')TOUCH.held[s.b]=false;if(s.k==='stick')TOUCH.stick=null}}
cv.addEventListener('touchstart',touchStart,{passive:false});cv.addEventListener('touchmove',touchMove,{passive:false});cv.addEventListener('touchend',touchEnd,{passive:false});cv.addEventListener('touchcancel',touchEnd,{passive:false});
/* ---------- gamepads ---------- */
let PADP={};
function readPad(){let p=null;try{const ps=navigator.getGamepads?navigator.getGamepads():[];for(const q of ps)if(q&&q.connected){p=q;break}}catch(e){}return p}
/* ---------- one frame of input ---------- */
function pollInput(dt){const k=c=>!!KEYS[c],pad=readPad(),pb=i=>!!(pad&&pad.buttons[i]&&pad.buttons[i].pressed),dz=v=>Math.abs(v)<.18?0:v;
 let mx=(k('KeyD')?1:0)-(k('KeyA')?1:0),mz=(k('KeyW')?1:0)-(k('KeyS')?1:0);
 if(pad){mx+=dz(pad.axes[0]||0);mz-=dz(pad.axes[1]||0);IN.camX+=dz(pad.axes[2]||0)*2.8*dt;IN.camY+=dz(pad.axes[3]||0)*2*dt}
 if(TOUCH.stick){const S2=TOUCH.stick,m=40*G.u;mx+=(S2.x-S2.ox)/m;mz-=(S2.y-S2.oy)/m}
 IN.camX+=((k('ArrowRight')?1:0)-(k('ArrowLeft')?1:0))*2.2*dt;IN.camY+=((k('ArrowDown')?1:0)-(k('ArrowUp')?1:0))*1.6*dt;
 IN.mx=clamp(mx,-1,1);IN.mz=clamp(mz,-1,1);
 const raw={jump:k('Space')||pb(0)||!!TOUCH.held.jump,stick:k('KeyJ')||!!mouseBtn[0]||pb(2)||!!TOUCH.held.stick,water:k('KeyK')||k('KeyL')||!!mouseBtn[2]||pb(7)||pb(5)||!!TOUCH.held.water,
  act:k('KeyE')||k('KeyF')||pb(1)||pb(3)||!!TOUCH.held.act,sprint:k('ShiftLeft')||k('ShiftRight')||pb(4)||pb(10)||pb(6)||!!TOUCH.held.sprint,pause:k('Escape')||k('KeyP')||pb(9)};
 for(const key in raw){IN[key]=raw[key];IN[key+'P']=raw[key]&&!PREV[key];PREV[key]=raw[key]}
 // pad navigation for menus
 if(pad){const up=pb(12)||(pad.axes[1]||0)<-.6,dn=pb(13)||(pad.axes[1]||0)>.6,lf=pb(14)||(pad.axes[0]||0)<-.6,rt=pb(15)||(pad.axes[0]||0)>.6,a=pb(0),b=pb(1);
  if(up&&!PADP.up)menuKey('ArrowUp');if(dn&&!PADP.dn)menuKey('ArrowDown');if(lf&&!PADP.lf)menuKey('ArrowLeft');if(rt&&!PADP.rt)menuKey('ArrowRight');if(a&&!PADP.a&&G.state!=='play')menuKey('Enter');if(b&&!PADP.b&&G.state==='pause')menuKey('Escape');PADP={up,dn,lf,rt,a,b}}}
function menuKey(code){const menu=G.state==='title'||G.state==='pause'||G.state==='dead';
 if(G.confirm){if(code==='ArrowLeft'||code==='ArrowRight'||code==='KeyA'||code==='KeyD'){G.confSel=1-G.confSel;SFX.tick()}else if(code==='Enter'||code==='Space'){const C2=G.confirm;G.confirm=null;SFX.click();if(G.confSel===0)C2.yes()}else if(code==='Escape')G.confirm=null;return}
 if(G.state==='talk'&&(code==='Enter'||code==='Space'||code==='KeyE'||code==='KeyF')){dlgAdvance();return}
 if(G.state==='end'&&G.endT>4){toTitle();return}
 if(code==='KeyM'){audioInit();setMuted(!AU.muted)}
 if(G.state==='play'&&(code==='Escape'||code==='KeyP')&&!G.cut){G.state='pause';G.menuSel=0;if(document.exitPointerLock)document.exitPointerLock();return}
 if(G.state==='pause'&&(code==='Escape'||code==='KeyP')){G.state='play';return}
 if(!menu||!G.menuItems)return;const n=G.menuItems.length;
 if(code==='ArrowUp'||code==='KeyW'){G.menuSel=(G.menuSel+n-1)%n;G.kbMenu=true;SFX.tick()}else if(code==='ArrowDown'||code==='KeyS'){G.menuSel=(G.menuSel+1)%n;G.kbMenu=true;SFX.tick()}
 else if(code==='Enter'||code==='Space'){if(!G.kbMenu){G.kbMenu=true;return}const it=G.menuItems[G.menuSel];if(it){if(G.confirm===null)G.confSel=0;it[1]();if(G.confirm)G.confSel=0}}}
/* ---------- cutscenes ---------- */
function cutUpdate(dt){const C2=G.cut;const t0=C2.t;C2.t+=dt;const at=s=>t0<s&&C2.t>=s;
 if(C2.kind==='intro'){if(at(.2))banner('PUFFWOOD VALE','A SUNNY MORNING');if(C2.t>=C2.dur){G.cut=null;toast('ELDER HOOT IS WAVING AT YOU. WALK OVER AND PRESS E TO TALK.')}}
 else if(C2.kind==='door'){for(let i=0;i<3;i++)if(at(.8+i*.8)){tone(880+i*220,.5,'sine',.1,1,0,null,.5);puff(C2.o.x-1.6+i*1.6,C2.o.y+5.75,C2.o.z+.4,14,[[1,1,.7],[.7,1,1]],{k:1,spd:2.5,size:.35,life:.8})}
  if(at(3.3)){FLAGS.shrineOpen=1;C2.o.c.on=false;SFX.door();shake(.5);SFX.solved()}if(C2.t>=C2.dur){G.cut=null;save();toast('THE SHRINE IS OPEN! STEP INSIDE.')}}
 else if(C2.kind==='boss'){if(C2.t>=C2.dur){G.cut=null;toast('MOSSMAW HATES PURPLE SNEEZES. LURE IT NEAR A MUSHROOM!',4.5)}}
 else if(C2.kind==='bossEnd'){if(C2.t>=C2.dur){G.cut=null;endingTalk()}}}
/* ---------- the update ---------- */
function stepThings(dt){for(const o of SC.things){if(o.dead)continue;const K=KIND[o.k];if(K.upd)K.upd(o,dt)}if(SC.things.some(o=>o.dead&&(o.k==='cloud'||o.k==='heart'||o.k==='slime')))SC.things=SC.things.filter(o=>!(o.dead&&(o.k==='cloud'||o.k==='heart'||o.k==='slime')))}
function update(dt){G.clock+=dt;pollInput(dt);G.pushing=0;
 if(G.state==='title'){stepThings(dt);stepParticles(dt)}
 else if(G.state==='play'){if(IN.pauseP&&!G.cut){menuKey('Escape')}
  if(G.cut){cutUpdate(dt);IN.jumpP=IN.stickP=IN.actP=false;const keep={mx:IN.mx,mz:IN.mz,water:IN.water};IN.mx=IN.mz=0;IN.water=false;playerUpdate(dt);Object.assign(IN,keep)}
  else{playerUpdate(dt);if(IN.actP&&G.state==='play'){const p=promptTarget();if(p)KIND[p.o.k].act(p.o)}G.time+=dt}
  stepThings(dt);stepDrops(dt);stepParticles(dt);dungeonUpdate(dt);
  if(SC.id==='field'&&!G.cut&&G.state==='play'){G.autoT=(G.autoT||0)+dt;if(G.autoT>25&&P.ground&&safeSpot(P.x,P.z)){G.autoT=0;save()}}}
 else if(G.state==='talk'){if(IN.actP||IN.jumpP||IN.stickP)dlgAdvance();stepThings(dt*.5);stepParticles(dt)}
 else if(G.state==='end'){stepParticles(dt);if((IN.jumpP||IN.actP||IN.stickP)&&G.endT>4)toTitle()}
 else stepParticles(dt);
 if(IN.pauseP&&G.state==='pause'&&false)G.state='play'}
function toTitle(){G.state='title';G.cut=null;G.dlg=null;G.confirm=null;G.menuSel=0;G.saveInfo=peekSave();useScene('field');P.x=0;P.z=-900;P.y=-50;playSong('title');if(document.exitPointerLock)document.exitPointerLock()}
let last=0;
function loop(now){const dt=last?Math.min(.05,(now-last)/1000):0;last=now;try{update(dt);updateCamera(dt);render(dt);drawUI(dt);musicTick()}catch(e){console.error(e);if(window.__errs)window.__errs.push(String(e&&e.stack||e))}requestAnimationFrame(loop)}
function boot(){ui.fillStyle='#8fd3f4';ui.fillRect(0,0,VW,VH);const u=VH/360;text('LOADING THE VALE...',VW/2,VH/2,2*u,'#fff','center','#4a3a5a');
 setTimeout(()=>{buildMeshes();toTitle();G.state='title';requestAnimationFrame(loop)},30)}
boot();
