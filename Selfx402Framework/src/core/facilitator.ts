/**
 * Core x402 Facilitator Engine
 * Follows x402 protocol standard for payment verification and settlement
 */

import { recoverTypedDataAddress, type Address } from "viem";
import { getNetworkConfig } from "../networks/utils.js";
import type {
  FacilitatorConfig,
  PaymentEnvelope,
  VerificationResult,
  SettlementResult,
} from "./types.js";
import type { NetworkConfig } from "../networks/types.js";

export class Facilitator {
  private networkConfig: NetworkConfig;

  constructor(private config: FacilitatorConfig) {
    // Resolve network config
    this.networkConfig =
      typeof config.network === "string"
        ? getNetworkConfig(config.network)
        : config.network;

    console.log(`✅ Facilitator initialized for ${this.networkConfig.name}`);
  }

  /**
   * Verify x402 payment envelope (EIP-712 signature)
   * Follows x402 protocol standard for verification
   */
  async verifyPayment(
    envelope: PaymentEnvelope,
    expectedTo: Address,
    expectedValue: string
  ): Promise<VerificationResult> {
    try {
      const { authorization, signature } = envelope;

      // Validate amounts match
      if (authorization.to.toLowerCase() !== expectedTo.toLowerCase()) {
        return {
          valid: false,
          error: `Payment to mismatch: expected ${expectedTo}, got ${authorization.to}`,
        };
      }

      if (authorization.value !== expectedValue) {
        return {
          valid: false,
          error: `Payment value mismatch: expected ${expectedValue}, got ${authorization.value}`,
        };
      }

      // Create EIP-712 domain
      const domain = {
        name: this.networkConfig.usdcName,
        version: "2",
        chainId: this.networkConfig.chainId,
        verifyingContract: this.networkConfig.usdcAddress,
      };

      // Create EIP-712 types
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

      // Recover signer address
      const recoveredAddress = await recoverTypedDataAddress({
        domain,
        types,
        primaryType: "TransferWithAuthorization",
        message: authorization,
        signature,
      });

      // Verify signer matches "from" address
      if (recoveredAddress.toLowerCase() !== authorization.from.toLowerCase()) {
        return {
          valid: false,
          error: "Signature verification failed: signer mismatch",
        };
      }

      return {
        valid: true,
        recoveredAddress,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }

  /**
   * Settle x402 payment on-chain (EIP-3009 transferWithAuthorization)
   * Follows x402 protocol standard for settlement
   */
  async settlePayment(envelope: PaymentEnvelope): Promise<SettlementResult> {
    try {
      const { authorization, signature } = envelope;

      // EIP-3009 transferWithAuthorization ABI
      const abi = [
        {
          inputs: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "validBefore", type: "uint256" },
            { name: "nonce", type: "bytes32" },
            { name: "v", type: "uint8" },
            { name: "r", type: "bytes32" },
            { name: "s", type: "bytes32" },
          ],
          name: "transferWithAuthorization",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const;

      // Split signature into v, r, s
      const sig = signature.slice(2); // Remove 0x
      const r = `0x${sig.slice(0, 64)}` as `0x${string}`;
      const s = `0x${sig.slice(64, 128)}` as `0x${string}`;
      const v = parseInt(sig.slice(128, 130), 16);

      // Call USDC contract
      const hash = await this.config.wallet.writeContract({
        address: this.networkConfig.usdcAddress,
        abi,
        functionName: "transferWithAuthorization",
        args: [
          authorization.from,
          authorization.to,
          BigInt(authorization.value),
          BigInt(authorization.validAfter),
          BigInt(authorization.validBefore),
          authorization.nonce,
          v,
          r,
          s,
        ],
      } as any);

      // Wait for transaction confirmation (use any to bypass type issue)
      const receipt = await (this.config.wallet as any).waitForTransactionReceipt({ hash });

      const explorerUrl = `${this.networkConfig.blockExplorer}/tx/${hash}`;

      console.log(`✅ Payment settled: ${hash}`);

      return {
        success: true,
        transactionHash: hash,
        blockNumber: receipt.blockNumber,
        explorerUrl,
      };
    } catch (error) {
      console.error("Settlement failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Settlement failed",
      };
    }
  }

  /**
   * Get network configuration
   */
  getNetwork(): NetworkConfig {
    return this.networkConfig;
  }

  /**
   * Get Self Protocol verifier (if enabled)
   */
  getSelfVerifier() {
    return this.config.selfVerifier;
  }
}
