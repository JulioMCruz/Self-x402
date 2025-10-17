import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "dotenv";
import { celoPaymentMiddleware } from "./middleware/celo-payment-middleware.js";
import { x402Config, paymentRoutes, serviceDiscovery } from "./config/x402.js";
import { YourService } from "../lib/custom/services/your-service.js";
import type { ErrorResponse } from "./types/index.js";

config();

const app = express();
const port = process.env.PORT || 3000;

// Trust proxy for correct protocol detection in production (Vercel)
app.set('trust proxy', true);

/**
 * X402-Compliant Express Server Template
 *
 * This template demonstrates:
 * - Multiple discoverable endpoints with rich metadata
 * - Production-only Bazaar discovery
 * - Comprehensive input/output schemas
 * - Mainnet and testnet support
 * - Gasless micropayments via X402 protocol
 */

// Initialize your custom service
const yourService = YourService.getInstance();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS middleware
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['X-Payment-Response'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Payment', 'X-Payment-Response']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log configuration
console.log('✅ X402 Configuration loaded:');
console.log(`   Network: ${x402Config.network}`);
console.log(`   Price: $${x402Config.priceUsd} per request`);
console.log(`   Facilitator: Custom CeloFacilitator (${x402Config.facilitatorUrl})`);
console.log(`   PayTo: ${x402Config.payTo}`);
console.log(`   Discoverable: ${x402Config.bazaarDiscoverable ? 'true (Production)' : 'false (Local dev - Bazaar disabled)'}`);
console.log(`   💡 Using independent facilitator - No CDP platform required!`);

// X402 Payment Middleware - Use custom Celo middleware for Celo network support
// This bypasses the standard x402-express middleware which only supports Base networks
const celoRoutes = Object.fromEntries(
  Object.entries(paymentRoutes).map(([route, config]) => [
    route,
    {
      price: config.price,
      network: config.network
    }
  ])
);

// Use custom CeloFacilitator (independent of CDP platform)
app.use(
  celoPaymentMiddleware({
    payTo: x402Config.payTo,
    facilitatorUrl: x402Config.facilitatorUrl,
    routes: celoRoutes
  })
);

// =============================================================================
// FREE ENDPOINTS (No payment required)
// =============================================================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: serviceDiscovery.version,
    service: serviceDiscovery.service,
    uptime: process.uptime(),
    x402: {
      enabled: true,
      network: x402Config.network,
      payTo: x402Config.payTo,
      price: `$${x402Config.priceUsd}`,
      facilitator: x402Config.network === 'base' ? 'CDP Official' : x402Config.facilitatorUrl
    }
  });
});

// Root endpoint with API information
app.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  res.json({
    name: serviceDiscovery.service,
    description: serviceDiscovery.description,
    version: serviceDiscovery.version,
    x402_protocol: "v1.0",

    payment_config: {
      network: x402Config.network,
      price_per_request: `$${x402Config.priceUsd}`,
      payment_address: x402Config.payTo,
      facilitator: x402Config.network === 'base' ? 'CDP Official (mainnet)' : x402Config.facilitatorUrl,
      gasless: true
    },

    endpoints: {
      public: {
        health: `${baseUrl}/health`,
        service_discovery: `${baseUrl}/.well-known/x402`,
        api_info: `${baseUrl}/api/info`
      },
      protected: Object.fromEntries(
        Object.entries(paymentRoutes).map(([route]) => {
          const [, path] = route.split(' ');
          const cleanPath = path.replace(/:(\w+)/g, '{$1}'); // Convert :id to {id}
          return [cleanPath, `${baseUrl}${cleanPath}`];
        })
      )
    },

    capabilities: serviceDiscovery.capabilities,

    documentation: {
      x402_standard: "https://eips.ethereum.org/EIPS/eip-712",
      service_docs: `${baseUrl}/api/info`,
      facilitator: x402Config.facilitatorUrl
    },

    usage: {
      note: "Protected endpoints require X402 payment header",
      examples: "See /.well-known/x402 for detailed API specifications",
      client_libraries: ["x402-axios", "x402-requests", "x402-fetch"]
    }
  });
});

// Service discovery endpoint (Bazaar compatible)
// This endpoint provides rich metadata for AI agents and developers
app.get('/.well-known/x402', (req, res) => {
  res.json(serviceDiscovery);
});

// API documentation endpoint
app.get('/api/info', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  res.json({
    name: serviceDiscovery.service,
    description: serviceDiscovery.description,
    version: serviceDiscovery.version,
    documentation: `${baseUrl}/.well-known/x402`,

    x402: {
      protocol_version: "1.0",
      network: x402Config.network,
      price_per_request: `$${x402Config.priceUsd}`,
      payment_address: x402Config.payTo,
      facilitator: x402Config.facilitatorUrl,
      gasless_payments: true
    },

    endpoints: serviceDiscovery.endpoints,

    capabilities: serviceDiscovery.capabilities,
    performance: serviceDiscovery.performance,

    getting_started: {
      step_1: "Install x402 client library: npm install x402-axios",
      step_2: "Set up your wallet with Base or Base Sepolia USDC",
      step_3: "Make requests with X-Payment header containing EIP-712 signature",
      step_4: "Server validates payment and returns data",
      example_code: "See documentation for language-specific examples"
    },

    support: {
      documentation: `${baseUrl}/.well-known/x402`,
      contact: serviceDiscovery.metadata.contact
    }
  });
});

// =============================================================================
// PROTECTED ENDPOINTS (Payment required via X402)
// =============================================================================

// Demo endpoint - Returns hardcoded Celo network data
app.get('/api/demo', (req, res) => {
  try {
    console.log('✅ Processing X402-verified and settled demo request');

    // Get settlement data from middleware
    const settlementData = (req as any).settlementData;

    // Hardcoded Celo network data
    const networkData = x402Config.network === 'celo-sepolia' ? {
      network: 'Celo Sepolia Testnet',
      chainId: 11142220,
      usdc: '0x01C5C0122039549AD1493B8220cABEdD739BC44E',
      rpc: 'https://celo-sepolia.g.alchemy.com',
      explorer: 'https://celo-sepolia.blockscout.com',
      faucet: 'https://faucet.celo.org',
      stats: {
        blockTime: '1 second',
        avgGasPrice: '~0.5 Gwei',
        totalTransactions: 1250000,
        dailyActiveUsers: 5000
      }
    } : {
      network: 'Celo Mainnet',
      chainId: 42220,
      usdc: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
      rpc: 'https://forno.celo.org',
      explorer: 'https://celoscan.io',
      stats: {
        blockTime: '1 second',
        avgGasPrice: '~0.5 Gwei',
        totalTransactions: 85000000,
        dailyActiveUsers: 50000
      }
    };

    res.json({
      ...networkData,
      metadata: {
        cost: `$${x402Config.priceUsd}`,
        protocol: 'x402 v1.0',
        network: x402Config.network,
        facilitator: 'Custom CeloFacilitator',
        timestamp: new Date().toISOString(),
        message: 'Payment verified and settled! This data was delivered using X402 gasless micropayments.',
        settlement: settlementData ? {
          transaction: settlementData.transaction,
          blockNumber: settlementData.blockNumber,
          explorer: settlementData.explorer,
          payer: settlementData.payer
        } : undefined
      }
    });

  } catch (error) {
    console.error('❌ Demo endpoint error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Demo endpoint failed',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      } as ErrorResponse);
    }
  }
});

// =============================================================================
// ERROR HANDLERS
// =============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    available_endpoints: {
      free: ['GET /health', 'GET /', 'GET /.well-known/x402', 'GET /api/info'],
      protected: Object.keys(paymentRoutes)
    }
  } as ErrorResponse);
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong',
    details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
  } as ErrorResponse);
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

// Start server (only in non-Vercel environments)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log('');
    console.log('🚀 X402-Compliant API Server Started');
    console.log(`📍 Server running at: http://localhost:${port}`);
    console.log(`🔧 Network: ${x402Config.network}`);
    console.log(`💰 Price: $${x402Config.priceUsd} per request`);
    console.log(`🏦 Facilitator: ${x402Config.network === 'base' ? 'CDP Official (mainnet)' : x402Config.facilitatorUrl}`);
    console.log(`✅ X402 Compliance: Enabled with transferWithAuthorization`);
    console.log(`🔍 Bazaar Discovery: ${x402Config.bazaarDiscoverable ? 'Enabled' : 'Disabled (local dev)'}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  GET  http://localhost:${port}/health`);
    console.log(`  GET  http://localhost:${port}/`);
    console.log(`  GET  http://localhost:${port}/.well-known/x402`);
    console.log(`  GET  http://localhost:${port}/api/info`);
    console.log('');
    console.log('Protected endpoints (require X402 payment):');
    Object.entries(paymentRoutes).forEach(([route]) => {
      const [method, path] = route.split(' ');
      console.log(`  ${method.padEnd(4)} http://localhost:${port}${path}`);
    });
  });
}

// Export for Vercel serverless
export default app;
