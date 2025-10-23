# Celo X402 Payment System

**X402-compliant micropayment API for Celo networks with custom facilitator**

## Overview

This project implements the [X402 micropayment standard](https://x402.gitbook.io/x402/) for Celo networks. While official x402 packages (x402-express, x402-hono) only support Base networks, the X402 standard is **network-agnostic** and explicitly supports custom facilitators for any EVM-compatible chain.

## Features

✅ **100% X402 Standard Compliant**
- Standard `/.well-known/x402` service discovery
- EIP-712 typed data signatures
- EIP-3009 transferWithAuthorization
- Custom facilitator support (per X402 spec)

✅ **Celo Network Support**
- Celo Mainnet (42220)
- Celo Sepolia Testnet (11142220)
- USDC gasless micropayments

✅ **Production Ready**
- Express.js API server
- Custom payment middleware
- Comprehensive error handling
- Vercel serverless deployment

✅ **Self Protocol Integration**
- Tiered pricing (2000x bot vs human)
- Zero-knowledge proof verification
- Nullifier-based Sybil resistance
- Service discovery with verification options

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# API Server (.env)
NODE_ENV=development
PORT=3000
PAYMENT_WALLET_ADDRESS=0xYourReceivingAddress
NETWORK=celo-sepolia
PAYMENT_PRICE_USD=0.001
FACILITATOR_URL=http://localhost:3005
```

### 3. Start Services
```bash
# Terminal 1: Start CeloFacilitator
cd ../CeloFacilitator
PORT=3005 npx tsx index.ts

# Terminal 2: Start API Server
cd ../Celo-x402-Api
PORT=3000 npx tsx src/server.ts
```

### 4. Run Test
```bash
npm run test:celo
```

## Architecture

### Components

1. **Custom Payment Middleware** ([`src/middleware/celo-payment-middleware.ts`](src/middleware/celo-payment-middleware.ts))
   - Validates X-Payment headers
   - Verifies payment envelopes
   - Calls CeloFacilitator for signature verification

2. **CeloFacilitator** ([`../CeloFacilitator/`](../CeloFacilitator/))
   - Independent verification service
   - EIP-712 signature recovery using viem
   - Supports Celo Mainnet and Sepolia

3. **Express API Server** ([`src/server.ts`](src/server.ts))
   - Payment-protected endpoints
   - X402 service discovery
   - Comprehensive documentation

### Payment Flow

```
Client                    API Server              CeloFacilitator
  |                            |                         |
  |-- 1. Sign EIP-712 -------->|                         |
  |    (transferWithAuth)      |                         |
  |                            |                         |
  |-- 2. Send X-Payment ------>|                         |
  |    header                  |                         |
  |                            |                         |
  |                            |-- 3. Verify Signature ->|
  |                            |                         |
  |                            |<-- 4. Valid/Invalid ----|
  |                            |                         |
  |<-- 5. Return Data ---------|                         |
  |    or 402 Error            |                         |
```

## Endpoints

### Free Endpoints
- `GET /` - API information
- `GET /health` - Health check
- `GET /.well-known/x402` - Service discovery (X402 standard)
- `GET /api/info` - API documentation

### Protected Endpoints (Require Payment)
- `GET /api/demo` - Celo network data ($0.001 USDC)

## X402 Compliance

### Service Discovery
```bash
curl http://localhost:3000/.well-known/x402
```

Returns X402-compliant metadata:
```json
{
  "payTo": "0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f",
  "routes": {
    "GET /api/demo": {
      "price": "0.001",
      "network": "celo-sepolia",
      "description": "Celo network data and statistics",
      "inputSchema": {...},
      "outputSchema": {...}
    }
  },
  "service": "Celo X402 Demo API",
  "version": "1.0.0",
  "capabilities": [...],
  "endpoints": [...]
}
```

### Payment Envelope
```typescript
{
  network: "celo-sepolia",
  authorization: {
    from: "0xPayer",
    to: "0xPayee",
    value: "1000", // 0.001 USDC (6 decimals)
    validAfter: 0,
    validBefore: 1234567890,
    nonce: "0x..."
  },
  signature: "0x..." // EIP-712 signature
}
```

## Testing

### Setup Test Wallet
```bash
# Create test-env.local with:
TEST_WALLET_PRIVATE_KEY=0x...
TEST_WALLET_ADDRESS=0x...
API_BASE_URL=http://localhost:3000
FACILITATOR_URL=http://localhost:3005
PAYMENT_AMOUNT_USD=0.001
NETWORK=celo-sepolia
```

### Get Test USDC
1. Get Celo Sepolia tokens from [Celo Faucet](https://faucet.celo.org)
2. Swap for USDC on [Uniswap](https://app.uniswap.org)

### Run Tests
```bash
npm run test:celo
```

Expected output:
```
✅ Step 1: Fetching payment requirements...
✅ Step 2: Preparing payment envelope...
✅ Step 3: Signing payment authorization...
✅ Step 4: Creating x402 payment envelope...
✅ Step 5: Sending payment request...
   Response time: 35ms ⚡
✅ Step 6: Verifying response...
🎉 TEST PASSED - Payment flow completed successfully!
```

## Network Configuration

### Celo Sepolia (Testnet)
- **Chain ID**: 11142220
- **USDC**: `0x01C5C0122039549AD1493B8220cABEdD739BC44E`
- **RPC**: `https://celo-sepolia.g.alchemy.com`
- **Explorer**: `https://celo-sepolia.blockscout.com`
- **Faucet**: `https://faucet.celo.org`

### Celo Mainnet
- **Chain ID**: 42220
- **USDC**: `0xcebA9300f2b948710d2653dD7B07f33A8B32118C`
- **RPC**: `https://forno.celo.org`
- **Explorer**: `https://celoscan.io`

## Deployment

### Vercel
```bash
vercel deploy
```

Configure environment variables in Vercel dashboard:
- `NODE_ENV=production`
- `PAYMENT_WALLET_ADDRESS=0x...`
- `NETWORK=celo-sepolia`
- `PAYMENT_PRICE_USD=0.001`
- `FACILITATOR_URL=https://your-facilitator.example.com`

## Why Custom Middleware?

The official x402-express and x402-hono packages are designed for Base networks with CDP's facilitator. They throw "Unsupported network" errors for Celo networks because their `getNetworkId()` function only recognizes Base chains.

**Our custom middleware approach:**
- ✅ Follows X402 standard exactly
- ✅ Uses standard X-Payment headers
- ✅ Uses standard EIP-712 signatures
- ✅ Works with custom facilitators (explicitly supported by X402)
- ✅ Supports any EVM network

**From X402 documentation:**
> "Run your own self-hosted facilitator for networks like Avalanche, Polygon, Arbitrum, and other EVM-compatible chains"

This is exactly what we've built for Celo! 🚀

## Self Protocol Configuration 🆕

### Critical: Disclosure Config Matching

**IMPORTANT**: The widget disclosure config MUST exactly match your vendor API's `.well-known/x402` verification requirements, or Self Protocol verification will fail with `ConfigMismatchError`.

**Why**: Self Protocol encodes disclosure requirements (minimumAge, excludedCountries, OFAC) into the ZK proof circuit when creating the QR code. The backend verifier must use the EXACT same config to validate the proof.

### Configuration Files

**Vendor API** ([src/config/x402.ts:126-131](src/config/x402.ts#L126-L131)):
```typescript
verification: {
  requirements: {
    minimumAge: 18,
    excludedCountries: [],  // MUST match widget
    ofac: false,            // MUST match widget
    documentTypes: ["Passport", "EU ID Card", "Aadhaar"]
  }
}
```

**Widget Config** (in consumer app using `selfx402-pay-widget`):
```typescript
const disclosures = {
  minimumAge: 18,
  ofac: false,
  excludedCountries: []  // MUST match vendor API
}
```

### Common Configuration Errors

**❌ Mismatch Example**:
```typescript
// Widget uses empty array
excludedCountries: []

// Vendor API uses country list
excludedCountries: ["IRN", "PRK", "RUS", "SYR"]

// Result: ConfigMismatchError during verification ❌
```

**✅ Correct Matching**:
```typescript
// Both widget and vendor use same config
excludedCountries: []  // Both empty
ofac: false            // Both false
minimumAge: 18         // Both 18
```

### Error Message

If configs don't match, you'll see:
```
ConfigMismatchError: [InvalidForbiddenCountriesList]:
Forbidden countries list in config does not match with the one in the circuit
Circuit:
Config: IRN, PRK, RUS, SYR
```

### Service Discovery Endpoint

Your API exposes verification requirements at `/.well-known/x402`:

```bash
curl http://localhost:3000/.well-known/x402
```

```json
{
  "verification": {
    "requirements": {
      "minimumAge": 18,
      "excludedCountries": [],
      "ofac": false,
      "documentTypes": ["Passport", "EU ID Card", "Aadhaar"]
    }
  }
}
```

The Selfx402Facilitator automatically fetches these requirements and uses them for verification.

## Documentation

- **[Architecture Guide](CELO-X402-ARCHITECTURE.md)** - Detailed technical architecture
- **[Configuration Guide](CONFIGURATION.md)** - Server vs client configuration
- **[Testing Guide](TESTING.md)** - Complete testing instructions

## References

**X402 Protocol:**
- **X402 Standard**: https://x402.gitbook.io/x402/
- **EIP-712**: https://eips.ethereum.org/EIPS/eip-712
- **EIP-3009**: https://eips.ethereum.org/EIPS/eip-3009
- **Network Support**: https://x402.gitbook.io/x402/core-concepts/network-and-token-support
- **Custom Facilitators**: https://docs.cdp.coinbase.com/x402/network-support

**Self Protocol:**
- **Self Protocol Docs**: https://docs.self.xyz
- **Quickstart**: https://docs.self.xyz/use-self/quickstart
- **Backend SDK**: https://docs.self.xyz/backend-integration/basic-integration
- **Frontend SDK**: https://docs.self.xyz/frontend-integration/qrcode-sdk

## License

MIT

---

**Built with ❤️ for the Celo ecosystem**
