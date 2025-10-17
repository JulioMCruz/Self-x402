import { config } from "dotenv";
import type { X402Config, PaymentRoute } from "../types/index.js";

config();

// Determine if we're in production environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

// Validate required environment variables
const requiredEnvVars = {
  PAYMENT_WALLET_ADDRESS: process.env.PAYMENT_WALLET_ADDRESS,
  FACILITATOR_URL: process.env.FACILITATOR_URL || "http://localhost:3005",
  NETWORK: process.env.NETWORK || "celo-sepolia",
  PAYMENT_PRICE_USD: process.env.PAYMENT_PRICE_USD || "0.001"
};

// Check for missing required variables
const missing = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
  console.error("Please check your .env file and ensure all required variables are set.");
  process.exit(1);
}

// Validate network - Only Celo networks supported with custom facilitator
const validNetworks = ["celo", "celo-sepolia"];
if (!validNetworks.includes(requiredEnvVars.NETWORK!)) {
  console.error(`❌ Invalid network: ${requiredEnvVars.NETWORK}`);
  console.error(`Valid Celo networks: ${validNetworks.join(", ")}`);
  console.error(`💡 This API uses a custom CeloFacilitator (independent of CDP platform)`);
  process.exit(1);
}

// Export X402 configuration
export const x402Config: X402Config = {
  payTo: requiredEnvVars.PAYMENT_WALLET_ADDRESS! as `0x${string}`,
  facilitatorUrl: requiredEnvVars.FACILITATOR_URL!,
  network: requiredEnvVars.NETWORK! as "base" | "base-sepolia" | "celo" | "celo-sepolia",
  priceUsd: requiredEnvVars.PAYMENT_PRICE_USD!,
  bazaarDiscoverable: isProduction // Enable Bazaar discovery only in production
};

export const serverPort = parseInt(process.env.PORT || "3000", 10);

// X402 Payment Routes Configuration
export const paymentRoutes: Record<string, PaymentRoute> = {
  // Simple demo endpoint returning hardcoded data
  "GET /api/demo": {
    price: x402Config.priceUsd, // X402 standard: numeric string without $ symbol
    network: x402Config.network,
    discoverable: isProduction,
    description: "Demo endpoint that returns hardcoded Celo blockchain data after payment verification",
    tags: ["demo", "celo", "blockchain", "data"],

    inputSchema: {
      type: "object",
      description: "No input parameters required",
      properties: {},
      required: []
    },

    outputSchema: {
      type: "object",
      description: "Hardcoded Celo blockchain information",
      properties: {
        network: { type: "string", description: "Celo network name" },
        chainId: { type: "number", description: "Chain ID" },
        usdc: { type: "string", description: "USDC contract address" },
        stats: {
          type: "object",
          properties: {
            blockTime: { type: "string" },
            avgGasPrice: { type: "string" },
            totalTransactions: { type: "number" }
          }
        },
        metadata: {
          type: "object",
          properties: {
            cost: { type: "string" },
            protocol: { type: "string" },
            timestamp: { type: "string", format: "date-time" }
          }
        }
      }
    },

    examples: [
      {
        input: {},
        description: "Get hardcoded Celo network information"
      }
    ]
  }
};

// Service Discovery Configuration
export const serviceDiscovery = {
  // X402 Standard Required Fields
  payTo: x402Config.payTo,
  routes: paymentRoutes,

  // Extended Service Information
  service: "Celo X402 Demo API",
  version: "1.0.0",
  description: "Demo API showcasing X402 gasless micropayments on Celo blockchain using a custom facilitator (independent of CDP platform).",

  payment: {
    protocol: "x402 v1.0",
    price: `$${x402Config.priceUsd}`,
    network: x402Config.network,
    gasless: true,
    facilitator: x402Config.facilitatorUrl
  },

  // Self Protocol Verification (Tiered Pricing)
  verification: {
    required: false, // false = allow bot pricing on verification failure, true = block request
    protocol: "Self Protocol",
    description: "Verify as unique human",
    price: "0.0005",

    requirements: {
      minimumAge: 18,
      excludedCountries: ["IRN", "PRK", "RUS", "SYR"],
      ofac: true,
      documentTypes: ["Passport", "EU ID Card", "Aadhaar"]
    },

    verify_endpoint: "/api/verify/qr",
    docs: "https://docs.self.xyz"
  },

  capabilities: {
    features: ["X402 Micropayments", "Custom Facilitator", "Celo Network Support", "Self Protocol Verification", "Tiered Pricing"],
    data_sources: ["Hardcoded Demo Data"],
    real_time: true,
    supported_formats: ["json"],
    authentication: "x402-micropayment"
  },

  performance: {
    typical_response_time_ms: 50,
    rate_limit: "1000 requests/hour per wallet",
    cache_duration_seconds: 0,
    max_results_per_request: 1,
    uptime_percentage: 99.9
  },

  // Endpoint definitions with full schemas
  endpoints: Object.fromEntries(
    Object.entries(paymentRoutes).map(([route, config]) => {
      const [method, path] = route.split(' ');
      return [path, {
        method,
        description: config.description,
        payment_required: true,
        price: config.price,
        tags: config.tags,
        inputSchema: config.inputSchema,
        outputSchema: config.outputSchema,
        examples: config.examples
      }];
    })
  ),

  metadata: {
    created: "2025-01-06T00:00:00Z",
    updated: new Date().toISOString(),
    author: "Celo X402 Demo",
    license: "MIT",
    contact: {
      documentation: "See README.md",
      support: "Custom CeloFacilitator implementation"
    },
    compliance: {
      x402_version: "1.0",
      bazaar_compatible: true,
      custom_facilitator: true,
      cdp_independent: true
    }
  }
};

console.log(`✅ X402 Configuration loaded:`);
console.log(`   Network: ${x402Config.network}`);
console.log(`   Price: $${x402Config.priceUsd} per request`);
console.log(`   Facilitator: ${x402Config.facilitatorUrl}`);
console.log(`   PayTo: ${x402Config.payTo}`);
console.log(`   Discoverable: ${x402Config.bazaarDiscoverable} (${isProduction ? 'Production - Bazaar enabled' : 'Local dev - Bazaar disabled'})`);
console.log(`   Endpoints configured: ${Object.keys(paymentRoutes).length}`);
