// Map keys are node names, not numeric array indices. Convert names once so
// every animated position stays finite and its phase is stable across routes.
export function phaseForNode(id){
 let hash=0;
 for(const char of id)hash=(Math.imul(hash,31)+char.codePointAt(0))>>>0;
 return hash/0xffffffff*Math.PI*2;
}
export function floatOffset(time,phase){
 return {y:Math.sin(time*.6+phase)*.05,z:Math.sin(time*.4+phase)*.06};
}
export function targetIsReady(distance,scale,targetScale,delayDone){
 return delayDone&&Number.isFinite(distance)&&distance<.25&&targetScale>0&&scale>=targetScale*.8;
}

const clamp01=value=>Math.min(1,Math.max(0,value));
const ease=value=>{const t=clamp01(value);return t*t*(3-2*t);};

// A physical depth journey: hidden behind the parent, around its shoulder,
// through the foreground, then into its readable resting orbit.
export function orbitArrival(origin,target,progress,{turn=1.1,depth=1.8}={}){
 const t=ease(progress),dx=target.x-origin.x,dy=target.y-origin.y;
 const radius=Math.hypot(dx,dy)*t,angle=Math.atan2(dy,dx)+turn*(1-t);
 return {x:origin.x+Math.cos(angle)*radius,y:origin.y+Math.sin(angle)*radius,
  z:origin.z-depth+(target.z-origin.z+depth)*t+Math.sin(Math.PI*t)*depth*.95};
}

// Promotion comes towards the viewer before settling into the identity core.
export function promoteArc(from,to,progress){
 const t=ease(progress),q=1-t,control={x:(from.x+to.x)/2,y:Math.max(from.y,to.y)+.38,z:Math.max(from.z,to.z)+2};
 return {x:q*q*from.x+2*q*t*control.x+t*t*to.x,y:q*q*from.y+2*q*t*control.y+t*t*to.y,z:q*q*from.z+2*q*t*control.z+t*t*to.z};
}

export function orbitBreath(time,phase){
 return {x:Math.sin(time*.28+phase)*.035,y:Math.sin(time*.4+phase)*.04,z:Math.sin(time*.33+phase)*.24};
}

// Tilt the orbital plane, not the brand form. The capsule stays upright.
export function perspectivePoint(point,centre,yaw,pitch){
 const x=point.x-centre.x,y=point.y-centre.y,z=point.z-centre.z;
 const rx=x*Math.cos(yaw)+z*Math.sin(yaw),rz=-x*Math.sin(yaw)+z*Math.cos(yaw);
 return {x:centre.x+rx,y:centre.y+y*Math.cos(pitch)-rz*Math.sin(pitch),z:centre.z+y*Math.sin(pitch)+rz*Math.cos(pitch)};
}
