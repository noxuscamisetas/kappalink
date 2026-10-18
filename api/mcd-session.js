const MCD = require('../public/mcd/assets/mcd-core');
const { createHash } = require('node:crypto');
const SCHEMA = `CREATE TABLE IF NOT EXISTS mcd_sessions_v2 (
 session_id UUID PRIMARY KEY, protocol_version TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), payload_hash TEXT NOT NULL,
 raw_payload_json JSONB NOT NULL, metrics_json JSONB NOT NULL
)`;
function canonical(v) {
 if (Array.isArray(v)) return v.map(canonical);
 if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])]));
 return v;
}
function createHandler(getPool, {limiter} = {}) {
 return async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ success: false, error: 'Use POST.' }); }
  const headers = req.headers || {};
  const origin = headers.origin;
  if (origin && !['https://www.kappalink.com','https://kappalink.com'].includes(origin)) return res.status(403).json({success:false,error:'Origem não permitida.'});
  if (headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({success:false,error:'Origem não permitida.'});
  if (headers['content-type'] && !/^application\/json(?:\s*;|$)/i.test(headers['content-type'])) return res.status(415).json({success:false,error:'Use application/json.'});
  // Bound nesting before validation/canonicalization, including unknown fields.
  const pending = [[req.body,0]];
  while (pending.length) {
   const [value,depth] = pending.pop();
   if (depth > 12) return res.status(400).json({success:false,error:'Estrutura do registro inválida.'});
   if (value && typeof value === 'object') for (const child of Object.values(value)) pending.push([child,depth+1]);
  }
  if (Buffer.byteLength(JSON.stringify(req.body || {})) > 256000) return res.status(413).json({ success: false, error: 'Registro muito grande.' });
  const result = MCD.processSession(req.body);
  if (!result.success) return res.status(400).json(result);
  if (req.body.share_consent !== true) return res.status(400).json({ success: false, error: 'O envio requer consentimento explícito.' });
  try {
   const pool = getPool();
   if (!pool) return res.status(503).json({ success: false, error: 'A coleta online não está configurada. Você pode exportar o registro.' });
   if (limiter) {
    const quota=await limiter(pool,req);
    if(!quota.allowed){res.setHeader('Retry-After',String(quota.retryAfter));return res.status(429).json({success:false,error:'Limite temporário de envios. Seu resultado continua disponível para exportação.'});}
   }
   await pool.query(SCHEMA);
   const json = JSON.stringify(canonical(req.body)), hash = createHash('sha256').update(json).digest('hex');
   const saved = await pool.query(`INSERT INTO mcd_sessions_v2 (session_id, protocol_version, payload_hash, raw_payload_json, metrics_json)
    VALUES ($1,$2,$3,$4,$5) ON CONFLICT (session_id) DO NOTHING RETURNING session_id`, [req.body.session_id,MCD.VERSION,hash,json,JSON.stringify(result)]);
   if (!saved.rows.length) {
    const existing = await pool.query('SELECT payload_hash FROM mcd_sessions_v2 WHERE session_id=$1', [req.body.session_id]);
    if (existing.rows[0]?.payload_hash !== hash) return res.status(409).json({ success: false, error: 'Este identificador já pertence a outro registro.' });
   }
   return res.status(saved.rows.length ? 201 : 200).json({ ...result, saved: true, duplicate: !saved.rows.length });
  } catch(error) {
   console.error('MCD: falha na persistência', error.code || 'database_error');
   return res.status(503).json({ success:false,error:'Não foi possível salvar online. Seu resultado continua disponível para exportação.' });
  }
 };
}
module.exports=createHandler(()=>process.env.DATABASE_URL?require('../lib/mcd-db'):null,{limiter:require('../lib/mcd-rate-limit').enforce});
module.exports.createHandler=createHandler;
module.exports.SCHEMA=SCHEMA;
