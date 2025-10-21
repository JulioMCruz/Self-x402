/**
 * Self Protocol Verification Service
 *
 * Validates Self Protocol zero-knowledge proofs with dynamic requirements.
 * Implements nullifier management to prevent duplicate verifications.
 */

import { SelfBackendVerifier, DefaultConfigStore, AllIds } from '@selfxyz/core';
import { DatabaseService } from './DatabaseService.js';

export interface SelfRequirements {
  minimumAge: number;
  excludedCountries?: string[];
  ofac?: boolean;
  scope: string;
  endpoint?: string;
}

export interface SelfVerificationResult {
  valid: boolean;
  tier: 'verified_human' | 'unverified';
  nullifier?: string;
  error?: string;
  disclosedData?: {
    ageValid: boolean;
    nationality?: string;
    ofacValid?: boolean;
    name?: string;
    gender?: string;
    dateOfBirth?: string;
  };
}

export class SelfVerificationService {
  private db: DatabaseService | null = null;
  private verifiers: Map<string, SelfBackendVerifier> = new Map(); // Cache verifiers by scope

  constructor(database?: DatabaseService) {
    this.db = database || null;

    if (this.db) {
      console.log('✅ SelfVerificationService initialized with Supabase database');
    } else {
      console.log('⚠️  SelfVerificationService initialized WITHOUT database (in-memory mode)');
    }
  }

  /**
   * Get or create a SelfBackendVerifier for the given requirements
   */
  private getOrCreateVerifier(requirements: SelfRequirements): SelfBackendVerifier {
    const cacheKey = requirements.scope;

    if (this.verifiers.has(cacheKey)) {
      return this.verifiers.get(cacheKey)!;
    }

    const verifier = new SelfBackendVerifier(
      requirements.scope,
      requirements.endpoint || process.env.SELF_ENDPOINT || 'http://localhost:3000/api/verify',
      false, // mockPassport (false = mainnet)
      AllIds, // Allow all document types (1=Passport, 2=ID, 3=Aadhaar)
      new DefaultConfigStore({
        minimumAge: requirements.minimumAge,
        excludedCountries: (requirements.excludedCountries || []) as any, // SDK expects specific ISO country codes
        ofac: requirements.ofac || false,
      }),
      'uuid' // User identifier type
    );

    this.verifiers.set(cacheKey, verifier);
    return verifier;
  }

  /**
   * Verify Self Protocol proof with dynamic requirements
   */
  async verifyProof(
    proofHeader: string,
    requirements: SelfRequirements,
    attestationId: number,
    userContextData?: string
  ): Promise<SelfVerificationResult> {
    try {
      // Decode base64 proof
      const decoded = Buffer.from(proofHeader, 'base64').toString('utf-8');
      const [proof, publicSignals] = decoded.split('|');

      if (!proof || !publicSignals) {
        return {
          valid: false,
          tier: 'unverified',
          error: 'Invalid proof format (expected base64(proof|publicSignals))'
        };
      }

      // Get or create verifier for this scope
      const verifier = this.getOrCreateVerifier(requirements);

      // Parse proof and publicSignals as JSON (SDK expects objects/arrays)
      const proofData = JSON.parse(proof);
      const signalsData = JSON.parse(publicSignals);

      // Verify using Self Protocol SDK
      // attestationId type assertion: SDK expects 1 or 2, but we accept any number
      const result = await verifier.verify(
        attestationId as 1 | 2,
        proofData,
        signalsData,
        userContextData || requirements.scope
      );

      // Check validation results
      const { isValid, isMinimumAgeValid, isOfacValid } = result.isValidDetails;

      if (!isValid) {
        return {
          valid: false,
          tier: 'unverified',
          error: 'Invalid cryptographic proof'
        };
      }

      if (!isMinimumAgeValid) {
        return {
          valid: false,
          tier: 'unverified',
          error: `Age verification failed (minimum: ${requirements.minimumAge})`
        };
      }

      if (requirements.ofac && !isOfacValid) {
        return {
          valid: false,
          tier: 'unverified',
          error: 'OFAC sanctions check failed'
        };
      }

      // Extract nullifier from discloseOutput
      const nullifier = result.discloseOutput?.nullifier;

      if (!nullifier) {
        return {
          valid: false,
          tier: 'unverified',
          error: 'Nullifier missing from verification result'
        };
      }

      // Check nullifier uniqueness
      const exists = await this.checkNullifierExists(nullifier, requirements.scope);
      if (exists) {
        return {
          valid: false,
          tier: 'unverified',
          error: 'Duplicate verification detected (one passport = one verification)'
        };
      }

      // Validate country exclusion if provided
      const nationality = result.discloseOutput?.nationality;
      if (requirements.excludedCountries && nationality) {
        if (requirements.excludedCountries.includes(nationality)) {
          return {
            valid: false,
            tier: 'unverified',
            error: `Country excluded: ${nationality}`
          };
        }
      }

      // Store nullifier (90-day expiry) with metadata
      await this.storeNullifier(
        nullifier,
        requirements.scope,
        (result as any).userId,
        nationality,
        {
          ageValid: isMinimumAgeValid,
          ofacValid: isOfacValid,
          verifiedAt: new Date().toISOString()
        }
      );

      console.log(`✅ Self verification successful for ${nationality || 'unknown'} national`);

      return {
        valid: true,
        tier: 'verified_human',
        nullifier,
        disclosedData: {
          ageValid: isMinimumAgeValid,
          nationality,
          ofacValid: isOfacValid,
          name: result.discloseOutput?.name,
          gender: result.discloseOutput?.gender,
          dateOfBirth: result.discloseOutput?.dateOfBirth
        }
      };

    } catch (error) {
      console.error('Self verification error:', error);
      return {
        valid: false,
        tier: 'unverified',
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }


  /**
   * Check if nullifier already exists (prevent duplicates)
   */
  private async checkNullifierExists(nullifier: string, scope: string): Promise<boolean> {
    if (!this.db) {
      console.warn('⚠️  Database not available, skipping nullifier check');
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
      console.warn('⚠️  Database not available, nullifier not persisted');
      return;
    }

    await this.db.storeNullifier(nullifier, scope, userId, nationality, metadata);
  }

  /**
   * Clean up expired nullifiers (should run periodically)
   */
  async cleanupExpiredNullifiers(): Promise<number> {
    if (!this.db) {
      console.warn('⚠️  Database not available, skipping cleanup');
      return 0;
    }

    return await this.db.cleanupExpiredNullifiers();
  }
}
