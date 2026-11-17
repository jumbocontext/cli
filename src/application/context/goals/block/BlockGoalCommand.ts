/**
 * Command to block a goal with a reason.
 * Used to mark a goal as blocked when progress is impeded.
 */
export interface BlockGoalCommand {
  readonly goalId: string;
  readonly note: string; // Reason why the goal is blocked
}
