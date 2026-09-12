import * as THREE from 'three';
import {RoomEnvironment} from './identity05-RoomEnvironment.js';
import {phaseForNode,floatOffset,targetIsReady,orbitArrival,promoteArc,orbitBreath,perspectivePoint} from './identity05-motion.js';

export class IdentityScene{
 constructor({container,controls,graph,onReveal,onPreview,onUnpreview,onNavigate,onCore}){
  this.graph=graph;this.controls=controls;this.callbacks={onReveal,onPreview,onUnpreview,onNavigate,onCore};this.objects=new Map();this.view={path:['now'],revealed:false,preview:null,full:false,paused:false};this.hover=null;this.pointer=new THREE.Vector2();this.look=new THREE.Vector2();this.time=0;this.frame=0;this.visible=!document.hidden;
  this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;container.append(this.renderer.domElement);
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(36,1,.1,70);
  const pmrem=new THREE.PMREMGenerator(this.renderer),room=new RoomEnvironment();this.studio=pmrem.fromScene(room,.035);room.dispose();pmrem.dispose();this.scene.environment=this.studio.texture;
  this.scene.add(new THREE.HemisphereLight(0xe1eeff,0x292125,1.8));
  const key=new THREE.DirectionalLight(0xffffff,3.6);key.position.set(-4,6,6);this.scene.add(key);
  this.rim=new THREE.DirectionalLight(0x9cb7da,2.8);this.rim.position.set(5,3,-4);this.scene.add(this.rim);
  this.warm=new THREE.PointLight(0xff4e00,28,25);this.warm.position.set(4,-3,4);this.scene.add(this.warm);
  this.textures=new Map();this.loader=new THREE.TextureLoader();
  this.cubeTarget=new THREE.WebGLCubeRenderTarget(128,{generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter,type:THREE.HalfFloatType});this.cube=new THREE.CubeCamera(.1,50,this.cubeTarget);this.cube.layers.enable(1);this.scene.add(this.cube);
  const panels=[[-5,3,5,3,7,0xffffff],[5,1,4,1.5,8,0xffffff],[0,-4,3,10,2,0xff4e00],[0,5,-5,8,5,0x8a9db6]];
  panels.forEach(([x,y,z,w,h,color])=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));p.position.set(x,y,z);p.lookAt(0,0,0);p.layers.set(1);this.scene.add(p);});
  this.reflections=[];
  for(let i=0;i<3;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(4.8,3.5),new THREE.MeshBasicMaterial({map:this.texture(['./identity05-media-listerine.webp','./identity05-media-canalys-stage.webp','./identity05-media-dell-sydney-2024.webp'][i]),side:THREE.DoubleSide}));const a=i*2.1;p.position.set(Math.cos(a)*4.8,Math.sin(a)*2.8,5);p.lookAt(0,0,0);p.layers.set(1);this.scene.add(p);this.reflections.push(p);}
  this.particles=[];const geo=new THREE.SphereGeometry(1,12,10);const mats=[new THREE.MeshStandardMaterial({color:0xf45b22,metalness:.7,roughness:.25}),new THREE.MeshStandardMaterial({color:0xc9d2cd,metalness:1,roughness:.22})];
  for(let i=0;i<42;i++){const a=i*2.39996,r=2+Math.sqrt(i/42)*4;const p=new THREE.Mesh(geo,mats[i%2]);const b=new THREE.Vector3(Math.cos(a)*r+1.5,Math.sin(a)*r*.8,-4-(i%5));p.position.copy(b);p.scale.setScalar(.025+(i%3)*.021);this.scene.add(p);this.particles.push({mesh:p,base:b});}
  this.linePositions=new Float32Array(180*6);const lineGeometry=new THREE.BufferGeometry();lineGeometry.setAttribute('position',new THREE.BufferAttribute(this.linePositions,3).setUsage(THREE.DynamicDrawUsage));lineGeometry.setDrawRange(0,0);
  this.lines=new THREE.LineSegments(lineGeometry,new THREE.LineBasicMaterial({color:0x86979d,transparent:true,opacity:.085,depthWrite:false}));this.lines.frustumCulled=false;this.scene.add(this.lines);
  this.projected=new THREE.Vector3();this.resize();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);
  document.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')this.pointer.set(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5);});document.addEventListener('pointerleave',()=>this.pointer.set(0,0));
  document.addEventListener('visibilitychange',()=>{this.visible=!document.hidden;});
  this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.getElementById('render-notice').textContent='The 3D view paused. Menu and Back remain available.';});
  this.last=performance.now();this.running=true;this.update(this.view);this.animate=this.animate.bind(this);requestAnimationFrame(this.animate);
 }
 texture(url){if(!this.textures.has(url)){const t=this.loader.load(url,undefined,undefined,()=>console.warn('Preview image unavailable:',url));t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,this.renderer.capabilities.getMaxAnisotropy());this.textures.set(url,t);}return this.textures.get(url);}
 resize(){const wasMobile=this.mobile;this.width=innerWidth;this.height=innerHeight;this.mobile=this.width<=700;this.baseDistance=this.mobile?14.6:12.4;this.camera.aspect=this.width/this.height;this.camera.position.set(0,0,this.baseDistance);this.camera.updateProjectionMatrix();this.renderer.setSize(this.width,this.height);this.worldH=2*Math.tan(THREE.MathUtils.degToRad(18))*this.camera.position.z;this.worldW=this.worldH*this.camera.aspect;this.centre=new THREE.Vector3(this.mobile?0:this.worldW*.14,this.mobile?-1.18:-.35,0);if(this.active&&wasMobile!==this.mobile)this.update(this.view);else this.layout();}
 object(id){
  if(this.objects.has(id))return this.objects.get(id);
  const data=this.graph[id];const body=2/.815-2;const geometry=new THREE.CapsuleGeometry(1,body,14,48,1);const original=new Float32Array(geometry.attributes.position.array);
  const material=new THREE.MeshPhysicalMaterial({color:0xffffff,map:data.image?this.texture(data.image):null,metalness:data.image?.1:1,roughness:data.image?.24:.15,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.15});
  const mesh=new THREE.Mesh(geometry,material);mesh.position.copy(this.centre);mesh.scale.setScalar(.001);this.scene.add(mesh);
  const button=document.createElement('button');button.type='button';button.hidden=true;button.className='orb-hit';button.dataset.node=id;button.innerHTML='<span class="orb-centre" aria-hidden="true"></span><span class="orb-name"></span>';button.setAttribute('aria-label','Explore '+data.label);this.controls.append(button);
  const o={id,data,phase:phaseForNode(id),mesh,material,original,body,button,name:button.querySelector('.orb-name'),target:this.centre.clone(),velocity:new THREE.Vector3(),scale:0,targetScale:0,morph:0,lastMorph:-1,role:'hidden',path:[],delay:0,arrival:null,promotion:null,departure:null};this.objects.set(id,o);
  const hover=()=>{this.hover=id;if(o.role==='core')this.callbacks.onReveal();else if(o.role==='satellite'||o.role==='preview')this.callbacks.onPreview(id);};
  button.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')hover();});button.addEventListener('focus',hover);
  const leave=()=>{if(this.hover===id)this.hover=null;if(o.role==='satellite'||o.role==='preview')this.callbacks.onUnpreview?.(id);};
  button.addEventListener('pointerleave',leave);button.addEventListener('blur',leave);
  button.addEventListener('click',()=>{if(o.role==='core')this.callbacks.onCore();else this.callbacks.onNavigate(o.path);});return o;
 }
 update(view){
  const previous=this.view.path.at(-1),previousActive=this.active;this.view={...view};const activeId=(view.scenePath||view.path).at(-1)||'now';this.active=activeId;this.childIds=view.visibleChildren||this.graph[activeId].children;
  if(previous!==view.path.at(-1)){this.hover=null;this.controls.setAttribute('aria-label','Explore '+this.graph[activeId].label);}
  this.keep=new Set([activeId]);
  const main=this.object(activeId);
  if(previousActive!==activeId&&main.scale>.04&&!view.full)main.promotion={from:main.mesh.position.clone(),start:this.time,duration:.95};
  main.arrival=null;main.departure=null;main.role='core';main.path=view.scenePath||view.path;main.button.hidden=view.full;main.button.className='orb-hit main-orb';main.button.setAttribute('aria-label',view.coreAction==='back'?'Back to '+view.backLabel:'Reveal '+main.data.label+' world');main.button.removeAttribute('aria-haspopup');main.button.setAttribute('aria-expanded',String(view.revealed));main.button.querySelector('.orb-centre').textContent=activeId==='now'?'NOW':main.data.shortLabel||main.data.label;main.name.textContent=view.coreAction==='back'?'← Back':view.revealed?'Explore more':'Reveal this world';main.material.envMap=this.cubeTarget.texture;main.material.map=null;main.material.metalness=1;main.material.roughness=.15;main.material.needsUpdate=true;
  if(!view.full&&view.revealed){this.childIds.forEach((id,i)=>this.describe(this.object(id),'satellite',[...view.path,id],i));}
  if(!view.full&&view.revealed&&view.preview&&this.childIds.includes(view.preview))(view.previewChildren||[]).forEach((id,i)=>this.describe(this.object(id),'preview',[...view.path,view.preview,id],i));
  this.objects.forEach(o=>{if(!this.keep.has(o.id)){if(o.role!=='hidden')o.departure={from:o.mesh.position.clone(),origin:this.centre.clone(),start:this.time,scale:o.scale,duration:view.full?.28:.72};o.arrival=null;o.promotion=null;o.role='hidden';o.button.hidden=true;o.targetScale=0;if(o.material.envMap){o.material.envMap=null;o.material.needsUpdate=true;}}o.button.dataset.dimmed=String(o.role==='satellite'&&!!view.preview&&o.id!==view.preview);});
  // Re-inserting a focused button cancels its native click between pointerdown
  // and pointerup. Only reorder when the active sphil actually changes.
  if(this.controls.firstElementChild!==main.button)this.controls.prepend(main.button);
  const current=this.graph[activeId];const images=[view.filtered?null:current.image,...this.childIds.map(id=>this.graph[id].image)].filter(Boolean);
  this.reflections.forEach((p,i)=>{p.visible=images.length>0;if(images.length){p.material.map=this.texture(images[i%images.length]);p.material.needsUpdate=true;}});
  this.layout();
 }
 describe(o,role,path,i){const wasHidden=o.role==='hidden',parentId=role==='preview'?this.view.preview:this.active;this.keep.add(o.id);o.role=role;o.path=path;o.departure=null;o.promotion=null;if(wasHidden)o.button.hidden=true;o.button.className='orb-hit '+(role==='preview'?'preview-orb':'satellite-orb');o.button.setAttribute('aria-label','Explore '+o.data.label);o.button.removeAttribute('aria-haspopup');o.button.removeAttribute('aria-expanded');o.button.dataset.expanded=String(this.view.preview===o.id);o.button.querySelector('.orb-centre').textContent=o.data.image?'':String(i+1).padStart(2,'0');o.name.textContent=o.data.label;o.material.envMap=null;o.material.map=o.data.image?this.texture(o.data.image):null;o.material.metalness=o.data.image?.1:1;o.material.roughness=o.data.image?.24:.15;o.material.needsUpdate=true;
  if(wasHidden){const parent=this.objects.get(parentId);o.delay=this.time+i*.12+(this.objects.get(this.active)?.promotion?.duration||0)*.45;const origin=role==='preview'&&parent?parent.target.clone():this.centre.clone();const depth=role==='preview'?.95:1.9;o.arrival={origin,start:o.delay,duration:role==='preview'?.92:1.18,turn:(i%2?-1:1)*(role==='preview'?.85:1.2),depth};o.mesh.position.set(origin.x,origin.y,origin.z-depth);o.velocity.set(0,0,0);o.scale=0;}
 }
 layout(){
  if(!this.active)return;
  const main=this.object(this.active);main.target.copy(this.centre);main.targetScale=this.mobile?(this.view.revealed?.69:.91):(this.view.revealed?.96:1.3);
  const satellites=this.childIds.map(id=>this.objects.get(id)).filter(o=>o?.role==='satellite');const count=satellites.length;
  const layouts={1:[[1.9,.6]],2:[[-1.8,.9],[1.9,-.65]],3:[[-1.95,.85],[1.15,1.9],[1.8,-1.6]],4:[[-1.9,1.15],[1.9,1.3],[1.8,-1.7],[-1.8,-1.7]],5:[[-2.2,1.05],[.1,1.95],[2.2,.7],[1.5,-1.9],[-1.5,-1.9]],6:[[-2.3,1.05],[0,2.05],[2.3,1.05],[2,-1.55],[0,-2.25],[-2,-1.55]]};
  const points=layouts[count]||layouts[6];
  satellites.forEach((o,i)=>{const p=points[i%points.length];const sx=this.mobile?.58:Math.min(1,this.worldW/11.7);const sy=this.mobile?.85:Math.min(1,this.height/810);const depth=[-.68,.5,-.32,.7,-.48,.24][i];o.target.set(this.centre.x+p[0]*sx,this.centre.y+p[1]*sy,depth);o.targetScale=this.mobile?.32:.51;});
  const previews=(this.graph[this.view.preview]?.children||[]).map(id=>this.objects.get(id)).filter(o=>o?.role==='preview');const parent=this.objects.get(this.view.preview);
  previews.forEach((o,i)=>{
   if(!parent)return;const dx=parent.target.x-this.centre.x,dy=parent.target.y-this.centre.y;
   if(this.mobile){
    const gap=this.worldH*96/this.height,top=this.worldH*.5-this.worldH*300/this.height,bottom=-this.worldH*.5+this.worldH*165/this.height;
    if(dy>Math.abs(dx)*1.2){o.target.set((i-(previews.length-1)/2)*this.worldW*.3,Math.min(top,parent.target.y+.9),.35);}
    else {const mid=THREE.MathUtils.clamp(parent.target.y,bottom+gap,top-gap);o.target.set((dx<0?-1:1)*this.worldW*.33,mid+((previews.length-1)/2-i)*gap,.35);}
   }else{
    const a=Math.atan2(dy,dx)+(i-1)*.87;const x=parent.target.x+Math.cos(a)*1.12,y=parent.target.y+Math.sin(a)*1.12;const ymin=-this.worldH*.5+this.worldH*140/this.height,ymax=this.worldH*.5-this.worldH*190/this.height;o.target.set(THREE.MathUtils.clamp(x,-this.worldW*.08,this.worldW*.43),THREE.MathUtils.clamp(y,ymin,ymax),.6+i*.07);
   }o.target.z+=(i-1)*.28;o.targetScale=.235;
  });
 }
 cornerTarget(){const x=this.mobile?50:62,y=this.height-(this.mobile?61:70);const p=new THREE.Vector3(x/this.width*2-1,1-y/this.height*2,.5).unproject(this.camera);const d=p.sub(this.camera.position).normalize();return this.camera.position.clone().addScaledVector(d,-this.camera.position.z/d.z);}
 animate(now){
  if(!this.running)return;requestAnimationFrame(this.animate);const dt=Math.min((now-this.last)/1000,.034);this.last=now;if(!this.visible)return;
  this.frame++;if(!this.view.paused)this.time+=dt;
  const still=this.view.paused||this.view.full;
  this.look.lerp(still?new THREE.Vector2():this.pointer,.045);
  const yaw=still?0:this.look.x*(this.mobile?.1:.16)+Math.sin(this.time*.14)*.007;
  this.camera.position.set(Math.sin(yaw)*this.baseDistance,still?0:-this.look.y*.58+Math.sin(this.time*.11)*.035,Math.cos(yaw)*this.baseDistance+(still?0:Math.sin(this.time*.17)*.04));this.camera.lookAt(this.mobile?0:.1,0,0);this.camera.updateMatrixWorld();
  this.warm.position.x=4+this.look.x*2;this.rim.position.x=5-this.look.x*1.5;
  const main=this.objects.get(this.active);if(this.view.full){main.target.copy(this.cornerTarget());main.targetScale=(this.worldH/this.height)*(this.mobile?25:29);}
  let lineOffset=0,moving=false;
  this.objects.forEach(o=>{
   const visible=o.role!=='hidden',hover=this.hover===o.id;const target=o.target.clone();
   const delayDone=this.view.paused||this.time>=o.delay;let scale=visible&&delayDone?o.targetScale:0;
   o.motion='settled';
   if(this.view.paused){o.arrival=null;o.promotion=null;o.departure=null;}
   else if(o.departure){const a=o.departure,t=Math.min(1,(this.time-a.start)/a.duration);target.copy(orbitArrival(a.origin,a.from,1-t,{turn:-.7,depth:2}));scale=a.scale*Math.pow(1-t,.65);o.motion='receding';moving=true;if(t>=1)o.departure=null;}
   else if(visible&&!this.view.full){
    if(o.arrival){const a=o.arrival,t=(this.time-a.start)/a.duration;target.copy(orbitArrival(a.origin,o.target,t,a));o.motion=t<0?'behind-parent':'orbiting-in';moving=true;if(t>=1)o.arrival=null;}
    else if(o.promotion){const a=o.promotion,t=(this.time-a.start)/a.duration;target.copy(promoteArc(a.from,o.target,t));o.motion='coming-forward';moving=true;if(t>=1)o.promotion=null;}
    else{const offset=o.role==='core'?floatOffset(this.time,o.phase):orbitBreath(this.time,o.phase);target.x+=offset.x||0;target.y+=offset.y;target.z+=offset.z;}
    if(o.role!=='core')target.copy(perspectivePoint(target,this.centre,this.look.x*.16,this.look.y*.1));
   }
   const morph=(o.role==='core'&&(this.view.revealed||this.view.full)||hover)?1:0;
   if(this.view.paused){o.mesh.position.copy(target);o.scale=scale;o.morph=morph;}
   else{o.velocity.addScaledVector(target.clone().sub(o.mesh.position),dt*105);o.velocity.multiplyScalar(Math.exp(-10.5*dt));o.mesh.position.addScaledVector(o.velocity,dt);o.scale+=(scale-o.scale)*Math.min(1,dt*10);o.morph+=(morph-o.morph)*Math.min(1,dt*7);}
   o.ready=targetIsReady(o.mesh.position.distanceTo(target),o.scale,o.targetScale,delayDone&&!o.arrival&&!o.promotion);
   const pulse=this.view.full&&!this.view.paused?1+Math.sin(this.time*2.15)*.055:1;
   o.mesh.visible=o.scale>.002;o.mesh.scale.setScalar(o.scale*(hover&&o.role!=='core'?1.07:1)*pulse);o.mesh.rotation.set(0,0,0);
   if(Math.abs(o.lastMorph-o.morph)>.0001){const position=o.mesh.geometry.attributes.position;
    for(let j=0;j<position.count;j++){const y=o.original[j*3+1];position.array[j*3+1]=y-Math.sign(y)*o.body*.5*(1-o.morph);}position.needsUpdate=true;o.mesh.geometry.computeVertexNormals();o.lastMorph=o.morph;
   }
  });
  // Project the real meshes after the whole scene has moved. Native targets
  // follow depth and occlusion too, rather than floating over hidden objects.
  const visibleObjects=[...this.objects.values()].filter(o=>o.role!=='hidden'&&o.mesh.visible);
  const cameraRight=new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion);
  visibleObjects.forEach(o=>{this.projected.copy(o.mesh.position).project(this.camera);const edge=o.mesh.position.clone().addScaledVector(cameraRight,o.scale).project(this.camera);o.screen={x:(this.projected.x*.5+.5)*this.width,y:(-.5*this.projected.y+.5)*this.height,depth:o.mesh.position.distanceTo(this.camera.position),radius:Math.abs(edge.x-this.projected.x)*this.width*.5};});
  if(!this.view.full)visibleObjects.forEach(o=>{
   const {x,y,depth,radius}=o.screen;
   const occluded=visibleObjects.some(p=>p!==o&&p.screen.depth+.1<depth&&p.screen.radius>radius*.7&&Math.hypot(p.screen.x-x,p.screen.y-y)<p.screen.radius*.8);
   o.button.hidden=occluded||(o.role!=='core'&&!o.ready);o.button.dataset.occluded=String(occluded);o.button.dataset.motion=o.motion;o.button.dataset.depth=o.mesh.position.z.toFixed(3);
   o.button.style.left=x+'px';o.button.style.top=y+'px';o.button.style.zIndex=String(1000-Math.round(depth*10));o.button.style.setProperty('--depth-scale',THREE.MathUtils.clamp(this.baseDistance/depth,.84,1.16).toFixed(3));o.button.style.opacity=Math.min(1,o.scale/Math.max(.001,o.targetScale))*THREE.MathUtils.clamp(1.03-(depth-this.baseDistance)*.11,.72,1);
   const half=this.mobile?75:o.role==='preview'?105:110;o.name.style.marginLeft=(THREE.MathUtils.clamp(x,half+12,this.width-half-12)-x)+'px';
   if(o.role!=='core'){
    const parent=o.role==='preview'?this.objects.get(this.view.preview):main;
    if(parent){for(let i=0;i<10&&lineOffset+6<=this.linePositions.length;i++){const a=orbitArrival(parent.mesh.position,o.mesh.position,i/10,{turn:.8,depth:1.3}),b=orbitArrival(parent.mesh.position,o.mesh.position,(i+1)/10,{turn:.8,depth:1.3});this.linePositions.set([a.x,a.y,a.z,b.x,b.y,b.z],lineOffset);lineOffset+=6;}}
   }
  });
  this.particles.forEach((p,i)=>{p.mesh.visible=!this.view.full;p.mesh.position.x=p.base.x+this.look.x*(i%4)*.05;p.mesh.position.y=p.base.y+Math.sin(this.time*.2+i)*.08;});
  this.lines.geometry.attributes.position.needsUpdate=true;this.lines.geometry.setDrawRange(0,lineOffset/3);this.lines.visible=!this.view.full;
  if(this.frame%(moving?4:10)===0||this.frame===1){main.mesh.visible=false;this.cube.position.copy(main.mesh.position);this.scene.background=new THREE.Color(0x56606b);this.cube.update(this.renderer,this.scene);this.scene.background=null;main.mesh.visible=true;}
  this.renderer.render(this.scene,this.camera);
 }
}
