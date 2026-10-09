/* ================= WebGL: cel-shading programs and a little mesh builder ================= */
const cv=document.getElementById('gl'),uiCv=document.getElementById('ui'),ui=uiCv.getContext('2d');
const gl=cv.getContext('webgl2',{antialias:true,alpha:false,preserveDrawingBuffer:!!window.__keepGL});
if(!gl){document.body.innerHTML='<p style="font:16px sans-serif;color:#234;padding:24px">xOrka the Wild needs WebGL 2. Try a recent Chrome, Edge, Firefox or Safari.</p>';throw new Error('no webgl2')}
let VW=1,VH=1,DPR=1;
function resize(){DPR=Math.min(window.devicePixelRatio||1,window.__dpr||1.75);VW=Math.max(1,Math.round(innerWidth*DPR));VH=Math.max(1,Math.round(innerHeight*DPR));
 cv.width=VW;cv.height=VH;uiCv.width=VW;uiCv.height=VH;gl.viewport(0,0,VW,VH)}
addEventListener('resize',resize);resize();
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)+'\n'+src);return s}
function program(vs,fs){const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,'#version 300 es\nprecision highp float;\n'+vs));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,'#version 300 es\nprecision highp float;\n'+fs));
 gl.bindAttribLocation(p,0,'aPos');gl.bindAttribLocation(p,1,'aNor');gl.bindAttribLocation(p,2,'aCol');gl.bindAttribLocation(p,3,'aWind');gl.linkProgram(p);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));const U={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
 for(let i=0;i<n;i++){const u=gl.getActiveUniform(p,i),nm=u.name.replace(/\[0\]$/,'');U[nm]=gl.getUniformLocation(p,u.name)}return{p,U}}
const NL=8;
// toon: a hard-but-soft terminator, cool blue shadows, a warm rim, torchlight, fog into the sky. uOutline>0 turns it into the inverted-hull ink pass
const TOON=program(`
layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNor;layout(location=2) in vec3 aCol;layout(location=3) in float aWind;
uniform mat4 uVP,uM;uniform mat3 uN;uniform float uTime,uOutline,uSway;uniform vec3 uCam;
out vec3 vN,vC,vW;out float vD;
void main(){vec3 p=aPos;
 if(aWind>0.){float ph=uTime*1.9+p.x*.35+p.z*.27;vec3 wp=(uM*vec4(p,1.)).xyz;ph=uTime*1.9+wp.x*.31+wp.z*.23;p.x+=sin(ph)*aWind*uSway;p.z+=cos(ph*.8)*aWind*uSway*.6;}
 vec4 w=uM*vec4(p,1.);vec3 n=normalize(uN*aNor);
 if(uOutline>0.){float d=length(w.xyz-uCam);w.xyz+=n*uOutline*clamp(d*.06,.6,3.);}
 vW=w.xyz;vN=n;vC=aCol;vD=length(w.xyz-uCam);gl_Position=uVP*w;}`,`
float sat2(float v){return clamp(v,0.,1.);}
in vec3 vN,vC,vW;in float vD;out vec4 o;
uniform vec3 uSun,uSunCol,uAmb,uShadow,uFogCol,uCam,uInk,uMul;uniform vec2 uFog;uniform float uOutline,uEmis,uAlpha,uLK;uniform vec4 uTint;
uniform vec4 uL[${NL}];uniform vec3 uLC[${NL}];uniform int uNL;
void main(){
 if(uOutline>0.){o=vec4(uInk*mix(vec3(1.),vC,.25),1.);float f=smoothstep(uFog.x,uFog.y,vD);o.rgb=mix(o.rgb,uFogCol,f);return;}
 vec3 N=normalize(vN),V=normalize(uCam-vW),base=vC*uMul;
 float nd=dot(N,uSun),lit=smoothstep(-.04,.10,nd);
 vec3 col=mix(base*uShadow,base*uSunCol,lit)+base*uAmb*(.5+.5*N.y);
 float rim=pow(1.-max(dot(N,V),0.),3.);col+=rim*.22*mix(vec3(.5,.6,.9),vec3(1.,.95,.8),lit);
 float spec=pow(max(dot(reflect(-uSun,N),V),0.),24.)*lit;col+=step(.55,spec)*.18;
 for(int i=0;i<${NL};i++){if(i>=uNL)break;vec3 d=uL[i].xyz-vW;float r=length(d);float k=sat2(1.-r/uL[i].w);float l=max(dot(N,d/r),0.)*.7+.3;col+=base*uLC[i]*smoothstep(0.,.6,k*l)*uLK;}
 col=mix(col,base,uEmis);col=mix(col,uTint.rgb,uTint.a);
 float f=smoothstep(uFog.x,uFog.y,vD);col=mix(col,uFogCol,f);o=vec4(col,uAlpha);}`);
// the sky: a soft gradient, a sun and puffy clouds, all from the view ray
const SKY=program(`layout(location=0) in vec3 aPos;out vec2 vP;void main(){vP=aPos.xy;gl_Position=vec4(aPos.xy,.9999,1.);}`,`
in vec2 vP;out vec4 o;uniform mat4 uIVP;uniform vec3 uSun,uTop,uHor,uGround;uniform float uTime,uCloud;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.02;a*=.5;}return s;}
void main(){vec4 a=uIVP*vec4(vP,-1.,1.),b=uIVP*vec4(vP,1.,1.);vec3 d=normalize(b.xyz/b.w-a.xyz/a.w);
 float y=d.y;vec3 c=mix(uHor,uTop,pow(max(y,0.),.6));if(y<0.)c=mix(uHor,uGround,min(-y*3.,1.));
 float s=max(dot(d,uSun),0.);c+=vec3(1.,.9,.7)*(pow(s,600.)*2.+pow(s,8.)*.18);
 if(y>0.&&uCloud>0.){vec2 q=d.xz/(y+.12)*1.4+vec2(uTime*.012,uTime*.004);float k=fb(q);float m=smoothstep(.55,.62,k)*smoothstep(0.,.25,y);
  vec3 cc=mix(vec3(.82,.88,1.),vec3(1.),smoothstep(.6,.75,k));c=mix(c,cc,m*uCloud);}
 o=vec4(c,1.);}`);
// particles: round puffs, stars, petals and leaves as point sprites
const PART=program(`layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNor;layout(location=2) in vec3 aCol;layout(location=3) in float aWind;
uniform mat4 uVP;uniform float uScale;out vec3 vC;out float vA,vK;
void main(){vec4 p=uVP*vec4(aPos,1.);gl_Position=p;gl_PointSize=clamp(aNor.x*uScale/max(p.w,.1),1.,256.);vC=aCol;vA=aNor.y;vK=aNor.z;}`,`
in vec3 vC;in float vA,vK;out vec4 o;
void main(){vec2 p=gl_PointCoord*2.-1.;float r=length(p),a;
 if(vK<.5)a=1.-smoothstep(.55,1.,r);
 else if(vK<1.5){float ang=atan(p.y,p.x);float st=.45+.35*cos(ang*5.);a=1.-smoothstep(st-.08,st+.08,r);}
 else if(vK<2.5){a=1.-smoothstep(.75,1.,length(vec2(p.x*1.9,p.y)));}
 else{a=1.-smoothstep(.85,1.,r);a*=smoothstep(.55,.7,r)+.0;}
 if(a<.02)discard;o=vec4(vC,a*vA);}`);
// water: blue that deepens offshore, a sliding sparkle pattern and white foam where it meets land
const WATER=program(`layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNor;layout(location=2) in vec3 aCol;
uniform mat4 uVP;uniform float uTime;uniform vec3 uCam;out vec3 vW,vC;out float vD;
void main(){vec3 p=aPos;p.y+=sin(uTime*1.3+p.x*.4)*.04+cos(uTime*1.1+p.z*.5)*.04;vW=p;vC=aCol;vD=length(p-uCam);gl_Position=uVP*vec4(p,1.);}`,`
in vec3 vW,vC;in float vD;out vec4 o;uniform float uTime;uniform vec3 uFogCol,uDeep,uShal;uniform vec2 uFog;
void main(){float depth=vC.r;vec3 c=mix(uShal,uDeep,smoothstep(0.,1.,depth));
 float w=sin(vW.x*.9+uTime*1.2)*sin(vW.z*.8-uTime*.9)+sin((vW.x+vW.z)*.45+uTime*.7);c+=step(1.35,w)*.12;
 float foam=1.-smoothstep(.02,.16,depth-.05*sin(uTime*2.+vW.x*2.)*.5);c=mix(c,vec3(.96,.99,1.),foam*.85);
 float f=smoothstep(uFog.x,uFog.y,vD);c=mix(c,uFogCol,f);o=vec4(c,mix(.82,.95,smoothstep(0.,1.,depth)));}`);
/* ---------- meshes: positions, normals, colours and a wind weight, interleaved ---------- */
class MB{constructor(){this.d=[];this.m=null;this.nm=null}
 at(m){this.m=m;this.nm=m?M4.nrm(m):null;return this}
 v(p,n,c,w=0){let x=p[0],y=p[1],z=p[2],nx=n[0],ny=n[1],nz=n[2];if(this.m){[x,y,z]=M4.xf(this.m,x,y,z);const q=this.nm;const a=q[0]*nx+q[3]*ny+q[6]*nz,b=q[1]*nx+q[4]*ny+q[7]*nz,cc=q[2]*nx+q[5]*ny+q[8]*nz,l=Math.hypot(a,b,cc)||1;nx=a/l;ny=b/l;nz=cc/l}
  this.d.push(x,y,z,nx,ny,nz,c[0],c[1],c[2],w)}
 tri(a,b,c,ca,cb=ca,cc=ca,flatN,wa=0,wb=0,wc=0){let n=flatN;if(!n){const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];n=[uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx];const l=Math.hypot(...n)||1;n=[n[0]/l,n[1]/l,n[2]/l]}
  this.v(a,n,ca,wa);this.v(b,n,cb,wb);this.v(c,n,cc,wc)}
 quad(a,b,c,d,col){this.tri(a,b,c,col);this.tri(a,c,d,col)}
 box(x,y,z,sx,sy,sz,col,top){const X=[x-sx,x+sx],Y=[y-sy,y+sy],Z=[z-sz,z+sz],P=(i,j,k)=>[X[i],Y[j],Z[k]],t=top||col,sd=mulc(col,.92);
  this.quad(P(0,1,0),P(0,1,1),P(1,1,1),P(1,1,0),t);this.quad(P(0,0,0),P(1,0,0),P(1,0,1),P(0,0,1),mulc(col,.8));
  this.quad(P(0,0,1),P(1,0,1),P(1,1,1),P(0,1,1),col);this.quad(P(1,0,0),P(0,0,0),P(0,1,0),P(1,1,0),col);
  this.quad(P(1,0,1),P(1,0,0),P(1,1,0),P(1,1,1),sd);this.quad(P(0,0,0),P(0,0,1),P(0,1,1),P(0,1,0),sd)}
 // smooth ellipsoid; colFn(nx,ny,nz) may paint it (bellies, eyes, moss)
 sphere(x,y,z,rx,ry,rz,col,seg=14,colFn,wind=0){const rows=Math.max(4,seg>>1);const P=(i,j)=>{const th=j/rows*Math.PI,ph=i/seg*TAU,nx=Math.sin(th)*Math.cos(ph),ny=Math.cos(th),nz=Math.sin(th)*Math.sin(ph);
   const L=Math.hypot(nx/rx,ny/ry,nz/rz)||1;return{p:[x+nx*rx,y+ny*ry,z+nz*rz],n:[nx/rx/L,ny/ry/L,nz/rz/L],c:colFn?colFn(nx,ny,nz):col}};
  for(let j=0;j<rows;j++)for(let i=0;i<seg;i++){const a=P(i,j),b=P(i+1,j),c=P(i+1,j+1),d=P(i,j+1);
   if(j>0){this.v(a.p,a.n,a.c,wind);this.v(b.p,b.n,b.c,wind);this.v(c.p,c.n,c.c,wind)}if(j<rows-1){this.v(a.p,a.n,a.c,wind);this.v(c.p,c.n,c.c,wind);this.v(d.p,d.n,d.c,wind)}}}
 cyl(x,y,z,r0,r1,h,col,seg=12,caps=true,topCol){for(let i=0;i<seg;i++){const a0=i/seg*TAU,a1=(i+1)/seg*TAU,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1),sl=(r0-r1)/h;
   const n0=[c0,sl,s0],n1=[c1,sl,s1];const A=[x+c0*r0,y,z+s0*r0],B=[x+c1*r0,y,z+s1*r0],C=[x+c1*r1,y+h,z+s1*r1],D=[x+c0*r1,y+h,z+s0*r1];
   this.v(A,n0,col);this.v(C,n1,col);this.v(B,n1,col);this.v(A,n0,col);this.v(D,n0,col);this.v(C,n1,col);
   if(caps){if(r1>0)this.tri([x,y+h,z],C,D,topCol||col,topCol||col,topCol||col,[0,1,0]);if(r0>0)this.tri([x,y,z],A,B,mulc(col,.8),mulc(col,.8),mulc(col,.8),[0,-1,0])}}}
 // faceted rock: a jittered icosphere with flat normals
 rock(x,y,z,r,col,seed=1,sy=1,colFn){const R=srand(seed),ico=icosphere(1);const jit=ico.v.map(p=>{const k=.78+R()*.4;return[p[0]*k,p[1]*k,p[2]*k]});
  for(const [a,b,c] of ico.f){const A=jit[a],B=jit[b],C=jit[c],P=q=>[x+q[0]*r,y+q[1]*r*sy,z+q[2]*r];const ny=(A[1]+B[1]+C[1])/3,cx=A[0]+B[0]+C[0],cy=A[1]+B[1]+C[1],cz=A[2]+B[2]+C[2],ux=B[0]-A[0],uy=B[1]-A[1],uz=B[2]-A[2],vx=C[0]-A[0],vy=C[1]-A[1],vz=C[2]-A[2],out=(uy*vz-uz*vy)*cx+(uz*vx-ux*vz)*cy+(ux*vy-uy*vx)*cz>0,k=colFn?colFn(ny):col;if(out)this.tri(P(A),P(B),P(C),k);else this.tri(P(A),P(C),P(B),k)}}
 build(){return upload(new Float32Array(this.d))}}
function icosphere(sub){const t=(1+Math.sqrt(5))/2;let v=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(p=>{const l=Math.hypot(...p);return p.map(q=>q/l)});
 let f=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
 for(let s=0;s<sub;s++){const nf=[],mid={};const M=(a,b)=>{const k=a<b?a+'_'+b:b+'_'+a;if(mid[k]!=null)return mid[k];const p=[(v[a][0]+v[b][0])/2,(v[a][1]+v[b][1])/2,(v[a][2]+v[b][2])/2],l=Math.hypot(...p);v.push(p.map(q=>q/l));return mid[k]=v.length-1};
  for(const [a,b,c] of f){const ab=M(a,b),bc=M(b,c),ca=M(c,a);nf.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca])}f=nf}return{v,f}}
function upload(data){const vao=gl.createVertexArray(),buf=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
 const S=40;gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,S,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,S,12);
 gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,3,gl.FLOAT,false,S,24);gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,1,gl.FLOAT,false,S,36);gl.bindVertexArray(null);
 return{vao,buf,n:data.length/10,data}}
function free(m){if(!m)return;gl.deleteBuffer(m.buf);gl.deleteVertexArray(m.vao)}
// a dynamic buffer reused every frame for particles
const DYN={vao:gl.createVertexArray(),buf:gl.createBuffer(),cap:0};
gl.bindVertexArray(DYN.vao);gl.bindBuffer(gl.ARRAY_BUFFER,DYN.buf);for(let i=0;i<4;i++)gl.enableVertexAttribArray(i);
gl.vertexAttribPointer(0,3,gl.FLOAT,false,40,0);gl.vertexAttribPointer(1,3,gl.FLOAT,false,40,12);gl.vertexAttribPointer(2,3,gl.FLOAT,false,40,24);gl.vertexAttribPointer(3,1,gl.FLOAT,false,40,36);gl.bindVertexArray(null);
const QUAD=(()=>{const vao=gl.createVertexArray(),b=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),gl.STATIC_DRAW);
 gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,12,0);gl.bindVertexArray(null);return vao})();
