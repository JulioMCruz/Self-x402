/**
 * X402 Payment Flow Test
 *
 * Tests the complete x402 payment flow:
 * 1. Request protected endpoint without payment (expect 402)
 * 2. Get payment requirements
 * 3. Create transferWithAuthorization signature
 * 4. Retry request with X-Payment header
 * 5. Verify successful response
 */

import { createWalletClient, http, parseUnits, encodeFunctionData, hexToSignature } from 'viem';
import { celoAlfajores } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Test wallet (DO NOT USE IN PRODUCTION - for testing only)
// Load from environment variable or use Hardhat default test key
const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat default test key #1

// API Configuration
const API_BASE_URL = 'http://localhost:54112';
const PROTECTED_ENDPOINT = '/api/demo';

// USDC Contract ABI for transferWithAuthorization
const USDC_ABI = [
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'signature', type: 'bytes' }
    ],
    name: 'transferWithAuthorization',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

async function testX402PaymentFlow() {
  console.log('🧪 Starting X402 Payment Flow Test\n');

  try {
    // Step 1: Request protected endpoint without payment
    console.log('📍 Step 1: Request protected endpoint without payment');
    const initialResponse = await fetch(`${API_BASE_URL}${PROTECTED_ENDPOINT}`);

    if (initialResponse.status !== 402) {
      throw new Error(`Expected 402, got ${initialResponse.status}`);
    }

    const paymentRequirements = await initialResponse.json();
    console.log('✅ Received 402 Payment Required');
    console.log('💰 Payment requirements:', JSON.stringify(paymentRequirements, null, 2));

    // Step 2: Extract payment details
    console.log('\n📍 Step 2: Extract payment details');
    const { price, network, payTo } = paymentRequirements.details;
    const priceInCents = parseFloat(price) * 100; // Convert to cents
    const amountInUSDC = parseUnits(price, 6); // USDC has 6 decimals

    console.log(`💵 Price: $${price} (${amountInUSDC} USDC units)`);
    console.log(`🌐 Network: ${network}`);
    console.log(`💳 Pay to: ${payTo}`);

    // Step 3: Create wallet client
    console.log('\n📍 Step 3: Create wallet client');
    const account = privateKeyToAccount(TEST_PRIVATE_KEY);
    const walletClient = createWalletClient({
      account,
      chain: celoAlfajores,
      transport: http()
    });

    console.log(`👤 Wallet address: ${account.address}`);

    // Step 4: Generate nonce and validity window
    console.log('\n📍 Step 4: Generate payment parameters');
    const nonce = `0x${Buffer.from(Date.now().toString()).toString('hex').padStart(64, '0')}`;
    const validAfter = Math.floor(Date.now() / 1000) - 60; // Valid from 1 minute ago
    const validBefore = Math.floor(Date.now() / 1000) + 3600; // Valid for 1 hour

    console.log(`🔐 Nonce: ${nonce.substring(0, 20)}...`);
    console.log(`⏰ Valid from: ${new Date(validAfter * 1000).toISOString()}`);
    console.log(`⏰ Valid until: ${new Date(validBefore * 1000).toISOString()}`);

    // Step 5: Create EIP-712 signature for transferWithAuthorization
    console.log('\n📍 Step 5: Sign transferWithAuthorization');

    // Get USDC address for network
    const USDC_ADDRESSES: Record<string, string> = {
      'celo-mainnet': '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
      'celo-sepolia': '0x01C5C0122039549AD1493B8220cABEdD739BC44E'
    };

    const usdcAddress = USDC_ADDRESSES[network];
    if (!usdcAddress) {
      throw new Error(`Unknown network: ${network}`);
    }

    console.log(`💎 USDC Contract: ${usdcAddress}`);

    // EIP-712 Domain
    const domain = {
      name: 'USD Coin',
      version: '2',
      chainId: network === 'celo-mainnet' ? 42220 : 11142220,
      verifyingContract: usdcAddress as `0x${string}`
    };

    // EIP-712 Types
    const types = {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' }
      ]
    };

    // Message to sign
    const message = {
      from: account.address,
      to: payTo as `0x${string}`,
      value: amountInUSDC,
      validAfter: BigInt(validAfter),
      validBefore: BigInt(validBefore),
      nonce: nonce as `0x${string}`
    };

    // Sign the message
    const signature = await walletClient.signTypedData({
      account,
      domain,
      types,
      primaryType: 'TransferWithAuthorization',
      message
    });

    console.log(`✍️  Signature: ${signature.substring(0, 20)}...`);

    // Step 6: Create X-Payment header (PaymentEnvelope format)
    console.log('\n📍 Step 6: Create X-Payment header');
    const paymentEnvelope = {
      network,
      authorization: {
        from: account.address,
        to: payTo,
        value: amountInUSDC.toString(),
        validAfter,
        validBefore,
        nonce
      },
      signature
    };

    const xPaymentHeader = JSON.stringify(paymentEnvelope);
    console.log(`📦 X-Payment header created (${xPaymentHeader.length} bytes)`);

    // Step 7: Retry request with payment
    console.log('\n📍 Step 7: Retry request with X-Payment header');
    const paidResponse = await fetch(`${API_BASE_URL}${PROTECTED_ENDPOINT}`, {
      headers: {
        'X-Payment': xPaymentHeader
      }
    });

    console.log(`📡 Response status: ${paidResponse.status}`);

    if (paidResponse.status === 200) {
      const data = await paidResponse.json();
      console.log('✅ Payment successful! Resource delivered:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const error = await paidResponse.text();
      console.log('❌ Payment failed:');
      console.log(error);
    }

    console.log('\n🎉 X402 Payment Flow Test Complete!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testX402PaymentFlow()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
