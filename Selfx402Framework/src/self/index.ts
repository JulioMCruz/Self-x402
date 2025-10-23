/**
 * @selfx402/framework/self
 *
 * Self Protocol integration for zero-knowledge proof verification
 * Follows official Self backend standard (@selfxyz/core)
 */

export * from "./types.js";
export * from "./database.js";
export * from "./verifier.js";
export * from "./verification-sessions.js";

// Re-export commonly used items
export { DatabaseService } from "./database.js";
export { SelfVerifier } from "./verifier.js";
export { VerificationSessionsService } from "./verification-sessions.js";
export type {
  SelfRequirements,
  SelfVerificationResult,
  NullifierRecord,
  DatabaseConfig,
} from "./types.js";
export type {
  VerificationSession,
  VerificationStatus,
} from "./verification-sessions.js";

// Re-export @selfxyz/core utilities for convenience
export {
  SelfBackendVerifier,
  AllIds,
  DefaultConfigStore,
} from "@selfxyz/core";
