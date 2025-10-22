/**
 * Self Protocol Verification Service
 * Follows official Self backend standard (@selfxyz/core)
 *
 * Validates zero-knowledge proofs with:
 * - Age verification (minimum age requirement)
 * - Country exclusion (sanctioned countries)
 * - OFAC sanctions check
 * - Nullifier management (Sybil resistance)
 */

import {
  SelfBackendVerifier,
  DefaultConfigStore,
  AllIds,
} from "@selfxyz/core";
import { DatabaseService } from "./database.js";
import type { SelfRequirements, SelfVerificationResult } from "./types.js";

export class SelfVerifier {
  private db: DatabaseService | null = null;
  private verifiers: Map<string, SelfBackendVerifier> = new Map(); // Cache verifiers by scope

  constructor(
    private requirements: SelfRequirements,
    database?: DatabaseService
  ) {
    this.db = database || null;

    // Validate scope (must match frontend)
    if (!requirements.scope || requirements.scope.length > 30) {
      throw new Error("Scope is required and must be max 30 characters");
    }

    if (this.db) {
      console.log("✅ SelfVerifier initialized with Supabase database");
    } else {
      console.log("⚠️  SelfVerifier initialized WITHOUT database (in-memory mode)");
    }
  }

  /**
   * Get or create a SelfBackendVerifier for the given scope
   * Follows Self backend standard for verifier instantiation
   */
  private getOrCreateVerifier(scope: string): SelfBackendVerifier {
    if (this.verifiers.has(scope)) {
      return this.verifiers.get(scope)!;
    }

    const verifier = new SelfBackendVerifier(
      scope,
      this.requirements.endpoint || process.env.SELF_ENDPOINT || "http://localhost:3000/api/verify",
      false, // mockPassport (false = mainnet, true = testnet)
      AllIds, // Allow all document types (1=Passport, 2=ID, 3=Aadhaar)
      new DefaultConfigStore({
        minimumAge: this.requirements.minimumAge || 18,
        excludedCountries: (this.requirements.excludedCountries || []) as any,
        ofac: this.requirements.ofac || false,
      }),
      "uuid" // User identifier type
    );

    this.verifiers.set(scope, verifier);
    return verifier;
  }

  /**
   * Verify Self Protocol zero-knowledge proof
   * Follows Self backend standard for proof validation
   *
   * @param proofHeader - Base64-encoded proof from X-Self-Proof header
   * @param attestationId - Attestation type (1 or 2)
   * @param userContextData - Optional user context data
   * @returns Verification result with tier and nullifier
   *
   * @example
   * ```typescript
   * const result = await verifier.verify(proofHeader, 1);
   * if (result.valid) {
   *   console.log(`Verified human! Nullifier: ${result.nullifier}`);
   *   console.log(`Tier: ${result.tier}`); // "verified_human"
   * }
   * ```
   */
  async verify(
    proofHeader: string,
    attestationId: number,
    userContextData?: string
  ): Promise<SelfVerificationResult> {
    try {
      // Decode base64 proof (Self backend standard format)
      const decoded = Buffer.from(proofHeader, "base64").toString("utf-8");
      const [proof, publicSignals] = decoded.split("|");

      if (!proof || !publicSignals) {
        return {
          valid: false,
          tier: "unverified",
          error: "Invalid proof format (expected base64(proof|publicSignals))",
        };
      }

      // Get or create verifier for this scope
      const verifier = this.getOrCreateVerifier(this.requirements.scope);

      // Parse proof and publicSignals as JSON (SDK expects objects/arrays)
      const proofData = JSON.parse(proof);
      const signalsData = JSON.parse(publicSignals);

      // Verify using Self Protocol SDK
      const result = await verifier.verify(
        attestationId as 1 | 2,
        proofData,
        signalsData,
        userContextData || this.requirements.scope
      );

      // Check validation results
      const { isValid, isMinimumAgeValid, isOfacValid } = result.isValidDetails;

      if (!isValid) {
        return {
          valid: false,
          tier: "unverified",
          error: "Invalid cryptographic proof",
        };
      }

      if (!isMinimumAgeValid) {
        return {
          valid: false,
          tier: "unverified",
          error: `Age verification failed (minimum: ${this.requirements.minimumAge || 18})`,
        };
      }

      if (this.requirements.ofac && !isOfacValid) {
        return {
          valid: false,
          tier: "unverified",
          error: "OFAC sanctions check failed",
        };
      }

      // Extract nullifier from discloseOutput
      const nullifier = result.discloseOutput?.nullifier;

      if (!nullifier) {
        return {
          valid: false,
          tier: "unverified",
          error: "Nullifier missing from verification result",
        };
      }

      // Check nullifier uniqueness (Sybil resistance)
      const exists = await this.checkNullifierExists(nullifier, this.requirements.scope);
      if (exists) {
        return {
          valid: false,
          tier: "unverified",
          error: "Duplicate verification detected (one passport = one verification)",
        };
      }

      // Validate country exclusion if provided
      const nationality = result.discloseOutput?.nationality;
      if (this.requirements.excludedCountries && nationality) {
        if (this.requirements.excludedCountries.includes(nationality)) {
          return {
            valid: false,
            tier: "unverified",
            error: `Country excluded: ${nationality}`,
          };
        }
      }

      // Store nullifier (90-day expiry) with metadata
      await this.storeNullifier(
        nullifier,
        this.requirements.scope,
        (result as any).userId,
        nationality,
        {
          ageValid: isMinimumAgeValid,
          ofacValid: isOfacValid,
          verifiedAt: new Date().toISOString(),
        }
      );

      console.log(`✅ Self verification successful for ${nationality || "unknown"} national`);

      return {
        valid: true,
        tier: "verified_human",
        nullifier,
        disclosedData: {
          ageValid: isMinimumAgeValid,
          nationality,
          ofacValid: isOfacValid,
          name: result.discloseOutput?.name,
          gender: result.discloseOutput?.gender,
          dateOfBirth: result.discloseOutput?.dateOfBirth,
        },
      };
    } catch (error) {
      console.error("Self verification error:", error);
      return {
        valid: false,
        tier: "unverified",
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }

  /**
   * Check if nullifier already exists (prevent duplicates)
   */
  private async checkNullifierExists(nullifier: string, scope: string): Promise<boolean> {
    if (!this.db) {
      console.warn("⚠️  Database not available, skipping nullifier check");
      return false;
    }

    return await this.db.checkNullifierExists(nullifier, scope);
  }

  /**
   * Store nullifier with 90-day expiry
   */
  private async storeNullifier(
    nullifier: string,
    scope: string,
    userId?: string,
    nationality?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.db) {
      console.warn("⚠️  Database not available, nullifier not persisted");
      return;
    }

    await this.db.storeNullifier(nullifier, scope, userId, nationality, metadata);
  }

  /**
   * Clean up expired nullifiers (should run periodically)
   */
  async cleanupExpiredNullifiers(): Promise<number> {
    if (!this.db) {
      console.warn("⚠️  Database not available, skipping cleanup");
      return 0;
    }

    return await this.db.cleanupExpiredNullifiers();
  }

  /**
   * Get scope statistics (analytics)
   */
  async getScopeStats() {
    if (!this.db) {
      throw new Error("Database required for scope stats");
    }

    return await this.db.getScopeStats(this.requirements.scope);
  }
}
