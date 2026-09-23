/** Command that transitions a goal from postponed to defined. */
export interface ReinstateGoalCommand {
  readonly goalId: string;
}
