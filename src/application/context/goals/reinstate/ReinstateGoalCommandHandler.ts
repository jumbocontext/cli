import { Goal } from "../../../../domain/goals/Goal.js";
import { GoalErrorMessages, formatErrorMessage } from "../../../../domain/goals/Constants.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { IGetGoalViewReader } from "../get/IGetGoalViewReader.js";
import { IGoalReinstatedEventReader } from "./IGoalReinstatedEventReader.js";
import { IGoalReinstatedEventWriter } from "./IGoalReinstatedEventWriter.js";
import { ReinstateGoalCommand } from "./ReinstateGoalCommand.js";

export class ReinstateGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalReinstatedEventWriter,
    private readonly eventReader: IGoalReinstatedEventReader,
    private readonly goalReader: IGetGoalViewReader,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: ReinstateGoalCommand): Promise<{ status: string }> {
    const view = await this.goalReader.findById(command.goalId);
    if (!view) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_NOT_FOUND, { id: command.goalId })
      );
    }

    const history = await this.eventReader.readStream(command.goalId);
    const goal = Goal.rehydrate(command.goalId, history);
    const event = goal.reinstate();

    await this.eventWriter.append(event);
    await this.eventBus.publish(event);

    return { status: event.payload.status };
  }
}
