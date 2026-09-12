import {caseRecords,node,retained,pathFor,relatedFor} from './identity05-data.js';

const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const action=(label,fn,cls='pill-action')=>{const b=el('button',label,cls);b.type='button';b.addEventListener('click',fn);return b;};
const link=(label,href,cls='pill-action')=>{const a=el('a',label,cls);a.href=href;a.target='_blank';a.rel='noopener noreferrer';return a;};
const picture=(c,cls)=>{const img=el('img',undefined,cls);img.src=c.image;img.alt=c.alt||c.title;img.decoding='async';return img;};

function review(c){
 const details=el('details',undefined,'source-note');details.append(el('summary','Source + review status'));
 details.append(el('p',c.evidenceStatus||'Internal review.'),el('p',c.mediaStatus||'Public-use review remains pending.'));
 if(c.source){if(/^https:\/\//.test(c.source))details.append(link('Original project source ↗',c.source,'source-link'));else details.append(el('p',c.source));}
 return details;
}

function caseActions(n,path,navigate,{includeStory=false}={}){
 const row=el('nav',undefined,'content-actions');row.setAttribute('aria-label','Explore this project');
 const base=n.kind==='case'?path:path.slice(0,-1);const parent=node(n.caseKey);
 parent.children.filter(id=>id!==n.id&&(includeStory||node(id).kind!=='story')).forEach(id=>row.append(action((node(id).kind==='story'?'The idea behind it':node(id).kind==='photo'?'Full image':node(id).label)+' ↗',()=>navigate([...base,id]))));
 if(caseRecords[n.caseKey]?.website)row.append(link('Explore the live website ↗',caseRecords[n.caseKey].website));
 row.append(action('Bring us your challenge ↗',()=>navigate(['now','enquiry']),'pill-action orange'));
 return row;
}

function onward(n,navigate){
 const row=el('nav',undefined,'onward');row.setAttribute('aria-label','Keep exploring');row.append(el('p','ONE WORLD. MORE CONNECTIONS.','eyebrow'));
 relatedFor(n.caseKey).forEach(({label,id})=>row.append(action(label+' ↗',()=>navigate(pathFor(id)),'onward-link')));return row;
}

function renderCase(n,path,navigate){
 const c=caseRecords[n.caseKey];
 if(!c.image)return c.video?renderFilm(n,path,navigate):renderStory(n,path,navigate);
 const stage=el('article',undefined,'case-experience'+(c.image.endsWith('.svg')?' results-experience':'')+(c.imageKind==='website'||c.imageKind==='artwork'?' graphic-experience':''));
 stage.append(picture(c,'case-hero-image'));
 const content=el('div',undefined,'case-hero-content');content.append(el('p',c.client+' / '+c.market,'eyebrow'),el('h1',c.title),caseActions(n,path,navigate,{includeStory:true}));
 const next=relatedFor(n.caseKey).find(r=>r.id==='approach'||r.id.startsWith('method-'));if(next)content.append(action(next.label+' ↗',()=>navigate(pathFor(next.id)),'case-onward'));
 stage.append(content);return stage;
}

function renderStory(n,path,navigate){
 const c=caseRecords[n.caseKey],stage=el('article',undefined,'story-stage');
 const visual=el('div',undefined,'story-visual'+(c.image?'':' type-only'));
 if(c.image)visual.append(picture(c,'story-image'));
 else visual.append(el('p',c.client,'type-client'),el('p',c.category||c.market,'type-context'));
 const caption=el('div',undefined,'story-caption');caption.append(el('p',c.market,'eyebrow'),el('p',c.client));visual.append(caption);
 const content=el('div',undefined,'story-content');content.append(el('p','SELECTED WORK / '+(c.category||c.market||''),'eyebrow'),el('h1',c.title));
 const tabs=el('div',undefined,'story-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Project chapters');
 const panel=el('section',undefined,'chapter-panel');panel.id='story-chapter';panel.setAttribute('role','tabpanel');panel.tabIndex=0;
 const chapters=[['The challenge',c.brief||c.summary],['The different move',c.move||c.summary],['What it connected',c.outcome||c.summary]];
 let selected=1;const buttons=[];
 function select(i,focus=false){selected=i;buttons.forEach((b,j)=>{b.setAttribute('aria-selected',String(j===i));b.tabIndex=j===i?0:-1;});panel.setAttribute('aria-labelledby','chapter-tab-'+i);panel.replaceChildren(el('h2',chapters[i][0]),el('p',chapters[i][1]||''));if(i===2&&c.connected?.length){const list=el('ul',undefined,'capability-tags');c.connected.forEach(t=>list.append(el('li',t)));panel.append(list);}if(focus)buttons[i].focus();}
 chapters.forEach(([label],i)=>{const b=action(label,()=>select(i),'chapter-tab');b.id='chapter-tab-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls','story-chapter');b.addEventListener('keydown',e=>{let target;if(e.key==='ArrowRight')target=(selected+1)%3;else if(e.key==='ArrowLeft')target=(selected+2)%3;else if(e.key==='Home')target=0;else if(e.key==='End')target=2;if(target!==undefined){e.preventDefault();select(target,true);}});buttons.push(b);tabs.append(b);});
 if(!c.image&&!c.video)content.append(el('p','ARCHIVE STORY / SELECTED MEDIA STILL IN REVIEW','archive-notice'));
 select(selected);content.append(tabs,panel,caseActions(n,path,navigate),onward(n,navigate),review(c));stage.append(visual,content);return stage;
}

function renderPhoto(n,path,navigate){
 const c=caseRecords[n.caseKey],stage=el('figure',undefined,'photo-stage');
 stage.append(picture(c,'full-photo'));
 const caption=el('figcaption',undefined,'photo-caption');caption.append(el('p',c.client+' / '+c.market,'eyebrow'),el('h1',c.title));
 const controls=el('div',undefined,'photo-actions');
 controls.append(action('The story ↗',()=>navigate([...path.slice(0,-1),n.caseKey+'-story']),'pill-action'));
 const note=el('details',undefined,'media-note');note.append(el('summary','About this image'),el('p',c.alt||c.title),el('p',c.mediaStatus||'Internal review image.'));controls.append(note);caption.append(controls);stage.append(caption);return stage;
}

function renderFilm(n,path,navigate){
 const c=caseRecords[n.caseKey],stage=el('article',undefined,'film-stage');
 const player=el('div',undefined,'film-frame');const preview=el('div',undefined,'film-preview');
 if(c.image)preview.append(picture(c,'film-poster'));
 const start=action('',()=>{
  const frame=el('iframe');frame.title=c.client+' — '+c.title;frame.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(c.video)+'?playsinline=1&rel=0';frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';player.replaceChildren(frame);frame.focus();
 },'film-start');start.setAttribute('aria-label','Load '+c.client+' film from YouTube');start.append(el('span','▶','play-glyph'),el('span','Watch the film'),el('small','Loads the original YouTube player'));
 preview.append(start);player.append(preview);
 const meta=el('div',undefined,'film-meta');meta.append(el('p',c.client+' / '+c.market,'eyebrow'),el('h1',c.title));
 const base=n.kind==='case'?path:path.slice(0,-1);const actions=el('div',undefined,'content-actions');actions.append(action('The story ↗',()=>navigate([...base,n.caseKey+'-story'])),link('Open original film ↗','https://www.youtube.com/watch?v='+encodeURIComponent(c.video)));meta.append(actions,el('p',c.mediaStatus||'Original source film. External-use review remains pending.','media-status'));
 const fallback=el('p',undefined,'film-fallback');fallback.append(document.createTextNode('Player unavailable? '),link('Watch the original film ↗','https://www.youtube.com/watch?v='+encodeURIComponent(c.video),'source-link'));
 stage.append(player,fallback,meta);return stage;
}

function renderInformation(n,navigate){
 const stage=el('article',undefined,'content-stage information-stage');
 stage.append(el('p','NOW / '+n.label.toUpperCase(),'eyebrow'),el('h1',n.title));
 const body=el('div',undefined,'information-body');body.append(el('p',n.body||''));
 if(n.details){const list=el('ul',undefined,'information-list');n.details.forEach(t=>list.append(el('li',t)));body.append(list);}
 const actions=el('div',undefined,'content-actions');actions.append(action(n.id==='privacy'?'Explore NOW ↗':'Start a conversation ↗',()=>navigate(n.id==='privacy'?['now']:['now','enquiry']),'pill-action orange'));body.append(actions);stage.append(body);return stage;
}

function renderChapter(n,path,navigate){
 const c=caseRecords[n.proof];const stage=el('article',undefined,'chapter-stage');
 const visual=el('button',undefined,'chapter-proof');visual.type='button';visual.setAttribute('aria-label','Explore '+c.client+' project example');visual.addEventListener('click',()=>navigate([...path,n.proof]));visual.append(picture(c,'chapter-proof-image'));
 const caption=el('div',undefined,'proof-caption');caption.append(el('p','PROJECT EXAMPLE / INTERNAL REVIEW','eyebrow'),el('h2',c.client),el('p',c.title),el('span','Step inside ↗','pill-action'));visual.append(caption);
 const copy=el('div',undefined,'chapter-copy');copy.append(el('p',n.kind==='method'?'OUR CONNECTED APPROACH':'ABOUT NOW','eyebrow'));
 const peers=el('nav',undefined,'chapter-peers');peers.setAttribute('aria-label',n.kind==='method'?'Approach chapters':'About chapters');n.peers.forEach(id=>{const b=action(node(id).label,()=>navigate([...path.slice(0,-1),id]),'chapter-peer');if(id===n.id)b.setAttribute('aria-current','page');peers.append(b);});
 copy.append(peers,el('h1',n.title),el('p',n.body,'chapter-intro'));const list=el('ul',undefined,'capability-tags');n.details.forEach(t=>list.append(el('li',t)));copy.append(list);
 const next=n.peers[n.peers.indexOf(n.id)+1];const actions=el('div',undefined,'content-actions');if(next)actions.append(action('Next: '+node(next).label+' ↗',()=>navigate([...path.slice(0,-1),next])));else actions.append(action(n.kind==='method'?'See our regional reach ↗':'Explore our approach ↗',()=>navigate(['now',n.kind==='method'?'asia':'approach'])));
 actions.append(action('Bring us your challenge ↗',()=>navigate(['now','enquiry']),'pill-action orange'));copy.append(actions);stage.append(visual,copy);return stage;
}

export function validateBrief(data,step){
 if(step===1)return data.difficulty.trim()?'':'Tell us about a fictional challenge before continuing.';
 if(!data.name.trim()||!data.organisation.trim())return 'Add a fictional name and organisation.';
 if(!/^[^\s@]+@example\.(com|org|net)$/i.test(data.email.trim()))return 'Use an example.com, example.org or example.net email in this interface test.';
 return data.acknowledgement?'':'Confirm that the details are fictional.';
}

const brief={intent:'launch',market:'regional',timing:'Exploring options',scale:'Not sure yet',difficulty:'',name:'',organisation:'',email:'',phone:'',budget:'Prefer to discuss',acknowledgement:false,marketingConsent:false};
let briefStep=1;
let contextKey='',contextLabel='';
export function setEnquiryContext(path){
 const caseNode=path.map(node).reverse().find(n=>n.caseKey),marketNode=path.map(node).find(n=>n.id.startsWith('market-'));
 const key=caseNode?.caseKey||marketNode?.id||'';if(key===contextKey)return;contextKey=key;contextLabel='';
 if(!caseNode&&!marketNode){brief.intent='launch';brief.market='regional';}
 if(caseNode){const c=caseRecords[caseNode.caseKey];contextLabel='Inspired by '+c.client+' / '+c.market;const intent=retained.intents.find(i=>'case-'+i.caseSlug===caseNode.caseKey);brief.intent=intent?.id||({'case-dell-sydney-customer-event':'conversation','case-dell-fiji-partner-summit':'regional'}[caseNode.caseKey])||'complex';const market=retained.markets.find(m=>m.name===c.market);brief.market=market?.id||'regional';}
 if(marketNode)brief.market=marketNode.id.replace('market-','');
 if(!caseNode&&marketNode)contextLabel='Exploring '+marketNode.label;
}
function renderEnquiry(n,navigate){
 const stage=el('article',undefined,'enquiry-stage');const intro=el('aside',undefined,'enquiry-intro');
 intro.append(el('p','LET’S FIND THE DIFFERENT WAY IN','eyebrow'),el('h1',n.title),el('p','A starting point. Not a finished brief. Tell us what you’re trying to change. We’ll start with the right questions.'));
 const summary=el('div',undefined,'brief-starting-point');intro.append(summary);
 const shell=el('div',undefined,'enquiry-form');const notice=el('p','Test interface preview. Use fictional details only. Nothing is sent or saved to a server.','test-notice');shell.append(notice);
 const stepper=el('div',undefined,'form-steps');shell.append(stepper);const heading=el('h2');heading.tabIndex=-1;shell.append(heading);
 const error=el('p',undefined,'form-error');error.setAttribute('role','alert');error.tabIndex=-1;error.hidden=true;shell.append(error);
 const form=el('form');form.autocomplete='off';shell.append(form);
 function updateSummary(){summary.replaceChildren(el('span','YOUR STARTING POINT','eyebrow'),el('p',retained.intents.find(i=>i.id===brief.intent)?.label||''),el('small',brief.market==='regional'?'Across multiple markets':retained.markets.find(m=>m.id===brief.market)?.name||'Other market'));if(contextLabel)summary.append(el('p',contextLabel,'brief-context'));}
 function field(grid,label,key,{options,type='text',required=false,placeholder,full=false,hint}={}){
  const wrapper=el('label',undefined,full?'full':'');wrapper.append(el('span',label));let input;
  if(options){input=el('select');options.forEach(o=>{const item=typeof o==='string'?[o,o]:o;const option=el('option',item[1]);option.value=item[0];input.append(option);});}
  else if(type==='textarea'){input=el('textarea');input.maxLength=1500;input.rows=4;}
  else {input=el('input');input.type=type;input.maxLength=key==='phone'?50:150;input.autocomplete='off';}
  input.name=key;input.value=brief[key];input.required=required;if(placeholder)input.placeholder=placeholder;
  input.addEventListener('input',()=>{brief[key]=input.value;input.setCustomValidity('');updateSummary();});
  if(type==='email')input.addEventListener('change',()=>input.setCustomValidity(/^[^\s@]+@example\.(com|org|net)$/i.test(input.value.trim())?'':'Use a fictional example.com, example.org or example.net email.'));
  wrapper.append(input);if(hint)wrapper.append(el('small',hint,'field-hint'));grid.append(wrapper);
 }
 function check(grid,key,label,required=false){const wrapper=el('label',undefined,'check-row full');const input=el('input');input.type='checkbox';input.name=key;input.checked=brief[key];input.required=required;input.addEventListener('change',()=>brief[key]=input.checked);wrapper.append(input,el('span',label));grid.append(wrapper);}
 function draw(focus=false){
  updateSummary();error.hidden=true;form.replaceChildren();stepper.replaceChildren();['01 / The challenge','02 / The conversation'].forEach((t,i)=>{const s=el('span',t);if(briefStep===i+1)s.setAttribute('aria-current','step');stepper.append(s);});heading.textContent=briefStep===1?'What needs to move?':'Let’s start talking.';
  const grid=el('div',undefined,'form-grid');form.append(grid);
  if(briefStep===1){
   field(grid,'Your ambition','intent',{options:retained.intents.map(i=>[i.id,i.label]),full:true});
   field(grid,'Where?','market',{options:[['regional','Across multiple markets'],...retained.markets.map(m=>[m.id,m.name]),['other','Other market']]});
   field(grid,'When?','timing',{options:['Exploring options','Within 3 months','3–6 months','6–12 months']});
   field(grid,'Audience scale','scale',{options:['Not sure yet','An intimate group','100–500 people','500+ people','A distributed audience'],full:true});
   field(grid,'What’s making it difficult?','difficulty',{type:'textarea',required:true,full:true,placeholder:'A fictional launch, event or audience challenge…'});
  }else{
   field(grid,'Your name','name',{required:true,placeholder:'Alex Example'});field(grid,'Organisation','organisation',{required:true,placeholder:'Example Company'});
   field(grid,'Email','email',{type:'email',required:true,placeholder:'alex@example.com',full:true,hint:'Only example.com, example.org or example.net addresses are accepted.'});
   field(grid,'Preferred contact / phone (optional)','phone',{placeholder:'Fictional details only'});field(grid,'Budget (optional)','budget',{options:['Prefer to discuss','Scoping the investment','Budget already defined']});
   check(grid,'acknowledgement','These are fictional test details. I understand nothing is sent or saved to a server.',true);
   check(grid,'marketingConsent','I’d like occasional ideas from NOW. Optional preference preview only; no subscription is created.');
  }
  const actions=el('div',undefined,'form-actions');actions.append(action(briefStep===2?'← The challenge':'← Back to NOW',()=>{if(briefStep===2){briefStep=1;draw(true);}else navigate(['now']);}));
  const next=el('button',briefStep===1?'Continue ↗':'Preview my brief ↗','pill-action orange');next.type='submit';actions.append(next);form.append(actions);if(focus)heading.focus({preventScroll:true});shell.scrollTop=0;
 }
 form.addEventListener('submit',e=>{
  e.preventDefault();const message=validateBrief(brief,briefStep);if(message){error.textContent=message;error.hidden=false;error.focus();return;}
  if(briefStep===1){briefStep=2;draw(true);return;}
  stepper.hidden=true;heading.textContent='That’s a good starting point.';form.hidden=true;error.hidden=true;
  const receipt=el('section',undefined,'brief-receipt');receipt.append(el('p','Preview complete. This brief has not been sent.','receipt-status'));
  const dl=el('dl');[['Ambition',retained.intents.find(i=>i.id===brief.intent)?.label],['Market',brief.market==='regional'?'Across multiple markets':retained.markets.find(m=>m.id===brief.market)?.name||'Other'],['Timing',brief.timing],['Audience',brief.scale],['Challenge',brief.difficulty],['Contact',brief.name+' / '+brief.organisation+' / '+brief.email]].forEach(([label,value])=>dl.append(el('dt',label),el('dd',value)));receipt.append(dl);
  const actions=el('div',undefined,'form-actions');actions.append(action('Edit the preview',()=>{receipt.remove();stepper.hidden=false;form.hidden=false;draw(true);}),action('Back to our world ↗',()=>navigate(['now']),'pill-action orange'));receipt.append(actions);shell.append(receipt);heading.focus({preventScroll:true});shell.scrollTop=0;
 });
 draw();stage.append(intro,shell);return stage;
}

export function renderViewer(n,path,navigate){
 if(n.kind==='case')return renderCase(n,path,navigate);
 if(n.kind==='method'||n.kind==='heritage')return renderChapter(n,path,navigate);
 if(n.kind==='story')return renderStory(n,path,navigate);
 if(n.kind==='photo')return renderPhoto(n,path,navigate);
 if(n.kind==='video')return renderFilm(n,path,navigate);
 if(n.kind==='enquiry')return renderEnquiry(n,navigate);
 return renderInformation(n,navigate);
}
