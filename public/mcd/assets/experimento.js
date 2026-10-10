/* MCD browser experience. No network requests before explicit sharing. */
'use strict';
const app=document.getElementById('app'),core=window.MCD;
const KEYS={draft:'mcd_v2_draft',last:'mcd_v2_last',history:'mcd_v2_history'};
let session=null,schedules={},block=0,phase='intro',practice=false,practiceTrials=[],current=null,presented=0,presentedAt='',active=false,timeout=null,gapTimer=null,frame=null,paused=false,pointerSeen=false;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now=()=>new Date().toISOString();
function read(key,local=false){try{return JSON.parse((local?localStorage:sessionStorage).getItem(key));}catch{return null;}}
function write(key,value,local=false){try{(local?localStorage:sessionStorage).setItem(key,JSON.stringify(value));return true;}catch{return false;}}
function remove(key,local=false){try{(local?localStorage:sessionStorage).removeItem(key);}catch{}}
function saveDraft(){if(session&&!session.finished_at)write(KEYS.draft,{session,schedules,block,phase});}
function render(html){app.innerHTML=html;const heading=app.querySelector('h1,h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}window.scrollTo({top:0,behavior:'instant'});}
function stopTimers(){clearTimeout(timeout);clearTimeout(gapTimer);cancelAnimationFrame(frame);active=false;}
function field(label,name,pairs){return`<fieldset class="field option-field"><legend>${esc(label)}</legend><div class="option-buttons">${[...pairs,['','Não informar']].map(([v,l])=>`<label class="option-button"><input type="radio" name="${esc(name)}" value="${esc(v)}" ${v===''?'checked':''}><span>${esc(l)}</span></label>`).join('')}</div></fieldset>`;}
function intro(){
 phase='intro';document.getElementById('openHistory').hidden=false;
 render(`<div class="app-heading"><div class="eyebrow">Antes de começar</div><h1>Um momento. Um registro.</h1><p>Você fará três condições de 40 tentativas. Não existe uma nota sobre você. O contexto abaixo é opcional e ajuda a situar o registro.</p></div><form id="setup" class="panel"><h2>Como você chega agora?</h2><p class="muted small">Deixe em branco o que não quiser registrar. Evite nomes, contatos ou informações que identifiquem outras pessoas.</p><div class="form-grid">
 <label class="field">Horas de sono na última noite<input name="sleep_hours" type="number" min="0" max="24" step="0.5" placeholder="Não informado"></label>
 ${field('Cansaço agora · 0 = nenhum, 10 = muito','fatigue',Array.from({length:11},(_,n)=>[String(n),String(n)]))}
 ${field('Como está seu humor?', 'mood',[['bom','Bom'],['neutro','Neutro'],['baixo','Baixo'],['misto','Misto']])}
 ${field('O ambiente tem distrações?', 'distractions',[['tranquilo','Tranquilo'],['algumas','Algumas'],['muitas','Muitas']])}
 ${field('O que trouxe você aqui?', 'motivation',[['curiosidade','Curiosidade'],['comparar','Comparar minhas sessões'],['pesquisa','Participar de uma pesquisa'],['outro','Outro motivo']])}
 ${field('Você já conhece o MCD?', 'familiarity',[['primeira','É minha primeira vez'],['ja_fiz','Já fiz a experiência'],['conheco_metodo','Conheço o método e as métricas']])}
 <div class="field full"><span>Nas últimas 6 horas · opcional</span><div class="chips">${[['cafeina','Cafeína'],['nicotina','Nicotina'],['alcool','Álcool'],['cannabis','Cannabis'],['medicacao','Medicação'],['exercicio','Exercício']].map(([v,l])=>`<label class="option-button"><input type="checkbox" name="recent_context" value="${v}"><span>${l}</span></label>`).join('')}</div><span class="small muted">Nenhuma seleção significa “não informado”, não ausência de consumo ou atividade.</span></div>
 <details class="field full extra-context"><summary>Adicionar uma observação ou código · opcional</summary><label class="field full">Algo sobre este momento?<textarea name="context_note" maxlength="600" placeholder="Uma observação breve, se quiser."></textarea></label>
 <label class="field full">Código de acompanhamento · opcional<input name="study_code" maxlength="64" placeholder="Um código seu, sem nome ou e-mail"><span class="small muted">Use o mesmo código em outras sessões se quiser relacionar seus registros. Não é uma conta.</span></label></details></div>
 <div class="callout">O resultado é calculado no navegador. Nenhum registro é enviado automaticamente. Ao final, você escolhe se quer exportar, guardar neste aparelho ou compartilhar com a coleta independente.</div>
 <label class="check"><input type="checkbox" name="ready" required><span>Li como funciona e quero realizar a experiência. Sei que posso interromper.</span></label>
 <div class="actions"><button class="button" type="submit">Ir para o treino →</button><a class="button secondary" href="metodologia.html">Conhecer o método</a></div><p id="setupError" class="error" role="alert"></p></form>`);
 document.getElementById('setup').addEventListener('submit',event=>{
  event.preventDefault();const f=new FormData(event.currentTarget),number=n=>f.get(n)===''?null:Number(f.get(n));
  if(!window.crypto?.randomUUID){document.getElementById('setupError').textContent='Abra esta experiência por uma conexão HTTPS para iniciar.';return;}
  const order=core.shuffle(Object.keys(core.CONDITIONS));schedules=Object.fromEntries(order.map(type=>[type,core.shuffle([...Array(20).fill('azul'),...Array(20).fill('vermelho')])]));
  session={session_id:crypto.randomUUID(),protocol_version:core.VERSION,started_at:now(),finished_at:null,
   protocol:{condition_order:order,trials_per_condition:40,practice_trials:6,inter_trial_ms:300,position_policy:'balanced_per_condition'},
   metadata:{sleep_hours:number('sleep_hours'),fatigue:number('fatigue'),mood:f.get('mood'),distractions:f.get('distractions'),motivation:f.get('motivation'),familiarity:f.get('familiarity'),recent_context:f.getAll('recent_context'),context_note:f.get('context_note'),study_code:f.get('study_code'),environment:{viewport_width:innerWidth,viewport_height:innerHeight,device_pixel_ratio:devicePixelRatio,language:navigator.language,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,input_methods:[],visibility_events:[],timing:'performance.now; presentation scheduled by requestAnimationFrame'}},tests:[],post_task:{},share_consent:false};
  block=0;phase='practice';saveDraft();practiceIntro();
 });
}
function practiceIntro(){
 render(`<div class="panel test-panel"><div class="test-label">Treino · fora dos resultados</div><h2>Conheça os controles.</h2><p>Faça seis escolhas para se familiarizar. Os botões mudam de posição. Toque ou clique em uma cor; no teclado, use <strong>F para o lado esquerdo</strong> e <strong>J para o direito</strong>.</p><p>Uma nova tentativa começa depois de um breve intervalo. Mantenha esta aba em primeiro plano durante a tarefa.</p><div class="actions" style="justify-content:center"><button id="beginPractice" class="button">Começar o treino →</button></div></div>`);
 document.getElementById('beginPractice').onclick=()=>{practice=true;practiceTrials=[];startTask();};
}
function conditionIntro(){
 practice=false;phase='condition';saveDraft();const type=session.protocol.condition_order[block],c=core.CONDITIONS[type],existing=session.tests[block];
 render(`<div class="panel test-panel"><div class="test-label">Condição ${block+1} de 3</div><h2>${c.title}</h2><p>${c.instruction}</p>${existing?.trials.length?`<div class="callout">Retomando após ${existing.trials.length} tentativas registradas. A interrupção permanece no registro.</div>`:''}<p class="small">40 tentativas · cores em posições variáveis · F = esquerda / J = direita</p><div class="actions" style="justify-content:center"><button id="beginCondition" class="button">${existing?.trials.length?'Continuar':'Começar'} esta condição →</button></div></div>`);
 document.getElementById('beginCondition').onclick=()=>{
  if(!session.tests[block])session.tests.push({test_type:type,instruction:c.instruction,deadline_ms:c.deadline_ms,started_at:now(),finished_at:null,trials:[]});
  current=session.tests[block];startTask();
 };
}
function taskTrials(){return practice?practiceTrials:current.trials;}
function taskTotal(){return practice?6:40;}
function startTask(){
 paused=false;pointerSeen=false;document.getElementById('openHistory').hidden=true;
 render(`<div class="panel test-panel"><div class="test-label">${practice?'Treino':`Condição ${block+1} de 3`}</div><h2>${practice?'Faça uma escolha':core.CONDITIONS[current.test_type].title}</h2><p>${practice?'Escolha uma das duas cores.':current.instruction}</p><div class="trial-progress" aria-hidden="true"><div id="progressBar"></div></div><div id="counter" class="test-label"></div><div id="deadline" class="deadline" ${practice||current.deadline_ms===null?'hidden':''} aria-label="Tempo disponível"><div id="deadlineBar"></div></div><div class="choice-area"><button id="leftChoice" class="choice" disabled aria-label="Escolha no lado esquerdo">Aguarde</button><button id="rightChoice" class="choice" disabled aria-label="Escolha no lado direito">Aguarde</button></div><div id="taskStatus" class="status" role="status" aria-live="polite">Preparando a primeira tentativa…</div><div id="pausePanel" hidden><p>A tentativa em andamento foi marcada como interrompida. Volte quando estiver pronto.</p><button id="resume" class="button">Continuar</button></div><div class="actions" style="justify-content:center"><button id="pause" class="button secondary">Pausar</button><button id="stop" class="button secondary">Encerrar sem concluir</button></div></div>`);
 for(const side of['left','right']){
  const button=document.getElementById(`${side}Choice`);
  button.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;pointerSeen=true;respond(side,'pointer');});
  button.addEventListener('click',e=>{if(e.detail===0&&!pointerSeen)respond(side,'keyboard');pointerSeen=false;});
 }
 document.getElementById('pause').onclick=()=>pauseTask('manual');
 document.getElementById('resume').onclick=()=>{paused=false;document.getElementById('pausePanel').hidden=true;document.getElementById('pause').disabled=false;queueTrial();};
 document.getElementById('stop').onclick=stopConfirm;
 queueTrial();
}
function queueTrial(){
 stopTimers();if(paused)return;
 if(taskTrials().length>=taskTotal()){finishCondition();return;}
 document.getElementById('counter').textContent=`Tentativa ${taskTrials().length+1} / ${taskTotal()}`;
 document.getElementById('progressBar').style.width=`${100*taskTrials().length/taskTotal()}%`;
 for(const side of['left','right']){const b=document.getElementById(`${side}Choice`);b.disabled=true;b.textContent='·';b.className='choice';}
 document.getElementById('taskStatus').textContent='Intervalo';
 gapTimer=setTimeout(()=>{
  if(document.hidden){pauseTask('aba_oculta');return;}
  frame=requestAnimationFrame(()=>{
   if(paused||document.hidden)return;
   const left=practice?(taskTrials().length%2?'vermelho':'azul'):schedules[current.test_type][taskTrials().length];
   for(const side of['left','right']){
    const color=side==='left'?left:(left==='azul'?'vermelho':'azul'),b=document.getElementById(`${side}Choice`);
    b.dataset.color=color;b.className=`choice ${color==='vermelho'?'red':''}`;b.innerHTML=`${color.toUpperCase()}<small>${side==='left'?'F · esquerda':'J · direita'}</small>`;b.setAttribute('aria-label',`${color}, lado ${side==='left'?'esquerdo':'direito'}`);b.disabled=false;
   }
   // A second frame avoids charging DOM preparation to the response time.
   frame=requestAnimationFrame(()=>{
    if(paused||document.hidden)return;
    presented=performance.now();presentedAt=now();active=true;document.getElementById('taskStatus').textContent='Escolha uma cor';
    if(!practice&&current.deadline_ms!==null){timeout=setTimeout(()=>respond(null,'timeout'),current.deadline_ms);animateDeadline();}
   });
  });
 },300);
}
function animateDeadline(){if(!active||practice||current.deadline_ms===null)return;document.getElementById('deadlineBar').style.transform=`scaleX(${Math.max(0,1-(performance.now()-presented)/current.deadline_ms)})`;frame=requestAnimationFrame(animateDeadline);}
function respond(side,method){
 if(!active)return;
 const elapsed=Math.max(0,Math.round(performance.now()-presented));
 if(method==='timeout'&&!practice&&elapsed<current.deadline_ms){timeout=setTimeout(()=>respond(null,'timeout'),current.deadline_ms-elapsed);return;}
 if(!practice&&current.deadline_ms!==null&&elapsed>=current.deadline_ms&&method!=='interruption'){side=null;method='timeout';}
 const interrupted=method==='interruption',timedOut=method==='timeout';
 const left=document.getElementById('leftChoice').dataset.color,right=document.getElementById('rightChoice').dataset.color;
 const t={trial_index:taskTrials().length+1,presented_at:presentedAt,timestamp:now(),left_color:left,right_color:right,choice_side:side,choice_color:side?(side==='left'?left:right):null,reaction_time_ms:side?elapsed:null,elapsed_ms:elapsed,timed_out:timedOut,interrupted,input_method:method};
 stopTimers();taskTrials().push(t);
 if(!practice){const inputs=session.metadata.environment.input_methods;if(['pointer','keyboard'].includes(method)&&!inputs.includes(method))inputs.push(method);saveDraft();}
 if(!paused)queueTrial();
}
function pauseTask(reason){
 if(paused)return;paused=true;
 if(active)respond(null,'interruption');else stopTimers();
 if(session){session.metadata.environment.visibility_events.push({at:now(),reason,condition:practice?'practice':current?.test_type,after_trial:taskTrials().length});saveDraft();}
 document.getElementById('pausePanel').hidden=false;document.getElementById('pause').disabled=true;
 document.getElementById('taskStatus').textContent='Pausado';for(const side of['left','right'])document.getElementById(`${side}Choice`).disabled=true;
}
function finishCondition(){
 stopTimers();if(practice){practice=false;conditionIntro();return;}
 current.finished_at=now();block++;saveDraft();
 if(block<3)conditionIntro();else{phase='post';saveDraft();postTask();}
}
function postTask(){
 document.getElementById('openHistory').hidden=true;
 render(`<div class="app-heading"><div class="eyebrow">Antes de ver os resultados</div><h1>Como você fez suas escolhas?</h1><p>O registro mostra o que aconteceu. Este relato opcional guarda sua percepção sobre como você executou a tarefa.</p></div><form id="post" class="panel"><p class="small muted">Você pode deixar tudo em branco. Não há resposta esperada.</p>${session.tests.map(t=>`<section class="post-condition"><h3>${core.CONDITIONS[t.test_type].title}</h3><p class="small muted">${esc(t.instruction)}</p><div class="form-grid">${field('Você percebeu alguma estratégia?',`${t.test_type}_strategy`,[['sem_regra','Não percebi uma regra'],['alternar','Alternar cores'],['blocos','Escolher em blocos'],['preferencia','Seguir uma preferência'],['contagem','Contar as escolhas'],['posicao','Seguir uma posição'],['outra','Outra maneira']])}<details class="field extra-context"><summary>Acrescentar um detalhe · opcional</summary><label class="field">Algo que você percebeu?<textarea name="${t.test_type}_note" maxlength="600"></textarea></label></details></div><label class="check"><input name="${t.test_type}_changed" type="checkbox">Percebi que mudei de estratégia durante esta condição.</label></section>`).join('')}<div class="actions"><button class="button" type="submit">Ver meu registro →</button></div><p class="small muted">Pode continuar sem responder. Seu relato é opcional.</p><p class="error" id="postError" role="alert"></p></form>`);
 document.getElementById('post').onsubmit=e=>{
  e.preventDefault();const f=new FormData(e.currentTarget);for(const type of Object.keys(core.CONDITIONS))session.post_task[type]={strategy:f.get(`${type}_strategy`),note:f.get(`${type}_note`),changed_strategy:f.has(`${type}_changed`)};
  session.finished_at=now();const result=core.processSession(session);
  if(!result.success){session.finished_at=null;document.getElementById('postError').textContent='O registro não passou pela verificação: '+result.validation.errors.join(' ');return;}
  phase='results';write(KEYS.last,session);remove(KEYS.draft);showResults(session);
 };
}
const fmt=(x,suffix='')=>x===null||x===undefined?'—':`${new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(x)}${suffix}`;
const percentage=x=>x===null?'—':fmt(x*100,'%');
function sequenceHTML(trials){return trials.map((t,i)=>{const missing=t.interrupted||t.timed_out,c=missing?'missing':t.choice_color==='vermelho'?'red':'';const label=missing?(t.interrupted?'interrompida':'sem resposta'):t.choice_color;return`<span class="${c}" title="${i+1}: ${label}${t.reaction_time_ms!==null?' · '+t.reaction_time_ms+' ms':''}" aria-label="Tentativa ${i+1}: ${label}">${missing?'—':t.choice_color==='azul'?'A':'V'}</span>`;}).join('');}
const strategyLabels={sem_regra:'não percebi uma regra',alternar:'alternar cores',blocos:'escolher em blocos',preferencia:'seguir uma preferência',contagem:'contar as escolhas',posicao:'seguir uma posição',outra:'outra maneira'};
function showResults(payload){
 stopTimers();const result=core.processSession(payload);if(!result.success){render('<div class="panel"><h2>Registro incompatível</h2><p>Não foi possível abrir esta sessão na versão atual.</p><a href="experimento.html">Iniciar uma nova sessão</a></div>');return;}
 session=payload;phase='results';document.getElementById('openHistory').hidden=false;
 const rows=result.test_metrics,byType=Object.fromEntries(rows.map(m=>[m.test_type,m]));
 render(`<div class="app-heading"><div class="eyebrow">Seu registro · ${new Date(payload.finished_at).toLocaleString('pt-BR')}</div><h1>Seu registro, de um olhar.</h1><p>Veja as cores, as trocas e o tempo em cada condição.</p></div><div class="result-overview">${Object.keys(core.CONDITIONS).map(type=>{const m=byType[type];return `<article class="panel overview-card"><h2>${core.CONDITIONS[type].title}</h2><div class="color-balance" role="img" aria-label="${m.blue_count} escolhas azuis, ${m.red_count} vermelhas, ${40-m.valid_trials} sem escolha"><span class="balance-blue" style="flex:${m.blue_count}"></span><span class="balance-red" style="flex:${m.red_count}"></span><span class="balance-missing" style="flex:${40-m.valid_trials}"></span></div><div class="balance-labels"><span>${m.blue_count} azuis</span><span>${m.red_count} vermelhas</span></div><p class="overview-reading">${m.valid_trials===0?'Nenhuma escolha registrada.':m.blue_count===m.red_count?'Você escolheu as duas cores na mesma quantidade.':`Você escolheu mais ${m.blue_count>m.red_count?'azul':'vermelho'} nesta etapa.`}</p><div class="overview-numbers"><div><strong>${m.reversals}</strong><span>trocas de cor<br>em ${m.adjacent_pairs} pares</span></div><div><strong>${m.median_reaction_time_ms===null?'—':(m.median_reaction_time_ms/1000).toLocaleString('pt-BR',{maximumFractionDigits:2})+' s'}</strong><span>tempo mediano<br>por escolha</span></div></div>${m.valid_trials<40?`<p class="small muted">${40-m.valid_trials} tentativas sem escolha registrada.</p>`:''}</article>`;}).join('')}</div><p class="result-boundary">Este é um retrato desta tarefa. As instruções e o prazo mudam entre etapas; as diferenças não definem sua personalidade nem sua causa.</p><details class="panel results-intro"><summary>Comparar as três etapas em uma tabela</summary><div class="table-scroll"><table class="comparison"><caption class="small muted">Comparação descritiva · ordem realizada: ${payload.protocol.condition_order.map(t=>core.CONDITIONS[t].title).join(' → ')}</caption><thead><tr><th scope="col">Medida</th>${Object.keys(core.CONDITIONS).map(t=>`<th scope="col">${core.CONDITIONS[t].title}</th>`).join('')}</tr></thead><tbody>${[['Azul / vermelho',m=>`${m.blue_count} / ${m.red_count}`],['Respostas válidas',m=>`${m.valid_trials} / 40`],['Trocas de cor',m=>`${m.reversals} / ${m.adjacent_pairs} pares`],['Maior repetição',m=>m.longest_run],['Tempo mediano',m=>fmt(m.median_reaction_time_ms,' ms')]].map(([label,fn])=>`<tr><th scope="row">${label}</th>${Object.keys(core.CONDITIONS).map(t=>`<td>${fn(byType[t])}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="small muted">As condições mudam a instrução ou o prazo. A posição das cores também varia. Diferenças não isolam uma causa nem representam características permanentes.</p></details>
 ${payload.tests.map(test=>{const m=byType[test.test_type],post=payload.post_task[test.test_type];return`<details class="panel result-card condition-detail"><summary>Ver minhas escolhas · ${core.CONDITIONS[test.test_type].title}</summary><div class="result-head"><h3>Sua sequência</h3><span class="badge">${m.valid_trials} respostas válidas</span></div><p class="small muted">${esc(test.instruction)}</p><div class="sequence" aria-label="Sequência das 40 tentativas">${sequenceHTML(test.trials)}</div><p class="small muted">A = azul · V = vermelho · — = sem resposta ou interrupção. Leia da esquerda para a direita, linha a linha.</p><div class="result-metrics"><div><strong>${m.blue_count} / ${m.red_count}</strong><span>azul / vermelho</span></div><div><strong>${percentage(m.reversal_rate)}</strong><span>trocas entre pares válidos</span></div><div><strong>${fmt(m.median_reaction_time_ms,' ms')}</strong><span>tempo mediano</span></div></div><p>${core.describe(m)}</p>${post.strategy||post.note?`<div class="callout"><strong>Seu relato:</strong> ${esc(strategyLabels[post.strategy]||'estratégia não informada')}${post.changed_strategy?' · mudança de estratégia percebida':''}${post.note?`<p>${esc(post.note)}</p>`:''}</div>`:''}${m.timeout_trials||m.interrupted_trials?`<p class="notice">${m.timeout_trials} tentativas sem resposta no prazo · ${m.interrupted_trials} interrupções. As lacunas interrompem pares e repetições; elas não são escolhas.</p>`:''}${m.quality_flags.includes('respostas_abaixo_de_100ms')?'<p class="notice">Há respostas abaixo de 100 ms. Antecipação, ritmo motor e limitações do aparelho podem participar do tempo registrado.</p>':''}<details class="advanced"><summary>Explorar as medidas e os blocos</summary><dl><dt>Desequilíbrio entre cores · R</dt><dd>${fmt(m.r)} · 0 = quantidades iguais; 1 = uma só cor</dd><dt>Autocorrelação de uma tentativa · AC1</dt><dd>${fmt(m.ac1)} · não definida se faltar variação</dd><dt>Custo de troca de cor · mediana troca − mediana repetição</dt><dd>${fmt(m.switch_cost_ms,' ms')} · ${m.switch_trials} pares com troca / ${m.repeat_trials} com repetição</dd><dt>Variação da proporção azul · últimas 20 − primeiras 20</dt><dd>${m.drift_blue_fraction===null?'—':fmt(m.drift_blue_fraction*100,' pontos percentuais')}</dd><dt>Trocas de lado</dt><dd>${m.side_reversals} · esquerda ${m.left_count} / direita ${m.right_count}</dd></dl>${m.switch_trials<5||m.repeat_trials<5?'<p class="small muted">O custo de troca tem poucos pares ou não pode ser calculado. Não o interprete isoladamente.</p>':''}<div class="table-scroll"><table class="comparison"><thead><tr><th scope="col">Tentativas</th><th scope="col">Válidas</th><th scope="col">Azul</th><th scope="col">Tempo mediano</th></tr></thead><tbody>${m.windows.map(w=>`<tr><td>${w.from}–${w.to}</td><td>${w.valid_trials}</td><td>${percentage(w.blue_fraction)}</td><td>${fmt(w.median_rt_ms,' ms')}</td></tr>`).join('')}</tbody></table></div><p class="small muted">R não mede aleatoriedade ou coerência mental. AC1 descreve dependência entre escolhas adjacentes; o sinal negativo pode acompanhar alternância. Estas medidas são exploratórias.</p></details></details>`;}).join('')}
 <details class="panel result-card"><summary>Rever o momento que registrei</summary><dl class="small"><dt>Sono</dt><dd>${fmt(payload.metadata.sleep_hours,' h')}</dd><dt>Cansaço · 0 a 10</dt><dd>${fmt(payload.metadata.fatigue)}</dd><dt>Humor / ambiente</dt><dd>${esc(payload.metadata.mood||'não informado')} / ${esc(payload.metadata.distractions||'não informado')}</dd><dt>Motivo / familiaridade</dt><dd>${esc(payload.metadata.motivation||'não informado')} / ${esc(payload.metadata.familiarity||'não informado')}</dd><dt>Últimas 6 horas</dt><dd>${esc(payload.metadata.recent_context.join(', ')||'não informado')}</dd><dt>Observação</dt><dd>${esc(payload.metadata.context_note||'não informada')}</dd></dl><p class="small muted">Contexto declarado, não inferido pelo teste. Esses dados não permitem atribuir uma causa às diferenças.</p></details>
 <section class="panel export-panel"><h2>Quer guardar este momento?</h2><p class="small muted">Salve neste aparelho para consultar depois.</p><div class="actions"><button id="saveLocal" class="button">Guardar meu registro</button><button id="restart" class="button secondary">Fazer outra sessão</button></div><p id="localStatus" class="status" role="status"></p><details class="export-options"><summary>Baixar ou imprimir meu registro</summary><p class="small muted">CSV abre em planilhas. JSON preserva o registro completo, com contexto e medidas.</p><div class="actions"><button id="exportCSV" class="button secondary">Baixar planilha · CSV</button><button id="exportJSON" class="button secondary">Baixar dados · JSON</button><button id="printResult" class="button secondary">Imprimir</button></div></details><div id="collectionControls"><label class="check"><input type="checkbox" id="shareConsent" ${payload.share_consent?'checked':''}><span>Quero enviar esta sessão à coleta independente do MCD. Isso inclui minhas escolhas, tempos, relatos e os dados opcionais de contexto que preenchi, como sono, humor e consumo recente. Não preenchi nome ou contato.</span></label><button id="share" class="button" ${payload.share_consent?'':'disabled'}>Enviar à coleta</button></div><p id="shareStatus" class="status" role="status"></p><a class="method-link" href="metodologia.html">Entender o método e as medidas →</a></section><p class="small muted">Identificador: ${esc(payload.session_id)} · protocolo ${core.VERSION}. A sessão atual permanece temporariamente nesta aba. O histórico só é guardado quando você escolhe fazê-lo.</p>`);
 document.getElementById('exportJSON').onclick=()=>download(JSON.stringify({payload,analysis:result},null,2),'json','application/json');
 document.getElementById('exportCSV').onclick=()=>download(csvExport(payload),'csv','text/csv;charset=utf-8');
 document.getElementById('printResult').onclick=()=>window.print();
 document.getElementById('saveLocal').onclick=()=>{
  const old=read(KEYS.history,true),history=Array.isArray(old)?old:[];const index=history.findIndex(s=>s.session_id===payload.session_id);
  if(index>=0)history[index]=payload;else history.unshift(payload);
  const ok=write(KEYS.history,history.slice(0,20),true);document.getElementById('localStatus').textContent=ok?'Registro guardado neste aparelho. O histórico mantém as 20 sessões mais recentes.':'Não foi possível guardar aqui. Exporte o registro para preservá-lo.';
 };
 if(document.querySelector('meta[name="mcd-collection-enabled"]')?.content==='false'){document.getElementById('collectionControls').hidden=true;document.getElementById('shareStatus').textContent='Nesta versão de revisão, o envio à coleta está desativado. Exportação e histórico local estão disponíveis.';}
 document.getElementById('shareConsent').onchange=e=>{document.getElementById('share').disabled=!e.target.checked;};
 document.getElementById('share').onclick=async()=>{
  const button=document.getElementById('share'),status=document.getElementById('shareStatus');if(!document.getElementById('shareConsent').checked)return;
  button.disabled=true;status.textContent='Enviando…';payload.share_consent=true;write(KEYS.last,payload);
  try{
   const response=await fetch(document.querySelector('meta[name="mcd-api-endpoint"]').content,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});let data;try{data=await response.json();}catch{throw new Error('O servidor não confirmou o salvamento.');}
   if(!response.ok||data.saved!==true)throw new Error(data.error||'O servidor não confirmou o salvamento.');
   status.textContent=data.duplicate?'Esta sessão já estava na coleta. Nenhum registro duplicado foi criado.':'Sessão salva na coleta independente. Obrigado por participar.';
  }catch(error){status.textContent=`${error.name==='TimeoutError'?'O servidor não respondeu a tempo.':error.message} Seu registro continua disponível para exportação.`;}
  finally{button.disabled=!document.getElementById('shareConsent').checked;}
 };
 document.getElementById('restart').onclick=()=>{session=null;remove(KEYS.last);intro();};
}
function csvExport(p){
 const headers=['session_id','protocol_version','condition_order','test_type','instruction','deadline_ms','trial_index','presented_at','timestamp','left_color','right_color','choice_color','choice_side','reaction_time_ms','elapsed_ms','timed_out','interrupted','input_method','sleep_hours','fatigue','mood','distractions','motivation','familiarity','recent_context','context_note','study_code','strategy','strategy_note','changed_strategy'];
 const cell=v=>{let s=String(v??'');if(/^[=+@-]/.test(s))s="'"+s;return'"'+s.replace(/"/g,'""')+'"';};
 const rows=[headers];for(const test of p.tests)for(const t of test.trials){const post=p.post_task[test.test_type];const record={...p.metadata,...t,session_id:p.session_id,protocol_version:p.protocol_version,condition_order:p.protocol.condition_order.join('|'),test_type:test.test_type,instruction:test.instruction,deadline_ms:test.deadline_ms,recent_context:p.metadata.recent_context.join('|'),strategy:post.strategy,strategy_note:post.note,changed_strategy:post.changed_strategy};rows.push(headers.map(h=>record[h]));}
 return '\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n');
}
function download(content,extension,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=`mcd-${session.session_id}.${extension}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function showHistory(){
 if(session&&!session.finished_at)return;
 const stored=read(KEYS.history,true),items=(Array.isArray(stored)?stored:[]).filter(s=>core.validateSessionPayload(s).isValid);
 render(`<div class="app-heading"><div class="eyebrow">Somente neste aparelho</div><h1>Meu histórico.</h1><p>Sessões que você escolheu guardar. Use suas exportações para preservar ou analisar os dados fora daqui.</p></div><div class="panel"><div class="archive-list">${items.length?items.map((s,i)=>`<button data-history="${i}">${new Date(s.finished_at).toLocaleString('pt-BR')} · ${esc(s.metadata.study_code||'sem código')}<br><span class="small muted">${esc(s.session_id.slice(0,8))} · ${s.protocol.condition_order.map(t=>core.CONDITIONS[t].title).join(' → ')}</span></button>`).join(''):'<p>Nenhuma sessão foi guardada neste aparelho.</p>'}</div><div class="actions"><button id="back" class="button secondary">Voltar</button>${items.length?'<button id="clearHistory" class="button secondary">Apagar o histórico deste aparelho</button>':''}</div><p id="historyStatus" class="status" role="status"></p></div>`);
 app.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>showResults(items[Number(b.dataset.history)]));
 document.getElementById('back').onclick=()=>session?.finished_at?showResults(session):intro();
 const clear=document.getElementById('clearHistory');if(clear)clear.onclick=()=>{
  clear.textContent='Confirmar apagar o histórico';clear.onclick=()=>{remove(KEYS.history,true);showHistory();};
 };
}
function stopConfirm(){
 pauseTask('encerramento_solicitado');const button=document.getElementById('stop');button.textContent='Confirmar encerrar';button.onclick=()=>{stopTimers();session=null;current=null;phase='intro';remove(KEYS.draft);intro();};
}
document.getElementById('openHistory').onclick=showHistory;
document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.matches('input,textarea,select'))return;const key=e.key.toLowerCase();if(active&&['f','j'].includes(key)){e.preventDefault();respond(key==='f'?'left':'right','keyboard');}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&document.getElementById('pausePanel')&&session&&!session.finished_at)pauseTask('aba_oculta');});
window.addEventListener('pagehide',()=>{if(active)pauseTask('pagina_fechada');saveDraft();});
window.addEventListener('beforeunload',e=>{if(session&&!session.finished_at){e.preventDefault();e.returnValue='';}});
const recovered=read(KEYS.draft),last=read(KEYS.last);
if(recovered?.session?.protocol_version===core.VERSION&&Array.isArray(recovered.session.tests)&&recovered.schedules&&Number.isInteger(recovered.block)&&recovered.block>=0&&recovered.block<=3){
 render('<div class="panel"><h1>Há uma sessão em andamento.</h1><p>Você pode retomá-la. Interrupções registradas permanecem nos dados.</p><div class="actions"><button id="recover" class="button">Retomar sessão</button><button id="discard" class="button secondary">Descartar e começar outra</button></div></div>');
 document.getElementById('recover').onclick=()=>{session=recovered.session;schedules=recovered.schedules;block=recovered.block;phase=recovered.phase;if(phase==='practice')practiceIntro();else if(block===3)postTask();else conditionIntro();};
 document.getElementById('discard').onclick=()=>{remove(KEYS.draft);intro();};
}else if(last&&core.validateSessionPayload(last).isValid)showResults(last);else intro();
