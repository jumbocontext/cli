/**
 * AddGuidelineCommandHandler
 *
 * Application layer handler for adding new guidelines.
 * Orchestrates the flow: create aggregate, apply business logic, persist event, publish to bus.
 */

import { AddGuidelineCommand } from "./AddGuidelineCommand.js";
import { IGuidelineAddedEventWriter } from "./IGuidelineAddedEventWriter.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Guideline } from "../../../../domain/guidelines/Guideline.js";

export class AddGuidelineCommandHandler {
  constructor(
    private readonly eventWriter: IGuidelineAddedEventWriter,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    command: AddGuidelineCommand,
  ): Promise<{ guidelineId: string }> {
    // 1. Create new aggregate
    const guideline = Guideline.create();
    const guidelineId = guideline.snapshot.id;

    // 2. Domain logic produces event
    const event = guideline.add(
      command.category,
      command.title,
      command.description,
      command.rationale,
      command.examples,
    );

    // 3. Persist event to file store
    await this.eventWriter.append(event);

    // 4. Publish event to bus
    await this.eventBus.publish(event);

    return { guidelineId };
  }
}
