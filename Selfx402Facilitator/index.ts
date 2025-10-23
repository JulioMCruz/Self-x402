/**
 * Selfx402 Facilitator
 *
 * Using selfx402-framework for x402 payment verification and settlement
 * with Self Protocol integration for proof-of-unique-human verification
 */

import express, { type Request, type Response } from "express";
import dotenv from "dotenv";
import { z } from "zod";
import { getAddress } from "viem";

// Framework imports
import { Facilitator, createWalletClient } from "selfx402-framework";
import { CELO_MAINNET, CELO_SEPOLIA } from "selfx402-framework/networks";
import {
  SelfVerifier,
  DatabaseService,
  SelfBackendVerifier,
  AllIds,
  DefaultConfigStore,
  VerificationSessionsService,
} from "selfx402-framework/self";
import { VoucherDatabaseService } from "selfx402-framework";
import type { PaymentEnvelope } from "selfx402-framework/core";

// Deferred payment routes
import deferredRoutes, { initializeDeferredRoutes } from "./routes/deferred.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Initialize Database Service (Supabase)
let database: DatabaseService | undefined;
let voucherDatabase: VoucherDatabaseService | undefined;
let verificationSessionsService: VerificationSessionsService | undefined;

try {
  // Initialize Self Protocol database
  database = new DatabaseService({
    url: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  });

  database.testConnection().then(connected => {
    if (!connected) {
      console.warn('⚠️  Database connection failed - running in memory-only mode');
      database = undefined;
    }
  }).catch(error => {
    console.error('❌ Database initialization error:', error);
    database = undefined;
  });

  // Initialize Voucher database (for deferred payments)
  voucherDatabase = new VoucherDatabaseService({
    url: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  });
  console.log('✅ Voucher database initialized (deferred payments)');

  // Initialize Verification Sessions service (for deep link polling)
  verificationSessionsService = new VerificationSessionsService(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  console.log('✅ Verification sessions service initialized (deep link polling)');
} catch (error) {
  console.error('❌ Failed to initialize database:', error);
  console.warn('⚠️  Running without database - nullifiers and vouchers will not persist');
  database = undefined;
  voucherDatabase = undefined;
  verificationSessionsService = undefined;
}

// Initialize Self Protocol Verifier
const selfVerifier = new SelfVerifier(
  {
    scope: process.env.SELF_SCOPE || "self-x402-facilitator",
    minimumAge: 18,
    excludedCountries: [],
    ofac: false,
    endpoint: process.env.SELF_ENDPOINT || `${process.env.SERVER_DOMAIN || "http://localhost:3005"}/api/verify`,
  },
  database
);

// Create wallet clients using framework
const celoMainnetWallet = createWalletClient({
  privateKey: process.env.CELO_MAINNET_PRIVATE_KEY as `0x${string}`,
  network: CELO_MAINNET,
});

const celoSepoliaWallet = createWalletClient({
  privateKey: process.env.CELO_SEPOLIA_PRIVATE_KEY as `0x${string}`,
  network: CELO_SEPOLIA,
});

// Create facilitators using framework
const celoMainnetFacilitator = new Facilitator({
  network: CELO_MAINNET,
  wallet: celoMainnetWallet,
  selfVerifier,
  enableSelfProtocol: true,
});

const celoSepoliaFacilitator = new Facilitator({
  network: CELO_SEPOLIA,
  wallet: celoSepoliaWallet,
  selfVerifier,
  enableSelfProtocol: true,
});

// Request logging middleware - FIRST
app.use((req, res, next) => {
  console.log(`\n🌐 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log(`   Origin: ${req.headers.origin || 'none'}`);
  console.log(`   IP: ${req.ip}`);
  next();
});

// CORS Configuration
app.use((req, res, next) => {
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

  if (req.method === 'OPTIONS') {
    console.log(`   ✅ OPTIONS preflight for ${req.path}`);
    return res.status(200).end();
  }

  next();
});

app.use(express.json());

// Mount deferred payment routes (if voucher database is available)
if (voucherDatabase) {
  app.use('/deferred', initializeDeferredRoutes(voucherDatabase, {
    celo: celoMainnetFacilitator,
    celoSepolia: celoSepoliaFacilitator,
  }));
  console.log('✅ Deferred payment routes mounted at /deferred');
} else {
  console.warn('⚠️  Deferred payment routes not available (database required)');
}

// Validation schemas (x402 standard)
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

// Legacy SelfBackendVerifier for /api/verify endpoint
const selfBackendVerifier = new SelfBackendVerifier(
  "self-x402-facilitator",
  "https://codalabs.ngrok.io/api/verify",
  false,
  AllIds,
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: [],
    ofac: false,
  }),
  "hex"
);

// GET /supported - Returns supported payment kinds
app.get("/supported", (_req: Request, res: Response) => {
  const supportedKinds = [
    {
      scheme: "exact",
      networkId: "celo",
      extra: {
        name: CELO_MAINNET.usdcName,
        version: "2",
      },
    },
  ];

  // Add deferred scheme if voucher database is available
  // x402 PR #426 compliance: Enhanced metadata for deferred payments
  if (voucherDatabase) {
    supportedKinds.push({
      scheme: "deferred",
      networkId: "celo",
      extra: {
        name: CELO_MAINNET.usdcName,
        version: "2",
        description: "x402 PR #426 - Deferred payment with voucher aggregation for micro-payment optimization",

        // Settlement thresholds
        minSettlementAmount: "10000000", // $10 USDC (6 decimals)
        minVoucherCount: 5,

        // Voucher configuration
        maxVoucherValiditySeconds: 3600, // 1 hour default validity
        voucherExpirationGracePeriod: 300, // 5 minutes grace period

        // Endpoints
        endpoints: {
          verify: "/deferred/verify",
          settle: "/deferred/settle",
          balance: "/deferred/balance/:payee"
        },

        // Capabilities
        features: [
          "off_chain_voucher_storage",
          "batch_settlement",
          "eip712_signatures",
          "eip3009_settlement",
          "automatic_aggregation",
          "nullifier_tracking"
        ],

        // Gas savings estimate
        gasSavings: {
          description: "Reduces gas overhead from ~2000% (1000 individual tx) to ~2% (1 batch tx)",
          estimatedCostPerVoucher: "0.00002", // $0.02 gas / 1000 vouchers
          breakEvenVoucherCount: 1
        },

        // Rate limits (for future implementation)
        rateLimits: {
          vouchersPerHour: 1000,
          settlementsPerDay: 100
        }
      },
    } as any);
  }

  res.json({
    x402Version: 1,
    kind: supportedKinds,
  });
});

// POST /api/verify - Self Protocol QR verification endpoint
app.post("/api/verify", async (req, res) => {
  // Declare sessionId in outer scope for catch block access
  let sessionId: string | null = null;

  // Log IMMEDIATELY when request is received (before any processing)
  console.log("\n\n");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🔵 /api/verify ENDPOINT HIT - " + new Date().toISOString());
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📍 Request received from:", req.ip);
  console.log("📡 Request headers:", JSON.stringify(req.headers, null, 2));
  console.log("📦 Raw request body:", JSON.stringify(req.body, null, 2));
  console.log("═══════════════════════════════════════════════════════════");

  try {
    console.log("********************************************************");
    console.log("📥 Self Protocol Verification Request");
    console.log("********************************************************");

    const { attestationId, proof, publicSignals, userContextData } = req.body;

    console.log("📋 Request Body:", {
      hasAttestationId: !!attestationId,
      hasProof: !!proof,
      hasPublicSignals: !!publicSignals,
      hasUserContextData: !!userContextData,
      userContextData
    });

    if (!proof || !publicSignals || !attestationId || !userContextData) {
      console.error("❌ Missing required fields");
      return res.status(200).json({
        status: "error",
        result: false,
        reason: "Proof, publicSignals, attestationId and userContextData are required",
      });
    }

    console.log("🔍 Verification Details:");
    console.log("  - Attestation ID:", attestationId);
    console.log("  - Proof length:", JSON.stringify(proof).length, "chars");
    console.log("  - Public signals count:", publicSignals.length);
    console.log("  - Raw userContextData:", userContextData);
    console.log("  - userContextData type:", typeof userContextData);

    // CRITICAL: Self Protocol sends userContextData as hex-encoded bytes
    // Format: Starts with length prefix + padding, then the actual hex-encoded UTF-8 string
    // We need to extract just the readable UTF-8 portion
    let decodedUserContextData: string;

    if (typeof userContextData === 'string') {
      // Remove '0x' prefix if present
      const hexString = userContextData.startsWith('0x') ? userContextData.slice(2) : userContextData;

      // Check if this looks like hex (all chars are 0-9a-f)
      const isHex = /^[0-9a-f]+$/i.test(hexString);

      if (isHex && hexString.length > 0) {
        console.log("🔧 Decoding hex userContextData (length:", hexString.length, "chars)...");

        try {
          // Decode hex to bytes
          const bytes = Buffer.from(hexString, 'hex');
          console.log("  - Decoded to", bytes.length, "bytes");

          // Find the start of readable ASCII/UTF-8 text (skip padding/length prefix)
          // Look for the first sequence of printable ASCII characters
          let textStart = 0;
          for (let i = 0; i < bytes.length - 4; i++) {
            // Check if we have at least 4 consecutive printable ASCII chars (likely start of UUID/URL)
            const isPrintable = bytes[i] >= 0x20 && bytes[i] <= 0x7E;
            const nextIsPrintable = bytes[i+1] >= 0x20 && bytes[i+1] <= 0x7E;
            const next2IsPrintable = bytes[i+2] >= 0x20 && bytes[i+2] <= 0x7E;
            const next3IsPrintable = bytes[i+3] >= 0x20 && bytes[i+3] <= 0x7E;

            if (isPrintable && nextIsPrintable && next2IsPrintable && next3IsPrintable) {
              textStart = i;
              break;
            }
          }

          // Extract the text portion
          const textBytes = bytes.slice(textStart);
          const rawText = textBytes.toString('utf8');

          // Clean up: remove null bytes and non-printable characters
          decodedUserContextData = rawText.replace(/\0/g, '').replace(/[^\x20-\x7E]/g, '');
          console.log("✅ Decoded userContextData:", decodedUserContextData);

        } catch (error) {
          console.warn("⚠️  Hex decode failed, using raw value:", error);
          decodedUserContextData = userContextData;
        }
      } else {
        // Already a plain string (testing mode or legacy)
        decodedUserContextData = userContextData;
        console.log("ℹ️  Using plain string userContextData (no decoding needed)");
      }
    } else {
      decodedUserContextData = String(userContextData);
      console.log("⚠️  Converting non-string userContextData to string");
    }

    // Parse decodedUserContextData (simple string format)
    // Format: "sessionId:vendorUrl" for deep link polling, or just "vendorUrl" for QR-only
    let vendorUrl: string;

    if (decodedUserContextData.includes(':')) {
      // Deep link polling format: "sessionId:vendorUrl"
      const parts = decodedUserContextData.split(':');
      sessionId = parts[0]; // Update outer scope variable
      vendorUrl = parts.slice(1).join(':'); // Handle URLs with colons (http://)
      console.log("  - Session-based verification (deep link polling)");
      console.log("  - Session ID:", sessionId);
      console.log("  - Vendor URL:", vendorUrl);
    } else {
      // Legacy QR code flow: just vendor URL
      vendorUrl = decodedUserContextData;
      console.log("  - Legacy verification (QR code flow)");
      console.log("  - Vendor URL:", vendorUrl);
    }

    // Fetch vendor's disclosure requirements from /.well-known/x402 FIRST
    let vendorDisclosures: any = null;
    try {
      console.log(`🔍 Fetching disclosure requirements from ${vendorUrl}/.well-known/x402...`);

      const discoveryResponse = await fetch(`${vendorUrl}/.well-known/x402`);
      if (discoveryResponse.ok) {
        const discoveryData = await discoveryResponse.json() as any;
        vendorDisclosures = discoveryData.verification?.requirements;
        console.log("✅ Vendor disclosure requirements:", vendorDisclosures);
      } else {
        console.warn("⚠️  Failed to fetch vendor disclosure requirements, using defaults");
      }
    } catch (error) {
      console.warn("⚠️  Error fetching vendor disclosures, using defaults:", error);
    }

    // Create verification session if session ID provided and service available
    if (sessionId && verificationSessionsService) {
      console.log("📝 Creating verification session in database...");
      console.log("   Session ID:", sessionId);
      console.log("   Vendor URL:", vendorUrl);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      const session = await verificationSessionsService.createSession({
        session_id: sessionId,
        vendor_url: vendorUrl,
        wallet_address: '', // Not needed for verification
        api_endpoint: '', // Not needed for verification
        network: 'celo',
        disclosures: vendorDisclosures || {},
        verified: false,
        expires_at: expiresAt.toISOString(),
      });

      if (session) {
        console.log("✅ Session created successfully (ID:", session.id, ")");
      } else {
        console.warn("⚠️  Failed to create session in database");
      }
    } else {
      console.log("ℹ️  Session creation skipped:");
      console.log("   - Has session ID:", !!sessionId);
      console.log("   - Has service:", !!verificationSessionsService);
    }

    // Create dynamic verifier with vendor's disclosure requirements
    const verifierConfig = vendorDisclosures || {
      minimumAge: 18,
      excludedCountries: [],
      ofac: false,
    };

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
    );

    console.log("Verifying with SelfBackendVerifier...");
    console.log("🔑 Verification parameters:");
    console.log("  - attestationId:", attestationId);
    console.log("  - proof type:", typeof proof);
    console.log("  - publicSignals type:", typeof publicSignals);
    console.log("  - userContextData (raw):", userContextData);
    console.log("  - userContextData type:", typeof userContextData);

    let result: any;
    try {
      result = await dynamicVerifier.verify(
        attestationId,
        proof,
        publicSignals,
        userContextData
      );
    } catch (error) {
      console.error("❌ Verification Error:");
      console.error("  - Type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("  - Message:", error instanceof Error ? error.message : String(error));
      console.error("  - Stack:", error instanceof Error ? error.stack : "N/A");
      console.error("  - Full error object:", JSON.stringify(error, null, 2));

      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Scope") || errorMessage.includes("scope")) {
        console.error("🔴 SCOPE MISMATCH DETECTED");
        console.error("  - Expected scope (backend):", selfScope);
        console.error("  - Endpoint (backend):", selfEndpoint);
        console.error("  - Frontend should use the same scope in SelfAppBuilder");
      }

      return res.status(200).json({
        status: "error",
        result: false,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }

    console.log("Verification result:", result);

    const { isValid, isMinimumAgeValid } = result.isValidDetails;
    if (!isValid || !isMinimumAgeValid) {
      let reason = "Verification failed";
      if (!isMinimumAgeValid) reason = "Minimum age verification failed";

      // Update session with failed verification if session ID provided
      if (sessionId && verificationSessionsService) {
        await verificationSessionsService.updateSessionVerified(
          sessionId,
          false,
          undefined,
          { error: reason }
        );
      }

      return res.status(200).json({
        status: "error",
        result: false,
        reason,
      });
    }

    // Update session with successful verification results if session ID provided
    if (sessionId && verificationSessionsService) {
      console.log("📝 Updating session with verification results...");

      const disclosureResults = {
        ageValid: isMinimumAgeValid,
        userId: result.userId,
        verifiedAt: new Date().toISOString(),
      };

      const updated = await verificationSessionsService.updateSessionVerified(
        sessionId,
        true,
        result.nullifier,
        disclosureResults,
        { proof, publicSignals, attestationId }
      );

      if (updated) {
        console.log("✅ Session updated with verification results");
      } else {
        console.warn("⚠️  Failed to update session");
      }
    }

    return res.status(200).json({
      status: "success",
      result: true,
      message: 'Self verification successful',
      data: {
        userId: result.userId,
        sessionId: sessionId || undefined,
      },
    });
  } catch (error) {
    // Update session with error if session ID provided
    if (sessionId && verificationSessionsService) {
      await verificationSessionsService.updateSessionVerified(
        sessionId,
        false,
        undefined,
        { error: error instanceof Error ? error.message : "Unknown error" }
      );
    }

    return res.status(200).json({
      status: "error",
      result: false,
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// DEBUG: Get all recent sessions (temporary for debugging)
app.get("/debug/sessions", async (_req: Request, res: Response) => {
  if (!verificationSessionsService) {
    return res.json({ error: "Database not available" });
  }

  try {
    const { data, error } = await (verificationSessionsService as any).supabase
      .from("verification_sessions")
      .select("session_id, vendor_url, verified, created_at, expires_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return res.json({ error: error.message });
    }

    res.json({ sessions: data, count: data?.length || 0 });
  } catch (error) {
    res.json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// GET /verify-status/:sessionId - Polling endpoint for deep link verification
app.get("/verify-status/:sessionId", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    console.log("\n🔍 [Polling] GET /verify-status/" + sessionId);
    console.log("   Origin:", req.headers.origin);
    console.log("   IP:", req.ip);

    if (!verificationSessionsService) {
      console.log("   ⚠️  Database service not available");
      return res.status(503).json({
        verified: false,
        pending: true,
        message: "Verification sessions service not available (database required)",
      });
    }

    const status = await verificationSessionsService.getVerificationStatus(sessionId);

    console.log("   📊 Status:", {
      verified: status.verified,
      pending: status.pending,
      expired: status.expired,
      hasNullifier: !!status.nullifier
    });

    res.json(status);
  } catch (error) {
    console.error("   ❌ Verification status error:", error);
    res.status(500).json({
      verified: false,
      pending: true,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /verify - x402 standard payment verification (using framework)
app.post("/verify", async (req: Request, res: Response) => {
  try {
    const { paymentPayload, paymentRequirements } = VerifyRequestSchema.parse(req.body);

    if (paymentRequirements.network !== "celo") {
      return res.status(400).json({
        isValid: false,
        invalidReason: "Only Celo mainnet is supported. Use network: 'celo'",
        payer: "",
      });
    }

    // Create payment envelope from x402 standard format
    const envelope: PaymentEnvelope = {
      network: paymentRequirements.network,
      authorization: {
        from: paymentPayload.payload.authorization.from as `0x${string}`,
        to: paymentPayload.payload.authorization.to as `0x${string}`,
        value: paymentPayload.payload.authorization.value,
        validAfter: paymentPayload.payload.authorization.validAfter,
        validBefore: paymentPayload.payload.authorization.validBefore,
        nonce: paymentPayload.payload.authorization.nonce as `0x${string}`,
      },
      signature: paymentPayload.payload.signature as `0x${string}`,
    };

    // Verify using framework
    const verification = await celoMainnetFacilitator.verifyPayment(
      envelope,
      getAddress(paymentRequirements.payTo),
      paymentRequirements.maxAmountRequired
    );

    if (!verification.valid) {
      return res.status(400).json({
        isValid: false,
        invalidReason: verification.error || "Payment verification failed",
        payer: envelope.authorization.from,
      });
    }

    res.json({
      isValid: true,
      payer: verification.recoveredAddress,
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(400).json({
      isValid: false,
      invalidReason: error instanceof Error ? error.message : "Unknown error",
      payer: "",
    });
  }
});

// POST /verify-celo - Framework-based Celo verification
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

    if (network !== "celo" && network !== "celo-sepolia") {
      return res.status(400).json({
        valid: false,
        tier: 'unverified',
        error: "Unsupported network. Use 'celo' or 'celo-sepolia'"
      });
    }

    // Select facilitator based on network
    const facilitator = network === "celo" ? celoMainnetFacilitator : celoSepoliaFacilitator;
    const networkConfig = facilitator.getNetwork();

    // Create payment envelope
    const envelope: PaymentEnvelope = {
      network,
      authorization,
      signature: signature as `0x${string}`,
    };

    // Verify payment using framework
    const paymentVerification = await facilitator.verifyPayment(
      envelope,
      getAddress(authorization.to),
      authorization.value
    );

    if (!paymentVerification.valid) {
      return res.json({
        valid: false,
        tier: 'unverified',
        payer: authorization.from,
        error: paymentVerification.error
      });
    }

    // If Self proof provided, verify it
    let tier: 'verified_human' | 'unverified' = 'unverified';
    let nullifier: string | undefined;
    let disclosedData: any;

    if (selfProof && attestationId) {
      console.log('🔍 Verifying Self Protocol proof...');

      const selfResult = await selfVerifier.verify(
        selfProof,
        attestationId
      );

      if (selfResult.valid) {
        tier = 'verified_human';
        nullifier = selfResult.nullifier;
        disclosedData = selfResult.disclosedData;
        console.log(`✅ Self verification passed (tier: ${tier})`);
      } else {
        console.log(`❌ Self verification failed: ${selfResult.error}`);
      }
    }

    res.json({
      valid: true,
      tier,
      payer: authorization.from,
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

// POST /settle - x402 standard payment settlement (using framework)
app.post("/settle", async (req: Request, res: Response) => {
  try {
    const { paymentPayload, paymentRequirements } = SettleRequestSchema.parse(req.body);

    if (paymentRequirements.network !== "celo") {
      return res.status(400).json({
        success: false,
        errorReason: "Only Celo mainnet is supported. Use network: 'celo'",
        transaction: "",
        network: paymentRequirements.network,
        payer: "",
      });
    }

    // Create payment envelope from x402 standard format
    const envelope: PaymentEnvelope = {
      network: paymentRequirements.network,
      authorization: {
        from: paymentPayload.payload.authorization.from as `0x${string}`,
        to: paymentPayload.payload.authorization.to as `0x${string}`,
        value: paymentPayload.payload.authorization.value,
        validAfter: paymentPayload.payload.authorization.validAfter,
        validBefore: paymentPayload.payload.authorization.validBefore,
        nonce: paymentPayload.payload.authorization.nonce as `0x${string}`,
      },
      signature: paymentPayload.payload.signature as `0x${string}`,
    };

    // Settle using framework
    const settlement = await celoMainnetFacilitator.settlePayment(envelope);

    if (!settlement.success) {
      return res.status(400).json({
        success: false,
        errorReason: settlement.error || "Payment settlement failed",
        transaction: "",
        network: paymentRequirements.network,
        payer: envelope.authorization.from,
      });
    }

    res.json({
      success: true,
      transaction: settlement.transactionHash,
      network: paymentRequirements.network,
      payer: envelope.authorization.from,
    });
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

// POST /settle-celo - Framework-based Celo settlement
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

    if (network !== "celo" && network !== "celo-sepolia") {
      return res.status(400).json({
        success: false,
        error: "Unsupported network. Use 'celo' or 'celo-sepolia'",
        transaction: "",
        payer: ""
      });
    }

    // Select facilitator based on network
    const facilitator = network === "celo" ? celoMainnetFacilitator : celoSepoliaFacilitator;
    const networkConfig = facilitator.getNetwork();

    console.log(`🔄 Settling payment on ${networkConfig.name}...`);
    console.log(`   From: ${authorization.from}`);
    console.log(`   To: ${authorization.to}`);
    console.log(`   Amount: ${authorization.value} (${Number(authorization.value) / 1_000_000} USDC)`);

    // Create payment envelope
    const envelope: PaymentEnvelope = {
      network,
      authorization,
      signature: signature as `0x${string}`,
    };

    // Settle payment using framework
    const settlement = await facilitator.settlePayment(envelope);

    if (!settlement.success) {
      return res.status(400).json({
        success: false,
        error: settlement.error,
        transaction: "",
        payer: authorization.from
      });
    }

    console.log(`✅ Transaction confirmed in block ${settlement.blockNumber}`);

    res.json({
      success: true,
      transaction: settlement.transactionHash,
      blockNumber: settlement.blockNumber?.toString(),
      network: networkConfig.name,
      payer: authorization.from,
      explorer: settlement.explorerUrl
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

// GET /health - Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    network: {
      name: CELO_MAINNET.name,
      chainId: CELO_MAINNET.chainId,
      usdc: CELO_MAINNET.usdcAddress,
      rpcUrl: CELO_MAINNET.rpcUrl,
      explorer: CELO_MAINNET.blockExplorer,
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Selfx402 Facilitator (using @selfx402/framework) on port ${PORT}`);
  console.log(`📡 Network: Celo Mainnet (Chain ID: ${CELO_MAINNET.chainId})`);
  console.log(`💵 USDC: ${CELO_MAINNET.usdcAddress}`);
  console.log(`🔐 Self Protocol: Enabled (proof-of-unique-human verification)`);
  console.log(`💾 Database: ${database ? 'Supabase (connected)' : 'In-memory mode'}`);
  console.log(`📦 Deferred Payments: ${voucherDatabase ? 'Enabled (x402 PR #426)' : 'Disabled (database required)'}`);
  console.log(`🔄 Deep Link Polling: ${verificationSessionsService ? 'Enabled' : 'Disabled (database required)'}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /supported                  - x402 supported payment kinds`);
  console.log(`  POST /verify                     - x402 standard payment verification`);
  console.log(`  POST /verify-celo                - Celo payment + Self verification`);
  console.log(`  POST /settle                     - x402 standard payment settlement`);
  console.log(`  POST /settle-celo                - Celo payment settlement`);
  console.log(`  POST /api/verify                 - Self QR verification endpoint`);
  console.log(`  GET  /verify-status/:sessionId   - Polling endpoint for deep link verification`);
  console.log(`  GET  /health                     - Health check`);
  if (voucherDatabase) {
    console.log(`\nDeferred payment endpoints (x402 PR #426 - Option A):`);
    console.log(`  POST /deferred/verify         - Verify and store voucher`);
    console.log(`  POST /deferred/settle         - Aggregate and settle vouchers`);
    console.log(`  GET  /deferred/balance/:payee - Get accumulated balance`);
  }
});
