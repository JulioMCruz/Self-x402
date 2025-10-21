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
2. Copy contents from `database/schema.sql`
3. Execute SQL to create `nullifiers` table

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
      "extra": { "name": "USD Coin", "version": "2" }
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
