/* ================= sound: soft synth effects and three little songs ================= */
const AU={ctx:null,master:null,mus:null,sfx:null,muted:false,noise:null,verb:null};
function audioInit(){if(AU.ctx)return;try{const a=new (window.AudioContext||window.webkitAudioContext)();AU.ctx=a;AU.master=a.createGain();AU.master.gain.value=AU.muted?0:.8;AU.master.connect(a.destination);
 AU.sfx=a.createGain();AU.sfx.gain.value=.9;AU.sfx.connect(AU.master);AU.mus=a.createGain();AU.mus.gain.value=.42;AU.mus.connect(AU.master);
 // a short feedback echo gives the songs a cozy room
 const d=a.createDelay(1),fb=a.createGain(),wet=a.createGain();d.delayTime.value=.27;fb.gain.value=.32;wet.gain.value=.3;d.connect(fb);fb.connect(d);d.connect(wet);wet.connect(AU.master);AU.verb=d;
 const n=a.createBuffer(1,a.sampleRate,a.sampleRate),c=n.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1;AU.noise=n}catch(e){}}
function setMuted(m){AU.muted=m;if(AU.master)AU.master.gain.value=m?0:.8}
function tone(f,dur,type='triangle',vol=.15,slide=1,delay=0,bus,echo=0){const a=AU.ctx;if(!a)return;try{const t=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
 if(slide!==1)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
 o.connect(g);g.connect(bus||AU.sfx);if(echo&&AU.verb){const e=a.createGain();e.gain.value=echo;g.connect(e);e.connect(AU.verb)}o.start(t);o.stop(t+dur+.05)}catch(e){}}
function noise(dur,vol=.2,freq=1500,q=.8,delay=0,type='bandpass',slide=1){const a=AU.ctx;if(!a||!AU.noise)return;try{const t=a.currentTime+delay,s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=AU.noise;
 f.type=type;f.frequency.setValueAtTime(freq,t);if(slide!==1)f.frequency.exponentialRampToValueAtTime(freq*slide,t+dur);f.Q.value=q;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
 s.connect(f);f.connect(g);g.connect(AU.sfx);s.start(t,Math.random()*.5);s.stop(t+dur+.05)}catch(e){}}
const SFXT={};const once=(k,ms)=>{const n=performance.now();if(n-(SFXT[k]||0)<ms)return false;SFXT[k]=n;return true};
const N2F=n=>440*Math.pow(2,(n-69)/12);
const SFX={
 step(){if(once('step',150))noise(.05,.05,900,1.2)},
 jump(){tone(520,.14,'square',.05,1.8);tone(780,.1,'triangle',.05,1.5,.03)},
 land(){noise(.08,.08,500,1)},
 swing(){noise(.12,.12,2400,1.5,0,'bandpass',.4)},
 whack(){tone(180,.08,'square',.08,.6);noise(.06,.14,1200,2)},
 squish(){tone(300,.18,'sine',.14,.35);tone(600,.1,'triangle',.06,.5,.04)},
 pop(){tone(880,.08,'sine',.12,2);tone(1320,.12,'triangle',.08,1,.05);noise(.1,.08,3000,1)},
 hurt(){tone(400,.16,'square',.07,.5);tone(300,.2,'triangle',.08,.6,.05)},
 squirt(){if(once('sq',70))noise(.09,.07,3800,2.5,0,'bandpass',.7)},
 splash(){noise(.25,.12,1600,.7,0,'bandpass',.5);tone(700,.08,'sine',.04,.6)},
 bloom(){[784,988,1175,1568].forEach((f,i)=>tone(f,.25,'sine',.07,1,i*.06,null,.5))},
 puff(){noise(.5,.12,500,.6,0,'lowpass',.5);tone(160,.4,'sine',.06,.7)},
 grow(){[392,523,659,784,1047].forEach((f,i)=>tone(f,.18,'triangle',.06,1.02,i*.07,null,.4))},
 glide(){if(once('gl',400))noise(.5,.05,1200,.4,0,'bandpass',.6)},
 coin(){tone(1319,.07,'square',.05);tone(1976,.16,'square',.05,1,.06)},
 heal(){[660,880,1100].forEach((f,i)=>tone(f,.2,'sine',.08,1,i*.08,null,.4))},
 fire(){noise(.35,.12,900,.5,0,'lowpass',2)},
 hiss(){noise(.4,.14,4000,.8,0,'highpass',.5)},
 click(){tone(1200,.04,'square',.04)},
 tick(){tone(1600,.03,'square',.025)},
 talk(){if(once('talk',55))tone(500+Math.random()*300,.05,'square',.025)},
 door(){noise(1.2,.12,200,.6,0,'lowpass',.5);tone(80,1.1,'sine',.1,.8)},
 switch(){tone(880,.1,'square',.06);tone(1320,.14,'square',.05,1,.08)},
 solved(){[523,659,784,1047,0,988,1319].forEach((f,i)=>f&&tone(f,i===6?.5:.14,'triangle',.08,1,i*.11,null,.45))},
 chest(){[392,494,587,784,988].forEach((f,i)=>tone(f,.2,'square',.05,1,i*.09,null,.3));tone(1568,.6,'triangle',.07,1,.5,null,.5)},
 wisp(){[1047,1319,1568,2093,1568,2093,2637].forEach((f,i)=>tone(f,.3,'sine',.06,1,i*.08,null,.6))},
 roar(){noise(1,.25,300,.5,0,'lowpass',.4);tone(90,.9,'sawtooth',.06,.6)},
 stomp(){noise(.5,.3,180,.8,0,'lowpass',.6);tone(55,.5,'sine',.25,.6)},
 bosshit(){tone(220,.2,'square',.1,.5);noise(.2,.2,2000,1);tone(1320,.3,'triangle',.06,1,.05)},
 cough(){for(let i=0;i<3;i++)noise(.12,.15,700,1.5,i*.16)},
 victory(){[523,659,784,1047,784,1047,1319,1568].forEach((f,i)=>tone(f,i===7?.9:.16,'triangle',.09,1,i*.13,null,.5))},
 deny(){if(once('deny',150)){tone(200,.12,'square',.05);tone(150,.14,'square',.05,1,.07)}},
 meow(){tone(700,.3,'sine',.08,1.4);tone(980,.25,'sine',.06,.7,.12)}};
/* ---------- songs: a lead, a soft bass and a plucked chord, scheduled a little ahead ---------- */
const SONGS={
 field:{bpm:96,lead:'72 . 74 76 . 79 . 76 74 . 72 . 69 . . . 72 . 74 76 . 79 . 81 79 . 76 . 74 . . . 77 . 76 74 . 72 . 74 76 . 72 . 69 . 67 . 69 . 72 . 74 . 76 . 74 . 72 . . . . .',bass:'53 60 57 60 48 55 52 55 50 57 53 57 55 62 59 62',ch:[[65,69,72],[60,64,67],[62,65,69],[67,71,74]],w:'triangle'},
 dungeon:{bpm:76,lead:'69 . . 72 71 . 69 . 64 . . . 67 . 65 . 64 . . 65 67 . 69 . 71 . . . 72 . 71 . 69 . . 72 76 . 74 . 72 . . 71 69 . . . 68 . 69 . 71 . 72 . 71 . . . . . . .',bass:'45 52 48 52 41 48 45 48 43 50 47 50 40 47 44 47',ch:[[57,60,64],[53,57,60],[55,59,62],[52,56,59]],w:'sine'},
 boss:{bpm:138,lead:'64 64 67 64 69 . 67 64 62 62 65 62 67 . 65 62 64 64 67 64 72 . 71 69 67 . 69 . 71 . 72 .',bass:'40 40 47 40 38 38 45 38 36 36 43 36 35 35 42 35',ch:[[52,55,59],[50,53,57],[48,52,55],[47,50,54]],w:'square'},
 title:{bpm:84,lead:'76 . 79 . 84 . 83 81 79 . 76 . 77 . 79 . 81 . 79 77 76 . 74 . 72 . . . 74 . 76 . 77 . 76 74 72 . 69 . 71 . 72 . 74 . 72 . . . . . . .',bass:'48 55 52 55 53 60 57 60 50 57 53 57 55 62 59 62',ch:[[60,64,67],[65,69,72],[62,65,69],[67,71,74]],w:'triangle'}};
const MUS={song:null,step:0,next:0,on:true,fade:1};
function playSong(k){if(MUS.song===SONGS[k])return;MUS.song=SONGS[k]||null;MUS.step=0;if(AU.ctx)MUS.next=AU.ctx.currentTime+.1}
function musicTick(){const a=AU.ctx,S=MUS.song;if(!a||!S||AU.muted)return;const dt=60/S.bpm/2,L=S.lead.split(' '),B=S.bass.split(' ').map(Number);if(MUS.next<a.currentTime-.3)MUS.next=a.currentTime+.05;
 while(MUS.next<a.currentTime+.25){const i=MUS.step,d=MUS.next-a.currentTime,n=L[i%L.length];
  if(n!=='.'){const f=N2F(+n);tone(f,dt*1.8,S.w,S.w==='square'?.03:.06,1,d,AU.mus,.35)}
  if(i%2===0){const b=B[(i>>1)%B.length];tone(N2F(b-12),dt*1.9,'sine',.12,1,d,AU.mus)}
  if(i%8===4){const c=S.ch[(i>>4)%S.ch.length];c.forEach((m,k)=>tone(N2F(m),dt*3,'sine',.025,1,d+k*.02,AU.mus,.3))}
  MUS.step++;MUS.next+=dt}}
