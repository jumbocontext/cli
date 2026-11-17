/**
 * PrerequisitePolicy - Pure domain rule that validates prerequisite satisfaction.
 *
 * A prerequisite is satisfied when its status is SUBMITTED or later
 * (SUBMITTED, IN_REVIEW, APPROVED, CODIFYING, DONE).
 *
 * This is a stateless domain policy with no I/O dependencies.
 * The application layer is responsible for resolving prerequisite data
 * before passing it to this policy for evaluation.
 */

import {
  SATISFIED_PREREQUISITE_STATUSES,
  GoalStatusType,
} from "../Constants.js";

export interface PrerequisiteStatus {
  readonly goalId: string;
  readonly objective: string;
  readonly status: GoalStatusType;
}

export interface UnsatisfiedPrerequisite {
  readonly goalId: string;
  readonly objective: string;
  readonly status: GoalStatusType;
}

export interface PrerequisiteCheckResult {
  readonly satisfied: boolean;
  readonly unsatisfied: UnsatisfiedPrerequisite[];
}

export class PrerequisitePolicy {
  /**
   * Checks whether all prerequisites are at SUBMITTED+ status.
   *
   * @param prerequisites - Resolved prerequisite statuses (fetched by application layer)
   * @returns PrerequisiteCheckResult with satisfaction status and unsatisfied details
   */
  check(prerequisites: PrerequisiteStatus[]): PrerequisiteCheckResult {
    if (prerequisites.length === 0) {
      return { satisfied: true, unsatisfied: [] };
    }

    const unsatisfied: UnsatisfiedPrerequisite[] = [];

    for (const prereq of prerequisites) {
      if (!SATISFIED_PREREQUISITE_STATUSES.has(prereq.status)) {
        unsatisfied.push({
          goalId: prereq.goalId,
          objective: prereq.objective,
          status: prereq.status,
        });
      }
    }

    return {
      satisfied: unsatisfied.length === 0,
      unsatisfied,
    };
  }
}
