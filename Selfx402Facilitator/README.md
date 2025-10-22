# Celo x402 Facilitator with Self Protocol

A facilitator service for the x402 payment protocol with **Self Protocol integration** supporting **Celo mainnet only** (production).

## Overview

This facilitator enables:
- **USDC micropayments** on Celo blockchain using the x402 protocol
- **Proof-of-unique-human verification** using Self Protocol (zero-knowledge passport proofs)
- **Tier-based pricing** - verified humans pay 1000x less than bots
- **Dynamic requirements** - APIs define verification requirements at runtime
- **Centralized verification** - Single facilitator serves multiple APIs and frontends

### Key Features

- ✅ x402 standard payment verification and settlement
- ✅ **Deferred payment scheme (x402 PR #426 - Option A)** - NEW! 🆕
- ✅ **Voucher aggregation for micro-payments** - NEW! 🆕
- ✅ Self Protocol zero-knowledge proof validation
- ✅ EIP-3009 transferWithAuthorization (gasless USDC transfers)
- ✅ Nullifier management (one passport = one verification)
- ✅ Dynamic Self requirements per API
- ✅ Tier calculation (verified_human | unverified)
- ✅ Production-ready on Celo mainnet

## Supported Networks

| Network | Chain ID | USDC Contract |
|---------|----------|---------------|
| Celo Mainnet | 42220 | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` |

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Setup Supabase Database

**Create Supabase Project:**
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create new project (choose region close to your users)
3. Wait for database initialization (~2 minutes)

**Run Database Schema:**
1. Go to SQL Editor in Supabase dashboard
2. Copy and run the complete schema from [database/schema.sql](database/schema.sql)
   - Creates `nullifiers` table for Self Protocol verification
   - Creates `vouchers` table for off-chain payment vouchers (x402 PR #426)
   - Creates `settlements` table for on-chain settlement records (x402 PR #426)
   - All tables include proper indexes, constraints, and RLS policies

**Get API Credentials:**
1. Go to Project Settings → API
2. Copy `Project URL` (SUPABASE_URL)
3. Copy `service_role` secret key (SUPABASE_SERVICE_ROLE_KEY)

⚠️ **Security**: Keep `service_role` key secret! Never expose in client-side code.

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `CELO_MAINNET_PRIVATE_KEY`: Private key for mainnet operations (required)
- `CELO_MAINNET_RPC_URL`: Optional custom RPC URL (defaults to https://forno.celo.org)
- `SUPABASE_URL`: Your Supabase project URL (from step 2)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role secret key (from step 2)
- `SERVER_DOMAIN`: Your public domain (e.g., https://your-domain.ngrok.io)
- `SELF_ENDPOINT`: Your public verification endpoint (e.g., https://your-domain.ngrok.io/api/verify)
- `SELF_SCOPE`: Unique scope identifier for your app (e.g., self-x402-facilitator)

⚠️ **Security**: Never commit your `.env` file. Keep private keys and service role key secure.

💡 **Optional**: If you don't configure Supabase, the facilitator will run in **memory-only mode** (nullifiers not persisted across restarts).

### 4. Setup ngrok tunnel (required for Self Protocol)

Self Protocol requires a publicly accessible HTTPS endpoint. Use ngrok to create a tunnel:

```bash
# Make script executable (first time only)
chmod +x start-ngrok.sh

# Start ngrok tunnel
./start-ngrok.sh
```

Or manually:
```bash
ngrok http --domain=codalabs.ngrok.io 3005
```

Your facilitator will be accessible at `https://your-domain.ngrok.io`

### 5. Build and Run

**Development mode** (with hot reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

### 6. Verify Setup

Check facilitator is running with database:
```bash
curl http://localhost:3005/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T...",
  "network": {
    "name": "Celo Mainnet",
    "chainId": 42220,
    "usdc": "0xcebA9300f2b948710d2653dD7B07f33A8B32118C"
  }
}
```

Check database connection in server logs:
- ✅ `Supabase database service initialized`
- ✅ `Database connection successful`
- ✅ `SelfVerificationService initialized with Supabase database`
- ✅ `Database: Supabase (connected)`

If database connection fails:
- ⚠️  `Database connection failed - running in memory-only mode`
- ⚠️  `Database: In-memory mode`

## API Endpoints

### Standard x402 Endpoints

#### GET `/supported`
Returns the payment kinds this facilitator supports.

**Response:**
```json
{
  "x402Version": 1,
  "kind": [
    {
      "scheme": "exact",
      "networkId": "celo",
      "extra": { "name": "USDC", "version": "2" }
    },
    {
      "scheme": "deferred",
      "networkId": "celo",
      "extra": {
        "name": "USDC",
        "version": "2",
        "description": "x402 PR #426 - Deferred payment with voucher aggregation",
        "minSettlementAmount": "10000000",
        "minVoucherCount": 5
      }
    }
  ]
}
```

#### POST `/verify`
Verifies a payment payload against requirements (standard x402).

**Request:**
```json
{
  "paymentPayload": {
    "scheme": "exact",
    "network": "celo",
    "payload": { /* EIP-3009 authorization */ }
  },
  "paymentRequirements": {
    "scheme": "exact",
    "network": "celo",
    "asset": "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    "payTo": "0x...",
    "maxAmountRequired": "10000"
  }
}
```

**Response:**
```json
{
  "isValid": true,
  "invalidReason": null,
  "payer": "0x..."
}
```

#### POST `/settle`
Settles a verified payment on-chain (standard x402).

**Request:** Same as `/verify`

**Response:**
```json
{
  "success": true,
  "transaction": "0x...",
  "network": "celo",
  "payer": "0x..."
}
```

### Self Protocol Endpoints

#### POST `/verify-self`
Validates Self Protocol proof only (no payment required).

**Purpose**: Standalone Self verification for testing or separate flows.

**Request:**
```json
{
  "proof": "base64(proof|publicSignals)",
  "requirements": {
    "minimumAge": 18,
    "excludedCountries": ["IRN", "PRK"],
    "ofac": false,
    "scope": "api-name-v1"
  },
  "attestationId": "attestation-from-self-app",
  "userContextData": { /* optional */ }
}
```

**Response:**
```json
{
  "valid": true,
  "tier": "verified_human",
  "nullifier": "0x1234...",
  "disclosedData": {
    "ageValid": true,
    "nationality": "USA",
    "ofacValid": true
  }
}
```

#### POST `/verify-celo`
Verifies Celo payment **with optional Self proof** (combined verification).

**Purpose**: Primary endpoint for APIs using both x402 + Self integration.

**Request:**
```json
{
  "authorization": {
    "from": "0x...",
    "to": "0x...",
    "value": "1000000",
    "validAfter": 0,
    "validBefore": 1234567890,
    "nonce": "0x..."
  },
  "signature": "0x...",
  "network": "celo",

  "selfProof": "base64(proof|publicSignals)",
  "selfRequirements": {
    "minimumAge": 18,
    "excludedCountries": [],
    "ofac": false,
    "scope": "api-name-v1"
  },
  "attestationId": "attestation-from-self-app"
}
```

**Response:**
```json
{
  "valid": true,
  "tier": "verified_human",
  "payer": "0x...",
  "nullifier": "0x1234...",
  "disclosedData": {
    "ageValid": true,
    "nationality": "USA",
    "ofacValid": true
  },
  "error": null
}
```

**Tier Values:**
- `"verified_human"` - Self proof valid, human pricing applies
- `"unverified"` - No proof or invalid proof, bot pricing applies

#### POST `/settle-celo`
Settles a Celo payment by executing transferWithAuthorization.

**Request:**
```json
{
  "authorization": { /* same as verify-celo */ },
  "signature": "0x...",
  "network": "celo"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": "0x...",
  "blockNumber": "12345678",
  "network": "Celo Mainnet",
  "payer": "0x...",
  "explorer": "https://celoscan.io/tx/0x..."
}
```

### Deferred Payment Endpoints (NEW! 🆕)

Implementation of x402 PR #426 - Option A: Basic deferred scheme for micro-payment aggregation.

**Benefits**:
- ✅ **99% gas savings**: Reduces gas overhead from 2000% to 2% for micro-payments
- ✅ **Off-chain aggregation**: Store vouchers in database, settle in batches
- ✅ **EIP-712 signatures**: Phishing-resistant typed data signing
- ✅ **x402 compliant**: Maintains full x402 protocol compatibility
- ✅ **Structured logging**: Event-based monitoring with `authorization_state` tracking

**Gas Savings Example**:
```
1000 micro-payments of $0.001 each:
  Immediate: 1000 × $0.02 = $20.00 gas (2000% overhead) 🔴
  Deferred:  1 × $0.02 = $0.02 gas (2% overhead) ✅
  Savings: 99% reduction
```

#### POST `/deferred/verify`
Verify and store off-chain payment voucher (no on-chain transaction).

**Purpose**: Accept micro-payments off-chain using EIP-712 signed vouchers.

**Flow**:
1. Client creates EIP-712 voucher with payer, payee, amount, nonce, validUntil
2. Client signs voucher with wallet (MetaMask, WalletConnect, etc.)
3. Client sends signed voucher to facilitator
4. Facilitator verifies signature matches payer address
5. Facilitator checks nonce uniqueness (prevent double-spend)
6. Facilitator stores voucher in database
7. Returns voucher_id and authorization_state

**Request:**
```json
{
  "scheme": "deferred",
  "network": "celo",
  "voucher": {
    "payer": "0xPayer...",
    "payee": "0xPayee...",
    "amount": "1000",
    "nonce": "0x...",
    "validUntil": 1234567890
  },
  "signature": "0x..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "verified": true,
  "voucher_id": "550e8400-e29b-41d4-a716-446655440000",
  "signer": "0xPayer...",
  "expires_at": "2024-01-01T00:00:00.000Z",
  "authorization_state": "verified_stored",
  "scheme": "deferred"
}
```

**Response (Error - Invalid Signature):**
```json
{
  "error": "Invalid signature",
  "details": "Recovered signer does not match payer address",
  "authorization_state": "invalid_signature"
}
```

**Response (Error - Duplicate Nonce):**
```json
{
  "error": "Voucher already exists",
  "authorization_state": "duplicate_nonce"
}
```

**Authorization States** (verify endpoint):
- `pending` → Initial state when request received
- `validating_structure` → Checking envelope format
- `verifying_signature` → EIP-712 signature validation
- `checking_duplicate` → Nonce uniqueness check
- `storing_voucher` → Database insertion
- `verified_stored` → ✅ Success
- `invalid_structure` → ❌ Malformed envelope
- `invalid_signature` → ❌ Signature verification failed
- `duplicate_nonce` → ❌ Voucher already exists
- `error` → ❌ Other error

**Structured Logging** (x402 PR #426 compliance):
```
[deferred.verify] Received voucher verification request
  scheme: deferred
  payer: 0xPayer...
  payee: 0xPayee...
  amount: 1000
  network: celo

[deferred.verify.ok] ✅ Voucher verified and stored successfully
  scheme: deferred
  voucher_id: 550e8400-e29b-41d4-a716-446655440000
  payer: 0xPayer...
  payee: 0xPayee...
  amount: 1000
  network: celo
  signer: 0xSigner...
  authorization_state: verified_stored
  duration_ms: 45
```

#### POST `/deferred/settle`
Aggregate unsettled vouchers and settle on-chain in batch.

**Purpose**: Reduce gas costs by settling multiple vouchers in one transaction.

**Flow**:
1. Fetch unsettled vouchers from database (by payee, optionally by payer)
2. Validate all vouchers are from same payer/payee pair
3. Calculate total aggregated amount
4. Create EIP-3009 authorization using last voucher's signature
5. Execute on-chain USDC transfer using `transferWithAuthorization`
6. Mark all vouchers as settled in database
7. Store settlement record with transaction hash

**Request:**
```json
{
  "payee": "0xPayee...",
  "network": "celo",
  "payer": "0xPayer...",
  "minAmount": "10000000"
}
```

**Query Parameters**:
- `payee` (required): Address to settle funds to
- `network` (required): "celo" or "celo-sepolia"
- `payer` (optional): Specific payer address to settle from (defaults to all payers)
- `minAmount` (optional): Minimum total amount to settle (reject if below threshold)

**Response (Success):**
```json
{
  "success": true,
  "txHash": "0xabc...",
  "blockNumber": "12345678",
  "totalAmount": "50000000",
  "voucherCount": 50,
  "settlementId": "660e8400-e29b-41d4-a716-446655440000",
  "voucherIds": ["uuid1", "uuid2", ...],
  "authorization_state": "settled_confirmed",
  "scheme": "deferred",
  "explorer": "https://celoscan.io/tx/0xabc..."
}
```

**Response (Error - No Vouchers):**
```json
{
  "error": "No unsettled vouchers found",
  "authorization_state": "no_vouchers"
}
```

**Response (Error - Settlement Reverted):**
```json
{
  "error": "Settlement transaction reverted",
  "details": "Insufficient USDC balance",
  "authorization_state": "settlement_reverted"
}
```

**Authorization States** (settle endpoint):
- `pending` → Initial state when request received
- `fetching_vouchers` → Querying database for unsettled vouchers
- `validating_aggregation` → Checking vouchers can be aggregated
- `preparing_settlement` → Creating payment envelope
- `executing_onchain` → Submitting blockchain transaction
- `updating_database` → Marking vouchers as settled
- `settled_confirmed` → ✅ Success
- `no_vouchers` → ❌ No unsettled vouchers found
- `settlement_reverted` → ❌ On-chain transaction failed
- `error` → ❌ Other error

**Structured Logging** (x402 PR #426 compliance):
```
[deferred.settle] Received settlement request
  scheme: deferred
  payee: 0xPayee...
  payer: all
  network: celo
  minAmount: none
  Found 5 unsettled vouchers: 1, 2, 3, 4, 5
  Total amount: 5000 (0.005 USDC)
  Executing on-chain settlement...

[deferred.settle.ok] ✅ Settlement completed successfully
  scheme: deferred
  settlement_id: 660e8400-e29b-41d4-a716-446655440000
  tx_hash: 0xabc...
  block_number: 12345678
  voucher_count: 5
  voucher_ids: 1, 2, 3, 4, 5
  total_amount: 5000 (0.005 USDC)
  payer: 0xPayer...
  payee: 0xPayee...
  network: celo
  authorization_state: settled_confirmed
  duration_ms: 2350
```

**Revert Logging** (x402 PR #426 compliance):
```
[deferred.settle.revert] ❌ On-chain settlement reverted
  authorization_state: settlement_reverted
  error: Insufficient USDC balance
  voucher_count: 5
  voucher_ids: 1, 2, 3, 4, 5
  total_amount: 5000
  duration_ms: 1200
```

#### GET `/deferred/balance/:payee`
Get accumulated unsettled balance for a payee address.

**Purpose**: Query how much USDC is ready to settle.

**Request:**
```
GET /deferred/balance/0xPayee...?network=celo
```

**Response:**
```json
{
  "success": true,
  "payee": "0xpayee...",
  "network": "celo",
  "totalBalance": "150000000",
  "balancesByPayer": [
    {
      "payer": "0xpayer1...",
      "amount": "100000000",
      "voucherCount": 100,
      "voucherIds": ["uuid1", ...]
    },
    {
      "payer": "0xpayer2...",
      "amount": "50000000",
      "voucherCount": 50,
      "voucherIds": ["uuid2", ...]
    }
  ]
}
```

### Deferred Payment Integration Examples

#### Client-Side: Create and Sign Voucher

```typescript
import { createVoucher, signVoucher, createVoucherDomain } from "selfx402-framework";
import { useWalletClient } from "wagmi";

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

#### Server-Side: Check Balance and Settle

```typescript
// Check accumulated balance
const balanceResponse = await fetch(
  "https://facilitator.com/deferred/balance/0xPayee...?network=celo"
);
const balance = await balanceResponse.json();

console.log(`Total balance: ${balance.totalBalance} USDC`);
console.log(`From ${balance.balancesByPayer.length} payers`);

// Settle when threshold met (e.g., $10 USDC)
if (balance.totalBalance >= "10000000") {
  const settlementResponse = await fetch("https://facilitator.com/deferred/settle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payee: "0xPayee...",
      network: "celo",
      minAmount: "10000000", // $10 USDC
    }),
  });

  const settlement = await settlementResponse.json();
  console.log(`Settled ${settlement.voucherCount} vouchers`);
  console.log(`Transaction: ${settlement.explorer}`);
}
```

### Database Schema Tagging (x402 PR #426)

All vouchers and settlements are tagged with `scheme` column for future-proofing:

```sql
-- Vouchers table (includes scheme column)
CREATE TABLE vouchers (
  id UUID PRIMARY KEY,
  payer_address TEXT NOT NULL,
  payee_address TEXT NOT NULL,
  amount TEXT NOT NULL,
  nonce TEXT NOT NULL UNIQUE,
  signature TEXT NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  settled BOOLEAN DEFAULT false,
  network TEXT NOT NULL,
  scheme TEXT NOT NULL DEFAULT 'deferred' CHECK (scheme IN ('exact', 'deferred')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Settlements table (includes scheme column)
CREATE TABLE settlements (
  id UUID PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  payee_address TEXT NOT NULL,
  payer_address TEXT NOT NULL,
  total_amount TEXT NOT NULL,
  voucher_count INTEGER NOT NULL,
  network TEXT NOT NULL,
  scheme TEXT NOT NULL DEFAULT 'deferred' CHECK (scheme IN ('exact', 'deferred')),
  settled_at TIMESTAMP DEFAULT NOW(),
  voucher_ids TEXT[]
);
```

**Migration**: Run [../Selfx402Framework/src/deferred/schema-migration-add-scheme.sql](../Selfx402Framework/src/deferred/schema-migration-add-scheme.sql) to add `scheme` column to existing tables.

### Complete Documentation

**See these resources for full details**:
- [../Docs/DEFERRED-PAYMENTS.md](../Docs/DEFERRED-PAYMENTS.md) - Complete deferred payment guide
- [../Docs/X402-PR-426-COMPLIANCE.md](../Docs/X402-PR-426-COMPLIANCE.md) - x402 PR #426 compliance report
- [selfx402-framework README](../Selfx402Framework/README.md) - Framework integration examples
- [selfx402-framework on npm](https://www.npmjs.com/package/selfx402-framework) - Published package

### System Endpoints

#### GET `/health`
Health check endpoint with network information.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T...",
  "network": {
    "name": "Celo Mainnet",
    "chainId": 42220,
    "usdc": "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    "rpcUrl": "https://forno.celo.org",
    "explorer": "https://celoscan.io"
  }
}
```

## Testing

### Test on Celo Mainnet

⚠️ **Production Only**: This facilitator only supports Celo mainnet. Use real CELO and USDC.

1. **Get CELO:**
   - Buy CELO from exchanges (Coinbase, Binance, etc.)
   - Send to your wallet address

2. **Get USDC:**
   - Swap CELO for USDC on [Ubeswap](https://app.ubeswap.org/) or [Uniswap](https://app.uniswap.org/)
   - USDC contract: `0xcebA9300f2b948710d2653dD7B07f33A8B32118C`

3. **Test verification:**
```bash
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "paymentPayload": {
      "network": "celo",
      "authorization": {...},
      "signature": "0x..."
    },
    "paymentRequirements": {
      "network": "celo",
      "asset": "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
      "payTo": "0x...",
      "maxAmountRequired": "1000000"
    }
  }'
```

## Self Protocol Integration

### Overview

This facilitator implements a **centralized verification architecture** where:
- Multiple APIs can use the same facilitator
- APIs define Self requirements dynamically
- Facilitator validates proofs with zero-knowledge cryptography
- Nullifiers prevent duplicate verifications (one passport = one verification)

### How It Works

```
1. API Request (no payment)
   └─> 402 Payment Required + Self requirements

2. Frontend displays QR code
   └─> User scans with Self mobile app
   └─> NFC passport verification
   └─> Zero-knowledge proof generated

3. Payment + Proof Request
   └─> Client signs x402 payment
   └─> Attaches Self proof header
   └─> Sends to API

4. API forwards to Facilitator
   └─> Facilitator validates x402 signature
   └─> Facilitator validates Self proof
   └─> Checks nullifier uniqueness
   └─> Returns tier (verified_human | unverified)

5. API delivers resource
   └─> Tier determines pricing (1000x difference)
```

### Self Requirements Format

APIs pass requirements to facilitator:

```typescript
{
  minimumAge: 18,              // Required minimum age
  excludedCountries: ["IRN"],  // ISO 3166-1 alpha-3 codes
  ofac: false,                 // OFAC sanctions check
  scope: "api-name-v1"         // Unique API identifier
}
```

### Nullifier Management

- **Purpose**: Prevent duplicate verifications (Sybil resistance)
- **Storage**: Supabase PostgreSQL (or in-memory fallback)
- **Uniqueness**: One passport = one nullifier per scope
- **Expiry**: 90 days (re-verification required)
- **Schema**: See `database/schema.sql` for table structure

**Database Table Structure**:
```sql
CREATE TABLE nullifiers (
  id UUID PRIMARY KEY,
  nullifier TEXT NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_id TEXT,
  nationality TEXT,
  metadata JSONB,
  CONSTRAINT unique_nullifier_scope UNIQUE (nullifier, scope)
);
```

**Automatic Cleanup**:
Run periodic cleanup of expired nullifiers:
```typescript
// Call via cron job or scheduled task
const deletedCount = await selfService.cleanupExpiredNullifiers();
console.log(`Cleaned up ${deletedCount} expired nullifiers`);
```

### Tier Calculation

```typescript
if (selfProof && validProof && !duplicateNullifier && ageValid) {
  tier = "verified_human"  // Pay $0.001
} else {
  tier = "unverified"      // Pay $1.00
}
```

### Example Integration

See `/SelfFrontend` for complete frontend example and `SELF_FACILITATOR_ARCHITECTURE.md` for detailed architecture documentation.

## Architecture

```
CeloFacilitator/
├── config/
│   ├── chains.ts         # Viem chain definitions
│   ├── networks.ts       # Network configurations
│   └── usdc-abi.ts       # USDC contract ABI
├── services/
│   └── SelfVerificationService.ts  # Self Protocol integration
├── index.ts              # Express server & endpoints
├── package.json
├── tsconfig.json
└── .env.example
```

## How It Works

### Standard x402 Flow

1. **Verification (`/verify`):**
   - Validates payment payload structure
   - Checks EIP-712 signature validity
   - Verifies USDC balance sufficiency
   - Confirms payment amount meets requirements
   - Validates deadline and recipient

2. **Settlement (`/settle`):**
   - Re-verifies payment is still valid
   - Calls `transferWithAuthorization()` on USDC contract
   - Waits for transaction confirmation
   - Returns transaction hash

### Self + x402 Flow

1. **Self Verification (`/verify-self`):**
   - Decodes base64 proof
   - Validates cryptographic proof
   - Checks nullifier uniqueness
   - Validates age requirement
   - Checks country exclusions
   - Optional OFAC validation
   - Returns tier + nullifier

2. **Combined Verification (`/verify-celo`):**
   - Validates EIP-712 payment signature
   - If Self proof provided:
     - Validates proof cryptographically
     - Checks nullifier uniqueness
     - Validates requirements (age, country, OFAC)
     - Upgrades tier to "verified_human"
   - Returns: valid, tier, payer, nullifier

## Security

### Payment Security
- Private keys are never exposed in responses
- All payment signatures are verified using EIP-712
- Payments are validated before settlement
- Smart contract wallet support via ERC-6492

### Self Protocol Security
- Zero-knowledge proofs preserve privacy
- Nullifiers prevent duplicate verifications
- Server-side proof validation (never trust client)
- Cryptographic verification using Self.ID framework
- Age, country, and OFAC validation
- Proof replay protection via attestation IDs

### Best Practices
- Always validate proofs server-side
- Check nullifier uniqueness before accepting
- Enforce proof expiry (90 days recommended)
- Monitor for suspicious verification patterns
- Use HTTPS for proof transmission
- Store nullifiers securely (PostgreSQL recommended)

## Resources

### x402 Protocol
- [x402 Documentation](https://docs.cdp.coinbase.com/x402)
- [x402 Gitbook](https://x402.gitbook.io)
- [EIP-3009 Specification](https://eips.ethereum.org/EIPS/eip-3009)

### Self Protocol
- [Self Protocol Documentation](https://docs.self.xyz)
- [Backend Integration](https://docs.self.xyz/backend-integration/basic-integration)
- [Frontend QR SDK](https://docs.self.xyz/frontend-integration/qrcode-sdk)
- [Contract Integration](https://docs.self.xyz/contract-integration/deployed-contracts)

### Celo Network
- [Celo Documentation](https://docs.celo.org/)
- [Celo Mainnet Explorer](https://celoscan.io/)
- [USDC on Celo](https://celoscan.io/address/0xcebA9300f2b948710d2653dD7B07f33A8B32118C)

### Architecture Documentation
- [SELF_FACILITATOR_ARCHITECTURE.md](../SELF_FACILITATOR_ARCHITECTURE.md) - Complete architecture guide
- [SelfFrontend Example](../SelfFrontend/) - Frontend integration example

## Deployment

### Railway Deployment (Recommended for Subdirectories)

Railway is the easiest option for deploying from monorepo subdirectories.

**Quick Start**:

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **New Project** → **Deploy from GitHub repo**
3. **Select repository**: `Self-x402`
4. **⚠️ CRITICAL**: Set **Root Directory** to `Selfx402Facilitator` in Settings
5. **Add Variables** in Variables tab:
   ```
   CELO_MAINNET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NODE_ENV=production
   ```
6. **Deploy** and wait ~2-3 minutes
7. **Get URL** from Settings → Domains (e.g., `https://your-app.up.railway.app`)
8. **Test**: `curl https://your-app.up.railway.app/health`

**See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for complete step-by-step guide with screenshots and troubleshooting.**

**Features**:
- ✅ Subdirectory support (perfect for monorepos)
- ✅ Auto-deploy on git push
- ✅ Free tier: $5/month credit
- ✅ Automatic HTTPS
- ✅ Web UI (no CLI required)

**Cost**: ~$3-5/month (Free tier includes $5/month credit)

### Alternative Deployment Options

**Render** (also supports subdirectories):
1. Go to https://render.com/dashboard
2. New → Web Service → Connect GitHub repo
3. Set Root Directory: `Selfx402Facilitator`
4. Build Command: `npm install && npx tsc`
5. Start Command: `node dist/index.js`
6. Add environment variables
7. Deploy

**VPS (DigitalOcean, AWS EC2, etc.)**:
```bash
# SSH into server
ssh user@your-server.com

# Clone repository
git clone https://github.com/your-repo/selfx402.git
cd selfx402/Selfx402Facilitator

# Install dependencies
npm install

# Build
npm run build

# Set environment variables in .env file
# (copy from .env.example)

# Run with PM2 (process manager)
npm install -g pm2
pm2 start dist/index.js --name selfx402-facilitator
pm2 save
pm2 startup
```

## License

MIT
