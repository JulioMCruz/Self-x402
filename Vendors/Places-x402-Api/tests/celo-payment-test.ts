/**
 * Celo x402 Payment Test
 *
 * Tests the complete payment flow with CeloFacilitator:
 * 1. Generates payment envelope signed with test wallet
 * 2. Sends request to protected /api/demo endpoint
 * 3. Verifies payment through CeloFacilitator
 * 4. Receives demo data response
 */

import { config } from 'dotenv';
import { createWalletClient, http, parseUnits, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celoAlfajores, celo } from 'viem/chains';
import axios from 'axios';

// Load test environment variables
config({ path: 'test-env.local' });

// Celo Sepolia chain configuration
const celoSepolia = {
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  network: 'celo-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: ['https://alfajores-forno.celo-testnet.org'],
    },
    public: {
      http: ['https://alfajores-forno.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: { name: 'CeloScan', url: 'https://celo-sepolia.blockscout.com' },
  },
  testnet: true,
} as const;

// USDC contract address on Celo Sepolia
const USDC_ADDRESS = '0x01C5C0122039549AD1493B8220cABEdD739BC44E' as Address;

// EIP-712 domain for USDC transferWithAuthorization
const EIP712_DOMAIN = {
  name: 'USD Coin',
  version: '2',
  chainId: celoSepolia.id,
  verifyingContract: USDC_ADDRESS,
} as const;

// EIP-712 types for transferWithAuthorization
const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

interface TestConfig {
  privateKey: Address;
  walletAddress: Address;
  apiBaseUrl: string;
  facilitatorUrl: string;
  paymentAmountUsd: string;
  network: string;
}

function loadTestConfig(): TestConfig {
  const privateKey = process.env.TEST_WALLET_PRIVATE_KEY as Address;
  const walletAddress = process.env.TEST_WALLET_ADDRESS as Address;
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:54112';
  const facilitatorUrl = process.env.FACILITATOR_URL || 'http://localhost:3005';
  const paymentAmountUsd = process.env.PAYMENT_AMOUNT_USD || '0.001';
  const network = process.env.NETWORK || 'celo-sepolia';

  if (!privateKey || privateKey === '0xYourPrivateKeyHere') {
    throw new Error('❌ TEST_WALLET_PRIVATE_KEY not set in test-env.local');
  }

  if (!walletAddress || walletAddress === '0xYourWalletAddressHere') {
    throw new Error('❌ TEST_WALLET_ADDRESS not set in test-env.local');
  }

  return {
    privateKey,
    walletAddress,
    apiBaseUrl,
    facilitatorUrl,
    paymentAmountUsd,
    network,
  };
}

async function testCeloPayment() {
  console.log('🧪 Starting Celo x402 Payment Test\n');

  try {
    // Load configuration
    const config = loadTestConfig();
    console.log('✅ Configuration loaded:');
    console.log(`   Network: ${config.network}`);
    console.log(`   Wallet: ${config.walletAddress}`);
    console.log(`   API: ${config.apiBaseUrl}`);
    console.log(`   Facilitator: ${config.facilitatorUrl}`);
    console.log(`   Amount: $${config.paymentAmountUsd}\n`);

    // Create wallet client
    const account = privateKeyToAccount(config.privateKey);
    const walletClient = createWalletClient({
      account,
      chain: celoSepolia,
      transport: http(),
    });

    console.log('✅ Wallet client created\n');

    // Step 1: Get payment requirements from API
    console.log('📋 Step 1: Fetching payment requirements from /.well-known/x402...');
    const discoveryResponse = await axios.get(`${config.apiBaseUrl}/.well-known/x402`);
    const { payTo, routes } = discoveryResponse.data;

    console.log(`   PayTo address: ${payTo}`);
    console.log(`   Available routes: ${Object.keys(routes).length}\n`);

    // Step 2: Prepare payment envelope
    console.log('📝 Step 2: Preparing payment envelope...');

    const route = routes['GET /api/demo'];
    if (!route) {
      throw new Error('❌ Route GET /api/demo not found in discovery');
    }

    const priceValue = route.price.toString().replace("$", "");
    const amountInUSDC = parseUnits(priceValue, 6); // USDC has 6 decimals
    const validAfter = 0n;
    const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600); // Valid for 1 hour
    const nonce = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}` as Address;

    console.log(`   Amount: ${amountInUSDC} (${route.price} USDC)`);
    console.log(`   Valid until: ${new Date(Number(validBefore) * 1000).toISOString()}`);
    console.log(`   Nonce: ${nonce.slice(0, 10)}...\n`);

    // Step 3: Sign the payment authorization
    console.log('✍️  Step 3: Signing payment authorization...');

    const signature = await walletClient.signTypedData({
      account,
      domain: EIP712_DOMAIN,
      types: TRANSFER_WITH_AUTHORIZATION_TYPES,
      primaryType: 'TransferWithAuthorization',
      message: {
        from: config.walletAddress,
        to: payTo as Address,
        value: amountInUSDC,
        validAfter,
        validBefore,
        nonce,
      },
    });

    console.log(`   Signature: ${signature.slice(0, 20)}...\n`);

    // Step 4: Create x402 payment envelope
    console.log('📦 Step 4: Creating x402 payment envelope...');

    const paymentEnvelope = {
      network: config.network,
      authorization: {
        from: config.walletAddress,
        to: payTo,
        value: amountInUSDC.toString(),
        validAfter: Number(validAfter),
        validBefore: Number(validBefore),
        nonce,
      },
      signature,
    };

    console.log('   Envelope created ✓\n');

    // Step 5: Make payment request to API
    console.log('💳 Step 5: Sending payment request to /api/demo...');

    const startTime = Date.now();
    const response = await axios.get(`${config.apiBaseUrl}/api/demo`, {
      headers: {
        'x-payment': JSON.stringify(paymentEnvelope),
        'Content-Type': 'application/json',
      },
    });
    const endTime = Date.now();

    console.log(`   Response time: ${endTime - startTime}ms`);
    console.log(`   Status: ${response.status}\n`);

    // Step 6: Verify response
    console.log('✅ Step 6: Verifying response...');

    if (response.status === 200) {
      console.log('   ✓ Payment accepted!');
      console.log('   ✓ Demo data received:\n');
      console.log(JSON.stringify(response.data, null, 2));

      // Verify response structure
      if (response.data.network && response.data.chainId && response.data.metadata) {
        console.log('\n✅ Response structure validated ✓');
        console.log(`   Network: ${response.data.network}`);
        console.log(`   Chain ID: ${response.data.chainId}`);
        console.log(`   USDC: ${response.data.usdc}`);
        console.log(`   Cost: $${response.data.metadata.cost}`);
        console.log(`   Facilitator: ${response.data.metadata.facilitator}`);
      }

      console.log('\n🎉 TEST PASSED - Payment flow completed successfully!\n');
      return true;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }

  } catch (error: any) {
    console.error('\n❌ TEST FAILED\n');

    if (error.response) {
      console.error('API Error Response:');
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Data:`, error.response.data);
    } else if (error.request) {
      console.error('No response received from API');
      console.error('  Make sure both services are running:');
      console.error('  1. CeloFacilitator on port 3005');
      console.error('  2. Celo-x402-Api on port 54112');
    } else {
      console.error('Error:', error.message);
    }

    throw error;
  }
}

// Run test
testCeloPayment()
  .then(() => {
    console.log('✅ All tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
