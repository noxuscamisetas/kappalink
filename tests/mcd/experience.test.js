// Execute the real client controller with a small DOM/clock adapter, not a browser.
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
const core=require('../../public/mcd/assets/mcd-core');
function harness(){
 let clock=0,nextId=1;const timers=new Map(),ids=new Map(),documentEvents={};
 class Element{
  constructor(id){this.id=id;this.hidden=false;this.disabled=false;this.dataset={};this.style={};this.events={};this.textContent='';}
  set innerHTML(value){this.html=value;if(this.id==='app'){for(const id of [...ids.keys()])if(!['app','openHistory'].includes(id))ids.delete(id);for(const match of value.matchAll(/<[^>]*id="([^"]+)"[^>]*>/g)){const el=new Element(match[1]);el.disabled=/\sdisabled(?:\s|>)/.test(match[0]);el.hidden=/\shidden(?:\s|>)/.test(match[0]);ids.set(match[1],el);}}}
  get innerHTML(){return this.html||'';}
  addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
  querySelector(){return new Element('heading');}querySelectorAll(){return [];}focus(){}matches(){return false;}click(){if(this.onclick)this.onclick();}
  setAttribute(name,value){this[name]=value;}
 }
 ids.set('app',new Element('app'));ids.set('openHistory',new Element('openHistory'));
 const document={hidden:false,getElementById:id=>ids.get(id),addEventListener:(name,fn)=>(documentEvents[name]??=[]).push(fn),querySelector:()=>({content:'/api/session'}),createElement:()=>new Element('download')};
 class Storage{constructor(){this.data=new Map();}getItem(k){return this.data.get(k)??null;}setItem(k,v){this.data.set(k,v);}removeItem(k){this.data.delete(k);}}
 class FakeDate extends Date{constructor(...args){super(...(args.length?args:[Date.parse('2026-10-10T01:00:00Z')+clock]));}static now(){return Date.parse('2026-10-10T01:00:00Z')+clock;}}
 const schedule=(fn,delay=0)=>{const id=nextId++;timers.set(id,{at:clock+delay,fn});return id;};
 const window={MCD:core,crypto:crypto.webcrypto,scrollTo(){},addEventListener(){},print(){}};
 let network=0;
 const context=vm.createContext({window,document,crypto:crypto.webcrypto,console,innerWidth:1000,innerHeight:800,devicePixelRatio:1,navigator:{language:'pt-BR'},Intl,Date:FakeDate,performance:{now:()=>clock},setTimeout:schedule,clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>schedule(fn,16),cancelAnimationFrame:id=>timers.delete(id),sessionStorage:new Storage(),localStorage:new Storage(),FormData:class{constructor(form){this.data=form.values||{};}get(k){return this.data[k]??'';}getAll(k){return this.data[k]||[];}has(k){return Boolean(this.data[k]);}},Blob,URL:{createObjectURL:()=>'',revokeObjectURL(){}},AbortSignal,fetch:async()=>{network++;return{ok:false,json:async()=>({error:'offline'})};}});
 vm.runInContext(fs.readFileSync('public/mcd/assets/experimento.js','utf8'),context);
 const evaluate=code=>vm.runInContext(code,context);
 function nextTimer(){const entries=[...timers.entries()].sort((a,b)=>a[1].at-b[1].at);if(!entries.length)throw Error('No scheduled timer');const[id,t]=entries[0];timers.delete(id);clock=t.at;t.fn();}
 function untilActive(){let count=0;while(!evaluate('active')){nextTimer();if(++count>100)throw Error('No active trial');}}
 function answer(key='f'){untilActive();clock+=200;for(const fn of documentEvents.keydown||[])fn({key,repeat:false,ctrlKey:false,metaKey:false,altKey:false,target:{matches:()=>false},preventDefault(){}});}
 function submit(id,values={}){const el=ids.get(id);el.values=values;const event={currentTarget:el,preventDefault(){}};if(el.onsubmit)el.onsubmit(event);for(const fn of el.events.submit||[])fn(event);}
 function start(){submit('setup',{ready:true,sleep_hours:'0',fatigue:'0'});ids.get('beginPractice').click();for(let i=0;i<6;i++)answer();}
 return{ids,document,documentEvents,evaluate,nextTimer,untilActive,answer,submit,start,network:()=>network};
}
test('real controller completes practice, conditions, post-task and local-only results',()=>{
 const h=harness();h.start();for(let b=0;b<3;b++){h.ids.get('beginCondition').click();for(let i=0;i<40;i++)h.answer(i%2?'j':'f');}
 assert.equal(h.evaluate('phase'),'post');h.submit('post');assert.equal(h.evaluate('phase'),'results');
 const p=h.evaluate('session');assert.equal(core.validateSessionPayload(p).isValid,true);assert.equal(p.tests.length,3);assert.equal(p.metadata.sleep_hours,0);assert.equal(p.metadata.fatigue,0);assert.equal(h.network(),0);assert.equal(h.ids.get('share').disabled,true);
 assert.equal(h.evaluate('csvExport(session).split("\\r\\n").length'),121);
});
test('hidden-tab interruption is a gap, resume is explicit, and repeats are ignored',()=>{
 const h=harness();h.start();h.ids.get('beginCondition').click();h.untilActive();
 for(const fn of h.documentEvents.keydown)fn({key:'f',repeat:true,target:{matches:()=>false}});
 assert.equal(h.evaluate('current.trials.length'),0);
 h.document.hidden=true;for(const fn of h.documentEvents.visibilitychange)fn();
 assert.equal(h.evaluate('paused'),true);assert.equal(h.evaluate('current.trials.length'),1);assert.equal(h.evaluate('current.trials[0].interrupted'),true);
 h.document.hidden=false;assert.equal(h.evaluate('active'),false);h.ids.get('resume').click();h.answer();assert.equal(h.evaluate('current.trials.length'),2);
});
test('deadline expiry records an absence rather than a selected color',()=>{
 const h=harness();h.start();h.evaluate("session.protocol.condition_order=['pressao','livre','equilibrio']");h.evaluate('conditionIntro()');h.ids.get('beginCondition').click();h.untilActive();
 let count=0;while(h.evaluate('current.trials.length')===0){h.nextTimer();assert.ok(++count<200);}
 assert.equal(h.evaluate('current.trials[0].timed_out'),true);assert.equal(h.evaluate('current.trials[0].choice_color'),null);assert.equal(h.evaluate('current.trials[0].reaction_time_ms'),null);assert.ok(h.evaluate('current.trials[0].elapsed_ms')>=1500);
});
