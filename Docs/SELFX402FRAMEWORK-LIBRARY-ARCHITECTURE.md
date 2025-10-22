# Selfx402Framework Library Architecture

**Purpose**: Reusable NPM package for creating x402 facilitator servers and Self Protocol validator servers with minimal code, inspired by thirdweb's SDK architecture.

**Goal**: Allow developers to create custom facilitators and validators in 5-10 lines of code instead of 600+ lines.

---

## Table of Contents

1. [Overview](#overview)
2. [Thirdweb SDK Pattern Analysis](#thirdweb-sdk-pattern-analysis)
3. [Library Architecture](#library-architecture)
4. [Core Abstractions](#core-abstractions)
5. [Package Structure](#package-structure)
6. [Developer Experience](#developer-experience)
7. [Migration Plan](#migration-plan)
8. [Implementation Roadmap](#implementation-roadmap)

---

## Overview

### Current State (Selfx402Facilitator - 662 lines)

**Manual Implementation**:
```typescript
// 662 lines of code in index.ts + services + config
import express from "express";
import { createWalletClient, http, recoverTypedDataAddress } from "viem";
import { SelfBackendVerifier, DefaultConfigStore, AllIds } from "@selfxyz/core";
import { DatabaseService } from "./services/DatabaseService.js";
import { SelfVerificationService } from "./services/SelfVerificationService.js";
// ... 600+ more lines
```

### Target State (Selfx402Framework - 10 lines)

**Framework-Based Implementation**:
```typescript
import { createFacilitator, createSelfValidator } from "@selfx402/framework";

const facilitator = createFacilitator({
  networks: ["celo", "celo-sepolia"],
  privateKey: process.env.CELO_MAINNET_PRIVATE_KEY,
  database: { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_KEY }
});

const validator = createSelfValidator({
  scope: "my-app",
  requirements: { minimumAge: 18, excludedCountries: ["IRN", "PRK"], ofac: true }
});

facilitator.listen(3005);
```

**Reduction**: 662 lines → 10 lines (98% code reduction)

---

## Thirdweb SDK Pattern Analysis

### Thirdweb's Architecture (from portal.thirdweb.com/payments/x402)

**1. Modular Package Structure**:
```typescript
import { facilitator, settlePayment } from "thirdweb/x402";
import { sepolia } from "thirdweb/chains";
import { privateKeyToAccount } from "thirdweb/wallets";
```

**Key Insights**:
- ✅ Separate packages: `thirdweb/x402`, `thirdweb/wallets`, `thirdweb/chains`
- ✅ Configuration-driven: Pass objects, not boilerplate
- ✅ Middleware pattern: `settlePayment()` wraps Express handlers
- ✅ Network abstraction: `sepolia` object contains all network details
- ✅ Developer-friendly: 5-10 lines instead of hundreds

**2. Facilitator Pattern**:
```typescript
const facilitatorConfig = facilitator({
  client,
  wallet,
  chain,
  routes: [
    { path: "/api/data", price: "0.001", method: "GET" }
  ]
});
```

**3. Middleware Integration**:
```typescript
app.use(settlePayment(facilitatorConfig));
```

**4. Client-Side Auto-Payment**:
```typescript
import { wrapFetchWithPayment } from "thirdweb/x402";

const response = await wrapFetchWithPayment(fetch)(
  "https://api.example.com/data",
  { wallet, client }
);
```

### Key Takeaways for Selfx402Framework

1. **Configuration over Code**: Developers configure, library implements
2. **Abstraction Layers**: Network → Wallet → Facilitator → Middleware
3. **Composable Architecture**: Mix and match components
4. **Framework Agnostic**: Works with Express, Hono, Fastify, etc.
5. **TypeScript First**: Strong types, IntelliSense support
6. **Minimal Dependencies**: Only essential packages

---

## Library Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                  @selfx402/framework                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Networks  │  │   Wallets    │  │   Self Protocol │   │
│  │   Config    │  │   Manager    │  │   Verifier      │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
│         │                 │                    │            │
│         └─────────────────┼────────────────────┘            │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │  Facilitator    │                        │
│                  │  Core Engine    │                        │
│                  └────────┬────────┘                        │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐        │
│  │   Verify    │  │   Settle    │  │  Database   │        │
│  │  Payments   │  │  Payments   │  │  Service    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│                  ┌────────────────┐                         │
│                  │   Middleware   │                         │
│                  │   Adapters     │                         │
│                  └────────────────┘                         │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐        │
│  │   Express   │  │    Hono     │  │   Fastify   │        │
│  │  Middleware │  │  Middleware │  │  Middleware │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Package Structure

```
@selfx402/framework
├── /core                 # Core facilitator engine
│   ├── facilitator.ts   # Main facilitator class
│   ├── verifier.ts      # Payment verification
│   ├── settler.ts       # On-chain settlement
│   └── types.ts         # Core TypeScript types
│
├── /networks            # Network configurations
│   ├── celo.ts         # Celo mainnet config
│   ├── celo-sepolia.ts # Celo testnet config
│   ├── base.ts         # Base mainnet (future)
│   └── index.ts        # Network registry
│
├── /self                # Self Protocol integration
│   ├── verifier.ts     # Self verification service
│   ├── database.ts     # Nullifier management
│   ├── types.ts        # Self-specific types
│   └── index.ts        # Self exports
│
├── /middleware          # Framework adapters
│   ├── express.ts      # Express middleware
│   ├── hono.ts         # Hono middleware (future)
│   ├── fastify.ts      # Fastify middleware (future)
│   └── index.ts        # Middleware exports
│
├── /wallets             # Wallet management
│   ├── wallet-client.ts # Viem wallet abstraction
│   ├── types.ts        # Wallet types
│   └── index.ts        # Wallet exports
│
├── /utils               # Utilities
│   ├── eip712.ts       # EIP-712 helpers
│   ├── validation.ts   # Input validation
│   └── logger.ts       # Logging utilities
│
├── index.ts             # Main package entry
├── package.json
├── tsconfig.json
└── README.md
```

---

## Core Abstractions

### 1. Network Configuration (`/networks`)

**Purpose**: Abstract blockchain network details

**Interface**:
```typescript
export interface NetworkConfig {
  chainId: number;
  name: string;
  usdcAddress: Address;
  usdcName: string;
  rpcUrl: string;
  blockExplorer: string;
  isTestnet: boolean;
}

export const networks = {
  celo: {
    chainId: 42220,
    name: "celo",
    usdcAddress: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    usdcName: "USDC",
    rpcUrl: "https://forno.celo.org",
    blockExplorer: "https://celoscan.io",
    isTestnet: false,
  },
  "celo-sepolia": {
    chainId: 11142220,
    name: "celo-sepolia",
    usdcAddress: "0x01C5C0122039549AD1493B8220cABEdD739BC44E",
    usdcName: "USDC",
    rpcUrl: "https://celo-sepolia.g.alchemy.com",
    blockExplorer: "https://celo-sepolia.blockscout.com",
    isTestnet: true,
  },
};

// Helper function
export function getNetworkConfig(networkName: string): NetworkConfig {
  const config = networks[networkName];
  if (!config) {
    throw new Error(`Unsupported network: ${networkName}`);
  }
  return config;
}
```

**Usage**:
```typescript
import { networks } from "@selfx402/framework/networks";

const config = networks.celo;
console.log(config.usdcAddress); // 0xcebA9300f2b948710d2653dD7B07f33A8B32118C
```

---

### 2. Wallet Client (`/wallets`)

**Purpose**: Abstract wallet creation and signing

**Interface**:
```typescript
export interface WalletConfig {
  privateKey: `0x${string}`;
  network: NetworkConfig;
  rpcUrl?: string;
}

export function createWalletClient(config: WalletConfig): WalletClient {
  const account = privateKeyToAccount(config.privateKey);
  const chain = networkToViemChain(config.network);
  const rpcUrl = config.rpcUrl || config.network.rpcUrl;

  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  }).extend(publicActions);
}
```

**Usage**:
```typescript
import { createWalletClient } from "@selfx402/framework/wallets";
import { networks } from "@selfx402/framework/networks";

const wallet = createWalletClient({
  privateKey: process.env.PRIVATE_KEY as `0x${string}`,
  network: networks.celo,
});
```

---

### 3. Self Protocol Verifier (`/self`)

**Purpose**: Verify zero-knowledge proofs with minimal setup

**Interface**:
```typescript
export interface SelfRequirements {
  scope: string;
  minimumAge?: number;
  excludedCountries?: string[];
  ofac?: boolean;
  endpoint?: string;
}

export interface SelfVerificationResult {
  valid: boolean;
  tier: 'verified_human' | 'unverified';
  nullifier?: string;
  error?: string;
  disclosedData?: {
    ageValid: boolean;
    nationality?: string;
    ofacValid?: boolean;
  };
}

export class SelfVerifier {
  constructor(
    requirements: SelfRequirements,
    database?: DatabaseService
  );

  async verify(
    proofHeader: string,
    attestationId: number,
    userContextData?: string
  ): Promise<SelfVerificationResult>;

  async cleanupExpiredNullifiers(): Promise<number>;
}
```

**Usage**:
```typescript
import { SelfVerifier, DatabaseService } from "@selfx402/framework/self";

const db = new DatabaseService({
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_KEY,
});

const verifier = new SelfVerifier(
  {
    scope: "my-app",
    minimumAge: 18,
    excludedCountries: ["IRN", "PRK"],
    ofac: true,
  },
  db
);

// Verify proof from X-Self-Proof header
const result = await verifier.verify(proofHeader, attestationId);
if (result.valid) {
  console.log(`Verified human! Nullifier: ${result.nullifier}`);
}
```

---

### 4. Facilitator Core (`/core`)

**Purpose**: Main facilitator engine for payment verification and settlement

**Interface**:
```typescript
export interface FacilitatorConfig {
  network: NetworkConfig | string;
  wallet: WalletClient | WalletConfig;
  selfVerifier?: SelfVerifier;
  enableSelfProtocol?: boolean;
}

export interface PaymentEnvelope {
  network: string;
  authorization: {
    from: string;
    to: string;
    value: string;
    validAfter: number;
    validBefore: number;
    nonce: string;
  };
  signature: string;
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
  recoveredAddress?: string;
}

export interface SettlementResult {
  success: boolean;
  transaction?: string;
  blockNumber?: number;
  explorer?: string;
  error?: string;
}

export class Facilitator {
  constructor(config: FacilitatorConfig);

  async verifyPayment(
    envelope: PaymentEnvelope,
    expectedTo: string,
    expectedValue: string
  ): Promise<VerificationResult>;

  async settlePayment(
    envelope: PaymentEnvelope
  ): Promise<SettlementResult>;

  async verifySelfProof(
    proofHeader: string,
    attestationId: number
  ): Promise<SelfVerificationResult>;
}
```

**Usage**:
```typescript
import { Facilitator } from "@selfx402/framework/core";
import { networks } from "@selfx402/framework/networks";
import { createWalletClient } from "@selfx402/framework/wallets";

const facilitator = new Facilitator({
  network: networks.celo,
  wallet: createWalletClient({
    privateKey: process.env.PRIVATE_KEY as `0x${string}`,
    network: networks.celo,
  }),
});

// Verify payment
const verification = await facilitator.verifyPayment(envelope, payTo, amount);

// Settle payment
const settlement = await facilitator.settlePayment(envelope);
```

---

### 5. Express Middleware (`/middleware/express`)

**Purpose**: Drop-in Express middleware for x402 payment verification

**Interface**:
```typescript
export interface MiddlewareConfig {
  facilitator: Facilitator;
  payTo: string;
  routes: Record<string, { price: string; network: string }>;
  enableSelfProtocol?: boolean;
  selfRequirements?: SelfRequirements;
}

export function x402Middleware(config: MiddlewareConfig): RequestHandler {
  return async (req, res, next) => {
    const route = `${req.method} ${req.path}`;
    const routeConfig = config.routes[route];

    if (!routeConfig) return next(); // Skip non-protected routes

    try {
      // Extract X-Payment header
      const paymentHeader = req.headers['x-payment'] as string;
      if (!paymentHeader) {
        return res.status(402).json({ error: 'Payment Required' });
      }

      const envelope: PaymentEnvelope = JSON.parse(paymentHeader);

      // Verify payment signature
      const verification = await config.facilitator.verifyPayment(
        envelope,
        config.payTo,
        routeConfig.price
      );

      if (!verification.valid) {
        return res.status(402).json({ error: 'Payment verification failed' });
      }

      // Settle payment on-chain
      const settlement = await config.facilitator.settlePayment(envelope);

      if (!settlement.success) {
        return res.status(402).json({ error: 'Payment settlement failed' });
      }

      // Optional: Verify Self Protocol proof
      if (config.enableSelfProtocol) {
        const selfProof = req.headers['x-self-proof'] as string;
        if (selfProof) {
          const selfResult = await config.facilitator.verifySelfProof(
            selfProof,
            1 // attestationId
          );
          (req as any).selfVerification = selfResult;
        }
      }

      // Attach settlement data to request
      (req as any).settlement = settlement;

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Payment processing failed' });
    }
  };
}
```

**Usage**:
```typescript
import express from "express";
import { x402Middleware } from "@selfx402/framework/middleware/express";
import { Facilitator } from "@selfx402/framework/core";
import { networks } from "@selfx402/framework/networks";

const app = express();

const facilitator = new Facilitator({
  network: networks.celo,
  wallet: { privateKey: process.env.PRIVATE_KEY as `0x${string}` },
});

app.use(
  x402Middleware({
    facilitator,
    payTo: "0xYourWalletAddress",
    routes: {
      "GET /api/data": { price: "0.001", network: "celo" },
      "POST /api/submit": { price: "0.002", network: "celo" },
    },
  })
);

app.get("/api/data", (req, res) => {
  const settlement = (req as any).settlement;
  res.json({ data: "...", settlement });
});

app.listen(3000);
```

---

### 6. High-Level Factory Functions

**Purpose**: Simplest API for common use cases

**Interface**:
```typescript
export interface CreateFacilitatorOptions {
  networks: string[] | NetworkConfig[];
  privateKey: `0x${string}`;
  database?: { url: string; key: string };
  selfProtocol?: {
    scope: string;
    minimumAge?: number;
    excludedCountries?: string[];
    ofac?: boolean;
  };
}

export function createFacilitator(
  options: CreateFacilitatorOptions
): Express {
  // Create Express app with all middleware pre-configured
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Setup facilitator for each network
  options.networks.forEach((network) => {
    const networkConfig =
      typeof network === "string" ? networks[network] : network;

    const wallet = createWalletClient({
      privateKey: options.privateKey,
      network: networkConfig,
    });

    const facilitator = new Facilitator({ network: networkConfig, wallet });

    // Add endpoints
    app.post("/verify", async (req, res) => {
      const result = await facilitator.verifyPayment(req.body);
      res.json(result);
    });

    app.post("/settle", async (req, res) => {
      const result = await facilitator.settlePayment(req.body);
      res.json(result);
    });
  });

  // Optional: Self Protocol endpoints
  if (options.selfProtocol && options.database) {
    const db = new DatabaseService(options.database);
    const verifier = new SelfVerifier(options.selfProtocol, db);

    app.post("/verify-self", async (req, res) => {
      const result = await verifier.verify(
        req.body.proof,
        req.body.attestationId
      );
      res.json(result);
    });
  }

  app.get("/health", (req, res) => {
    res.json({ status: "healthy" });
  });

  return app;
}
```

**Usage (Simplest API)**:
```typescript
import { createFacilitator } from "@selfx402/framework";

const app = createFacilitator({
  networks: ["celo", "celo-sepolia"],
  privateKey: process.env.PRIVATE_KEY as `0x${string}`,
  database: {
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_KEY!,
  },
  selfProtocol: {
    scope: "my-app",
    minimumAge: 18,
    excludedCountries: ["IRN", "PRK"],
    ofac: true,
  },
});

app.listen(3005, () => {
  console.log("Facilitator running on port 3005");
});
```

---

## Developer Experience

### Installation

```bash
npm install @selfx402/framework viem
```

### Quick Start Examples

#### 1. Minimal Facilitator (x402 Only)

```typescript
import { createFacilitator } from "@selfx402/framework";

createFacilitator({
  networks: ["celo"],
  privateKey: process.env.PRIVATE_KEY as `0x${string}`,
}).listen(3005);
```

#### 2. Facilitator with Self Protocol

```typescript
import { createFacilitator } from "@selfx402/framework";

createFacilitator({
  networks: ["celo"],
  privateKey: process.env.PRIVATE_KEY as `0x${string}`,
  database: {
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_KEY!,
  },
  selfProtocol: {
    scope: "my-app",
    minimumAge: 18,
    excludedCountries: ["IRN", "PRK"],
    ofac: true,
  },
}).listen(3005);
```

#### 3. Custom Express Integration

```typescript
import express from "express";
import { Facilitator, x402Middleware } from "@selfx402/framework";
import { networks } from "@selfx402/framework/networks";

const app = express();

const facilitator = new Facilitator({
  network: networks.celo,
  wallet: { privateKey: process.env.PRIVATE_KEY as `0x${string}` },
});

app.use(
  x402Middleware({
    facilitator,
    payTo: "0xYourAddress",
    routes: {
      "GET /api/data": { price: "0.001", network: "celo" },
    },
  })
);

app.get("/api/data", (req, res) => {
  res.json({ data: "Protected data!", settlement: (req as any).settlement });
});

app.listen(3000);
```

#### 4. Advanced: Custom Network

```typescript
import { createFacilitator, NetworkConfig } from "@selfx402/framework";

const myCustomNetwork: NetworkConfig = {
  chainId: 12345,
  name: "my-network",
  usdcAddress: "0x...",
  usdcName: "USDC",
  rpcUrl: "https://rpc.mynetwork.com",
  blockExplorer: "https://explorer.mynetwork.com",
  isTestnet: false,
};

createFacilitator({
  networks: [myCustomNetwork],
  privateKey: process.env.PRIVATE_KEY as `0x${string}`,
}).listen(3005);
```

---

## Migration Plan

### Phase 1: Extract Core (Week 1-2)

**Goal**: Create `/core`, `/networks`, `/wallets` packages

**Files to Extract**:
- `Selfx402Facilitator/index.ts` → `/core/facilitator.ts`
- `Selfx402Facilitator/config/networks.ts` → `/networks/index.ts`
- `Selfx402Facilitator/config/chains.ts` → `/networks/chains.ts`
- Wallet client logic → `/wallets/wallet-client.ts`

**Deliverables**:
- `@selfx402/framework` package scaffolding
- Core facilitator class with verify + settle methods
- Network configuration exports
- Wallet client abstractions

### Phase 2: Self Protocol Integration (Week 3)

**Goal**: Create `/self` package

**Files to Extract**:
- `Selfx402Facilitator/services/SelfVerificationService.ts` → `/self/verifier.ts`
- `Selfx402Facilitator/services/DatabaseService.ts` → `/self/database.ts`

**Deliverables**:
- `SelfVerifier` class with clean API
- `DatabaseService` with Supabase integration
- Optional database parameter (in-memory fallback)

### Phase 3: Middleware Adapters (Week 4)

**Goal**: Create `/middleware` package with Express support

**Deliverables**:
- Express middleware: `x402Middleware()`
- Request augmentation with `settlement` and `selfVerification` data
- Route-based payment configuration

### Phase 4: High-Level API (Week 5)

**Goal**: Create factory functions for simplest API

**Deliverables**:
- `createFacilitator()` function
- `createSelfValidator()` function
- Pre-configured Express app with all endpoints

### Phase 5: Documentation & Testing (Week 6)

**Deliverables**:
- Complete API documentation
- Usage examples for all patterns
- Unit tests for core logic
- Integration tests with real blockchain
- Migration guide from current facilitator

### Phase 6: Publish & Migration (Week 7)

**Deliverables**:
- Publish `@selfx402/framework@1.0.0` to NPM
- Migrate `Selfx402Facilitator` to use library
- Update documentation in all repos
- Announce release

---

## Implementation Roadmap

### Week 1-2: Core Extraction

**Tasks**:
1. Create `/Selfx402Framework` directory
2. Initialize NPM package with TypeScript, tsup bundler
3. Extract network configurations to `/networks`
4. Extract wallet client logic to `/wallets`
5. Create core `Facilitator` class with verify + settle methods
6. Add TypeScript type definitions

**Success Criteria**:
- Can verify payment signature
- Can settle payment on-chain
- Works with Celo mainnet and Sepolia

### Week 3: Self Protocol Integration

**Tasks**:
1. Extract `SelfVerificationService` to `/self/verifier.ts`
2. Extract `DatabaseService` to `/self/database.ts`
3. Add optional database parameter (in-memory fallback)
4. Create `SelfVerifier` class with clean API

**Success Criteria**:
- Can verify Self Protocol zero-knowledge proofs
- Nullifier deduplication works
- Database integration optional

### Week 4: Middleware Adapters

**Tasks**:
1. Create `/middleware/express.ts`
2. Implement `x402Middleware()` function
3. Add request augmentation (`settlement`, `selfVerification`)
4. Route-based configuration

**Success Criteria**:
- Express middleware verifies + settles payments
- Works with existing vendor APIs
- Clean error handling

### Week 5: High-Level API

**Tasks**:
1. Create `createFacilitator()` factory function
2. Create `createSelfValidator()` factory function
3. Pre-configure Express app with all endpoints
4. Add health check, supported networks endpoints

**Success Criteria**:
- Can create facilitator in 5-10 lines of code
- Works with minimal configuration
- Sensible defaults for common use cases

### Week 6: Documentation & Testing

**Tasks**:
1. Write comprehensive API documentation
2. Create usage examples (minimal, advanced, custom network)
3. Unit tests for all core logic
4. Integration tests with Celo testnet
5. Migration guide from current facilitator

**Success Criteria**:
- 100% API coverage in docs
- 80%+ code coverage in tests
- Clear migration path documented

### Week 7: Publish & Migration

**Tasks**:
1. Publish `@selfx402/framework@1.0.0` to NPM
2. Migrate `Selfx402Facilitator` to use library
3. Update `Places-x402-Api` to use new middleware
4. Update all documentation and README files
5. Create announcement blog post

**Success Criteria**:
- Package published on NPM
- All existing code migrated and working
- Documentation updated
- Community announcement

---

## Package Dependencies

### Core Dependencies

```json
{
  "dependencies": {
    "viem": "^2.21.54",
    "@selfxyz/core": "^1.0.8",
    "@supabase/supabase-js": "^2.76.0",
    "zod": "^3.24.1"
  },
  "peerDependencies": {
    "express": "^4.21.0" // Optional for middleware
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.5",
    "tsup": "^8.0.0",
    "typescript": "^5.7.3",
    "vitest": "^1.0.0"
  }
}
```

### Peer Dependencies Strategy

**Express is optional**:
- Users can use core classes without Express
- Middleware package requires Express as peer dependency
- Clear error if Express not installed when using middleware

---

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Build Configuration (tsup.config.ts)

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/networks/index.ts",
    "src/wallets/index.ts",
    "src/core/index.ts",
    "src/self/index.ts",
    "src/middleware/index.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
});
```

---

## Success Metrics

### Developer Experience
- ✅ 5-10 lines of code for basic facilitator
- ✅ <5 minutes from install to running server
- ✅ IntelliSense support for all APIs
- ✅ Clear error messages with actionable fixes

### Code Quality
- ✅ 80%+ test coverage
- ✅ 100% TypeScript strict mode
- ✅ Zero runtime dependencies (except viem, Self SDK, Supabase)
- ✅ Tree-shakeable exports

### Performance
- ✅ <100ms startup time
- ✅ <50ms per verification
- ✅ <2s per settlement (on-chain)
- ✅ Supports 100+ requests/second

### Adoption
- ✅ 10+ community-built facilitators in first month
- ✅ 100+ GitHub stars in first quarter
- ✅ Featured in Celo ecosystem blog

---

## Conclusion

**Selfx402Framework** will reduce facilitator implementation from 600+ lines to 5-10 lines, following thirdweb's proven SDK pattern. The modular architecture allows developers to use only what they need, from simple x402 payments to complex Self Protocol verification with tiered pricing.

**Next Steps**:
1. Create `/Selfx402Framework` directory
2. Initialize package structure
3. Begin Phase 1: Core extraction
4. Build and test incrementally
5. Migrate existing facilitator as validation
6. Publish to NPM and announce

**Timeline**: 7 weeks from start to NPM publication
**Impact**: Enable 100+ developers to build x402 facilitators with minimal effort
