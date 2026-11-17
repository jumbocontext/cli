import { IDefineArchitectureGateway } from "./IDefineArchitectureGateway.js";
import { DefineArchitectureRequest } from "./DefineArchitectureRequest.js";
import { DefineArchitectureResponse } from "./DefineArchitectureResponse.js";
import { IArchitectureDefinedEventWriter } from "./IArchitectureDefinedEventWriter.js";
import { IArchitectureDefineReader } from "./IArchitectureDefineReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Architecture } from "../../../../domain/architecture/Architecture.js";
import { ArchitectureErrorMessages } from "../../../../domain/architecture/Constants.js";
import { DataStore } from "../../../../domain/architecture/define/ArchitectureDefinedEvent.js";

export class LocalDefineArchitectureGateway implements IDefineArchitectureGateway {
  constructor(
    private readonly eventWriter: IArchitectureDefinedEventWriter,
    private readonly architectureReader: IArchitectureDefineReader,
    private readonly eventBus: IEventBus,
  ) {}

  async defineArchitecture(
    request: DefineArchitectureRequest,
  ): Promise<DefineArchitectureResponse> {
    // Check if architecture already exists (precondition)
    const existingArchitecture =
      await this.architectureReader.findById("architecture");
    if (existingArchitecture) {
      if (existingArchitecture.deprecated) {
        throw new Error(ArchitectureErrorMessages.DEPRECATED);
      }
      throw new Error(ArchitectureErrorMessages.ALREADY_DEFINED);
    }

    // 1. Create new aggregate
    const architectureId = "architecture"; // Single architecture per project
    const architecture = Architecture.create(architectureId);

    // 2. Parse data stores from string format
    const dataStores: DataStore[] | undefined = request.dataStores?.map(
      (ds) => {
        const [name, type, purpose] = ds.split(":");
        return { name, type, purpose };
      },
    );

    // 3. Domain logic produces event
    const event = architecture.define(
      request.description,
      request.organization,
      request.patterns,
      request.principles,
      dataStores,
      request.stack,
    );

    // 3. Persist event to file store
    await this.eventWriter.append(event);

    // 4. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { architectureId };
  }
}
