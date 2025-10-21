-- Self Protocol Nullifier Storage
-- Prevents duplicate verifications (one passport = one verification per scope)

-- Create nullifiers table
CREATE TABLE IF NOT EXISTS nullifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nullifier TEXT NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_id TEXT,
  nationality TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Composite unique constraint (one nullifier per scope)
  CONSTRAINT unique_nullifier_scope UNIQUE (nullifier, scope)
);

-- Index for fast nullifier lookups
CREATE INDEX IF NOT EXISTS idx_nullifiers_lookup ON nullifiers (nullifier, scope);

-- Index for expiry cleanup
CREATE INDEX IF NOT EXISTS idx_nullifiers_expiry ON nullifiers (expires_at);

-- Index for scope queries
CREATE INDEX IF NOT EXISTS idx_nullifiers_scope ON nullifiers (scope);

-- Enable Row Level Security (optional for multi-tenant)
ALTER TABLE nullifiers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Enable all for service role" ON nullifiers
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to auto-cleanup expired nullifiers (optional, can be run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_nullifiers()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM nullifiers
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE nullifiers IS 'Stores Self Protocol nullifiers to prevent duplicate verifications';
COMMENT ON COLUMN nullifiers.nullifier IS 'Unique nullifier from Self Protocol proof (one per passport)';
COMMENT ON COLUMN nullifiers.scope IS 'API/vendor scope identifier';
COMMENT ON COLUMN nullifiers.expires_at IS 'Verification expiry (90 days from creation)';
COMMENT ON COLUMN nullifiers.user_id IS 'Optional user ID for tracking';
COMMENT ON COLUMN nullifiers.nationality IS 'User nationality from Self proof';
COMMENT ON COLUMN nullifiers.metadata IS 'Additional verification metadata (flexible JSON)';
