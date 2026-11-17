/**
 * RemoveGuidelineCommandHandler
 *
 * Application layer handler for removing guidelines.
 * Loads aggregate, executes domain logic, persists event, and publishes to event bus.
 */

import { RemoveGuidelineCommand } from "./RemoveGuidelineCommand.js";
import { IGuidelineRemovedEventWriter } from "./IGuidelineRemovedEventWriter.js";
import { IGuidelineRemovedEventReader } from "./IGuidelineRemovedEventReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Guideline } from "../../../../domain/guidelines/Guideline.js";
import { GuidelineEvent } from "../../../../domain/guidelines/EventIndex.js";
import { ValidationRuleSet } from "../../../../domain/validation/ValidationRule.js";
import { GUIDELINE_ID_RULES } from "../../../../domain/guidelines/rules/GuidelineIdRules.js";
import {
  GuidelineErrorMessages,
  formatErrorMessage,
} from "../../../../domain/guidelines/Constants.js";

export class RemoveGuidelineCommandHandler {
  constructor(
    private readonly eventWriter: IGuidelineRemovedEventWriter,
    private readonly eventReader: IGuidelineRemovedEventReader,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    command: RemoveGuidelineCommand,
  ): Promise<{ guidelineId: string }> {
    // 1. Validate command
    ValidationRuleSet.ensure(command.guidelineId, GUIDELINE_ID_RULES);

    // 2. Load aggregate from event store (rehydrate)
    const history = await this.eventReader.readStream(command.guidelineId);
    if (history.length === 0) {
      throw new Error(
        formatErrorMessage(GuidelineErrorMessages.NOT_FOUND, {
          id: command.guidelineId,
        }),
      );
    }

    const guideline = Guideline.rehydrate(
      command.guidelineId,
      history as GuidelineEvent[],
    );

    // 3. Domain logic produces event
    const event = guideline.remove(command.reason);

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { guidelineId: command.guidelineId };
  }
}
