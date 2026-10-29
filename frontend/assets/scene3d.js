// Optional, isolated enhancement: authentication never depends on WebGL.
const host = document.getElementById('book-scene');
if (host) init().catch(() => host.classList.remove('scene-ready'));
async function init() {
 const THREE = await import('./vendor/three.module.js');
 const mobile = matchMedia('(max-width:700px)').matches;
 const reduced = matchMedia('(prefers-reduced-motion:reduce)');
 const scene = new THREE.Scene();
 const camera = new THREE.PerspectiveCamera(34, 1, .1, 60);
 camera.position.set(0, 4.0, 7.3); camera.lookAt(0, .3, 0);
 const renderer = new THREE.WebGLRenderer({alpha:true, antialias:!mobile, powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.75));
 renderer.shadowMap.enabled = !mobile;
 renderer.shadowMap.type = THREE.PCFSoftShadowMap;
 renderer.toneMapping = THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure = 1.3;
 host.prepend(renderer.domElement);
 renderer.domElement.setAttribute('aria-hidden','true');
 scene.add(new THREE.HemisphereLight(0xe8eeff, 0x8573ad, 2.6));
 const key = new THREE.DirectionalLight(0xfff7e9, 4.2);
 key.position.set(-3, 7, 5); key.castShadow = !mobile;
 key.shadow.mapSize.set(1024,1024); key.shadow.camera.left=-5;key.shadow.camera.right=5;
 key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.normalBias=.025;
 key.shadow.radius=4; scene.add(key);
 const rim = new THREE.DirectionalLight(0xb3b8ff, 2.8); rim.position.set(4, 2, -3); scene.add(rim);
 const book = new THREE.Group(); scene.add(book);
 book.rotation.set(.10, -.23, -.10);
 const coverMat = new THREE.MeshStandardMaterial({color:0x7771c7,roughness:.38,metalness:.12});
 const paper = new THREE.MeshStandardMaterial({color:0xfffcef,roughness:.88,side:THREE.DoubleSide});
 const edgeMat = new THREE.MeshStandardMaterial({color:0xdad4c1,roughness:.9});
 function mesh(geo, mat, parent=book) { const obj=new THREE.Mesh(geo,mat); obj.castShadow=true;obj.receiveShadow=true;parent.add(obj);return obj; }
 // A real bent, solid page block on each side of the binding.
 function height(u) { return .16 + .21*Math.sin(u*Math.PI*.9) + .025*u; }
 for (const side of [-1,1]) {
  const half = new THREE.Group(); book.add(half);
  const cover=mesh(new THREE.BoxGeometry(1.94,.085,2.60),coverMat,half);
  cover.position.set(side*.98,-.115,0); cover.rotation.z=side*.035;
  const segments=mobile?14:28;
  const geo=new THREE.PlaneGeometry(1.82,2.43,segments,1);
  const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){
   const u=(pos.getX(i)+.91)/1.82;
   const z=pos.getY(i);
   pos.setXYZ(i,side*(.04+u*1.82),height(u),z);
  }
  geo.computeVertexNormals();mesh(geo,paper,half);
  // Layered page edges, each a curved strip with thickness.
  const layers=mobile?7:16;
  for(let j=0;j<layers;j++){
   const y=-.055+j*.012;
   for(const z of [-1.215,1.215]){
    const points=[];for(let i=0;i<=segments;i++){const u=i/segments;points.push(new THREE.Vector3(side*(.04+u*1.82),height(u)-.21+y,z));}
    const curve=new THREE.CatmullRomCurve3(points);
    mesh(new THREE.TubeGeometry(curve,segments,.007,3,false),j%3===0?edgeMat:paper,half);
   }
  }
  const outer=mesh(new THREE.BoxGeometry(.025,.22,2.43),paper,half);outer.position.set(side*1.85,height(1)-.11,0);
  // Printed typography rendered into the physical page surface.
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=768;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fffcef';ctx.fillRect(0,0,512,768);
  ctx.fillStyle='#aaa2c4';ctx.font='18px Georgia';ctx.fillText(side===-1?'B I L I M':'Б І Л І М',60,95);
  ctx.fillStyle='#474357';ctx.font='italic 38px Georgia';ctx.fillText(side===-1?'Өзіңді аш.':'Алға ұмтыл.',60,170);
  ctx.fillStyle='#d9d4cb';for(let i=0;i<17;i++)ctx.fillRect(60,220+i*23,i%5===4?235:385,3);
  ctx.fillStyle='#a6a0b9';ctx.font='16px Georgia';ctx.fillText(side===-1?'01':'02',240,708);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  const printed=geo.clone();const pp=printed.attributes.position;
  // UV orientation follows left/right page direction; offset prevents z-fighting.
  for(let i=0;i<pp.count;i++)pp.setY(i,pp.getY(i)+.003);
  mesh(printed,new THREE.MeshStandardMaterial({map:tex,roughness:.9,side:THREE.DoubleSide}),half);
 }
 const spine=mesh(new THREE.CylinderGeometry(.09,.09,2.6,12),coverMat);spine.rotation.x=Math.PI/2;spine.position.y=-.05;
 const ribbon=mesh(new THREE.BoxGeometry(.105,.012,.88),new THREE.MeshStandardMaterial({color:0xa99bee,roughness:.55}));ribbon.position.set(.20,.20,1.18);ribbon.rotation.x=.22;
 const floor=mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.10}),scene);floor.rotation.x=-Math.PI/2;floor.position.y=-.92;floor.castShadow=false;
 // Extruded mathematical symbols and a molecular model are real geometry.
 const symbols=[];
 const lilac=new THREE.MeshStandardMaterial({color:0xb2a0e7,metalness:.18,roughness:.30});
 const blue=new THREE.MeshStandardMaterial({color:0x93b6e3,metalness:.2,roughness:.3});
 const plus=new THREE.Group();mesh(new THREE.BoxGeometry(.48,.105,.105),lilac,plus);mesh(new THREE.BoxGeometry(.105,.48,.105),lilac,plus);plus.position.set(-2.25,1.0,-.1);scene.add(plus);symbols.push(plus);
 const shape=new THREE.Shape();shape.moveTo(.25,.35);shape.lineTo(-.27,.35);shape.lineTo(.03,0);shape.lineTo(-.27,-.35);shape.lineTo(.25,-.35);shape.lineTo(.25,-.22);shape.lineTo(-.05,-.22);shape.lineTo(.15,0);shape.lineTo(-.05,.22);shape.lineTo(.25,.22);shape.closePath();
 const sigma=mesh(new THREE.ExtrudeGeometry(shape,{depth:.10,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025}),lilac,scene);sigma.position.set(2.05,1.05,-.25);symbols.push(sigma);
 const atom=new THREE.Group(); const orbital=new THREE.TorusGeometry(.29,.014,6,mobile?28:48);
 for(let i=0;i<3;i++){const ring=mesh(orbital,blue,atom);ring.rotation.set(i*Math.PI/3,i*Math.PI/3,.4);}
 mesh(new THREE.SphereGeometry(.065,12,8),blue,atom);atom.position.set(-1.9,.25,1.25);scene.add(atom);symbols.push(atom);
 const ring=mesh(new THREE.TorusGeometry(.20,.055,8,32),lilac,scene);ring.position.set(1.95,.15,1.6);ring.rotation.x=.5;symbols.push(ring);
 symbols.forEach(s=>s.userData.base=s.position.y);
 let raf=0,visible=true,disposed=false,px=0,py=0,last=0,elapsed=0;
 const pointer=e=>{const rect=host.getBoundingClientRect();px=(e.clientX-rect.left)/rect.width-.5;py=(e.clientY-rect.top)/rect.height-.5;};
 const leave=()=>{px=0;py=0;};
 host.addEventListener('pointermove',pointer);host.addEventListener('pointerleave',leave);
 function render(now=0){
  if(disposed)return;
  elapsed+=last?Math.min((now-last)/1000,.05):0;last=now;
  if(!reduced.matches){book.position.y=Math.sin(elapsed*.8)*.085;book.rotation.y+=(-.23+px*.2+Math.sin(elapsed*.4)*.055-book.rotation.y)*.04;book.rotation.x+=(.10+py*.10-book.rotation.x)*.04;
   symbols.forEach((s,i)=>{s.position.y=s.userData.base+Math.sin(elapsed*.7+i)*.09;s.rotation.y=elapsed*.12+i*.4;});}
  renderer.render(scene,camera);
  if(visible&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(render);else raf=0;
 }
 function resume(){cancelAnimationFrame(raf);last=0;render();}
 const resize=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();resume();});resize.observe(host);
 const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)resume();else{cancelAnimationFrame(raf);raf=0;}});observer.observe(host);
 document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);host.classList.remove('scene-ready');renderer.domElement.style.visibility='hidden';});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{renderer.domElement.style.visibility='';host.classList.add('scene-ready');resume();});
 window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(raf);resize.disconnect();observer.disconnect();host.removeEventListener('pointermove',pointer);host.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);scene.traverse(o=>{o.geometry?.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){m?.map?.dispose();m?.dispose();}});renderer.dispose();},{once:true});
 renderer.setSize(host.clientWidth,host.clientHeight,false);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();render();host.classList.add('scene-ready');
}
