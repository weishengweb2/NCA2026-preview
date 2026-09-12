import {graph,node,roots,childrenFor,previewFor,coreAction,satellitePath,validPath,routeHash,routeFromHash} from './identity05-data.js';
import {renderViewer,setEnquiryContext} from './identity05-viewers.js';
const $=id=>document.getElementById(id);
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
const initialPath=routeFromHash(location.hash);
const state={path:initialPath,revealed:initialPath.length>1,preview:null,hovered:null,paused:motionQuery.matches,full:false};
let scene=null,menuOrigin=null,previewTimer=null;
const fullKinds=['case','method','heritage','story','photo','video','information','enquiry'];
function el(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function button(text,fn,className){const b=el('button',text,className);b.type='button';b.addEventListener('click',fn);return b;}
function current(){return node(state.path.at(-1));}
function updateScene(){state.visibleChildren=childrenFor(current().id);state.previewChildren=state.preview?childrenFor(state.preview).slice(0,3):[];state.coreAction=coreAction(state.path,state.revealed);state.backLabel=state.path.length>1?node(state.path.at(-2)).label:'NOW';scene?.update(state);if(!scene)fallbackControls();updateVisual();help();}
function updateVisual(){
 const n=node(state.hovered||current().id);const p=previewFor(n.id);const img=$('world-image');
 $('world-media').classList.toggle('visible',!!p.image&&!state.full);if(p.image&&img.getAttribute('src')!==p.image){img.src=p.image;img.alt=p.alt;}
 $('visual-caption').replaceChildren();if(state.hovered){$('visual-caption').append(el('span',p.caption||n.label,'peek-label'),el('span',n.title.replace(/\n/g,' '),'peek-title'));}
 $('visual-caption').hidden=!state.hovered;
}
function setRevealed(){clearTimeout(previewTimer);if(!state.full&&(!state.revealed||state.preview||state.hovered)){state.revealed=true;state.preview=null;state.hovered=null;updateScene();}}
function setPreview(id){clearTimeout(previewTimer);const inPreview=state.previewChildren?.includes(id);const next=inPreview?state.preview:node(id).kind==='branch'&&node(id).children.length?id:null;if(state.preview!==next||state.hovered!==id){state.preview=next;state.hovered=id;updateScene();}}
function clearPreview(id){clearTimeout(previewTimer);previewTimer=setTimeout(()=>{if(state.hovered===id){state.preview=null;state.hovered=null;updateScene();}},650);}
function navigate(path,{replace=false}={}){
 const next=validPath(path);if(next.join('/')===state.path.join('/')&&!state.full){closeMenu();setRevealed();return;}
 if(next.at(-1)==='enquiry')setEnquiryContext(state.path);
 closeMenu(false);state.path=next;state.revealed=true;state.preview=null;state.hovered=null;
 const hash=routeHash(next);history[replace?'replaceState':'pushState']({path:next},'',hash);render();
}
function selectSatellite(path){navigate(satellitePath(path));}
function activateCore(){if(coreAction(state.path,state.revealed)==='back')back();else setRevealed();}
function back(){if(state.path.length>1)navigate(state.path.slice(0,-1));else{state.revealed=false;state.preview=null;state.hovered=null;updateScene();}}
function jump(id){navigate(['now',id]);}
function trail(container,path){container.replaceChildren();path.forEach((id,i)=>{if(i)container.append(el('span','/'));const b=button(node(id).label,()=>navigate(path.slice(0,i+1)));if(i===path.length-1)b.setAttribute('aria-current','page');container.append(b);});}
function render(){
 const n=current();state.full=fullKinds.includes(n.kind);document.body.classList.toggle('fullscreen',state.full);document.title=`${n.id==='now'?'A world of different':n.label} — NOW / Identity preview`;
 document.body.classList.toggle('market-world',n.id.startsWith('market-'));
 document.body.classList.toggle('root-world',n.id==='now');
 state.scenePath=state.full&&!['case','method','heritage'].includes(n.kind)?state.path.slice(0,-1):state.path;
 trail($('breadcrumbs'),state.path);$('back').disabled=state.path.length===1;
 $('eyebrow').textContent=n.eyebrow||'NOW / '+n.label.toUpperCase();
 const title=n.kind==='case'?n.label:n.title||n.label;$('world-title').replaceChildren();title.replace(/[.]$/,'').split('\n').forEach((part,i)=>{if(i)$('world-title').append(document.createElement('br'));$('world-title').append(document.createTextNode(part));});$('world-title').append(el('span','', 'brand-stop'));
 $('world-summary').textContent=n.kind==='case'?n.title:n.summary||'';$('explore').textContent=n.id==='now'?'Explore our world ↗':'Explore '+n.label+' ↗';
 $('world-copy').classList.remove('entering');requestAnimationFrame(()=>$('world-copy').classList.add('entering'));
 $('viewer').hidden=!state.full;$('return-dock').hidden=!state.full;
 if(state.full)$('viewer').replaceChildren(renderViewer(n,state.path,navigate));else $('viewer').replaceChildren();
 $('route-announcement').textContent=state.path.map(id=>node(id).label).join(' / ');
 updateScene();if(!scene)fallbackControls();
 if(state.full)$('viewer').focus({preventScroll:true});
}
function openMenu(){
 if($('menu').open)return;menuOrigin=document.activeElement;
 const contextPath=state.scenePath;const context=node(contextPath.at(-1));
 $('menu-context').textContent=contextPath.map(id=>node(id).label).join(' / ');$('menu-heading').textContent=context.id==='now'?'A world of different.':context.label;
 $('context-menu').replaceChildren();context.children.forEach(id=>{const n=node(id);const row=button('',()=>navigate([...contextPath,id]),'menu-row');const label=el('span',n.label);if(n.eyebrow)label.append(el('small',n.eyebrow));row.append(label,el('span','↗'));$('context-menu').append(row);});
 $('global-menu').replaceChildren(...roots.map(id=>button(node(id).label,()=>jump(id),'jump-button')));$('menu').showModal();
}
function closeMenu(restore=true){if(!$('menu').open)return;$('menu').close();if(restore&&menuOrigin?.isConnected)menuOrigin.focus({preventScroll:true});}
function setMotion(){state.paused=!state.paused;syncMotion();updateScene();}
function syncMotion(){document.body.classList.toggle('motion-paused',state.paused);$('motion').textContent=state.paused?'Enable motion':'Pause motion';$('menu-motion').textContent=$('motion').textContent;$('motion').setAttribute('aria-pressed',String(state.paused));}
function fallbackControls(){
 if(scene)return;document.body.classList.add('flat-mode');const n=current();$('orbit-controls').replaceChildren();
 const core=button(n.label,activateCore,'orb-hit main-orb');core.setAttribute('aria-label',state.coreAction==='back'?'Back to '+state.backLabel:'Reveal '+n.label+' world');$('orbit-controls').append(core);if(state.revealed)childrenFor(n.id).forEach(id=>{const b=button(node(id).label,()=>selectSatellite([...state.path,id]),'orb-hit satellite-orb');b.setAttribute('aria-label','Explore '+node(id).label);$('orbit-controls').append(b);});
}
$('home').addEventListener('click',()=>navigate(['now']));$('enquire').addEventListener('click',()=>jump('enquiry'));$('explore').addEventListener('click',setRevealed);
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();$('menu-button').focus();});
$('menu-button').addEventListener('click',openMenu);$('return-orb').addEventListener('click',back);$('viewer-menu').addEventListener('click',()=>navigate(['now']));['back','viewer-back'].forEach(id=>$(id).addEventListener('click',back));
$('close-menu').addEventListener('click',()=>closeMenu());$('menu-home').addEventListener('click',()=>navigate(['now']));$('privacy').addEventListener('click',()=>jump('privacy'));
['motion','menu-motion'].forEach(id=>$(id).addEventListener('click',setMotion));
$('menu').addEventListener('cancel',e=>{e.preventDefault();closeMenu();});$('menu').addEventListener('click',e=>{if(e.target===$('menu')){const r=$('menu').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeMenu();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented&&!$('menu').open&&!e.target.matches('input,textarea,select')){e.preventDefault();back();}});
function restoreRoute(){const path=routeFromHash(location.hash);if(path.join('/')!==state.path.join('/')){state.path=path;state.preview=null;state.hovered=null;state.revealed=true;closeMenu(false);render();}}
window.addEventListener('popstate',restoreRoute);window.addEventListener('hashchange',restoreRoute);
motionQuery.addEventListener('change',e=>{state.paused=e.matches;syncMotion();updateScene();});
function help(){const touch=matchMedia('(hover: none)').matches;$('interaction-help').textContent=state.path.length>1?'Choose where to explore. Centre takes you back.':touch?'Tap the centre to reveal more. Choose where to explore.':'Hover to reveal. Click to explore.';}
window.addEventListener('resize',help);help();syncMotion();render();
try{
 if(new URLSearchParams(location.search).get('render')==='flat')throw new Error('Flat preview requested');
 const {IdentityScene}=await import('./identity05-scene.js');$('orbit-controls').replaceChildren();
 scene=new IdentityScene({container:$('universe'),controls:$('orbit-controls'),graph,onReveal:setRevealed,onPreview:setPreview,onUnpreview:clearPreview,onNavigate:selectSatellite,onCore:activateCore});document.body.classList.remove('flat-mode');updateScene();
}catch(error){console.warn('Identity enhancement unavailable:',error.message);$('render-notice').textContent='The 3D view is unavailable here. Use the menu or story buttons.';fallbackControls();}
