/**
 * Database service for Self Protocol nullifier management
 * Follows Self backend standard for Sybil resistance
 *
 * Nullifier System:
 * - One passport = one nullifier = one verification per scope
 * - 90-day expiry (matches Self Protocol verification window)
 * - Supabase for persistence (optional, falls back to in-memory)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DatabaseConfig, NullifierRecord } from "./types.js";

export class DatabaseService {
  private supabase: SupabaseClient;
  private isConnected: boolean = false;

  constructor(config: DatabaseConfig) {
    if (!config.url || !config.serviceRoleKey) {
      throw new Error(
        "Missing Supabase credentials: url and serviceRoleKey required"
      );
    }

    this.supabase = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("✅ Supabase database service initialized");
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("nullifiers")
        .select("id")
        .limit(1);

      if (error) {
        console.error("❌ Database connection test failed:", error.message);
        this.isConnected = false;
        return false;
      }

      this.isConnected = true;
      console.log("✅ Database connection successful");
      return true;
    } catch (error) {
      console.error("❌ Database connection error:", error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Check if nullifier exists for given scope
   * Following Self backend standard for duplicate detection
   *
   * @returns true if nullifier already used, false if available
   */
  async checkNullifierExists(nullifier: string, scope: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("nullifiers")
        .select("id")
        .eq("nullifier", nullifier)
        .eq("scope", scope)
        .gt("expires_at", new Date().toISOString())
        .limit(1);

      if (error) {
        console.error("Error checking nullifier:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      const exists = data && data.length > 0;

      if (exists) {
        console.log(
          `⚠️  Nullifier already exists: ${nullifier.substring(0, 10)}... (scope: ${scope})`
        );
      }

      return exists;
    } catch (error) {
      console.error("Nullifier check failed:", error);
      throw error;
    }
  }

  /**
   * Store nullifier with 90-day expiry
   * Follows Self Protocol standard for verification persistence
   */
  async storeNullifier(
    nullifier: string,
    scope: string,
    userId?: string,
    nationality?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Calculate expiry date (90 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      const record: NullifierRecord = {
        nullifier,
        scope,
        expires_at: expiresAt.toISOString(),
        user_id: userId,
        nationality,
        metadata: metadata || {},
      };

      const { error } = await this.supabase.from("nullifiers").insert(record);

      if (error) {
        // Check for unique constraint violation
        if (error.code === "23505") {
          throw new Error("Nullifier already exists for this scope");
        }
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(
        `✅ Nullifier stored: ${nullifier.substring(0, 10)}... (scope: ${scope}, expires: ${expiresAt.toISOString()})`
      );
    } catch (error) {
      console.error("Failed to store nullifier:", error);
      throw error;
    }
  }

  /**
   * Get nullifier record by nullifier and scope
   */
  async getNullifier(
    nullifier: string,
    scope: string
  ): Promise<NullifierRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from("nullifiers")
        .select("*")
        .eq("nullifier", nullifier)
        .eq("scope", scope)
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Failed to get nullifier:", error);
      throw error;
    }
  }

  /**
   * Get all nullifiers for a scope (for analytics)
   */
  async getNullifiersByScope(
    scope: string,
    limit: number = 100
  ): Promise<NullifierRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from("nullifiers")
        .select("*")
        .eq("scope", scope)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Failed to get nullifiers by scope:", error);
      throw error;
    }
  }

  /**
   * Delete expired nullifiers (cleanup job)
   * Should be run periodically (e.g., daily cron)
   */
  async cleanupExpiredNullifiers(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from("nullifiers")
        .delete()
        .lt("expires_at", new Date().toISOString())
        .select("id");

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const deletedCount = data?.length || 0;
      console.log(`🧹 Cleaned up ${deletedCount} expired nullifiers`);
      return deletedCount;
    } catch (error) {
      console.error("Cleanup failed:", error);
      throw error;
    }
  }

  /**
   * Get statistics for a scope
   */
  async getScopeStats(scope: string): Promise<{
    total: number;
    active: number;
    expired: number;
  }> {
    try {
      const now = new Date().toISOString();

      // Total count
      const { count: total, error: totalError } = await this.supabase
        .from("nullifiers")
        .select("id", { count: "exact", head: true })
        .eq("scope", scope);

      if (totalError) throw totalError;

      // Active count (not expired)
      const { count: active, error: activeError } = await this.supabase
        .from("nullifiers")
        .select("id", { count: "exact", head: true })
        .eq("scope", scope)
        .gt("expires_at", now);

      if (activeError) throw activeError;

      // Expired count
      const { count: expired, error: expiredError } = await this.supabase
        .from("nullifiers")
        .select("id", { count: "exact", head: true })
        .eq("scope", scope)
        .lt("expires_at", now);

      if (expiredError) throw expiredError;

      return {
        total: total || 0,
        active: active || 0,
        expired: expired || 0,
      };
    } catch (error) {
      console.error("Failed to get scope stats:", error);
      throw error;
    }
  }

  /**
   * Check if database service is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }
}
