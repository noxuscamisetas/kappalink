CREATE TABLE IF NOT EXISTS mcd_sessions_v2 (
 session_id UUID PRIMARY KEY, protocol_version TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), payload_hash TEXT NOT NULL,
 raw_payload_json JSONB NOT NULL, metrics_json JSONB NOT NULL
);
