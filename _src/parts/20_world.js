/* ================= the world: Puffwood Vale (a heightfield island) and the Mossy Shrine (a tile dungeon) ================= */
const C={grass:hex('#7fd05c'),grassL:hex('#b2e070'),grassD:hex('#55a948'),sand:hex('#f3e0a2'),rock:hex('#b0a89c'),rockD:hex('#8a8378'),dirt:hex('#dcae6e'),stone:hex('#cfc8b8'),
 bark:hex('#8a5a3c'),leaf:hex('#5cbf4e'),leafL:hex('#8ad65a'),leafD:hex('#3f9a46'),pink:hex('#ff8fb8'),yellow:hex('#ffd85a'),white:hex('#fffaf0'),red:hex('#ff5a5a'),
 roof:hex('#e8664e'),roofB:hex('#5a9ae0'),wall:hex('#fff1d6'),wood:hex('#c8884e'),woodD:hex('#8a5a34'),moss:hex('#6ab85a'),shr:hex('#b8b0a2'),shrD:hex('#8e877c'),gold:hex('#ffcf4a'),
 skin:hex('#ffd8b8'),blush:hex('#ff9a9a'),ink:hex('#2a2238'),water:hex('#5ac8ec')};
/* ---------- the island's shape ---------- */
const LAND={hill:{x:40,z:-6,h:16,r:13},lake:{x:-30,z:32,r:22},isle:{x:-30,z:32,r:6.5},shrine:{x:18,z:64,r:13,h:7},village:{x:0,z:-54},
 ridgeA:[-74,-48],ridgeB:[-66,10],alcove:{x:-63,z:-18},ramp:{x:18,z0:38,z1:51.5}};
function segDist(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=sat(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)}
const PATHS=[[[0,-46],[2,-30],[6,-14],[10,4],[14,22],[18,36],[18,52]],[[6,-14],[20,-12],[30,-9]],[[2,-30],[-14,-24],[-36,-20],[-54,-18]],[[6,-14],[-6,0],[-18,8],[-27,12]],[[0,-46],[-4,-56],[-8,-60]]];
function pathDist(x,z){let d=1e9;for(const P of PATHS)for(let i=1;i<P.length;i++)d=Math.min(d,segDist(x,z,P[i-1],P[i]));return d}
function baseH(x,z){const r=Math.hypot(x,z)+(fbm(x*.018+7,z*.018+3,3)-.5)*30;const land=smooth(96,74,r);
 let h=-3.2+land*(4.4+(fbm(x*.035,z*.035,3)-.5)*3.2);
 const hd=Math.hypot(x-LAND.hill.x,z-LAND.hill.z);h+=LAND.hill.h*Math.exp(-Math.pow(hd/LAND.hill.r,2))*land;
 const rd=segDist(x,z,LAND.ridgeA,LAND.ridgeB);h+=11*smooth(10,3.5,rd)*(.85+.3*vnoise(x*.15,z*.15));
 const ad=Math.hypot((x-LAND.alcove.x)*.9,z-LAND.alcove.z);h=lerp(h,3.2,Math.min(1,smooth(5.2,3.4,ad)*smooth(-58,-61,x)+smooth(4.5,2.6,Math.abs(z-LAND.alcove.z))*smooth(-55,-58,x)*smooth(-66,-62,x)));
 const vd=Math.hypot(x-LAND.village.x,z-LAND.village.z);h=lerp(h,3,smooth(20,12,vd));
 const sd=Math.hypot(x-LAND.shrine.x,z-LAND.shrine.z);h=lerp(h,LAND.shrine.h,smooth(LAND.shrine.r+1.5,LAND.shrine.r-.5,sd));
 if(Math.abs(x-LAND.ramp.x)<4.2&&z>LAND.ramp.z0-2&&z<LAND.ramp.z1+1){const t=sat((z-LAND.ramp.z0)/(LAND.ramp.z1-LAND.ramp.z0)),rh=lerp(3.2,LAND.shrine.h,t),k=smooth(4.2,3,Math.abs(x-LAND.ramp.x));h=lerp(h,Math.max(h,rh),k);if(z>LAND.ramp.z0)h=lerp(h,rh,k)}
 const ld=Math.hypot(x-LAND.lake.x,z-LAND.lake.z);h=lerp(h,-2.4,smooth(LAND.lake.r,LAND.lake.r-9,ld));h=lerp(h,1.3+vnoise(x*.5,z*.5)*.3,smooth(LAND.isle.r,LAND.isle.r-2.5,ld));
 const pd=pathDist(x,z);if(pd<3&&h>.6)h-=.12*smooth(3,0,pd);
 return h}
// cache the heightfield on a grid; between samples heights are bilinear, so the mesh and the collisions agree
const FN=200,FS=1.25,FO=-FN*FS/2;let FH=null;
function bakeField(){FH=new Float32Array((FN+1)*(FN+1));for(let j=0;j<=FN;j++)for(let i=0;i<=FN;i++)FH[j*(FN+1)+i]=baseH(FO+i*FS,FO+j*FS)}
function fieldH(x,z){const fx=(x-FO)/FS,fz=(z-FO)/FS;if(fx<0||fz<0||fx>=FN||fz>=FN)return -3.2;const i=fx|0,j=fz|0,u=fx-i,v=fz-j,k=j*(FN+1)+i;
 // follow the triangle split the mesh uses (a,d,c / a,c,b)
 const a=FH[k],b=FH[k+1],c=FH[k+FN+2],d=FH[k+FN+1];return v>u?a+(c-d)*u+(d-a)*v:a+(b-a)*u+(c-b)*v}
function fieldN(x,z){const e=.6,hx=fieldH(x+e,z)-fieldH(x-e,z),hz=fieldH(x,z+e)-fieldH(x,z-e),l=Math.hypot(hx,2*e,hz);return[-hx/l,2*e/l,-hz/l]}
function fieldCol(x,z,h,ny){const n=fbm(x*.08,z*.08,2),pd=pathDist(x,z),sd=Math.hypot(x-LAND.shrine.x,z-LAND.shrine.z);
 let c=mixc(mixc(C.grassD,C.grass,smooth(.25,.6,n)),C.grassL,smooth(.6,.85,n));
 if(h<.9)c=mixc(c,C.sand,smooth(.9,.35,h));if(h<-.4)c=mixc(C.sand,hex('#d8c890'),smooth(-.4,-2,h));
 if(pd<2.6&&h>.5)c=mixc(c,C.dirt,smooth(2.6,1.4,pd)*(.85+.15*vnoise(x*.7,z*.7)));
 if(sd<LAND.shrine.r-1&&h>LAND.shrine.h-.3)c=mixc(c,(Math.floor(x/2.5)+Math.floor(z/2.5))&1?C.stone:mulc(C.stone,.93),.9);
 if(ny<.78)c=mixc(c,ny<.62?C.rockD:C.rock,smooth(.78,.66,ny));
 return c}
/* ---------- a scene: meshes, colliders, things, and how the light looks ---------- */
const ENV={
 field:{sun:norm3([.45,.8,.35]),sunCol:[1.06,1.02,.94],shadow:[.62,.66,.92],amb:[.10,.12,.15],fog:[60,150],fogCol:hex('#cfeefc'),top:hex('#4aa6ec'),hor:hex('#cfeefc'),ground:hex('#9fd4e8'),cloud:1,lk:.4,ink:hex('#3a2a40'),deep:hex('#2f8fd0'),shal:hex('#7ee0f0')},
 dungeon:{sun:norm3([.3,.9,.2]),sunCol:[.62,.64,.78],shadow:[.36,.36,.54],amb:[.10,.10,.16],fog:[16,46],fogCol:hex('#1c1a2c'),top:hex('#1c1a2c'),hor:hex('#1c1a2c'),ground:hex('#1c1a2c'),cloud:0,lk:1.05,ink:hex('#141020'),deep:hex('#2a6aa0'),shal:hex('#4ab0d0')}};
function norm3(v){const l=Math.hypot(...v);return v.map(q=>q/l)}
let SC=null;const SCENES={};
function newScene(id){return{id,env:ENV[id],chunks:[],grass:[],water:null,props:null,propsNoInk:null,cols:[],things:[],spawn:[0,0,0]}}
// colliders: circles (c) and boxes (b), each with a floor and a top; anything you can stand on is a collider too
function colC(S,x,z,r,y0,y1,tag){const c={t:'c',x,z,r,y0,y1,on:true,tag};S.cols.push(c);return c}
function colB(S,x,z,hx,hz,y0,y1,tag){const c={t:'b',x,z,hx,hz,y0,y1,on:true,tag};S.cols.push(c);return c}
/* ---------- props: trees, rocks, houses, the shrine ---------- */
function tree(mb,S,x,z,s=1,kind=0){const y=fieldH(x,z)-.2,R=srand((x*73+z*31)|0);mb.cyl(x,y,z,.42*s,.3*s,3.2*s,C.bark,8);
 const lc=kind?[hex('#ff9ac0'),hex('#ffc0d8'),hex('#e87aa8')]:[C.leaf,C.leafL,C.leafD];
 for(let i=0;i<4;i++){const a=R()*TAU,d=i?1.2*s:0,cy=y+3.4*s+(i?-.3+R()*.8:.5*s),r=(i?1.35:1.8)*s;
  mb.sphere(x+Math.cos(a)*d,cy,z+Math.sin(a)*d,r,r*.88,r,lc[0],12,(nx,ny,nz)=>mixc(lc[2],ny>.25?lc[1]:lc[0],smooth(-.6,.5,ny)),.25)}
 colC(S,x,z,.55*s,y,y+3*s,'tree');return{x,z,y:y+3.4*s,s}}
function rockAt(mb,S,x,z,r,seed){const y=fieldH(x,z);mb.rock(x,y+r*.25,z,r,C.rock,seed,.75,ny=>mixc(C.rockD,ny>.3?mixc(C.rock,C.moss,smooth(.45,.8,ny)):C.rock,smooth(-.5,.2,ny)));colC(S,x,z,r*.85,y-1,y+r*.9,'rock')}
function house(mb,S,x,z,rot,roof){const y=fieldH(x,z)-.1,m=M4.ry(M4.tr(M4.id(),x,y,z),rot);mb.at(m);
 mb.cyl(0,0,0,2.6,2.4,3,C.wall,16,true);mb.cyl(0,2.9,0,3.6,.2,2.6,roof,16,true,mulc(roof,1.1));
 for(let i=0;i<6;i++){const a=i/6*TAU+.3;mb.sphere(Math.cos(a)*2.3,4.1-(i%2)*.4,Math.sin(a)*2.3,.32,.26,.32,C.white,8)}
 mb.box(0,1,2.42,.62,1,.12,C.woodD);mb.sphere(.38,1,2.56,.07,.07,.07,C.gold,6);mb.box(-1.55,1.7,1.9,.42,.42,.1,hex('#9ad8f8'));mb.box(1.55,1.7,1.9,.42,.42,.1,hex('#9ad8f8'));
 mb.cyl(1.2,3.6,-.8,.28,.28,1.6,C.rockD,8);mb.at(null);colC(S,x,z,2.6,y,y+5,'house')}
function fence(mb,S,x0,z0,x1,z1){const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/1.6);for(let i=0;i<=n;i++){const x=lerp(x0,x1,i/n),z=lerp(z0,z1,i/n),y=fieldH(x,z);mb.box(x,y+.5,z,.1,.55,.1,C.wood);mb.sphere(x,y+1.08,z,.12,.08,.12,C.wood,6)}
 const a=Math.atan2(z1-z0,x1-x0),L=Math.hypot(x1-x0,z1-z0);for(const hh of[.45,.8]){const mx=(x0+x1)/2,mz=(z0+z1)/2,y=(fieldH(x0,z0)+fieldH(x1,z1))/2;mb.at(M4.ry(M4.tr(M4.id(),mx,y+hh,mz),-a));mb.box(0,0,0,L/2,.06,.05,C.woodD);mb.at(null)}
 colB(S,(x0+x1)/2,(z0+z1)/2,Math.abs(x1-x0)/2+.15,Math.abs(z1-z0)/2+.15,-5,fieldH((x0+x1)/2,(z0+z1)/2)+1.1,'fence')}
function bigTreeHouse(mb,S,x,z){const y=fieldH(x,z)-.3;mb.cyl(x,y,z,2.6,1.8,8,C.bark,14);for(let i=0;i<5;i++){const a=i/5*TAU;mb.cyl(x+Math.cos(a)*2.2,y,z+Math.sin(a)*2.2,.9,.2,1.6,C.bark,8)}
 mb.box(x,y+1.3,z+2.3,.8,1.3,.3,C.woodD);mb.sphere(x,y+2.7,z+2.45,.8,.5,.2,C.woodD,10);mb.box(x+1.3,y+4.2,z+2,.45,.45,.2,hex('#ffe08a'));
 for(let i=0;i<6;i++){const a=i/6*TAU,d=i?3.4:0,cy=y+9.5+(i?-.6:1.2),r=i?2.8:3.8;mb.sphere(x+Math.cos(a)*d,cy,z+Math.sin(a)*d,r,r*.85,r,C.leaf,14,(nx,ny)=>mixc(C.leafD,ny>.3?C.leafL:C.leaf,smooth(-.6,.4,ny)),.18)}
 mb.cyl(x,y+6.2,z,4.2,4.2,.35,C.wood,16);for(let i=0;i<14;i++){const a=i/14*TAU;mb.box(x+Math.cos(a)*4,y+7,z+Math.sin(a)*4,.08,.6,.08,C.woodD)}
 colC(S,x,z,2.7,y,y+12,'tree')}
function shrine(mb,S){const {x,z,h}=LAND.shrine,y=h,zz=z+4;
 // steps, pillars, and the great face of the shrine with its round door and three sockets
 mb.box(x,y+.2,zz,7,.3,4,C.shrD,C.shr);mb.box(x,y+3.7,zz+1,6.2,3.4,2.2,C.shr);mb.box(x,y+7.4,zz+1,6.8,.5,2.6,C.shrD,C.moss);
 mb.cyl(x,y+7.9,zz+1,3.2,.3,2.2,C.shr,10,true,C.moss);
 for(const sx of[-5.2,5.2]){mb.cyl(x+sx,y,zz-3.2,.8,.7,6.4,C.shr,10,true,C.moss);mb.sphere(x+sx,y+6.8,zz-3.2,.9,.5,.9,C.moss,10)}
 mb.box(x,y+2.4,zz-1.25,2.4,2.4,.1,C.shrD);mb.cyl(x,y+4.7,zz-1.25,0,0,.01,C.shrD);
 for(let i=0;i<3;i++)mb.cyl(x-1.6+i*1.6,y+5.7,zz-1.3,.42,.42,.12,hex('#3a3a4a'),12,true,hex('#2a2a3a'));
 colB(S,x,zz+1,6.3,2.3,y-1,y+8,'shrine');colC(S,x-5.2,zz-3.2,.85,y,y+7,'pillar');colC(S,x+5.2,zz-3.2,.85,y,y+7,'pillar');
 for(const [px,pz] of[[-9,-6],[9,-6],[-10,4],[10,4]]){mb.cyl(x+px,y,z+pz,.55,.5,2.4,C.shr,8,true,C.moss);colC(S,x+px,z+pz,.6,y,y+2.4,'pillar')}}
function alcove(mb,S){const {x,z}=LAND.alcove,y=fieldH(x,z);for(const dz of[-3.4,3.4])mb.rock(x+2,y+1.6,z+dz,2.2,C.rock,dz>0?11:12,1.3,ny=>mixc(C.rockD,mixc(C.rock,C.moss,smooth(.4,.8,ny)),smooth(-.4,.3,ny)));
 mb.box(x+1.5,y+4,z,1.6,.6,4.4,C.rockD,C.moss);colC(S,x+2,z-3.4,2,y-1,y+5,'rock');colC(S,x+2,z+3.4,2,y-1,y+5,'rock')}
/* ---------- the field ---------- */
function buildField(){const S=newScene('field');bakeField();S.groundH=(x,z)=>fieldH(x,z);
 // terrain in chunks of 25 x 25 cells, so far chunks can be skipped
 const CH=25;for(let cj=0;cj<FN/CH;cj++)for(let ci=0;ci<FN/CH;ci++){const mb=new MB();let any=false;
  for(let j=cj*CH;j<cj*CH+CH;j++)for(let i=ci*CH;i<ci*CH+CH;i++){const P=(a,b)=>{const x=FO+a*FS,z=FO+b*FS,h=FH[b*(FN+1)+a];return[x,h,z]};
   const a=P(i,j),b=P(i+1,j),c=P(i+1,j+1),d=P(i,j+1);if(Math.max(a[1],b[1],c[1],d[1])<-2.9)continue;any=true;
   for(const [p,q,r] of[[a,d,c],[a,c,b]]){const vs=[p,q,r];for(const v of vs){const n=fieldN(v[0],v[2]);mb.v(v,n,fieldCol(v[0],v[2],v[1],n[1]))}}}
  if(any){const cx=FO+(ci+.5)*CH*FS,cz=FO+(cj+.5)*CH*FS;S.chunks.push({m:mb.build(),x:cx,z:cz})}}
 // grass: thin swaying blades on the green
 const GB={};const R=srand(77);for(let z=-90;z<90;z+=.62)for(let x=-90;x<90;x+=.62){const px=x+R()*.6,pz=z+R()*.6,h=fieldH(px,pz);if(h<1)continue;const n=fieldN(px,pz);if(n[1]<.82)continue;
  if(pathDist(px,pz)<2.4)continue;if(Math.hypot(px-LAND.shrine.x,pz-LAND.shrine.z)<LAND.shrine.r)continue;const dens=fbm(px*.06+11,pz*.06,2);if(R()>dens*1.5-.15)continue;
  const k=Math.floor((px+100)/30)+'_'+Math.floor((pz+100)/30);const mb=GB[k]||(GB[k]=new MB());const tall=.28+R()*.36,a=R()*TAU,w=.065,lean=(R()-.5)*.22;
  const base=fieldCol(px,pz,h,n[1]),dk=mulc(base,.62),tip=mixc(base,C.grassL,.6),dx=Math.cos(a)*w,dz=Math.sin(a)*w;
  mb.v([px-dx,h-.05,pz-dz],[0,1,0],dk,0);mb.v([px+dx,h-.05,pz+dz],[0,1,0],dk,0);mb.v([px+lean,h+tall,pz+lean*.5],[0,1,0],tip,1)}
 for(const k in GB){const [i,j]=k.split('_').map(Number);S.grass.push({m:GB[k].build(),x:-100+i*30+15,z:-100+j*30+15})}
 // water: one sheet at y=0 whose colour knows how deep it is
 {const mb=new MB(),N=90,s=240/N;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const P=(a,b)=>{const x=-120+a*s,z=-120+b*s,d=Math.max(0,-fieldH(x,z));return{p:[x,0,z],c:[sat(d/2.6),0,0]}};
   const a=P(i,j),b=P(i+1,j),c=P(i+1,j+1),d=P(i,j+1);if(a.c[0]<=0&&b.c[0]<=0&&c.c[0]<=0&&d.c[0]<=0&&Math.hypot(-120+i*s,-120+j*s)<70)continue;
   for(const [p,q,r] of[[a,d,c],[a,c,b]]){mb.v(p.p,[0,1,0],p.c);mb.v(q.p,[0,1,0],q.c);mb.v(r.p,[0,1,0],r.c)}}S.water=mb.build()}
 // props
 const mb=new MB(),R2=srand(901),trees=[];
 bigTreeHouse(mb,S,-9,-63);house(mb,S,11,-60,-.6,C.roof);house(mb,S,9,-71,.4,C.roofB);
 fence(mb,S,-2,-46,8,-46);fence(mb,S,8,-46,8,-40);fence(mb,S,-2,-46,-2,-40);
 shrine(mb,S);alcove(mb,S);
 const near=(x,z,r)=>[[LAND.village.x,LAND.village.z,17],[LAND.shrine.x,LAND.shrine.z,17],[LAND.lake.x,LAND.lake.z,LAND.lake.r+2],[LAND.alcove.x,LAND.alcove.z,8],[LAND.hill.x,LAND.hill.z,6]].some(([a,b,q])=>Math.hypot(x-a,z-b)<q+r);
 let tries=0;while(trees.length<62&&tries<4000){tries++;const x=(R2()-.5)*160,z=(R2()-.5)*160,h=fieldH(x,z);if(h<1.4||fieldN(x,z)[1]<.8||pathDist(x,z)<4||near(x,z,2))continue;
  if(trees.some(t=>Math.hypot(t.x-x,t.z-z)<6))continue;trees.push(tree(mb,S,x,z,.85+R2()*.5,R2()<.18?1:0))}
 for(let i=0,t=0;i<26&&t<2000;t++){const x=(R2()-.5)*170,z=(R2()-.5)*170,h=fieldH(x,z);if(h<.4||near(x,z,1)||pathDist(x,z)<3)continue;rockAt(mb,S,x,z,.7+R2()*1.4,i+5);i++}
 S.props=mb.build();S.trees=trees;
 // invisible walls where the sea gets deep, and around the shrine plateau edge
 S.spawn=[0,fieldH(0,-44),-44];
 return S}
/* ---------- the dungeon: a tile map, 2.5 m tiles, rooms climbing north ---------- */
// # wall   . floor   ' ' pit   P plate   K block   F lit brazier   U unlit brazier   W fire curtain   S vine sprout   X crystal switch
// V vine bridge (a pit until the sprout grows)   b blue tiles (a pit until the crystal raises them)   C chest   G gates   B boss door   f flower bud   m mushroom   s slime   E entry   * boss
const DMAP=[
'###############',
'######...######',
'####.......####',
'###f.......f###',
'##.....*.....##',
'##...........##',
'##..m.....m..##',
'##...........##',
'###..m...m..###',
'####f.....f####',
'######.B.######',
'######...######',
'#######.#######',
'###.........###',
'###.........###',
'###.........###',
'###      V  ###',
'### XCbbbV  ###',
'###      V  ###',
'###......S..###',
'###....f....###',
'######.G.######',
'#...#.....#####',
'#.U.#.....#####',
'##W##..F..#####',
'#.........#####',
'#.....U...#####',
'#.s..f.s..#####',
'######.G.######',
'###.......#####',
'###.f.K...#####',
'###..s....#####',
'###.....P.#####',
'###.......#####',
'######...######',
'######.E.######',
'######...######',
'###############'];
const DT=2.5,DW=DMAP[0].length,DHt=DMAP.length;
// map row 0 is the far north; world z grows north
const dpos=(i,j)=>[(i-(DW-1)/2)*DT,(DHt-1-j)*DT];
function dCell(x,z){const i=Math.round(x/DT+(DW-1)/2),j=Math.round(DHt-1-z/DT);if(i<0||j<0||i>=DW||j>=DHt)return'#';return DMAP[j][i]}
function buildDungeon(){const S=newScene('dungeon');S.groundH=(x,z)=>{const c=dCell(x,z);return c===' '||c==='#'?-30:c==='V'?(FLAGS.vine?0:-30):c==='b'?(FLAGS.blue?0:-30):0};
 const mb=new MB(),R=srand(5),wallH=5.5,items=[];
 for(let j=0;j<DHt;j++)for(let i=0;i<DW;i++){const c=DMAP[j][i],[x,z]=dpos(i,j);
  if(c==='#'){const open=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const q=(DMAP[j+b]||'')[i+a];return q&&q!=='#'});if(!open)continue;
   const k=.92+R()*.1,wc=mixc(hex('#b8a898'),hex('#9a90a8'),R()*.5);mb.box(x,wallH/2,z,DT/2,wallH/2,DT/2,mulc(wc,k),mixc(C.moss,C.shr,.3));mb.box(x,.4,z,DT/2+.04,.4,DT/2+.04,mulc(wc,.78));
   if(R()<.3)mb.sphere(x+(R()-.5)*1.5,wallH,z+(R()-.5)*1.5,.9,.4,.9,C.moss,8);colB(S,x,z,DT/2,DT/2,-40,wallH,'wall');continue}
  if(c===' '||c==='V'||c==='b'){items.push({c,x,z,i,j});continue}
  const chk=(i+j)&1,fc=hex('#e0cfb0');mb.box(x,-.25,z,DT/2,.25,DT/2,mulc(fc,chk?.86:.78),mulc(fc,chk?.94:.84));
  items.push({c,x,z,i,j})}
 // pit walls so the holes have depth
 for(let j=0;j<DHt;j++)for(let i=0;i<DW;i++){if(!' Vb'.includes(DMAP[j][i]))continue;const [x,z]=dpos(i,j);mb.box(x,-6,z,DT/2,5.5,DT/2,hex('#4a4458'),hex('#2a2638'))}
 // warm sconces on some walls that face a floor
 S.sconces=[];for(let j=1;j<DHt-1;j++)for(let i=1;i<DW-1;i++){if(DMAP[j][i]!=='#')continue;for(const [a,b] of[[1,0],[-1,0],[0,1],[0,-1]]){const q=DMAP[j+b][i+a];if(!q||'# Vb'.includes(q))continue;if(hash2(i*7+a,j*13+b)>.2)continue;
  const [x,z]=dpos(i,j),nx=a,nz=-b,px=x+nx*(DT/2+.12),pz=z+nz*(DT/2+.12);mb.box(px-nx*.06,2.5,pz-nz*.06,.12+Math.abs(nz)*.1,.1,.12+Math.abs(nx)*.1,C.woodD);mb.cyl(px,2.6,pz,.12,.24,.25,hex('#5a5468'),8,true,hex('#2a2430'));S.sconces.push([px,2.95,pz]);break}}
 S.props=mb.build();S.items=items;const e=items.find(q=>q.c==='E');S.spawn=[e.x,0,e.z];S.dmap=true;return S}
