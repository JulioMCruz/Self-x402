/**
 * Self Protocol types following official Self backend standard
 */

export interface SelfRequirements {
  /** Application scope identifier (max 30 chars, must match frontend) */
  scope: string;

  /** Minimum age requirement (default: 18) */
  minimumAge?: number;

  /** Excluded countries (ISO 3166-1 alpha-3 codes) */
  excludedCountries?: string[];

  /** OFAC sanctions list check */
  ofac?: boolean;

  /** Verification endpoint URL (optional) */
  endpoint?: string;
}

export interface SelfVerificationResult {
  /** Whether verification was successful */
  valid: boolean;

  /** User tier based on verification */
  tier: "verified_human" | "unverified";

  /** Unique passport identifier (for Sybil resistance) */
  nullifier?: string;

  /** Error message if verification failed */
  error?: string;

  /** Disclosed data from zero-knowledge proof */
  disclosedData?: {
    ageValid: boolean;
    nationality?: string;
    ofacValid?: boolean;
    name?: string;
    gender?: string;
    dateOfBirth?: string;
  };
}

export interface NullifierRecord {
  /** Database record ID */
  id?: string;

  /** Unique passport identifier */
  nullifier: string;

  /** Application scope */
  scope: string;

  /** Creation timestamp */
  created_at?: string;

  /** Expiry timestamp (90 days from creation) */
  expires_at: string;

  /** User identifier (optional) */
  user_id?: string;

  /** User nationality (ISO 3166-1 alpha-3) */
  nationality?: string;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface DatabaseConfig {
  /** Supabase project URL */
  url: string;

  /** Supabase service role key (server-side only) */
  serviceRoleKey: string;
}
