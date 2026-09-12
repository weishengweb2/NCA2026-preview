import retained from './identity05-retained-content.js';
import {expandedCases,workCollections} from './identity05-expanded-content.js';
export const graph={};
const add=n=>(graph[n.id]={children:[],kind:'branch',...n},n.id);
export const roots=['work','asia','approach','about','enquiry'];
add({id:'now',label:'NOW',title:'A world of\ndifferent.',eyebrow:'EXPERIENCE + ACTIVATION / ACROSS ASIA',summary:'Events are our starting point. Insight, ideas and local intelligence take them somewhere different.',children:roots});
add({id:'work',label:'Our work',title:'Many ways in.\nOne different mindset.',summary:'Events, video, digital, internal communication and B2B marketing. Different expressions of one connected approach.',image:'./identity05-media-redhat-live-sketch.jpg',imageCredit:'Red Hat / Kuala Lumpur archive',children:workCollections.map(c=>c.id)});
export const caseRecords={};
function addCase(key,c){
 caseRecords[key]=c;
 const children=[key+'-story'];
 if(c.image)children.push(key+'-photo');
 if(c.video)children.push(key+'-film');
 const labels={'case-dell-ai-at-scale':'Dell / AI at Scale','case-dell-sydney-customer-event':'Dell / Sydney','case-dell-fiji-partner-summit':'Dell / Fiji','case-vmware-tokyo-film':'VMware / street story','regional-japan-vmware-tokyo':'VMware / vForum'};
 add({id:key,label:labels[key]||c.client,title:c.title,summary:c.summary||c.brief,eyebrow:c.market||'',image:c.image||null,kind:'case',caseKey:key,children});
 add({id:key+'-story',label:'The story',title:c.title,kind:'story',caseKey:key,image:c.image||null});
 if(c.image)add({id:key+'-photo',label:c.image.endsWith('.svg')?'View results':c.imageKind==='artwork'||c.imageKind==='website'?'View visual':'View photograph',title:c.client,kind:'photo',caseKey:key,image:c.image});
 if(c.video)add({id:key+'-film',label:'Watch the film',title:c.client,kind:'video',caseKey:key,image:c.image||null});
}
retained.cases.forEach(c=>addCase('case-'+c.slug,c));
expandedCases.forEach(({id,...c})=>addCase(id,c));
workCollections.forEach(add);
export const regionCollections=[
 {id:'region-asean',label:'South East Asia',shortLabel:'ASEAN',title:'Close to the audience.\nAcross ASEAN.',summary:'Singapore, Thailand, Indonesia, Malaysia and Vietnam. Find the local detail within a regional ambition.',group:'asean',image:'./identity05-media-canalys-stage.webp',imageCredit:'Canalys / Bali, Indonesia'},
 {id:'region-north',label:'North Asia',title:'Global ambition.\nA local point of view.',summary:'Start in Japan: leadership storytelling and a street-level film. More North Asia material can join this world as it is verified.',group:'north',image:null},
 {id:'region-pacific',label:'Australia + Pacific',shortLabel:'Australia + Pacific',title:'A regional idea.\nA wider horizon.',summary:'From a Sydney customer conversation to a Fiji partner summit and Auckland archive work. Explore the story market by market.',group:'pacific',image:'./identity05-media-dell-sydney-2024.webp',imageCredit:'Dell / Sydney, Australia'}
];
add({id:'asia',label:'Across Asia',title:'One intent.\nLocal intelligence.',summary:'Choose South East Asia, North Asia or Australia + Pacific. Then discover the countries, projects and people behind the reach.',image:'./identity05-media-dell-sydney-2024.webp',imageCredit:'Dell / Sydney, Australia',children:regionCollections.map(r=>r.id)});
regionCollections.forEach(r=>add({...r,children:retained.markets.filter(m=>m.group===r.group).map(m=>'market-'+m.id)}));
retained.markets.forEach(m=>{
 const children=m.projects.map(p=>{
  if(p.caseSlug&&graph['case-'+p.caseSlug])return 'case-'+p.caseSlug;
  const key='regional-'+m.id+'-'+p.id;
  addCase(key,{client:p.client,title:p.title,summary:p.summary,brief:p.summary,move:p.detail,connected:[p.type],outcome:'',market:m.name,image:p.image,alt:p.alt,video:p.video,evidenceStatus:p.status,mediaStatus:p.status,publicationStatus:'internal-review',source:p.status});
  return key;
 });
 add({id:'market-'+m.id,label:m.name,title:m.line,summary:m.understanding,eyebrow:m.city,children,image:children.map(id=>graph[id].image).find(Boolean)||null});
});
// Regions and disciplines are real, addressable sphil levels, never hidden filters.
graph['market-malaysia'].children.push('case-redhat-kl');
graph['market-malaysia'].image=graph['case-redhat-kl'].image;
const addedSingapore=['case-alibaba-ai-studio','case-idemia-visual-story','case-imas-digital'];
graph['market-singapore'].children.push(...addedSingapore);
const methodProof=['case-dell-ai-at-scale','case-listerine-labs','case-canalys-forum'];
add({id:'approach',label:'Our approach',title:'Motivation\nover Medium.',summary:'The best format starts with a better question. What do you need people to feel, understand or do?',image:'./identity05-media-imas-digital.webp',imageCredit:'IMAS / hybrid summit',children:retained.approach.map((_,i)=>'method-'+i)});
retained.approach.forEach((c,i)=>{
 const id='method-'+i;
 add({id,label:c.label,title:c.heading,summary:c.copy,body:c.copy,details:c.details,kind:'method',image:graph[methodProof[i]].image,children:[methodProof[i]],proof:methodProof[i],peers:['method-0','method-1','method-2']});
});
add({id:'about',label:'About NOW',title:'Curious by nature.\nConnected by experience.',summary:'Our heritage is in making moments happen across Asia. Kinda Different is a way of thinking—and the practical judgement to bring it to life.',image:'./identity05-media-canalys-stage.webp',imageCredit:'Canalys / Bali, Indonesia',children:retained.heritage.map((_,i)=>'heritage-'+i)});
retained.heritage.forEach((c,i)=>{const proof=['case-canalys-forum','case-listerine-labs','case-dell-ai-at-scale'][i];add({id:'heritage-'+i,label:c.label,title:c.heading,summary:c.copy,body:c.copy,details:c.details,kind:'heritage',image:graph[proof].image,proof,children:[proof],peers:['heritage-0','heritage-1','heritage-2']});});
add({id:'enquiry',label:'Start a project',title:'Bring us the brief\nyou haven’t solved yet.',kind:'enquiry'});
add({id:'privacy',label:'Privacy',title:'Test preview.\nNot a live enquiry service.',kind:'information',body:'This identity version does not send enquiries or store them on a server. Use fictional details in the enquiry preview. The optional film player contacts YouTube only when you choose to watch. Production privacy, retention and consent wording remains subject to approval.',details:['No marketing tracking','No client submission','Film loads only on request']});
export {retained};
export function node(id){return graph[id]||graph.now;}
export function childrenFor(id){return node(id).children;}
export function coreAction(path,revealed){return path.length>1&&revealed?'back':'reveal';}
export function satellitePath(path){const id=path.at(-1);return path.includes('work-video')&&caseRecords[id]?.video?[...path,id+'-film']:path;}
export function pathFor(id){
 const queue=[['now']];while(queue.length){const path=queue.shift();if(path.at(-1)===id)return path;node(path.at(-1)).children.forEach(child=>queue.push([...path,child]));}
 return id==='privacy'?['now','privacy']:['now'];
}
export function relatedFor(caseKey){
 const c=caseRecords[caseKey];if(!c)return [];
 const market=retained.markets.find(m=>m.projects.some(p=>p.caseSlug&&'case-'+p.caseSlug===caseKey)||m.name===c.market);
 const index=methodProof.indexOf(caseKey);
 const next={'case-listerine-labs':'case-canalys-forum','case-canalys-forum':'case-dell-sydney-customer-event','case-dell-ai-at-scale':'case-veeam-baas','case-dell-sydney-customer-event':'case-dell-ai-at-scale','case-intent-asia':'case-idemia-visual-story','case-netapp-townhalls':'case-vmware-tokyo-film','case-idemia-visual-story':'case-veeam-baas','case-imas-digital':'case-workday-elevate-online','case-alibaba-ai-studio':'case-intent-asia','case-workday-elevate-online':'case-imas-digital','case-vue-internal':'case-netapp-townhalls','case-redhat-kl':'case-dell-ai-at-scale','case-veeam-baas':'case-redhat-kl'}[caseKey]||'case-listerine-labs';
 return [market&&{label:'More in '+market.name,id:'market-'+market.id},{label:index>=0?'Behind the work: '+node('method-'+index).label:'Our connected approach',id:index>=0?'method-'+index:'approach'},{label:'Another perspective: '+node(next).label,id:next}].filter(Boolean);
}
export function previewFor(id){
 const n=node(id);const key=n.caseKey||(n.proof||[id,...childrenFor(id)].find(key=>graph[key]?.caseKey&&graph[key]?.image));
 if(n.imageCredit&&n.image)return {image:n.image,caption:n.imageCredit,alt:n.imageCredit};
 if(key&&caseRecords[key]?.image)return {image:caseRecords[key].image,caption:caseRecords[key].client+' / '+caseRecords[key].market,alt:caseRecords[key].alt||caseRecords[key].title};
 // Only use photographs belonging to this node, never an unrelated fallback.
 return n.image?{image:n.image,caption:n.label,alt:n.title}:{image:null,caption:n.id.startsWith('market-')?'Archive stories / selected media still in review':'',alt:''};
}
export function validPath(path){
 if(!Array.isArray(path)||path[0]!=='now')return ['now'];
 const result=['now'];
 for(const id of path.slice(1)){
  const parent=node(result.at(-1));
  if(!parent.children.includes(id)&&!(result.length===1&&id==='privacy'))break;
  result.push(id);
 }return result;
}
export function routeHash(path){return '#/'+path.map(encodeURIComponent).join('/');}
export function routeFromHash(hash){try{
 const parts=hash.replace(/^#\/?/,'').split('/').filter(Boolean).map(decodeURIComponent);
 // Preserve shared review links from versions 02–04 while using the expanded tree.
 const aliases={live:'work-events',b2b:'work-b2b',film:'work-video',films:'work-video',asean:'region-asean',north:'region-north',pacific:'region-pacific'};
 const route=parts.map((id,i)=>i===2&&aliases[id]?aliases[id]:id.replace(/^(heritage-\d)-read$/,'$1').replace(/^(method-\d)-detail-\d$/,'$1')).filter((id,i,a)=>!i||a[i-1]!==id);
 if(route[1]==='work'&&graph[route[2]]?.caseKey){const collection=workCollections.find(c=>c.children.includes(route[2]));if(collection)route.splice(2,0,collection.id);}
 if(route[1]==='asia'&&route[2]?.startsWith('market-')){const region=regionCollections.find(r=>graph[r.id].children.includes(route[2]));if(region)route.splice(2,0,region.id);}
 return validPath(route);
}catch{return ['now'];}}
