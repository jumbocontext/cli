import { BlockGoalCommand } from "./BlockGoalCommand.js";
import { IGoalBlockedEventWriter } from "./IGoalBlockedEventWriter.js";
import { IGoalBlockedEventReader } from "./IGoalBlockedEventReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Goal } from "../../../../domain/goals/Goal.js";
import { GoalEvent } from "../../../../domain/goals/EventIndex.js";

/**
 * Command handler for BlockGoalCommand.
 * Orchestrates the blocking of a goal and event publication.
 */
export class BlockGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalBlockedEventWriter,
    private readonly eventReader: IGoalBlockedEventReader,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: BlockGoalCommand): Promise<{ goalId: string }> {
    // 1. Load aggregate from event stream
    const history = await this.eventReader.readStream(command.goalId);
    const goal = Goal.rehydrate(command.goalId, history as GoalEvent[]);

    // 2. Domain logic produces event (validates state and input)
    const event = goal.block(command.note);

    // 3. Persist event to file store
    await this.eventWriter.append(event);

    // 4. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { goalId: command.goalId };
  }
}
