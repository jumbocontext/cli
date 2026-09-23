import { IGetGoalsGateway } from "./IGetGoalsGateway.js";
import { GetGoalsRequest } from "./GetGoalsRequest.js";
import { GetGoalsResponse } from "./GetGoalsResponse.js";
import { IGoalStatusReader } from "../IGoalStatusReader.js";
import { GoalStatus, GoalStatusType } from "../../../../domain/goals/Constants.js";

const VALID_STATUSES: readonly string[] = Object.values(GoalStatus);

const DEFAULT_STATUSES: readonly GoalStatusType[] = [
  GoalStatus.TODO,
  GoalStatus.POSTPONED,
  GoalStatus.REFINED,
  GoalStatus.DOING,
  GoalStatus.BLOCKED,
  GoalStatus.PAUSED,
  GoalStatus.INREVIEW,
  GoalStatus.QUALIFIED,
  GoalStatus.REJECTED,
  GoalStatus.UNBLOCKED,
  GoalStatus.SUBMITTED,
  GoalStatus.CODIFYING,
];

export class LocalGetGoalsGateway implements IGetGoalsGateway {
  constructor(
    private readonly goalStatusReader: IGoalStatusReader
  ) {}

  async getGoals(request: GetGoalsRequest): Promise<GetGoalsResponse> {
    const statuses = request.statuses;

    if (statuses && statuses.length > 0) {
      const invalidStatuses = statuses.filter(s => !VALID_STATUSES.includes(s));
      if (invalidStatuses.length > 0) {
        throw new Error(
          `Invalid status: ${invalidStatuses.join(", ")}. Valid statuses: ${VALID_STATUSES.join(", ")}`
        );
      }
    }

    const statusesToFilter = (statuses && statuses.length > 0)
      ? statuses
      : DEFAULT_STATUSES as readonly string[];

    const allGoals = await this.goalStatusReader.findAll();
    const goals = allGoals.filter(goal => statusesToFilter.includes(goal.status));

    return { goals };
  }
}
