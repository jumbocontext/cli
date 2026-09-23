import { Goal } from "../../../../domain/goals/Goal.js";
import { GoalErrorMessages, formatErrorMessage } from "../../../../domain/goals/Constants.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { IGetGoalViewReader } from "../get/IGetGoalViewReader.js";
import { IGoalPostponedEventReader } from "./IGoalPostponedEventReader.js";
import { IGoalPostponedEventWriter } from "./IGoalPostponedEventWriter.js";
import { PostponeGoalCommand } from "./PostponeGoalCommand.js";

export class PostponeGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalPostponedEventWriter,
    private readonly eventReader: IGoalPostponedEventReader,
    private readonly goalReader: IGetGoalViewReader,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: PostponeGoalCommand): Promise<{ status: string }> {
    const view = await this.goalReader.findById(command.goalId);
    if (!view) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_NOT_FOUND, { id: command.goalId })
      );
    }

    const history = await this.eventReader.readStream(command.goalId);
    const goal = Goal.rehydrate(command.goalId, history);
    const event = goal.postpone();

    await this.eventWriter.append(event);
    await this.eventBus.publish(event);

    return { status: event.payload.status };
  }
}
