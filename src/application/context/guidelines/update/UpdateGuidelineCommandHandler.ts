/**
 * UpdateGuidelineCommandHandler
 *
 * Application layer handler for updating existing guidelines.
 * Orchestrates: load aggregate, rehydrate from history, apply update, persist event, publish to bus.
 */

import { UpdateGuidelineCommand } from "./UpdateGuidelineCommand.js";
import { IGuidelineUpdatedEventWriter } from "./IGuidelineUpdatedEventWriter.js";
import { IGuidelineUpdatedEventReader } from "./IGuidelineUpdatedEventReader.js";
import { IGuidelineUpdateReader } from "./IGuidelineUpdateReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Guideline } from "../../../../domain/guidelines/Guideline.js";
import {
  GuidelineErrorMessages,
  formatErrorMessage,
} from "../../../../domain/guidelines/Constants.js";

export class UpdateGuidelineCommandHandler {
  constructor(
    private readonly eventWriter: IGuidelineUpdatedEventWriter,
    private readonly eventReader: IGuidelineUpdatedEventReader,
    private readonly guidelineReader: IGuidelineUpdateReader,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    command: UpdateGuidelineCommand,
  ): Promise<{ guidelineId: string }> {
    // 1. Check if guideline exists
    const existingView = await this.guidelineReader.findById(command.id);
    if (!existingView) {
      throw new Error(
        formatErrorMessage(GuidelineErrorMessages.NOT_FOUND, {
          id: command.id,
        }),
      );
    }

    // 2. Load event history and rehydrate aggregate
    const history = await this.eventReader.readStream(command.id);
    const guideline = Guideline.rehydrate(command.id, history);

    // 3. Domain logic produces update event - only pass defined fields
    const changes: {
      category?: typeof command.category;
      title?: string;
      description?: string;
      rationale?: string;
      examples?: string[];
    } = {};

    if (command.category !== undefined) changes.category = command.category;
    if (command.title !== undefined) changes.title = command.title;
    if (command.description !== undefined)
      changes.description = command.description;
    if (command.rationale !== undefined) changes.rationale = command.rationale;
    if (command.examples !== undefined) changes.examples = command.examples;

    // 3.1 Domain logic produces update event
    const event = guideline.update(changes);

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { guidelineId: command.id };
  }
}
