/**
 * Database operations for deferred payment vouchers and settlements
 * Handles CRUD operations for vouchers, settlements, and aggregation queries
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  VoucherRecord,
  SettlementRecord,
  AccumulatedBalance,
} from "./types.js";

export interface VoucherDatabaseConfig {
  url: string;
  serviceRoleKey: string;
}

/**
 * Service for managing voucher and settlement records in Supabase
 */
export class VoucherDatabaseService {
  private supabase: SupabaseClient;

  constructor(config: VoucherDatabaseConfig) {
    if (!config.url || !config.serviceRoleKey) {
      throw new Error(
        "Missing Supabase credentials: url and serviceRoleKey required"
      );
    }

    this.supabase = createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  /**
   * Store a new voucher record
   */
  async storeVoucher(voucher: Omit<VoucherRecord, "id" | "created_at">): Promise<VoucherRecord> {
    const { data, error } = await this.supabase
      .from("vouchers")
      .insert(voucher)
      .select()
      .single();

    if (error) throw new Error(`Failed to store voucher: ${error.message}`);
    return data;
  }

  /**
   * Get voucher by nonce (unique identifier)
   */
  async getVoucherByNonce(nonce: string): Promise<VoucherRecord | null> {
    const { data, error } = await this.supabase
      .from("vouchers")
      .select()
      .eq("nonce", nonce)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to get voucher: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Get all unsettled vouchers for a payer-payee pair
   */
  async getUnsettledVouchers(
    payerAddress: string,
    payeeAddress: string,
    network: string
  ): Promise<VoucherRecord[]> {
    const { data, error } = await this.supabase
      .from("vouchers")
      .select()
      .eq("payer_address", payerAddress.toLowerCase())
      .eq("payee_address", payeeAddress.toLowerCase())
      .eq("network", network)
      .eq("settled", false)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to get unsettled vouchers: ${error.message}`);
    return data || [];
  }

  /**
   * Get accumulated balance for a payee (grouped by payer)
   */
  async getAccumulatedBalances(
    payeeAddress: string,
    network: string
  ): Promise<AccumulatedBalance[]> {
    const { data, error } = await this.supabase
      .from("vouchers")
      .select()
      .eq("payee_address", payeeAddress.toLowerCase())
      .eq("network", network)
      .eq("settled", false);

    if (error) throw new Error(`Failed to get accumulated balances: ${error.message}`);

    if (!data || data.length === 0) return [];

    // Group by payer
    const balanceMap = new Map<string, AccumulatedBalance>();

    for (const voucher of data) {
      const existing = balanceMap.get(voucher.payer_address);

      if (existing) {
        existing.totalAmount += BigInt(voucher.amount);
        existing.voucherCount++;
        existing.voucherIds.push(voucher.id!);
      } else {
        balanceMap.set(voucher.payer_address, {
          payee: payeeAddress as `0x${string}`,
          payer: voucher.payer_address as `0x${string}`,
          totalAmount: BigInt(voucher.amount),
          voucherCount: 1,
          voucherIds: [voucher.id!],
        });
      }
    }

    return Array.from(balanceMap.values());
  }

  /**
   * Mark vouchers as settled
   */
  async markVouchersSettled(voucherIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from("vouchers")
      .update({ settled: true })
      .in("id", voucherIds);

    if (error) throw new Error(`Failed to mark vouchers settled: ${error.message}`);
  }

  /**
   * Store settlement record
   */
  async storeSettlement(
    settlement: Omit<SettlementRecord, "id" | "settled_at">
  ): Promise<SettlementRecord> {
    const { data, error } = await this.supabase
      .from("settlements")
      .insert(settlement)
      .select()
      .single();

    if (error) throw new Error(`Failed to store settlement: ${error.message}`);
    return data;
  }

  /**
   * Get settlement by transaction hash
   */
  async getSettlementByTxHash(txHash: string): Promise<SettlementRecord | null> {
    const { data, error } = await this.supabase
      .from("settlements")
      .select()
      .eq("tx_hash", txHash)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to get settlement: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Get all settlements for a payee
   */
  async getPayeeSettlements(
    payeeAddress: string,
    network: string
  ): Promise<SettlementRecord[]> {
    const { data, error } = await this.supabase
      .from("settlements")
      .select()
      .eq("payee_address", payeeAddress.toLowerCase())
      .eq("network", network)
      .order("settled_at", { ascending: false });

    if (error) throw new Error(`Failed to get settlements: ${error.message}`);
    return data || [];
  }

  /**
   * Delete expired vouchers (cleanup)
   */
  async deleteExpiredVouchers(): Promise<number> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("vouchers")
      .delete()
      .lt("valid_until", now)
      .eq("settled", false)
      .select();

    if (error) throw new Error(`Failed to delete expired vouchers: ${error.message}`);
    return data?.length || 0;
  }
}
