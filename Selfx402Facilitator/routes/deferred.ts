/**
 * Deferred payment endpoints for x402 facilitator
 * Implements x402 PR #426 - Option A: Basic deferred scheme
 *
 * Endpoints:
 * - POST /deferred/verify - Verify voucher signature
 * - POST /deferred/settle - Aggregate and settle vouchers on-chain
 * - GET /deferred/balance/:payee - Get accumulated balance for payee
 */

import { Router, Request, Response } from "express";
import type { Facilitator } from "selfx402-framework";
import {
  type PaymentVoucher,
  type DeferredPaymentEnvelope,
  type SettlementRequest,
  type VoucherRecord,
  verifyVoucher,
  validateDeferredEnvelope,
  createVoucherDomain,
  canAggregateVouchers,
  calculateAggregatedAmount,
  VoucherDatabaseService,
} from "selfx402-framework";

const router = Router();

// Services initialized by main app
let voucherDb: VoucherDatabaseService;
let celoFacilitator: Facilitator;
let celoSepoliaFacilitator: Facilitator;

export function initializeDeferredRoutes(
  dbService: VoucherDatabaseService,
  facilitators: {
    celo: Facilitator;
    celoSepolia: Facilitator;
  }
) {
  voucherDb = dbService;
  celoFacilitator = facilitators.celo;
  celoSepoliaFacilitator = facilitators.celoSepolia;
  return router;
}

/**
 * POST /deferred/verify
 * Verify voucher signature and store in database
 *
 * Structured logging (x402 PR #426 compliance):
 * - deferred.verify.ok - Successful verification
 * - deferred.verify.fail - Validation/signature failure
 * - authorization_state - Payment lifecycle tracking
 */
router.post("/verify", async (req: Request, res: Response) => {
  const startTime = Date.now();
  let authorizationState = "pending";

  try {
    const envelope: DeferredPaymentEnvelope = req.body;

    // Log incoming request
    console.log(`[deferred.verify] Received voucher verification request`);
    console.log(`  scheme: deferred`);
    console.log(`  payer: ${envelope.voucher?.payer || 'unknown'}`);
    console.log(`  payee: ${envelope.voucher?.payee || 'unknown'}`);
    console.log(`  amount: ${envelope.voucher?.amount || 'unknown'}`);
    console.log(`  network: ${envelope.network || 'unknown'}`);

    authorizationState = "validating_structure";

    // Validate envelope structure
    const structureValidation = validateDeferredEnvelope(envelope);
    if (!structureValidation.valid) {
      authorizationState = "invalid_structure";
      const duration = Date.now() - startTime;

      console.log(`[deferred.verify.fail] Invalid envelope structure`);
      console.log(`  authorization_state: ${authorizationState}`);
      console.log(`  errors: ${JSON.stringify(structureValidation.errors)}`);
      console.log(`  duration_ms: ${duration}`);

      return res.status(400).json({
        success: false,
        error: "Invalid envelope structure",
        details: structureValidation.errors,
        warnings: structureValidation.warnings,
        authorization_state: authorizationState,
        scheme: "deferred",
      });
    }

    authorizationState = "verifying_signature";

    // Determine chain ID from network
    const chainId = envelope.network === "celo" ? 42220 : 11142220; // Celo mainnet or sepolia
    const usdcAddress =
      chainId === 42220
        ? "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" // Celo mainnet USDC
        : "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B"; // Celo sepolia USDC

    // Create EIP-712 domain for verification
    const domain = createVoucherDomain(chainId, usdcAddress as `0x${string}`);

    // Verify signature
    const verification = await verifyVoucher(
      envelope.voucher,
      envelope.signature,
      domain
    );

    if (!verification.valid) {
      authorizationState = "invalid_signature";
      const duration = Date.now() - startTime;

      console.log(`[deferred.verify.fail] Invalid signature`);
      console.log(`  authorization_state: ${authorizationState}`);
      console.log(`  error: ${verification.error}`);
      console.log(`  duration_ms: ${duration}`);

      return res.status(401).json({
        success: false,
        error: "Invalid signature",
        details: verification.error,
        authorization_state: authorizationState,
        scheme: "deferred",
      });
    }

    authorizationState = "checking_duplicate";

    // Check for duplicate nonce
    const existing = await voucherDb.getVoucherByNonce(envelope.voucher.nonce);
    if (existing) {
      authorizationState = "duplicate_nonce";
      const duration = Date.now() - startTime;

      console.log(`[deferred.verify.fail] Duplicate voucher nonce`);
      console.log(`  authorization_state: ${authorizationState}`);
      console.log(`  nonce: ${envelope.voucher.nonce}`);
      console.log(`  duration_ms: ${duration}`);

      return res.status(409).json({
        success: false,
        error: "Voucher already exists",
        duplicate: true,
        authorization_state: authorizationState,
        scheme: "deferred",
      });
    }

    authorizationState = "storing_voucher";

    // Store voucher in database
    const voucherRecord: Omit<VoucherRecord, "id" | "created_at"> = {
      payer_address: envelope.voucher.payer.toLowerCase(),
      payee_address: envelope.voucher.payee.toLowerCase(),
      amount: envelope.voucher.amount.toString(),
      nonce: envelope.voucher.nonce,
      signature: envelope.signature,
      valid_until: new Date(envelope.voucher.validUntil * 1000).toISOString(),
      settled: false,
      network: envelope.network,
      scheme: "deferred", // x402 PR #426: Tag payment with scheme type
    };

    const stored = await voucherDb.storeVoucher(voucherRecord);

    authorizationState = "verified_stored";

    // Structured logging: SUCCESS (x402 PR #426 compliant)
    const duration = Date.now() - startTime;
    console.log(`[deferred.verify.ok] ✅ Voucher verified and stored successfully`);
    console.log(`  scheme: deferred`);
    console.log(`  voucher_id: ${stored.id}`);
    console.log(`  payer: ${envelope.voucher.payer}`);
    console.log(`  payee: ${envelope.voucher.payee}`);
    console.log(`  amount: ${envelope.voucher.amount}`);
    console.log(`  network: ${envelope.network}`);
    console.log(`  signer: ${verification.signer}`);
    console.log(`  authorization_state: ${authorizationState}`);
    console.log(`  duration_ms: ${duration}`);

    return res.json({
      success: true,
      verified: true,
      voucher_id: stored.id,
      signer: verification.signer,
      expires_at: stored.valid_until,
      authorization_state: authorizationState,
      scheme: "deferred",
    });
  } catch (error) {
    authorizationState = "error";
    const duration = Date.now() - startTime;

    console.error(`[deferred.verify.error] ❌ Verification failed with exception`);
    console.error(`  authorization_state: ${authorizationState}`);
    console.error(`  error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`  duration_ms: ${duration}`);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
      authorization_state: authorizationState,
      scheme: "deferred",
    });
  }
});

/**
 * POST /deferred/settle
 * Aggregate vouchers and settle on-chain
 *
 * Structured logging (x402 PR #426 compliance):
 * - deferred.settle.ok - Successful on-chain settlement
 * - deferred.settle.revert - Settlement transaction reverted
 * - authorization_state - Settlement lifecycle tracking
 */
router.post("/settle", async (req: Request, res: Response) => {
  const startTime = Date.now();
  let authorizationState = "pending";
  let voucherIds: string[] = [];

  try {
    const request: SettlementRequest = req.body;

    // Log incoming settlement request
    console.log(`[deferred.settle] Received settlement request`);
    console.log(`  scheme: deferred`);
    console.log(`  payee: ${request.payee}`);
    console.log(`  payer: ${request.payer || 'all'}`);
    console.log(`  network: ${request.network}`);
    console.log(`  minAmount: ${request.minAmount || 'none'}`);

    authorizationState = "fetching_vouchers";

    // Get unsettled vouchers
    const vouchers = await (request.payer
      ? voucherDb.getUnsettledVouchers(
          request.payer,
          request.payee,
          request.network
        )
      : voucherDb
          .getAccumulatedBalances(request.payee, request.network)
          .then((balances) =>
            Promise.all(
              balances.map((b) =>
                voucherDb.getUnsettledVouchers(b.payer, b.payee, request.network)
              )
            ).then((results) => results.flat())
          ));

    if (vouchers.length === 0) {
      authorizationState = "no_vouchers";
      const duration = Date.now() - startTime;

      console.log(`[deferred.settle.fail] No unsettled vouchers found`);
      console.log(`  authorization_state: ${authorizationState}`);
      console.log(`  duration_ms: ${duration}`);

      return res.status(404).json({
        success: false,
        error: "No unsettled vouchers found",
        authorization_state: authorizationState,
        scheme: "deferred",
      });
    }

    voucherIds = vouchers.map((v) => v.id!);
    console.log(`  Found ${vouchers.length} unsettled vouchers: ${voucherIds.join(', ')}`);

    authorizationState = "validating_aggregation";

    // Validate aggregation is possible
    const aggregationValidation = canAggregateVouchers(vouchers);
    if (!aggregationValidation.valid) {
      authorizationState = "invalid_aggregation";
      const duration = Date.now() - startTime;

      console.log(`[deferred.settle.fail] Cannot aggregate vouchers`);
      console.log(`  authorization_state: ${authorizationState}`);
      console.log(`  errors: ${JSON.stringify(aggregationValidation.errors)}`);
      console.log(`  duration_ms: ${duration}`);

      return res.status(400).json({
        success: false,
        error: "Cannot aggregate vouchers",
        details: aggregationValidation.errors,
        authorization_state: authorizationState,
        scheme: "deferred",
      });
    }

    // Calculate total amount
    const totalAmount = calculateAggregatedAmount(vouchers);
    console.log(`  Total amount: ${totalAmount} (${Number(totalAmount) / 1_000_000} USDC)`);

    // Apply minimum amount filter if specified
    if (request.minAmount && totalAmount < request.minAmount) {
      authorizationState = "below_minimum";
      const duration = Date.now() - startTime;

      console.log(`[deferred.settle.fail] Total amount below minimum threshold`);
      console.log(`  authorization_state: ${authorizationState}`);
      console.log(`  totalAmount: ${totalAmount}`);
      console.log(`  minAmount: ${request.minAmount}`);
      console.log(`  duration_ms: ${duration}`);

      return res.status(400).json({
        success: false,
        error: "Total amount below minimum threshold",
        totalAmount: totalAmount.toString(),
        minAmount: request.minAmount.toString(),
        authorization_state: authorizationState,
        scheme: "deferred",
      });
    }

    authorizationState = "preparing_settlement";

    // Select facilitator based on network
    const facilitator = request.network === "celo" ? celoFacilitator : celoSepoliaFacilitator;

    // Use the last voucher's authorization for settlement
    // In production, you might want to create a new aggregated authorization
    const lastVoucher = vouchers[vouchers.length - 1];

    // Create payment envelope from last voucher
    const envelope = {
      network: request.network,
      authorization: {
        from: lastVoucher.payer_address as `0x${string}`,
        to: lastVoucher.payee_address as `0x${string}`,
        value: totalAmount.toString(),
        validAfter: 0, // Immediate
        validBefore: Math.floor(Date.parse(lastVoucher.valid_until) / 1000),
        nonce: lastVoucher.nonce as `0x${string}`,
      },
      signature: lastVoucher.signature as `0x${string}`,
    };

    authorizationState = "executing_onchain";
    console.log(`  Executing on-chain settlement...`);

    // Execute settlement using facilitator
    const settlement = await facilitator.settlePayment(envelope);

    if (!settlement.success) {
      authorizationState = "settlement_reverted";
      const duration = Date.now() - startTime;

      // Structured logging: REVERT (x402 PR #426 compliant)
      console.error(`[deferred.settle.revert] ❌ On-chain settlement reverted`);
      console.error(`  authorization_state: ${authorizationState}`);
      console.error(`  error: ${settlement.error || 'Unknown error'}`);
      console.error(`  voucher_count: ${vouchers.length}`);
      console.error(`  voucher_ids: ${voucherIds.join(', ')}`);
      console.error(`  total_amount: ${totalAmount}`);
      console.error(`  duration_ms: ${duration}`);

      throw new Error(settlement.error || "Settlement failed");
    }

    const txHash = settlement.transactionHash!;
    authorizationState = "updating_database";

    // Mark vouchers as settled
    await voucherDb.markVouchersSettled(voucherIds);

    // Store settlement record
    const settlementRecord = await voucherDb.storeSettlement({
      tx_hash: txHash,
      payee_address: request.payee.toLowerCase(),
      payer_address: lastVoucher.payer_address,
      total_amount: totalAmount.toString(),
      voucher_count: vouchers.length,
      network: request.network,
      voucher_ids: voucherIds,
      scheme: "deferred", // x402 PR #426: Tag settlement with scheme type
    });

    authorizationState = "settled_confirmed";

    // Structured logging: SUCCESS (x402 PR #426 compliant)
    const duration = Date.now() - startTime;
    console.log(`[deferred.settle.ok] ✅ Settlement completed successfully`);
    console.log(`  scheme: deferred`);
    console.log(`  settlement_id: ${settlementRecord.id}`);
    console.log(`  tx_hash: ${txHash}`);
    console.log(`  block_number: ${settlement.blockNumber || 'pending'}`);
    console.log(`  voucher_count: ${vouchers.length}`);
    console.log(`  voucher_ids: ${voucherIds.join(', ')}`);
    console.log(`  total_amount: ${totalAmount} (${Number(totalAmount) / 1_000_000} USDC)`);
    console.log(`  payer: ${lastVoucher.payer_address}`);
    console.log(`  payee: ${request.payee}`);
    console.log(`  network: ${request.network}`);
    console.log(`  authorization_state: ${authorizationState}`);
    console.log(`  duration_ms: ${duration}`);

    return res.json({
      success: true,
      txHash,
      totalAmount: totalAmount.toString(),
      voucherCount: vouchers.length,
      settlementId: settlementRecord.id,
      voucherIds,
      authorization_state: authorizationState,
      scheme: "deferred",
      explorer: settlement.explorerUrl,
    });
  } catch (error) {
    authorizationState = authorizationState === "executing_onchain"
      ? "settlement_reverted"
      : "error";
    const duration = Date.now() - startTime;

    // Structured logging: ERROR/REVERT (x402 PR #426 compliant)
    const logPrefix = authorizationState === "settlement_reverted"
      ? "[deferred.settle.revert]"
      : "[deferred.settle.error]";

    console.error(`${logPrefix} ❌ Settlement failed`);
    console.error(`  authorization_state: ${authorizationState}`);
    console.error(`  error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (voucherIds.length > 0) {
      console.error(`  voucher_ids: ${voucherIds.join(', ')}`);
    }
    console.error(`  duration_ms: ${duration}`);

    return res.status(500).json({
      success: false,
      error: "Settlement failed",
      message: error instanceof Error ? error.message : "Unknown error",
      authorization_state: authorizationState,
      scheme: "deferred",
    });
  }
});

/**
 * GET /deferred/balance/:payee
 * Get accumulated balance for a payee address
 */
router.get("/balance/:payee", async (req: Request, res: Response) => {
  try {
    const payeeAddress = req.params.payee.toLowerCase();
    const network = (req.query.network as string) || "celo";

    const balances = await voucherDb.getAccumulatedBalances(
      payeeAddress,
      network
    );

    const totalBalance = balances.reduce(
      (sum, b) => sum + b.totalAmount,
      BigInt(0)
    );

    return res.json({
      success: true,
      payee: payeeAddress,
      network,
      totalBalance: totalBalance.toString(),
      balancesByPayer: balances.map((b) => ({
        payer: b.payer,
        amount: b.totalAmount.toString(),
        voucherCount: b.voucherCount,
        voucherIds: b.voucherIds,
      })),
    });
  } catch (error) {
    console.error("[Deferred Balance Error]", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get balance",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
