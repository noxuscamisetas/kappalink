const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../public/oqpagar/assets/core.js');
const today='2026-10-19';
const debt=(id,amount,dueDate='2026-10-20')=>({id,name:'Conta',amount,dueDate,type:'essential',paid:false});
const income=(id,amount,date)=>({id,name:'Entrada',amount,date,received:false});
test('forecast excludes past and received incomes, includes overdue unpaid bills, never card limits',()=>{
 const s=C.empty();s.cashNow=100;s.debts=[debt('a',80,'2026-10-18'),debt('b',20,'2026-10-27'),{...debt('c',99),paid:true}];s.incomes=[income('x',50,'2026-10-20'),income('y',999,'2026-10-18'),{...income('z',100,'2026-10-19'),received:true}];s.cards=[{limit:99999,invoice:200}];
 assert.deepEqual(C.summary(s,7,today),{cash:100,due:80,income:50,gap:70,overdueIncome:1});
});
test('simulating an existing near-term bill does not subtract it twice; new expense does',()=>{
 const s=C.empty();s.cashNow=200;s.debts=[debt('a',60),debt('b',50,'2026-11-01')];
 assert.deepEqual(C.simulate(s,60,{debtId:'a',today}),{cashAfter:140,forecastAfter:140,included:true});
 assert.equal(C.simulate(s,60,{today}).forecastAfter,80);
 assert.equal(C.simulate(s,50,{debtId:'b',today}).forecastAfter,90);
});
test('paying preserves cents, cannot silently clamp an insufficient balance, cannot pay twice',()=>{const s=C.empty();s.cashNow=.3;s.debts=[debt('a',.1),debt('b',1)];C.pay(s,'a');assert.equal(s.cashNow,.2);assert.throws(()=>C.pay(s,'a'));assert.throws(()=>C.pay(s,'b'));assert.equal(s.debts[1].paid,false);assert.equal(s.cashNow,.2);});
test('received income increases actual balance once and leaves forecast',()=>{const s=C.empty();s.incomes=[income('a',10,today)];C.receive(s,'a');assert.equal(s.cashNow,10);assert.equal(C.summary(s,7,today).income,0);assert.throws(()=>C.receive(s,'a'));assert.equal(s.cashNow,10);});
test('backup validation rejects malformed values, dates and IDs cannot inject HTML',()=>{
 const s=C.empty();s.debts=[debt('\" onclick=alert(1)',10)];s.debts[0].name='<img src=x onerror=alert(1)>';
 const restored=C.validate(s);assert.match(restored.debts[0].id,/^[a-zA-Z0-9_-]+$/);assert.equal(restored.debts[0].name,s.debts[0].name);
 for(const value of [NaN,Infinity,-1,'10'])assert.throws(()=>C.validate({...s,cashNow:value}));
 assert.throws(()=>C.validate({...s,debts:[debt('a',10,'2026-02-30')]}));assert.throws(()=>C.validate({...s,version:900}));
});
test('old Oqpagar backup restores safely with expected unreceived income semantics',()=>{const old={cashNow:30,debts:[debt('a',10)],incomes:[{id:'b',name:'Pix',amount:10,date:today}],cards:[]};const r=C.validate(old,{rekey:true});assert.equal(r.version,2);assert.equal(r.incomes[0].received,false);assert.notEqual(r.debts[0].id,'a');assert.equal(r.cashNow,30);});
test('local dates preserve calendar day across DST and month boundaries',()=>{assert.equal(C.addDays(1,'2026-10-31'),'2026-11-01');assert.equal(C.days('2026-11-02','2026-10-31'),2);assert.equal(C.validDate('2026-02-30'),false);assert.equal(C.validDate('2028-02-29'),true);});
test('app blocks storage on the shared KappaLink origin',()=>{let target;vm.runInNewContext(fs.readFileSync('public/oqpagar/assets/app.js','utf8'),{location:{hostname:'www.kappalink.com',replace:v=>target=v}});assert.equal(target,'https://oqpagar.kappalink.com/');});
test('privacy headers and routes isolate app; local scripts only, no analytics or data requests',()=>{
 const config=JSON.parse(fs.readFileSync('vercel.json'));const host='oqpagar.kappalink.com';const matching=config.routes.filter(r=>r.has?.some(h=>h.type==='host'&&new RegExp('^(?:'+h.value+')$').test(host)));
 assert(matching.some(r=>r.dest==='/oqpagar/$1'));assert(matching.some(r=>r.headers?.['Content-Security-Policy']?.includes("connect-src 'none'")));
 assert(matching.some(r=>r.headers?.['Content-Security-Policy']?.includes("script-src 'self'")));
 const html=fs.readFileSync('public/oqpagar/index.html','utf8');assert(!/<script(?![^>]*src=)[^>]*>[^<]+/i.test(html));assert(!/googletagmanager|google-analytics/i.test(html));
 const app=fs.readFileSync('public/oqpagar/assets/app.js','utf8');assert(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/.test(app));assert(app.includes('JSON.stringify(state'));assert(html.includes('sem criptografia'));assert(html.includes('Meus dados'));
});
function controller(initial){
 const nodes=new Map(),listeners={},storage=new Map(initial?[["oqpagar_v2",initial]]:[]);let fail=false;
 const get=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',hidden:false,dataset:{},classList:{toggle(){}},addEventListener(k,f){this[k]=f;},focus(){},reset(){}});return nodes.get(id);};
 const context={window:{Oqpagar:C,addEventListener(k,f){listeners[k]=f;}},location:{hostname:'oqpagar.kappalink.com'},document:{getElementById:get,querySelectorAll(){return[];},querySelector(){return null;},addEventListener(k,f){listeners[k]=f;}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{if(fail)throw Error('Armazenamento indisponível');storage.set(k,v);},removeItem:k=>storage.delete(k)},Intl,confirm:()=>true,setTimeout,console};
 vm.runInNewContext(fs.readFileSync('public/oqpagar/assets/app.js','utf8'),context);
 return {get,listeners,storage,fail(){fail=true;},submit:id=>get(id).submit({preventDefault(){}}),click:(action,id)=>listeners.click({target:{closest:()=>({dataset:{action,id}})}})};
}
test('real controller persists, escapes names, pays once and restores after reload',()=>{
 const ui=controller();ui.get('cashNow').value='200';ui.submit('cashForm');
 ui.get('debtName').value='<img src=x onerror=alert(1)>';ui.get('debtAmount').value='50';ui.get('debtDate').value=C.iso();ui.get('debtType').value='essential';ui.submit('debtForm');
 assert(ui.get('debtsList').innerHTML.includes('&lt;img'));assert(!ui.get('debtsList').innerHTML.includes('<img'));
 const saved=JSON.parse(ui.storage.get('oqpagar_v2'));ui.click('pay',saved.debts[0].id);ui.click('pay',saved.debts[0].id);
 const paid=JSON.parse(ui.storage.get('oqpagar_v2'));assert.equal(paid.cashNow,150);assert.equal(paid.debts[0].paid,true);
 const reload=controller(JSON.stringify(paid));assert.equal(reload.get('cashTop').textContent,ui.get('cashTop').textContent);assert(reload.get('paidList').innerHTML.includes('&lt;img'));
});
test('failed writes and cross-tab changes never report a successful mutation',()=>{const ui=controller();ui.fail();ui.get('cashNow').value='99';ui.submit('cashForm');assert.equal(ui.storage.size,0);assert.match(ui.get('status').textContent,/indisponível/);const other=controller();other.listeners.storage({key:'oqpagar_v2'});other.get('cashNow').value='42';other.submit('cashForm');assert.equal(other.storage.size,0);});
test('invalid stored data stays untouched and write controls cannot overwrite it',()=>{const bad='{broken';const ui=controller(bad);ui.get('cashNow').value='10';ui.submit('cashForm');assert.equal(ui.storage.get('oqpagar_v2'),bad);});
