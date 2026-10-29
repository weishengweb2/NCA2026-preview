import {pointsOfInterest,distance,navigate,interact,say} from './game-action-engine.js';
import {appointmentStatus} from './game-action-objectives.js';

// Guidance uses the same routes, collision checks and timed actions as manual play.
export function nextObjective(run,tracked){
 const pts=pointsOfInterest(run);
 const queued=pts.find(p=>p.id===run.guidedAction);
 if(queued)return queued;
 const lunch=pts.find(p=>p.type==='appointment'||p.type==='reschedule');
 if(lunch&&(appointmentStatus(run)==='missed'||run.appointment.closes-run.elapsed<35||!run.carrying&&run.completed.length>=2))return lunch;
 if(run.carrying)return pts.find(p=>p.type==='deliver');
 const extra=pts.find(p=>!['pickup','deliver','rest','coffee'].includes(p.type));
 return extra||pts.find(p=>p.type==='pickup'&&p.task===tracked)||pts.filter(p=>p.type==='pickup').sort((a,b)=>distance(a,run.player)-distance(b,run.player))[0]||null;
}
export function guideTo(run,point){
 if(!point||run.status!=='playing'||run.interactionId)return false;
 run.guidedAction=point.id;run.pulse=null;navigate(run,point);return true;
}
export function updateGuidance(run,input){
 if(!run.guidedAction)return;
 if(input.x||input.y){run.guidedAction=null;return;}
 const point=pointsOfInterest(run).find(p=>p.id===run.guidedAction);
 if(!point){run.guidedAction=null;return;}
 if(run.chat>0){run.guidedAction=null;return;}
 if(distance(run.player,point)<=52){run.guidedAction=null;interact(run,point.id);}
 else if(!run.route.length){run.guidedAction=null;say(run,'Route interrupted. Tap the next step to try again, or steer around.');}
}
export function objectiveLabel(point){
 if(!point)return 'Check your tasks';
 if(point.type==='finish')return 'Finish chapter · '+point.label;
 return point.prompt.replace(/ · \d+s$/,'');
}
