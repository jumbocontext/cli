import { UnblockGoalCommand } from "./UnblockGoalCommand.js";
import { IGoalUnblockedEventWriter } from "./IGoalUnblockedEventWriter.js";
import { IGoalUnblockedEventReader } from "./IGoalUnblockedEventReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Goal } from "../../../../domain/goals/Goal.js";
import { GoalEvent } from "../../../../domain/goals/EventIndex.js";

/**
 * Command handler for UnblockGoalCommand.
 * Orchestrates the unblocking of a goal and event publication.
 */
export class UnblockGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalUnblockedEventWriter,
    private readonly eventReader: IGoalUnblockedEventReader,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: UnblockGoalCommand): Promise<{ goalId: string }> {
    // 1. Load aggregate from event stream
    const history = await this.eventReader.readStream(command.goalId);
    if (history.length === 0) {
      throw new Error(`Goal not found: ${command.goalId}`);
    }

    const goal = Goal.rehydrate(command.goalId, history as GoalEvent[]);

    // 2. Domain logic produces event (validates state and input)
    const event = goal.unblock(command.note);

    // 3. Persist event to file store
    await this.eventWriter.append(event);

    // 4. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { goalId: command.goalId };
  }
}
