-- Migration: Add 'scheme' column to vouchers and settlements tables
-- Purpose: Tag payments with scheme type ("deferred" vs "exact") for future-proofing
-- x402 PR #426 compliance requirement

-- Add scheme column to vouchers table
ALTER TABLE vouchers
ADD COLUMN IF NOT EXISTS scheme TEXT NOT NULL DEFAULT 'deferred'
CHECK (scheme IN ('exact', 'deferred'));

-- Add scheme column to settlements table
ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS scheme TEXT NOT NULL DEFAULT 'deferred'
CHECK (scheme IN ('exact', 'deferred'));

-- Add index for querying by scheme (optional, but useful for mixed-scheme systems)
CREATE INDEX IF NOT EXISTS idx_vouchers_scheme
  ON vouchers (scheme, settled);

CREATE INDEX IF NOT EXISTS idx_settlements_scheme
  ON settlements (scheme, settled_at DESC);

-- Comments for documentation
COMMENT ON COLUMN vouchers.scheme IS 'Payment scheme: "deferred" for off-chain vouchers, "exact" for immediate settlement';
COMMENT ON COLUMN settlements.scheme IS 'Payment scheme used for settlement: "deferred" or "exact"';
