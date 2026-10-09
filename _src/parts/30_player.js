/* ================= Orka: walking, jumping, gliding, the stick and the water gun ================= */
const FLAGS={};
const P={x:0,y:0,z:0,vx:0,vz:0,vy:0,face:0,hp:6,maxHp:6,st:100,stLock:false,water:100,ground:true,glide:false,sprint:false,aim:false,
 swing:0,swingN:0,swingQ:false,swingHit:false,fire:0,inv:0,hurtT:9,safe:[0,0,0],safeT:0,walk:0,land:0,wade:false,airT:0,push:null,pushT:0,squirt:0,coyote:0,anim:0,spin:0,cough:0};
const IN={mx:0,mz:0,jump:false,jumpP:false,stick:false,stickP:false,water:false,act:false,actP:false,sprint:false,camX:0,camY:0,pause:false,pauseP:false};
const PR=.42,STEP=.5;
/* ---------- collisions against the scene ---------- */
function inCol(c,x,z,r=0){if(c.t==='c')return Math.hypot(x-c.x,z-c.z)<c.r+r;return Math.abs(x-c.x)<c.hx+r&&Math.abs(z-c.z)<c.hz+r}
function groundAt(x,z,y){let g=SC.groundH(x,z);for(const c of SC.cols){if(!c.on||c.y1>y+STEP||c.y1<=g)continue;if(inCol(c,x,z,-.05))g=c.y1}return g}
function pushOut(o,r,h=1.3){let hit=false;for(const c of SC.cols){if(!c.on)continue;if(o.y>=c.y1-STEP+.02||o.y+h<=c.y0)continue;
  if(c.t==='c'){const dx=o.x-c.x,dz=o.z-c.z,d=Math.hypot(dx,dz),m=c.r+r;if(d<m&&d>1e-4){o.x=c.x+dx/d*m;o.z=c.z+dz/d*m;hit=true}}
  else{const dx=o.x-c.x,dz=o.z-c.z,px=c.hx+r-Math.abs(dx),pz=c.hz+r-Math.abs(dz);if(px>0&&pz>0){if(px<pz)o.x+=Math.sign(dx||1)*px;else o.z+=Math.sign(dz||1)*pz;hit=true}}}return hit}
// a ray against walls and the ground, for the camera and for squirts
function rayBlocked(ax,ay,az,bx,by,bz,steps=24){for(let i=1;i<=steps;i++){const t=i/steps,x=lerp(ax,bx,t),y=lerp(ay,by,t),z=lerp(az,bz,t);
 if(y<SC.groundH(x,z)+.1&&!(SC.id==='dungeon'&&SC.groundH(x,z)<-5))return t;for(const c of SC.cols){if(c.on&&c.tag!=='fence'&&y<c.y1&&y>c.y0&&inCol(c,x,z,.15))return t}}return 1}
/* ---------- particles ---------- */
const PT=[];
function puff(x,y,z,n,col,o={}){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=(o.spd||2)*(.4+Math.random()*.8),up=o.up??1.5;
 PT.push({x:x+(o.jit||0)*(Math.random()-.5),y,z:z+(o.jit||0)*(Math.random()-.5),vx:Math.cos(a)*s,vy:up*(.5+Math.random()),vz:Math.sin(a)*s,t:0,life:(o.life||.8)*(.6+Math.random()*.6),
  size:(o.size||.35)*(.7+Math.random()*.6),col:Array.isArray(col[0])?col[(Math.random()*col.length)|0]:col,k:o.k||0,g:o.g??-3,drag:o.drag??1.5,fade:o.fade??1,grow:o.grow||0})}}
function stepParticles(dt){for(let i=PT.length-1;i>=0;i--){const p=PT[i];p.t+=dt;if(p.t>p.life){PT.splice(i,1);continue}const d=Math.exp(-p.drag*dt);p.vx*=d;p.vz*=d;p.vy=p.vy*d+p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt}if(PT.length>1600)PT.splice(0,PT.length-1600)}
/* ---------- the water gun: droplets on a gentle arc ---------- */
const DROPS=[];
function squirt(dir){if(P.water<1.2){if(once('dry',600)){SFX.deny();toast('THE TANK IS EMPTY. STAND IN WATER TO REFILL!')}return}P.water-=1.25;SFX.squirt();
 const f=P.face,mx=P.x+Math.sin(f)*.55+Math.cos(f)*.28,mz=P.z+Math.cos(f)*.55-Math.sin(f)*.28,my=P.y+.82,sp=17;
 DROPS.push({x:mx,y:my,z:mz,vx:dir[0]*sp+(Math.random()-.5)*.5,vy:dir[1]*sp+1.2+(Math.random()-.5)*.4,vz:dir[2]*sp+(Math.random()-.5)*.5,t:0})}
function stepDrops(dt){for(let i=DROPS.length-1;i>=0;i--){const d=DROPS[i];d.t+=dt;d.vy-=15*dt;const ox=d.x,oy=d.y,oz=d.z;d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;let gone=d.t>1.6;
  if(!gone){for(const o of SC.things){if(o.dead||!o.hr||!KIND[o.k].water)continue;const cy=o.y+(o.hy||.5);if(Math.hypot(d.x-o.x,d.y-cy,d.z-o.z)<o.hr+.15){KIND[o.k].water(o,d);gone=true;break}}}
  if(!gone&&BOSS&&BOSS.alive&&BOSS.state!=='stun'&&Math.hypot(d.x-BOSS.x,d.y-BOSS.y-3.4,d.z-BOSS.z)<2){gone=true;puff(d.x,d.y,d.z,2,[.7,.9,1],{spd:1.5,size:.2,life:.4})}
  if(!gone){const g=SC.groundH(d.x,d.z);if(d.y<g&&g>-5){gone=true;splash(d.x,Math.max(g,0),d.z,g<0)}else for(const c of SC.cols){if(c.on&&d.y<c.y1&&d.y>c.y0&&inCol(c,d.x,d.z)){gone=true;splash(ox,oy,oz);break}}}
  if(gone)DROPS.splice(i,1)}}
function splash(x,y,z,big){puff(x,y+.05,z,big?6:3,[[.75,.92,1],[.9,.98,1],[.55,.8,1]],{spd:big?2.4:1.6,up:2.4,size:.18,life:.45,g:-9})}
/* ---------- hurting and healing ---------- */
function hurt(n,fromX,fromZ){if(P.inv>0||G.state!=='play')return;P.hp=Math.max(0,P.hp-n);P.inv=1.1;P.hurtT=0;SFX.hurt();shake(.25);
 if(fromX!=null){const dx=P.x-fromX,dz=P.z-fromZ,d=Math.hypot(dx,dz)||1;P.vx=dx/d*7;P.vz=dz/d*7;P.vy=Math.max(P.vy,4.5);P.ground=false}
 puff(P.x,P.y+1,P.z,6,[[1,.5,.6],[1,.8,.85]],{k:1,spd:2.5,size:.4,life:.6});if(P.hp<=0)die()}
function heal(n){const was=P.hp;P.hp=Math.min(P.maxHp,P.hp+n);if(P.hp>was){SFX.heal();G.heartBump=1;puff(P.x,P.y+1.2,P.z,8,[[1,.55,.7],[1,.85,.9]],{k:1,spd:1.6,up:2.4,size:.4,life:.9,g:1})}}
/* ---------- the update ---------- */
const camFwd=()=>[Math.sin(CAM.yaw),Math.cos(CAM.yaw)];
function playerUpdate(dt){const fw=camFwd();let mx=IN.mx,mz=IN.mz;const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml}
 // camera-relative: forward is where the camera looks
 const wx=fw[0]*mz-fw[1]*mx,wz=fw[1]*mz+fw[0]*mx,moving=ml>.12;
 P.aim=IN.water&&!P.glide;P.sprint=IN.sprint&&moving&&P.ground&&!P.aim&&!P.stLock&&P.st>0;
 const g=SC.groundH(P.x,P.z),depth=-Math.min(g,0),wading=P.ground&&P.y<.05&&SC.id==='field';P.wade=wading;
 let spd=P.aim?3.4:P.sprint?8.6:5.6;if(wading)spd*=.72;if(P.swing>0&&P.ground)spd*=.45;
 const tx=wx*spd*Math.min(ml,1),tz=wz*spd*Math.min(ml,1),acc=P.ground?14:P.glide?2.2:4.5;
 if(P.glide){const gs=7.6;const hx=moving?wx:Math.sin(P.face),hz=moving?wz:Math.cos(P.face);P.vx=lerp(P.vx,hx*gs,acc*dt);P.vz=lerp(P.vz,hz*gs,acc*dt)}
 else if(P.hurtT>.3||P.ground){P.vx=lerp(P.vx,tx,1-Math.exp(-acc*dt));P.vz=lerp(P.vz,tz,1-Math.exp(-acc*dt))}
 // facing: toward motion, or toward the camera while aiming
 if(P.aim)P.face=CAM.yaw;else if(moving&&P.swing<=0)P.face+=angDiff(P.face,Math.atan2(wx,wz))*Math.min(1,dt*14);
 // stamina
 if(P.sprint){P.st-=20*dt}else if(P.glide){P.st-=8*dt}else if(P.ground){P.st=Math.min(100,P.st+(P.stLock?24:36)*dt)}
 if(P.st<=0){P.st=0;P.stLock=true;if(P.glide){P.glide=false}}if(P.stLock&&P.st>=35)P.stLock=false;
 // jumping and gliding
 P.coyote=P.ground?.12:Math.max(0,P.coyote-dt);
 if(IN.jumpP){if(P.coyote>0&&!P.glide){P.vy=8.4;P.ground=false;P.coyote=0;SFX.jump();puff(P.x,P.y+.1,P.z,5,[.95,.92,.85],{spd:1.6,up:.6,size:.3,life:.4,g:0})}
  else if(!P.ground){if(P.glide)P.glide=false;else if(FLAGS.glider&&!P.stLock&&P.st>0){P.glide=true;SFX.glide();puff(P.x,P.y+1.9,P.z,6,[[.5,.85,.4],[.7,.95,.5]],{k:2,spd:1.6,size:.35,life:.6,g:-1})}}}
 P.vy-=24*dt;if(P.glide)P.vy=Math.max(P.vy,-1.75);
 // move, collide, settle on the ground
 const ox=P.x,oz=P.z,oldG=groundAt(P.x,P.z,P.y);P.x+=P.vx*dt;P.z+=P.vz*dt;pushOut(P,PR);
 let ng=groundAt(P.x,P.z,P.y);
 // too steep to walk up: slide back (the ridge and cliffs stay special)
 if(P.ground&&ng-oldG>Math.hypot(P.x-ox,P.z-oz)*1.05+.004&&ng-oldG<STEP+.6&&SC.id==='field'&&fieldN(P.x,P.z)[1]<.66){P.x=ox;P.z=oz;ng=oldG}
 P.y+=P.vy*dt;
 if(P.y<=ng){if(!P.ground&&P.airT>.25){SFX.land();P.land=.18;puff(P.x,ng+.05,P.z,6,[.95,.92,.85],{spd:2,up:.5,size:.32,life:.45,g:0})}P.y=ng;P.vy=0;P.ground=true;P.glide=false;P.airT=0}
 else{if(P.ground&&P.y-ng>.35)P.ground=false;else if(P.ground){P.y=ng;P.vy=0}if(!P.ground)P.airT+=dt}
 // water: deep water sends you back to the shore, shallow water refills the gun
 if(SC.id==='field'&&P.y<-.75){respawn('SPLASH! TOO DEEP FOR ORKA.',0);return}
 if(P.y<-8){respawn('OOPS! WATCH YOUR STEP.',1);return}
 if(wading){P.water=Math.min(100,P.water+40*dt);if(P.fire>0){P.fire=0;SFX.hiss()}if(moving&&once('wade',260)){SFX.splash();splash(P.x,0,P.z,true)}}
 else if(!IN.water)P.water=Math.min(100,P.water+2.5*dt);
 if(P.ground&&moving&&!wading){P.walk+=dt*spd*1.5;if(Math.floor(P.walk/Math.PI)!==Math.floor((P.walk-dt*spd*1.5)/Math.PI))SFX.step()}else if(!moving)P.walk=0;
 // remember solid ground to return to after a fall
 P.safeT-=dt;if(P.ground&&P.safeT<=0&&!wading&&P.inv<=0&&safeSpot(P.x,P.z)){P.safe=[P.x,P.y,P.z];P.safeT=.4}
 // the stick
 if(IN.stickP&&!P.aim){if(P.swing<=0){P.swing=.34;P.swingN=(P.swingN+1)%3;P.swingHit=false;SFX.swing()}else if(P.swing<.2)P.swingQ=true}
 if(P.swing>0){P.swing-=dt;if(!P.swingHit&&P.swing<.22){P.swingHit=true;stickHit()}if(P.swing<=0&&P.swingQ){P.swingQ=false;P.swing=.34;P.swingN=(P.swingN+1)%3;P.swingHit=false;SFX.swing()}}
 else P.swingN=P.swingQ?P.swingN:(P.swing<-.4?0:P.swingN);
 if(P.fire>0){P.fire-=dt;if(Math.random()<dt*30){const [sx,sy,sz]=stickTip();puff(sx,sy,sz,1,[[1,.6,.2],[1,.85,.3]],{spd:.4,up:1.6,size:.28,life:.4,g:1.5})}if(P.fire<=0)SFX.hiss()}
 // the water gun
 if(P.aim){P.squirt-=dt;while(P.squirt<=0){P.squirt+=1/15;squirt(aimDir())}}else P.squirt=0;
 P.inv=Math.max(0,P.inv-dt);P.hurtT+=dt;P.land=Math.max(0,P.land-dt);P.anim+=dt}
function safeSpot(x,z){if(SC.id==='field')return fieldH(x,z)>.15;const c=dCell(x,z);return c!==' '&&c!=='V'&&c!=='b'}
function stickTip(){const f=P.face,k=P.swing>0?Math.sin((1-P.swing/.34)*Math.PI)*1.3-.6:0;return[P.x+Math.sin(f+k)*1.1,P.y+1.1,P.z+Math.cos(f+k)*1.1]}
function stickHit(){const f=P.face;let any=false;
 for(const o of SC.things){if(o.dead||!KIND[o.k].stick)continue;const dx=o.x-P.x,dz=o.z-P.z,d=Math.hypot(dx,dz),r=(o.sr||o.hr||.6);if(d>1.55+r)continue;
  const a=Math.abs(angDiff(f,Math.atan2(dx,dz)));if(a>1.35&&d>r+.3)continue;if(Math.abs(o.y+(o.hy||.5)-(P.y+.8))>1.8+r)continue;KIND[o.k].stick(o);any=true}
 if(BOSS&&BOSS.alive)bossStick();
 if(any)SFX.whack()}
function respawn(msg,dmg){if(!safeSpot(P.safe[0],P.safe[2]))P.safe=[...SC.spawn];const [x,y,z]=P.safe;P.x=x;P.y=y+.05;P.z=z;P.vx=P.vz=P.vy=0;P.glide=false;P.ground=true;P.fire=0;toast(msg);SFX.splash();if(dmg){P.inv=0;hurt(dmg)}P.inv=Math.max(P.inv,1)}
