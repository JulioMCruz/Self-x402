-- Deferred payment voucher and settlement schema for Supabase
-- x402 PR #426 - Option A: Basic deferred scheme

-- Vouchers table: stores off-chain payment vouchers
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Voucher data
  payer_address TEXT NOT NULL,
  payee_address TEXT NOT NULL,
  amount TEXT NOT NULL,              -- Stored as string to preserve bigint precision
  nonce TEXT NOT NULL UNIQUE,        -- Unique identifier (32 bytes hex)
  signature TEXT NOT NULL,           -- EIP-712 signature
  valid_until TIMESTAMP NOT NULL,    -- Expiration timestamp

  -- Metadata
  settled BOOLEAN NOT NULL DEFAULT false,
  network TEXT NOT NULL,             -- Network identifier (e.g., "celo", "celo-sepolia")
  created_at TIMESTAMP DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT vouchers_nonce_unique UNIQUE (nonce)
);

-- Index for querying unsettled vouchers by payer-payee pair
CREATE INDEX IF NOT EXISTS idx_vouchers_unsettled
  ON vouchers (payer_address, payee_address, network, settled)
  WHERE settled = false;

-- Index for querying by payee (for accumulated balances)
CREATE INDEX IF NOT EXISTS idx_vouchers_payee
  ON vouchers (payee_address, network, settled);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_vouchers_expiration
  ON vouchers (valid_until, settled)
  WHERE settled = false;

-- Settlements table: records on-chain settlement transactions
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Settlement data
  tx_hash TEXT NOT NULL UNIQUE,      -- On-chain transaction hash
  payee_address TEXT NOT NULL,       -- Recipient of settlement
  payer_address TEXT NOT NULL,       -- Source of funds
  total_amount TEXT NOT NULL,        -- Total amount settled
  voucher_count INTEGER NOT NULL,    -- Number of vouchers in settlement

  -- Metadata
  network TEXT NOT NULL,             -- Network identifier
  settled_at TIMESTAMP DEFAULT NOW(),

  -- Optional: voucher IDs for audit trail
  voucher_ids TEXT[]                 -- Array of voucher UUIDs
);

-- Index for querying settlements by payee
CREATE INDEX IF NOT EXISTS idx_settlements_payee
  ON settlements (payee_address, network, settled_at DESC);

-- Index for querying settlements by transaction hash
CREATE INDEX IF NOT EXISTS idx_settlements_tx_hash
  ON settlements (tx_hash);

-- Row Level Security (RLS) policies
-- Note: Adjust these based on your security requirements

-- Enable RLS
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for facilitator)
CREATE POLICY "Service role full access to vouchers"
  ON vouchers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to settlements"
  ON settlements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow users to read their own vouchers (as payer or payee)
CREATE POLICY "Users can read their own vouchers"
  ON vouchers
  FOR SELECT
  TO authenticated
  USING (
    payer_address = lower(auth.jwt() ->> 'wallet_address') OR
    payee_address = lower(auth.jwt() ->> 'wallet_address')
  );

-- Policy: Allow users to read their own settlements
CREATE POLICY "Users can read their own settlements"
  ON settlements
  FOR SELECT
  TO authenticated
  USING (
    payer_address = lower(auth.jwt() ->> 'wallet_address') OR
    payee_address = lower(auth.jwt() ->> 'wallet_address')
  );

-- Comments for documentation
COMMENT ON TABLE vouchers IS 'Off-chain payment vouchers for deferred settlement';
COMMENT ON TABLE settlements IS 'On-chain settlement transaction records';
COMMENT ON COLUMN vouchers.nonce IS 'Unique 32-byte hex identifier to prevent replay attacks';
COMMENT ON COLUMN vouchers.amount IS 'Payment amount in smallest token unit (stored as string for bigint)';
COMMENT ON COLUMN vouchers.signature IS 'EIP-712 signature of payment voucher';
COMMENT ON COLUMN settlements.voucher_ids IS 'Array of voucher UUIDs included in this settlement';
