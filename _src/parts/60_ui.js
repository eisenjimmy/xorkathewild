/* ================= the screen on top: hearts, water, talk bubbles, menus ================= */
let UZ=[];// clickable zones this frame
const uz=(x,y,w,h,fn,key)=>UZ.push({x,y,w,h,fn,key});
function toast(s,t=3.2){G.toast={s,t:0,life:t}}
function banner(a,b){G.banner={a,b,t:0,life:3}}
function itemGet(a,b){G.item={a,b,t:0,life:3.6};SFX.chest()}
function say(name,lines,after){G.dlg={name,lines:lines.map(l=>wrapText(l,40)),i:0,c:0,after};G.state='talk'}
function dlgAdvance(){const D=G.dlg;if(!D)return;const L=D.lines[D.i].join(' ').length;if(D.c<L){D.c=L;return}D.i++;D.c=0;SFX.click();if(D.i>=D.lines.length){G.dlg=null;G.state='play';if(D.after)D.after()}}
function button(x,y,w,h,label,fn,o={}){const hov=G.mx>=x&&G.mx<=x+w&&G.my>=y&&G.my<=y+h,sel=o.sel||hov;const r=h*.42;
 panel(x,y,w,h,r,sel?'#ffe9a8':'#fff8ec',sel?'#e8884a':'#5a4a6a',Math.max(2,h*.07));text(label,x+w/2,y+h/2-h*.17,h*.055*5/5*1.1,sel?'#c8502a':'#4a3a5a','center',null,1.35);uz(x,y,w,h,fn);return hov}
function drawUI(dt){ui.setTransform(1,0,0,1,0,0);ui.clearRect(0,0,VW,VH);UZ=[];const u=VH/360,W=VW,Hh=VH;G.u=u;
 if(G.state==='title'){drawTitle(u);drawFade(dt);return}
 if(G.state==='play'||G.state==='talk'||G.state==='pause'||G.state==='dead')drawHUD(u,dt);
 if(G.state==='talk')drawDialog(u,dt);
 drawPopups(u,dt);
 if(G.state==='pause')drawPause(u);if(G.state==='dead')drawDead(u,dt);if(G.state==='end')drawEnd(u,dt);
 if(G.confirm)drawConfirm(u);
 if(TOUCH.on&&(G.state==='play'))drawTouch(u);
 drawFade(dt)}
/* ---------- the hud ---------- */
function drawHUD(u,dt){const x0=16*u,y0=14*u,hs=15*u;G.heartBump=Math.max(0,(G.heartBump||0)-dt*3);
 for(let i=0;i<P.maxHp/2;i++){const f=P.hp-i*2;heart(x0+hs/2+i*hs*1.15,y0,hs,f>=2?1:f>=1?.5:0,f>0&&f<=2&&P.hp<=2?Math.abs(Math.sin(G.clock*6))*.4:G.heartBump)}
 // the water tank
 const wy=y0+hs*1.25,ww=70*u,wh=9*u;panel(x0,wy,ww+18*u,wh+6*u,(wh+6*u)/2,'#fff8ec','#5a4a6a',2*u);
 ui.fillStyle='#4ab8f0';ui.beginPath();ui.moveTo(x0+8*u,wy+2.5*u);ui.quadraticCurveTo(x0+12.5*u,wy+8*u,x0+8*u,wy+12.5*u);ui.quadraticCurveTo(x0+3.5*u,wy+8*u,x0+8*u,wy+2.5*u);ui.fill();
 rrect(x0+15*u,wy+3*u,ww,wh,wh/2);ui.fillStyle='#dbeef8';ui.fill();if(P.water>.5){rrect(x0+15*u,wy+3*u,Math.max(wh,ww*P.water/100),wh,wh/2);ui.fillStyle=P.water<15&&Math.floor(G.clock*4)%2?'#ff8a8a':'#5ac8f4';ui.fill()}
 // wisps and key
 for(let i=0;i<3;i++){const cx=VW-20*u-i*16*u,cy=y0+6*u,have=FLAGS['wisp'+(2-i)];ui.beginPath();ui.arc(cx,cy,6*u,0,TAU);ui.fillStyle=have?'#fff6b0':'rgba(255,255,255,.35)';ui.fill();ui.lineWidth=2*u;ui.strokeStyle='#5a4a6a';ui.stroke();
  if(have){ui.beginPath();ui.arc(cx,cy,9*u+Math.sin(G.clock*3+i)*u,0,TAU);ui.strokeStyle='rgba(255,240,150,.5)';ui.stroke()}}
 if(FLAGS.key&&!FLAGS.bossDone){const cx=VW-70*u,cy=y0+6*u;ui.fillStyle='#ffcf4a';ui.strokeStyle='#5a4a6a';ui.lineWidth=2*u;ui.beginPath();ui.arc(cx-4*u,cy,4.5*u,0,TAU);ui.fill();ui.stroke();ui.fillRect(cx,cy-1.5*u,10*u,3*u);ui.strokeRect(cx,cy-1.5*u,10*u,3*u)}
 if(P.fire>0){const cx=x0+ww+30*u,cy=wy+6*u;ui.fillStyle='#ff8a2a';ui.beginPath();ui.arc(cx,cy,5*u*(1+Math.sin(G.clock*20)*.1),0,TAU);ui.fill();text(Math.ceil(P.fire)+'S',cx+8*u,cy-3.5*u,u,'#ff8a2a','left','#fff8ec')}
 // stamina wheel by Orka
 if(P.st<99.5&&G.state==='play'){const s=toScreen(P.x,P.y+1.6,P.z);if(s){const cx=s[0]+34*u,cy=s[1]-10*u,r=9*u;ui.lineWidth=4.5*u;ui.beginPath();ui.arc(cx,cy,r,0,TAU);ui.strokeStyle='rgba(40,30,60,.35)';ui.stroke();
  ui.beginPath();ui.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+TAU*P.st/100);ui.strokeStyle=P.stLock?(Math.floor(G.clock*6)%2?'#ff6a5a':'#ffb0a0'):'#6ee07a';ui.stroke()}}
 // what E would do here
 if(G.state==='play'&&!G.cut){const p=promptTarget();G.prompt=p;if(p){const s=toScreen(p.o.x,p.o.y+(p.o.k==='npc'?2.6:p.o.k==='door'?6.6:1.8),p.o.z);if(s){const lbl=(TOUCH.on?'':'E  ')+p.s,w=textW(lbl,1.6*u)+18*u,h=20*u;
  panel(s[0]-w/2,s[1]-h-Math.sin(G.clock*4)*2*u,w,h,h/2,'#fff8ec','#5a4a6a',2*u);text(lbl,s[0],s[1]-h+5*u-Math.sin(G.clock*4)*2*u,1.6*u,'#4a3a5a','center',null);if(TOUCH.on)uz(s[0]-w/2,s[1]-h-4*u,w,h+8*u,()=>{IN.actP=true})}}}
 // aim reticle
 if(P.aim&&G.state==='play'){const cx=VW/2,cy=VH/2,r=7*u;ui.lineWidth=2.5*u;ui.strokeStyle='rgba(255,255,255,.9)';ui.beginPath();ui.arc(cx,cy,r,0,TAU);ui.stroke();ui.fillStyle='#5ac8f4';ui.beginPath();ui.arc(cx,cy,2.2*u,0,TAU);ui.fill()}
 if(G.saved>0){G.saved-=dt;ui.globalAlpha=sat(G.saved);const cx=VW-24*u,cy=VH-24*u;ui.fillStyle='#fff8ec';ui.beginPath();ui.arc(cx,cy,8*u,0,TAU);ui.fill();ui.strokeStyle='#5a4a6a';ui.lineWidth=2*u;ui.stroke();
  star(cx,cy,5*u,'#ffcf4a',G.clock*3);ui.globalAlpha=1}
 // a gentle reminder of the controls for the first minute
 if(G.time<70&&G.state==='play'&&!TOUCH.on&&!G.cut){const a=sat((70-G.time)/6)*sat(G.time-4);ui.globalAlpha=a;const lines=['WASD MOVE   MOUSE LOOK   SPACE JUMP / GLIDE   SHIFT RUN','CLICK STICK   RIGHT-CLICK (HOLD) WATER   E TALK   ESC PAUSE'];
  lines.forEach((l,i)=>text(l,VW/2,VH-34*u+i*13*u,1.3*u,'#fff','center','#3a2a4a'));ui.globalAlpha=1}}
function promptTarget(){let best=null,bd=9;for(const o of SC.things){if(o.dead||!KIND[o.k].act)continue;const pr=KIND[o.k].prompt?KIND[o.k].prompt(o):(near(o,2.2)?'USE':null);if(!pr)continue;const d=Math.hypot(o.x-P.x,o.z-P.z);if(d<bd){bd=d;best={o,s:pr}}}return best}
/* ---------- dialog ---------- */
function drawDialog(u,dt){const D=G.dlg;if(!D)return;const lines=D.lines[D.i],full=lines.join(' ').length;if(D.c<full){D.c=Math.min(full,D.c+dt*46);SFX.talk()}
 const w=Math.min(VW-40*u,330*u),h=74*u,x=(VW-w)/2,y=VH-h-18*u;panel(x,y,w,h,16*u,'#fff8ec','#5a4a6a',3*u);
 const nw=textW(D.name,1.5*u)+20*u;panel(x+16*u,y-12*u,nw,20*u,10*u,'#ffd86a','#5a4a6a',2.5*u);text(D.name,x+16*u+nw/2,y-6.5*u,1.5*u,'#5a3a2a','center',null,1.3);
 let left=Math.floor(D.c);lines.forEach((l,i)=>{const s=l.slice(0,Math.max(0,left));left-=l.length+1;if(s)text(s,x+18*u,y+16*u+i*14*u,1.55*u,'#4a3a5a','left',null,1.3)});
 if(D.c>=full){const bx=x+w-20*u,by=y+h-14*u+Math.sin(G.clock*6)*2*u;ui.fillStyle='#e8884a';ui.beginPath();ui.moveTo(bx-5*u,by-3*u);ui.lineTo(bx+5*u,by-3*u);ui.lineTo(bx,by+3*u);ui.closePath();ui.fill()}
 uz(0,0,VW,VH,()=>dlgAdvance())}
/* ---------- popups: toasts, banners, item get ---------- */
function drawPopups(u,dt){const T2=G.toast;if(T2){T2.t+=dt;if(T2.t>T2.life)G.toast=null;else{const a=sat(T2.t/.2)*sat((T2.life-T2.t)/.4),dy=(1-easeBack(sat(T2.t/.3)))*-20*u;ui.globalAlpha=a;
  const lines=wrapText(T2.s,46),w=Math.max(...lines.map(l=>textW(l,1.5*u)))+28*u,h=lines.length*14*u+12*u,x=(VW-w)/2,y=46*u+dy;panel(x,y,w,h,12*u,'#fff8ec','#5a4a6a',2.5*u);
  lines.forEach((l,i)=>text(l,VW/2,y+8*u+i*14*u,1.5*u,'#4a3a5a','center',null,1.3));ui.globalAlpha=1}}
 const B=G.banner;if(B){B.t+=dt;if(B.t>B.life)G.banner=null;else{const a=sat(B.t/.4)*sat((B.life-B.t)/.6);ui.globalAlpha=a;const y=VH*.28;
  text(B.a,VW/2,y,3.4*u,'#fff8ec','center','#5a4a6a',1.4);text(B.b,VW/2,y+34*u,1.6*u,'#fff','center','#5a4a6a');ui.globalAlpha=1}}
 const I=G.item;if(I){I.t+=dt;if(I.t>I.life)G.item=null;else{const a=sat(I.t/.25)*sat((I.life-I.t)/.5),k=easeBack(sat(I.t/.4));ui.globalAlpha=a;const w=Math.max(textW(I.a,2.6*u),textW(I.b,1.4*u))+50*u,h=62*u,x=(VW-w)/2,y=VH*.22;
  ui.save();ui.translate(VW/2,y+h/2);ui.scale(k,k);ui.translate(-VW/2,-(y+h/2));
  for(let i=0;i<8;i++){const ang=G.clock*.8+i*TAU/8;star(VW/2+Math.cos(ang)*(w*.55),y+h/2+Math.sin(ang)*h*.75,4*u,'#ffe070',ang)}
  panel(x,y,w,h,18*u,'#fffbe8','#e8884a',3*u);text(I.a,VW/2,y+12*u,2.6*u,'#e8884a','center','#fff3d0',1.4);text(I.b,VW/2,y+40*u,1.4*u,'#5a4a6a','center',null);ui.restore();ui.globalAlpha=1}}}
/* ---------- menus ---------- */
function drawTitle(u){const t=G.clock;G.menuSel=G.menuSel||0;
 // the logo: big round letters that bob, one at a time
 const word='XORKA',tw=textW(word,7*u),x0=VW/2-tw/2,y0=VH*.17;const cols=['#ff8a5a','#ffcf4a','#6ee07a','#5ac8f4','#c88aff'];
 for(let i=0;i<word.length;i++){const bob=Math.sin(t*2.2+i*.7)*4*u;text(word[i],x0+i*6*7*u,y0+bob,7*u,cols[i],'left','#4a3a5a',1.5)}
 text('THE WILD',VW/2,y0+60*u,2.6*u,'#fff8ec','center','#4a3a5a',1.4);
 for(let i=0;i<3;i++){const a=t*1.2+i*2.1;star(VW/2+Math.cos(a)*tw*.62,y0+28*u+Math.sin(a*1.3)*20*u,5*u,'#fff4a0',a)}
 const has=!!G.saveInfo,items=[];if(has)items.push(['CONTINUE',()=>{audioInit();SFX.click();fadeTo(()=>continueGame())}]);items.push(['NEW GAME',()=>{audioInit();SFX.click();if(has)G.confirm={q:'START A NEW ADVENTURE?',sub:'YOUR SAVED GAME WILL BE REPLACED.',yes:()=>fadeTo(()=>newGame())};else fadeTo(()=>newGame())}]);
 G.menuItems=items;G.menuSel=clamp(G.menuSel,0,items.length-1);const bw=150*u,bh=30*u;items.forEach(([l,fn],i)=>button(VW/2-bw/2,VH*.56+i*(bh+12*u),bw,bh,l,fn,{sel:G.menuSel===i&&!G.confirm&&G.kbMenu}));
 if(has){const s=G.saveInfo;text(('SAVED: '+(s.flags.bossDone?'ADVENTURE COMPLETE':(['NO','ONE','TWO','THREE'][(s.flags.wisp0?1:0)+(s.flags.wisp1?1:0)+(s.flags.wisp2?1:0)]+' WISPS'))+'  '+fmtTime(s.time||0)),VW/2,VH*.56-16*u,1.3*u,'#fff','center','#4a3a5a')}
 text(TOUCH.on?'TOUCH TO PLAY':'MOUSE + KEYBOARD  OR  GAMEPAD',VW/2,VH-30*u,1.3*u,'#fff','center','#4a3a5a');text('A COZY LITTLE ADVENTURE BY JIMMY PARK',VW/2,VH-16*u,1.1*u,'#fffbe8','center','#4a3a5a');
 const mu=AU.muted;button(VW-48*u,12*u,36*u,20*u,mu?'OFF':'SND',()=>{audioInit();setMuted(!AU.muted)});if(G.confirm)drawConfirm(u)}
function drawConfirm(u){const C2=G.confirm;ui.fillStyle='rgba(40,30,60,.45)';ui.fillRect(0,0,VW,VH);const w=240*u,h=110*u,x=(VW-w)/2,y=(VH-h)/2;UZ=[];uz(0,0,VW,VH,()=>{});
 panel(x,y,w,h,18*u,'#fff8ec','#5a4a6a',3*u);text(C2.q,VW/2,y+18*u,1.7*u,'#4a3a5a','center',null,1.35);text(C2.sub,VW/2,y+40*u,1.25*u,'#8a7a8a','center',null);
 button(x+16*u,y+h-40*u,(w-44*u)/2,26*u,'YES',()=>{const f=C2.yes;G.confirm=null;SFX.click();f()},{sel:G.confSel===0});button(x+28*u+(w-44*u)/2,y+h-40*u,(w-44*u)/2,26*u,'NO',()=>{G.confirm=null;SFX.click()},{sel:G.confSel===1})}
function drawPause(u){ui.fillStyle='rgba(40,30,60,.4)';ui.fillRect(0,0,VW,VH);const w=200*u,h=200*u,x=(VW-w)/2,y=(VH-h)/2;uz(0,0,VW,VH,()=>{});panel(x,y,w,h,20*u,'#fff8ec','#5a4a6a',3*u);
 text('PAUSED',VW/2,y+14*u,2.6*u,'#e8884a','center','#fff3d0',1.4);const items=[['RESUME',()=>{G.state='play';SFX.click()}],['CONTROLS',()=>{G.showCtl=!G.showCtl;SFX.click()}],[AU.muted?'SOUND: OFF':'SOUND: ON',()=>{setMuted(!AU.muted);SFX.click()}],['SAVE AND QUIT',()=>{G.confirm={q:'SAVE AND QUIT?',sub:'YOU WILL CONTINUE FROM YOUR LAST CHECKPOINT.',yes:()=>{save();toTitle()}}}]];
 G.menuItems=items;G.menuSel=clamp(G.menuSel||0,0,items.length-1);items.forEach(([l,fn],i)=>button(x+20*u,y+48*u+i*36*u,w-40*u,28*u,l,fn,{sel:G.menuSel===i&&G.kbMenu&&!G.confirm}));
 text('TIME '+fmtTime(G.time)+'   FLOWERS '+G.stats.bloom,VW/2,y+h+10*u,1.2*u,'#fff','center','#4a3a5a');
 if(G.showCtl){const L=['MOVE: WASD / LEFT STICK','LOOK: MOUSE / RIGHT STICK','JUMP, THEN JUMP IN THE AIR: GLIDE','SHIFT: RUN   E: TALK, OPEN, USE','CLICK / X: SWING THE STICK','RIGHT-CLICK / RT (HOLD): WATER GUN','STAND IN WATER TO REFILL THE TANK'];
  const cw=260*u,ch=L.length*14*u+20*u,cx=(VW-cw)/2,cy=y+h+24*u;panel(cx,cy,cw,ch,14*u,'#fff8ec','#5a4a6a',2.5*u);L.forEach((l,i)=>text(l,VW/2,cy+10*u+i*14*u,1.25*u,'#4a3a5a','center',null))}}
function drawDead(u,dt){G.deadT+=dt;const a=sat(G.deadT/.8);ui.fillStyle='rgba(60,40,80,'+(a*.55)+')';ui.fillRect(0,0,VW,VH);if(G.deadT<.8)return;
 text('OH NO!',VW/2,VH*.3,4*u,'#ffb0c0','center','#4a3a5a',1.5);text('ORKA NEEDS A LITTLE NAP.',VW/2,VH*.3+44*u,1.6*u,'#fff','center','#4a3a5a');uz(0,0,VW,VH,()=>{});
 const items=[['TRY AGAIN',()=>{SFX.click();fadeTo(()=>continueGame())}],['TO TITLE',()=>{SFX.click();toTitle()}]];G.menuItems=items;G.menuSel=clamp(G.menuSel||0,0,1);
 items.forEach(([l,fn],i)=>button(VW/2-75*u,VH*.55+i*40*u,150*u,30*u,l,fn,{sel:G.menuSel===i&&G.kbMenu}))}
function drawEnd(u,dt){G.endT+=dt;const a=sat(G.endT/1.5);ui.fillStyle='rgba(255,240,220,'+(a*.82)+')';ui.fillRect(0,0,VW,VH);uz(0,0,VW,VH,()=>{if(G.endT>4)toTitle()});
 const y=VH*.16;for(let i=0;i<14;i++){const s=G.endT*.15+i*.37;ui.globalAlpha=a*.7;star((i*97%VW+Math.sin(s*3)*30*u)%VW,(VH*(s%1)),5*u,['#ffb0c0','#ffe070','#9ae070','#8ad8ff'][i%4],s);ui.globalAlpha=1}
 if(G.endT<1)return;text('THE END',VW/2,y,4.4*u,'#ff8a5a','center','#4a3a5a',1.5);const S=G.stats;
 const L=['THE VALE IS BLOOMING AGAIN, AND MOSSMAW SNORES HAPPILY.','','TIME  '+fmtTime(G.time),'FLOWERS BLOOMED  '+S.bloom,'SLIMES CALMED  '+S.slimes,'MOCHI PETS  '+(S.pets||0),'HEARTS  '+P.maxHp/2,'','THANK YOU FOR PLAYING XORKA THE WILD!'];
 L.forEach((l,i)=>{const k=sat((G.endT-1.3-i*.25)/.5);ui.globalAlpha=k;text(l,VW/2,y+56*u+i*15*u,1.5*u,'#5a4a6a','center',null,1.3);ui.globalAlpha=1});
 if(G.endT>4)text(TOUCH.on?'TAP TO RETURN TO THE TITLE':'PRESS ANY BUTTON',VW/2,VH-30*u,1.3*u,'#8a7a8a','center',null)}
function drawFade(dt){const F=G.fade;if(!F)return;F.t+=dt;let a;if(F.t<.45)a=F.t/.45;else{if(!F.done){F.done=true;F.fn()}a=1-(F.t-.45)/.45}if(F.t>.9){G.fade=null;return}ui.fillStyle='rgba(255,248,236,'+sat(a)+')';ui.fillRect(0,0,VW,VH)}
const fmtTime=s=>{s=Math.floor(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
/* ---------- touch controls ---------- */
const TOUCH={on:false,stick:null,cam:null,btns:[],held:{}};
function touchLayout(u){const r=26*u,bx=VW-46*u,by=VH-50*u;return[{k:'jump',x:bx,y:by,r:r*1.15,l:'JUMP'},{k:'stick',x:bx-64*u,y:by+6*u,r,l:'STICK'},{k:'water',x:bx-20*u,y:by-62*u,r,l:'WATER'},{k:'act',x:bx-84*u,y:by-56*u,r:r*.85,l:'USE'},{k:'sprint',x:bx-130*u,y:by+14*u,r:r*.75,l:'RUN'}]}
function drawTouch(u){TOUCH.btns=touchLayout(u);ui.globalAlpha=.85;for(const b of TOUCH.btns){ui.beginPath();ui.arc(b.x,b.y,b.r,0,TAU);ui.fillStyle=TOUCH.held[b.k]?'#ffe9a8':'rgba(255,248,236,.75)';ui.fill();ui.lineWidth=2.5*u;ui.strokeStyle='#5a4a6a';ui.stroke();text(b.l,b.x,b.y-4*u,1.25*u,'#4a3a5a','center',null)}
 const S2=TOUCH.stick;if(S2){ui.beginPath();ui.arc(S2.ox,S2.oy,40*u,0,TAU);ui.fillStyle='rgba(255,248,236,.3)';ui.fill();ui.strokeStyle='rgba(90,74,106,.6)';ui.stroke();ui.beginPath();ui.arc(S2.x,S2.y,18*u,0,TAU);ui.fillStyle='rgba(255,248,236,.85)';ui.fill();ui.stroke()}
 else text('DRAG HERE TO MOVE',70*u,VH-30*u,1.1*u,'rgba(255,255,255,.8)','center','#4a3a5a');ui.globalAlpha=1;
 button(VW-36*u,10*u,26*u,22*u,'II',()=>{G.state='pause';G.menuSel=0})}
