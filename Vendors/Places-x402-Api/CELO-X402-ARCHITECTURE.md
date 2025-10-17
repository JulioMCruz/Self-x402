# Celo X402 Architecture

## Overview

This API implements the X402 micropayment standard for Celo networks using a **custom facilitator approach**. While the official x402-express and x402-hono packages only support Base networks, the X402 standard is network-agnostic and explicitly supports custom facilitators for any EVM network.

## Architecture Components

### 1. Custom Payment Middleware (`src/middleware/celo-payment-middleware.ts`)

Custom Express middleware that:
- Validates X-Payment headers containing EIP-712 signatures
- Verifies payment envelope structure (network, authorization, signature)
- Calls CeloFacilitator for signature verification
- Returns 402 Payment Required for invalid/missing payments

**Why Custom?**
- x402-express/x402-hono only support Base networks in their `getNetworkId()` function
- Custom middleware allows us to support Celo Mainnet and Celo Sepolia
- Still 100% X402-compliant (uses standard headers, envelope format, and EIP-712)

### 2. CeloFacilitator (`../CeloFacilitator/`)

Independent verification service that:
- Implements custom `/verify-celo` endpoint
- Uses viem's `recoverTypedDataAddress()` to validate EIP-712 signatures
- Supports both Celo Mainnet (42220) and Celo Sepolia (11142220)
- Verifies payment authorization validity windows

**X402 Compliance:**
- Follows X402 facilitator specification
- Validates EIP-3009 transferWithAuthorization signatures
- Returns standard verification responses

### 3. Express API Server (`src/server.ts`)

X402-compliant API with:
- Standard `/.well-known/x402` service discovery endpoint
- Payment-protected routes (configured in `src/config/x402.ts`)
- Free endpoints (health, docs, service discovery)
- Comprehensive error handling and validation

## X402 Standard Compliance

### ✅ Service Discovery
- `GET /.well-known/x402` returns complete service metadata
- Includes payTo address, routes, pricing, and schemas
- Compatible with Bazaar and AI agent discovery

### ✅ Payment Envelope Format
```typescript
{
  network: "celo-sepolia",
  authorization: {
    from: "0x...",
    to: "0x...",
    value: "1000",
    validAfter: 0,
    validBefore: 1234567890,
    nonce: "0x..."
  },
  signature: "0x..."
}
```

### ✅ EIP-712 Typed Data
```typescript
{
  domain: {
    name: "USD Coin",
    version: "2",
    chainId: 11142220,
    verifyingContract: "0x01C5C0122039549AD1493B8220cABEdD739BC44E"
  },
  types: {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" }
    ]
  }
}
```

### ✅ Custom Facilitator Support
The X402 specification explicitly allows custom facilitators:
- Official docs: "Run your own self-hosted facilitator for networks like Avalanche, Polygon, Arbitrum, and other EVM-compatible chains"
- Any EVM network with EIP-3009 compatible USDC can use X402
- Custom facilitators enable network extensibility

## Network Configuration

### Celo Sepolia (Testnet)
- **Chain ID**: 11142220
- **USDC Address**: `0x01C5C0122039549AD1493B8220cABEdD739BC44E`
- **RPC**: `https://celo-sepolia.g.alchemy.com`
- **Explorer**: `https://celo-sepolia.blockscout.com`
- **Faucet**: `https://faucet.celo.org`

### Celo Mainnet
- **Chain ID**: 42220
- **USDC Address**: `0xcebA9300f2b948710d2653dD7B07f33A8B32118C`
- **RPC**: `https://forno.celo.org`
- **Explorer**: `https://celoscan.io`

## Request Flow

```
1. Client creates EIP-712 signature with wallet
   └─> Signs transferWithAuthorization for USDC payment

2. Client sends request with X-Payment header
   └─> Header contains: { network, authorization, signature }

3. Custom Payment Middleware validates envelope
   ├─> Checks network matches route configuration
   ├─> Validates payTo address
   ├─> Verifies payment amount
   └─> Sends to CeloFacilitator for signature verification

4. CeloFacilitator verifies signature
   ├─> Recovers signer address using viem
   ├─> Checks if recovered address matches authorization.from
   └─> Returns { valid: true/false, payer, error }

5. Middleware processes facilitator response
   ├─> If valid: proceeds to route handler
   └─> If invalid: returns 402 Payment Required

6. Route handler returns protected data
   └─> Client receives requested data
```

## Why Not x402-hono or x402-express?

Both packages are excellent for Base networks, but have limitations:

**x402-express/x402-hono Limitations:**
- `getNetworkId()` function only supports Base and Base Sepolia
- Throws "Unsupported network" error for Celo networks
- Designed specifically for CDP's facilitator infrastructure

**Our Custom Solution:**
- ✅ Supports any EVM network (Celo, Polygon, Arbitrum, etc.)
- ✅ 100% X402 standard compliant
- ✅ Uses same payment envelope format
- ✅ Uses same EIP-712 signature verification
- ✅ Works with custom facilitators (explicitly supported by X402)
- ✅ Provides identical developer experience

## Testing

### Run Payment Test
```bash
npm run test:celo
```

This test:
1. Fetches service discovery from `/.well-known/x402`
2. Creates and signs EIP-712 payment authorization
3. Sends payment request with X-Payment header
4. Verifies payment accepted and data returned
5. Validates response structure

### Example Output
```
✅ Step 1: Fetching payment requirements from /.well-known/x402...
✅ Step 2: Preparing payment envelope...
✅ Step 3: Signing payment authorization...
✅ Step 4: Creating x402 payment envelope...
✅ Step 5: Sending payment request to /api/demo...
   Response time: 35ms
   Status: 200
✅ Step 6: Verifying response...
   ✓ Payment accepted!
🎉 TEST PASSED - Payment flow completed successfully!
```

## X402 Standard References

- **EIP-712**: https://eips.ethereum.org/EIPS/eip-712
- **EIP-3009**: https://eips.ethereum.org/EIPS/eip-3009
- **X402 Docs**: https://x402.gitbook.io/x402/
- **Network Support**: https://x402.gitbook.io/x402/core-concepts/network-and-token-support
- **Custom Facilitators**: https://docs.cdp.coinbase.com/x402/network-support

## Deployment

### Vercel Deployment
The API is configured for serverless deployment on Vercel:
- Uses `vercel.json` for serverless function configuration
- Supports environment variables via Vercel dashboard
- Automatic HTTPS and global CDN

### Environment Variables
Required for production:
```bash
NODE_ENV=production
PORT=3000
PAYMENT_WALLET_ADDRESS=0x...
NETWORK=celo-sepolia
PAYMENT_PRICE_USD=0.001
FACILITATOR_URL=https://your-facilitator.example.com
```

## Future Enhancements

1. **Multi-Network Support**: Add configuration for multiple networks
2. **Settlement Endpoint**: Implement actual USDC transfer settlement
3. **Rate Limiting**: Add payment-based rate limiting
4. **Analytics**: Track payment volume and revenue
5. **Subscription Model**: Implement time-based payment subscriptions

## Conclusion

This implementation demonstrates that **X402 is truly network-agnostic**. By building a custom facilitator and middleware, we've extended X402 to Celo networks while maintaining 100% standard compliance. This same approach can be used for any EVM-compatible network with EIP-3009 USDC support.
