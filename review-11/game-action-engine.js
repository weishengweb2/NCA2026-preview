import {LEVELS,W,H} from './game-action-data.js';
import {extraPoints,canFinish,objectiveProgress} from './game-action-objectives.js';
export const CELL=32,RADIUS=15;
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rand=n=>{let s=n;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};};
export function blocked(level,x,y,r=RADIUS){return x<r+24||y<r+24||x>W-r-24||y>H-r-24||level.obstacles.some(o=>o.type!=='rug'&&x>o.x-r&&x<o.x+o.w+r&&y>o.y-r&&y<o.y+o.h+r);}
export function pathTo(level,from,to){const cols=W/CELL,rows=H/CELL,ix=v=>clamp(Math.floor(v/CELL),1,cols-2),iy=v=>clamp(Math.floor(v/CELL),1,rows-2),start=iy(from.y)*cols+ix(from.x);let end=iy(to.y)*cols+ix(to.x);const pass=n=>!blocked(level,(n%cols+.5)*CELL,(Math.floor(n/cols)+.5)*CELL);
 if(!pass(end)){let best=null;for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++){const n=end+y*cols+x;if(n>=0&&n<cols*rows&&pass(n)&&(!best||Math.hypot(x,y)<best.d))best={n,d:Math.hypot(x,y)};}if(!best)return [];end=best.n;}
 const q=[start],prev=new Map([[start,null]]);let cursor=0;while(cursor<q.length){const n=q[cursor++];if(n===end)break;for(const d of [-cols,cols,-1,1]){const k=n+d;if(k<0||k>=cols*rows||prev.has(k)||!pass(k)||Math.abs(k%cols-n%cols)>1)continue;prev.set(k,n);q.push(k);}}
 if(!prev.has(end))return [];const route=[];let n=end;while(n!==start){route.push({x:(n%cols+.5)*CELL,y:(Math.floor(n/cols)+.5)*CELL});n=prev.get(n);}return route.reverse();}
export function freshCampaign(){return {version:3,level:0,results:[],mode:'standard',character:'orange'};}
export function validCampaign(v){return !!v&&v.version===3&&Number.isInteger(v.level)&&v.level>=0&&v.level<=5&&['standard','relaxed'].includes(v.mode)&&['orange','cream','sage'].includes(v.character)&&Array.isArray(v.results)&&v.results.length===v.level&&v.results.every((r,i)=>r&&Number.isFinite(r.score)&&r.score>=0&&r.score<=100&&Number.isFinite(r.balance)&&r.balance>=0&&r.balance<=84&&Number.isInteger(r.sparks)&&r.sparks>=0&&r.sparks<=3&&Number.isFinite(r.energy)&&r.energy>=0&&r.energy<=100&&r.tasks===4&&r.objectives===[4,5,4,4,8][i]&&(i!==1||r.lunch===true)&&(i!==4||r.live===true));}
export function createRun(index,campaign=freshCampaign()){const level=LEVELS[index],rng=rand(index+91);return {index,level,mode:campaign.mode,character:campaign.character,player:{...level.spawn,dx:0,dy:1,walk:0},elapsed:0,remaining:level.duration,energy:index===4?Math.max(65,campaign.results[3]?.energy||80):82,focus:100,balance:0,completed:[],carrying:null,sparks:[],pickups:[],hits:0,boundaries:0,restCount:0,coffeeCount:0,cooldown:0,invulnerable:0,burst:0,chat:0,route:[],target:null,interaction:0,interactionId:null,progress:0,status:'playing',toast:'',toastTime:0,phoneOff:false,particles:[],hazards:level.hazards.map((h,i)=>({...h,home:{x:h.x,y:h.y},path:[],repath:0,stun:0,angle:rng()*6.28,walk:0,dx:0,dy:1,id:i})),npcs:level.npcs.map((n,i)=>({...n,home:{x:n.x,y:n.y},phase:i*1.6})),appointment:level.appointment?{done:false,opens:level.appointment.opens,closes:level.appointment.closes,reschedules:0}:null,show:level.production?{phase:'setup',screen:false,lights:false,doors:false,arrived:0,crowd:[],liveTime:0,arrivalTime:0}:null,seed:index+1};}
export function say(s,text){s.toast=text;s.toastTime=4;}
function celebrate(s){for(let i=0;i<12;i++){const a=i*Math.PI/6;s.particles.push({x:s.player.x,y:s.player.y-20,vx:Math.cos(a)*90,vy:Math.sin(a)*90-45,life:.75+i%3*.12});}}
export function navigate(s,to){s.route=pathTo(s.level,s.player,to);s.target=to;}
function move(s,p,dx,dy,dt,speed){const n=Math.hypot(dx,dy);if(!n)return false;dx/=n;dy/=n;const steps=Math.max(1,Math.ceil(speed*dt/8));const unit=speed*dt/steps;let moved=false;for(let i=0;i<steps;i++){if(!blocked(s.level,p.x+dx*unit,p.y)){p.x+=dx*unit;moved=true;}if(!blocked(s.level,p.x,p.y+dy*unit)){p.y+=dy*unit;moved=true;}}if(moved){p.dx=dx;p.dy=dy;p.walk+=dt*speed*.065;}return moved;}
function follow(s,p,path,dt,speed){while(path.length&&distance(p,path[0])<10)path.shift();if(!path.length)return false;return move(s,p,path[0].x-p.x,path[0].y-p.y,dt,speed);}
export function boundary(s){if(s.status!=='playing'||s.cooldown>0)return false;s.cooldown=7;s.burst=.7;s.chat=0;s.invulnerable=1.2;let useful=false;for(const h of s.hazards)if(!s.phoneOff&&h.stun===0&&distance(s.player,h)<185){useful=true;h.stun=4.8;h.path=pathTo(s.level,h,h.home);}if(useful)s.boundaries++;say(s,['“I’ll come back to you at two.”','“Let me finish this first.”','“The team has it. I’m stepping away.”'][s.boundaries%3]);return true;}
export function pointsOfInterest(s){const pts=[];for(const t of s.level.tasks){if(s.completed.includes(t.id))continue;if(s.carrying===t.id)pts.push({...t.to,id:'deliver-'+t.id,task:t.id,type:'deliver',label:t.label,prompt:'Deliver '+t.item.toLowerCase(),seconds:1.1});else if(!s.carrying&&!(t.id==='prototype'&&s.completed.length<3))pts.push({...t.from,id:'pickup-'+t.id,task:t.id,type:'pickup',label:t.item,prompt:'Pick up '+t.item.toLowerCase(),seconds:.55});}
 pts.push(...extraPoints(s));
 if(s.show?.phase!=='live'){pts.push({...s.level.rest,id:'rest',type:'rest',prompt:s.restCount>=2?'Rest spot used':'Take a proper breath',seconds:2.6,disabled:s.restCount>=2});pts.push({...s.level.coffee,id:'coffee',type:'coffee',prompt:s.coffeeCount>=2?'Enough caffeine for now':s.level.coffee.kind==='water'?'Have some water':'Get that coffee',seconds:2.5,disabled:s.coffeeCount>=2});}
 if(canFinish(s))pts.push({...s.level.finish,id:'finish',type:'finish',prompt:s.index===3?'Close the day. Get some sleep.':s.index===4?'Take a bow. You made this happen.':'Finish this chapter',seconds:1.5});return pts;}
export function nearest(s){return pointsOfInterest(s).filter(p=>!p.disabled).sort((a,b)=>distance(a,s.player)-distance(b,s.player))[0]||null;}
function finishSpecial(s,p){
 if(p.type==='appointment'){s.appointment.done=true;s.energy=clamp(s.energy+25,0,100);s.focus=clamp(s.focus+8,0,100);s.balance+=8;s.chat=0;s.invulnerable=2;celebrate(s);say(s,'Room plan checked. Menu agreed. Lunch actually eaten.');}
 if(p.type==='reschedule'){s.appointment.reschedules++;s.appointment.opens=s.elapsed+12;s.appointment.closes=s.elapsed+67;say(s,'A new table in 12 seconds. Protect this slot.');}
 if(p.type==='screen-test'){s.show.screen=true;celebrate(s);say(s,'Main feed. Backup. Playback. Screen rehearsal passed. Lights next.');}
 if(p.type==='lights-test'){s.show.lights=true;celebrate(s);say(s,'Walk-in, presentation, big reveal. Lighting cues rehearsed. Open doors.');}
 if(p.type==='open-doors'){
  s.show.doors=true;s.show.phase='arrivals';s.show.arrivalTime=0;
  const seats=[432,768,1120].flatMap(x=>[384,480,592,720].map(y=>({x,y}))).concat([512,800,1056].flatMap(x=>[560,800].map(y=>({x,y}))));
  s.show.crowd=seats.map((seat,i)=>({x:176,y:864,seat,path:[],delay:i*.45,entered:false,seated:false,walk:0,dx:0,dy:-1,color:['#d3a06e','#899fad','#ad8d9c','#a8b78b'][i%4]}));
  say(s,'Doors are open. The room is coming to life. Let the guests get settled.');
 }
 if(p.type==='go-live'){s.show.phase='live';s.show.liveTime=0;s.chat=0;s.hazards.forEach(h=>h.stun=999);celebrate(s);say(s,'STAND BY… GO! Your idea. A full room. This is the moment.');}
}
function tickAudience(s,dt){
 if(!s.show?.doors)return;
 if(s.show.phase==='live')s.show.liveTime+=dt;
 s.show.arrivalTime+=dt;
 for(const g of s.show.crowd){
  if(!g.entered&&s.show.arrivalTime>=g.delay){g.entered=true;g.path=pathTo(s.level,g,g.seat);}
  if(!g.entered||g.seated)continue;
  follow(s,g,g.path,dt,118);
  if(!g.path.length&&distance(g,g.seat)<40){g.seated=true;g.dx=0;g.dy=-1;s.show.arrived++;}
 }
}
export function interact(s){if(s.status!=='playing'||s.interactionId)return false;const p=nearest(s);if(!p||distance(p,s.player)>62){say(s,'Move closer to a marked object or person, then use DO.');return false;}s.interactionId=p.id;s.interaction=p.seconds;s.progress=0;s.route=[];s.target=null;if(p.type==='appointment')say(s,'Phone down. Lunch is an appointment too.');return true;}
function finishInteraction(s,p){finishSpecial(s,p);if(p.type==='pickup'){s.carrying=p.task;s.pickups.push(p.task);say(s,p.prompt.replace('Pick up','Got')+'. Follow the orange destination marker.');}if(p.type==='deliver'){s.completed.push(p.task);s.carrying=null;s.focus=clamp(s.focus+8,0,100);if(s.index===0||s.index===3)s.balance+=10;if(p.task==='phone'){s.phoneOff=true;s.hazards.forEach(h=>h.stun=999);}say(s,s.level.tasks.find(t=>t.id===p.task).line);}if(p.type==='rest'){s.energy=clamp(s.energy+30,0,100);s.focus=clamp(s.focus+16,0,100);s.balance+=12;s.restCount++;say(s,'A real break. Energy up. Brain back online.');}if(p.type==='coffee'){const water=s.level.coffee.kind==='water';s.energy=clamp(s.energy+(water?18:20),0,100);s.coffeeCount++;say(s,water?'Hydrated. Slightly more human.':'Coffee acquired. You remain a person, not a perpetual-motion machine.');}if(p.type==='finish'){if(s.index===3){s.energy=100;s.balance+=20;}s.status='won';say(s,s.level.finish.line);}}
export function tick(s,input,dt){if(s.status!=='playing')return;if(s.show?.phase!=='live')s.elapsed+=dt;s.remaining=Math.max(0,s.level.duration-s.elapsed);for(const k of ['cooldown','invulnerable','burst','chat','toastTime'])s[k]=Math.max(0,s[k]-dt);if(s.mode==='standard'&&s.remaining===0&&s.show?.phase!=='live'){s.status='lost';say(s,'The clock won this round. Keep the learning, retry the level.');return;}
 if(s.pulse?.left>0){s.pulse.left-=dt;if(!input.x&&!input.y)input={...input,x:s.pulse.x,y:s.pulse.y};}
 let moving=false;const manual=Math.hypot(input.x||0,input.y||0)>0;if(manual){s.route=[];s.target=null;s.interactionId=null;s.interaction=0;}
 const sprint=!!input.sprint&&s.energy>15&&s.chat===0;const speed=(s.chat>0?68:sprint?300:190)*(s.energy<20?.75:1);if(!s.interactionId){moving=manual?move(s,s.player,input.x||0,input.y||0,dt,speed):follow(s,s.player,s.route,dt,speed);}if(moving&&sprint)s.energy=clamp(s.energy-dt*10,0,100);else s.energy=clamp(s.energy+dt*(moving?.65:2),0,100);
 for(const [i,h] of (s.show?.phase==='live'||s.interactionId==='hotel-lunch'?[]:s.hazards).entries()){h.stun=Math.max(0,h.stun-dt);h.repath-=dt;const d=distance(h,s.player);if(h.repath<=0){h.repath=.8+i*.04;let to=h.home;if(h.stun===0&&d<(h.type==='talker'?260:210))to=s.player;else if(h.stun===0)to={x:h.home.x+Math.sin(s.elapsed*.25+i)*105,y:h.home.y+Math.cos(s.elapsed*.23+i)*85};h.path=pathTo(s.level,h,to);}if(!s.phoneOff)follow(s,h,h.path,dt,h.stun>0?125:h.type==='talker'?110:136);
  if(!s.phoneOff&&h.stun===0&&s.invulnerable===0&&d<38){s.hits++;s.focus=clamp(s.focus-9,0,100);s.chat=2.5;s.invulnerable=3;s.route=[];s.interactionId=null;s.interaction=0;s.target=null;say(s,h.line+' SPACE / BOUNDARY makes room.');}}
 for(const n of s.npcs){n.x=n.home.x+Math.sin(s.elapsed*.8+n.phase)*10;n.y=n.home.y+Math.cos(s.elapsed*.7+n.phase)*7;}
 tickAudience(s,dt);
 for(let i=0;i<s.level.sparks.length;i++){if(!s.sparks.includes(i)&&distance(s.player,s.level.sparks[i])<35){s.sparks.push(i);s.focus=clamp(s.focus+5,0,100);say(s,'✦ A different possibility. Inspiration collected.');}}
 if(s.interactionId){const p=pointsOfInterest(s).find(p=>p.id===s.interactionId);if(!p||distance(s.player,p)>68){s.interactionId=null;s.interaction=0;}else{s.interaction-=dt;s.progress=clamp(1-s.interaction/p.seconds,0,1);if(s.interaction<=0){s.interactionId=null;s.progress=0;finishInteraction(s,p);if(p.type==='deliver')celebrate(s);}}}
 for(const p of s.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=160*dt;}s.particles=s.particles.filter(p=>p.life>0);
 if(s.focus<=0){s.focus=35;s.chat=0;s.energy=Math.max(35,s.energy);s.invulnerable=5;const rest=s.level.rest;s.player.x=rest.x;s.player.y=rest.y;s.route=[];s.target=null;s.interactionId=null;say(s,'Overload. You took a breather—not a game over. Protect your next stretch.');}}
export function levelResult(s){const progress=objectiveProgress(s);const score=Math.round(clamp(65*progress.done/progress.total+s.sparks.length*7+Math.min(10,s.balance/4)+Math.min(8,s.boundaries*2)-Math.min(25,s.hits*2)-Math.min(9,(s.appointment?.reschedules||0)*3),0,100));return {score,sparks:s.sparks.length,balance:s.balance,energy:Math.round(s.energy),hits:s.hits,boundaries:s.boundaries,seconds:Math.round(s.elapsed),tasks:s.completed.length,objectives:progress.done,lunch:s.appointment?.done||false,rebooked:s.appointment?.reschedules||0,live:s.show?.phase==='live'};}
export function campaignResult(c){const score=Math.round(c.results.reduce((n,r)=>n+r.score,0)/Math.max(1,c.results.length));const sparks=c.results.reduce((n,r)=>n+r.sparks,0),balance=c.results.reduce((n,r)=>n+r.balance,0);return {score,sparks,balance,jubilant:c.results.length===5&&score>=78&&sparks>=6&&balance>=65};}
