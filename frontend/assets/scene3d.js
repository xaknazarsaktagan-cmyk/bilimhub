// Adapted from the user's supplied EduCheck animation. UI/auth are independent.
const host=document.getElementById('hero-scene');
if(host)initHero().catch(()=>{host.classList.remove('scene-ready');host.dataset.sceneState='fallback';});
async function initHero(){
 const THREE=await import('./vendor/three.module.js');
 const mobile=matchMedia('(max-width:800px)').matches;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const renderer=new THREE.WebGLRenderer({antialias:!mobile,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.75));
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.05;
 host.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(45,1,.1,100);camera.position.set(0,0,13);
 scene.add(new THREE.AmbientLight(0xffffff,1.3));
 const pl1=new THREE.PointLight(0x7c5cff,65,40);pl1.position.set(-4,4,6);scene.add(pl1);
 const pl2=new THREE.PointLight(0x22d3ee,60,40);pl2.position.set(5,-3,6);scene.add(pl2);
// ---------- card textures
const F=(s,w)=>`${w||600} ${s}px Inter,system-ui,-apple-system,"Segoe UI",sans-serif`;
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
function mk(w,h,draw){
  const cv=document.createElement('canvas');const scale=mobile?1:2;cv.width=w*scale;cv.height=h*scale;const x=cv.getContext('2d');x.scale(scale,scale);
  const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'rgba(255,255,255,.16)');g.addColorStop(1,'rgba(255,255,255,.05)');
  rr(x,1,1,w-2,h-2,22);x.fillStyle='rgba(14,16,36,.72)';x.fill();x.fillStyle=g;x.fill();
  x.strokeStyle='rgba(255,255,255,.22)';x.lineWidth=1.5;x.stroke();
  draw(x,w,h);x.save();x.fillStyle='#98a0c2';x.font=F(10,600);x.textAlign='right';x.fillText('ҮЛГІ',w-16,18);x.restore();
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w/165,h/165),new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  return m;
}
const GC={5:'#34d399',4:'#60a5fa',3:'#fbbf24',2:'#f87171'};
const cards=[];
// 1: journal
cards.push(mk(560,350,(x,w,h)=>{
  x.fillStyle='#f2f4ff';x.font=F(24,700);x.fillText('Математика',28,50);
  x.fillStyle='#98a0c2';x.font=F(14,500);x.fillText('10-А сыныбы · Үлгерім журналы',28,74);
  [['Әлібек А.',5],['Аружан Б.',5],['Дәурен С.',4],['Томирис К.',3]].forEach((r,i)=>{
    const y=108+i*58;rr(x,24,y,w-48,48,14);x.fillStyle='rgba(255,255,255,.06)';x.fill();
    x.beginPath();x.arc(52,y+24,15,0,7);x.fillStyle=['#7c5cff','#22d3ee','#ff5ca8','#f59e0b'][i];x.fill();
    x.fillStyle='#fff';x.font=F(14,700);x.textAlign='center';x.fillText(r[0][0],52,y+29);
    x.textAlign='left';x.fillStyle='#e6e9ff';x.font=F(17,600);x.fillText(r[0],80,y+30);
    rr(x,w-96,y+9,56,30,10);x.fillStyle=GC[r[1]]+'33';x.fill();
    x.fillStyle=GC[r[1]];x.font=F(18,800);x.textAlign='center';x.fillText(r[1],w-68,y+31);x.textAlign='left';
  });
}));
// 2: ring
cards.push(mk(300,300,(x,w,h)=>{
  const cx=w/2,cy=130,R=82;x.lineWidth=18;x.lineCap='round';
  x.strokeStyle='rgba(255,255,255,.1)';x.beginPath();x.arc(cx,cy,R,0,7);x.stroke();
  const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,'#7c5cff');g.addColorStop(1,'#22d3ee');
  x.strokeStyle=g;x.beginPath();x.arc(cx,cy,R,-Math.PI/2,-Math.PI/2+Math.PI*2*.92);x.stroke();
  x.fillStyle='#fff';x.textAlign='center';x.font=F(46,800);x.fillText('92%',cx,cy+16);
  x.fillStyle='#98a0c2';x.font=F(15,500);x.fillText('Орташа үлгерім',cx,258);
}));
// 3: test
cards.push(mk(520,300,(x,w,h)=>{
  x.fillStyle='#98a0c2';x.font=F(14,600);x.fillText('ТЕСТ · 12 / 15',28,40);
  rr(x,28,54,w-56,8,4);x.fillStyle='rgba(255,255,255,.1)';x.fill();
  const g=x.createLinearGradient(28,0,w,0);g.addColorStop(0,'#7c5cff');g.addColorStop(1,'#22d3ee');
  rr(x,28,54,(w-56)*.8,8,4);x.fillStyle=g;x.fill();
  x.fillStyle='#fff';x.font=F(26,700);x.fillText('2 + 2 × 2 = ?',28,112);
  [['A','4'],['B','6'],['C','8'],['D','2']].forEach((o,i)=>{
    const bx=28+(i%2)*((w-68)/2+12),by=136+Math.floor(i/2)*70,bw=(w-68)/2,ok=i===1;
    rr(x,bx,by,bw,56,14);x.fillStyle=ok?'rgba(52,211,153,.18)':'rgba(255,255,255,.06)';x.fill();
    x.strokeStyle=ok?'#34d399':'rgba(255,255,255,.14)';x.lineWidth=ok?2:1;x.stroke();
    x.fillStyle=ok?'#34d399':'#98a0c2';x.font=F(17,800);x.fillText(o[0],bx+18,by+34);
    x.fillStyle='#fff';x.font=F(20,600);x.fillText(o[1],bx+50,by+35);
    if(ok){x.fillStyle='#34d399';x.font=F(20,800);x.fillText('✓',bx+bw-34,by+35)}
  });
}));
// 4: chart
cards.push(mk(420,260,(x,w,h)=>{
  x.fillStyle='#98a0c2';x.font=F(14,600);x.fillText('АПТАЛЫҚ НӘТИЖЕ',28,40);
  x.fillStyle='#34d399';x.font=F(30,800);x.fillText('+18%',28,82);
  const hs=[.4,.55,.5,.7,.62,.95],d=['Дс','Сс','Ср','Бс','Жм','Сб'];
  hs.forEach((v,i)=>{const bw=36,bx=28+i*62,bh=110*v,by=222-bh;
    const g=x.createLinearGradient(0,by,0,222);g.addColorStop(0,i===5?'#22d3ee':'#7c5cff');g.addColorStop(1,'rgba(124,92,255,.25)');
    rr(x,bx,by,bw,bh,10);x.fillStyle=g;x.fill();
    x.fillStyle='#98a0c2';x.font=F(12,500);x.textAlign='center';x.fillText(d[i],bx+bw/2,244);x.textAlign='left'});
}));
// 5: badge
cards.push(mk(330,96,(x,w,h)=>{
  x.beginPath();x.arc(48,48,22,0,7);x.fillStyle='rgba(52,211,153,.2)';x.fill();
  x.fillStyle='#34d399';x.font=F(24,800);x.textAlign='center';x.fillText('✓',48,57);x.textAlign='left';
  x.fillStyle='#fff';x.font=F(18,700);x.fillText('Тест тапсырылды',84,42);
  x.fillStyle='#98a0c2';x.font=F(14,500);x.fillText('Баға: 5 · Өте жақсы',84,66);
}));

const T=[[-3.0,1.9,1.0],[3.3,2.3,.8],[3.5,.2,1.2],[-3.5,-.9,1.3],[3.0,-2.4,1.5]];
const group=new THREE.Group();scene.add(group);
cards.forEach((c,i)=>{c.userData={t:new THREE.Vector3(...T[i]),a:i*1.4+.5,ph:Math.random()*6};c.material.opacity=0;group.add(c)});

// ---- laptop
const inOut=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
function tex(w,h,fn){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');fn(x,w,h);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t}
const metal=new THREE.MeshStandardMaterial({color:0x2a2f4a,metalness:.85,roughness:.28});
const laptop=new THREE.Group();laptop.position.y=-1.6;laptop.rotation.x=.22;group.add(laptop);
const baseM=new THREE.Mesh(new THREE.BoxGeometry(4,.14,2.7),metal);baseM.position.y=.07;laptop.add(baseM);
const kbT=tex(1024,676,(x,w,h)=>{x.fillStyle='#141831';x.fillRect(0,0,w,h);
  for(let r=0;r<5;r++)for(let k=0;k<14;k++){rr(x,36+k*68,40+r*60,60,52,9);x.fillStyle='#1f2549';x.fill();x.strokeStyle='rgba(124,92,255,.35)';x.lineWidth=2;x.stroke()}
  rr(x,352,420,320,200,22);x.fillStyle='#1b2146';x.fill();x.strokeStyle='rgba(34,211,238,.4)';x.lineWidth=3;x.stroke()});
const kb=new THREE.Mesh(new THREE.PlaneGeometry(3.8,2.5),new THREE.MeshBasicMaterial({map:kbT}));kb.rotation.x=-Math.PI/2;kb.position.y=.143;laptop.add(kb);
const lidP=new THREE.Group();lidP.position.set(0,.14,-1.35);lidP.rotation.x=1.5;laptop.add(lidP);
const lid=new THREE.Mesh(new THREE.BoxGeometry(4,2.6,.08),metal);lid.position.set(0,1.3,-.04);lidP.add(lid);
const screenT=tex(1024,640,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#2a1a8a');g.addColorStop(.6,'#0e5c86');g.addColorStop(1,'#0b2a4a');x.fillStyle=g;x.fillRect(0,0,w,h);
  x.fillStyle='rgba(255,255,255,.08)';x.fillRect(0,0,w,56);
  ['#ff5f57','#febc2e','#28c840'].forEach((c,i)=>{x.fillStyle=c;x.beginPath();x.arc(30+i*28,28,8,0,7);x.fill()});
  x.fillStyle='#fff';x.textAlign='center';x.font=F(64,800);x.fillText('Bilim',w/2,270);
  x.fillStyle='rgba(255,255,255,.75)';x.font=F(28,500);x.fillText('Цифрлық білім платформасы',w/2,322);
  [0,1,2].forEach(i=>{rr(x,170+i*236,400,210,130,20);x.fillStyle='rgba(255,255,255,.12)';x.fill();x.fillStyle=['#34d399','#60a5fa','#fbbf24'][i];x.font=F(56,800);x.fillText(['5','4','92%'][i],275+i*236,485)})});
const scr=new THREE.Mesh(new THREE.PlaneGeometry(3.7,2.3),new THREE.MeshBasicMaterial({map:screenT}));scr.position.set(0,1.3,.003);lidP.add(scr);
const logoT=tex(128,128,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#7c5cff');g.addColorStop(1,'#22d3ee');rr(x,10,10,108,108,26);x.fillStyle=g;x.fill()});
const logo=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5),new THREE.MeshBasicMaterial({map:logoT,transparent:true}));logo.position.set(0,1.3,-.083);logo.rotation.y=Math.PI;lidP.add(logo);
const pl3=new THREE.PointLight(0x7fd8ff,0,12);pl3.position.set(0,1.4,1.6);laptop.add(pl3);
const N=mobile?80:220,pg=new THREE.BufferGeometry(),pa=new Float32Array(N*3);
for(let i=0;i<N*3;i++)pa[i]=(Math.random()-.5)*34;
pg.setAttribute('position',new THREE.BufferAttribute(pa,3));
scene.add(new THREE.Points(pg,new THREE.PointsMaterial({color:0xaab4ff,size:.04,transparent:true,opacity:.55})));


 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const eo=x=>1-Math.pow(1-x,4);
 let mx=0,my=0,elapsed=0,last=0,raf=0,visible=true,disposed=false,lost=false;
 const pointer=e=>{if(e.pointerType==='touch')return;const r=host.getBoundingClientRect();mx=(e.clientX-r.left)/r.width*2-1;my=(e.clientY-r.top)/r.height*2-1;};
 const leave=()=>{mx=0;my=0;};host.addEventListener('pointermove',pointer);host.addEventListener('pointerleave',leave);
 function frame(now=0){
  if(disposed||lost)return;
  if(last)elapsed+=Math.min((now-last)/1000,.05);last=now;
  const el=reduced.matches?8:elapsed,t=reduced.matches?0:elapsed;
  group.rotation.y+=((reduced.matches?0:mx*.18)-group.rotation.y)*.05;
  group.rotation.x+=((reduced.matches?0:my*.09)-group.rotation.x)*.05;
  const sp=eo(clamp(el/1.8,0,1));
  laptop.scale.setScalar(Math.max(sp,.0001));
  laptop.rotation.y=-.3+(1-sp)*Math.PI*5;
  laptop.position.y=-1.6+Math.sin(t*.8)*.05;
  const op=inOut(clamp((el-2)/1.3,0,1));lidP.rotation.x=1.5-op*1.88;pl3.intensity=op*20;
  cards.forEach((c,i)=>{
   const d=c.userData,p=eo(clamp((el-3-i*.22)/1.8,0,1));
   const S=[0,-.2,-1.2],sw=Math.sin(p*Math.PI)*(i%2?-1.6:1.6);
   c.position.set(S[0]+(d.t.x-S[0])*p+sw,S[1]+(d.t.y-S[1])*p+Math.sin(t*.9+d.ph)*.12*p,S[2]+(d.t.z-S[2])*p);
   c.rotation.y=(1-p)*Math.PI*2+Math.sin(t*.6+d.ph)*.08*p;c.rotation.x=(1-p)*-.5;
   c.scale.setScalar(.15+.85*p);c.material.opacity=clamp(p*3,0,1);
  });
  pl1.position.x=-4+Math.sin(t*.6)*3;
  renderer.render(scene,camera);
  host.dataset.sceneState=el>=6?'complete':'opening';
  raf=visible&&!document.hidden&&!reduced.matches?requestAnimationFrame(frame):0;
 }
 function resume(){cancelAnimationFrame(raf);last=0;if(visible&&!document.hidden)frame();}
 const resize=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=w/h<1.1?14.5:12.5;camera.updateProjectionMatrix();group.position.set(0,.15,0);group.scale.setScalar(mobile?1.02:1.12);resume();});resize.observe(host);
 const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;resume();});observer.observe(host);
 document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);host.classList.remove('scene-ready');host.dataset.sceneState='fallback';renderer.domElement.style.visibility='hidden';});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;renderer.domElement.style.visibility='';host.classList.add('scene-ready');resume();});
 window.addEventListener('pagehide',e=>{if(e.persisted)return;disposed=true;cancelAnimationFrame(raf);resize.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);host.removeEventListener('pointermove',pointer);host.removeEventListener('pointerleave',leave);scene.traverse(o=>{o.geometry?.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){m?.map?.dispose();m?.dispose();}});renderer.dispose();});
 renderer.setSize(host.clientWidth,host.clientHeight,false);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();host.classList.add('scene-ready');frame();
}

// Small supplementary WebGL objects are created only as their sections approach.
const miniatureObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;miniatureObserver.unobserve(entry.target);initMiniature(entry.target).catch(()=>{});}},{rootMargin:'120px'});
document.querySelectorAll('[data-object],[data-path-art]').forEach(el=>miniatureObserver.observe(el));
async function initMiniature(el){
 const THREE=await import('./vendor/three.module.js');
 const low=matchMedia('(max-width:800px)').matches,motion=matchMedia('(prefers-reduced-motion:reduce)');
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:!low,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,low?1:1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,30);camera.position.set(0,1.3,4.5);camera.lookAt(0,0,0);
 scene.add(new THREE.HemisphereLight(0xe4eaff,0x8472a7,2.5));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-3,5,4);scene.add(light);
 const group=new THREE.Group();scene.add(group);
 const violet=new THREE.MeshStandardMaterial({color:0x9d8bde,roughness:.3,metalness:.22});
 const blue=new THREE.MeshStandardMaterial({color:0x97b2e8,roughness:.3,metalness:.18});
 function add(g,m=violet){const o=new THREE.Mesh(g,m);group.add(o);return o;}
 if(el.dataset.pathArt==='student'){
  const cap=add(new THREE.BoxGeometry(1.5,.11,1.5));cap.rotation.y=.6;
  const base=add(new THREE.CylinderGeometry(.47,.39,.40,24),blue);base.position.y=-.22;
  const button=add(new THREE.SphereGeometry(.06,12,8));button.position.y=.10;
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.10,0),new THREE.Vector3(.65,.13,.15),new THREE.Vector3(.85,-.05,.25),new THREE.Vector3(.87,-.48,.26)]);
  add(new THREE.TubeGeometry(curve,18,.018,6,false),new THREE.MeshStandardMaterial({color:0xdbb97a,metalness:.4,roughness:.4}));
  const tassel=add(new THREE.ConeGeometry(.06,.23,10),new THREE.MeshStandardMaterial({color:0xdbb97a}));tassel.position.set(.87,-.58,.26);tassel.rotation.z=Math.PI;
 }else if(el.dataset.pathArt==='teacher'){
  add(new THREE.BoxGeometry(1.85,1.15,.10),violet);
  const c=document.createElement('canvas');c.width=512;c.height=320;const ctx=c.getContext('2d');ctx.fillStyle='#f6f6ff';ctx.fillRect(0,0,512,320);ctx.fillStyle='#8383c5';ctx.font='38px Georgia';ctx.fillText('a² + b² = c²',65,115);ctx.fillStyle='#cbcde7';for(let i=0;i<4;i++)ctx.fillRect(65,160+i*26,310-i%2*70,5);
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
  const face=add(new THREE.PlaneGeometry(1.7,1.0),new THREE.MeshStandardMaterial({map,roughness:.8}));face.position.z=.057;
  for(const x of [-.6,.6]){const leg=add(new THREE.CylinderGeometry(.025,.025,1.2,8),blue);leg.position.set(x,-.6,-.06);leg.rotation.z=-x*.2;}
  group.rotation.y=-.24;
 }else{
  const geometries=[()=>new THREE.TorusKnotGeometry(.45,.13,low?48:80,low?6:10),()=>new THREE.OctahedronGeometry(.7,0),()=>new THREE.IcosahedronGeometry(.64,0)];
  add(geometries[Number(el.dataset.object)](),Number(el.dataset.object)===1?blue:violet);
 }
 el.append(renderer.domElement);el.classList.add('mini-ready');let visible=false,raf=0,time=0,last=0,disposed=false,lost=false;
 function draw(now=0){if(disposed||lost)return;time+=last?Math.min((now-last)/1000,.04):0;last=now;if(!motion.matches){group.rotation.y=time*.18+(el.dataset.pathArt==='teacher'?-.24:0);group.position.y=Math.sin(time*.8)*.04;}renderer.render(scene,camera);raf=visible&&!document.hidden&&!motion.matches?requestAnimationFrame(draw):0;}
 function resume(){cancelAnimationFrame(raf);last=0;if(visible&&!document.hidden)draw();}
 const resize=new ResizeObserver(()=>{renderer.setSize(el.clientWidth,el.clientHeight,false);camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();resume();});resize.observe(el);
 const visibility=new IntersectionObserver(([e])=>{visible=e.isIntersecting;resume();});visibility.observe(el);
 document.addEventListener('visibilitychange',resume);motion.addEventListener('change',resume);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);el.classList.remove('mini-ready');renderer.domElement.style.visibility='hidden';});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;el.classList.add('mini-ready');renderer.domElement.style.visibility='';resume();});
 window.addEventListener('pagehide',e=>{if(e.persisted)return;disposed=true;cancelAnimationFrame(raf);resize.disconnect();visibility.disconnect();document.removeEventListener('visibilitychange',resume);motion.removeEventListener('change',resume);scene.traverse(o=>{o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();});renderer.dispose();});
}
