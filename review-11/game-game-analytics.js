import { services, sourceVariant } from './game-game-services.js';

export const EVENTS = new Set(['view','start','level_start','level_complete','level_fail','level_retry','checkpoint','pause','checklist','leaderboard_view','gate_view','signup_attempt','signup_success','signup_pending','signup_error','gate_decline','review_continue','finish','leave']);
const NUMBERS = { level:[1,5], score:[0,100], seconds:[0,10000], objectives:[0,8], sparks:[0,15], hits:[0,10000], balance:[0,100], boundaries:[0,10000] };
const ENUMS = { variant:['identity','scrolling','standalone'], mode:['standard','relaxed'], access:['guest','subscribed','review'], result:['won','timeout','playing'], stage:['intro','brief','gate','playing','complete','ending'] };
export function safeEvent(event, input = {}) {
  if (!EVENTS.has(event)) return null;
  const payload = { game_version:services.release, environment:'test' };
  for (const [key, value] of Object.entries(input)) {
    if (ENUMS[key]?.includes(value)) payload[key] = value;
    if (NUMBERS[key] && Number.isFinite(value)) payload[key] = Math.round(Math.max(NUMBERS[key][0], Math.min(NUMBERS[key][1], value)));
  }
  return { name:'mil_'+event, payload };
}

const KEY='make-it-land.analytics-consent.v1', MAX_AGE=180*86400000;
export function readConsent(storage, now=Date.now()) {
  try { const value=JSON.parse(storage.getItem(KEY)); return value?.version===1 && ['granted','denied'].includes(value.choice) && Number.isFinite(value.at) && now-value.at>=0 && now-value.at<MAX_AGE ? value.choice : 'unknown'; }
  catch { return 'unknown'; }
}

export function createAnalytics(win=window, doc=document) {
  let choice='unknown', loaded=false;
  try { choice=readConsent(win.localStorage); } catch {}
  const id=services.measurementId, disabled='ga-disable-'+id;
  const variant=sourceVariant(win.location.search);
  function command(){win.dataLayer=win.dataLayer||[];win.dataLayer.push(arguments);}
  function activate(){
    if(loaded || choice!=='granted')return;
    loaded=true; win[disabled]=false;
    command('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    command('js',new Date());
    command('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_prefix:'mil04',cookie_expires:15552000,cookie_update:false,page_location:win.location.origin+win.location.pathname,page_referrer:'',page_title:'Make it land — game playtest'});
    const script=doc.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+id;doc.head.appendChild(script);
  }
  function setConsent(value){
    if(!['granted','denied'].includes(value))return;
    choice=value;
    try{win.localStorage.setItem(KEY,JSON.stringify({version:1,choice,at:Date.now()}));}catch{}
    if(choice==='granted') { win[disabled]=false; if(loaded)command('consent','update',{analytics_storage:'granted'}); activate(); }
    else {
      win[disabled]=true;
      if(loaded)command('consent','update',{analytics_storage:'denied'});
      // Delete only this game's analytics cookies, not the website's other cookies.
      for(const part of doc.cookie.split(';')){const name=part.trim().split('=')[0];if(name.startsWith('mil04'))for(const domain of ['',win.location.hostname,'.'+win.location.hostname])doc.cookie=name+'=; Max-Age=0; path=/'+(domain?'; domain='+domain:'')+'; SameSite=Lax';}
    }
  }
  function track(event, params={}){
    if(choice!=='granted')return false;
    const entry=safeEvent(event,{...params,variant});if(!entry)return false;
    activate();
    command('event',entry.name,{...entry.payload,send_to:id,transport_type:'beacon',page_location:win.location.origin+win.location.pathname,page_referrer:'',page_title:'Make it land — game playtest'});
    return true;
  }
  return {track,setConsent,get consent(){return choice;}};
}
