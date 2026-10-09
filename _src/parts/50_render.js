/* ================= drawing: the camera, the cast's little models, and the whole scene ================= */
const CAM={yaw:Math.PI,pitch:.32,dist:7.5,x:0,y:5,z:-8,tx:0,ty:1,tz:0,VP:null,IVP:null,shake:0,aimK:0,fov:.95,lastMan:0};
function shake(a){CAM.shake=Math.max(CAM.shake,a)}
function aimDir(){const p=CAM.pitch-.17,c=Math.cos(p);return[Math.sin(CAM.yaw)*c,-Math.sin(p),Math.cos(CAM.yaw)*c]}
function updateCamera(dt){
 CAM.yaw-=IN.camX;CAM.pitch=clamp(CAM.pitch+IN.camY,-.35,1.25);if(IN.camX||IN.camY)CAM.lastMan=0;else CAM.lastMan+=dt;IN.camX=IN.camY=0;
 // gentle follow: when running and not steering the camera, swing slowly behind Orka
 if(G.state==='play'&&!P.aim&&CAM.lastMan>1.2&&Math.hypot(P.vx,P.vz)>3&&IN.mz>-.3)CAM.yaw+=angDiff(CAM.yaw,P.face)*Math.min(1,dt*.7)*Math.min(1,Math.abs(IN.mx)+.25);
 CAM.aimK=lerp(CAM.aimK,P.aim&&G.state==='play'?1:0,1-Math.exp(-dt*12));
 let yaw=CAM.yaw,pitch=CAM.pitch,dist=lerp(CAM.dist,3.4,CAM.aimK),tx=P.x,ty=P.y+1.25,tz=P.z;
 const rx=-Math.cos(yaw),rz=Math.sin(yaw);tx+=rx*.85*CAM.aimK;tz+=rz*.85*CAM.aimK;ty+=.25*CAM.aimK;
 const C2=G.cut;if(C2&&C2.focus){const k=easeIO(Math.min(1,C2.t/.9))*(C2.t>C2.dur-.8?easeIO((C2.dur-C2.t)/.8):1);tx=lerp(tx,C2.focus[0],k);ty=lerp(ty,C2.focus[1],k);tz=lerp(tz,C2.focus[2],k);
  yaw=yaw+angDiff(yaw,C2.yaw+Math.sin(C2.t*.3)*.15)*k;pitch=lerp(pitch,C2.pitch,k);dist=lerp(dist,C2.dist,k)}
 if(G.state==='title'){const t=G.clock*.05;tx=6+Math.sin(t)*10;ty=8;tz=-30+Math.cos(t)*6;yaw=Math.PI*1.1+Math.sin(t*.7)*.5+Math.PI;pitch=.16;dist=26}
 const cp=Math.cos(pitch);let ex=tx-Math.sin(yaw)*cp*dist,ey=ty+Math.sin(pitch)*dist,ez=tz-Math.cos(yaw)*cp*dist;
 if(G.state!=='title'&&SC){const b=rayBlocked(tx,ty,tz,ex,ey,ez,20);if(b<1){const k=Math.max(.12,b-.06);ex=lerp(tx,ex,k);ey=lerp(ty,ey,k);ez=lerp(tz,ez,k)}
  const g=SC.groundH(ex,ez);if(g>-5)ey=Math.max(ey,g+.45);if(SC.id==='dungeon')ey=Math.min(ey,5.2)}
 if(CAM.shake>0){CAM.shake=Math.max(0,CAM.shake-dt*1.6);const s=CAM.shake*.35;ex+=(Math.random()-.5)*s;ey+=(Math.random()-.5)*s;ez+=(Math.random()-.5)*s}
 {const h=Math.hypot(tx-ex,tz-ez)||1;CAM.fx=(tx-ex)/h;CAM.fz=(tz-ez)/h}CAM.x=ex;CAM.y=ey;CAM.z=ez;CAM.tx=tx;CAM.ty=ty;CAM.tz=tz;
 const proj=M4.persp(lerp(CAM.fov,.82,CAM.aimK),VW/VH,.1,420);CAM.V=M4.look([ex,ey,ez],[tx,ty,tz]);CAM.VP=M4.mul(proj,CAM.V);CAM.IVP=M4.inv(CAM.VP)}
function toScreen(x,y,z){const m=CAM.VP,cx=m[0]*x+m[4]*y+m[8]*z+m[12],cy=m[1]*x+m[5]*y+m[9]*z+m[13],w=m[3]*x+m[7]*y+m[11]*z+m[15];if(w<.1)return null;return[(cx/w*.5+.5)*VW,(1-(cy/w*.5+.5))*VH,w]}
/* ---------- the model library ---------- */
const MESH={};
function oct(mb,x,y,z,r,h,col){const t=[x,y+h,z],b=[x,y-h,z],q=[[x+r,y,z],[x,y,z+r],[x-r,y,z],[x,y,z-r]];for(let i=0;i<4;i++){const a=q[i],c=q[(i+1)%4];mb.tri(t,c,a,col);mb.tri(b,a,c,mulc(col,.8))}}
function buildMeshes(){const M=(f)=>{const mb=new MB();f(mb);return mb.build()};
 const yel=hex('#ffd23e'),yelD=hex('#f0b020'),brown=hex('#7a4a2e'),boot=hex('#ff6a5a'),shorts=hex('#4a6ad8'),orange=hex('#ff8a3a'),teal=hex('#4adcd0'),eye=hex('#2a2030');
 // Orka: a round-headed kid in a yellow raincoat, red boots, a stick and a squirty water gun
 MESH.head=M(mb=>{mb.sphere(0,0,0,.36,.34,.34,C.skin,16);mb.sphere(-.17,-.07,.27,.075,.05,.03,C.blush,8);mb.sphere(.17,-.07,.27,.075,.05,.03,C.blush,8)});
 MESH.eye=M(mb=>{mb.sphere(0,0,0,.055,.085,.04,eye,10);mb.sphere(.018,.03,.03,.022,.022,.015,[1,1,1],6)});
 MESH.mouth=M(mb=>mb.sphere(0,0,0,.05,.025,.02,hex('#c84a5a'),8));
 MESH.hair=M(mb=>{mb.sphere(0,.1,-.07,.375,.29,.34,brown,14);mb.sphere(0,-.04,-.13,.33,.25,.25,brown,12);mb.sphere(0,.2,.14,.3,.15,.2,brown,10);
  for(let i=0;i<7;i++){const a=-.9+i*.3;mb.at(M4.rx(M4.rz(M4.tr(M4.id(),Math.sin(a)*.24,.3,.1+Math.cos(a)*.12),-a*.6),.5));mb.cyl(0,0,0,.08,0,.18,brown,6);mb.at(null)}
  mb.cyl(0,.34,0,.025,.02,.18,C.leafD,6);mb.at(M4.rz(M4.tr(M4.id(),.06,.52,0),-.7));mb.sphere(0,0,0,.1,.03,.06,C.leaf,8);mb.at(null)});
 MESH.body=M(mb=>{mb.sphere(0,0,0,.27,.3,.24,yel,14,(nx,ny,nz)=>ny<-.55?yelD:yel);mb.cyl(0,-.32,0,.31,.22,.24,yel,14,false);for(let i=0;i<3;i++)mb.sphere(0,.12-i*.12,.235,.025,.025,.015,hex('#3a7ad8'),6);
  mb.cyl(0,.24,0,.2,.24,.08,hex('#ff5a6a'),12,true)});
 MESH.arm=M(mb=>{mb.sphere(0,-.12,0,.09,.16,.09,yel,10);mb.sphere(0,-.3,0,.075,.075,.075,C.skin,8)});
 MESH.leg=M(mb=>{mb.sphere(0,-.06,0,.1,.1,.1,shorts,8);mb.sphere(0,-.2,.03,.1,.09,.13,boot,10)});
 MESH.stick=M(mb=>{mb.cyl(0,0,0,.03,.022,.95,hex('#a06a3a'),6,true);mb.at(M4.rz(M4.tr(M4.id(),.03,.62,0),-.9));mb.cyl(0,0,0,.015,.01,.2,hex('#a06a3a'),5);mb.at(null);mb.sphere(.13,.75,0,.08,.03,.05,C.leaf,8)});
 MESH.gun=M(mb=>{mb.box(0,0,.08,.07,.07,.17,orange);mb.box(0,-.12,0,.05,.09,.05,orange);mb.sphere(0,.11,.03,.08,.07,.11,teal,10);mb.cyl(0,0,.25,.03,.025,.01,teal);mb.at(M4.rx(M4.tr(M4.id(),0,0,.24),Math.PI/2));mb.cyl(0,0,0,.032,.024,.08,teal,8);mb.at(null)});
 MESH.leafGlider=M(mb=>{mb.sphere(0,0,0,.85,.06,.55,C.leaf,16,(nx,ny,nz)=>Math.abs(nx)<.06?C.leafD:ny>0?C.leafL:C.leaf);mb.cyl(0,-.9,0,.025,.025,.9,hex('#8a5a3a'),6)});
 MESH.shadow=M(mb=>mb.cyl(0,0,0,1,1,.01,[0,0,0],20,true,[0,0,0]));
 // slimes: a white jelly the shader tints, with a sweet face
 MESH.slime=M(mb=>{mb.sphere(0,.42,0,.55,.45,.55,[1,1,1],16,(nx,ny)=>ny>.6?[1.15,1.15,1.15]:[1,1,1]);mb.sphere(.3,.75,.15,.09,.06,.06,[1.3,1.3,1.3],6)});
 MESH.slimeFace=M(mb=>{mb.sphere(-.17,0,0,.06,.09,.04,eye,8);mb.sphere(.17,0,0,.06,.09,.04,eye,8);mb.sphere(-.15,.03,.03,.02,.02,.01,[1,1,1],6);mb.sphere(.19,.03,.03,.02,.02,.01,[1,1,1],6);mb.sphere(0,-.1,.01,.05,.03,.02,hex('#c84a5a'),6)});
 // flowers: a closed bud, and a bloom that opens over it
 MESH.stem=M(mb=>{mb.cyl(0,0,0,.035,.03,.45,C.leafD,6,true);mb.at(M4.rz(M4.tr(M4.id(),.06,.15,0),-.8));mb.sphere(0,0,0,.14,.03,.07,C.leaf,8);mb.at(null);mb.at(M4.rz(M4.tr(M4.id(),-.06,.25,0),.8));mb.sphere(0,0,0,.12,.03,.06,C.leaf,8);mb.at(null)});
 MESH.bud=M(mb=>mb.sphere(0,0,0,.12,.17,.12,[1,1,1],10,(nx,ny)=>ny<-.3?mulc(C.leaf,.85):[1,1,1]));
 MESH.petals=M(mb=>{for(let i=0;i<6;i++){const a=i/6*TAU;mb.at(M4.rz(M4.ry(M4.id(),a),.35));mb.sphere(.2,0,0,.17,.045,.1,[1,1,1],8);mb.at(null)}mb.sphere(0,.02,0,.1,.07,.1,hex('#ffd84a'),8)});
 MESH.mushStem=M(mb=>mb.cyl(0,0,0,.18,.14,.5,C.white,10,true));
 MESH.mushCap=M(mb=>mb.sphere(0,0,0,.5,.32,.5,[1,1,1],14,(nx,ny,nz)=>{const s=Math.sin(nx*9)*Math.sin(nz*9+ny*4);return ny<-.1?C.white:s>.55?C.white:[1,1,1]}));
 MESH.mushFace=M(mb=>{mb.sphere(-.1,0,0,.035,.05,.02,eye,6);mb.sphere(.1,0,0,.035,.05,.02,eye,6);mb.box(0,-.06,0,.06,.012,.01,eye)});
 MESH.lilyBud=M(mb=>{mb.sphere(0,.05,0,.32,.06,.32,C.leaf,10);mb.sphere(0,.16,0,.11,.14,.11,hex('#ff9ac8'),8)});
 MESH.lilyPad=M(mb=>{for(let i=0;i<14;i++){const a0=.25+i/14*(TAU-.5),a1=.25+(i+1)/14*(TAU-.5);mb.tri([0,.1,0],[Math.cos(a1)*1.3,.08,Math.sin(a1)*1.3],[Math.cos(a0)*1.3,.08,Math.sin(a0)*1.3],i%2?C.leaf:C.leafL,undefined,undefined,[0,1,0])}
  mb.cyl(0,-.05,0,1.28,1.28,.13,C.leafD,14,false);for(let i=0;i<5;i++){const a=i/5*TAU;mb.at(M4.rz(M4.ry(M4.tr(M4.id(),.55,.18,.4),a),.4));mb.sphere(.12,0,0,.12,.035,.07,hex('#ffb0d8'),6);mb.at(null)}mb.sphere(.55,.2,.4,.06,.05,.06,hex('#ffe060'),6)});
 MESH.boingBud=M(mb=>{mb.cyl(0,0,0,.12,.1,.4,C.leafD,8);mb.sphere(0,.5,0,.3,.36,.3,hex('#ff8ac0'),12,(nx,ny)=>ny<-.4?C.leaf:hex('#ff8ac0'))});
 MESH.boingBloom=M(mb=>{mb.cyl(0,0,0,.18,.15,.6,C.leafD,8);for(let i=0;i<8;i++){const a=i/8*TAU;mb.at(M4.rz(M4.ry(M4.tr(M4.id(),0,.62,0),a),.2));mb.sphere(.62,0,0,.55,.1,.36,i%2?hex('#ff8ac0'):hex('#ffb0d8'),10);mb.at(null)}
  mb.cyl(0,.6,0,.5,.5,.16,hex('#ffe060'),14,true,hex('#ffd030'))});
 MESH.bramble=M(mb=>{const R=srand(3);for(let i=0;i<28;i++){const x=(R()-.5)*1.2,y=R()*2.4,z=(R()-.5)*6;mb.at(M4.rz(M4.rx(M4.tr(M4.id(),x,y,z),R()*3),R()*3));mb.cyl(0,0,0,.08,.03,1.4,hex('#6a3a4a'),5);mb.at(null);
  if(R()<.6)mb.sphere(x+(R()-.5)*.6,y,z+(R()-.5)*.6,.16,.16,.16,hex('#4a2a3a'),6)}});
 MESH.campfire=M(mb=>{for(let i=0;i<8;i++){const a=i/8*TAU;mb.rock(Math.cos(a)*.6,.08,Math.sin(a)*.6,.2,C.rockD,i,.8)}for(let i=0;i<3;i++){mb.at(M4.rx(M4.ry(M4.tr(M4.id(),0,.15,0),i*2.1),Math.PI/2.4));mb.cyl(0,-.35,0,.08,.08,.7,C.woodD,6);mb.at(null)}});
 MESH.lantern=M(mb=>{mb.cyl(0,0,0,.3,.22,1,C.shr,8,true);mb.box(0,1.2,0,.3,.22,.3,C.shrD);mb.cyl(0,1.42,0,.42,.02,.35,C.shr,4,true);mb.box(0,1.2,0,.2,.15,.31,hex('#3a3040'))});
 MESH.brazier=M(mb=>{mb.cyl(0,0,0,.35,.25,.9,C.shrD,10,true);mb.cyl(0,.9,0,.3,.6,.35,C.shr,12,true,hex('#2a2430'))});
 MESH.wisp=M(mb=>mb.sphere(0,0,0,.32,.32,.32,[1,1,.85],12));
 MESH.wispRing=M(mb=>{for(let i=0;i<16;i++){const a=i/16*TAU;mb.sphere(Math.cos(a)*.55,0,Math.sin(a)*.55,.05,.05,.05,[1,1,1],5)}});
 MESH.door=M(mb=>{mb.box(0,2.35,0,2.3,2.35,.3,C.shrD);for(let i=0;i<4;i++)mb.box(0,.6+i*1.15,.31,1.9,.06,.02,mulc(C.shrD,.8));mb.cyl(0,2.4,.32,.9,.9,.02,mulc(C.shrD,.85),16,true)});
 MESH.socketGlow=M(mb=>mb.sphere(0,0,0,.3,.3,.12,[1,1,.85],10));
 MESH.owl=M(mb=>{mb.sphere(0,.75,0,.6,.72,.55,hex('#a8784a'),14,(nx,ny,nz)=>nz>.35&&ny<.5&&ny>-.6?hex('#f3dcb0'):hex('#a8784a'));mb.sphere(0,1.55,0,.5,.45,.45,hex('#a8784a'),14,(nx,ny,nz)=>nz>.5?hex('#f3dcb0'):hex('#a8784a'));
  for(const s of[-1,1]){mb.sphere(s*.19,1.6,.38,.15,.15,.08,[1,1,1],10);mb.sphere(s*.19,1.6,.45,.08,.1,.04,eye,8);mb.sphere(s*.21,1.64,.48,.03,.03,.01,[1,1,1],6);mb.cyl(s*.19,1.6,.41,.2,.2,.02,hex('#c8a052'),14,false);
   mb.at(M4.rz(M4.tr(M4.id(),s*.32,1.95,0),-s*.4));mb.cyl(0,0,0,.12,0,.3,hex('#8a5a34'),6);mb.at(null);mb.sphere(s*.58,.85,0,.15,.45,.3,hex('#8a5a34'),8);mb.sphere(s*.2,.05,.25,.13,.06,.18,hex('#ffb040'),6)}
  mb.at(M4.rx(M4.tr(M4.id(),0,1.45,.48),.4));mb.cyl(0,0,0,.08,0,.18,hex('#ffb040'),6);mb.at(null);mb.box(0,1.98,0,.32,.04,.32,hex('#4a3a6a'));mb.box(0,2.12,0,.2,.12,.2,hex('#4a3a6a'))});
 MESH.bun=M(mb=>{const fur=hex('#f4ece4'),dress=hex('#c87ad8');mb.sphere(0,.55,0,.5,.55,.45,dress,14,(nx,ny)=>ny<-.6?mulc(dress,.85):dress);mb.sphere(0,1.25,0,.42,.38,.4,fur,14);
  for(const s of[-1,1]){mb.at(M4.rz(M4.tr(M4.id(),s*.17,1.62,-.05),-s*.2));mb.sphere(0,.3,0,.1,.36,.07,fur,10,(nx,ny,nz)=>nz>.4?hex('#ffb0c0'):fur);mb.at(null);
   mb.sphere(s*.15,1.3,.34,.05,.07,.03,eye,8);mb.sphere(s*.22,1.18,.32,.07,.045,.03,C.blush,8);mb.sphere(s*.4,.7,.1,.12,.12,.12,fur,8)}
  mb.sphere(0,1.22,.39,.05,.035,.03,hex('#ff8aa0'),6);mb.sphere(0,.85,-.42,.14,.14,.14,fur,8);mb.cyl(0,1.55,0,.32,.36,.06,hex('#ffe08a'),12,true);mb.sphere(0,.1,.32,.4,.12,.15,hex('#fff8f0'),10)});
 MESH.cat=M(mb=>{const c=hex('#ffb060'),w=hex('#fff4e8');mb.sphere(0,.32,0,.24,.22,.36,c,12,(nx,ny,nz)=>ny<-.3?w:c);mb.sphere(0,.55,.33,.24,.21,.21,c,12,(nx,ny,nz)=>nz>.6&&ny<.1?w:c);
  for(const s of[-1,1]){mb.at(M4.tr(M4.id(),s*.13,.74,.33));mb.cyl(0,0,0,.08,0,.14,c,4);mb.at(null);mb.sphere(s*.08,.58,.52,.03,.045,.02,eye,6);for(const zz of[.2,-.2])mb.sphere(s*.13,.1,zz,.07,.1,.07,w,6)}
  mb.sphere(0,.52,.54,.025,.018,.015,hex('#ff8aa0'),6);mb.at(M4.rx(M4.tr(M4.id(),0,.4,-.34),-.8));mb.cyl(0,0,0,.05,.04,.4,c,6);mb.at(null)});
 MESH.sign=M(mb=>{mb.cyl(0,0,0,.07,.07,1.05,C.woodD,6);mb.box(0,1.05,0,.6,.32,.06,C.wood);mb.box(0,1.05,.065,.45,.03,.005,C.woodD);mb.box(0,.95,.065,.35,.03,.005,C.woodD)});
 MESH.bush=M(mb=>{const R=srand(8);for(let i=0;i<5;i++)mb.sphere((R()-.5)*.9,.4+R()*.3,(R()-.5)*.9,.5,.45,.5,C.leaf,10,(nx,ny)=>ny>.3?C.leafL:C.leaf,.12);for(let i=0;i<4;i++)mb.sphere((R()-.5)*1.1,.6+R()*.4,(R()-.5)*1.1,.07,.07,.07,C.red,6)});
 MESH.heart=M(mb=>{mb.sphere(-.13,.08,0,.16,.16,.12,hex('#ff5a7a'),10);mb.sphere(.13,.08,0,.16,.16,.12,hex('#ff5a7a'),10);mb.at(M4.rx(M4.id(),Math.PI));mb.cyl(0,.02,0,.27,0,.32,hex('#ff5a7a'),12);mb.at(null)});
 MESH.chest=M(mb=>{mb.box(0,.4,0,.7,.4,.5,C.wood);mb.box(0,.4,.505,.72,.06,.01,C.gold);mb.box(-.55,.4,0,.06,.41,.51,C.woodD);mb.box(.55,.4,0,.06,.41,.51,C.woodD)});
 MESH.lid=M(mb=>{mb.box(0,.12,.5,.72,.12,.52,C.wood,hex('#d8985a'));mb.box(0,.05,1.02,.12,.1,.03,C.gold)});
 MESH.block=M(mb=>{mb.box(0,1.2,0,1.2,1.2,1.2,hex('#a8a0b8'),hex('#b8b0c8'));mb.box(0,1.2,1.21,.5,.5,.01,hex('#7ad8ff'));mb.box(0,1.2,-1.21,.5,.5,.01,hex('#7ad8ff'))});
 MESH.plate=M(mb=>{mb.cyl(0,0,0,1,1,.12,hex('#d0a040'),16,true,hex('#ffcf4a'))});
 MESH.gate=M(mb=>{for(let i=0;i<5;i++)mb.cyl(-1+i*.5,0,0,.09,.09,4.4,hex('#6a6478'),6,true);mb.box(0,4.1,0,1.25,.15,.15,hex('#5a5468'));mb.box(0,2,0,1.25,.1,.1,hex('#5a5468'))});
 MESH.crystal=M(mb=>{mb.cyl(0,0,0,.4,.3,.5,C.shrD,8,true);oct(mb,0,1.2,0,.42,.6,[1,1,1])});
 MESH.tileBlue=M(mb=>mb.box(0,-.25,0,DT/2,.25,DT/2,hex('#5a8ae8'),hex('#7aa8ff')));
 MESH.vine=M(mb=>{mb.box(0,-.15,0,DT/2,.15,DT/2,hex('#6ab84a'),hex('#7ad05a'));for(let i=0;i<4;i++)mb.sphere(-.9+i*.6,.02,(i%2-.5)*1.4,.35,.06,.22,C.leafL,8)});
 MESH.sprout=M(mb=>{mb.cyl(0,0,0,.08,.05,.5,C.leafD,6);for(const s of[-1,1]){mb.at(M4.rz(M4.tr(M4.id(),s*.15,.5,0),s*.6));mb.sphere(0,0,0,.2,.05,.12,C.leaf,8);mb.at(null)}});
 MESH.bossdoor=M(mb=>{mb.box(0,2.6,0,1.25,2.6,.4,hex('#6a8a5a'));mb.cyl(0,2.4,.41,.55,.55,.02,C.gold,12,true);mb.box(0,2.2,.44,.12,.25,.02,hex('#3a3020'))});
 MESH.exit=M(mb=>{for(let i=0;i<3;i++)mb.box(0,-.1-i*.12,-i*.5,1.2,.06,.25,mulc(C.stone,1-i*.15))});
 MESH.rock=M(mb=>mb.rock(0,0,0,.8,C.rock,7,1,ny=>mixc(C.rockD,C.rock,smooth(-.5,.4,ny))));
 // Mossmaw: a round boulder of a golem with moss on top and flowers in its hair
 const mossC=(nx,ny,nz)=>ny>.25?mixc(C.moss,hex('#8ad65a'),smooth(.5,.9,ny)):mixc(C.rockD,C.rock,smooth(-.6,.2,ny));
 MESH.bBody=M(mb=>{mb.sphere(0,0,0,2.1,1.8,1.8,C.rock,18,mossC);for(let i=0;i<5;i++){const a=i*1.3;mb.sphere(Math.cos(a)*1.2,1.5,Math.sin(a)*1-.3,.16,.12,.16,[[1,.6,.8],[1,1,.7],[.8,.7,1]][i%3],6)}});
 MESH.bHead=M(mb=>{mb.sphere(0,0,0,1.3,1.1,1.15,C.rock,16,mossC);for(const s of[-1,1]){mb.sphere(s*.45,.12,1.0,.32,.36,.15,[1,1,1],10);mb.sphere(s*.42,.1,1.12,.17,.22,.06,eye,8);mb.sphere(s*.36,.2,1.17,.06,.06,.02,[1,1,1],6);mb.sphere(s*.48,.62,.9,.3,.07,.12,mulc(C.rockD,.8),6)}});
 MESH.bMouth=M(mb=>mb.sphere(0,0,0,.5,.3,.2,hex('#3a2030'),10));
 MESH.bArm=M(mb=>{mb.sphere(0,-.5,0,.6,.75,.6,C.rock,12,mossC);mb.sphere(0,-1.4,.1,.75,.6,.7,C.rock,12,mossC)});
 MESH.bLeg=M(mb=>mb.cyl(0,-1,0,.6,.7,1.1,C.rockD,10,true));
 MESH.gem=M(mb=>oct(mb,0,0,0,.42,.62,hex('#ff7ac8')));
 MESH.ring=M(mb=>{for(let i=0;i<48;i++){const a0=i/48*TAU,a1=(i+1)/48*TAU;const p=(a,r,y)=>[Math.cos(a)*r,y,Math.sin(a)*r];mb.quad(p(a0,1,.05),p(a0,.9,.05),p(a1,.9,.05),p(a1,1,.05),[1,.95,.8])}});
 MESH.mossy=M(mb=>{mb.sphere(0,.5,0,.5,.45,.48,C.moss,14,(nx,ny)=>ny>.3?hex('#9ae070'):C.moss);for(const s of[-1,1]){mb.sphere(s*.17,.55,.4,.07,.1,.04,eye,8);mb.sphere(s*.27,.42,.38,.08,.05,.03,C.blush,8)}mb.sphere(0,1,0,.14,.1,.14,hex('#ff9ac8'),8);mb.cyl(0,.9,0,.03,.03,.12,C.leafD)})}
/* ---------- drawing primitives ---------- */
let U=null,ENVC=null;const IDN=new Float32Array([1,0,0,0,1,0,0,0,1]);
function useToon(){gl.useProgram(TOON.p);U=TOON.U}
function drawM(m,M,o={}){if(!m)return;gl.uniformMatrix4fv(U.uM,false,M);gl.uniformMatrix3fv(U.uN,false,o.nm||M4.nrm(M));gl.uniform4fv(U.uTint,o.tint||[0,0,0,0]);gl.uniform3fv(U.uMul,o.mul||[1,1,1]);
 gl.uniform1f(U.uEmis,o.emis||0);gl.uniform1f(U.uAlpha,o.alpha??1);gl.uniform1f(U.uSway,o.sway||0);gl.bindVertexArray(m.vao);
 if(o.ink!==false&&!o.noInk){gl.cullFace(gl.FRONT);gl.uniform1f(U.uOutline,o.inkW||.028);gl.drawArrays(gl.TRIANGLES,0,m.n);gl.cullFace(gl.BACK);gl.uniform1f(U.uOutline,0)}
 gl.drawArrays(gl.TRIANGLES,0,m.n)}
const T=(x,y,z,ry=0,s=1)=>{const m=M4.tr(M4.id(),x,y,z);if(ry)M4.ry(m,ry);if(s!==1)M4.sc(m,s);return m};
/* ---------- Orka ---------- */
function drawOrka(){const f=P.face,wk=P.walk,mov=Math.hypot(P.vx,P.vz),air=!P.ground,sw=P.swing>0?1-P.swing/.34:-1;
 const bob=P.ground?Math.abs(Math.sin(wk))*.06*Math.min(1,mov/3):0,sq=P.land>0?1-P.land*1.2:1,stretch=air&&!P.glide?1.06:1;
 const root=M4.sc(M4.ry(M4.tr(M4.id(),P.x,P.y+bob,P.z),f),1/Math.sqrt(sq*stretch),sq*stretch,1/Math.sqrt(sq*stretch));
 const flick=P.inv>0&&Math.floor(G.clock*20)%2;if(flick)return;const leg=Math.sin(wk)*.7*Math.min(1,mov/3),tint=P.hurtT<.15?[1,.4,.5,.5]:undefined;
 for(const s of[-1,1]){const m=M4.rx(M4.tr(M4.clone(root),s*.12,.3,0),air?(s*.3-.3):leg*s);drawM(MESH.leg,m,{tint})}
 const torso=M4.rx(M4.tr(M4.clone(root),0,.62,0),P.sprint?.18:P.glide?-.1:0);drawM(MESH.body,torso,{tint});
 const head=M4.rz(M4.rx(M4.tr(M4.clone(torso),0,.55,0),P.aim?-CAM.pitch*.3+.08:Math.sin(G.clock*1.4)*.03),Math.sin(wk)*.04);
 drawM(MESH.head,head,{tint});drawM(MESH.hair,head,{tint});const blink=(G.clock%3.6)<.12?.15:1;
 for(const s of[-1,1]){const e=M4.sc(M4.tr(M4.clone(head),s*.13,.02,.31),1,blink,1);drawM(MESH.eye,e,{noInk:true})}
 drawM(MESH.mouth,M4.tr(M4.clone(head),0,-.14,.32),{noInk:true});
 // right arm: the stick (swings in a three-hit combo)
 let ra=Math.sin(wk)*-.6*Math.min(1,mov/3),rz=0,ry=0;if(sw>=0){const k=easeIO(sw),n=P.swingN;if(n===2){ra=-2.6+k*3.2;rz=-.3}else{ra=-1.5;ry=(n?1:-1)*(1.6-k*3.2);rz=-.4}}else if(P.glide){ra=-3}
 const sh=M4.rz(M4.ry(M4.rx(M4.tr(M4.clone(torso),-.27,.2,0),ra),ry),rz-.15);drawM(MESH.arm,sh,{tint});
 if(!P.glide){const st=M4.rx(M4.tr(M4.clone(sh),0,-.3,0),1.5);drawM(MESH.stick,st,{tint:P.fire>0?[1,.5,.15,.25]:tint});}
 // left arm: the water gun (up and aiming when the water button is held)
 const la=P.aim?-1.45-CAM.pitch*.6:P.glide?-3:Math.sin(wk)*.6*Math.min(1,mov/3);const sl=M4.rz(M4.rx(M4.tr(M4.clone(torso),.27,.2,0),la),.15);drawM(MESH.arm,sl,{tint});
 if(!P.glide){const gm=M4.rx(M4.tr(M4.clone(sl),0,-.3,.02),P.aim?1.57:1.2);drawM(MESH.gun,gm,{tint})}
 if(P.glide){const gm=M4.rz(M4.tr(M4.clone(torso),0,1.45,0),Math.sin(G.clock*3)*.05);drawM(MESH.leafGlider,gm)}}
/* ---------- each kind of thing ---------- */
function wig(o,dt){o.wig=Math.max(0,(o.wig||0)-dt*2.5);return Math.sin(o.wig*18)*o.wig*.25}
function drawThing(o,dt){const k=o.k;
 if(k==='flower'){const w=wig(o,dt);const m=M4.rz(T(o.x,o.y,o.z),w);drawM(MESH.stem,m,{inkW:.02});const g=o.grow||0;
  if(g<.98)drawM(MESH.bud,M4.sc(M4.tr(M4.clone(m),0,.5,0),1-g*.5),{mul:o.petal,inkW:.02});
  if(g>.02){const pm=M4.sc(M4.ry(M4.tr(M4.clone(m),0,.5,0),G.clock*.3),Math.max(.01,easeBack(g)));drawM(MESH.petals,pm,{mul:o.petal,inkW:.02})}}
 else if(k==='mush'){const s=o.squash||0,c=o.cool>0;const m=M4.sc(T(o.x,o.y,o.z),1+s*.15,1-s*.2,1+s*.15);drawM(MESH.mushStem,m);
  const cap=M4.tr(M4.clone(m),0,.55,0);drawM(MESH.mushCap,c?M4.sc(cap,.85,.7,.85):cap,{mul:c?[.7,.55,.8]:[.8,.4,.95]});drawM(MESH.mushFace,M4.tr(M4.clone(m),0,.32,.17),{noInk:true})}
 else if(k==='lily'){const m=T(o.x,(o.yy||0),o.z,o.id);if(o.g<.98)drawM(MESH.lilyBud,M4.sc(M4.clone(m),1+wig(o,dt)),{inkW:.02});if(o.g>.02)drawM(MESH.lilyPad,M4.sc(M4.clone(m),easeBack(o.g)),{inkW:.025})}
 else if(k==='boing'){const m=T(o.x,o.y,o.z);if(o.g<.98)drawM(MESH.boingBud,M4.sc(M4.clone(m),1+wig(o,dt),1+wig(o,0)*.5,1+wig(o,0)));if(o.g>.02)drawM(MESH.boingBloom,M4.sc(M4.clone(m),easeBack(o.g),easeBack(o.g)*(1-o.sq*.4),easeBack(o.g)))}
 else if(k==='sprout'){const g=o.g||0;drawM(MESH.sprout,M4.sc(T(o.x,0,o.z),1+g*.8+wig(o,dt)))}
 else if(k==='bramble'){drawM(MESH.bramble,M4.rz(T(o.x,o.y,o.z),wig(o,dt)*.2),{inkW:.02})}
 else if(k==='campfire')drawM(MESH.campfire,T(o.x,o.y,o.z));
 else if(k==='lantern'){drawM(MESH.lantern,T(o.x,o.y,o.z));if(o.lit>0)drawM(MESH.socketGlow,M4.sc(T(o.x,o.y+1.2,o.z),.6),{emis:1,mul:[1,.8,.4],noInk:true})}
 else if(k==='brazier')drawM(MESH.brazier,T(o.x,o.y,o.z));
 else if(k==='wisp'){if(o.hidden)return;const y=o.y+Math.sin(G.clock*2+o.i)*.2;const m=M4.ry(T(o.x,y,o.z),G.clock);drawM(MESH.wisp,M4.sc(M4.clone(m),1+Math.sin(G.clock*6)*.06),{emis:1,noInk:true});drawM(MESH.wispRing,M4.rx(M4.clone(m),.5+Math.sin(G.clock)*.3),{emis:1,noInk:true})}
 else if(k==='door'){const m=T(o.x,o.y-(o.open||0)*4.9,o.z);drawM(MESH.door,m);for(let i=0;i<3;i++){const lit=FLAGS.shrineOpen||(G.cut&&G.cut.kind==='door'&&G.cut.t>.8+i*.8);if(lit)drawM(MESH.socketGlow,T(o.x-1.6+i*1.6,o.y+5.75-(o.open||0)*4.9,o.z+.3),{emis:1,noInk:true})}}
 else if(k==='npc'){const turn=o.face+angDiff(o.face,o.look)*(near(o,6)?1:0),hop=o.happy>0?Math.abs(Math.sin(G.clock*10))*.15:Math.sin(G.clock*2)*.02;drawM(o.who==='hoot'?MESH.owl:MESH.bun,M4.sc(T(o.x,o.y+hop,o.z,turn),1,1-hop*.3,1))}
 else if(k==='cat'){const m=M4.ry(T(o.x,o.y+Math.abs(Math.sin(o.walk||0))*.04,o.z),o.face||0);drawM(MESH.cat,o.purr>0?M4.sc(m,1+Math.sin(G.clock*20)*.03):m)}
 else if(k==='sign')drawM(MESH.sign,T(o.x,o.y,o.z,o.face||Math.PI));
 else if(k==='bush'){if(o.cut>0){const g=sat((45-o.cut)/45);if(o.cut<6)drawM(MESH.bush,M4.sc(T(o.x,o.y,o.z),.3+.7*(1-o.cut/6)));else drawM(MESH.bush,M4.sc(T(o.x,o.y,o.z),.25))}else drawM(MESH.bush,M4.rz(T(o.x,o.y,o.z),wig(o,dt)*.3))}
 else if(k==='heart'){drawM(MESH.heart,M4.ry(T(o.x,o.y+Math.sin(o.t*4)*.1,o.z),o.t*3),{emis:.3})}
 else if(k==='chest'){const m=T(o.x,o.y,o.z,o.face||0);drawM(MESH.chest,m);drawM(MESH.lid,M4.rx(M4.tr(M4.clone(m),0,.8,-.5),-(o.lid||0)*1.9))}
 else if(k==='block')drawM(MESH.block,T(o.x,0,o.z));
 else if(k==='plate'){const pressed=SC.things.some(q=>q.k==='block'&&Math.abs(q.x-o.x)<.4&&Math.abs(q.z-o.z)<.4);drawM(MESH.plate,T(o.x,pressed?-.08:0,o.z),{noInk:pressed})}
 else if(k==='gate'){if(o.h>.02)drawM(MESH.gate,T(o.x,(o.h-1)*4.4,o.z))}
 else if(k==='crystal'){const b=FLAGS.blue,m=T(o.x,0,o.z);drawM(MESH.crystal,M4.ry(m,G.clock*.8),{mul:b?[.45,.65,1]:[1,.6,.3],emis:.35})}
 else if(k==='bossdoor'){if(o.h>.02)drawM(MESH.bossdoor,T(o.x,(o.h-1)*5.2,o.z))}
 else if(k==='exit')drawM(MESH.exit,T(o.x,0,o.z+1),{noInk:true});
 else if(k==='slime'){const s=o.sq,air=o.y>groundAt(o.x,o.z,o.y)+.05,sy=air?1.15:1-s*.35,sxz=air?.9:1+s*.25;const m=M4.sc(M4.ry(T(o.x,o.y,o.z),o.face),sxz,sy,sxz);
  drawM(MESH.slime,m,{mul:o.col,tint:o.wet?[.7,.9,1,.25]:undefined});const fm=M4.tr(M4.clone(m),0,.5,.5);drawM(MESH.slimeFace,o.dizzy?M4.rz(fm,Math.sin(G.clock*12)*.3):fm,{noInk:true})}}
function drawDungeonTiles(){for(const it of SC.items){if(it.c==='V'&&FLAGS.vine){const g=SC.things.find(q=>q.k==='sprout');const k=g?g.g:1;if(k>.05)drawM(MESH.vine,M4.sc(T(it.x,(k-1)*1.5,it.z),1,1,1))}
  if(it.c==='b'){const up=FLAGS.blue?1:0;it.h=lerp(it.h??up,up,.08);if(it.h>.02)drawM(MESH.tileBlue,T(it.x,(it.h-1)*3,it.z),{noInk:true})}}}
function drawBoss(){const B=BOSS;if(!B||!B.alive&&B.state!=='end')return;const st=B.state==='stun'||B.state==='getup',lie=st?(B.state==='getup'?1-ease(B.t/1.1):ease(Math.min(1,(5.5-B.stun)*3))):0,endK=B.state==='end'?sat(B.t/3):0;
 if(endK>=1)return;const s=1-endK*.8,root=M4.sc(M4.ry(M4.tr(M4.id(),B.x,B.y+(B.state==='wake'?(-3+Math.min(3,B.t*1.2)):0),B.z),B.face),s);const tint=B.flash>0?[1,1,1,B.flash*.6]:endK>0?[1,.85,.95,endK*.6]:undefined;
 const bob=Math.sin(G.clock*3)*.06,walk=B.state==='walk'?Math.sin(B.t*6):0;
 for(const sd of[-1,1])drawM(MESH.bLeg,M4.rx(M4.tr(M4.clone(root),sd*1,1.2,0),walk*.4*sd),{tint,inkW:.05});
 const body=M4.rx(M4.tr(M4.clone(root),0,2.6+bob-lie*.9,0),lie*1.25);drawM(MESH.bBody,body,{tint,inkW:.05});
 for(const sd of[-1,1]){const a=M4.rz(M4.rx(M4.tr(M4.clone(body),sd*2.2,.7,0),-B.arm*2.6+walk*.3*sd),sd*(.25+B.arm*.2));drawM(MESH.bArm,a,{tint,inkW:.05})}
 const head=M4.rx(M4.tr(M4.clone(body),0,2.1,.4),-.1+lie*.3);drawM(MESH.bHead,head,{tint,inkW:.05});drawM(MESH.bMouth,M4.sc(M4.tr(M4.clone(head),0,-.42,1.02),1,.4+B.mouth*1.4,1),{noInk:true});
 if(B.state==='stun'&&B.t<6)for(let i=0;i<3;i++){const a=G.clock*3+i*2.1;drawM(MESH.socketGlow,M4.sc(M4.tr(M4.clone(head),Math.cos(a)*1.2,1.4,Math.sin(a)*1.2),.5),{emis:1,mul:[1,1,.5],noInk:true})}
 const gem=M4.ry(M4.tr(M4.clone(head),0,1.15,.2),G.clock*1.5);drawM(MESH.gem,gem,{emis:st?.6+.4*Math.sin(G.clock*10):.15,inkW:.04});
 if(B.ring>=0){gl.enable(gl.BLEND);gl.depthMask(false);drawM(MESH.ring,M4.sc(T(B.x,.08,B.z),B.ring,1,B.ring),{emis:1,alpha:.8*(1-B.ring/16),noInk:true,mul:[1,.85,.6]});gl.depthMask(true);gl.disable(gl.BLEND)}
 for(const r of B.rocks){drawM(MESH.rock,T(r.x,r.y,r.z,r.y));gl.enable(gl.BLEND);gl.depthMask(false);drawM(MESH.shadow,M4.sc(T(r.x,.03,r.z),1.4*sat(1-r.y/22)+.3,1,1.4*sat(1-r.y/22)+.3),{emis:1,alpha:.35,noInk:true,mul:[.2,.1,.2]});gl.depthMask(true);gl.disable(gl.BLEND)}
 if(B.state==='end'&&B.t>1.5){const k=easeBack(sat((B.t-1.5)/1));drawM(MESH.mossy,T(B.x,0,B.z,B.face+Math.sin(G.clock*2)*.2,k*1.4))}}
/* ---------- the frame ---------- */
function lightsFor(){const L=[];const add=(x,y,z,r,c)=>L.push({x,y,z,r,c,d:Math.hypot(x-CAM.tx,z-CAM.tz)});
 for(const o of SC.things){if(o.dead)continue;if(o.k==='campfire'&&o.out<=0)add(o.x,o.y+1,o.z,7,[1,.6,.25]);else if(o.k==='lantern'&&o.lit>0)add(o.x,o.y+1.3,o.z,5,[1,.7,.3]);
  else if(o.k==='brazier'&&o.lit)add(o.x,1.6,o.z,9,[1,.6,.25]);else if(o.k==='wisp'&&!o.hidden)add(o.x,o.y,o.z,5,[.8,.9,.6]);else if(o.k==='curtain')add(o.x,1.2,o.z,7,[1,.5,.2]);else if(o.k==='crystal')add(o.x,1.3,o.z,5,FLAGS.blue?[.4,.55,1]:[1,.5,.25]);else if(o.k==='sconce')add(o.x,o.y,o.z,8,[1,.62,.3])}
 if(P.fire>0)add(P.x,P.y+1.4,P.z,6,[1,.6,.25]);if(BOSS&&BOSS.state==='stun')add(BOSS.x,2,BOSS.z,7,[1,.5,.8]);
 L.sort((a,b)=>a.d-b.d);return L.slice(0,NL)}
function render(dt){const E=SC?SC.env:ENV.field;gl.viewport(0,0,VW,VH);gl.clearColor(E.fogCol[0],E.fogCol[1],E.fogCol[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 if(!SC||!CAM.VP)return;
 // sky
 gl.disable(gl.DEPTH_TEST);gl.useProgram(SKY.p);gl.uniformMatrix4fv(SKY.U.uIVP,false,CAM.IVP);gl.uniform3fv(SKY.U.uSun,E.sun);gl.uniform3fv(SKY.U.uTop,E.top);gl.uniform3fv(SKY.U.uHor,E.hor);gl.uniform3fv(SKY.U.uGround,E.ground);
 gl.uniform1f(SKY.U.uTime,G.clock);gl.uniform1f(SKY.U.uCloud,E.cloud);gl.bindVertexArray(QUAD);gl.drawArrays(gl.TRIANGLES,0,3);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
 useToon();gl.uniformMatrix4fv(U.uVP,false,CAM.VP);gl.uniform3fv(U.uCam,[CAM.x,CAM.y,CAM.z]);gl.uniform1f(U.uTime,G.clock);gl.uniform3fv(U.uSun,E.sun);gl.uniform3fv(U.uSunCol,E.sunCol);gl.uniform3fv(U.uShadow,E.shadow);
 gl.uniform3fv(U.uAmb,E.amb);gl.uniform3fv(U.uFogCol,E.fogCol);gl.uniform2fv(U.uFog,E.fog);gl.uniform3fv(U.uInk,E.ink);gl.uniform1f(U.uLK,E.lk||1);gl.uniform1f(U.uOutline,0);
 const L=lightsFor();gl.uniform1i(U.uNL,L.length);if(L.length){const a=new Float32Array(NL*4),c=new Float32Array(NL*3);L.forEach((l,i)=>{a.set([l.x,l.y,l.z,l.r],i*4);c.set(l.c,i*3)});gl.uniform4fv(U.uL,a);gl.uniform3fv(U.uLC,c)}
 gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);const ID=M4.id(),fx=CAM.fx,fz=CAM.fz;
 const vis=(x,z,r)=>{const dx=x-CAM.x,dz=z-CAM.z,d=Math.hypot(dx,dz);return d<r+40||(d<E.fog[1]+r&&(dx*fx+dz*fz)/d>-.25)};
 for(const c of SC.chunks)if(vis(c.x,c.z,25))drawM(c.m,ID,{noInk:true,nm:IDN});
 if(SC.props)drawM(SC.props,ID,{nm:IDN,sway:.06,inkW:.03});
 if(SC.id==='dungeon')drawDungeonTiles();
 for(const o of SC.things)if(!o.dead&&Math.hypot(o.x-CAM.x,o.z-CAM.z)<110)drawThing(o,dt);
 drawBoss();if(G.state!=='title')drawOrka();
 // grass: both sides, swaying
 gl.disable(gl.CULL_FACE);for(const g of SC.grass)if(Math.hypot(g.x-CAM.x,g.z-CAM.z)<75&&vis(g.x,g.z,20))drawM(g.m,ID,{noInk:true,nm:IDN,sway:.18});gl.enable(gl.CULL_FACE);
 // see-through: shadows, water, glows, particles
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
 const blob=(x,z,y,r)=>{const g=groundAt(x,z,y+.2);if(g<-5)return;const k=sat(1-(y-g)/8);drawM(MESH.shadow,M4.sc(T(x,g+.04,z),r*(.5+.5*k),1,r*(.5+.5*k)),{emis:1,alpha:.22*k+.05,noInk:true,mul:[.25,.15,.35],nm:IDN})};
 if(G.state!=='title')blob(P.x,P.z,P.y,.55);for(const o of SC.things)if(o.k==='slime'&&!o.dead)blob(o.x,o.z,o.y,.6);else if(o.k==='cat'||o.k==='npc')blob(o.x,o.z,o.y,o.k==='cat'?.5:.8);if(BOSS&&BOSS.alive)blob(BOSS.x,BOSS.z,0,2.6);
 if(SC.water){gl.useProgram(WATER.p);gl.uniformMatrix4fv(WATER.U.uVP,false,CAM.VP);gl.uniform1f(WATER.U.uTime,G.clock);gl.uniform3fv(WATER.U.uCam,[CAM.x,CAM.y,CAM.z]);gl.uniform3fv(WATER.U.uFogCol,E.fogCol);gl.uniform2fv(WATER.U.uFog,E.fog);
  gl.uniform3fv(WATER.U.uDeep,E.deep);gl.uniform3fv(WATER.U.uShal,E.shal);gl.bindVertexArray(SC.water.vao);gl.drawArrays(gl.TRIANGLES,0,SC.water.n)}
 drawParticles();gl.depthMask(true);gl.disable(gl.BLEND)}
// butterflies drift over the meadow near Orka: two flapping wing dots each
const BFLY=Array.from({length:16},(_,i)=>({ph:i*1.7,c:[[1,.7,.85],[1,.9,.45],[.75,.8,1],[1,1,1]][i%4],ox:(hash2(i,3)-.5)*26,oz:(hash2(i,9)-.5)*26}));
function drawParticles(){const list=[];if(SC.id==='field')for(const b of BFLY){const t=G.clock*.35+b.ph,x=P.x+b.ox+Math.sin(t*1.3)*4,z=P.z+b.oz+Math.cos(t)*4,g=SC.groundH(x,z);if(g<.5)continue;const y=g+1+Math.sin(t*3)*.4,f=Math.abs(Math.sin(G.clock*14+b.ph))*.12,a=Math.atan2(Math.cos(t*1.3),-Math.sin(t))+Math.PI/2;
  list.push(x+Math.cos(a)*f,y,z+Math.sin(a)*f,.16,1,2,b.c[0],b.c[1],b.c[2],0,x-Math.cos(a)*f,y,z-Math.sin(a)*f,.16,1,2,b.c[0],b.c[1],b.c[2],0)}for(const p of PT){const k=p.t/p.life,a=p.fade?1-k*k:1,s=p.size*(1+p.grow*k);list.push(p.x,p.y,p.z,s*2,a,p.k,p.col[0],p.col[1],p.col[2],0)}
 for(const d of DROPS)list.push(d.x,d.y,d.z,.32,.9,0,.62,.88,1,0,d.x-d.vx*.02,d.y-d.vy*.02,d.z-d.vz*.02,.24,.6,0,.8,.95,1,0);
 if(!list.length)return;const data=new Float32Array(list);gl.useProgram(PART.p);gl.uniformMatrix4fv(PART.U.uVP,false,CAM.VP);gl.uniform1f(PART.U.uScale,VH*.9);
 gl.bindVertexArray(DYN.vao);gl.bindBuffer(gl.ARRAY_BUFFER,DYN.buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);gl.drawArrays(gl.POINTS,0,data.length/10)}
