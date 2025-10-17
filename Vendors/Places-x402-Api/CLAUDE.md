# X402 Protocol - AI Development Guide

## Overview

**X402** is an open payment protocol developed by Coinbase that enables instant, automatic stablecoin payments directly over HTTP using the HTTP 402 "Payment Required" status code.

### Core Value Proposition
- **Instant programmatic payments** over HTTP without accounts, sessions, or complex authentication
- **Machine-to-machine (M2M) transactions** enabling AI agents to autonomously pay for API access
- **Micropayments and usage-based billing** for API services, digital content, and microservices
- **Reduced friction** through gasless USDC payments on Base network

---

## Protocol Mechanics

### Payment Flow (5 Steps)

```
1. Client Request
   └─> GET /api/resource

2. Server Payment Challenge
   └─> 402 Payment Required
       └─> Payment details (amount, network, facilitator)

3. Client Payment Creation
   └─> Wallet signs EIP-712 payment payload
       └─> Creates X-PAYMENT header

4. Client Retry with Payment
   └─> GET /api/resource
       └─> X-PAYMENT: <signed-payload>

5. Server Verification & Response
   └─> Facilitator verifies payment
       └─> Settlement on blockchain
           └─> 200 OK + Resource + X-PAYMENT-RESPONSE header
```

### Key Protocol Features
- **Stateless**: Each request is independent, no session management required
- **HTTP-native**: Uses standard HTTP headers and status codes
- **Blockchain-agnostic**: Works with any EVM network
- **Gasless**: Clients don't pay gas fees (uses `transferWithAuthorization` from EIP-3009)

---

## Network Support

### Supported Networks

| Network | Type | Facilitator | Token | Use Case |
|---------|------|-------------|-------|----------|
| **Base Sepolia** | Testnet | `https://x402.org/facilitator` | USDC (testnet) | Development & testing |
| **Base** | Mainnet | CDP Facilitator (via `@coinbase/x402`) | USDC | Production deployments |
| **XDC Mainnet** | Mainnet | `x402.rs` facilitator | USDC | Alternative mainnet |

### Token Requirements
- Must implement **EIP-3009** standard
- Must have `transferWithAuthorization` function
- USDC is the default and recommended token

---

## Implementation Guide

### For API Providers (Sellers)

#### 1. Installation

```bash
npm install express x402-express @coinbase/x402
```

#### 2. Core Imports

```typescript
import express from "express";
import { paymentMiddleware, type Resource } from "x402-express";
import { facilitator } from "@coinbase/x402"; // For mainnet only
```

⚠️ **Important**:
- Import `type Resource` for TypeScript type casting
- Import `facilitator` (not `facilitator as cdpFacilitator`)
- Use official CDP facilitator for mainnet, URL-based for testnet

#### 3. Payment Middleware Configuration

**⚡ Two Different Approaches Based on Network:**

##### 🚀 Production (Base Mainnet) - Using CDP Facilitator Object

```typescript
import { facilitator } from "@coinbase/x402";
import { paymentMiddleware } from "x402-express";

const app = express();

// Define protected routes
const x402Routes = {
  "GET /api/resource": {
    price: "$0.001",
    network: "base"  // Mainnet
  }
};

// Apply payment middleware with CDP facilitator OBJECT
app.use(
  paymentMiddleware(
    "0xYourWalletAddress",
    x402Routes,
    facilitator  // ← OBJECT (CDP facilitator with built-in verification)
  )
);
```

**Key Points:**
- ✅ Uses `facilitator` object from `@coinbase/x402`
- ✅ Requires CDP API keys (CDP_API_KEY_ID, CDP_API_KEY_SECRET)
- ✅ Automatic payment verification and settlement
- ✅ KYT/OFAC compliance built-in
- ✅ Production-ready with high performance

##### 🧪 Development (Base Sepolia) - Using URL with Manual Interceptor

```typescript
import { paymentMiddleware, type Resource } from "x402-express";

const app = express();

// Define protected routes
const x402Routes = {
  "GET /api/resource": {
    price: "$0.001",
    network: "base-sepolia"  // Testnet
  }
};

// Apply payment middleware with URL-based facilitator
app.use(
  paymentMiddleware(
    "0xYourWalletAddress",
    x402Routes,
    { url: "https://x402.org/facilitator" as Resource }  // ← URL (manual interceptor)
  )
);
```

**Key Points:**
- ✅ Uses URL string wrapped in object: `{ url: "..." as Resource }`
- ✅ No CDP API keys required
- ✅ Manual payment verification through x402.org endpoint
- ✅ Perfect for testing and development
- ✅ Free testnet USDC payments

##### 🔄 Automatic Network Detection (Recommended in Template)

```typescript
import { facilitator } from "@coinbase/x402";
import { paymentMiddleware, type Resource } from "x402-express";

const network = process.env.NETWORK as "base" | "base-sepolia";

// Automatic facilitator selection
app.use(
  paymentMiddleware(
    process.env.PAYMENT_WALLET_ADDRESS,
    x402Routes,
    // Two different patterns based on network:
    network === "base"
      ? facilitator  // ← Object for production (CDP)
      : { url: process.env.FACILITATOR_URL as Resource }  // ← URL for testnet (manual)
  )
);
```

**Why Two Different Patterns?**

| Aspect | Production (CDP Object) | Testnet (URL Manual) |
|--------|------------------------|----------------------|
| **Facilitator Type** | `facilitator` object | `{ url: string }` object |
| **Import Required** | `@coinbase/x402` | `type Resource` from `x402-express` |
| **Authentication** | CDP API keys required | No authentication needed |
| **Verification** | Automatic by CDP | Manual through x402.org |
| **Performance** | Optimized for production | Suitable for development |
| **Cost** | Free (no fees) | Free (testnet) |
| **Use Case** | Production deployments | Development & testing |

#### 4. Protected Endpoint Implementation

```typescript
app.get('/api/resource', async (req, res) => {
  // Payment has already been verified by middleware
  // Implement your business logic here

  const data = await yourService.getData();

  res.json({
    data,
    metadata: {
      cost: "$0.001",
      protocol: "x402 v1.0",
      network: "base-sepolia",
      timestamp: new Date().toISOString()
    }
  });
});
```

### For API Consumers (Buyers)

#### 1. Installation

```bash
npm install x402-axios  # or x402-fetch
```

#### 2. Client Setup

```typescript
import { wrapAxiosWithPayment } from "x402-axios";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// Create wallet account
const account = privateKeyToAccount(process.env.PRIVATE_KEY);

// Create wallet client
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http()
});

// Wrap axios with payment capabilities
const axios = wrapAxiosWithPayment(
  require('axios').create(),
  walletClient
);
```

#### 3. Making Paid Requests

```typescript
// The library handles everything automatically:
// 1. Detects 402 Payment Required
// 2. Creates payment signature
// 3. Retries with X-PAYMENT header
// 4. Returns the resource

const response = await axios.get('https://api.example.com/resource');
console.log(response.data);
```

---

## Facilitator Deep Dive

### What is a Facilitator?

A **facilitator** is an optional service that:
1. **Verifies** payment payloads submitted by clients
2. **Settles** payments on the blockchain on behalf of servers
3. **Does NOT custody** funds (payments go directly to your wallet)

### Benefits of Using a Facilitator
- ✅ No blockchain node infrastructure required
- ✅ Standardized payment verification
- ✅ Automatic settlement handling
- ✅ KYT/OFAC compliance (CDP facilitator only)
- ✅ Production-ready with high performance

### Facilitator Options

#### 🚀 Method 1: CDP Facilitator Object (Production/Mainnet)

**Use for:** Base mainnet production deployments

```typescript
import { facilitator } from "@coinbase/x402";
import { paymentMiddleware } from "x402-express";

app.use(paymentMiddleware(
  "0xYourWalletAddress",
  x402Routes,
  facilitator  // ← Direct object reference (NOT a URL)
));
```

**Characteristics:**
- **Type**: JavaScript object with built-in verification logic
- **Import**: `import { facilitator } from "@coinbase/x402"`
- **Authentication**: Requires `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` environment variables
- **Networks**: Base mainnet (primary), Base Sepolia (with CDP keys)
- **Verification**: Automatic through CDP infrastructure
- **Settlement**: Automatic blockchain settlement
- **Compliance**: Built-in KYT/OFAC checks
- **Performance**: Optimized for high-throughput production
- **Cost**: Free (no transaction fees)

**Configuration:**
```env
# Required for CDP facilitator
CDP_API_KEY_ID=organizations/.../apiKeys/...
CDP_API_KEY_SECRET=-----BEGIN EC PRIVATE KEY-----...
NETWORK=base
```

#### 🧪 Method 2: URL-based Facilitator with Manual Interceptor (Testnet)

**Use for:** Base Sepolia testnet development and testing

```typescript
import { paymentMiddleware, type Resource } from "x402-express";

app.use(paymentMiddleware(
  "0xYourWalletAddress",
  x402Routes,
  { url: "https://x402.org/facilitator" as Resource }  // ← URL wrapped in object
));
```

**Characteristics:**
- **Type**: URL string wrapped in `{ url: string }` object, cast as `Resource` type
- **Import**: `type Resource` from `x402-express` (for TypeScript type casting)
- **Authentication**: No API keys required
- **Networks**: Base Sepolia testnet only
- **Verification**: Manual verification through external x402.org endpoint
- **Settlement**: Handled by x402.org facilitator service
- **Compliance**: Basic validation only (testnet)
- **Performance**: Suitable for development workloads
- **Cost**: Free (testnet USDC)

**Configuration:**
```env
# No CDP keys required
FACILITATOR_URL=https://x402.org/facilitator
NETWORK=base-sepolia
```

### 🔄 Automatic Facilitator Selection Pattern

**Recommended approach in the template:**

```typescript
import { facilitator } from "@coinbase/x402";
import { paymentMiddleware, type Resource } from "x402-express";

const network = process.env.NETWORK as "base" | "base-sepolia";

app.use(
  paymentMiddleware(
    process.env.PAYMENT_WALLET_ADDRESS,
    x402Routes,
    // Two completely different objects based on network:
    network === "base"
      ? facilitator  // ← Method 1: CDP object (production)
      : { url: process.env.FACILITATOR_URL as Resource }  // ← Method 2: URL object (testnet)
  )
);
```

### Comparison Table

| Feature | CDP Facilitator Object | URL Facilitator Manual |
|---------|----------------------|------------------------|
| **Object Type** | `facilitator` (imported object) | `{ url: string }` (created object) |
| **TypeScript Import** | `import { facilitator }` | `import { type Resource }` |
| **Environment** | Production (Base mainnet) | Development (Base Sepolia) |
| **CDP API Keys** | Required | Not required |
| **Verification Method** | Automatic (CDP) | Manual (x402.org) |
| **Performance** | High (optimized) | Medium (sufficient) |
| **KYT/OFAC** | Yes | No |
| **Production Ready** | ✅ Yes | ❌ No (testnet only) |
| **Setup Complexity** | Medium (API keys) | Low (just URL) |

---

## Bazaar Service Discovery

### What is Bazaar?

**Bazaar** is a machine-readable catalog of X402-compatible API endpoints that enables:
- 🤖 **AI agents** to discover and use paid APIs autonomously
- 👨‍💻 **Developers** to find monetizable services programmatically
- 📊 **Dynamic service selection** based on capabilities and pricing

### Discovery Metadata Structure

```typescript
{
  service: "API Service Name",
  version: "1.0.0",
  description: "Comprehensive service description",

  // Individual endpoint metadata
  endpoints: {
    "/api/resource": {
      method: "GET",
      description: "Detailed endpoint description",
      tags: ["search", "data", "analytics"],

      // Input validation schema
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query",
            minLength: 1,
            maxLength: 256
          }
        },
        required: ["query"]
      },

      // Output structure schema
      outputSchema: {
        type: "object",
        properties: {
          data: { type: "array" },
          metadata: { type: "object" }
        }
      },

      // Usage examples
      examples: [
        {
          description: "Basic search",
          input: { query: "example" },
          output: { data: [...], metadata: {...} }
        }
      ]
    }
  },

  // Payment configuration
  payment: {
    network: "base-sepolia",
    token: "USDC",
    price_per_request: "$0.001"
  }
}
```

### Enabling Discovery

#### 1. Production-Only Discovery (Recommended)

```typescript
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

const paymentRoutes = {
  "GET /api/resource": {
    price: "$0.001",
    network: "base-sepolia",
    discoverable: isProduction,  // Only discoverable in production
    description: "Rich description for AI agents",
    tags: ["category", "feature"],
    inputSchema: { /* ... */ },
    outputSchema: { /* ... */ }
  }
};
```

#### 2. Discovery Endpoint

```typescript
app.get('/.well-known/x402', (req, res) => {
  res.json({
    service: "Your API Service",
    version: "1.0.0",
    description: "Full service description",
    endpoints: {
      // Endpoint metadata here
    }
  });
});
```

#### 3. Registration with Bazaar

Requirements:
- ✅ Use CDP facilitator
- ✅ Set `discoverable: true` in route config
- ✅ Include comprehensive metadata (description, schemas, examples)
- ✅ Deploy to production environment

---

## Self Protocol Integration (Tiered Pricing)

### What is Self Protocol?

**Self Protocol** provides zero-knowledge proof-based identity verification using passport NFC technology. This enables **human verification** for tiered pricing systems where verified humans pay significantly less than bots/agents.

**Key Features:**
- 🛂 **NFC Passport Verification** - Cryptographic proof of unique humanity
- 🔒 **Zero-Knowledge Proofs** - Privacy-preserving verification
- 🆔 **Nullifier System** - Prevents duplicate verifications (Sybil resistance)
- ⚡ **Fast** - 30-second verification via mobile app
- 🌍 **Global** - Supports passports from 100+ countries

### Use Case: 2000x Bot Deterrence

Enable dynamic pricing based on human verification:

```
Unverified (Bot):     $1.00 per request
Verified Human:       $0.0005 per request (2000x cheaper)
```

### Service Discovery with Verification

The `/.well-known/x402` endpoint includes verification options:

```json
{
  "payTo": "0x...",
  "payment": {
    "protocol": "x402 v1.0",
    "price": "$1.00",
    "network": "celo-sepolia"
  },

  "verification": {
    "required": false,
    "protocol": "Self Protocol",
    "description": "Verify as unique human",
    "price": "0.0005",

    "requirements": {
      "minimumAge": 18,
      "excludedCountries": ["IRN", "PRK", "RUS", "SYR"],
      "ofac": true,
      "documentTypes": ["Passport", "EU ID Card", "Aadhaar"]
    },

    "verify_endpoint": "/api/verify/qr",
    "docs": "https://docs.self.xyz"
  }
}
```

**Key Properties:**

- `required: false` - Allow bot pricing on verification failure (permissive mode)
- `required: true` - Block unverified requests with 403 (strict human-only mode)
- `price` - Human verification price (string without $ symbol, x402 standard)
- `requirements` - Verification requirements (age, countries, OFAC, documents)

### Verification Flow

```
1. User requests API endpoint
   └─> No X-Self-Proof header

2. Server returns 402 Payment Required
   └─> Price: $1.00 (bot pricing)
   └─> Includes verification options

3. User scans QR code with Self mobile app
   └─> App reads passport NFC
   └─> Generates zero-knowledge proof
   └─> Returns proof to browser

4. Browser stores proof in localStorage
   └─> Included automatically in future requests

5. User retries request with proof
   └─> X-Self-Proof: <base64-proof>
   └─> Server validates proof
   └─> Returns 402 with human pricing: $0.0005

6. User pays with x402
   └─> Signs $0.0005 payment
   └─> Gets resource (2000x cheaper!)
```

### Implementation Checklist

**Backend Setup:**
```bash
npm install @selfxyz/backend @selfxyz/core
```

**Frontend Setup:**
```bash
npm install @selfxyz/qrcode ethers
```

**Server-side Verification:**
```typescript
import { SelfBackendVerifier, DefaultConfigStore, AllIds } from "@selfxyz/backend";

const verifier = new SelfBackendVerifier(
  "your-scope",
  "https://api.yourapp.com/api/verify",
  false,  // mockPassport: false for mainnet
  AllIds,
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: ["IRN", "PRK", "RUS", "SYR"],
    ofac: true
  }),
  "hex"
);

// Validate proof
const result = await verifier.verify(attestationId, proof, publicSignals);
if (!result.valid) throw new Error("Invalid proof");

// Extract nullifier (unique user ID)
const nullifier = result.nullifier;

// Check if nullifier already used
if (await nullifierExists(nullifier)) {
  throw new Error("Verification already used");
}
```

**Frontend QR Generation:**
```typescript
import { SelfAppBuilder } from "@selfxyz/qrcode";
import { ethers } from "ethers";

const app = new SelfAppBuilder({
  version: 2,
  appName: "Your App",
  scope: "your-scope",  // Must match backend
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

// Use in React component
<SelfQRcodeWrapper
  selfApp={app}
  onSuccess={(data) => {
    const proof = btoa(`${data.proof}|${data.publicSignals}`);
    localStorage.setItem('self_proof', proof);
  }}
  onError={console.error}
/>
```

### Self Protocol Contracts

**Celo Mainnet:**
- IdentityVerificationHub: `0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF`
- Real passports, production use

**Celo Testnet (Sepolia):**
- MockPassportHub: `0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74`
- Mock passports for testing

### Nullifier System (Critical)

**Purpose:** Prevent same passport from being used multiple times (Sybil resistance)

**Implementation:**
```typescript
// Database schema
CREATE TABLE nullifiers (
  nullifier VARCHAR(66) PRIMARY KEY,
  resource_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(nullifier, resource_id)
);

// Check before accepting verification
async function checkNullifier(nullifier: string, resourceId: string) {
  const exists = await db.query(
    'SELECT 1 FROM nullifiers WHERE nullifier = $1 AND resource_id = $2',
    [nullifier, resourceId]
  );
  return exists.rows.length > 0;
}

// Store after successful verification
async function storeNullifier(nullifier: string, resourceId: string) {
  await db.query(
    'INSERT INTO nullifiers (nullifier, resource_id) VALUES ($1, $2)',
    [nullifier, resourceId]
  );
}
```

### Resources

- **Self Protocol Docs:** https://docs.self.xyz
- **Quickstart:** https://docs.self.xyz/use-self/quickstart
- **Backend SDK:** https://docs.self.xyz/backend-integration/basic-integration
- **Frontend SDK:** https://docs.self.xyz/frontend-integration/qrcode-sdk
- **Deployed Contracts:** https://docs.self.xyz/contract-integration/deployed-contracts

---

## Environment Configuration

### Dual Environment Support

The template supports both **testnet** (development) and **mainnet** (production) with automatic detection:

```env
# =============================================================================
# 🧪 TESTNET CONFIGURATION (Base Sepolia) - Default for Development
# =============================================================================
NODE_ENV=development
NETWORK=base-sepolia
FACILITATOR_URL=https://x402.org/facilitator
PAYMENT_WALLET_ADDRESS=0xYourWalletAddressHere
PAYMENT_PRICE_USD=0.001

# CDP API keys not required for testnet
CDP_API_KEY_ID=
CDP_API_KEY_SECRET=

# =============================================================================
# 🚀 MAINNET CONFIGURATION (Base) - For Production Deployment
# =============================================================================
# Uncomment and configure for production:
# NODE_ENV=production
# NETWORK=base
# CDP_API_KEY_ID=your_cdp_api_key_id
# CDP_API_KEY_SECRET=your_cdp_api_key_secret
```

### Automatic Network Detection

```typescript
// In src/config/x402.ts
const network = (process.env.NETWORK || "base-sepolia") as "base" | "base-sepolia";

// Automatic facilitator selection
const facilitatorConfig = network === "base"
  ? facilitator  // CDP facilitator for mainnet
  : { url: process.env.FACILITATOR_URL as Resource }; // URL for testnet
```

---

## Best Practices

### Security

1. **Environment Variables**
   - ✅ Never commit private keys or API secrets
   - ✅ Use `.env` files for local development
   - ✅ Use environment variables in production (Vercel, etc.)

2. **Wallet Security**
   - ✅ Use separate wallets for testnet and mainnet
   - ✅ Regularly rotate API keys
   - ✅ Monitor wallet balance and transaction history

3. **Input Validation**
   - ✅ Validate all request parameters
   - ✅ Use JSON schemas for type safety
   - ✅ Sanitize user inputs to prevent injection attacks

### Performance

1. **Caching**
   - ✅ Cache expensive operations
   - ✅ Use CDN for static resources
   - ✅ Implement rate limiting to prevent abuse

2. **Error Handling**
   - ✅ Return clear error messages
   - ✅ Log errors for debugging
   - ✅ Implement retry logic for transient failures

3. **Monitoring**
   - ✅ Track payment success rates
   - ✅ Monitor API response times
   - ✅ Set up alerts for failures

### Development Workflow

1. **Start with Testnet**
   - 🧪 Develop and test with Base Sepolia
   - 🧪 Use testnet USDC for free testing
   - 🧪 Validate payment flows thoroughly

2. **Test Production Setup**
   - 🚀 Get CDP API credentials
   - 🚀 Test with small amounts on mainnet
   - 🚀 Monitor initial transactions closely

3. **Deploy to Production**
   - 🚀 Update environment variables
   - 🚀 Enable Bazaar discovery
   - 🚀 Monitor and optimize

---

## Common Patterns

### Multi-Endpoint API

```typescript
const paymentRoutes = {
  "GET /api/search": {
    price: "$0.001",
    network: "base-sepolia",
    discoverable: isProduction,
    description: "Search resources",
    inputSchema: { /* ... */ },
    outputSchema: { /* ... */ }
  },

  "GET /api/resource/:id": {
    price: "$0.002",
    network: "base-sepolia",
    discoverable: isProduction,
    description: "Get resource by ID",
    inputSchema: { /* ... */ },
    outputSchema: { /* ... */ }
  },

  "POST /api/resource": {
    price: "$0.005",
    network: "base-sepolia",
    discoverable: isProduction,
    description: "Create or update resource",
    inputSchema: { /* ... */ },
    outputSchema: { /* ... */ }
  }
};
```

### Free vs Paid Endpoints

```typescript
// Free endpoints (no payment required)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/.well-known/x402', (req, res) => {
  res.json(serviceDiscovery);
});

// Paid endpoints (payment middleware applied)
app.get('/api/premium-data', async (req, res) => {
  // Payment verified by middleware
  const data = await getPremiumData();
  res.json(data);
});
```

### Dynamic Pricing

```typescript
const paymentRoutes = {
  "GET /api/basic": {
    price: "$0.001",
    network: "base-sepolia"
  },

  "GET /api/advanced": {
    price: "$0.01",  // 10x more expensive
    network: "base-sepolia"
  },

  "GET /api/premium": {
    price: "$0.10",  // 100x more expensive
    network: "base-sepolia"
  }
};
```

---

## Testing

### Local Development Testing

1. **Start the server**
   ```bash
   npm run dev
   ```

2. **Test free endpoints**
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3000/.well-known/x402
   ```

3. **Test paid endpoints** (using x402 client)
   ```typescript
   // See test files in /tests directory
   PRIVATE_KEY=0x... SERVER_URL=http://localhost:3000 npm run test:x402-axios
   ```

### Production Testing

1. **Deploy to staging**
   ```bash
   vercel --env production
   ```

2. **Verify Bazaar discovery**
   ```bash
   curl https://your-api.vercel.app/.well-known/x402
   ```

3. **Test with real payments** (small amounts first)
   ```bash
   PRIVATE_KEY=0x... SERVER_URL=https://your-api.vercel.app npm run test:production
   ```

---

## Troubleshooting

### Common Issues

#### 1. Payment Verification Fails

**Symptoms**: 402 errors persist even with valid payment

**Solutions**:
- ✅ Verify wallet has sufficient USDC balance
- ✅ Check network matches (base-sepolia vs base)
- ✅ Confirm facilitator URL is correct
- ✅ Validate CDP API keys (mainnet only)

#### 2. Facilitator Configuration Error

**Symptoms**: TypeScript errors, payment verification fails, incorrect middleware setup

**Common Mistakes and Solutions**:

##### ❌ Wrong: Renaming the facilitator import
```typescript
import { facilitator as cdpFacilitator } from "@coinbase/x402";

app.use(paymentMiddleware(payTo, routes, cdpFacilitator));
```

##### ✅ Correct: Use `facilitator` directly
```typescript
import { facilitator } from "@coinbase/x402";

app.use(paymentMiddleware(payTo, routes, facilitator));
```

##### ❌ Wrong: Using URL string directly without object wrapper
```typescript
app.use(paymentMiddleware(
  payTo,
  routes,
  "https://x402.org/facilitator"  // ❌ String, not object
));
```

##### ✅ Correct: Wrap URL in object with Resource type
```typescript
import { type Resource } from "x402-express";

app.use(paymentMiddleware(
  payTo,
  routes,
  { url: "https://x402.org/facilitator" as Resource }  // ✅ Object with Resource type
));
```

##### ❌ Wrong: Mixing patterns incorrectly
```typescript
// Using CDP facilitator without proper imports
app.use(paymentMiddleware(
  payTo,
  routes,
  { facilitator }  // ❌ Wrong - wrapping object in object
));
```

##### ✅ Correct: Two distinct patterns
```typescript
// Method 1: CDP Object (Production)
import { facilitator } from "@coinbase/x402";
app.use(paymentMiddleware(payTo, routes, facilitator));

// Method 2: URL Object (Testnet)
import { type Resource } from "x402-express";
app.use(paymentMiddleware(payTo, routes, { url: facilitatorUrl as Resource }));
```

**Quick Reference:**

```typescript
// 🚀 PRODUCTION (Base Mainnet)
import { facilitator } from "@coinbase/x402";
// Third parameter: facilitator (object)

// 🧪 TESTNET (Base Sepolia)
import { type Resource } from "x402-express";
// Third parameter: { url: "..." as Resource } (object with url property)
```

#### 3. Discovery Not Working

**Symptoms**: Service not appearing in Bazaar

**Solutions**:
- ✅ Ensure `NODE_ENV=production` or `VERCEL=1`
- ✅ Verify `discoverable: true` in route config
- ✅ Confirm using CDP facilitator (required for Bazaar)
- ✅ Check `.well-known/x402` endpoint is accessible

#### 4. Network Mismatch

**Symptoms**: Transactions failing on wrong network

**Solution**:
```typescript
// Ensure consistent network configuration
const network = process.env.NETWORK as "base" | "base-sepolia";

// Use environment variable everywhere
{
  price: "$0.001",
  network: network  // Don't hardcode
}
```

---

## Resources

### Official Documentation
- [X402 Welcome](https://docs.cdp.coinbase.com/x402/welcome)
- [Quickstart for Sellers](https://docs.cdp.coinbase.com/x402/quickstart-for-sellers)
- [Quickstart for Buyers](https://docs.cdp.coinbase.com/x402/quickstart-for-buyers)
- [Bazaar Discovery](https://docs.cdp.coinbase.com/x402/bazaar)
- [Core Concepts](https://docs.cdp.coinbase.com/x402/core-concepts/how-it-works)
- [Network Support](https://docs.cdp.coinbase.com/x402/network-support)

### Code Examples
- [Express.js Implementation](https://docs.cdp.coinbase.com/x402/quickstart-for-sellers#express-2)
- [Client Libraries](https://docs.cdp.coinbase.com/x402/quickstart-for-buyers)

### Community
- [CDP Developer Platform](https://portal.cdp.coinbase.com/)
- [X402 GitHub](https://github.com/coinbase/x402)

---

## Official Code Examples Reference

The X402 protocol has official TypeScript examples at `/x402Codeexamples/examples/typescript/` that demonstrate various implementation patterns:

### Server Examples

#### 1. Basic Express Server (Testnet)
**Location**: `servers/express/index.ts`

```typescript
import { config } from "dotenv";
import express from "express";
import { paymentMiddleware, Resource } from "x402-express";

const facilitatorUrl = process.env.FACILITATOR_URL as Resource;
const payTo = process.env.ADDRESS as `0x${string}`;

const app = express();

app.use(
  paymentMiddleware(
    payTo,
    {
      "GET /weather": {
        price: "$0.001",
        network: "base-sepolia",
      }
    },
    { url: facilitatorUrl }  // URL-based facilitator for testnet
  )
);

app.get("/weather", (req, res) => {
  res.send({ report: { weather: "sunny", temperature: 70 } });
});

app.listen(4021);
```

**Key Pattern**: Uses `{ url: facilitatorUrl }` object for testnet

#### 2. Mainnet Server with CDP Facilitator
**Location**: `servers/mainnet/index.ts`

```typescript
import express from "express";
import { paymentMiddleware } from "x402-express";
import { facilitator } from "@coinbase/x402";  // ← CDP facilitator object

const app = express();

app.use(
  paymentMiddleware(
    process.env.ADDRESS as `0x${string}`,
    {
      "GET /weather": {
        price: "$0.001",
        network: "base",  // Mainnet
      }
    },
    facilitator  // ← Direct object reference (no wrapper)
  )
);
```

**Key Pattern**: Imports and uses `facilitator` object directly for mainnet

#### 3. Advanced Server with Custom Logic
**Location**: `servers/advanced/index.ts`

**Features**:
- **Delayed Settlement**: Return data immediately, settle payment asynchronously
- **Dynamic Pricing**: Adjust prices based on query parameters or external factors
- **Multiple Payment Requirements**: Accept different tokens or networks

**Dynamic Pricing Example**:
```typescript
app.get("/dynamic-price", async (req, res) => {
  const multiplier = parseInt(req.query.multiplier ?? "1");
  const price = 0.001 * multiplier;  // Dynamic pricing

  const resource = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
  const paymentRequirements = [
    createExactPaymentRequirements(price, "base-sepolia", resource)
  ];

  const isValid = await verifyPayment(req, res, paymentRequirements);
  if (!isValid) return;

  const settleResponse = await settle(decodedPayment, paymentRequirements[0]);
  res.setHeader("X-PAYMENT-RESPONSE", settleResponseHeader(settleResponse));
  res.json({ report: { weather: "sunny", temperature: 70 } });
});
```

**Delayed Settlement Example**:
```typescript
app.get("/delayed-settlement", async (req, res) => {
  const isValid = await verifyPayment(req, res, paymentRequirements);
  if (!isValid) return;

  // Return data immediately (fast user experience)
  res.json({ report: { weather: "sunny", temperature: 70 } });

  // Process payment asynchronously (in background)
  settle(decodedPayment, paymentRequirements[0])
    .then(settleResponse => {
      console.log("Payment settled:", settleResponseHeader(settleResponse));
    })
    .catch(error => {
      console.error("Payment settlement failed:", error);
      // Handle failed payment (retry, notify, etc.)
    });
});
```

### Client Examples

#### 1. Axios Client with Payment Interceptor
**Location**: `clients/axios/index.ts`

```typescript
import axios from "axios";
import { withPaymentInterceptor, createSigner, decodeXPaymentResponse } from "x402-axios";

async function main() {
  // Create signer for network
  const signer = await createSigner("base-sepolia", privateKey);

  // Wrap axios with payment interceptor
  const api = withPaymentInterceptor(
    axios.create({ baseURL: "https://api.example.com" }),
    signer
  );

  // Make request - payment handled automatically
  const response = await api.get("/weather");
  console.log(response.data);

  // Decode payment response
  const paymentResponse = decodeXPaymentResponse(
    response.headers["x-payment-response"]
  );
  console.log(paymentResponse);
}
```

**Key Features**:
- `withPaymentInterceptor` automatically handles 402 responses
- `createSigner` creates network-specific signer
- `decodeXPaymentResponse` extracts payment settlement details

#### 2. Fetch Client with Payment Support
**Location**: `clients/fetch/index.ts`

Similar pattern using native `fetch` API with payment support

#### 3. CDP SDK Client
**Location**: `clients/cdp-sdk/index.ts`

Uses Coinbase Developer Platform SDK for wallet management

### Key Patterns from Official Examples

#### Pattern 1: Testnet vs Mainnet Facilitator

```typescript
// ❌ Don't mix patterns
const facilitator = process.env.NETWORK === "base"
  ? { facilitator: facilitatorFromCDP }  // Wrong
  : { url: facilitatorUrl };

// ✅ Correct - Two different object types
import { facilitator } from "@coinbase/x402";

const facilitatorConfig = process.env.NETWORK === "base"
  ? facilitator  // CDP object (mainnet)
  : { url: facilitatorUrl as Resource };  // URL object (testnet)
```

#### Pattern 2: Resource URL Construction

```typescript
// Best practice - construct full resource URL
const resource = `${req.protocol}://${req.headers.host}${req.originalUrl}` as Resource;
```

#### Pattern 3: Payment Verification Flow

```typescript
// 1. Check for X-PAYMENT header
const payment = req.header("X-PAYMENT");
if (!payment) {
  return res.status(402).json({
    x402Version: 1,
    error: "X-PAYMENT header is required",
    accepts: paymentRequirements
  });
}

// 2. Decode payment
const decodedPayment = exact.evm.decodePayment(payment);

// 3. Verify payment
const response = await verify(decodedPayment, paymentRequirement);
if (!response.isValid) {
  return res.status(402).json({
    x402Version: 1,
    error: response.invalidReason,
    accepts: paymentRequirements,
    payer: response.payer
  });
}

// 4. Settle payment (sync or async)
const settleResponse = await settle(decodedPayment, paymentRequirement);

// 5. Return resource with settlement proof
res.setHeader("X-PAYMENT-RESPONSE", settleResponseHeader(settleResponse));
res.json({ data: "your resource" });
```

#### Pattern 4: Environment Detection

```typescript
// Official pattern
const facilitatorUrl = process.env.FACILITATOR_URL as Resource;
const payTo = process.env.ADDRESS as `0x${string}`;

if (!facilitatorUrl || !payTo) {
  console.error("Missing required environment variables");
  process.exit(1);
}

// Mainnet requires additional checks
if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
  console.error("Missing CDP API credentials for mainnet");
  process.exit(1);
}
```

### Template Alignment

Our `/Template-x402-Api` follows all official patterns:

✅ **Correct facilitator patterns** (CDP object for mainnet, URL object for testnet)
✅ **Environment-based network detection** (.env configuration)
✅ **Multi-endpoint support** with rich metadata
✅ **Production-only discovery** for Bazaar
✅ **TypeScript type safety** with proper type casting
✅ **Comprehensive error handling** with 402 responses
✅ **Payment verification flow** matches official implementation

**Additional Features in Template**:
- 🎯 Service discovery metadata (`.well-known/x402`)
- 📊 JSON schemas for input/output validation
- 🤖 AI agent-friendly descriptions and examples
- 🔄 Automatic network switching
- 📝 Comprehensive documentation (README, CUSTOMIZATION_GUIDE, CLAUDE.md)

---

## Template Structure

This template (`/Template-x402-Api`) provides:

```
Template-x402-Api/
├── src/
│   ├── server.ts           # Main Express server with X402 middleware
│   ├── config/
│   │   └── x402.ts         # Multi-endpoint configuration and discovery
│   └── types/
│       └── index.ts        # TypeScript type definitions
├── lib/custom/services/
│   └── your-service.ts     # Service implementation template
├── tests/                  # Test examples for X402 clients
├── .env.example            # Dual environment configuration
├── package.json            # Dependencies and scripts
├── README.md               # Usage documentation
├── CUSTOMIZATION_GUIDE.md  # Detailed customization instructions
└── CLAUDE.md               # This file - AI development guide
```

### Key Files

#### `src/config/x402.ts`
- Multi-endpoint payment route definitions
- Rich discovery metadata for Bazaar
- Production-only discovery flag
- Comprehensive JSON schemas

#### `src/server.ts`
- Express server with X402 middleware
- Automatic facilitator selection (mainnet vs testnet)
- Example protected endpoints
- Free endpoints (health, discovery, info)

#### `.env.example`
- Clear testnet/mainnet separation
- Detailed setup instructions
- Environment variable documentation

---

## AI Agent Guidance

### When Implementing X402 APIs

1. **Always use this template** as the starting point
2. **Follow the dual environment pattern** (testnet for dev, mainnet for prod)
3. **Include rich metadata** in discovery for AI agent discoverability
4. **Use correct facilitator pattern**:
   - Mainnet: `facilitator` from `@coinbase/x402`
   - Testnet: `{ url: facilitatorUrl as Resource }`
5. **Implement comprehensive input/output schemas** for type safety
6. **Enable production-only discovery** to prevent test endpoints in Bazaar

### When Modifying the Template

1. **Customize `/lib/custom/services/your-service.ts`** with your business logic
2. **Update endpoint definitions** in `src/config/x402.ts`
3. **Add endpoint handlers** in `src/server.ts`
4. **Update environment variables** in `.env`
5. **Test thoroughly** on testnet before mainnet deployment

### When Troubleshooting

1. **Check network configuration** first (base vs base-sepolia)
2. **Verify facilitator setup** matches network
3. **Validate wallet has USDC** on correct network
4. **Review logs** for payment verification errors
5. **Test discovery endpoint** (`/.well-known/x402`)

---

## FAQ - Frequently Asked Questions

### General Questions

#### What is X402?
X402 is an open-source protocol that enables the HTTP `402 Payment Required` status code for programmatic micropayments over HTTP. It allows APIs and content providers to charge for access directly, enabling machine-to-machine commerce.

#### Is X402 only for crypto projects?
No. Any web API or content provider (crypto or Web2) can integrate X402 for low-cost, friction-free payment options for small or usage-based transactions.

#### What are the transaction costs?
- **Transaction fees**: None (gasless payments via EIP-3009)
- **Facilitator fees**: Free when using CDP facilitator
- **Network fees**: Settlement costs are handled by the facilitator
- **Cost to clients**: Only the API price you set (e.g., $0.001 per request)

#### How fast are payments?
- **Payment verification**: Instant (signature validation)
- **Settlement**: ~1 second on Base network
- **Client experience**: Single HTTP request with automatic retry

### Technical Questions

#### What networks and tokens are supported?
- **Networks**: Base (mainnet), Base Sepolia (testnet)
- **Tokens**: USDC (must implement EIP-3009 `transferWithAuthorization`)
- **Upcoming**: Additional L2 networks, potential Solana support
- **Custom**: Any EVM network via self-hosted facilitators

#### Can I use languages other than TypeScript?
Yes! Reference implementations exist in:
- **TypeScript/JavaScript**: `x402-express`, `x402-axios`, `x402-fetch`
- **Python**: `x402-python`
- **Community**: Open to Go, Rust implementations

#### Do I need to run a blockchain node?
No. The facilitator handles all blockchain interactions:
- Payment verification
- Transaction settlement
- Blockchain monitoring

#### Can anyone run a facilitator?
Yes, the protocol is permissionless. However:
- On-chain signature checks prevent malicious behavior
- CDP facilitator is recommended for production (free, KYT/OFAC compliant)
- Custom facilitators useful for enterprise or alternative networks

### Payment Questions

#### Why do 402 errors occur?
Common causes:
1. **Invalid signature**: Check wallet configuration and private key
2. **Insufficient payment**: Verify payment amount matches endpoint price
3. **Insufficient USDC balance**: Ensure wallet has enough testnet/mainnet USDC
4. **Network mismatch**: Client network must match server network (base vs base-sepolia)
5. **KYT flags**: Transaction flagged by Know Your Transaction checks (mainnet only)

#### How do I handle payment failures gracefully?
```typescript
try {
  const response = await x402Client.get('/api/resource');
  return response.data;
} catch (error) {
  if (error.response?.status === 402) {
    // Payment required or payment failed
    console.error('Payment verification failed:', error.response.data);
    // Check wallet balance, network, signature
  }
  throw error;
}
```

#### Can I implement different pricing strategies?
Yes, X402 supports:
- **Flat per-call**: `"$0.001"` for all requests
- **Tiered pricing**: Different prices per endpoint
- **Dynamic pricing**: Update prices based on demand/usage
- **Future**: "Pay-up-to" usage-based pricing models

### Security Questions

#### How secure are X402 payments?
- **Cryptographic signatures**: EIP-712 typed data signatures
- **On-chain validation**: Facilitator verifies signatures against blockchain
- **No custody**: Payments go directly to your wallet, facilitator doesn't hold funds
- **KYT/OFAC**: Mainnet CDP facilitator includes compliance checks
- **Non-repudiation**: All payments are cryptographically provable

#### What happens if a facilitator is malicious?
- On-chain signature validation prevents unauthorized payments
- Facilitator cannot create payments without valid wallet signatures
- Worst case: Facilitator could delay/drop transactions, but cannot steal funds

#### How do I protect against replay attacks?
EIP-3009 `transferWithAuthorization` includes:
- **Nonce**: Prevents transaction replay
- **Expiry**: Payment validity timeframe
- **Signature**: Binds payment to specific transaction

### Development Questions

#### How do I test without spending real money?
1. Use **Base Sepolia testnet** (free testnet USDC)
2. Get testnet USDC from Base Sepolia faucet
3. Use x402.org facilitator (no CDP keys needed)
4. Test full payment flow with $0 cost

#### How do I transition from testnet to mainnet?
1. Update `.env`: `NETWORK=base`
2. Add CDP API credentials: `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`
3. Ensure wallet has mainnet USDC
4. Deploy to production environment
5. Verify `NODE_ENV=production` or `VERCEL=1`
6. Test with small amounts first

#### Can AI agents use X402 APIs automatically?
Yes! AI agents can:
1. **Discover** services via Bazaar (`/.well-known/x402`)
2. **Read** input/output schemas to understand API usage
3. **Pay** automatically using wallet integration
4. **Use** APIs without pre-configuration

This is a primary design goal of X402 - enabling autonomous commerce for AI agents.

---

## MCP Server Integration with X402

### What is MCP?

**MCP (Model Context Protocol)** is a standard protocol for connecting AI models (like Claude) to external tools and data sources. Combining MCP with X402 enables AI agents to autonomously discover and pay for API services.

### Why Combine MCP + X402?

- 🤖 **Autonomous AI agents** can discover, pay for, and use APIs independently
- 💳 **Programmatic payments** without manual API key management
- 🔍 **Dynamic service discovery** via Bazaar for flexible integration
- 🚀 **No pre-configuration** needed for AI to use new services

### Building an MCP Server with X402

#### Prerequisites

```bash
# Required
- Node.js v20+
- Claude Desktop with MCP support
- Wallet with USDC (testnet or mainnet)
```

#### Installation

```bash
npm install @modelcontextprotocol/sdk axios viem x402-axios dotenv
```

#### Basic MCP Server Implementation

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { wrapAxiosWithPayment } from "x402-axios";

// Setup wallet
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http()
});

// Wrap axios with X402 payment support
const axiosInstance = axios.create();
const x402Client = wrapAxiosWithPayment(axiosInstance, walletClient);

// Create MCP server
const server = new McpServer({
  name: "x402-mcp-client",
  version: "1.0.0"
});

// Define tool that uses X402-protected API
server.tool(
  "get-resource",
  "Fetch data from X402-protected API",
  {
    query: {
      type: "string",
      description: "Search query parameter"
    }
  },
  async ({ query }) => {
    try {
      // Automatic payment handling
      const response = await x402Client.get(
        `${process.env.RESOURCE_SERVER_URL}/api/search`,
        { params: { query } }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Start server
const transport = new StdioServerTransport();
server.connect(transport);
```

#### Configuration (.env)

```env
# Wallet Configuration
PRIVATE_KEY=0xYourPrivateKey

# X402 API Configuration
RESOURCE_SERVER_URL=https://your-x402-api.vercel.app
ENDPOINT_PATH=/api/resource

# Network (matches API network)
NETWORK=base-sepolia
```

#### Claude Desktop Integration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "x402-client": {
      "command": "node",
      "args": ["/path/to/your/mcp-server.js"],
      "env": {
        "PRIVATE_KEY": "0xYourPrivateKey",
        "RESOURCE_SERVER_URL": "https://your-api.vercel.app",
        "ENDPOINT_PATH": "/api/search"
      }
    }
  }
}
```

### MCP + X402 Architecture

```
Claude AI Agent
     |
     | (MCP Protocol)
     ↓
MCP Server (Your Code)
     |
     | (X402 Payment + HTTP)
     ↓
X402 API Server
     |
     | (Payment Verification)
     ↓
CDP Facilitator
     |
     | (Settlement)
     ↓
Base Blockchain
```

### Advanced MCP Features

#### 1. Service Discovery Tool

```typescript
server.tool(
  "discover-x402-services",
  "Discover available X402 APIs from Bazaar",
  {},
  async () => {
    const response = await axios.get(
      "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources"
    );

    return {
      content: [
        {
          type: "text",
          text: `Found ${response.data.resources.length} services:\n` +
                response.data.resources.map(r =>
                  `- ${r.resource}: ${r.accepts[0].maxAmountRequired}`
                ).join('\n')
        }
      ]
    };
  }
);
```

#### 2. Multi-Endpoint Support

```typescript
server.tool(
  "call-any-endpoint",
  "Call any X402 endpoint dynamically",
  {
    url: { type: "string", description: "Full endpoint URL" },
    method: { type: "string", description: "HTTP method (GET/POST)" },
    data: { type: "object", description: "Request body (POST only)" }
  },
  async ({ url, method, data }) => {
    const response = method === "GET"
      ? await x402Client.get(url)
      : await x402Client.post(url, data);

    return {
      content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
    };
  }
);
```

#### 3. Payment History Tracking

```typescript
const paymentHistory = [];

// Wrap axios to track payments
x402Client.interceptors.response.use(response => {
  if (response.headers['x-payment-response']) {
    paymentHistory.push({
      url: response.config.url,
      timestamp: new Date().toISOString(),
      amount: response.config.headers['x-payment']
    });
  }
  return response;
});

server.tool(
  "get-payment-history",
  "View X402 payment history",
  {},
  async () => {
    return {
      content: [{
        type: "text",
        text: JSON.stringify(paymentHistory, null, 2)
      }]
    };
  }
);
```

### MCP Best Practices

1. **Error Handling**: Wrap all API calls in try/catch
2. **Wallet Security**: Never hardcode private keys, use environment variables
3. **Balance Monitoring**: Check wallet balance periodically
4. **Rate Limiting**: Implement client-side rate limiting for cost control
5. **Caching**: Cache responses when appropriate to reduce costs
6. **Logging**: Log all payments for accounting and debugging

### Example Use Case: AI Research Assistant

```typescript
// AI agent workflow:
// 1. User asks: "Find me weather data for San Francisco"
// 2. MCP server receives request
// 3. Auto-discovers weather API via Bazaar
// 4. Reads API schema to understand parameters
// 5. Makes X402-protected request with payment
// 6. Returns data to user
// All automatic, no manual configuration!
```

---

## Summary for AI Agents

**X402 is a simple, powerful protocol for HTTP-based micropayments:**

- 💰 **Instant payments** over HTTP using USDC on Base network
- 🤖 **AI-first design** with machine-readable discovery via Bazaar
- 🔒 **Gasless transactions** using EIP-3009 `transferWithAuthorization`
- 🚀 **Easy integration** with Express middleware and client libraries
- 🌍 **Dual environment support** for seamless testnet → mainnet transition

**This template provides everything needed to create production-ready X402 APIs with:**
- ✅ Multiple discoverable endpoints
- ✅ Rich metadata for AI agents
- ✅ Production-only Bazaar discovery
- ✅ Automatic network detection
- ✅ Comprehensive documentation

**Start building paid APIs that AI agents can discover and use autonomously!** 🚀
