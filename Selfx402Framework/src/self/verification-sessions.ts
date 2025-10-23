/**
 * @selfx402/framework/self/verification-sessions
 *
 * Verification sessions service for deep link polling support
 * Enables mobile deep link verification flow with polling
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Verification session data structure
 */
export interface VerificationSession {
  id?: string;
  session_id: string;
  vendor_url: string;
  wallet_address: string;
  api_endpoint?: string;
  network: string;
  disclosures: Record<string, any>;
  verified: boolean;
  nullifier?: string;
  disclosure_results?: Record<string, any>;
  created_at?: string;
  verified_at?: string;
  expires_at: string;
  proof_data?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Verification status response for polling
 */
export interface VerificationStatus {
  verified: boolean;
  pending: boolean;
  expired?: boolean;
  nullifier?: string;
  disclosure_results?: Record<string, any>;
  timestamp?: number;
  message?: string;
}

/**
 * Service for managing verification sessions
 * Supports deep link verification flow with database persistence
 */
export class VerificationSessionsService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new verification session
   */
  async createSession(
    session: Omit<VerificationSession, "id" | "created_at" | "verified_at">
  ): Promise<VerificationSession | null> {
    try {
      const { data, error } = await this.supabase
        .from("verification_sessions")
        .insert({
          session_id: session.session_id,
          vendor_url: session.vendor_url,
          wallet_address: session.wallet_address,
          api_endpoint: session.api_endpoint,
          network: session.network,
          disclosures: session.disclosures,
          verified: session.verified,
          expires_at: session.expires_at,
          metadata: session.metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating verification session:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Exception creating verification session:", error);
      return null;
    }
  }

  /**
   * Update session with verification results
   */
  async updateSessionVerified(
    sessionId: string,
    verified: boolean,
    nullifier?: string,
    disclosureResults?: Record<string, any>,
    proofData?: Record<string, any>
  ): Promise<boolean> {
    try {
      const updates: any = {
        verified,
        verified_at: verified ? new Date().toISOString() : null,
      };

      if (nullifier) updates.nullifier = nullifier;
      if (disclosureResults) updates.disclosure_results = disclosureResults;
      if (proofData) updates.proof_data = proofData;

      const { error } = await this.supabase
        .from("verification_sessions")
        .update(updates)
        .eq("session_id", sessionId);

      if (error) {
        console.error("Error updating verification session:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Exception updating verification session:", error);
      return false;
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<VerificationSession | null> {
    try {
      const { data, error } = await this.supabase
        .from("verification_sessions")
        .select("*")
        .eq("session_id", sessionId)
        .single();

      if (error) {
        console.error("Error getting verification session:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Exception getting verification session:", error);
      return null;
    }
  }

  /**
   * Get verification status for polling
   * Returns current verification state with expiry checks
   */
  async getVerificationStatus(
    sessionId: string
  ): Promise<VerificationStatus> {
    try {
      const session = await this.getSession(sessionId);

      if (!session) {
        return {
          verified: false,
          pending: false,
          message: "Session not found",
        };
      }

      // Check if session expired
      const now = new Date();
      const expiresAt = new Date(session.expires_at);

      if (now > expiresAt) {
        return {
          verified: false,
          pending: false,
          expired: true,
          message: "Session expired",
        };
      }

      // Return verification status
      if (session.verified) {
        return {
          verified: true,
          pending: false,
          nullifier: session.nullifier,
          disclosure_results: session.disclosure_results,
          timestamp: session.verified_at
            ? new Date(session.verified_at).getTime()
            : undefined,
          message: "Verification successful",
        };
      }

      // Still pending
      return {
        verified: false,
        pending: true,
        message: "Verification pending",
      };
    } catch (error) {
      console.error("Exception getting verification status:", error);
      return {
        verified: false,
        pending: true,
        message:
          error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Cleanup expired sessions
   * Should be called periodically (e.g., via cron job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from("verification_sessions")
        .delete()
        .lt("expires_at", new Date().toISOString())
        .select();

      if (error) {
        console.error("Error cleaning up expired sessions:", error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error("Exception cleaning up expired sessions:", error);
      return 0;
    }
  }
}
