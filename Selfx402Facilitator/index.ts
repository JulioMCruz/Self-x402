import express, { type Request, type Response } from "express";
import dotenv from "dotenv";
import { createWalletClient, createPublicClient, http, type Address, recoverTypedDataAddress, publicActions, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { verify, settle } from "x402/facilitator";
import { z } from "zod";
import { celo, celoSepolia } from "./config/chains.js";
import { CELO_MAINNET, CELO_SEPOLIA, getNetworkConfig, isSupportedNetwork } from "./config/networks.js";
import { USDC_ABI } from "./config/usdc-abi.js";
import { SelfVerificationService, type SelfRequirements } from "./services/SelfVerificationService.js";
import { DatabaseService } from "./services/DatabaseService.js";
import { SelfBackendVerifier , AllIds, DefaultConfigStore} from "@selfxyz/core"

dotenv.config();

// Initialize Supabase database service
let database: DatabaseService | undefined;
try {
  database = new DatabaseService();
  // Test connection on startup
  database.testConnection().then(connected => {
    if (!connected) {
      console.warn('⚠️  Database connection failed - running in memory-only mode');
      database = undefined;
    }
  }).catch(error => {
    console.error('❌ Database initialization error:', error);
    database = undefined;
  });
} catch (error) {
  console.error('❌ Failed to initialize database:', error);
  console.warn('⚠️  Running without database - nullifiers will not persist');
  database = undefined;
}

// Initialize Self verification service with database
const selfService = new SelfVerificationService(database);

const app = express();
const PORT = process.env.PORT || 3005;

// CORS Configuration - Allow requests from frontend
app.use((req, res, next) => {
  // Allow requests from localhost (development) and ngrok domain
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://codalabs.ngrok.io'
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Payment');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());

// Validation schemas
const PaymentPayloadSchema = z.object({
  scheme: z.literal("exact"),
  network: z.string(),
  x402Version: z.number(),
  payload: z.object({
    signature: z.string(),
    authorization: z.object({
      from: z.string(),
      to: z.string(),
      value: z.string(),
      validAfter: z.number(),
      validBefore: z.number(),
      nonce: z.string(),
    }),
  }),
});

const PaymentRequirementsSchema = z.object({
  scheme: z.literal("exact"),
  network: z.string(),
  asset: z.string(),
  payTo: z.string(),
  maxAmountRequired: z.string(),
  extra: z.object({}).optional(),
});

const VerifyRequestSchema = z.object({
  paymentPayload: PaymentPayloadSchema,
  paymentRequirements: PaymentRequirementsSchema,
});

const SettleRequestSchema = z.object({
  paymentPayload: PaymentPayloadSchema,
  paymentRequirements: PaymentRequirementsSchema,
});


const selfBackendVerifier = new SelfBackendVerifier(
  "self-x402-facilitator",
  "https://codalabs.ngrok.io/api/verify",
  false,
  AllIds,
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: [], //required countries
    ofac: false,
  }),
  "hex" // use 'hex' for ethereum address or 'uuid' for uuidv4
)

// Create wallet clients for both networks with public actions
// x402 library requires clients with both wallet and public actions
function createCeloWalletClient(network: "mainnet" | "sepolia") {
  const privateKey = network === "mainnet"
    ? process.env.CELO_MAINNET_PRIVATE_KEY
    : process.env.CELO_SEPOLIA_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error(`Missing private key for Celo ${network}`);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const chain = network === "mainnet" ? celo : celoSepolia;
  const rpcUrl = network === "mainnet"
    ? process.env.CELO_MAINNET_RPC_URL || "https://forno.celo.org"
    : process.env.CELO_SEPOLIA_RPC_URL || "https://celo-sepolia.g.alchemy.com";

  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  }).extend(publicActions);
}

// Main verification endpoint
app.post("/api/verify", async (req, res) => {
  try {

    console.log("********************************************************")
    console.log("📥 Self Protocol Verification Request")
    console.log("********************************************************")

    const { attestationId, proof, publicSignals, userContextData } = req.body

    console.log("📋 Request Body:", {
      hasAttestationId: !!attestationId,
      hasProof: !!proof,
      hasPublicSignals: !!publicSignals,
      hasUserContextData: !!userContextData,
      userContextData
    });

    if (!proof || !publicSignals || !attestationId || !userContextData) {
      console.error("❌ Missing required fields")
      return res.status(200).json({
        status: "error",
        result: false,
        reason: "Proof, publicSignals, attestationId and userContextData are required",
      })
    }

    console.log("🔍 Verification Details:")
    console.log("  - Attestation ID:", attestationId)
    console.log("  - Proof length:", JSON.stringify(proof).length, "chars")
    console.log("  - Public signals count:", publicSignals.length)
    console.log("  - User context data (vendor URL):", userContextData)

    // Fetch vendor's disclosure requirements from /.well-known/x402
    let vendorDisclosures: any = null
    try {
      const vendorUrl = userContextData // This should be the vendor URL from frontend
      console.log(`Fetching disclosure requirements from ${vendorUrl}/.well-known/x402...`)

      const discoveryResponse = await fetch(`${vendorUrl}/.well-known/x402`)
      if (discoveryResponse.ok) {
        const discoveryData = await discoveryResponse.json() as any
        vendorDisclosures = discoveryData.verification?.requirements
        console.log("Vendor disclosure requirements:", vendorDisclosures)
      } else {
        console.warn("Failed to fetch vendor disclosure requirements, using defaults")
      }
    } catch (error) {
      console.warn("Error fetching vendor disclosures, using defaults:", error)
    }

    // Create dynamic verifier with vendor's disclosure requirements
    const verifierConfig = vendorDisclosures || {
      minimumAge: 18,
      excludedCountries: [],
      ofac: false,
    }

    // Get scope and endpoint from environment variables
    const selfScope = process.env.SELF_SCOPE || "self-x402-facilitator";
    const selfEndpoint = process.env.SELF_ENDPOINT || `${process.env.SERVER_DOMAIN || "http://localhost:3005"}/api/verify`;

    console.log("Creating SelfBackendVerifier with config:", {
      scope: selfScope,
      endpoint: selfEndpoint,
      verifierConfig
    });

    const dynamicVerifier = new SelfBackendVerifier(
      selfScope,
      selfEndpoint,
      false,
      AllIds,
      new DefaultConfigStore(verifierConfig),
      "hex"
    )

    console.log("Verifying with SelfBackendVerifier...");

    var result: any;
    try {
     result = await dynamicVerifier.verify(
        attestationId,
        proof,
        publicSignals,
        userContextData
      );
    } catch (error) {
      console.error("❌ Verification Error:")
      console.error("  - Type:", error instanceof Error ? error.constructor.name : typeof error)
      console.error("  - Message:", error instanceof Error ? error.message : String(error))
      console.error("  - Stack:", error instanceof Error ? error.stack : "N/A")

      // Check if it's a scope mismatch error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Scope") || errorMessage.includes("scope")) {
        console.error("🔴 SCOPE MISMATCH DETECTED")
        console.error("  - Expected scope (backend):", selfScope)
        console.error("  - Endpoint (backend):", selfEndpoint)
        console.error("  - Frontend should use the same scope in SelfAppBuilder")
      }

      return res.status(200).json({
        status: "error",
        result: false,
        reason: error instanceof Error ? error.message : "Unknown error",
      })
    }

    console.log("Verification result:", result)

    const { isValid, isMinimumAgeValid } = result.isValidDetails;
    if (!isValid || !isMinimumAgeValid) {
      let reason = "Verification failed"
      if (!isMinimumAgeValid) reason = "Minimum age verification failed"
      // if (isOfacValid) reason = "OFAC verification failed"
      return res.status(200).json({
        status: "error",
        result: false,
        reason,
      })
    }

    return res.status(200).json({
      status: "success",
      result: true,
      message: 'Self verification successful',
      data: {
        userId: result.userId,
      },
    })
  } catch (error) {
    return res.status(200).json({
      status: "error",
      result: false,
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
})


// GET /supported - Returns supported payment kinds
app.get("/supported", (_req: Request, res: Response) => {
  res.json({
    x402Version: 1,
    kind: [
      {
        scheme: "exact",
        networkId: "celo",
        extra: {
          name: CELO_MAINNET.usdcName,
          version: "2",
        },
      },
    ],
  });
});

// POST /verify - Verifies a payment payload
app.post("/verify", async (req: Request, res: Response) => {
  try {
    const { paymentPayload, paymentRequirements } = VerifyRequestSchema.parse(req.body);

    // Only support Celo mainnet
    if (paymentRequirements.network !== "celo") {
      return res.status(400).json({
        isValid: false,
        invalidReason: "Only Celo mainnet is supported. Use network: 'celo'",
        payer: "",
      });
    }

    const walletClient = createCeloWalletClient("mainnet");

    // Verify the payment
    // Note: x402 library doesn't officially support Celo, but the underlying logic works
    const verifyResponse = await verify(
      walletClient,
      paymentPayload as any,
      paymentRequirements as any
    );

    res.json(verifyResponse);
  } catch (error) {
    console.error("Verification error:", error);
    res.status(400).json({
      isValid: false,
      invalidReason: error instanceof Error ? error.message : "Unknown error",
      payer: "",
    });
  }
});

// POST /verify-self - Validates Self Protocol proof only (no payment)
app.post("/verify-self", async (req: Request, res: Response) => {
  try {
    const { proof, requirements, attestationId, userContextData } = req.body;

    if (!proof || !requirements || !attestationId) {
      return res.status(400).json({
        valid: false,
        tier: 'unverified',
        error: "Missing required fields: proof, requirements, attestationId"
      });
    }

    // Validate Self proof
    const result = await selfService.verifyProof(
      proof,
      requirements as SelfRequirements,
      attestationId,
      userContextData
    );

    res.json(result);

  } catch (error) {
    console.error("Self verification error:", error);
    res.status(400).json({
      valid: false,
      tier: 'unverified',
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /verify-celo - Custom Celo-specific verification endpoint (with optional Self proof)
app.post("/verify-celo", async (req: Request, res: Response) => {
  try {
    const { authorization, signature, network, selfProof, selfRequirements, attestationId } = req.body;

    if (!authorization || !signature || !network) {
      return res.status(400).json({
        valid: false,
        tier: 'unverified',
        error: "Missing required fields: authorization, signature, network"
      });
    }

    // Support both Celo mainnet and sepolia
    if (network !== "celo" && network !== "celo-sepolia") {
      return res.status(400).json({
        valid: false,
        tier: 'unverified',
        error: "Unsupported network. Use 'celo' or 'celo-sepolia'"
      });
    }

    // Get network config
    const networkConfig = network === "celo" ? CELO_MAINNET : CELO_SEPOLIA;

    // Verify the EIP-712 signature manually
    const { from, to, value, validAfter, validBefore, nonce } = authorization;

    // Check validity window
    const now = Math.floor(Date.now() / 1000);
    if (now < validAfter || now > validBefore) {
      return res.json({
        valid: false,
        tier: 'unverified',
        error: "Payment authorization expired or not yet valid",
        payer: from
      });
    }

    // Create EIP-712 domain
    const domain = {
      name: networkConfig.usdcName,
      version: "2",
      chainId: networkConfig.chainId,
      verifyingContract: networkConfig.usdcAddress,
    };

    // Create EIP-712 message
    const types = {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    // IMPORTANT: Addresses must be checksummed for signature verification
    const message = {
      from: getAddress(from),
      to: getAddress(to),
      value: BigInt(value),
      validAfter: BigInt(validAfter),
      validBefore: BigInt(validBefore),
      nonce,
    };

    // Recover the signer address from the signature
    const recoveredAddress = await recoverTypedDataAddress({
      domain,
      types,
      primaryType: "TransferWithAuthorization",
      message,
      signature: signature as `0x${string}`,
    });

    // Check if the recovered address matches the 'from' address
    const isPaymentValid = recoveredAddress.toLowerCase() === from.toLowerCase();

    if (!isPaymentValid) {
      return res.json({
        valid: false,
        tier: 'unverified',
        payer: from,
        error: "Invalid payment signature - recovered address does not match"
      });
    }

    // If Self proof provided, verify it
    let tier: 'verified_human' | 'unverified' = 'unverified';
    let nullifier: string | undefined;
    let disclosedData: any;

    if (selfProof && selfRequirements && attestationId) {
      console.log('🔍 Verifying Self Protocol proof...');

      const selfResult = await selfService.verifyProof(
        selfProof,
        selfRequirements as SelfRequirements,
        attestationId
      );

      if (selfResult.valid) {
        tier = 'verified_human';
        nullifier = selfResult.nullifier;
        disclosedData = selfResult.disclosedData;
        console.log(`✅ Self verification passed (tier: ${tier})`);
      } else {
        console.log(`❌ Self verification failed: ${selfResult.error}`);
        // Payment valid but Self proof invalid - allow request but mark as unverified
      }
    }

    res.json({
      valid: true,
      tier,
      payer: from,
      nullifier,
      disclosedData,
      error: null
    });

  } catch (error) {
    console.error("Celo verification error:", error);
    res.status(400).json({
      valid: false,
      tier: 'unverified',
      error: error instanceof Error ? error.message : "Unknown error",
      payer: ""
    });
  }
});

// POST /settle-celo - Settles a Celo payment by executing transferWithAuthorization
app.post("/settle-celo", async (req: Request, res: Response) => {
  try {
    const { authorization, signature, network } = req.body;

    if (!authorization || !signature || !network) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: authorization, signature, network",
        transaction: "",
        payer: ""
      });
    }

    // Support both Celo mainnet and sepolia
    if (network !== "celo" && network !== "celo-sepolia") {
      return res.status(400).json({
        success: false,
        error: "Unsupported network. Use 'celo' or 'celo-sepolia'",
        transaction: "",
        payer: ""
      });
    }

    // Get network config
    const networkConfig = network === "celo" ? CELO_MAINNET : CELO_SEPOLIA;

    // Get wallet client with facilitator's private key (acts as relayer)
    const walletClient = createCeloWalletClient(network === "celo" ? "mainnet" : "sepolia");

    console.log(`🔄 Settling payment on ${networkConfig.name}...`);
    console.log(`   From: ${authorization.from}`);
    console.log(`   To: ${authorization.to}`);
    console.log(`   Amount: ${authorization.value} (${Number(authorization.value) / 1_000_000} USDC)`);

    // Execute transferWithAuthorization on USDC contract
    // IMPORTANT: Addresses must be checksummed
    const hash = await walletClient.writeContract({
      address: networkConfig.usdcAddress,
      abi: USDC_ABI,
      functionName: "transferWithAuthorization",
      args: [
        getAddress(authorization.from),
        getAddress(authorization.to),
        BigInt(authorization.value),
        BigInt(authorization.validAfter),
        BigInt(authorization.validBefore),
        authorization.nonce as `0x${string}`,
        signature as `0x${string}`
      ]
    });

    console.log(`✅ Transaction submitted: ${hash}`);
    console.log(`   Explorer: ${networkConfig.blockExplorer}/tx/${hash}`);

    // Wait for transaction confirmation using public client
    const publicClient = createPublicClient({
      chain: network === "celo" ? celo : celoSepolia,
      transport: http(networkConfig.rpcUrl)
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    res.json({
      success: true,
      transaction: hash,
      blockNumber: receipt.blockNumber.toString(),
      network: networkConfig.name,
      payer: authorization.from,
      explorer: `${networkConfig.blockExplorer}/tx/${hash}`
    });

  } catch (error) {
    console.error("Celo settlement error:", error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      transaction: "",
      payer: ""
    });
  }
});

// POST /settle - Settles a verified payment
app.post("/settle", async (req: Request, res: Response) => {
  try {
    const { paymentPayload, paymentRequirements } = SettleRequestSchema.parse(req.body);

    // Only support Celo mainnet
    if (paymentRequirements.network !== "celo") {
      return res.status(400).json({
        success: false,
        errorReason: "Only Celo mainnet is supported. Use network: 'celo'",
        transaction: "",
        network: paymentRequirements.network,
        payer: "",
      });
    }

    const walletClient = createCeloWalletClient("mainnet");

    // Settle the payment
    // Note: x402 library doesn't officially support Celo, but the underlying logic works
    const settleResponse = await settle(
      walletClient,
      paymentPayload as any,
      paymentRequirements as any
    );

    res.json(settleResponse);
  } catch (error) {
    console.error("Settlement error:", error);
    res.status(400).json({
      success: false,
      errorReason: error instanceof Error ? error.message : "Unknown error",
      transaction: "",
      network: req.body.paymentRequirements?.network || "",
      payer: "",
    });
  }
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    network: {
      name: "Celo Mainnet",
      chainId: CELO_MAINNET.chainId,
      usdc: CELO_MAINNET.usdcAddress,
      rpcUrl: CELO_MAINNET.rpcUrl,
      explorer: CELO_MAINNET.blockExplorer,
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Celo x402 Facilitator running on port ${PORT}`);
  console.log(`📡 Network: Celo Mainnet (Chain ID: ${CELO_MAINNET.chainId})`);
  console.log(`💵 USDC: ${CELO_MAINNET.usdcAddress}`);
  console.log(`🔐 Self Protocol: Enabled (proof-of-unique-human verification)`);
  console.log(`💾 Database: ${database ? 'Supabase (connected)' : 'In-memory mode'}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /supported     - x402 supported payment kinds`);
  console.log(`  POST /verify        - x402 standard payment verification`);
  console.log(`  POST /verify-celo   - Celo payment + Self verification`);
  console.log(`  POST /verify-self   - Self Protocol proof validation`);
  console.log(`  POST /settle        - x402 standard payment settlement`);
  console.log(`  POST /settle-celo   - Celo payment settlement`);
  console.log(`  POST /api/verify    - Self QR verification endpoint`);
  console.log(`  GET  /health        - Health check`);
});
