import { Database } from "better-sqlite3";
import { IGetGoalViewReader } from "../../../../application/context/goals/get/IGetGoalViewReader.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";
import { GoalRecord } from "../GoalRecord.js";
import { GoalRecordMapper } from "../GoalRecordMapper.js";

export class SqliteGetGoalViewReader implements IGetGoalViewReader {
  private readonly mapper = new GoalRecordMapper();

  constructor(private readonly db: Database) {}

  async findById(goalId: string): Promise<GoalView | null> {
    const row = this.db
      .prepare("SELECT *, goalId AS id FROM goal_views WHERE goalId = ?")
      .get(goalId) as GoalRecord | undefined;

    return row ? this.mapper.toView(row) : null;
  }
}
