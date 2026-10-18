CREATE TABLE IF NOT EXISTS mcd_rate_limits (
 bucket_key TEXT PRIMARY KEY, hits INTEGER NOT NULL CHECK (hits > 0), expires_at TIMESTAMPTZ NOT NULL
);
