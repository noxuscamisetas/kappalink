'use strict';
const {createHmac}=require('node:crypto');
const {isIP}=require('node:net');
const SCHEMA=`CREATE TABLE IF NOT EXISTS mcd_rate_limits (
 bucket_key TEXT PRIMARY KEY, hits INTEGER NOT NULL CHECK (hits > 0), expires_at TIMESTAMPTZ NOT NULL
)`;
const TAKE=`INSERT INTO mcd_rate_limits (bucket_key,hits,expires_at)
 VALUES ($1,1,$2) ON CONFLICT (bucket_key) DO UPDATE SET hits=mcd_rate_limits.hits+1
 WHERE mcd_rate_limits.hits < $3 RETURNING hits`;
async function enforce(pool,req,{secret=process.env.DATABASE_URL,now=Date.now()}={}){
 if(!secret)throw Error('rate_limit_unconfigured');
 // Trust Vercel's overwritten forwarding header only when deployed on Vercel.
 const raw=process.env.VERCEL ? req.headers?.['x-forwarded-for'] : req.socket?.remoteAddress;
 const ip=typeof raw==='string'?raw.split(',')[0].trim():'';
 const identity=isIP(ip)?ip:'unknown';
 const date=new Date(now).toISOString().slice(0,10);
 const digest=createHmac('sha256',secret).update(date+'|'+identity).digest('hex');
 await pool.query(SCHEMA);
 for(const [name,ms,limit]of [['minute',60000,10],['hour',3600000,60]]){
  const end=(Math.floor(now/ms)+1)*ms;
  const key=name+':'+Math.floor(now/ms)+':'+digest;
  const r=await pool.query(TAKE,[key,new Date(end).toISOString(),limit]);
  if(!r.rows.length)return{allowed:false,retryAfter:Math.max(1,Math.ceil((end-now)/1000))};
 }
 return{allowed:true};
}
module.exports={enforce,SCHEMA,TAKE};
