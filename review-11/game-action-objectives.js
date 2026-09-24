// Observable game objectives: these cannot be checked off manually.
export function appointmentStatus(s){
 if(!s.appointment)return null;
 const a=s.appointment;
 if(a.done)return 'done';
 if(s.interactionId==='hotel-lunch')return 'attending';
 if(s.mode==='relaxed')return 'open';
 return s.elapsed<a.opens?'upcoming':s.elapsed<=a.closes?'open':'missed';
}
export function appointmentMessage(s){
 const status=appointmentStatus(s),a=s.appointment;
 if(!status)return '';
 if(status==='done')return `Hotel lunch ✓${a.reschedules?' · Rebooked and attended':' · Appointment kept'}`;
 if(status==='attending')return `At lunch · ${Math.ceil(s.interaction)}s · Room plan, menu, human conversation.`;
 if(status==='upcoming')return `Hotel lunch · Opens in ${Math.ceil(a.opens-s.elapsed)}s${a.reschedules?' · New slot':''}`;
 if(status==='missed')return 'Missed the hotel lunch? Use the phone beside the coffee machine to rebook.';
 return s.mode==='relaxed'?'Hotel lunch · Your table is ready. Allow 18 seconds.':`Hotel lunch · Arrive within ${Math.ceil(a.closes-s.elapsed)}s · Allow 18s at the table`;
}
export function showPhase(s){
 if(!s.show)return null;
 if(s.show.phase!=='setup')return s.show.phase;
 return s.completed.length===4||s.show.screen||s.interactionId==='screen-test'?'rehearsal':'setup';
}
export function showMessage(s){
 if(!s.show)return '';
 const p=showPhase(s);
 if(p==='live')return s.show.liveTime<12?'SHOW IS LIVE · You called it. Stay for the moment.':'SHOW IS LIVE · Enjoy it, then return to the stage to take a bow.';
 if(p==='arrivals')return s.show.arrived===s.show.crowd.length?'AUDIENCE READY · Return to the stage and call the show.':`DOORS OPEN · Audience arriving · ${Math.round(s.show.arrived/s.show.crowd.length*100)}% seated`;
 if(s.show.lights)return 'REHEARSAL COMPLETE · Open the doors at check-in.';
 if(s.show.screen)return 'SCREEN PASSED · Head to the lighting operator for the lighting rehearsal.';
 if(p==='rehearsal')return 'REHEARSAL · Head to AV and test the screen feed and backup.';
 return 'SETUP · Brief the crew, load the backup and prepare guest support.';
}
export function extraPoints(s){
 const pts=[],a=s.level.appointment,p=s.level.production;
 if(a&&!s.appointment.done){
  const status=appointmentStatus(s);
  if(status==='open'||status==='attending')pts.push({...a,id:'hotel-lunch',type:'appointment',label:'Hotel lunch',prompt:'Sit down with the hotel rep · 18s',seconds:a.duration});
  if(status==='missed')pts.push({...a.phone,id:'rebook-lunch',type:'reschedule',label:'Rebook lunch',prompt:'Call the hotel rep for a new lunch slot',seconds:4});
 }
 if(p){
  const ready=s.completed.length===s.level.tasks.length;
  if(ready&&!s.show.screen)pts.push({...p.screen,id:'screen-test',type:'screen-test',label:'Test screen',prompt:'Rehearse screen feed and backup · 6s',seconds:6});
  if(s.show.screen&&!s.show.lights)pts.push({...p.lights,id:'lights-test',type:'lights-test',label:'Rehearse lights',prompt:'Run the lighting cues · 6s',seconds:6});
  if(ready&&s.show.screen&&s.show.lights&&!s.show.doors)pts.push({...p.doors,id:'open-doors',type:'open-doors',label:'Open doors',prompt:'Give check-in the doors-open cue',seconds:2});
  if(s.show.phase==='arrivals'&&s.show.arrived===s.show.crowd.length)pts.push({...p.live,id:'go-live',type:'go-live',label:'Call the show',prompt:'Stand by… and GO!',seconds:2});
 }
 return pts;
}
export function checklist(s){
 const rows=s.level.tasks.map(t=>({id:t.id,label:t.name,state:s.completed.includes(t.id)?'done':s.carrying===t.id?'carrying':t.id==='prototype'&&s.completed.length<3?'locked':'todo',detail:s.completed.includes(t.id)?'Complete':s.carrying===t.id?'In your bag → '+t.label:t.item+' → '+t.label}));
 if(s.appointment)rows.push({id:'hotel-lunch',label:'Have lunch with the hotel representative',state:s.appointment.done?'done':appointmentStatus(s)==='attending'?'active':'todo',detail:appointmentMessage(s)});
 if(s.show){
  rows.push({id:'screen-test',label:'Test the screen feed and backup',state:s.show.screen?'done':s.completed.length===4?'todo':'locked',detail:s.show.screen?'Screen and backup rehearsed':'First complete the four setup jobs'});
  rows.push({id:'lights-test',label:'Rehearse the lighting cues',state:s.show.lights?'done':s.show.screen?'todo':'locked',detail:s.show.lights?'Lighting cue sequence passed':'After the screen test'});
  rows.push({id:'open-doors',label:'Open doors and welcome the audience',state:s.show.doors?'done':s.show.lights?'todo':'locked',detail:s.show.doors?'Doors open · Guests make their way into the room':'After both technical rehearsals'});
  rows.push({id:'go-live',label:'Call the live show',state:s.show.phase==='live'?'done':s.show.doors&&s.show.arrived===s.show.crowd.length?'todo':'locked',detail:s.show.phase==='live'?'The room, screen and lights are live':s.show.doors?showMessage(s):'Once the guests are in and ready'});
 }
 return rows;
}
export function objectiveProgress(s){const rows=checklist(s);return {done:rows.filter(r=>r.state==='done').length,total:rows.length};}
export function canFinish(s){const p=objectiveProgress(s);return p.done===p.total&&(!s.show||s.show.phase==='live'&&s.show.liveTime>=12);}
