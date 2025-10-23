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

-- Create policy to allow service role full access (drop if exists, then recreate)
DROP POLICY IF EXISTS "Enable all for service role" ON nullifiers;
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

-- ============================================================================
-- Deferred Payment Tables (x402 PR #426 - Option A)
-- ============================================================================
-- Stores off-chain payment vouchers for micro-payment aggregation
-- Vouchers are verified via EIP-712 signatures and settled in batches

-- Create vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_address TEXT NOT NULL,
  payee_address TEXT NOT NULL,
  amount TEXT NOT NULL,
  nonce TEXT NOT NULL,
  signature TEXT NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  settled BOOLEAN DEFAULT false,
  network TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint on nonce (prevent double-spend)
  CONSTRAINT unique_voucher_nonce UNIQUE (nonce)
);

-- Create settlements table
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT NOT NULL,
  payee_address TEXT NOT NULL,
  payer_address TEXT NOT NULL,
  total_amount TEXT NOT NULL,
  voucher_count INTEGER NOT NULL,
  network TEXT NOT NULL,
  settled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  voucher_ids TEXT[],

  -- Unique constraint on tx_hash
  CONSTRAINT unique_settlement_tx UNIQUE (tx_hash)
);

-- Indexes for vouchers table
CREATE INDEX IF NOT EXISTS idx_vouchers_payer ON vouchers (payer_address);
CREATE INDEX IF NOT EXISTS idx_vouchers_payee ON vouchers (payee_address);
CREATE INDEX IF NOT EXISTS idx_vouchers_settled ON vouchers (settled);
CREATE INDEX IF NOT EXISTS idx_vouchers_network ON vouchers (network);
CREATE INDEX IF NOT EXISTS idx_vouchers_unsettled_lookup ON vouchers (payee_address, payer_address, network, settled);

-- Indexes for settlements table
CREATE INDEX IF NOT EXISTS idx_settlements_payee ON settlements (payee_address);
CREATE INDEX IF NOT EXISTS idx_settlements_payer ON settlements (payer_address);
CREATE INDEX IF NOT EXISTS idx_settlements_network ON settlements (network);
CREATE INDEX IF NOT EXISTS idx_settlements_timestamp ON settlements (settled_at DESC);

-- Enable Row Level Security (optional for multi-tenant)
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access (drop if exists, then recreate)
DROP POLICY IF EXISTS "Enable all for service role on vouchers" ON vouchers;
CREATE POLICY "Enable all for service role on vouchers" ON vouchers
  FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Enable all for service role on settlements" ON settlements;
CREATE POLICY "Enable all for service role on settlements" ON settlements
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE vouchers IS 'Off-chain payment vouchers for deferred settlement (x402 PR #426)';
COMMENT ON COLUMN vouchers.payer_address IS 'Address making the payment';
COMMENT ON COLUMN vouchers.payee_address IS 'Address receiving the payment';
COMMENT ON COLUMN vouchers.amount IS 'Payment amount in USDC smallest unit (6 decimals)';
COMMENT ON COLUMN vouchers.nonce IS 'Unique nonce to prevent double-spend';
COMMENT ON COLUMN vouchers.signature IS 'EIP-712 signature of voucher';
COMMENT ON COLUMN vouchers.valid_until IS 'Voucher expiry timestamp';
COMMENT ON COLUMN vouchers.settled IS 'Whether voucher has been settled on-chain';
COMMENT ON COLUMN vouchers.network IS 'Network identifier (celo, celo-sepolia)';

COMMENT ON TABLE settlements IS 'On-chain settlement records for aggregated vouchers (x402 PR #426)';
COMMENT ON COLUMN settlements.tx_hash IS 'Blockchain transaction hash';
COMMENT ON COLUMN settlements.payee_address IS 'Address that received funds';
COMMENT ON COLUMN settlements.payer_address IS 'Address that paid funds';
COMMENT ON COLUMN settlements.total_amount IS 'Total amount settled in USDC smallest unit';
COMMENT ON COLUMN settlements.voucher_count IS 'Number of vouchers aggregated';
COMMENT ON COLUMN settlements.network IS 'Network identifier';
COMMENT ON COLUMN settlements.voucher_ids IS 'Array of voucher UUIDs included in settlement';

-- ============================================================================
-- Migration: Add 'scheme' column to existing tables (if they exist without it)
-- ============================================================================
-- This handles the case where vouchers/settlements tables were created before
-- the 'scheme' column was added. Safe to run multiple times.

-- Add scheme column to vouchers table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vouchers' AND column_name = 'scheme'
  ) THEN
    ALTER TABLE vouchers ADD COLUMN scheme TEXT NOT NULL DEFAULT 'deferred';
    ALTER TABLE vouchers ADD CONSTRAINT check_vouchers_scheme CHECK (scheme IN ('exact', 'deferred'));
    RAISE NOTICE 'Added scheme column to vouchers table';
  END IF;
END $$;

-- Add scheme column to settlements table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settlements' AND column_name = 'scheme'
  ) THEN
    ALTER TABLE settlements ADD COLUMN scheme TEXT NOT NULL DEFAULT 'deferred';
    ALTER TABLE settlements ADD CONSTRAINT check_settlements_scheme CHECK (scheme IN ('exact', 'deferred'));
    RAISE NOTICE 'Added scheme column to settlements table';
  END IF;
END $$;

-- Add scheme indexes (safe to run multiple times with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_vouchers_scheme ON vouchers (scheme, settled);
CREATE INDEX IF NOT EXISTS idx_settlements_scheme ON settlements (scheme, settled_at DESC);

-- Update comments for scheme column
COMMENT ON COLUMN vouchers.scheme IS 'Payment scheme: "deferred" for off-chain vouchers, "exact" for immediate settlement';
COMMENT ON COLUMN settlements.scheme IS 'Payment scheme used for settlement: "deferred" or "exact"';

-- ============================================================================
-- Verification Sessions Table
-- ============================================================================
-- Stores verification session state for deep link flow polling
-- Enables widget to poll for verification status when user opens Self app

CREATE TABLE IF NOT EXISTS verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  vendor_url TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  api_endpoint TEXT,
  network TEXT NOT NULL DEFAULT 'celo',

  -- Disclosure requirements from vendor
  disclosures JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Verification result
  verified BOOLEAN DEFAULT false,
  nullifier TEXT,

  -- Disclosure results
  disclosure_results JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Full proof data (optional, for audit)
  proof_data JSONB,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT unique_session_id UNIQUE (session_id)
);

-- Indexes for verification_sessions table
CREATE INDEX IF NOT EXISTS idx_verification_sessions_session_id ON verification_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_wallet ON verification_sessions (wallet_address);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_vendor ON verification_sessions (vendor_url);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_verified ON verification_sessions (verified);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_expiry ON verification_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_created ON verification_sessions (created_at DESC);

-- Composite index for polling queries
CREATE INDEX IF NOT EXISTS idx_verification_sessions_polling
  ON verification_sessions (session_id, verified, expires_at);

-- Enable Row Level Security
ALTER TABLE verification_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
DROP POLICY IF EXISTS "Enable all for service role on verification_sessions" ON verification_sessions;
CREATE POLICY "Enable all for service role on verification_sessions" ON verification_sessions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE verification_sessions IS 'Stores Self Protocol verification session state for deep link polling';
COMMENT ON COLUMN verification_sessions.session_id IS 'Unique session identifier (UUID) generated by widget';
COMMENT ON COLUMN verification_sessions.vendor_url IS 'Vendor API base URL for this verification';
COMMENT ON COLUMN verification_sessions.wallet_address IS 'User wallet address associated with verification';
COMMENT ON COLUMN verification_sessions.api_endpoint IS 'Specific API endpoint being accessed';
COMMENT ON COLUMN verification_sessions.network IS 'Network identifier (celo, celo-sepolia)';
COMMENT ON COLUMN verification_sessions.disclosures IS 'Vendor disclosure requirements (age, OFAC, nationality, etc.)';
COMMENT ON COLUMN verification_sessions.verified IS 'Whether verification was successful';
COMMENT ON COLUMN verification_sessions.nullifier IS 'Self Protocol nullifier from successful verification';
COMMENT ON COLUMN verification_sessions.disclosure_results IS 'Individual disclosure validation results';
COMMENT ON COLUMN verification_sessions.expires_at IS 'Session expiry (5 minutes from creation)';
COMMENT ON COLUMN verification_sessions.proof_data IS 'Full proof data for audit trail (optional)';
COMMENT ON COLUMN verification_sessions.metadata IS 'Additional session metadata';

-- Function to auto-cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_verification_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM verification_sessions
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_verification_sessions IS 'Deletes expired verification sessions (run via cron)';
