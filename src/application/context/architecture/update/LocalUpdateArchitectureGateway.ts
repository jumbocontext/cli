import { IUpdateArchitectureGateway } from "./IUpdateArchitectureGateway.js";
import { UpdateArchitectureRequest } from "./UpdateArchitectureRequest.js";
import { UpdateArchitectureResponse } from "./UpdateArchitectureResponse.js";
import { IArchitectureUpdatedEventWriter } from "./IArchitectureUpdatedEventWriter.js";
import { IArchitectureUpdatedEventReader } from "./IArchitectureUpdatedEventReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Architecture } from "../../../../domain/architecture/Architecture.js";
import { ArchitectureErrorMessages } from "../../../../domain/architecture/Constants.js";
import { DataStore } from "../../../../domain/architecture/define/ArchitectureDefinedEvent.js";

export class LocalUpdateArchitectureGateway implements IUpdateArchitectureGateway {
  constructor(
    private readonly eventWriter: IArchitectureUpdatedEventWriter,
    private readonly eventReader: IArchitectureUpdatedEventReader,
    private readonly eventBus: IEventBus,
  ) {}

  async updateArchitecture(
    request: UpdateArchitectureRequest,
  ): Promise<UpdateArchitectureResponse> {
    const architectureId = "architecture"; // Single architecture per project

    // 1. Load aggregate from event store
    const history = await this.eventReader.readStream(architectureId);
    if (history.length === 0) {
      throw new Error(ArchitectureErrorMessages.NOT_DEFINED);
    }

    // 2. Rehydrate aggregate
    const architecture = Architecture.rehydrate(architectureId, history);

    // 3. Parse data stores from string format
    let dataStores: DataStore[] | undefined;
    if (request.dataStores) {
      dataStores = request.dataStores.map((ds) => {
        const [name, type, purpose] = ds.split(":");
        return { name, type, purpose };
      });
    }

    // 4. Domain logic produces event
    const event = architecture.update({
      description: request.description,
      organization: request.organization,
      patterns: request.patterns,
      principles: request.principles,
      dataStores,
      stack: request.stack,
    });

    // 5. Persist event to file store
    await this.eventWriter.append(event);

    // 6. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { architectureId };
  }
}
