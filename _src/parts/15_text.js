/* ================= text without fonts: the hand-drawn 5x7 glyphs, traced into round strokes ================= */
const F5={
'0':[14,17,19,21,25,17,14],'1':[4,12,4,4,4,4,14],'2':[14,17,1,2,4,8,31],'3':[31,2,4,2,1,17,14],'4':[2,6,10,18,31,2,2],
'5':[31,16,30,1,1,17,14],'6':[6,8,16,30,17,17,14],'7':[31,1,2,4,8,8,8],'8':[14,17,17,14,17,17,14],'9':[14,17,17,15,1,2,12],
A:[14,17,17,31,17,17,17],B:[30,17,17,30,17,17,30],C:[14,17,16,16,16,17,14],D:[28,18,17,17,17,18,28],E:[31,16,16,30,16,16,31],
F:[31,16,16,30,16,16,16],G:[14,17,16,23,17,17,15],H:[17,17,17,31,17,17,17],I:[14,4,4,4,4,4,14],J:[7,2,2,2,2,18,12],
K:[17,18,20,24,20,18,17],L:[16,16,16,16,16,16,31],M:[17,27,21,21,17,17,17],N:[17,17,25,21,19,17,17],O:[14,17,17,17,17,17,14],
P:[30,17,17,30,16,16,16],Q:[14,17,17,17,21,18,13],R:[30,17,17,30,20,18,17],S:[15,16,16,14,1,1,30],T:[31,4,4,4,4,4,4],
U:[17,17,17,17,17,17,14],V:[17,17,17,17,17,10,4],W:[17,17,17,21,21,21,10],X:[17,17,10,4,10,17,17],Y:[17,17,17,10,4,4,4],
Z:[31,1,2,4,8,16,31],':':[0,12,12,0,12,12,0],'!':[4,4,4,4,4,0,4],'.':[0,0,0,0,0,12,12],'-':[0,0,0,31,0,0,0],
'/':[1,1,2,4,8,16,16],'+':[0,4,4,31,4,4,0],'?':[14,17,1,2,4,0,4],'>':[8,4,2,1,2,4,8],'<':[2,4,8,16,8,4,2],'*':[0,0,4,14,4,0,0],' ':[0,0,0,0,0,0,0],
',':[0,0,0,0,12,4,8],"'":[4,4,8,0,0,0,0],'"':[10,10,20,0,0,0,0],'(':[2,4,8,8,8,4,2],')':[8,4,2,2,2,4,8],'%':[25,25,2,4,8,19,19],'=':[0,0,31,0,31,0,0],
'&':[12,18,20,8,21,18,13],'_':[0,0,0,0,0,0,31],'~':[0,0,8,21,2,0,0],'#':[10,31,10,10,31,10,0],'$':[4,15,20,14,5,30,4]};
// a glyph's lit pixels become segments between lit neighbours (sideways, down, and the diagonals that skip a corner)
const GLS=new Map();
function glyphStrokes(g){let r=GLS.get(g);if(r)return r;r={segs:[],dots:[]};const on=(x,y)=>x>=0&&x<5&&y>=0&&y<g.length&&!!(g[y]&(16>>x));
 for(let y=0;y<g.length;y++)for(let x=0;x<5;x++){if(!on(x,y))continue;let n=0;
  if(on(x+1,y)){r.segs.push(x,y,x+1,y);n++}if(on(x,y+1)){r.segs.push(x,y,x,y+1);n++}
  if(on(x+1,y+1)&&!on(x+1,y)&&!on(x,y+1)){r.segs.push(x,y,x+1,y+1);n++}if(on(x-1,y+1)&&!on(x-1,y)&&!on(x,y+1)){r.segs.push(x,y,x-1,y+1);n++}
  if(!n&&!on(x-1,y)&&!on(x,y-1)&&!on(x-1,y-1)&&!on(x+1,y-1))r.dots.push(x,y)}
 GLS.set(g,r);return r}
const textW=(s,u=1)=>Math.max(0,String(s).length*6-1)*u;
function strokeGlyphs(g,s,u,ox,oy,lw,col){g.strokeStyle=col;g.lineWidth=lw;g.lineCap=g.lineJoin='round';g.beginPath();let cx=0;
 for(const ch of s){const gl=F5[ch];if(gl){const r=glyphStrokes(gl);for(let i=0;i<r.segs.length;i+=4){g.moveTo(ox+(cx+r.segs[i]+.5)*u,oy+(r.segs[i+1]+.5)*u);g.lineTo(ox+(cx+r.segs[i+2]+.5)*u,oy+(r.segs[i+3]+.5)*u)}
  for(let i=0;i<r.dots.length;i+=2){const x=ox+(cx+r.dots[i]+.5)*u,y=oy+(r.dots[i+1]+.5)*u;g.moveTo(x+.01,y);g.lineTo(x,y)}}cx+=6}g.stroke()}
// text is set once into a small canvas and reused; u = screen pixels per glyph pixel
const TXC=new Map();
function textCanvas(s,u,col,ol,weight=1.15){s=String(s).toUpperCase();const k=s+'|'+u.toFixed(2)+'|'+col+'|'+ol+'|'+weight;let c=TXC.get(k);if(c)return c;
 const pad=Math.ceil(u*2.2),w=Math.ceil(textW(s,u)+pad*2),h=Math.ceil(7*u+pad*2+u);c=document.createElement('canvas');c.width=Math.max(1,w);c.height=Math.max(1,h);const g=c.getContext('2d');
 if(ol){strokeGlyphs(g,s,u,pad,pad+u*.6,u*(weight+1.9),'rgba(40,30,60,.35)');strokeGlyphs(g,s,u,pad,pad,u*(weight+1.7),ol)}
 strokeGlyphs(g,s,u,pad,pad,u*weight,col);c.pad=pad;if(TXC.size>500)TXC.clear();TXC.set(k,c);return c}
function text(s,x,y,u,col,align='left',ol='#3a2a4a',weight){const c=textCanvas(s,u,col,ol,weight),w=textW(String(s),u);
 const ox=align==='center'?x-w/2:align==='right'?x-w:x;ui.drawImage(c,Math.round(ox-c.pad),Math.round(y-c.pad));return w}
function wrapText(s,max){const out=[];for(const para of String(s).toUpperCase().split('\n')){let line='';for(const w of para.split(' ')){const t=line?line+' '+w:w;if(t.length>max&&line){out.push(line);line=w}else line=t}out.push(line)}return out}
/* ---------- cute UI shapes ---------- */
function rrect(x,y,w,h,r){ui.beginPath();ui.moveTo(x+r,y);ui.arcTo(x+w,y,x+w,y+h,r);ui.arcTo(x+w,y+h,x,y+h,r);ui.arcTo(x,y+h,x,y,r);ui.arcTo(x,y,x+w,y,r);ui.closePath()}
function panel(x,y,w,h,r,fill='#fff8ec',edge='#5a4a6a',lw){rrect(x,y+r*.18,w,h,r);ui.fillStyle='rgba(60,40,80,.25)';ui.fill();rrect(x,y,w,h,r);ui.fillStyle=fill;ui.fill();ui.lineWidth=lw||Math.max(2,r*.18);ui.strokeStyle=edge;ui.stroke()}
function heartPath(x,y,s){ui.beginPath();ui.moveTo(x,y+s*.35);ui.bezierCurveTo(x,y-s*.05,x-s*.55,y-s*.1,x-s*.55,y+s*.25);ui.bezierCurveTo(x-s*.55,y+s*.55,x-s*.15,y+s*.72,x,y+s*.95);
 ui.bezierCurveTo(x+s*.15,y+s*.72,x+s*.55,y+s*.55,x+s*.55,y+s*.25);ui.bezierCurveTo(x+s*.55,y-s*.1,x,y-s*.05,x,y+s*.35);ui.closePath()}
function heart(x,y,s,fill,bump=0){const k=1+bump*.25;s*=k;heartPath(x,y-s*.05,s);ui.fillStyle='#4a2a3a';ui.lineWidth=s*.16;ui.strokeStyle='#4a2a3a';ui.stroke();ui.fillStyle='#f7e8ee';ui.fill();
 if(fill>0){ui.save();heartPath(x,y-s*.05,s);ui.clip();ui.fillStyle='#ff5a7a';ui.fillRect(x-s*.6,y-s*.2,s*1.2*(fill>=1?1:.5),s*1.3);ui.fillStyle='rgba(255,255,255,.55)';ui.beginPath();ui.ellipse(x-s*.27,y+s*.12,s*.11,s*.07,-.6,0,TAU);ui.fill();ui.restore()}}
function star(x,y,r,col,rot=0){ui.beginPath();for(let i=0;i<10;i++){const a=rot+i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;ui.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}ui.closePath();ui.fillStyle=col;ui.fill()}
