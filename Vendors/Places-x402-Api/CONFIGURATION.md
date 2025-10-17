# Configuration Files Guide

## Two Different Configuration Files Explained

### 📄 `.env` - API Server Configuration (NO Private Key)

**Purpose**: Configures the API server that RECEIVES payments

**Location**: `/Celo-x402-Api/.env`

**Contains**:
```bash
# Server settings
NODE_ENV=development
PORT=3000

# WHERE payments should be sent TO (your receiving wallet)
PAYMENT_WALLET_ADDRESS=0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f  # ✅ Already set
NETWORK=celo-sepolia
PAYMENT_PRICE_USD=0.001
FACILITATOR_URL=http://localhost:3005
```

**Security**:
- ✅ Safe to commit (contains NO private keys)
- ✅ Only has PUBLIC wallet address
- ✅ This is where you RECEIVE payments

---

### 🔐 `test-env.local` - Test Client Configuration (HAS Private Key)

**Purpose**: Configures the test script that SENDS payments

**Location**: `/Celo-x402-Api/test-env.local`

**Contains**:
```bash
# Test wallet that will SEND payments (needs private key to sign)
TEST_WALLET_PRIVATE_KEY=0xYourPrivateKeyHere  # ⚠️ ADD YOUR PRIVATE KEY HERE
TEST_WALLET_ADDRESS=0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f

# Test configuration
API_BASE_URL=http://localhost:54112
FACILITATOR_URL=http://localhost:3005
PAYMENT_AMOUNT_USD=0.001
NETWORK=celo-sepolia
```

**Security**:
- ⚠️ **NEVER commit this file** (gitignored)
- ⚠️ Contains PRIVATE KEY
- ⚠️ Only for local testing
- ⚠️ Use test wallet with minimal funds

---

## Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Payment Flow                              │
└─────────────────────────────────────────────────────────────┘

📱 Test Script (test-env.local)
   Wallet: 0xc256...8228f
   Private Key: 0xYour...Key  ⬅️ YOU NEED TO ADD THIS
   Role: SENDER (pays for API access)
   USDC Balance: ~0.01 USDC needed

        │
        │ Signs payment with private key
        │ Sends $0.001 USDC payment envelope
        │
        ▼

🌐 Celo-x402-Api (.env)
   Receives payments at: 0xc256...8228f
   Role: RECEIVER (gets paid for API access)

        │
        │ Verifies payment with CeloFacilitator
        │
        ▼

✅ Payment Verified → Returns demo data
```

---

## Quick Setup Steps

### 1. ✅ API Server Configuration (Already Done)
Your `.env` file is already configured with:
- ✅ PAYMENT_WALLET_ADDRESS: `0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f`
- ✅ Network: celo-sepolia
- ✅ Facilitator: http://localhost:3005

### 2. ⚠️ Test Client Configuration (Need Your Private Key)

**Option A: Use Same Wallet for Testing**
```bash
# Edit test-env.local and add the private key for 0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f
TEST_WALLET_PRIVATE_KEY=0xYourActualPrivateKeyHere
```

**Get private key from MetaMask:**
1. Open MetaMask
2. Select account: 0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f
3. Click ⋮ menu → Account details
4. Click "Show private key"
5. Enter password
6. Copy private key
7. Paste in test-env.local

**Option B: Use Different Wallet for Testing**
```bash
# Create a NEW test wallet in MetaMask
# Update both fields in test-env.local:
TEST_WALLET_PRIVATE_KEY=0xNewWalletPrivateKey
TEST_WALLET_ADDRESS=0xNewWalletAddress
```

### 3. Get Test USDC

Your test wallet needs USDC on Celo Sepolia:

```bash
# Step 1: Get testnet CELO
Visit: https://faucet.celo.org/
Enter: 0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f
Request: Testnet CELO

# Step 2: Swap CELO → USDC
- Use Uniswap on Celo Sepolia
- Swap ~0.1 CELO → USDC
- USDC Contract: 0x01C5C0122039549AD1493B8220cABEdD739BC44E

# Step 3: Verify balance
Visit: https://celo-sepolia.blockscout.com/address/0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f
Check: Should see USDC balance
```

### 4. Run Test

```bash
npm run test:celo
```

---

## Example test-env.local (Complete)

```bash
# Test Wallet Configuration
TEST_WALLET_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
TEST_WALLET_ADDRESS=0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f

# API Configuration
API_BASE_URL=http://localhost:54112
FACILITATOR_URL=http://localhost:3005

# Payment Configuration
PAYMENT_AMOUNT_USD=0.001
NETWORK=celo-sepolia
```

---

## Security Checklist

- [ ] Added private key to `test-env.local`
- [ ] Verified `test-env.local` is gitignored
- [ ] Using test wallet with minimal funds
- [ ] Test wallet has USDC on Celo Sepolia
- [ ] CeloFacilitator running on port 3005
- [ ] Celo-x402-Api running on port 54112
- [ ] Ready to run: `npm run test:celo`

---

## Common Questions

**Q: Can I use the same wallet for sending and receiving?**
A: Yes! For testing, you can use the same wallet. The payment will go from your wallet to your wallet (you pay yourself).

**Q: Do I need different wallets?**
A: No, for testing it's fine to use one wallet. For production, you might want separate wallets for security.

**Q: Why do I need a private key in test-env.local but not in .env?**
A:
- `.env` = Server that RECEIVES payments (only needs public address)
- `test-env.local` = Client that SENDS payments (needs private key to sign)

**Q: Is test-env.local safe?**
A: Yes, it's gitignored. But ONLY use it with test wallets with minimal funds, never your main wallet.

**Q: Where do I get testnet USDC?**
A: Get testnet CELO from faucet, then swap for USDC on Uniswap or similar DEX on Celo Sepolia.
