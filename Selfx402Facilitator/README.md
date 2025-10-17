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

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `CELO_MAINNET_PRIVATE_KEY`: Private key for mainnet operations (required)
- `CELO_MAINNET_RPC_URL`: Optional custom RPC URL (defaults to https://forno.celo.org)
- `SERVER_DOMAIN`: Your public domain (e.g., http://codalabs.ngrok.io or https://yourdomain.com)
- `SELF_ENDPOINT`: Your public verification endpoint (e.g., http://codalabs.ngrok.io/api/verify)
- `SELF_SCOPE`: Unique scope identifier for your app (e.g., celo-facilitator)

⚠️ **Security**: Never commit your `.env` file. Keep private keys secure.

3. **Setup ngrok tunnel** (required for Self Protocol):

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

Your facilitator will be accessible at `http://codalabs.ngrok.io`

4. **Build:**
```bash
npm run build
```

5. **Run in development:**
```bash
npm run dev
```

6. **Run in production:**
```bash
npm start
```

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
- **Storage**: In-memory Map (TODO: PostgreSQL)
- **Uniqueness**: One passport = one nullifier per scope
- **Expiry**: 90 days (re-verification required)

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

## License

MIT
