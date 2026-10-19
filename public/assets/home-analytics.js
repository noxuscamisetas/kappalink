/* Optional GA4 on the main landing only. No request text enters analytics. */
(function () {
 'use strict';
 if (!['www.kappalink.com','kappalink.com'].includes(window.location.hostname)) return;
 const ID='G-038DM4PDTG', KEY='kappalink_measurement_v1';
 let enabled=false,loaded=false;
 const seen=new Set();
 function saved(){try{return localStorage.getItem(KEY);}catch{return null;}}
 function save(value){try{localStorage.setItem(KEY,value);}catch{}}
 // Keep arbitrary query strings, hashes, form contents and referrer URLs out of GA.
 const cleanLocation='https://www.kappalink.com/';
 const params=new URLSearchParams(window.location.search);
 const allowed={utm_source:['instagram','google','facebook','whatsapp'],utm_medium:['organic_social','cpc','referral'],utm_campaign:['lancamento_kappalink','perfil_kappalink']};
 const campaign={};
 for(const [key,values] of Object.entries(allowed)){const value=params.get(key);if(values.includes(value))campaign[key==='utm_campaign'?'campaign_name':key.replace('utm_','campaign_')]=value;}
 function gtag(){window.dataLayer.push(arguments);}
 function start(){
  if(loaded)return;loaded=true;window.dataLayer=window.dataLayer||[];window.gtag=gtag;
  gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  gtag('js',new Date());
  gtag('set',{page_location:cleanLocation,page_referrer:'',allow_google_signals:false,allow_ad_personalization_signals:false});
  gtag('config',ID,{send_page_view:false,...campaign});
  gtag('event','page_view',{page_location:cleanLocation,page_referrer:'',page_title:document.title,...campaign});
  const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+ID;document.head.appendChild(script);
 }
 window.kappaTrack=function(name,details={}){
  if(!enabled)return;
  if(!['demo_cta','start_cta','example_open','demo_select','demo_complete','request_start','contact_intent'].includes(name))return;
  const safe={};
  if(['camisetas','festas','consultas'].includes(details.example))safe.example=details.example;
  if(['email','copy'].includes(details.method))safe.method=details.method;
  const key=name+JSON.stringify(safe);if(seen.has(key))return;seen.add(key);
  gtag('event',name,{...safe,page_location:cleanLocation,page_referrer:'',...campaign});
 };
 function init(){
  const choice=document.getElementById('measurementChoice');
  const prior=saved();choice.hidden=prior==='allow'||prior==='deny';
  enabled=prior==='allow';if(enabled)start();
  document.getElementById('measurementAllow').addEventListener('click',()=>{save('allow');enabled=true;choice.hidden=true;if(loaded)gtag('consent','update',{analytics_storage:'granted'});start();});
  document.getElementById('measurementDeny').addEventListener('click',()=>{save('deny');enabled=false;choice.hidden=true;if(loaded){window['ga-disable-'+ID]=true;window.location.reload();}});
  document.getElementById('analyticsSettings').addEventListener('click',()=>{choice.hidden=false;document.getElementById('measurementAllow').focus();});
  document.addEventListener('click',event=>{const target=event.target.closest?.('a');if(!target)return;if(target.dataset.track)window.kappaTrack(target.dataset.track);else if(target.closest('#exemplos'))window.kappaTrack('example_open');});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
