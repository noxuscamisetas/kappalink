const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHandler}=require('../../api/mcd-session'),{fixture}=require('./fixture');
function response(){return{code:null,headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(body){this.body=body;return this;}};}
function pool(){const data=new Map();return{data,async query(sql,args){if(sql.startsWith('CREATE'))return{rows:[]};if(sql.startsWith('INSERT')){if(data.has(args[0]))return{rows:[]};data.set(args[0],{payload_hash:args[2],payload:JSON.parse(args[3]),metrics:JSON.parse(args[4])});return{rows:[{session_id:args[0]}]};}return{rows:data.has(args[0])?[data.get(args[0])]:[]};}};}
test('consent and validation gate all database access',async()=>{
 let accessed=false;const handler=createHandler(()=>{accessed=true;throw Error('must not run');});
 for(const body of[null,fixture()]){const res=response();await handler({method:'POST',body},res);assert.equal(res.code,400);assert.equal(accessed,false);}
 const res=response();await handler({method:'GET'},res);assert.equal(res.code,405);assert.equal(res.headers.Allow,'POST');
});
test('missing database is an honest non-save response',async()=>{
 const p=fixture();p.share_consent=true;const res=response();await createHandler(()=>null)({method:'POST',body:p},res);assert.equal(res.code,503);assert.equal(res.body.saved,undefined);
});
test('a repeated session is saved once and conflicting reuse is rejected',async()=>{
 const db=pool(),handler=createHandler(()=>db),p=fixture();p.share_consent=true;p.metadata.fatigue=0;
 let res=response();await handler({method:'POST',body:p},res);assert.equal(res.code,201);assert.equal(res.body.saved,true);
 res=response();await handler({method:'POST',body:p},res);assert.equal(res.code,200);assert.equal(res.body.duplicate,true);assert.equal(db.data.size,1);
 assert.equal(db.data.get(p.session_id).payload.metadata.fatigue,0);assert.equal(db.data.get(p.session_id).metrics.test_metrics[0].r,0);
 const reordered=Object.fromEntries(Object.entries(p).reverse());res=response();await handler({method:'POST',body:reordered},res);assert.equal(res.code,200);
 p.metadata.fatigue=1;res=response();await handler({method:'POST',body:p},res);assert.equal(res.code,409);assert.equal(db.data.size,1);
});
test('database errors never claim a successful save',async()=>{
 const p=fixture();p.share_consent=true;const res=response();await createHandler(()=>({query:async()=>{throw{code:'connection_failed'};}}))({method:'POST',body:p},res);assert.equal(res.code,503);assert.equal(res.body.saved,undefined);
});
