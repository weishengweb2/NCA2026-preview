export function steeringVector(x,y){
 const length=Math.hypot(x,y);
 if(length<12)return {x:0,y:0};
 return {x:x/length,y:y/length};
}
export function installTouchSteering(root,{enabled,onChange}){
 let pointer=null,pad=null;
 function vector(x,y){
  onChange({x,y});
  pad?.style.setProperty('--steer-x',`${x*15}px`);pad?.style.setProperty('--steer-y',`${y*15}px`);
 }
 function reset(){
  vector(0,0);pad?.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));
  pointer=null;pad=null;
 }
 root.addEventListener('pointerdown',e=>{
  const surface=e.target.closest('.dpad');
  if(!surface||!enabled()||pointer!==null)return;
  e.preventDefault();pad=surface;pointer=e.pointerId;pad.setPointerCapture(pointer);
  const d=e.target.closest('[data-direction]')?.dataset.direction;
  if(d){vector(d==='right'?1:d==='left'?-1:0,d==='down'?1:d==='up'?-1:0);}
  else move(e);
 });
 function move(e){
  if(e.pointerId!==pointer||!pad)return;
  e.preventDefault();const r=pad.getBoundingClientRect();
  const v=steeringVector(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2);vector(v.x,v.y);
 }
 root.addEventListener('pointermove',move);
 for(const type of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(type,e=>{if(e.pointerId===pointer)reset();});
 return reset;
}
