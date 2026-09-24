import {createRun,freshCampaign,distance} from './game-action-engine.js';

// Isolated, unscored rehearsal: never written to a campaign or leaderboard.
export function createPractice(character='orange'){
 const run=createRun(0,{...freshCampaign(),mode:'relaxed',character});
 run.level={...run.level,name:'Find your feet',theme:'office',duration:9999,
  tip:'A quick rehearsal. No clock, no score, no consequences.',
  spawn:{x:640,y:480},obstacles:[],npcs:[],hazards:[],sparks:[],
  rest:{x:120,y:800,label:'Quiet corner',kind:'rest'},coffee:{x:1400,y:800,label:'Coffee',kind:'coffee'},
  finish:{x:1400,y:100,label:'Practice only',line:'Ready.'},
  tasks:[{id:'badge',name:'Get the badge to reception',item:'EVENT BADGE',from:{x:760,y:480},to:{x:930,y:480},label:'Reception',line:'Delivered. Now for the inevitable quick chat.'}]};
 run.player={...run.player,...run.level.spawn};run.hazards=[];run.npcs=[];
 run.practice={step:0,spawn:{...run.player},introduced:false};return run;
}
export function updatePractice(run){
 const p=run.practice;if(!p)return;
 // Let a new player read at their own pace without a penalty/reset loop.
 run.focus=100;run.energy=100;
 if(p.step===0&&distance(run.player,p.spawn)>45)p.step=1;
 if(p.step===1&&run.carrying)p.step=2;
 if(p.step===2&&run.completed.includes('badge'))p.step=3;
 if(p.step===3&&!p.introduced){
  p.introduced=true;run.cooldown=0;
  const x=Math.min(1400,run.player.x+85),y=run.player.y;
  run.hazards=[{id:0,x,y,home:{x,y},type:'talker',name:'A quick chat',line:'Have you got a tiny second?',path:[],repath:0,stun:0,angle:0,walk:0,dx:0,dy:1}];
 }
 if(p.step===3&&run.boundaries>0){p.step=4;run.hazards=[];run.chat=0;run.route=[];}
}
export function practiceMessage(step){return [
 ['01 / MOVE','Tap the floor by the badge, or use the arrows / WASD.'],
 ['02 / PICK UP','Walk close to EVENT BADGE. Press E or tap DO, then stand still a moment.'],
 ['03 / DELIVER','Follow the orange marker to Reception. Use E / DO again.'],
 ['04 / MAKE ROOM','Someone has “one quick question”. Press Space or tap BOUNDARY.'],
 ['YOU’VE GOT THIS','Move, do, make room. Your checklist pauses the action whenever you need it.']
 ][Math.max(0,Math.min(4,step))];}
export function practiceGuide(step){const [title,copy]=practiceMessage(step);return `<div><strong>${title}</strong><p>${copy}</p></div><button class="${step===4?'primary':'quiet-button'}" data-action="play">${step===4?'Start chapter one ↗':'Skip warm-up →'}</button>`;}
