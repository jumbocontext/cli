/**
 * Command to unblock a goal and resume work.
 * Used to mark a goal as unblocked after a blocker has been resolved.
 */
export interface UnblockGoalCommand {
  readonly goalId: string;
  readonly note?: string; // Optional resolution note
}
