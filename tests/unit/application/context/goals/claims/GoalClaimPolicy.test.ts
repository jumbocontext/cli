/**
 * Tests for GoalClaimPolicy
 */

import { GoalClaimPolicy } from "../../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { IGoalClaimStore } from "../../../../../../src/application/context/goals/claims/IGoalClaimStore";
import { GoalClaim } from "../../../../../../src/application/context/goals/claims/GoalClaim";
import { IClock } from "../../../../../../src/application/time-and-date/IClock";
import { createWorkerId, WorkerId } from "../../../../../../src/application/host/workers/WorkerId";
import { jest } from "@jest/globals";

describe("GoalClaimPolicy", () => {
  let claimStore: IGoalClaimStore;
  let clock: IClock;
  let policy: GoalClaimPolicy;

  const workerA: WorkerId = createWorkerId("worker-a-uuid");
  const workerB: WorkerId = createWorkerId("worker-b-uuid");
  const goalId = "goal_123";
  const claimDurationMs = 30 * 60 * 1000; // 30 minutes

  beforeEach(() => {
    // Mock claim store
    claimStore = {
      getClaim: jest.fn(),
      setClaim: jest.fn(),
      releaseClaim: jest.fn(),
    };

    // Mock clock
    clock = {
      nowIso: jest.fn().mockReturnValue("2025-01-15T10:00:00.000Z"),
    };

    policy = new GoalClaimPolicy(claimStore, clock);
  });

  describe("canClaim", () => {
    it("allows claim when no existing claim exists", () => {
      (claimStore.getClaim as jest.Mock).mockReturnValue(null);

      const result = policy.canClaim(goalId, workerA);

      expect(result.allowed).toBe(true);
    });

    it("allows claim when existing claim has expired", () => {
      const expiredClaim: GoalClaim = {
        goalId,
        claimedBy: workerB,
        claimedAt: "2025-01-15T08:00:00.000Z",
        claimExpiresAt: "2025-01-15T09:00:00.000Z", // Expired (before 10:00)
      };
      (claimStore.getClaim as jest.Mock).mockReturnValue(expiredClaim);

      const result = policy.canClaim(goalId, workerA);

      expect(result.allowed).toBe(true);
    });

    it("allows claim when requesting worker already owns the claim", () => {
      const existingClaim: GoalClaim = {
        goalId,
        claimedBy: workerA,
        claimedAt: "2025-01-15T09:30:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z", // Active
      };
      (claimStore.getClaim as jest.Mock).mockReturnValue(existingClaim);

      const result = policy.canClaim(goalId, workerA);

      expect(result.allowed).toBe(true);
    });

    it("rejects claim when another worker has an active claim", () => {
      const existingClaim: GoalClaim = {
        goalId,
        claimedBy: workerB,
        claimedAt: "2025-01-15T09:30:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z", // Active
      };
      (claimStore.getClaim as jest.Mock).mockReturnValue(existingClaim);

      const result = policy.canClaim(goalId, workerA);

      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason).toBe("CLAIMED_BY_ANOTHER_WORKER");
        expect(result.existingClaim).toEqual(existingClaim);
      }
    });

    it("rejects claim at exact expiration time", () => {
      // Clock at 10:00:00.000Z, claim expires at exactly 10:00:00.000Z
      const existingClaim: GoalClaim = {
        goalId,
        claimedBy: workerB,
        claimedAt: "2025-01-15T09:30:00.000Z",
        claimExpiresAt: "2025-01-15T10:00:00.000Z", // Exactly now
      };
      (claimStore.getClaim as jest.Mock).mockReturnValue(existingClaim);

      const result = policy.canClaim(goalId, workerA);

      // At exact expiration, claim should be considered expired (now >= expiresAt)
      expect(result.allowed).toBe(true);
    });
  });

  describe("createClaim", () => {
    it("creates a new claim with correct fields", () => {
      const claim = policy.createClaim(goalId, workerA, claimDurationMs);

      expect(claim.goalId).toBe(goalId);
      expect(claim.claimedBy).toBe(workerA);
      expect(claim.claimedAt).toBe("2025-01-15T10:00:00.000Z");
      expect(claim.claimExpiresAt).toBe("2025-01-15T10:30:00.000Z"); // +30 min
    });

    it("persists the claim to the store", () => {
      const claim = policy.createClaim(goalId, workerA, claimDurationMs);

      expect(claimStore.setClaim).toHaveBeenCalledWith(claim);
    });

    it("calculates expiration based on duration", () => {
      const oneHourMs = 60 * 60 * 1000;
      const claim = policy.createClaim(goalId, workerA, oneHourMs);

      expect(claim.claimExpiresAt).toBe("2025-01-15T11:00:00.000Z"); // +1 hour
    });
  });

  describe("refreshClaim", () => {
    it("updates expiration while preserving original claimedAt", () => {
      const existingClaim: GoalClaim = {
        goalId,
        claimedBy: workerA,
        claimedAt: "2025-01-15T08:00:00.000Z",
        claimExpiresAt: "2025-01-15T08:30:00.000Z",
      };
      (claimStore.getClaim as jest.Mock).mockReturnValue(existingClaim);

      const refreshedClaim = policy.refreshClaim(goalId, workerA, claimDurationMs);

      expect(refreshedClaim.claimedAt).toBe("2025-01-15T08:00:00.000Z"); // Original
      expect(refreshedClaim.claimExpiresAt).toBe("2025-01-15T10:30:00.000Z"); // New
    });

    it("creates new claimedAt if no existing claim", () => {
      (claimStore.getClaim as jest.Mock).mockReturnValue(null);

      const claim = policy.refreshClaim(goalId, workerA, claimDurationMs);

      expect(claim.claimedAt).toBe("2025-01-15T10:00:00.000Z"); // Uses now
    });

    it("persists the refreshed claim to the store", () => {
      (claimStore.getClaim as jest.Mock).mockReturnValue(null);

      const claim = policy.refreshClaim(goalId, workerA, claimDurationMs);

      expect(claimStore.setClaim).toHaveBeenCalledWith(claim);
    });
  });

  describe("releaseClaim", () => {
    it("removes the claim from the store", () => {
      policy.releaseClaim(goalId);

      expect(claimStore.releaseClaim).toHaveBeenCalledWith(goalId);
    });
  });

  describe("prepareClaim", () => {
    it("prepares claim data without persisting to store", () => {
      const claim = policy.prepareClaim(goalId, workerA, claimDurationMs);

      // Verify claim data is returned
      expect(claim.goalId).toBe(goalId);
      expect(claim.claimedBy).toBe(workerA);
      expect(claim.claimedAt).toBe("2025-01-15T10:00:00.000Z");
      expect(claim.claimExpiresAt).toBe("2025-01-15T10:30:00.000Z");

      // Verify setClaim was NOT called
      expect(claimStore.setClaim).not.toHaveBeenCalled();
    });
  });

  describe("storeClaim", () => {
    it("persists prepared claim to the store", () => {
      const claim: GoalClaim = {
        goalId,
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      policy.storeClaim(claim);

      expect(claimStore.setClaim).toHaveBeenCalledWith(claim);
    });
  });

  describe("prepareEntryClaim", () => {
    it("prepares new claim when no existing claim exists", () => {
      (claimStore.getClaim as jest.Mock).mockReturnValue(null);

      const result = policy.prepareEntryClaim(goalId, workerA, claimDurationMs);

      expect(result.allowed).toBe(true);
      if (result.allowed) {
        expect(result.claim.goalId).toBe(goalId);
        expect(result.claim.claimedBy).toBe(workerA);
        expect(result.claim.claimedAt).toBe("2025-01-15T10:00:00.000Z");
        expect(result.claim.claimExpiresAt).toBe("2025-01-15T10:30:00.000Z");
      }
    });

    it("prepares refreshed claim when same worker holds active claim (lease renewal)", () => {
      const existingClaim: GoalClaim = {
        goalId,
        claimedBy: workerA,
        claimedAt: "2025-01-15T08:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z", // Active
      };
      (claimStore.getClaim as jest.Mock).mockReturnValue(existingClaim);

      const result = policy.prepareEntryClaim(goalId, workerA, claimDurationMs);

      expect(result.allowed).toBe(true);
      if (result.allowed) {
        expect(result.claim.claimedBy).toBe(workerA);
        // Preserves original claimedAt (lease renewal)
        expect(result.claim.claimedAt).toBe("2025-01-15T08:00:00.000Z");
        // New expiration
        expect(result.claim.claimExpiresAt).toBe("2025-01-15T10:30:00.000Z");
      }
    });

    it("prepares new claim when existing claim has expired (crash recovery)", () => {
      const expiredClaim: GoalClaim = {
        goalId,
        claimedBy: workerB,
        claimedAt: "2025-01-15T07:00:00.000Z",
        claimExpiresAt: "2025-01-15T09:00:00.000Z", // Expired (before 10:00)
      };
      (claimStore.getClaim as jest.Mock).mockReturnValue(expiredClaim);

      const result = policy.prepareEntryClaim(goalId, workerA, claimDurationMs);

      expect(result.allowed).toBe(true);
      if (result.allowed) {
        expect(result.claim.claimedBy).toBe(workerA);
        // New claimedAt (not preserving expired worker's time)
        expect(result.claim.claimedAt).toBe("2025-01-15T10:00:00.000Z");
        expect(result.claim.claimExpiresAt).toBe("2025-01-15T10:30:00.000Z");
      }
    });

    it("rejects when another worker holds an active claim", () => {
      const activeClaim: GoalClaim = {
        goalId,
        claimedBy: workerB,
        claimedAt: "2025-01-15T09:30:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z", // Active
      };
      (claimStore.getClaim as jest.Mock).mockReturnValue(activeClaim);

      const result = policy.prepareEntryClaim(goalId, workerA, claimDurationMs);

      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason).toBe("CLAIMED_BY_ANOTHER_WORKER");
        expect(result.existingClaim).toEqual(activeClaim);
      }
    });

    it("allows claim at exact expiration time (expired)", () => {
      const expiredClaim: GoalClaim = {
        goalId,
        claimedBy: workerB,
        claimedAt: "2025-01-15T09:30:00.000Z",
        claimExpiresAt: "2025-01-15T10:00:00.000Z", // Exactly now
      };
      (claimStore.getClaim as jest.Mock).mockReturnValue(expiredClaim);

      const result = policy.prepareEntryClaim(goalId, workerA, claimDurationMs);

      expect(result.allowed).toBe(true);
    });
  });

  describe("prepareRefreshedClaim", () => {
    it("prepares refreshed claim data without persisting to store", () => {
      const existingClaim: GoalClaim = {
        goalId,
        claimedBy: workerA,
        claimedAt: "2025-01-15T08:00:00.000Z",
        claimExpiresAt: "2025-01-15T08:30:00.000Z",
      };
      (claimStore.getClaim as jest.Mock).mockReturnValue(existingClaim);

      const claim = policy.prepareRefreshedClaim(goalId, workerA, claimDurationMs);

      // Verify claim data preserves original claimedAt
      expect(claim.goalId).toBe(goalId);
      expect(claim.claimedBy).toBe(workerA);
      expect(claim.claimedAt).toBe("2025-01-15T08:00:00.000Z"); // Original
      expect(claim.claimExpiresAt).toBe("2025-01-15T10:30:00.000Z"); // New

      // Verify setClaim was NOT called
      expect(claimStore.setClaim).not.toHaveBeenCalled();
    });

    it("creates new claimedAt if no existing claim", () => {
      (claimStore.getClaim as jest.Mock).mockReturnValue(null);

      const claim = policy.prepareRefreshedClaim(goalId, workerA, claimDurationMs);

      expect(claim.claimedAt).toBe("2025-01-15T10:00:00.000Z"); // Uses now
      expect(claimStore.setClaim).not.toHaveBeenCalled();
    });
  });
});
