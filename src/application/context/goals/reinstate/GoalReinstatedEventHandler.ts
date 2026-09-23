import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalReinstatedEvent } from "../../../../domain/goals/reinstate/GoalReinstatedEvent.js";
import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { IGoalReinstatedProjector } from "./IGoalReinstatedProjector.js";

export class GoalReinstatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalReinstatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    await this.projector.applyGoalReinstated(event as GoalReinstatedEvent);
  }
}
