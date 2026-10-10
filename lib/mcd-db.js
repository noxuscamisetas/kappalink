const { Pool } = require('pg');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não definida');
module.exports = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000 });
