/* MCD 2.0: descriptive calculations shared by browser and server. */
(function(root,factory){const c=factory();if(typeof module==='object'&&module.exports)module.exports=c;else root.MCD=c;})(globalThis,function(){
'use strict';
const VERSION='mcd-2.0.0';
const CONDITIONS=Object.freeze({
 livre:{title:'Livre',instruction:'Escolha azul ou vermelho a cada apresentação. Não há resposta certa nem meta de quantidade. Escolha da maneira que preferir.',deadline_ms:null},
 equilibrio:{title:'Meio a meio',instruction:'Ao longo de 40 escolhas, tente escolher azul e vermelho em quantidades iguais. A maneira de fazer isso fica a seu critério.',deadline_ms:null},
 pressao:{title:'Com prazo',instruction:'Escolha azul ou vermelho a cada apresentação, dentro de 1,5 segundo. Não há resposta certa nem meta de quantidade. Se o prazo acabar, a tentativa será registrada sem resposta.',deadline_ms:1500}
});
const median=a=>{if(!a.length)return null;const s=a.slice().sort((x,y)=>x-y),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;};
const round=x=>x===null||!Number.isFinite(x)?null:Math.round(x*10000)/10000;
const valid=t=>!t.interrupted&&!t.timed_out&&['azul','vermelho'].includes(t.choice_color)&&Number.isFinite(t.reaction_time_ms);
function correlation(p){if(p.length<2)return null;const mx=p.reduce((s,v)=>s+v[0],0)/p.length,my=p.reduce((s,v)=>s+v[1],0)/p.length;let cov=0,vx=0,vy=0;for(const[x,y]of p){cov+=(x-mx)*(y-my);vx+=(x-mx)**2;vy+=(y-my)**2;}return vx&&vy?round(cov/Math.sqrt(vx*vy)):null;}
function computeTestMetrics(test){
 const ts=test.trials||[],responses=ts.filter(valid),n=responses.length,blue=responses.filter(t=>t.choice_color==='azul').length;
 let reversals=0,sideReversals=0,longest=0,run=0,prev=null;const pairs=[],switching=[],repeating=[];
 for(const t of ts){if(!valid(t)){prev=null;run=0;continue;}run=prev&&prev.choice_color===t.choice_color?run+1:1;longest=Math.max(longest,run);if(prev){const changed=prev.choice_color!==t.choice_color;reversals+=Number(changed);sideReversals+=Number(prev.choice_side!==t.choice_side);pairs.push([Number(prev.choice_color==='azul'),Number(t.choice_color==='azul')]);(changed?switching:repeating).push(t.reaction_time_ms);}prev=t;}
 const windows=[];for(let i=0;i<ts.length;i+=10){const a=ts.slice(i,i+10).filter(valid);windows.push({from:i+1,to:Math.min(i+10,ts.length),valid_trials:a.length,blue_fraction:a.length?round(a.filter(t=>t.choice_color==='azul').length/a.length):null,median_rt_ms:median(a.map(t=>t.reaction_time_ms))});}
 const first=ts.slice(0,20).filter(valid),last=ts.slice(20,40).filter(valid),fraction=a=>a.filter(t=>t.choice_color==='azul').length/a.length;
 return {test_type:test.test_type,total_trials:ts.length,valid_trials:n,timeout_trials:ts.filter(t=>t.timed_out).length,interrupted_trials:ts.filter(t=>t.interrupted).length,blue_count:blue,red_count:n-blue,left_count:responses.filter(t=>t.choice_side==='left').length,right_count:responses.filter(t=>t.choice_side==='right').length,r:n?round(Math.abs(2*blue/n-1)):null,adjacent_pairs:pairs.length,reversals,reversal_rate:pairs.length?round(reversals/pairs.length):null,side_reversals:sideReversals,longest_run:longest,median_reaction_time_ms:median(responses.map(t=>t.reaction_time_ms)),switch_trials:switching.length,repeat_trials:repeating.length,switch_cost_ms:switching.length&&repeating.length?median(switching)-median(repeating):null,ac1:correlation(pairs),drift_blue_fraction:first.length>=10&&last.length>=10?round(fraction(last)-fraction(first)):null,windows,quality_flags:[...(n<40?['respostas_ausentes']:[]),...(ts.some(t=>t.interrupted)?['interrupcao']:[]),...(responses.some(t=>t.reaction_time_ms<100)?['respostas_abaixo_de_100ms']:[]),...(switching.length<5||repeating.length<5?['poucos_pares_para_custo_de_troca']:[])]};
}
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),iso=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT/.test(x)&&Number.isFinite(Date.parse(x));
function validateSessionPayload(p){
 const errors=[];if(!object(p))return{isValid:false,errors:['Sessão deve ser um objeto.']};
 if(p.protocol_version!==VERSION)errors.push('Versão do protocolo incompatível.');
 if(typeof p.session_id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.session_id))errors.push('Identificador inválido.');
 if(!iso(p.started_at)||!iso(p.finished_at)||Date.parse(p.finished_at)<Date.parse(p.started_at))errors.push('Datas da sessão inválidas.');
 if(!object(p.metadata)||!object(p.post_task))errors.push('Metadados ou relato final ausentes.');
 if(!object(p.protocol)||!Array.isArray(p.protocol.condition_order)||p.protocol.condition_order.length!==3||new Set(p.protocol.condition_order).size!==3||p.protocol.condition_order.some(c=>!Object.hasOwn(CONDITIONS,c)))errors.push('Ordem das condições inválida.');
 if(p.protocol?.trials_per_condition!==40||p.protocol?.practice_trials!==6||p.protocol?.inter_trial_ms!==300||p.protocol?.position_policy!=='balanced_per_condition')errors.push('Parâmetros do protocolo inválidos.');
 if(!Array.isArray(p.tests)||p.tests.length!==3)return{isValid:false,errors:[...errors,'São necessárias três condições completas.']};
 const types=new Set();p.tests.forEach((test,i)=>{
  if(!object(test)||!Object.hasOwn(CONDITIONS,test.test_type)){errors.push('Condição inválida.');return;}
  if(types.has(test.test_type)||p.protocol?.condition_order?.[i]!==test.test_type)errors.push('Condições repetidas ou fora de ordem.');types.add(test.test_type);
  if(test.instruction!==CONDITIONS[test.test_type].instruction||test.deadline_ms!==CONDITIONS[test.test_type].deadline_ms)errors.push('Instrução ou prazo diferente do protocolo.');
  if(!iso(test.started_at)||!iso(test.finished_at)||Date.parse(test.finished_at)<Date.parse(test.started_at)||Date.parse(test.started_at)<Date.parse(p.started_at)||Date.parse(test.finished_at)>Date.parse(p.finished_at))errors.push('Datas da condição inválidas.');
  if(!Array.isArray(test.trials)||test.trials.length!==40){errors.push('Cada condição deve conter 40 tentativas.');return;}
  let blueLeft=0;test.trials.forEach((t,j)=>{
   if(!object(t)){errors.push('Tentativa inválida.');return;}
   if(t.trial_index!==j+1||!iso(t.timestamp)||!iso(t.presented_at)||Date.parse(t.timestamp)<Date.parse(t.presented_at)||Date.parse(t.presented_at)<Date.parse(test.started_at)||Date.parse(t.timestamp)>Date.parse(test.finished_at))errors.push('Índice ou datas da tentativa inválidos.');
   if(!['azul','vermelho'].includes(t.left_color)||!['azul','vermelho'].includes(t.right_color)||t.left_color===t.right_color)errors.push('Posições das cores inválidas.');blueLeft+=Number(t.left_color==='azul');
   if(typeof t.timed_out!=='boolean'||typeof t.interrupted!=='boolean'||(t.timed_out&&t.interrupted))errors.push('Estado da tentativa inválido.');
   if(!Number.isFinite(t.elapsed_ms)||t.elapsed_ms<0||!['pointer','keyboard','timeout','interruption'].includes(t.input_method))errors.push('Tempo ou método inválido.');
   if(t.interrupted||t.timed_out){
    if(t.choice_color!==null||t.choice_side!==null||t.reaction_time_ms!==null)errors.push('Tentativa sem resposta deve ter escolha e tempo de reação nulos.');
    if(t.timed_out&&(test.deadline_ms===null||t.elapsed_ms<test.deadline_ms||t.input_method!=='timeout'))errors.push('Prazo inválido.');
    if(t.interrupted&&t.input_method!=='interruption')errors.push('Interrupção inválida.');
   }else{
    if(!['left','right'].includes(t.choice_side)||t.choice_color!==t[`${t.choice_side}_color`]||!['pointer','keyboard'].includes(t.input_method))errors.push('Escolha incompatível com posição.');
    if(!Number.isFinite(t.reaction_time_ms)||t.reaction_time_ms<0||Math.abs(t.reaction_time_ms-t.elapsed_ms)>1||(test.deadline_ms!==null&&t.reaction_time_ms>test.deadline_ms))errors.push('Tempo de resposta inválido.');
   }
  });if(blueLeft!==20)errors.push('Posições não balanceadas.');
 });
 if(object(p.metadata)){
  const m=p.metadata;for(const[key,max]of[['sleep_hours',24],['fatigue',10]])if(m[key]!==null&&(!Number.isFinite(m[key])||m[key]<0||m[key]>max))errors.push(`Metadado ${key} inválido.`);
  for(const key of['context_note','study_code'])if(typeof m[key]!=='string'||m[key].length>(key==='study_code'?64:600))errors.push(`Metadado ${key} inválido.`);
  const allowed={mood:['','bom','neutro','baixo','misto'],motivation:['','curiosidade','comparar','pesquisa','outro'],familiarity:['','primeira','ja_fiz','conheco_metodo'],distractions:['','tranquilo','algumas','muitas']};for(const[key,values]of Object.entries(allowed))if(!values.includes(m[key]))errors.push(`Metadado ${key} inválido.`);
  if(!Array.isArray(m.recent_context)||m.recent_context.length>6||new Set(m.recent_context).size!==m.recent_context.length||m.recent_context.some(v=>!['cafeina','nicotina','alcool','cannabis','medicacao','exercicio'].includes(v)))errors.push('Contexto recente inválido.');
 }
 if(object(p.post_task))for(const type of Object.keys(CONDITIONS)){const a=p.post_task[type];if(!object(a)||!['','sem_regra','alternar','blocos','preferencia','contagem','posicao','outra'].includes(a.strategy)||typeof a.note!=='string'||a.note.length>600||typeof a.changed_strategy!=='boolean')errors.push('Relato de estratégia inválido.');}
 return{isValid:!errors.length,errors:[...new Set(errors)]};
}
function processSession(p){const validation=validateSessionPayload(p);if(!validation.isValid)return{success:false,validation};const test_metrics=p.tests.map(computeTestMetrics);return{success:true,protocol_version:VERSION,session_id:p.session_id,test_metrics,session_metrics:{total_trials:120,valid_trials:test_metrics.reduce((s,t)=>s+t.valid_trials,0),started_at:p.started_at,finished_at:p.finished_at},display_summary:{main_message:'Este registro descreve suas escolhas nesta sessão. Quantidade, sequência e ritmo são dimensões diferentes; nenhuma delas é uma nota sobre você.'}};}
function describe(m){if(!m.valid_trials)return'Não houve respostas válidas nesta condição. As tentativas sem resposta permanecem no registro.';return`Você escolheu azul ${m.blue_count} vezes e vermelho ${m.red_count} vezes. Houve ${m.reversals} trocas de cor em ${m.adjacent_pairs} pares consecutivos válidos. A maior repetição foi de ${m.longest_run} escolhas. O tempo mediano registrado foi ${Math.round(m.median_reaction_time_ms)} ms.`;}
function shuffle(items,random=Math.random){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
return{VERSION,CONDITIONS,median,computeTestMetrics,validateSessionPayload,processSession,describe,shuffle};
});
