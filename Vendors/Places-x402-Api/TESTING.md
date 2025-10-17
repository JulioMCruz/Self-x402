# Testing Guide - Celo x402 API

Complete guide for testing the Celo x402 payment system with CeloFacilitator.

## Prerequisites

### 1. Running Services

You need both services running:

```bash
# Terminal 1: Start CeloFacilitator
cd ../CeloFacilitator
npm run dev
# Should run on port 3005

# Terminal 2: Start Celo-x402-Api
cd ../Celo-x402-Api
npm run dev
# Should run on port 3000 (or 54112)
```

### 2. Test Wallet Setup

**IMPORTANT: Create a NEW test wallet for testing. NEVER use your main wallet!**

#### Option A: Create with MetaMask
1. Open MetaMask
2. Click profile icon → Add account
3. Create new account called "Test - Celo Sepolia"
4. Go to Settings → Security & Privacy → Show private key
5. Copy the private key (starts with 0x)
6. Copy the wallet address

#### Option B: Generate with Script
```bash
# Generate new test wallet
node -e "const {privateKeyToAccount} = require('viem/accounts'); const account = privateKeyToAccount('0x' + require('crypto').randomBytes(32).toString('hex')); console.log('Address:', account.address); console.log('Private Key:', account.address);"
```

### 3. Get Test Funds

You need USDC on Celo Sepolia to test payments:

#### Step 1: Get CELO from faucet
```
Visit: https://faucet.celo.org/
Enter your test wallet address
Request testnet CELO
```

#### Step 2: Swap CELO for USDC
```
Option 1 - Uniswap on Celo Sepolia:
  - Visit Uniswap interface for Celo Sepolia
  - Connect your test wallet
  - Swap small amount CELO → USDC
  - USDC Contract: 0x01C5C0122039549AD1493B8220cABEdD739BC44E

Option 2 - Direct transfer if you have USDC:
  - Transfer from another wallet on Celo Sepolia
  - Amount: 0.01 USDC is enough for ~10 tests
```

#### Step 3: Verify balance
```bash
# Check USDC balance
# You can use Celo Explorer: https://celo-sepolia.blockscout.com/
# Enter your wallet address and check USDC token balance
```

## Test Configuration

### 1. Create Test Environment File

```bash
cd Celo-x402-Api
cp test-env.example test-env.local
```

### 2. Edit test-env.local

```bash
# Test Wallet Configuration (Celo Sepolia)
TEST_WALLET_PRIVATE_KEY=0xYourActualPrivateKey
TEST_WALLET_ADDRESS=0xYourActualWalletAddress

# API Configuration (use defaults if running locally)
API_BASE_URL=http://localhost:54112
FACILITATOR_URL=http://localhost:3005

# Payment Configuration
PAYMENT_AMOUNT_USD=0.001
NETWORK=celo-sepolia
```

**Security Notes:**
- `test-env.local` is gitignored - safe to use
- NEVER commit private keys to git
- Use a dedicated test wallet with minimal funds
- Keep test funds separate from main wallet

## Running Tests

### Full Payment Flow Test

This test performs a complete x402 payment:

```bash
npm run test:celo
```

#### What This Test Does:

1. **Loads configuration** from test-env.local
2. **Fetches payment requirements** from `/.well-known/x402`
3. **Creates wallet client** using your private key
4. **Signs payment authorization** using EIP-712
   - Creates USDC transferWithAuthorization signature
   - Sets validity period (1 hour)
   - Generates unique nonce
5. **Sends payment envelope** to `/api/demo`
6. **Verifies response** contains demo data
7. **Validates** payment was processed correctly

#### Expected Output:

```
🧪 Starting Celo x402 Payment Test

✅ Configuration loaded:
   Network: celo-sepolia
   Wallet: 0xYour...Address
   API: http://localhost:54112
   Facilitator: http://localhost:3005
   Amount: $0.001

✅ Wallet client created

📋 Step 1: Fetching payment requirements from /.well-known/x402...
   PayTo address: 0xYour...PayTo...Address
   Available routes: 1

📝 Step 2: Preparing payment envelope...
   Amount: 1000 (0.001 USDC)
   Valid until: 2025-10-06T21:30:00.000Z
   Nonce: 0x1234567890...

✍️  Step 3: Signing payment authorization...
   Signature: 0xabc123...

📦 Step 4: Creating x402 payment envelope...
   Envelope created ✓

💳 Step 5: Sending payment request to /api/demo...
   Response time: 1523ms
   Status: 200

✅ Step 6: Verifying response...
   ✓ Payment accepted!
   ✓ Demo data received:

{
  "network": "Celo Sepolia Testnet",
  "chainId": 11142220,
  "usdc": "0x01C5C0122039549AD1493B8220cABEdD739BC44E",
  "rpc": "https://celo-sepolia.g.alchemy.com",
  "explorer": "https://celo-sepolia.blockscout.com",
  "faucet": "https://faucet.celo.org",
  "stats": { ... },
  "metadata": {
    "cost": "0.001",
    "protocol": "x402 v1.0",
    "network": "celo-sepolia",
    "facilitator": "Custom CeloFacilitator",
    "timestamp": "2025-10-06T20:30:00.000Z",
    "message": "Payment verified! This data was delivered using X402 gasless micropayments."
  }
}

✅ Response structure validated ✓
   Network: Celo Sepolia Testnet
   Chain ID: 11142220
   USDC: 0x01C5C0122039549AD1493B8220cABEdD739BC44E
   Cost: $0.001
   Facilitator: Custom CeloFacilitator

🎉 TEST PASSED - Payment flow completed successfully!

✅ All tests completed successfully
```

## Troubleshooting

### Common Issues

#### 1. "TEST_WALLET_PRIVATE_KEY not set"
```
❌ Error: TEST_WALLET_PRIVATE_KEY not set in test-env.local

Fix:
- Make sure you created test-env.local (not test-env.example)
- Check that private key is set and starts with 0x
- Verify file is in Celo-x402-Api directory
```

#### 2. "No response received from API"
```
❌ Error: No response received from API

Fix:
- Check CeloFacilitator is running: curl http://localhost:3005/supported
- Check Celo-x402-Api is running: curl http://localhost:54112/health
- Verify ports in test-env.local match running servers
```

#### 3. "Insufficient USDC balance"
```
❌ Error: Insufficient balance or allowance

Fix:
- Check USDC balance in wallet
- Get more testnet CELO from faucet
- Swap CELO for USDC
- Minimum needed: ~0.01 USDC for testing
```

#### 4. "Payment verification failed"
```
❌ Error: Payment verification failed

Fix:
- Verify CeloFacilitator is configured for celo-sepolia
- Check PAYMENT_WALLET_ADDRESS in Celo-x402-Api .env matches
- Ensure signature is valid and not expired
- Check network matches between services
```

#### 5. "Invalid signature"
```
❌ Error: Invalid signature

Fix:
- Verify private key matches wallet address
- Check chainId matches Celo Sepolia (11142220)
- Ensure USDC contract address is correct
- Verify EIP-712 domain configuration
```

## Test Data Flow

```
┌─────────────┐
│ Test Script │
└──────┬──────┘
       │
       │ 1. Load config from test-env.local
       │ 2. Create wallet client
       │ 3. Sign EIP-712 payment authorization
       │
       ▼
┌─────────────────┐
│ Celo-x402-Api   │
│ (port 54112)    │
└────────┬────────┘
         │
         │ 4. Receive payment envelope
         │ 5. Forward to facilitator for verification
         │
         ▼
┌──────────────────┐
│ CeloFacilitator  │
│ (port 3005)      │
└────────┬─────────┘
         │
         │ 6. Verify signature
         │ 7. Check USDC authorization
         │ 8. Return verification result
         │
         ▼
┌─────────────────┐
│ Celo-x402-Api   │
└────────┬────────┘
         │
         │ 9. Payment verified ✓
         │ 10. Return demo data
         │
         ▼
┌─────────────┐
│ Test Script │
│ ✅ SUCCESS  │
└─────────────┘
```

## Manual Testing with cURL

You can also test manually with cURL:

### 1. Check API health
```bash
curl http://localhost:54112/health
```

### 2. Get service discovery
```bash
curl http://localhost:54112/.well-known/x402 | jq
```

### 3. Check facilitator
```bash
curl http://localhost:3005/supported | jq
```

### 4. Test payment (requires signed envelope)
```bash
# This requires generating a proper EIP-712 signature
# Use the test script instead: npm run test:celo
```

## Next Steps

After successful testing:

1. **Test with different amounts**
   - Modify PAYMENT_AMOUNT_USD in test-env.local
   - Run test again

2. **Test error cases**
   - Try with insufficient balance
   - Try with expired signature
   - Try with wrong network

3. **Monitor transactions**
   - Check Celo Sepolia explorer
   - View your wallet transactions
   - Verify USDC movements

4. **Production preparation**
   - Change NETWORK to `celo` in .env
   - Update PAYMENT_WALLET_ADDRESS for production
   - Get real USDC on Celo mainnet
   - Test on mainnet with small amounts first

## Security Checklist

- [ ] Using separate test wallet (not main wallet)
- [ ] test-env.local is gitignored
- [ ] Private keys never committed to git
- [ ] Test wallet has minimal funds
- [ ] Production wallet uses different address
- [ ] Testing on testnet first
- [ ] Verified CeloFacilitator configuration
- [ ] Checked all transactions on explorer

## Resources

- **Celo Sepolia Faucet**: https://faucet.celo.org/
- **Celo Sepolia Explorer**: https://celo-sepolia.blockscout.com/
- **USDC Contract**: 0x01C5C0122039549AD1493B8220cABEdD739BC44E
- **x402 Documentation**: https://x402.gitbook.io/x402/
- **Viem Documentation**: https://viem.sh/
