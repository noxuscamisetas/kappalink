const MCD=require('../../public/mcd/assets/mcd-core');
function fixture(){
 const start=Date.parse('2026-10-10T01:00:00.000Z'),at=n=>new Date(start+n*1000).toISOString();
 const order=Object.keys(MCD.CONDITIONS);
 return{session_id:'00000000-0000-4000-8000-000000000001',protocol_version:MCD.VERSION,started_at:at(0),finished_at:at(200),share_consent:false,
 protocol:{condition_order:order,trials_per_condition:40,practice_trials:6,inter_trial_ms:300,position_policy:'balanced_per_condition'},
 metadata:{sleep_hours:null,fatigue:null,mood:'',motivation:'',distractions:'',familiarity:'',recent_context:[],study_code:'',context_note:''},
 post_task:Object.fromEntries(order.map(t=>[t,{strategy:'',note:'',changed_strategy:false}])),
 tests:order.map((type,i)=>({test_type:type,instruction:MCD.CONDITIONS[type].instruction,deadline_ms:MCD.CONDITIONS[type].deadline_ms,started_at:at(i*50+1),finished_at:at(i*50+45),
 trials:Array.from({length:40},(_,j)=>{const color=j<20?'azul':'vermelho',left=j%2?'azul':'vermelho';return{trial_index:j+1,presented_at:at(i*50+j+2),timestamp:new Date(start+(i*50+j+2)*1000+200).toISOString(),left_color:left,right_color:left==='azul'?'vermelho':'azul',choice_color:color,choice_side:color===left?'left':'right',reaction_time_ms:200,elapsed_ms:200,timed_out:false,interrupted:false,input_method:'pointer'};})}))};
}
module.exports={fixture};
