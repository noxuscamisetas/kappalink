const {test}=require('node:test'),assert=require('node:assert/strict');
const MCD=require('../../public/mcd/assets/mcd-core'),{fixture}=require('./fixture');
const trial=(color,i,rt=200)=>({trial_index:i+1,choice_color:color,choice_side:'left',reaction_time_ms:rt,timed_out:false,interrupted:false});
test('same balanced counts retain different sequential organization',()=>{
 const blocks=MCD.computeTestMetrics({trials:Array.from({length:40},(_,i)=>trial(i<20?'azul':'vermelho',i))});
 const alternating=MCD.computeTestMetrics({trials:Array.from({length:40},(_,i)=>trial(i%2?'azul':'vermelho',i))});
 assert.equal(blocks.r,0);assert.equal(alternating.r,0);assert.equal(blocks.reversals,1);assert.equal(alternating.reversals,39);assert.equal(blocks.longest_run,20);assert.equal(alternating.longest_run,1);assert.equal(alternating.ac1,-1);assert.equal(blocks.ac1,.95);
});
test('timeouts and interruptions break adjacency rather than inventing switches',()=>{
 const m=MCD.computeTestMetrics({trials:[trial('azul',0),{timed_out:true,choice_color:null},trial('vermelho',2),{interrupted:true,choice_color:null},trial('vermelho',4)]});
 assert.equal(m.adjacent_pairs,0);assert.equal(m.reversals,0);assert.equal(m.longest_run,1);assert.equal(m.valid_trials,3);assert.equal(m.timeout_trials,1);assert.equal(m.interrupted_trials,1);assert.equal(m.ac1,null);
});
test('empty or constant series have undefined measures where required',()=>{
 const empty=MCD.computeTestMetrics({trials:[]});assert.equal(empty.r,null);assert.equal(empty.median_reaction_time_ms,null);assert.equal(empty.reversal_rate,null);
 const constant=MCD.computeTestMetrics({trials:Array.from({length:40},(_,i)=>trial('azul',i))});assert.equal(constant.r,1);assert.equal(constant.ac1,null);assert.equal(constant.switch_cost_ms,null);assert.equal(constant.reversal_rate,0);
});
test('switch cost uses medians of the actual adjacent color pairs',()=>{
 const m=MCD.computeTestMetrics({trials:[trial('azul',0,5000),trial('azul',1,100),trial('vermelho',2,400),trial('vermelho',3,200),trial('azul',4,600)]});assert.equal(m.median_reaction_time_ms,400);assert.equal(m.switch_cost_ms,350);assert.equal(m.switch_trials,2);assert.equal(m.repeat_trials,2);
});
test('drift preserves direction and requires enough observations',()=>{
 const p=fixture();const m=MCD.computeTestMetrics(p.tests[0]);assert.equal(m.drift_blue_fraction,-1);assert.equal(m.windows[0].blue_fraction,1);assert.equal(m.windows[3].blue_fraction,0);
});
test('full protocol validates and preserves zero values',()=>{
 const p=fixture();p.metadata.sleep_hours=0;p.metadata.fatigue=0;const result=MCD.processSession(p);assert.equal(result.success,true);assert.equal(result.test_metrics[0].r,0);assert.equal(result.session_metrics.valid_trials,120);assert.equal(result.test_metrics.length,3);assert.equal('overall_kappa' in result.session_metrics,false);
});
test('malformed, legacy, incomplete and inconsistent payloads are rejected',()=>{
 for(const p of[null,[],{},'text',{tests:[null]}])assert.equal(MCD.validateSessionPayload(p).isValid,false);
 for(const mutate of[p=>p.tests.pop(),p=>p.tests[0].trials.pop(),p=>p.tests[0].trials[0].choice_side='left',p=>p.tests[0].instruction='Pense rápido',p=>p.tests[0].trials[0].reaction_time_ms=-1,p=>p.metadata.sleep_hours=25,p=>p.protocol.condition_order=['livre','livre','pressao'],p=>p.tests[0].trials[0].timestamp='invalid']){const p=fixture();mutate(p);assert.equal(MCD.validateSessionPayload(p).isValid,false);}
});
test('a timeout is not a choice and cannot occur in a condition without a deadline',()=>{
 const p=fixture(),t=p.tests[2].trials[0];Object.assign(t,{choice_side:null,choice_color:null,reaction_time_ms:null,elapsed_ms:1500,timed_out:true,input_method:'timeout',timestamp:new Date(Date.parse(t.presented_at)+1500).toISOString()});assert.equal(MCD.validateSessionPayload(p).isValid,true);
 p.tests[0].trials[0]={...t,presented_at:p.tests[0].trials[0].presented_at,timestamp:p.tests[0].trials[0].timestamp,left_color:p.tests[0].trials[0].left_color,right_color:p.tests[0].trials[0].right_color};assert.equal(MCD.validateSessionPayload(p).isValid,false);
});
test('position changes do not become color changes',()=>{
 const ts=Array.from({length:40},(_,i)=>({...trial('azul',i),choice_side:i%2?'left':'right'}));const m=MCD.computeTestMetrics({trials:ts});assert.equal(m.reversals,0);assert.equal(m.side_reversals,39);
});
test('Fisher-Yates retains an exactly balanced presentation schedule',()=>{
 for(let j=0;j<100;j++){const a=MCD.shuffle([...Array(20).fill('azul'),...Array(20).fill('vermelho')]);assert.equal(a.filter(x=>x==='azul').length,20);assert.equal(a.length,40);}
});
