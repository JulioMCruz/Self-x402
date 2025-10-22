# Railway Environment Variables Setup

## Issue Fixed
**Scope Mismatch Error**: `[InvalidScope]: Scope does not match with the one in the circuit`

This error occurred because the backend was using hardcoded values instead of environment variables.

## Required Environment Variables

Set these in your Railway project dashboard:

### Self Protocol Configuration (Critical)
```bash
SELF_SCOPE=self-x402-facilitator
SELF_ENDPOINT=https://facilitator.selfx402.xyz/api/verify
SERVER_DOMAIN=https://facilitator.selfx402.xyz
```

**Important**: The `SELF_SCOPE` must match exactly with the frontend's `NEXT_PUBLIC_SELF_SCOPE`.

### Celo Network Configuration
```bash
CELO_MAINNET_PRIVATE_KEY=your_private_key_here
CELO_MAINNET_RPC_URL=https://forno.celo.org
```

### Optional (Recommended for Production)
```bash
NODE_ENV=production

# Supabase Database (for nullifier persistence)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## How to Set Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your Selfx402Facilitator service
3. Navigate to **Variables** tab
4. Add each variable:
   - Click **New Variable**
   - Enter variable name (e.g., `SELF_SCOPE`)
   - Enter variable value (e.g., `self-x402-facilitator`)
   - Click **Add**

5. After adding all variables, Railway will automatically redeploy

## Verification Steps

### 1. Check Logs After Deployment
Look for these lines in Railway logs:

```
✅ SelfVerificationService initialized with Supabase database
🚀 Celo x402 Facilitator running on port XXXXX
📡 Network: Celo Mainnet (Chain ID: 42220)
💵 USDC: 0xcebA9300f2b948710d2653dD7B07f33A8B32118C
🔐 Self Protocol: Enabled (proof-of-unique-human verification)
💾 Database: Supabase (connected)
```

### 2. Test Health Endpoint
```bash
curl https://facilitator.selfx402.xyz/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-21T...",
  "network": "celo",
  "services": {
    "database": "connected",
    "selfProtocol": "enabled"
  }
}
```

### 3. Test Verification from Frontend

When you scan QR code with Self mobile app, check Railway logs for:

```
********************************************************
📥 Self Protocol Verification Request
********************************************************
📋 Request Body: { hasAttestationId: true, hasProof: true, ... }
🔍 Verification Details:
  - Attestation ID: ...
  - Proof length: ... chars
  - Public signals count: ...
Creating SelfBackendVerifier with config:
  scope: self-x402-facilitator
  endpoint: https://facilitator.selfx402.xyz/api/verify
```

**Success indicator**: You should see verification succeed without scope mismatch errors.

## Troubleshooting

### Scope Mismatch Error Still Occurs

Check logs for this section:
```
🔴 SCOPE MISMATCH DETECTED
  - Expected scope (backend): self-x402-facilitator
  - Endpoint (backend): https://facilitator.selfx402.xyz/api/verify
  - Frontend should use the same scope in SelfAppBuilder
```

**Solution**: Ensure frontend `.env` has:
```bash
NEXT_PUBLIC_SELF_SCOPE="self-x402-facilitator"  # Must match backend SELF_SCOPE
NEXT_PUBLIC_SELF_ENDPOINT="https://facilitator.selfx402.xyz/api/verify"
```

### Database Connection Failed

If you see:
```
⚠️  Database connection failed - running in memory-only mode
```

**Solution**: Add Supabase environment variables (optional for MVP, required for production)

### USDC Settlement Fails

Check that:
1. `CELO_MAINNET_PRIVATE_KEY` has ETH for gas fees
2. `CELO_MAINNET_RPC_URL` is accessible
3. Wallet has sufficient CELO balance

## Code Changes Made

### index.ts (Lines 194-211)
**Before** (Hardcoded):
```typescript
const dynamicVerifier = new SelfBackendVerifier(
  "self-x402-facilitator",  // ❌ Hardcoded
  "https://codalabs.ngrok.io/api/verify",  // ❌ Hardcoded
  false,
  AllIds,
  new DefaultConfigStore(verifierConfig),
  "hex"
)
```

**After** (Dynamic):
```typescript
const selfScope = process.env.SELF_SCOPE || "self-x402-facilitator";
const selfEndpoint = process.env.SELF_ENDPOINT || `${process.env.SERVER_DOMAIN}/api/verify`;

const dynamicVerifier = new SelfBackendVerifier(
  selfScope,  // ✅ From environment
  selfEndpoint,  // ✅ From environment
  false,
  AllIds,
  new DefaultConfigStore(verifierConfig),
  "hex"
)
```

## Quick Reference

| Environment Variable | Frontend Value | Backend Value | Must Match |
|---------------------|----------------|---------------|------------|
| `SELF_SCOPE` | `NEXT_PUBLIC_SELF_SCOPE` | `SELF_SCOPE` | ✅ Yes |
| `SELF_ENDPOINT` | `NEXT_PUBLIC_SELF_ENDPOINT` | `SELF_ENDPOINT` | ✅ Yes |
| `SERVER_DOMAIN` | N/A | Base URL of facilitator | N/A |

## Next Steps

1. ✅ Set all environment variables in Railway
2. ✅ Wait for automatic redeployment
3. ✅ Check logs for successful startup
4. ✅ Test health endpoint
5. ✅ Test Self QR verification from frontend
6. ✅ Test payment flow end-to-end

---

**Last Updated**: October 21, 2025
**Deployed URL**: https://facilitator.selfx402.xyz
**Frontend URL**: https://pay.selfx402.xyz (or localhost:3000)
