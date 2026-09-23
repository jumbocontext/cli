import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalPostponedEvent } from "../../../../domain/goals/postpone/GoalPostponedEvent.js";
import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { IGoalPostponedProjector } from "./IGoalPostponedProjector.js";

export class GoalPostponedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalPostponedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    await this.projector.applyGoalPostponed(event as GoalPostponedEvent);
  }
}
