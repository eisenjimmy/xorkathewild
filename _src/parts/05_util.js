/* ================= helpers: numbers, noise, matrices ================= */
const TAU=Math.PI*2,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,sat=v=>clamp(v,0,1);
const ease=t=>1-Math.pow(1-sat(t),3),easeIO=t=>{t=sat(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2},easeBack=t=>{t=sat(t)-1;return 1+2.70158*t*t*t+1.70158*t*t};
const smooth=(a,b,v)=>{const t=sat((v-a)/(b-a));return t*t*(3-2*t)};
const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d};
const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
function srand(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hash2=(x,y)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)|0;h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
 const a=hash2(xi,yi),b=hash2(xi+1,yi),c=hash2(xi,yi+1),d=hash2(xi+1,yi+1);return lerp(lerp(a,b,u),lerp(c,d,u),v)}
function fbm(x,y,o=4){let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=a*vnoise(x*f,y*f);f*=2.03;a*=.5}return s}
const hex=h=>{const n=parseInt(h.slice(1),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]};
const mixc=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const mulc=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
/* column-major 4x4 matrices, as GL wants them */
const M4={
 id(o=new Float32Array(16)){o.fill(0);o[0]=o[5]=o[10]=o[15]=1;return o},
 mul(a,b,o=new Float32Array(16)){const r=new Float32Array(16);for(let c=0;c<4;c++)for(let rr=0;rr<4;rr++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+rr]*b[c*4+k];r[c*4+rr]=s}o.set(r);return o},
 persp(fov,asp,n,f){const t=1/Math.tan(fov/2),o=new Float32Array(16);o[0]=t/asp;o[5]=t;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);return o},
 look(e,c,u=[0,1,0]){let zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2],l=Math.hypot(zx,zy,zz)||1;zx/=l;zy/=l;zz/=l;
  let xx=u[1]*zz-u[2]*zy,xy=u[2]*zx-u[0]*zz,xz=u[0]*zy-u[1]*zx;l=Math.hypot(xx,xy,xz)||1;xx/=l;xy/=l;xz/=l;const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
  return new Float32Array([xx,yx,zx,0,xy,yy,zy,0,xz,yz,zz,0,-(xx*e[0]+xy*e[1]+xz*e[2]),-(yx*e[0]+yy*e[1]+yz*e[2]),-(zx*e[0]+zy*e[1]+zz*e[2]),1])},
 inv(m){const a=m,o=new Float32Array(16);const b00=a[0]*a[5]-a[1]*a[4],b01=a[0]*a[6]-a[2]*a[4],b02=a[0]*a[7]-a[3]*a[4],b03=a[1]*a[6]-a[2]*a[5],b04=a[1]*a[7]-a[3]*a[5],b05=a[2]*a[7]-a[3]*a[6],
  b06=a[8]*a[13]-a[9]*a[12],b07=a[8]*a[14]-a[10]*a[12],b08=a[8]*a[15]-a[11]*a[12],b09=a[9]*a[14]-a[10]*a[13],b10=a[9]*a[15]-a[11]*a[13],b11=a[10]*a[15]-a[11]*a[14];
  let d=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;if(!d)return M4.id();d=1/d;
  o[0]=(a[5]*b11-a[6]*b10+a[7]*b09)*d;o[1]=(a[2]*b10-a[1]*b11-a[3]*b09)*d;o[2]=(a[13]*b05-a[14]*b04+a[15]*b03)*d;o[3]=(a[10]*b04-a[9]*b05-a[11]*b03)*d;
  o[4]=(a[6]*b08-a[4]*b11-a[7]*b07)*d;o[5]=(a[0]*b11-a[2]*b08+a[3]*b07)*d;o[6]=(a[14]*b02-a[12]*b05-a[15]*b01)*d;o[7]=(a[8]*b05-a[10]*b02+a[11]*b01)*d;
  o[8]=(a[4]*b10-a[5]*b08+a[7]*b06)*d;o[9]=(a[1]*b08-a[0]*b10-a[3]*b06)*d;o[10]=(a[12]*b04-a[13]*b02+a[15]*b00)*d;o[11]=(a[9]*b02-a[8]*b04-a[11]*b00)*d;
  o[12]=(a[5]*b07-a[4]*b09-a[6]*b06)*d;o[13]=(a[0]*b09-a[1]*b07+a[2]*b06)*d;o[14]=(a[13]*b01-a[12]*b03-a[14]*b00)*d;o[15]=(a[8]*b03-a[9]*b01+a[10]*b00)*d;return o},
 // post-multiplying builders: m = m * T
 tr(m,x,y,z){m[12]+=m[0]*x+m[4]*y+m[8]*z;m[13]+=m[1]*x+m[5]*y+m[9]*z;m[14]+=m[2]*x+m[6]*y+m[10]*z;m[15]+=m[3]*x+m[7]*y+m[11]*z;return m},
 sc(m,x,y=x,z=x){for(let i=0;i<4;i++){m[i]*=x;m[4+i]*=y;m[8+i]*=z}return m},
 ry(m,a){const c=Math.cos(a),s=Math.sin(a);for(let i=0;i<4;i++){const x=m[i],z=m[8+i];m[i]=x*c-z*s;m[8+i]=x*s+z*c}return m},
 rx(m,a){const c=Math.cos(a),s=Math.sin(a);for(let i=0;i<4;i++){const y=m[4+i],z=m[8+i];m[4+i]=y*c+z*s;m[8+i]=z*c-y*s}return m},
 rz(m,a){const c=Math.cos(a),s=Math.sin(a);for(let i=0;i<4;i++){const x=m[i],y=m[4+i];m[i]=x*c+y*s;m[4+i]=y*c-x*s}return m},
 clone(m){return new Float32Array(m)},
 xf(m,x,y,z){return[m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]]},
 xn(m,x,y,z){return[m[0]*x+m[4]*y+m[8]*z,m[1]*x+m[5]*y+m[9]*z,m[2]*x+m[6]*y+m[10]*z]},
 // inverse-transpose of the upper 3x3, for normals under non-uniform scale
 nrm(m){const a=m[0],b=m[1],c=m[2],d=m[4],e=m[5],f=m[6],g=m[8],h=m[9],i=m[10],A=e*i-f*h,B=f*g-d*i,C=d*h-e*g,det=a*A+b*B+c*C||1,k=1/det;
  return new Float32Array([A*k,B*k,C*k,(c*h-b*i)*k,(a*i-c*g)*k,(b*g-a*h)*k,(b*f-c*e)*k,(c*d-a*f)*k,(a*e-b*d)*k])}};
