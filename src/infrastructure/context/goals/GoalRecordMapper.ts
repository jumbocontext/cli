/**
 * GoalRecordMapper - Maps infrastructure GoalRecord to application GoalView.
 *
 * Handles JSON.parse for array fields and null-to-undefined coercion
 * for optional fields at the infrastructure-application boundary.
 */

import { GoalView } from "../../../application/context/goals/GoalView.js";
import { GoalStatusType } from "../../../domain/goals/Constants.js";
import { GoalRecord } from "./GoalRecord.js";

export class GoalRecordMapper {
  toView(record: GoalRecord): GoalView {
    return {
      goalId: record.id,
      title: record.title,
      objective: record.objective,
      successCriteria: JSON.parse(record.successCriteria || "[]"),
      scopeIn: JSON.parse(record.scopeIn || "[]"),
      scopeOut: JSON.parse(record.scopeOut || "[]"),
      status: record.status as GoalStatusType,
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      note: record.note || undefined,
      reviewIssues: record.reviewIssues || undefined,
      progress: JSON.parse(record.progress || "[]"),
      claimedBy: record.claimedBy || undefined,
      claimedAt: record.claimedAt || undefined,
      claimExpiresAt: record.claimExpiresAt || undefined,
      nextGoalId: record.nextGoalId || undefined,
      prerequisiteGoals: record.prerequisiteGoals
        ? JSON.parse(record.prerequisiteGoals)
        : undefined,
      branch: record.branch || undefined,
      worktree: record.worktree || undefined,
    };
  }
}
