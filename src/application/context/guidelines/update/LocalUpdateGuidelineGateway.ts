import { IUpdateGuidelineGateway } from "./IUpdateGuidelineGateway.js";
import { UpdateGuidelineRequest } from "./UpdateGuidelineRequest.js";
import { UpdateGuidelineResponse } from "./UpdateGuidelineResponse.js";
import { IGuidelineUpdatedEventWriter } from "./IGuidelineUpdatedEventWriter.js";
import { IGuidelineUpdatedEventReader } from "./IGuidelineUpdatedEventReader.js";
import { IGuidelineUpdateReader } from "./IGuidelineUpdateReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Guideline } from "../../../../domain/guidelines/Guideline.js";
import {
  GuidelineErrorMessages,
  formatErrorMessage,
} from "../../../../domain/guidelines/Constants.js";

export class LocalUpdateGuidelineGateway implements IUpdateGuidelineGateway {
  constructor(
    private readonly eventWriter: IGuidelineUpdatedEventWriter,
    private readonly eventReader: IGuidelineUpdatedEventReader,
    private readonly guidelineReader: IGuidelineUpdateReader,
    private readonly eventBus: IEventBus,
  ) {}

  async updateGuideline(
    request: UpdateGuidelineRequest,
  ): Promise<UpdateGuidelineResponse> {
    // 1. Check if guideline exists
    const existingView = await this.guidelineReader.findById(request.id);
    if (!existingView) {
      throw new Error(
        formatErrorMessage(GuidelineErrorMessages.NOT_FOUND, {
          id: request.id,
        }),
      );
    }

    // 2. Load event history and rehydrate aggregate
    const history = await this.eventReader.readStream(request.id);
    const guideline = Guideline.rehydrate(request.id, history);

    // 3. Domain logic produces update event - only pass defined fields
    const changes: {
      category?: typeof request.category;
      title?: string;
      description?: string;
      rationale?: string;
      examples?: string[];
    } = {};

    if (request.category !== undefined) changes.category = request.category;
    if (request.title !== undefined) changes.title = request.title;
    if (request.description !== undefined)
      changes.description = request.description;
    if (request.rationale !== undefined) changes.rationale = request.rationale;
    if (request.examples !== undefined) changes.examples = request.examples;

    // 3.1 Domain logic produces update event
    const event = guideline.update(changes);

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    // 6. Fetch updated view for display
    const view = await this.guidelineReader.findById(request.id);

    // 7. Build list of updated fields
    const updatedFields: string[] = [];
    if (request.category !== undefined) updatedFields.push("category");
    if (request.title !== undefined) updatedFields.push("title");
    if (request.description !== undefined) updatedFields.push("description");
    if (request.rationale !== undefined) updatedFields.push("rationale");
    if (request.examples !== undefined) updatedFields.push("examples");

    return {
      guidelineId: request.id,
      updatedFields,
      ...(view
        ? { category: view.category, title: view.title, version: view.version }
        : {}),
    };
  }
}
