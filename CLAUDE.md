# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Selfx402** is a decentralized marketplace and payment framework combining Self Protocol (zero-knowledge passport verification) with x402 (HTTP-native crypto micropayments) to create tiered pricing where verified humans pay 1000-2000x less than bots.

**Tagline**: "Verify once, pay instantly, access everything"

**Key Innovation**: Self Protocol determines WHO you are (bot vs unique human), x402 handles HOW you pay (instant micropayments), enabling dynamic tiered pricing without traditional user accounts or databases.

**Current Status**:
- **Day 4 of Self ZK Residency** (Oct 14-31, 2025)
- ✅ Phase 1A complete (x402 payment system working on Celo mainnet)
- 🚧 Phase 1B in progress (Self Protocol integration for tiered pricing)

**📚 Complete Documentation**:
- [README.md](README.md) - **Quick start guide** with Mermaid diagrams
- [Docs/SELFX402-PRODUCT-DEFINITION.md](Docs/SELFX402-PRODUCT-DEFINITION.md) - **Complete product definition** with architecture, business model, roadmap
- [Vendors/Places-x402-Api/README-CELO.md](Vendors/Places-x402-Api/README-CELO.md) - **x402 payment implementation**
- [Vendors/Places-x402-Api/CELO-X402-ARCHITECTURE.md](Vendors/Places-x402-Api/CELO-X402-ARCHITECTURE.md) - **Architecture deep-dive**

---

## Architecture

### Two-Component System

1. **Vendors/Places-x402-Api/** - Express.js API server with x402 micropayment middleware (example vendor implementation)
2. **Selfx402Facilitator/** - Independent payment verification service

### Key Design Decisions

**Custom Middleware Approach**: Official x402-express/x402-hono packages only support Base networks. We built custom middleware to support Celo networks while maintaining 100% x402 standard compliance.

**Payment Flow Architecture**:
```
Client → Sign EIP-712 → API Middleware → Selfx402Facilitator Verify/Settle → Process Request
```

**Planned Identity Flow** (not yet implemented):
```
User → QR Code → Self App → Passport NFC → ZK Proof → Store Locally → Include in Requests → Tier Pricing
```

---

## Development Commands

### Vendors/Places-x402-Api (Example Vendor)

```bash
# Development
cd Vendors/Places-x402-Api
npm run dev              # Start development server (localhost:3000)

# Testing
npm run test:celo        # Complete payment flow test
npm test                 # Run all tests

# Production
npm run build            # TypeScript compilation
npm start                # Start production server
vercel deploy            # Deploy to Vercel serverless

# Code Quality
npm run format           # Format code with Prettier
npm run format:check     # Check formatting
npm run lint             # ESLint with auto-fix
npm run lint:check       # ESLint check only
```

### Selfx402Facilitator

```bash
# Development
cd Selfx402Facilitator
PORT=3005 npx tsx index.ts    # Start facilitator (required for API)
npm run dev                    # Alternative start command
```

### Running Both Services

**Terminal 1 (Facilitator):**
```bash
cd Selfx402Facilitator
PORT=3005 npx tsx index.ts
```

**Terminal 2 (Vendor API):**
```bash
cd Vendors/Places-x402-Api
npm run dev
```

**Terminal 3 (Test):**
```bash
cd Vendors/Places-x402-Api
npm run test:celo
```

---

## Environment Configuration

### Vendors/Places-x402-Api/.env

```bash
# Required (Celo Mainnet)
PAYMENT_WALLET_ADDRESS=0x...     # Your receiving wallet
NETWORK=celo                     # Fixed to Celo mainnet (Chain ID: 42220)
PAYMENT_PRICE_USD=0.001          # Price per request
FACILITATOR_URL=http://localhost:3005

# Optional
NODE_ENV=development             # or "production"
PORT=3000

# Self Protocol (Phase 1B - to be added)
SELF_VERIFIER_ADDRESS=0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF
SELF_APP_SCOPE=selfx402-prod
```

### Selfx402Facilitator/.env

```bash
# Celo Mainnet (Phase 1)
CELO_MAINNET_PRIVATE_KEY=0x...
CELO_MAINNET_RPC_URL=https://forno.celo.org

# Note: No testnet support due to EIP-3009 requirement
```

---

## Core Architecture Concepts

### 1. Custom Payment Middleware ([src/middleware/celo-payment-middleware.ts](Vendors/Places-x402-Api/src/middleware/celo-payment-middleware.ts:1))

**Purpose**: Validates x402 payments for Celo networks (bypasses Base-only official packages)

**Flow**:
1. Extract X-Payment header from request
2. Parse payment envelope (network, authorization, signature)
3. Validate envelope structure and amounts
4. Call Selfx402Facilitator for signature verification
5. Call Selfx402Facilitator for on-chain settlement
6. Attach settlement data to request
7. Proceed to route handler or return 402 error

**Key Functions**:
- `celoPaymentMiddleware(config)` - Factory function returning Express middleware
- Validates: network match, payTo address, payment amount
- Handles: verification errors, settlement failures, facilitator timeouts

### 2. Selfx402Facilitator Service ([Selfx402Facilitator/index.ts](Selfx402Facilitator/index.ts:1))

**Purpose**: Independent EIP-712 signature verification and USDC settlement for Celo

**Endpoints**:
- `GET /supported` - Returns supported payment schemes and networks
- `POST /verify-celo` - Verifies EIP-712 signature matches payment authorization
- `POST /settle-celo` - Executes USDC transfer on-chain using EIP-3009

**Implementation**:
- Uses `viem` for signature recovery (`recoverTypedDataAddress`)
- Supports Celo Mainnet (42220) and Celo Sepolia (11142220)
- Validates: signature validity, authorization windows, payer address

### 3. X402 Configuration ([src/config/x402.ts](Vendors/Places-x402-Api/src/config/x402.ts:1))

**Purpose**: Central configuration for pricing, routes, and service discovery

**Key Exports**:
- `x402Config` - Network, pricing, facilitator URL, payTo address
- `paymentRoutes` - Route definitions with pricing, schemas, examples
- `serviceDiscovery` - /.well-known/x402 endpoint metadata including:
  - Standard x402 payment configuration
  - Self Protocol verification options (tiered pricing: $1.00 bot, $0.0005 human)
  - Bazaar-compatible metadata (production only)

**Route Definition Pattern**:
```typescript
"GET /api/demo": {
  price: "0.001",              // String without $ (x402 standard)
  network: "celo-sepolia",
  description: "...",
  inputSchema: { ... },        // JSON Schema
  outputSchema: { ... },
  examples: [...]
}
```

### 4. Payment Envelope Format

**Client-side signing** (EIP-712 typed data):
```typescript
{
  network: "celo-sepolia",
  authorization: {
    from: "0xPayer",
    to: "0xPayee",
    value: "1000",              // USDC smallest unit (6 decimals)
    validAfter: 0,
    validBefore: 1234567890,
    nonce: "0x..."              // Random 32-byte hex
  },
  signature: "0x..."            // EIP-712 signature
}
```

**Sent as X-Payment header**: `JSON.stringify(envelope)`

---

## Network Configuration

### ✅ Celo Mainnet ONLY (Phase 1)
- **Chain ID**: 42220
- **USDC**: `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` ✅ **EIP-3009 Support**
- **Self Protocol**: `0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF`
- **RPC**: `https://forno.celo.org`
- **Explorer**: `https://celoscan.io`

**Why Celo Mainnet Only?**
1. ✅ EIP-3009 USDC support confirmed and tested
2. ✅ Self Protocol mainnet contract deployed
3. ✅ Low transaction fees (<$0.01 per payment)
4. ✅ Fast block times (5 seconds)
5. ✅ Mobile-first ecosystem (matches Self app)

**Critical Requirement**: EIP-3009 USDC Support
- ❌ **Celo Alfajores/Sepolia**: USDC doesn't support EIP-3009 (cannot be used)
- ❌ **Other Testnets**: Most testnet USDC contracts lack EIP-3009
- 📋 **Future Networks**: Must verify EIP-3009 support before integration
  - Base mainnet (pending verification)
  - Polygon mainnet (pending verification)

---

## Key Files to Understand

### Vendor API (Places Example)
- [src/server.ts](Vendors/Places-x402-Api/src/server.ts:1) - Express app setup, middleware, endpoints
- [src/middleware/celo-payment-middleware.ts](Vendors/Places-x402-Api/src/middleware/celo-payment-middleware.ts:1) - Custom x402 payment validation
- [src/config/x402.ts](Vendors/Places-x402-Api/src/config/x402.ts:1) - Pricing, routes, service discovery config
- [src/types/index.ts](Vendors/Places-x402-Api/src/types/index.ts) - TypeScript type definitions

### Facilitator Service
- [Selfx402Facilitator/index.ts](Selfx402Facilitator/index.ts:1) - Verification and settlement endpoints
- [Selfx402Facilitator/config/networks.ts](Selfx402Facilitator/config/networks.ts) - Network configurations (Celo mainnet)
- [Selfx402Facilitator/config/chains.ts](Selfx402Facilitator/config/chains.ts) - Viem chain definitions

### Documentation (Complete Suite)

**Core Product Documentation**:
- **[README.md](README.md)** - **🚀 Quick start** with architecture diagrams (consumer/vendor flows)
- **[Docs/SELFX402-PRODUCT-DEFINITION.md](Docs/SELFX402-PRODUCT-DEFINITION.md)** - **📋 Complete product spec**
  - Executive summary, vision, architecture
  - Business model (membership tiers, revenue)
  - How Self Protocol works (Stage 0, 1, 2 flows)
  - Mermaid diagrams
  - Roadmap, success metrics, competitive analysis

**Implementation Guides**:
- [Vendors/Places-x402-Api/CELO-X402-ARCHITECTURE.md](Vendors/Places-x402-Api/CELO-X402-ARCHITECTURE.md) - Architecture deep-dive
- [Vendors/Places-x402-Api/README-CELO.md](Vendors/Places-x402-Api/README-CELO.md) - Implementation guide
- [Selfx402Facilitator/README.md](Selfx402Facilitator/README.md) - Facilitator service guide

---

## Testing Strategy

### Payment Flow Test ([tests/celo-payment-test.ts](Vendors/Places-x402-Api/tests/celo-payment-test.ts))

**What it tests**:
1. Fetch service discovery from `/.well-known/x402`
2. Create EIP-712 payment authorization
3. Sign with test wallet
4. Send request with X-Payment header
5. Verify 200 response with data
6. Validate response structure

**Expected output**:
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

### Test Environment Setup

1. Create `Vendors/Places-x402-Api/test-env.local`:
```bash
TEST_WALLET_PRIVATE_KEY=0x...
TEST_WALLET_ADDRESS=0x...
API_BASE_URL=http://localhost:3000
FACILITATOR_URL=http://localhost:3005
PAYMENT_AMOUNT_USD=0.001
NETWORK=celo-sepolia
```

2. Get test USDC:
   - Visit https://faucet.celo.org for CELO tokens
   - Swap for USDC on Uniswap: https://app.uniswap.org

---

## Planned Self Protocol Integration

**Status**: Not yet implemented (see [Selfx402Facilitator/SELF_PROTOCOL_IMPLEMENTATION.md](Selfx402Facilitator/SELF_PROTOCOL_IMPLEMENTATION.md) for current work)

**Complete Implementation Guide**: See official documentation and vendor implementation guide for full code examples, API reference, and integration patterns.

**Architecture**:
1. User scans QR code with Self mobile app
2. App reads passport NFC, generates zero-knowledge proof
3. Proof stored in browser localStorage
4. Included in API requests via X-Self-Proof header
5. Server validates proof, extracts nullifier, determines tier
6. Pricing adjusted: unverified (bot) = $1.00, verified human = $0.001

**Key Packages** (to be installed):
- `@selfxyz/qrcode` - Frontend QR generation
- `@selfxyz/backend` - Server-side proof verification
- `@selfxyz/core` - Core utilities

**Self Protocol Deployed Contracts** (from scraped docs):
- Celo Mainnet: `0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF` (Real passports)
- Celo Testnet: `0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74` (Mock passports)

**Frontend Setup Example**:
```typescript
import { SelfAppBuilder } from "@selfxyz/qrcode";

const app = new SelfAppBuilder({
  version: 2,
  appName: "Your App",
  scope: "unique-scope",  // Max 30 chars, must match backend
  endpoint: "https://api.yourapp.com/api/verify",
  userId: ethers.ZeroAddress,
  userIdType: "hex",
  disclosures: {
    minimumAge: 18,
    excludedCountries: ["IRN", "PRK"],
    ofac: true,
    nationality: true
  }
}).build();
```

**Backend Setup Example**:
```typescript
import { SelfBackendVerifier, DefaultConfigStore, AllIds } from "@selfxyz/backend";

const verifier = new SelfBackendVerifier(
  "unique-scope",  // Must match frontend
  "https://api.yourapp.com/api/verify",
  false,  // mockPassport: false = mainnet
  AllIds,  // Allow all document types
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: ["IRN", "PRK", "RUS", "SYR"],
    ofac: true
  }),
  "hex"  // Must match frontend userIdType
);

const result = await verifier.verify(attestationId, proof, publicSignals);
// result contains: valid, ageValid, ofacValid, nullifier, discloseOutput
```

**Nullifier System** (critical for Sybil resistance):
```typescript
// Check if passport already used for this resource
const exists = await checkNullifier(result.nullifier, resourceId);
if (exists) throw new Error("Verification already used");

// Store nullifier to prevent reuse
await storeNullifier(result.nullifier, resourceId);
```

**Database Schema** (planned):
- `users` - User accounts
- `api_keys` - Keys with tier and nullifier
- `verifications` - Self proofs with expiry
- `api_usage` - Request logs
- `nullifier_usage` - Sybil resistance tracking (nullifier + resource mapping)

**See official Self Protocol documentation for**:
- Complete SelfBackendVerifier API reference: https://docs.self.xyz/backend-integration/selfbackendverifier-api-reference
- Disclosure configuration options: https://docs.self.xyz/use-self/disclosures
- Error handling patterns and security best practices
- Combined Self + x402 middleware examples

---

## Common Development Patterns

### Adding a New Protected Endpoint

1. **Define route in [src/config/x402.ts](Vendors/Places-x402-Api/src/config/x402.ts:1)**:
```typescript
paymentRoutes: {
  "GET /api/my-endpoint": {
    price: "0.002",
    network: x402Config.network,
    discoverable: isProduction,
    description: "...",
    inputSchema: { ... },
    outputSchema: { ... }
  }
}
```

2. **Add handler in [src/server.ts](Vendors/Places-x402-Api/src/server.ts:1)**:
```typescript
app.get('/api/my-endpoint', (req, res) => {
  const settlementData = (req as any).settlementData;
  // Your logic here
  res.json({ data: "..." });
});
```

3. **Middleware auto-applies** - No additional configuration needed

### Modifying Pricing

**Single endpoint**: Update `price` in `paymentRoutes` ([src/config/x402.ts](Vendors/Places-x402-Api/src/config/x402.ts:1))

**Global price**: Update `PAYMENT_PRICE_USD` in `.env`

**Price format**: String without $ symbol, e.g., "0.001" (x402 standard)

### Debugging Payment Failures

1. **Check Selfx402Facilitator is running** (`http://localhost:3005/supported`)
2. **Verify environment variables** (wallet address, network, facilitator URL)
3. **Check test wallet USDC balance** on block explorer
4. **Review middleware logs** for verification/settlement errors
5. **Test signature locally** using `viem.recoverTypedDataAddress`

---

## X402 Standard Compliance

This implementation is **100% x402-compliant** despite using custom middleware:

✅ Standard `/.well-known/x402` service discovery
✅ EIP-712 typed data signatures
✅ EIP-3009 transferWithAuthorization
✅ Standard payment envelope format
✅ Custom facilitator support (explicitly allowed by x402 spec)
✅ Bazaar-compatible service discovery (production only)

**Why Custom?**: Official packages (x402-express, x402-hono) hardcode Base network support. Custom middleware enables any EVM network with EIP-3009 USDC.

---

## Important Implementation Notes

### Middleware Execution Order
1. Security (helmet, CORS)
2. Body parsing (express.json)
3. **celoPaymentMiddleware** (validates protected routes)
4. Route handlers
5. Error handlers (404, 500)

### Settlement vs Verification
- **Verification**: Validates signature matches payment authorization (fast)
- **Settlement**: Executes actual USDC transfer on-chain (slow, ~2-30s)
- Both must succeed for request to proceed

### Nullifier Management (Planned)
- Self Protocol generates unique nullifier per passport
- Store nullifier → resource mapping in database
- Prevent same passport from claiming multiple "human" tiers
- Critical for Sybil resistance in tiered pricing

### Rate Limiting (Not Implemented)
- Planned: Redis-backed sliding window
- Tier-based limits: unverified (2/min), verified (100/min), premium (1000/min)
- Payment-based metering (track USDC spent per wallet)

---

## Deployment

### Vercel (Recommended for Vendor API)

```bash
cd Vendors/Places-x402-Api
vercel deploy
```

**Environment variables** (set in Vercel dashboard):
- `NODE_ENV=production`
- `PAYMENT_WALLET_ADDRESS=0x...`
- `NETWORK=celo`
- `PAYMENT_PRICE_USD=0.001`
- `FACILITATOR_URL=https://your-facilitator.example.com`

**Serverless config**: See [Vendors/Places-x402-Api/vercel.json](Vendors/Places-x402-Api/vercel.json)

### Selfx402Facilitator Deployment

Must be deployed separately (not serverless):
- VPS (DigitalOcean, AWS EC2, etc.)
- Docker container
- Kubernetes cluster

**Requirements**:
- Node.js runtime
- Private key with ETH for gas
- Public endpoint accessible by API server

---

## External Documentation References

### Official Documentation Links

**Self Protocol**:
- Quickstart: https://docs.self.xyz/use-self/quickstart
- Frontend SDK: https://docs.self.xyz/frontend-integration/qrcode-sdk
- Backend SDK: https://docs.self.xyz/backend-integration/basic-integration
- Deployed Contracts: https://docs.self.xyz/contract-integration/deployed-contracts
- Disclosures: https://docs.self.xyz/use-self/disclosures
- API Reference: https://docs.self.xyz/backend-integration/selfbackendverifier-api-reference

**x402 Protocol**:
- Overview: https://x402.gitbook.io/x402
- Sellers Guide: https://x402.gitbook.io/x402/getting-started/quickstart-for-sellers
- Buyers Guide: https://x402.gitbook.io/x402/getting-started/quickstart-for-buyers
- HTTP 402: https://x402.gitbook.io/x402/core-concepts/http-402
- Facilitator: https://x402.gitbook.io/x402/core-concepts/facilitator
- Network Support: https://x402.gitbook.io/x402/core-concepts/network-and-token-support

**Coinbase CDP x402**:
- Welcome: https://docs.cdp.coinbase.com/x402/welcome
- How It Works: https://docs.cdp.coinbase.com/x402/core-concepts/how-it-works
- Network Support: https://docs.cdp.coinbase.com/x402/network-support

**Standards**:
- EIP-712: https://eips.ethereum.org/EIPS/eip-712
- EIP-3009: https://eips.ethereum.org/EIPS/eip-3009

See links above for complete documentation.

---

## Project Roadmap

### 🎯 Self ZK Residency Timeline
- **Start**: October 14, 2025
- **Current**: October 17, 2025 (Day 4)
- **Deadline**: October 31, 2025 (14 days remaining)

### ✅ Phase 1A: X402 Payment System (Days 1-3, Complete)
- Custom Celo mainnet payment middleware
- CeloFacilitator verification service
- EIP-712/EIP-3009 integration
- Payment flow testing (end-to-end)
- Service discovery (/.well-known/x402)

### 🚧 Phase 1B: Self Protocol Integration (Days 4-14, In Progress)
- Frontend QR code generation (`@selfxyz/qrcode`)
- Backend proof verification (`@selfxyz/backend`)
- Nullifier tracking database (PostgreSQL)
- Multi-tier pricing engine (bot/human/premium)
- Marketplace frontend MVP
- Consumer demo app with savings calculator

### 📋 Phase 1 Deliverables (by Oct 31)
- Working demo: Self verification → x402 payment → tiered pricing
- 3 example vendor integrations (image gen, text API, compute)
- Consumer demo app with savings visualization
- Technical documentation and integration guides
- Residency presentation and demo video

### 📋 Post-Residency: Phase 2 (Nov-Dec 2025)
- Vendor registration portal
- Consumer dashboard with analytics
- Network expansion evaluation (Base/Polygon EIP-3009 verification)
- Production scaling (Celo mainnet)
- 10 partner vendor onboarding

### 📋 Phase 3: Growth & Scale (2026)
- Rate limiting (Redis)
- Advanced analytics dashboard
- Premium tier features
- Mobile app (native Self integration)
- White-label solution
- AI agent marketplace integration

---

## Key Learnings & Architecture Decisions

### Product Evolution (Oct 14-17, 2025)

**Initial Concept** → **Selfx402 Marketplace**:
- Started as "Self-x402" payment system
- Evolved into full marketplace platform
- Focus: Proof-of-unique-human enabling fair API pricing

### Critical Architecture Decisions

**1. Network Strategy: Celo Mainnet Only**
- **Decision**: Support only Celo mainnet (no testnets)
- **Reason**: EIP-3009 `transferWithAuthorization` requirement
- **Impact**: Celo Alfajores/Sepolia USDC doesn't support EIP-3009
- **Lesson**: Always verify USDC contract capabilities before network selection
- **Future**: Base/Polygon mainnet require EIP-3009 verification before expansion

**2. Business Model: Membership vs Transaction Fees**
- **Initial**: 2.5% platform fee on transaction value
- **Problem**: x402 protocol mandates vendor-set prices (no intermediary modification)
- **Solution**: Membership tiers with transaction quotas
- **Revenue**: Predictable ($29-$499/month), vendor-controlled pricing
- **Key Insight**: Platform provides infrastructure, not payment processing fees

**3. Self Protocol Two-Stage Flow**
- **Stage 0**: One-time passport enrollment in Self mobile app (local storage)
- **Stage 1+**: Per-vendor verification with zero-knowledge proofs
- **Privacy Guarantee**: Passport data NEVER uploaded to servers
- **Vendor Access**: Only boolean attributes (age≥18: true, not actual age)
- **Sybil Resistance**: Nullifier system (one passport = one unique human)

**4. Tiered Pricing Strategy**
- **Unverified (Bot)**: $1.00 per request (baseline)
- **Verified Human**: $0.001 per request (1000x cheaper)
- **Premium Human**: $0.0005 per request (2000x cheaper)
- **Key Insight**: Cryptographic proof enables massive price discrimination without discrimination

### Technical Discoveries

**x402 Protocol**:
- HTTP 402 status code enables native crypto payments
- EIP-712 signatures prevent phishing attacks
- EIP-3009 enables gasless USDC transfers
- 2-second settlement on Celo mainnet
- Custom facilitators explicitly allowed by spec

**Self Protocol**:
- Zero-knowledge proofs reveal only boolean attributes
- Nullifiers enable Sybil resistance without tracking individuals
- 90-day verification expiry with re-verification
- Supports multiple document types (passport, EU ID, Aadhaar)
- OFAC compliance and age verification built-in

**Integration Pattern**:
```
Identity Layer (Self) + Payment Layer (x402) = Tiered Pricing
WHO you are (unique human) + HOW you pay (instant USDC) = Fair pricing
```

### UX Insights

**Consumer Journey**:
1. One-time passport scan (30 seconds, done in Self app)
2. Per-vendor QR code verification (first time only)
3. Proof cached for 90 days (no re-scan needed)
4. Instant x402 payment on each request
5. 1000x savings compared to bots

**Vendor Journey**:
1. Sign up, select membership tier ($29-$499/month)
2. Install middleware (5 lines of code)
3. Configure pricing (bot/human/premium rates)
4. Set verification requirements (age, nationality, OFAC)
5. Monitor transaction quota (auto-warnings at 80%)

### Documentation Strategy

**Documentation System**:
1. **README.md**: Quick start with Mermaid diagrams (consumer/vendor flows)
2. **Docs/SELFX402-PRODUCT-DEFINITION.md**: Complete product specification
3. **CLAUDE.md**: Developer guide for working with the codebase
4. **Vendor API docs**: Implementation guides in Vendors/Places-x402-Api/
5. **Facilitator docs**: Service documentation in Selfx402Facilitator/

**Mermaid Diagrams** (7 total across docs):
- Architecture overview graph
- Stage 0: Passport enrollment (sequence)
- Stage 1: First-time verification (28-step sequence)
- Stage 2: Cached proof flow (sequence)
- Consumer flow (30-step sequence)
- Vendor flow (registration → operations)
- Component interaction graph

### Competitive Advantages Identified

**vs Traditional KYC**:
- ✅ Instant (vs days)
- ✅ Privacy-preserving (vs full disclosure)
- ✅ Lower cost (vs $5-50 per verification)
- ✅ Better UX (vs forms + document upload)

**vs CAPTCHA**:
- ✅ Can't be solved by AI
- ✅ One-time verification (vs every request)
- ✅ Better UX (vs annoying puzzles)
- ✅ Stronger security guarantee

**vs Web3 Marketplaces**:
- ✅ Proof-of-unique-human (vs wallet-only identity)
- ✅ Sybil-resistant (vs no protection)
- ✅ HTTP 402 native (vs manual wallet TX)
- ✅ 5-line integration (vs complex smart contracts)

### Open Questions & Risks

**Technical**:
- Self Protocol mobile app adoption rate?
- Payment network congestion mitigation?
- Facilitator high availability strategy?

**Business**:
- Vendor value perception and acquisition?
- Consumer education on savings benefits?
- Regulatory compliance across jurisdictions?

**Mitigation Strategies**:
- Web-based verification fallback
- Multi-network support with failover
- Free tier for vendor testing
- Savings calculator and ROI demos
- Modular disclosure system

---

## Support and Resources

**Project Documentation**:
- [README.md](README.md) - Quick start guide with architecture diagrams
- [CLAUDE.md](CLAUDE.md) - This file (developer guide)
- [Docs/SELFX402-PRODUCT-DEFINITION.md](Docs/SELFX402-PRODUCT-DEFINITION.md) - Complete product specification

**Implementation Guides**:
- [Vendors/Places-x402-Api/README-CELO.md](Vendors/Places-x402-Api/README-CELO.md) - Vendor API implementation guide
- [Vendors/Places-x402-Api/CELO-X402-ARCHITECTURE.md](Vendors/Places-x402-Api/CELO-X402-ARCHITECTURE.md) - Architecture deep-dive
- [Selfx402Facilitator/README.md](Selfx402Facilitator/README.md) - Facilitator service documentation
- [Selfx402Facilitator/SELF_PROTOCOL_IMPLEMENTATION.md](Selfx402Facilitator/SELF_PROTOCOL_IMPLEMENTATION.md) - Self Protocol integration work
