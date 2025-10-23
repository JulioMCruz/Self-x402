# selfx402-framework

[![npm version](https://badge.fury.io/js/selfx402-framework.svg)](https://www.npmjs.com/package/selfx402-framework)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Framework for building x402 facilitator servers and Self Protocol validators with minimal code.

**Published by [zkNexus](https://www.zknexus.xyz)** - Proof-of-unique-human verification meets instant micropayments.

**Inspired by thirdweb SDK architecture** - reduces implementation from 600+ lines to 5-10 lines.

## Features

✅ Complete x402 payment facilitator implementation
✅ Self Protocol integration for proof-of-unique-human verification
✅ Verification sessions for deep link polling (mobile support) 🆕
✅ Deferred payment scheme (x402 PR #426) - 99% gas savings
✅ EIP-712 signature verification
✅ EIP-3009 USDC settlement on Celo
✅ TypeScript with full type definitions
✅ Database integration (PostgreSQL/Supabase)
✅ Modular exports for flexibility

## Installation

```bash
npm install selfx402-framework viem
```

## Quick Start

### Basic x402 Facilitator

```typescript
import { Facilitator } from "selfx402-framework";
import { networks } from "selfx402-framework/networks";
import { createWalletClient } from "selfx402-framework/wallets";

const facilitator = new Facilitator({
  network: networks.celo,
  wallet: createWalletClient({
    privateKey: process.env.PRIVATE_KEY as `0x${string}`,
    network: networks.celo,
  }),
});

// Verify payment
const verification = await facilitator.verifyPayment(envelope, payTo, amount);

// Settle payment on-chain
const settlement = await facilitator.settlePayment(envelope);
```

### With Self Protocol Integration

```typescript
import { Facilitator } from "selfx402-framework";
import { networks } from "selfx402-framework/networks";
import { createWalletClient } from "selfx402-framework/wallets";
import { SelfVerifier, DatabaseService } from "selfx402-framework/self";

// Create Self Protocol verifier
const db = new DatabaseService({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_KEY!,
});

const selfVerifier = new SelfVerifier(
  {
    scope: "my-app",
    minimumAge: 18,
    excludedCountries: ["IRN", "PRK"],
    ofac: true,
  },
  db
);

// Create facilitator with Self integration
const facilitator = new Facilitator({
  network: networks.celo,
  wallet: createWalletClient({
    privateKey: process.env.PRIVATE_KEY as `0x${string}`,
    network: networks.celo,
  }),
  selfVerifier,
  enableSelfProtocol: true,
});

// Verify Self Protocol proof
const selfResult = await selfVerifier.verify(proofHeader, 1);
if (selfResult.valid) {
  console.log(`Verified human! Tier: ${selfResult.tier}`);
}
```

## Database Setup (Optional - For Self Protocol Nullifier Tracking)

The framework supports optional database integration for Self Protocol nullifier management (Sybil resistance). If you don't provide database credentials, the system runs in **in-memory mode** (nullifiers not persisted).

### Supabase Setup

1. **Create Supabase Project**: https://supabase.com

2. **Create `nullifiers` Table**:
```sql
CREATE TABLE nullifiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nullifier TEXT NOT NULL,
  scope TEXT NOT NULL,
  user_id TEXT,
  nationality TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nullifier, scope)
);

-- Index for fast lookups
CREATE INDEX idx_nullifiers_scope ON nullifiers(scope);
CREATE INDEX idx_nullifiers_expires ON nullifiers(expires_at);
```

3. **Get Credentials**:
   - Project URL: `https://your-project.supabase.co`
   - Anon/Public Key: Found in Project Settings → API

4. **Use in Code**:
```typescript
import { DatabaseService, SelfVerifier } from "@selfx402/framework/self";

// Initialize database service
const database = new DatabaseService({
  url: process.env.SUPABASE_URL!,  // https://your-project.supabase.co
  key: process.env.SUPABASE_KEY!,  // Your anon/public key
});

// Pass to SelfVerifier
const selfVerifier = new SelfVerifier(
  {
    scope: "my-app",
    minimumAge: 18,
    excludedCountries: ["IRN", "PRK"],
    ofac: true,
  },
  database  // Optional - omit for in-memory mode
);
```

### Alternative: In-Memory Mode (No Database)

For testing or development, omit the `database` parameter:

```typescript
import { SelfVerifier } from "@selfx402/framework/self";

const selfVerifier = new SelfVerifier({
  scope: "my-app",
  minimumAge: 18,
  excludedCountries: [],
  ofac: false,
});
// Nullifiers stored in memory only (lost on restart)
```

**⚠️ Warning**: In-memory mode does NOT persist nullifiers across server restarts. For production, always use a persistent database.

## Module Exports

### `@selfx402/framework`
Main package with core facilitator engine.

### `@selfx402/framework/networks`
Network configurations for Celo mainnet and sepolia.

### `@selfx402/framework/wallets`
Wallet client creation with viem.

### `@selfx402/framework/core`
Core facilitator for payment verification and settlement.

### `@selfx402/framework/self`
Self Protocol integration (zero-knowledge proof verification, verification sessions for mobile deep link polling).

### `@selfx402/framework/middleware`
Express/Hono/Fastify middleware adapters (coming soon).

## Verification Sessions (Deep Link Polling - NEW!)

Support for mobile Self Protocol verification via deep links with polling mechanism. Enables verification flow when user clicks "Open Self App" button instead of scanning QR code.

### Database Setup for Verification Sessions

Run this SQL in your Supabase project:

```sql
CREATE TABLE IF NOT EXISTS verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  vendor_url TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  api_endpoint TEXT,
  network TEXT NOT NULL DEFAULT 'celo',
  disclosures JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified BOOLEAN DEFAULT false,
  nullifier TEXT,
  disclosure_results JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  proof_data JSONB,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_verification_sessions_session_id ON verification_sessions(session_id);
CREATE INDEX idx_verification_sessions_expires ON verification_sessions(expires_at);
CREATE INDEX idx_verification_sessions_verified ON verification_sessions(verified, expires_at);
```

### Server-Side: Initialize Verification Sessions

```typescript
import { VerificationSessionsService } from "selfx402-framework/self";

// Initialize service
const verificationSessionsService = new VerificationSessionsService(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create session when widget displays
const session = await verificationSessionsService.createSession({
  session_id: crypto.randomUUID(),
  vendor_url: "https://api.example.com",
  wallet_address: "0x...",
  network: "celo",
  disclosures: { minimumAge: 18, ofac: true },
  verified: false,
  expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min
});

// Update session after verification completes
await verificationSessionsService.updateSessionVerified(
  sessionId,
  true,
  nullifier,
  { ageValid: true, userId: "0x..." },
  { proof, publicSignals, attestationId }
);

// Polling endpoint for widget
app.get("/verify-status/:sessionId", async (req, res) => {
  const status = await verificationSessionsService.getVerificationStatus(
    req.params.sessionId
  );
  res.json(status);
});
```

### Client-Side: Polling for Verification Results

```typescript
import { useState, useEffect } from "react";

// Start polling after user clicks "Open Self App"
const pollForVerification = async (sessionId: string) => {
  const pollInterval = setInterval(async () => {
    const response = await fetch(
      `https://facilitator.com/verify-status/${sessionId}`
    );
    const status = await response.json();

    if (status.verified) {
      clearInterval(pollInterval);
      console.log("Verification successful!", status);
      // Call onSuccess callback
    } else if (status.expired) {
      clearInterval(pollInterval);
      console.error("Session expired");
    }
  }, 2000); // Poll every 2 seconds

  // Timeout after 60 seconds
  setTimeout(() => clearInterval(pollInterval), 60000);
};
```

### How It Works

1. **Widget displays** → Creates session in database with unique ID
2. **User clicks "Open Self App"** → Deep link opens Self mobile app
3. **Self app verifies passport** → Sends proof to facilitator `/api/verify`
4. **Facilitator updates session** → Marks as verified with nullifier
5. **Widget polls** → Checks `/verify-status/:sessionId` every 2s
6. **Success** → Widget receives verified status and continues flow

### Benefits

✅ **Mobile-First**: Native mobile app experience (no QR code needed)
✅ **Real-Time Feedback**: Widget knows when verification completes
✅ **Database Persistence**: Session state survives server restarts
✅ **Automatic Cleanup**: Expired sessions auto-deleted
✅ **Backward Compatible**: QR code flow still works unchanged

## Deferred Payment Scheme (x402 PR #426 - NEW!)

The framework now supports **deferred payments** for micro-payment aggregation, implementing [x402 PR #426 - Option A](https://github.com/coinbase/x402/pull/426).

**Benefits**:
- ✅ **99% gas savings**: Reduces gas overhead from 2000% to 2% for micro-payments
- ✅ **Off-chain aggregation**: Store vouchers in database, settle in batches
- ✅ **EIP-712 signatures**: Phishing-resistant typed data signing
- ✅ **EIP-3009 settlement**: Gasless USDC transfers on Celo
- ✅ **x402 compliant**: Maintains full x402 protocol compatibility

### Database Setup for Deferred Payments

Run the schema SQL in your Supabase project (SQL Editor):

```bash
# Location: Selfx402Framework/src/deferred/schema.sql
# Then apply the migration for scheme tagging:
# Location: Selfx402Framework/src/deferred/schema-migration-add-scheme.sql
```

This creates:
- `vouchers` table - Off-chain payment vouchers
- `settlements` table - On-chain settlement records
- Indexes for performance
- Row-level security policies

### Client-Side: Create and Sign Voucher

```typescript
import {
  createVoucher,
  signVoucher,
  createVoucherDomain,
} from "@selfx402/framework";
import { useWalletClient } from "wagmi"; // or any wallet library

// Create voucher for micro-payment
const voucher = createVoucher({
  payer: "0xPayer...",
  payee: "0xPayee...",
  amount: BigInt(1000), // 0.001 USDC (6 decimals)
  validityDuration: 3600, // 1 hour
});

// Create EIP-712 domain for Celo mainnet
const domain = createVoucherDomain(
  42220, // Celo mainnet chain ID
  "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" // USDC address
);

// Sign voucher using wallet
const { data: walletClient } = useWalletClient();
const signature = await walletClient.signTypedData({
  domain,
  types: voucherTypes,
  primaryType: "PaymentVoucher",
  message: voucher,
});

// Send to facilitator for verification
const response = await fetch("https://facilitator.com/deferred/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    scheme: "deferred",
    network: "celo",
    voucher,
    signature,
  }),
});

const result = await response.json();
console.log(`Voucher stored! ID: ${result.voucher_id}`);
```

### Server-Side: Verify and Store Voucher

```typescript
import {
  verifyVoucher,
  validateDeferredEnvelope,
  VoucherDatabaseService,
  createVoucherDomain,
} from "@selfx402/framework";

// Initialize voucher database
const voucherDb = new VoucherDatabaseService({
  url: process.env.SUPABASE_URL!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
});

// Verify voucher from client request
app.post("/deferred/verify", async (req, res) => {
  const envelope = req.body;

  // 1. Validate envelope structure
  const validation = validateDeferredEnvelope(envelope);
  if (!validation.valid) {
    return res.status(400).json({ error: "Invalid envelope", details: validation.errors });
  }

  // 2. Create EIP-712 domain
  const domain = createVoucherDomain(42220, "0xcebA9300f2b948710d2653dD7B07f33A8B32118C");

  // 3. Verify signature
  const verification = await verifyVoucher(envelope.voucher, envelope.signature, domain);
  if (!verification.valid) {
    return res.status(401).json({ error: "Invalid signature", details: verification.error });
  }

  // 4. Check for duplicate nonce
  const existing = await voucherDb.getVoucherByNonce(envelope.voucher.nonce);
  if (existing) {
    return res.status(409).json({ error: "Voucher already exists" });
  }

  // 5. Store voucher in database
  const stored = await voucherDb.storeVoucher({
    payer_address: envelope.voucher.payer.toLowerCase(),
    payee_address: envelope.voucher.payee.toLowerCase(),
    amount: envelope.voucher.amount.toString(),
    nonce: envelope.voucher.nonce,
    signature: envelope.signature,
    valid_until: new Date(envelope.voucher.validUntil * 1000).toISOString(),
    settled: false,
    network: envelope.network,
    scheme: "deferred", // x402 PR #426 compliance
  });

  // 6. Log structured event (x402 PR #426 compliance)
  console.log(`[deferred.verify.ok] Voucher verified and stored`);
  console.log(`  scheme: deferred`);
  console.log(`  voucher_id: ${stored.id}`);
  console.log(`  payer: ${envelope.voucher.payer}`);
  console.log(`  payee: ${envelope.voucher.payee}`);
  console.log(`  amount: ${envelope.voucher.amount}`);
  console.log(`  authorization_state: verified_stored`);

  return res.json({
    success: true,
    voucher_id: stored.id,
    signer: verification.signer,
    expires_at: stored.valid_until,
    authorization_state: "verified_stored",
    scheme: "deferred",
  });
});
```

### Server-Side: Aggregate and Settle Vouchers

```typescript
import {
  canAggregateVouchers,
  calculateAggregatedAmount,
  Facilitator,
} from "@selfx402/framework";

app.post("/deferred/settle", async (req, res) => {
  const { payee, payer, network, minAmount } = req.body;

  // 1. Get unsettled vouchers
  const vouchers = payer
    ? await voucherDb.getUnsettledVouchers(payer, payee, network)
    : await voucherDb
        .getAccumulatedBalances(payee, network)
        .then((balances) =>
          Promise.all(balances.map((b) => voucherDb.getUnsettledVouchers(b.payer, b.payee, network)))
        )
        .then((results) => results.flat());

  if (vouchers.length === 0) {
    return res.status(404).json({ error: "No unsettled vouchers found" });
  }

  // 2. Validate aggregation
  const validation = canAggregateVouchers(vouchers);
  if (!validation.valid) {
    return res.status(400).json({ error: "Cannot aggregate", details: validation.errors });
  }

  // 3. Calculate total amount
  const totalAmount = calculateAggregatedAmount(vouchers);
  if (minAmount && totalAmount < minAmount) {
    return res.status(400).json({
      error: "Total below minimum",
      totalAmount: totalAmount.toString(),
      minAmount: minAmount.toString(),
    });
  }

  // 4. Create payment envelope for on-chain settlement
  const lastVoucher = vouchers[vouchers.length - 1];
  const envelope = {
    network,
    authorization: {
      from: lastVoucher.payer_address as `0x${string}`,
      to: lastVoucher.payee_address as `0x${string}`,
      value: totalAmount.toString(),
      validAfter: 0,
      validBefore: Math.floor(Date.parse(lastVoucher.valid_until) / 1000),
      nonce: lastVoucher.nonce as `0x${string}`,
    },
    signature: lastVoucher.signature as `0x${string}`,
  };

  // 5. Execute on-chain settlement using facilitator
  const facilitator = new Facilitator({ network: networks.celo, wallet });
  const settlement = await facilitator.settlePayment(envelope);

  if (!settlement.success) {
    // Log revert (x402 PR #426 compliance)
    console.error(`[deferred.settle.revert] Settlement failed`);
    console.error(`  authorization_state: settlement_reverted`);
    console.error(`  error: ${settlement.error}`);
    throw new Error(settlement.error || "Settlement failed");
  }

  // 6. Mark vouchers as settled
  const voucherIds = vouchers.map((v) => v.id!);
  await voucherDb.markVouchersSettled(voucherIds);

  // 7. Store settlement record
  const settlementRecord = await voucherDb.storeSettlement({
    tx_hash: settlement.transactionHash!,
    payee_address: payee.toLowerCase(),
    payer_address: lastVoucher.payer_address,
    total_amount: totalAmount.toString(),
    voucher_count: vouchers.length,
    network,
    voucher_ids: voucherIds,
    scheme: "deferred", // x402 PR #426 compliance
  });

  // 8. Log success (x402 PR #426 compliance)
  console.log(`[deferred.settle.ok] Settlement completed successfully`);
  console.log(`  scheme: deferred`);
  console.log(`  settlement_id: ${settlementRecord.id}`);
  console.log(`  tx_hash: ${settlement.transactionHash}`);
  console.log(`  voucher_count: ${vouchers.length}`);
  console.log(`  total_amount: ${totalAmount}`);
  console.log(`  authorization_state: settled_confirmed`);

  return res.json({
    success: true,
    txHash: settlement.transactionHash,
    totalAmount: totalAmount.toString(),
    voucherCount: vouchers.length,
    settlementId: settlementRecord.id,
    voucherIds,
    authorization_state: "settled_confirmed",
    scheme: "deferred",
    explorer: settlement.explorerUrl,
  });
});
  await voucherDb.markVouchersSettled(voucherIds);
}
```

### Deferred Payment Database Schema

Run this in Supabase SQL Editor:

```sql
-- Vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_address TEXT NOT NULL,
  payee_address TEXT NOT NULL,
  amount TEXT NOT NULL,
  nonce TEXT NOT NULL UNIQUE,
  signature TEXT NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  settled BOOLEAN NOT NULL DEFAULT false,
  network TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Settlements table
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT NOT NULL UNIQUE,
  payee_address TEXT NOT NULL,
  payer_address TEXT NOT NULL,
  total_amount TEXT NOT NULL,
  voucher_count INTEGER NOT NULL,
  network TEXT NOT NULL,
  settled_at TIMESTAMP DEFAULT NOW(),
  voucher_ids TEXT[]
);

-- Indexes
CREATE INDEX idx_vouchers_unsettled ON vouchers (payer_address, payee_address, network, settled) WHERE settled = false;
CREATE INDEX idx_settlements_payee ON settlements (payee_address, network, settled_at DESC);
```

See [../Docs/DEFERRED-PAYMENTS.md](../Docs/DEFERRED-PAYMENTS.md) for complete deferred payment documentation.

## Features

✅ x402 protocol compliant (immediate + deferred settlement)
✅ EIP-712 signature verification
✅ EIP-3009 on-chain settlement
✅ **Deferred payment scheme (x402 PR #426 - Option A)** 🆕
✅ **Voucher aggregation for micro-payments** 🆕
✅ **Verification sessions for deep link polling** 🆕
✅ Self Protocol integration
✅ Nullifier management (Sybil resistance)
✅ Multi-network support (Celo mainnet/sepolia)
✅ TypeScript first with full type safety

## Documentation

- [Framework Architecture](../Docs/SELFX402FRAMEWORK-LIBRARY-ARCHITECTURE.md)
- [Deferred Payments Guide](../Docs/DEFERRED-PAYMENTS.md) 🆕

## License

MIT
