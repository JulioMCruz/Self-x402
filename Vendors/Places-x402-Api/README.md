# Celo X402 API - Custom Facilitator Edition 🚀

**Production-ready API with gasless micropayments on Celo networks using a custom x402 facilitator**

This API demonstrates how to build an x402-compliant payment system **independent of the Coinbase Developer Platform (CDP)**, using a custom facilitator for Celo blockchain networks.

> 🔥 **Key Feature**: This implementation uses a **custom CeloFacilitator** running independently, proving that x402 works on any EVM-compatible chain without requiring CDP infrastructure!

## ✨ Features

- **🔐 X402 Gasless Micropayments** - EIP-712 signatures, no gas fees for clients
- **🌐 Celo Network Support** - Mainnet and Sepolia testnet
- **🏭 Custom Facilitator** - Independent of CDP platform
- **📡 Multi-Endpoint Support** - Easy to add multiple discoverable endpoints
- **🔍 Rich Service Discovery** - Comprehensive metadata for AI agents
- **📝 Full TypeScript** - Type-safe development
- **🧪 Test Suite Included** - Ready-to-use testing utilities

## 🏗️ Architecture

### Custom Facilitator Model

Unlike the standard x402 implementation that relies on Coinbase's CDP facilitator for Base networks, this API uses a **custom-built facilitator** for Celo:

```
┌─────────────────┐
│   Client App    │
│ (with wallet)   │
└────────┬────────┘
         │ 1. Request with X-Payment header
         ↓
┌─────────────────┐
│  Celo-x402-Api  │  ← This API
│   (port 3000)   │
└────────┬────────┘
         │ 2. Verify payment
         ↓
┌─────────────────┐
│ CeloFacilitator │  ← Custom facilitator
│   (port 3005)   │
└────────┬────────┘
         │ 3. Validate & settle
         ↓
┌─────────────────┐
│  Celo Network   │  ← Blockchain
│  (Sepolia/Main) │
└─────────────────┘
```

**Why Custom Facilitator?**
- ✅ **Chain Independence**: Works on any EVM chain, not just Base
- ✅ **No CDP Required**: No API keys or CDP account needed
- ✅ **Full Control**: You control verification and settlement logic
- ✅ **Cost Effective**: No facilitator service fees
- ✅ **Open Source**: Transparent and auditable

## 🚀 Quick Start

### Prerequisites

1. **CeloFacilitator must be running** on port 3005:
```bash
cd ../CeloFacilitator
npm install
cp .env.example .env
# Configure with your private keys
npm run dev
```

2. **Get testnet USDC** on Celo Sepolia:
   - Visit [Celo Faucet](https://faucet.celo.org/) for testnet CELO
   - Swap for USDC on [Uniswap](https://app.uniswap.org/)
   - USDC Contract: `0x01C5C0122039549AD1493B8220cABEdD739BC44E`

### Setup This API

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your wallet address and API key

# Run development server
npm run dev
```

## 📁 Project Structure

```
Celo-x402-Api/
├── src/
│   ├── config/
│   │   └── x402.ts              # X402 configuration (Celo networks only)
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   └── server.ts                # Main Express server
│
├── lib/custom/                  # YOUR CUSTOM CODE
│   ├── services/
│   │   └── your-service.ts      # Your service implementation
│   └── types/                   # Your custom types
│
├── .env.example                 # Environment template (Celo-specific)
└── README.md                    # This file
```

## 🔧 Configuration

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Your API
YOUR_API_KEY=your_api_key_here

# Payment Configuration
PAYMENT_WALLET_ADDRESS=0xYourWalletAddress
NETWORK=celo-sepolia
PAYMENT_PRICE_USD=0.001

# Custom Facilitator
FACILITATOR_URL=http://localhost:3005
```

**Supported Networks:**
- `celo-sepolia` - Testnet (Chain ID: 11142220)
- `celo` - Mainnet (Chain ID: 42220)

**Important:**
- ❌ No CDP API keys required
- ✅ CeloFacilitator must be running
- ✅ Wallet must have USDC on Celo network

## 📖 API Endpoints

### Free Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /` | API information |
| `GET /.well-known/x402` | Service discovery |
| `GET /api/info` | API documentation |

### Protected Endpoints (X402 Payment Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/resources/search` | GET | Search resources |
| `/api/resources/:id` | GET | Get resource by ID |
| `/api/resources` | POST | Create/update resource |

## 🧪 Testing

```bash
# Run all tests
npm test

# Test with X402 payment
npm run test:x402-axios

# Full integration test
npm run test:full-integration
```

## 🌐 Network Information

### Celo Sepolia (Testnet)
- **Chain ID**: 11142220
- **USDC**: `0x01C5C0122039549AD1493B8220cABEdD739BC44E`
- **RPC**: `https://celo-sepolia.g.alchemy.com`
- **Explorer**: [https://celo-sepolia.blockscout.com](https://celo-sepolia.blockscout.com)
- **Faucet**: [https://faucet.celo.org](https://faucet.celo.org)

### Celo Mainnet
- **Chain ID**: 42220
- **USDC**: `0xcebA9300f2b948710d2653dD7B07f33A8B32118C`
- **RPC**: `https://forno.celo.org`
- **Explorer**: [https://celoscan.io](https://celoscan.io)

## 🔐 Security Best Practices

1. **Never commit `.env`** - Use `.env.example` as template
2. **Separate wallets** - Different addresses for testnet/mainnet
3. **Monitor payments** - Track incoming micropayments
4. **Facilitator security** - Protect facilitator private keys
5. **Input validation** - Always validate user input
6. **Error handling** - Don't expose sensitive info

## 📚 Resources

### X402 Protocol
- [X402 Documentation](https://x402.gitbook.io/x402)
- [Core Concepts: Facilitator](https://x402.gitbook.io/x402/core-concepts/facilitator)
- [Network Support](https://docs.cdp.coinbase.com/x402/network-support)
- [EIP-712 Standard](https://eips.ethereum.org/EIPS/eip-712)

### Celo Blockchain
- [Celo Documentation](https://docs.celo.org/)
- [Celo Sepolia Info](https://docs.celo.org/network/celo-sepolia)

### Custom Facilitator
- See [../CeloFacilitator/README.md](../CeloFacilitator/README.md)

## 💡 How It Works

### Payment Flow

1. **Client generates EIP-712 signature** for USDC payment
2. **Client sends request** with X-Payment header
3. **API forwards to CeloFacilitator** for verification
4. **CeloFacilitator verifies** signature and checks USDC balance
5. **If valid, CeloFacilitator settles** payment on Celo network
6. **API returns protected data** to client

### Custom Facilitator Advantages

- **Network Flexibility**: Support any EVM chain (Celo, Polygon, Avalanche, etc.)
- **No Vendor Lock-in**: Independent of CDP infrastructure
- **Cost Control**: No third-party facilitator fees
- **Customization**: Add custom verification logic
- **Privacy**: Payment data stays under your control

## 🔄 Switching Networks

Edit `.env`:
```env
# Testnet
NETWORK=celo-sepolia

# Mainnet
NETWORK=celo
```

Ensure CeloFacilitator is configured for the same network!

## 🆘 Troubleshooting

### "Facilitator not responding"
- Check CeloFacilitator is running on port 3005
- Verify `FACILITATOR_URL=http://localhost:3005` in `.env`

### "Missing private key for Celo"
- Configure CeloFacilitator's `.env` with private keys
- Ensure wallet has USDC on Celo network

### "Invalid network"
- Only `celo` and `celo-sepolia` are supported
- Check `NETWORK` value in `.env`

## 📄 License

MIT License

## 🙏 Acknowledgments

- Built with [X402 Protocol](https://x402.gitbook.io/x402)
- Powered by [Celo](https://celo.org/)
- Custom facilitator implementation based on X402 reference

---

**🌟 This API demonstrates that x402 works on ANY EVM chain with a custom facilitator - no CDP required!**
