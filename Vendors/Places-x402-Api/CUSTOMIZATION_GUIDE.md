# 🎨 Customization Guide

Complete guide to customizing the X402 API Template for your specific use case.

## 📋 Table of Contents

1. [Quick Start Checklist](#quick-start-checklist)
2. [Configuration](#configuration)
3. [Adding Endpoints](#adding-endpoints)
4. [Service Implementation](#service-implementation)
5. [Schema Definitions](#schema-definitions)
6. [Discovery Metadata](#discovery-metadata)
7. [Common Patterns](#common-patterns)
8. [Examples](#examples)

## ✅ Quick Start Checklist

Follow these steps in order to customize the template:

- [ ] **Step 1**: Copy `.env.example` to `.env` and configure
- [ ] **Step 2**: Update service metadata in `src/config/x402.ts`
- [ ] **Step 3**: Define your endpoints in `paymentRoutes`
- [ ] **Step 4**: Implement service logic in `lib/custom/services/your-service.ts`
- [ ] **Step 5**: Add endpoint handlers in `src/server.ts`
- [ ] **Step 6**: Test locally with `npm run dev`
- [ ] **Step 7**: Deploy to Vercel

## ⚙️ Configuration

### 1. Update Service Metadata

**File:** `src/config/x402.ts`

```typescript
export const serviceDiscovery = {
  service: "Your API Service Name",  // ← Change this
  version: "1.0.0",
  description: "Your comprehensive service description highlighting key features",  // ← Change this

  capabilities: {
    features: [
      "Real-time data access",  // ← Add your features
      "Multi-network support",
      "Comprehensive filtering"
    ],
    data_sources: ["Your Data Source"],  // ← Add your data sources
    // ... more capabilities
  },

  metadata: {
    author: "Your Organization",  // ← Change this
    contact: {
      website: "https://your-api.example.com",  // ← Update URLs
      documentation: "https://your-api.example.com/api/info",
      support: "https://github.com/your-org/your-api"
    }
  }
};
```

### 2. Configure Environment Variables

**File:** `.env`

```env
# Required: Your external API credentials
YOUR_API_KEY=your_actual_api_key_here

# Required: Payment configuration
PAYMENT_WALLET_ADDRESS=0xYourWalletAddress
NETWORK=base-sepolia  # or 'base' for mainnet
PAYMENT_PRICE_USD=0.001

# Optional: For mainnet only
CDP_API_KEY_ID=your_cdp_key
CDP_API_KEY_SECRET=your_cdp_secret
```

## 🚀 Adding Endpoints

### Example: Adding a New Endpoint

**Step 1: Define Route in `src/config/x402.ts`**

```typescript
export const paymentRoutes: Record<string, PaymentRoute> = {
  // ... existing routes

  "GET /api/blockchain/transactions": {
    price: `$${x402Config.priceUsd}`,
    network: x402Config.network,
    discoverable: isProduction,  // Only visible in production

    // Detailed description for AI agents and developers
    description: "Retrieve blockchain transaction history with advanced filtering by address, time range, and token type",

    // Tags for categorization and discovery
    tags: ["blockchain", "transactions", "history", "evm", "crypto"],

    // Input schema - helps AI understand how to use your endpoint
    inputSchema: {
      type: "object",
      description: "Transaction query parameters",
      properties: {
        address: {
          type: "string",
          description: "Ethereum address to query transactions for (required)",
          pattern: "^0x[a-fA-F0-9]{40}$",
          examples: ["0xYourWalletAddressHere"]
        },
        start_block: {
          type: "number",
          description: "Starting block number (optional, default: 0)",
          minimum: 0,
          default: 0
        },
        end_block: {
          type: "number",
          description: "Ending block number (optional, default: latest)",
          minimum: 0
        },
        limit: {
          type: "number",
          description: "Maximum results to return (optional, default: 50, max: 500)",
          minimum: 1,
          maximum: 500,
          default: 50
        }
      },
      required: ["address"],
      additionalProperties: false
    },

    // Output schema - helps AI understand response format
    outputSchema: {
      type: "object",
      description: "Transaction history response",
      properties: {
        data: {
          type: "array",
          description: "Array of transaction objects",
          items: {
            type: "object",
            properties: {
              hash: { type: "string", description: "Transaction hash" },
              from: { type: "string", description: "Sender address" },
              to: { type: "string", description: "Recipient address" },
              value: { type: "string", description: "Amount transferred (wei)" },
              block_number: { type: "number", description: "Block number" },
              timestamp: { type: "string", format: "date-time", description: "Transaction timestamp" },
              gas_used: { type: "number", description: "Gas consumed" },
              status: { type: "string", enum: ["success", "failed"], description: "Transaction status" }
            }
          }
        },
        pagination: {
          type: "object",
          properties: {
            total_results: { type: "number" },
            limit: { type: "number" },
            has_more: { type: "boolean" }
          }
        },
        metadata: {
          type: "object",
          description: "X402 payment metadata",
          properties: {
            cost: { type: "string" },
            protocol: { type: "string" },
            network: { type: "string" },
            timestamp: { type: "string", format: "date-time" }
          }
        }
      },
      required: ["data", "pagination", "metadata"]
    },

    // Usage examples for documentation
    examples: [
      {
        input: {
          address: "0xYourWalletAddressHere",
          start_block: 1000000,
          limit: 100
        },
        description: "Get last 100 transactions for address starting from block 1000000"
      },
      {
        input: {
          address: "0xYourWalletAddressHere",
          end_block: 2000000,
          limit: 50
        },
        description: "Get up to 50 transactions before block 2000000"
      }
    ]
  }
};
```

**Step 2: Add Service Method in `lib/custom/services/your-service.ts`**

```typescript
export interface TransactionQueryParams {
  address: string;
  start_block?: number;
  end_block?: number;
  limit: number;
}

export class YourService {
  // ... existing methods

  public async getTransactions(params: TransactionQueryParams) {
    console.log('🔍 Fetching transactions:', params);

    // TODO: Replace with your actual API call
    // Example: Call to blockchain data provider
    // const response = await this.blockchainAPI.getTransactions({
    //   address: params.address,
    //   startBlock: params.start_block,
    //   endBlock: params.end_block || 'latest',
    //   limit: params.limit
    // });

    // Mock response for template
    const mockTransactions = Array.from({ length: params.limit }, (_, i) => ({
      hash: `0x${Math.random().toString(16).slice(2)}`,
      from: params.address,
      to: `0x${Math.random().toString(16).slice(2, 42)}`,
      value: (Math.random() * 1000000000000000000).toString(),
      block_number: (params.start_block || 0) + i,
      timestamp: new Date(Date.now() - i * 15000).toISOString(),
      gas_used: Math.floor(Math.random() * 100000),
      status: Math.random() > 0.1 ? 'success' : 'failed'
    }));

    return {
      data: mockTransactions,
      pagination: {
        total_results: 1000, // Replace with actual count
        limit: params.limit,
        has_more: true
      }
    };
  }

  // Validation method
  public validateTransactionQuery(params: TransactionQueryParams): string[] {
    const errors: string[] = [];

    if (!params.address || !/^0x[a-fA-F0-9]{40}$/.test(params.address)) {
      errors.push('Invalid Ethereum address format');
    }

    if (params.start_block !== undefined && params.start_block < 0) {
      errors.push('start_block must be >= 0');
    }

    if (params.end_block !== undefined && params.end_block < 0) {
      errors.push('end_block must be >= 0');
    }

    if (params.start_block && params.end_block && params.start_block > params.end_block) {
      errors.push('start_block must be <= end_block');
    }

    if (params.limit < 1 || params.limit > 500) {
      errors.push('limit must be between 1 and 500');
    }

    return errors;
  }
}
```

**Step 3: Add Route Handler in `src/server.ts`**

```typescript
// Add after existing protected endpoints

app.get('/api/blockchain/transactions', async (req, res) => {
  try {
    console.log('📊 Processing X402-verified transaction query');

    // Extract parameters
    const address = req.query.address as string;
    const start_block = req.query.start_block ? parseInt(req.query.start_block as string) : undefined;
    const end_block = req.query.end_block ? parseInt(req.query.end_block as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const params = { address, start_block, end_block, limit };

    // Validate parameters
    const validationErrors = yourService.validateTransactionQuery(params);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Invalid Request",
        message: "Request validation failed",
        details: validationErrors
      } as ErrorResponse);
    }

    // Fetch transactions
    const result = await yourService.getTransactions(params);

    console.log(`✅ Transaction query completed: ${result.data.length} transactions`);

    res.json({
      ...result,
      metadata: {
        cost: `$${x402Config.priceUsd}`,
        protocol: "x402 v1.0",
        network: x402Config.network,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Transaction query error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Transaction query failed",
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      } as ErrorResponse);
    }
  }
});
```

## 🔧 Service Implementation

### Integrating External APIs

**Example: Integrating with a REST API**

```typescript
import axios from 'axios';

export class YourService {
  private apiClient: any;

  private constructor() {
    // Initialize API client
    this.apiClient = axios.create({
      baseURL: 'https://api.example.com',
      headers: {
        'Authorization': `Bearer ${process.env.YOUR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ YourService initialized');
  }

  public async search(params: SearchParams): Promise<SearchResult> {
    try {
      const response = await this.apiClient.get('/search', {
        params: {
          q: params.query,
          category: params.category,
          limit: params.limit,
          offset: (params.page - 1) * params.limit
        }
      });

      return {
        data: response.data.results,
        pagination: {
          page: params.page,
          limit: params.limit,
          total_pages: Math.ceil(response.data.total / params.limit),
          total_results: response.data.total
        }
      };
    } catch (error) {
      console.error('API Error:', error);
      throw new Error('External API request failed');
    }
  }
}
```

### Error Handling Best Practices

```typescript
public async yourMethod(params: any) {
  try {
    // Your API call
    const result = await this.externalAPI.call(params);
    return result;

  } catch (error) {
    // Log the error
    console.error('Service error:', error);

    // Transform error for client
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error('Resource not found');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      throw new Error(`API error: ${error.message}`);
    }

    throw error;
  }
}
```

## 📝 Schema Definitions

### Input Schema Best Practices

```typescript
inputSchema: {
  type: "object",
  description: "Clear description of what this endpoint does",
  properties: {
    required_param: {
      type: "string",
      description: "Detailed description with examples",
      minLength: 1,
      maxLength: 256,
      pattern: "^[a-zA-Z0-9_-]+$",  // Regex validation
      examples: ["example1", "example2"]
    },
    optional_param: {
      type: "number",
      description: "Optional parameter with default",
      minimum: 1,
      maximum: 1000,
      default: 10
    },
    enum_param: {
      type: "string",
      description: "Parameter with fixed options",
      enum: ["option1", "option2", "option3"],
      default: "option1"
    }
  },
  required: ["required_param"],  // List required fields
  additionalProperties: false  // Strict schema validation
}
```

### Output Schema Best Practices

```typescript
outputSchema: {
  type: "object",
  description: "Response structure description",
  properties: {
    data: {
      type: "array",
      description: "Main data payload",
      items: {
        type: "object",
        properties: {
          // Define each field with description
          id: { type: "string", description: "Unique identifier" },
          name: { type: "string", description: "Resource name" },
          // ... more fields
        }
      }
    },
    pagination: {
      type: "object",
      description: "Pagination information",
      properties: {
        page: { type: "number" },
        total_pages: { type: "number" },
        total_results: { type: "number" }
      }
    },
    metadata: {
      type: "object",
      description: "X402 payment metadata (automatically added)",
      properties: {
        cost: { type: "string" },
        protocol: { type: "string" },
        network: { type: "string" },
        timestamp: { type: "string", format: "date-time" }
      }
    }
  },
  required: ["data", "metadata"]
}
```

## 🔍 Discovery Metadata

### Making Your API AI-Friendly

The X402 discovery format is designed to be understood by AI agents. Follow these guidelines:

**1. Use Descriptive Tags**

```typescript
tags: [
  "blockchain",      // Primary category
  "transactions",    // Feature
  "history",         // Functionality
  "evm",            // Technical detail
  "analytics"       // Use case
]
```

**2. Write Clear Descriptions**

```typescript
// ✅ Good
description: "Retrieve blockchain transaction history with advanced filtering by address, time range, and token type. Supports all EVM-compatible networks with real-time data updates."

// ❌ Bad
description: "Get transactions"
```

**3. Provide Comprehensive Examples**

```typescript
examples: [
  {
    input: {
      address: "0xYourWalletAddressHere",
      start_block: 1000000,
      limit: 100
    },
    description: "Get last 100 transactions for address starting from block 1000000"
  },
  {
    input: {
      address: "0xYourWalletAddressHere",
      end_block: 2000000
    },
    description: "Get transactions before block 2000000 with default limit"
  }
]
```

## 🎯 Common Patterns

### Pattern 1: Pagination

```typescript
// In your endpoint handler
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 10;
const offset = (page - 1) * limit;

const result = await yourService.search({ ...params, limit, offset });

res.json({
  data: result.data,
  pagination: {
    page,
    limit,
    total_pages: Math.ceil(result.total / limit),
    total_results: result.total
  },
  metadata: { /* X402 metadata */ }
});
```

### Pattern 2: Filtering

```typescript
// Extract filter parameters
const filters = {
  category: req.query.category as string,
  status: req.query.status as string,
  date_from: req.query.date_from as string,
  date_to: req.query.date_to as string
};

// Remove undefined filters
const activeFilters = Object.fromEntries(
  Object.entries(filters).filter(([_, value]) => value !== undefined)
);

const result = await yourService.search({ ...params, filters: activeFilters });
```

### Pattern 3: Sorting

```typescript
const sort_by = (req.query.sort_by as string) || 'created_at';
const order = (req.query.order as string) || 'desc';

// Validate sort field
const validSortFields = ['name', 'created_at', 'updated_at', 'price'];
if (!validSortFields.includes(sort_by)) {
  return res.status(400).json({
    error: "Invalid sort_by field",
    valid_fields: validSortFields
  });
}

const result = await yourService.search({ ...params, sort_by, order });
```

## 📚 Complete Examples

See the template's default endpoints for complete working examples:

1. **Search Endpoint** (`GET /api/resources/search`) - Demonstrates filtering, pagination, sorting
2. **Get by ID** (`GET /api/resources/:id`) - Demonstrates path parameters, optional metadata
3. **Create/Update** (`POST /api/resources`) - Demonstrates request body validation, mutations

## 🚀 Next Steps

1. **Test Your Changes**
   ```bash
   npm run dev
   npm run test:x402-axios
   ```

2. **Deploy to Vercel**
   ```bash
   vercel
   ```

3. **Monitor Usage**
   - Check your wallet for incoming payments
   - View Vercel logs for API usage
   - Monitor error rates

## 💡 Tips

- Start with one endpoint and test thoroughly before adding more
- Use comprehensive input validation to prevent errors
- Provide detailed error messages in development mode
- Keep production errors generic for security
- Test both mainnet and testnet configurations
- Use meaningful tags for better discoverability

## 🆘 Need Help?

- Check the main README.md for setup instructions
- Review working examples in both Places-x402-Api and The-Graph-Token-x402-Api
- Consult [X402 Documentation](https://docs.cdp.coinbase.com/x402/docs/welcome)
