/**
 * Port interface for reading goal projections.
 * Used to quickly check goal existence before progress update.
 */
export interface IGoalProgressUpdateReader {
  findById(
    goalId: string,
  ): Promise<{ goalId: string; status: string; progress: string[] } | null>;
}
