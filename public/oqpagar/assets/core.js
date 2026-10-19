/* Oqpagar: pure calculations and strict backup validation. No network or storage. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Oqpagar=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX=1e10,types=['essential','card','late','negotiable','loan','other'];
const money=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
const cents=n=>Math.round(Number(n)*100);
const sum=a=>a.reduce((s,n)=>s+cents(n),0)/100;
function iso(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00');return Number.isFinite(+d)&&iso(d)===s&&+s.slice(0,4)>=1900;}
function addDays(n,base=iso()){const d=new Date(base+'T12:00:00');d.setDate(d.getDate()+n);return iso(d);}
function days(date,today=iso()){const utc=s=>Date.UTC(...s.split('-').map((v,i)=>Number(v)-(i===1?1:0)));return Math.round((utc(date)-utc(today))/864e5);}
function amount(v,positive=false){if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>MAX||(positive&&v===0))throw Error('Há um valor inválido no arquivo.');return money(v);}
function name(v){if(typeof v!=='string'||!v.trim()||v.length>100)throw Error('Nome inválido: use até 100 caracteres.');return v.trim();}
function date(v){if(!validDate(v))throw Error('Há uma data inválida no arquivo.');return v;}
function id(){return typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'id-'+Math.random().toString(36).slice(2)+Date.now().toString(36);}
function empty(){return {version:2,cashNow:0,debts:[],incomes:[],cards:[]};}
function validate(raw,{rekey=false}={}){
 if(!raw||typeof raw!=='object'||!['debts','incomes','cards'].every(k=>Array.isArray(raw[k])&&raw[k].length<=2000))throw Error('Backup incompatível. Use um arquivo exportado pelo Oqpagar.');
 if(raw.version!==undefined&&raw.version!==2)throw Error('Versão do backup não suportada.');
 const ids=new Set();const safeId=v=>{let k=!rekey&&typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v)?v:id();if(ids.has(k))k=id();ids.add(k);return k;};
 const out=empty();out.cashNow=amount(raw.cashNow);
 out.debts=raw.debts.map(d=>{if(typeof d.paid!=='boolean'||!types.includes(d.type))throw Error('Conta inválida no backup.');return {id:safeId(d.id),name:name(d.name),amount:amount(d.amount,true),dueDate:date(d.dueDate),type:d.type,paid:d.paid};});
 out.incomes=raw.incomes.map(d=>{if(d.received!==undefined&&typeof d.received!=='boolean')throw Error('Entrada inválida no backup.');return {id:safeId(d.id),name:name(d.name),amount:amount(d.amount,true),date:date(d.date),received:!!d.received};});
 out.cards=raw.cards.map(d=>{for(const k of ['dueDay','closingDay'])if(!Number.isInteger(d[k])||d[k]<0||d[k]>31)throw Error('Dia do cartão inválido.');return {id:safeId(d.id),name:name(d.name),limit:amount(d.limit,true),invoice:amount(d.invoice),dueDay:d.dueDay,closingDay:d.closingDay};});
 return out;
}
function summary(s,horizon=7,today=iso()){
 const debtItems=s.debts.filter(d=>!d.paid&&days(d.dueDate,today)<=horizon);
 const incomeItems=s.incomes.filter(d=>!d.received&&days(d.date,today)>=0&&days(d.date,today)<=horizon);
 const due=sum(debtItems.map(d=>d.amount)),income=sum(incomeItems.map(d=>d.amount));
 return {due,income,cash:s.cashNow,gap:sum([s.cashNow,income,-due]),overdueIncome:s.incomes.filter(d=>!d.received&&days(d.date,today)<0).length};
}
function simulate(s,value,{debtId=null,today=iso()}={}){
 const p=summary(s,7,today);const existing=s.debts.find(d=>d.id===debtId&&!d.paid&&days(d.dueDate,today)<=7);
 return {cashAfter:money(s.cashNow-value),forecastAfter:sum([p.gap,-value,existing?existing.amount:0]),included:!!existing};
}
function pay(s,debtId){const d=s.debts.find(d=>d.id===debtId&&!d.paid);if(!d)throw Error('Conta não encontrada.');if(cents(s.cashNow)<cents(d.amount))throw Error('Saldo de hoje insuficiente. Atualize o saldo antes de registrar o pagamento.');s.cashNow=sum([s.cashNow,-d.amount]);d.paid=true;}
function receive(s,incomeId){const d=s.incomes.find(d=>d.id===incomeId&&!d.received);if(!d)throw Error('Entrada não encontrada.');if(sum([s.cashNow,d.amount])>MAX)throw Error('Saldo acima do limite aceito.');s.cashNow=sum([s.cashNow,d.amount]);d.received=true;}
function ranked(s,today=iso()){return s.debts.filter(d=>!d.paid).slice().sort((a,b)=>days(a.dueDate,today)-days(b.dueDate,today)||(a.type==='essential'?-1:0)-(b.type==='essential'?-1:0));}
return {money,sum,iso,validDate,addDays,days,amount,id,empty,validate,summary,simulate,pay,receive,ranked,types};
});
