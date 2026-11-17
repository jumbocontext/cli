/**
 * GoalClaimPolicy - Validates goal claim rules
 *
 * Determines whether a worker can claim a goal based on:
 * - Whether the goal is currently claimed
 * - Whether the claim has expired
 * - Whether the requesting worker already owns the claim
 *
 * This is an application layer policy that uses infrastructure
 * abstractions (IGoalClaimStore, IClock) to make decisions.
 */

import { IClock } from "../../../time-and-date/IClock.js";
import { WorkerId } from "../../../host/workers/WorkerId.js";
import { GoalClaim } from "./GoalClaim.js";
import { IGoalClaimStore } from "./IGoalClaimStore.js";

/**
 * Result of a claim validation check.
 */
export type ClaimValidationResult =
  | { allowed: true }
  | { allowed: false; reason: ClaimRejectionReason; existingClaim: GoalClaim };

/**
 * Result of preparing a claim for entry or re-entry.
 */
export type EntryClaimResult =
  | { allowed: true; claim: GoalClaim }
  | { allowed: false; reason: ClaimRejectionReason; existingClaim: GoalClaim };

/**
 * Reasons why a claim was rejected.
 */
export type ClaimRejectionReason = "CLAIMED_BY_ANOTHER_WORKER";

export class GoalClaimPolicy {
  private readonly claimStore: IGoalClaimStore;
  private readonly clock: IClock;

  constructor(claimStore: IGoalClaimStore, clock: IClock) {
    this.claimStore = claimStore;
    this.clock = clock;
  }

  /**
   * Checks if a worker can claim a goal.
   *
   * A worker can claim a goal if:
   * 1. The goal has no existing claim
   * 2. The existing claim has expired
   * 3. The worker already owns the claim
   *
   * @param goalId - The ID of the goal to claim
   * @param workerId - The ID of the worker attempting to claim
   * @returns ClaimValidationResult indicating if the claim is allowed
   */
  canClaim(goalId: string, workerId: WorkerId): ClaimValidationResult {
    const existingClaim = this.claimStore.getClaim(goalId);

    // No existing claim - worker can claim
    if (!existingClaim) {
      return { allowed: true };
    }

    // Check if claim has expired
    const nowIso = this.clock.nowIso();
    const now = new Date(nowIso);
    const expiresAt = new Date(existingClaim.claimExpiresAt);
    if (now >= expiresAt) {
      return { allowed: true };
    }

    // Check if requesting worker already owns the claim
    if (existingClaim.claimedBy === workerId) {
      return { allowed: true };
    }

    // Another worker has an active claim
    return {
      allowed: false,
      reason: "CLAIMED_BY_ANOTHER_WORKER",
      existingClaim,
    };
  }

  /**
   * Prepares claim data without persisting to the store.
   * Use this when you need claim data for event payloads before persistence.
   *
   * @param goalId - The ID of the goal to claim
   * @param workerId - The ID of the worker claiming the goal
   * @param durationMs - Duration of the claim in milliseconds
   * @returns The prepared GoalClaim (not yet stored)
   */
  prepareClaim(
    goalId: string,
    workerId: WorkerId,
    durationMs: number,
  ): GoalClaim {
    const nowIso = this.clock.nowIso();
    const now = new Date(nowIso);
    const expiresAt = new Date(now.getTime() + durationMs);

    return {
      goalId,
      claimedBy: workerId,
      claimedAt: nowIso,
      claimExpiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Stores a prepared claim in the claim store.
   *
   * @param claim - The claim to store
   */
  storeClaim(claim: GoalClaim): void {
    this.claimStore.setClaim(claim);
  }

  /**
   * Creates a new claim for a goal.
   *
   * @param goalId - The ID of the goal to claim
   * @param workerId - The ID of the worker claiming the goal
   * @param durationMs - Duration of the claim in milliseconds
   * @returns The created GoalClaim
   */
  createClaim(
    goalId: string,
    workerId: WorkerId,
    durationMs: number,
  ): GoalClaim {
    const claim = this.prepareClaim(goalId, workerId, durationMs);
    this.claimStore.setClaim(claim);
    return claim;
  }

  /**
   * Prepares a refreshed claim by extending its expiration, without persisting.
   * Use this when you need claim data for event payloads before persistence.
   *
   * @param goalId - The ID of the goal
   * @param workerId - The ID of the worker refreshing the claim
   * @param durationMs - New duration from now in milliseconds
   * @returns The prepared refreshed GoalClaim (not yet stored)
   */
  prepareRefreshedClaim(
    goalId: string,
    workerId: WorkerId,
    durationMs: number,
  ): GoalClaim {
    const existingClaim = this.claimStore.getClaim(goalId);
    const nowIso = this.clock.nowIso();
    const now = new Date(nowIso);
    const expiresAt = new Date(now.getTime() + durationMs);

    return {
      goalId,
      claimedBy: workerId,
      claimedAt: existingClaim?.claimedAt ?? nowIso,
      claimExpiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Refreshes an existing claim by extending its expiration.
   *
   * @param goalId - The ID of the goal
   * @param workerId - The ID of the worker refreshing the claim
   * @param durationMs - New duration from now in milliseconds
   * @returns The updated GoalClaim
   */
  refreshClaim(
    goalId: string,
    workerId: WorkerId,
    durationMs: number,
  ): GoalClaim {
    const claim = this.prepareRefreshedClaim(goalId, workerId, durationMs);
    this.claimStore.setClaim(claim);
    return claim;
  }

  /**
   * Releases a claim on a goal.
   *
   * @param goalId - The ID of the goal to release
   */
  releaseClaim(goalId: string): void {
    this.claimStore.releaseClaim(goalId);
  }

  /**
   * Validates and prepares a claim for goal entry or idempotent re-entry.
   * This is the reusable pattern shared across all entry commands (refine, start, review, codify).
   *
   * Handles three scenarios:
   * 1. No existing claim or expired claim → prepares new claim
   * 2. Same worker holds active claim → prepares refreshed claim (lease renewal)
   * 3. Another worker holds active claim → returns rejection
   *
   * @param goalId - The ID of the goal to claim
   * @param workerId - The ID of the worker attempting entry
   * @param durationMs - Duration of the claim in milliseconds
   * @returns EntryClaimResult indicating if the claim is allowed and the prepared claim
   */
  prepareEntryClaim(
    goalId: string,
    workerId: WorkerId,
    durationMs: number,
  ): EntryClaimResult {
    const existingClaim = this.claimStore.getClaim(goalId);

    // No existing claim - prepare new claim
    if (!existingClaim) {
      return {
        allowed: true,
        claim: this.prepareClaim(goalId, workerId, durationMs),
      };
    }

    // Check if requesting worker already owns the claim (lease renewal)
    if (existingClaim.claimedBy === workerId) {
      return {
        allowed: true,
        claim: this.prepareRefreshedClaim(goalId, workerId, durationMs),
      };
    }

    // Check if claim has expired (re-entry after crash)
    const nowIso = this.clock.nowIso();
    const now = new Date(nowIso);
    const expiresAt = new Date(existingClaim.claimExpiresAt);
    if (now >= expiresAt) {
      return {
        allowed: true,
        claim: this.prepareClaim(goalId, workerId, durationMs),
      };
    }

    // Another worker has an active claim
    return {
      allowed: false,
      reason: "CLAIMED_BY_ANOTHER_WORKER",
      existingClaim,
    };
  }
}
