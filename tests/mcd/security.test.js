const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHandler}=require('../../api/mcd-session'),{fixture}=require('./fixture');
function res(){return{setHeader(){},status(n){this.code=n;return this},json(v){this.body=v;return this}}}
test('cross-origin, content types and deeply nested input never reach database',async()=>{
 let calls=0;const handler=createHandler(()=>{calls++;return null});
 for(const headers of [{origin:'https://attacker.example'},{'sec-fetch-site':'cross-site'},{'content-type':'text/plain'}]){let r=res();await handler({method:'POST',headers,body:fixture()},r);assert([403,415].includes(r.code));}
 const p=fixture();let nested={};p.extra=nested;for(let i=0;i<20;i++){nested.next={};nested=nested.next}let r=res();await handler({method:'POST',body:p},r);assert.equal(r.code,400);assert.equal(calls,0);
});
test('legitimate origin still reaches consent validation',async()=>{let r=res();await createHandler(()=>{throw Error('must not access database')})({method:'POST',headers:{origin:'https://www.kappalink.com','content-type':'application/json'},body:fixture()},r);assert.equal(r.code,400);assert.match(r.body.error,/consentimento/);});
test('rate-limit rejection returns 429 and never persists a session',async()=>{
 const p=fixture();p.share_consent=true;let queries=0;const r=res();r.headers={};r.setHeader=(k,v)=>r.headers[k]=v;
 await createHandler(()=>({query(){queries++;throw Error('must not persist')}}),{limiter:async()=>({allowed:false,retryAfter:25})})({method:'POST',body:p},r);
 assert.equal(r.code,429);assert.equal(r.headers['Retry-After'],'25');assert.equal(queries,0);assert.equal(r.body.saved,undefined);
});
test('persistent limiter rejects excess, separates identities and renews buckets',async()=>{
 const {enforce}=require('../../lib/mcd-rate-limit');const counts=new Map();
 const db={async query(sql,args){if(sql.startsWith('CREATE'))return{rows:[]};const [key,,limit]=args;const n=counts.get(key)||0;if(n>=limit)return{rows:[]};counts.set(key,n+1);return{rows:[{hits:n+1}]}}};
 const now=Date.parse('2026-10-17T12:00:00Z'),req={socket:{remoteAddress:'192.0.2.1'}};
 const old=process.env.VERCEL;delete process.env.VERCEL;
 try{
 for(let i=0;i<10;i++)assert.equal((await enforce(db,req,{secret:'test-only',now})).allowed,true);
 const blocked=await enforce(db,req,{secret:'test-only',now});assert.equal(blocked.allowed,false);assert.equal(blocked.retryAfter,60);
 assert.equal((await enforce(db,{socket:{remoteAddress:'192.0.2.2'}},{secret:'test-only',now})).allowed,true);
 assert.equal((await enforce(db,req,{secret:'test-only',now:now+60000})).allowed,true);
 assert([...counts.keys()].every(k=>!k.includes('192.0.2.')));
 }finally{if(old===undefined)delete process.env.VERCEL;else process.env.VERCEL=old}
});
test('hourly counter survives minute changes and refuses the 61st send',async()=>{
 const {enforce}=require('../../lib/mcd-rate-limit'),counts=new Map();const db={async query(sql,args){if(sql.startsWith('CREATE'))return{rows:[]};const [key,,limit]=args,n=counts.get(key)||0;if(n>=limit)return{rows:[]};counts.set(key,n+1);return{rows:[{hits:n+1}]}}};const base=Date.parse('2026-10-17T12:00:00Z'),req={socket:{remoteAddress:'192.0.2.9'}};const old=process.env.VERCEL;delete process.env.VERCEL;
 try{for(let i=0;i<60;i++)assert((await enforce(db,req,{secret:'test',now:base+Math.floor(i/10)*60000})).allowed);assert.equal((await enforce(db,req,{secret:'test',now:base+6*60000})).allowed,false);}finally{if(old===undefined)delete process.env.VERCEL;else process.env.VERCEL=old}
});
