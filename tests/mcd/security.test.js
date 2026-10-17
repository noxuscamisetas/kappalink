const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHandler}=require('../../api/mcd-session'),{fixture}=require('./fixture');
function res(){return{setHeader(){},status(n){this.code=n;return this},json(v){this.body=v;return this}}}
test('cross-origin, content types and deeply nested input never reach database',async()=>{
 let calls=0;const handler=createHandler(()=>{calls++;return null});
 for(const headers of [{origin:'https://attacker.example'},{'sec-fetch-site':'cross-site'},{'content-type':'text/plain'}]){let r=res();await handler({method:'POST',headers,body:fixture()},r);assert([403,415].includes(r.code));}
 const p=fixture();let nested={};p.extra=nested;for(let i=0;i<20;i++){nested.next={};nested=nested.next}let r=res();await handler({method:'POST',body:p},r);assert.equal(r.code,400);assert.equal(calls,0);
});
test('legitimate origin still reaches consent validation',async()=>{let r=res();await createHandler(()=>{throw Error('must not access database')})({method:'POST',headers:{origin:'https://www.kappalink.com','content-type':'application/json'},body:fixture()},r);assert.equal(r.code,400);assert.match(r.body.error,/consentimento/);});
