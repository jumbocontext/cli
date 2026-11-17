import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ArchitectureDeprecatedEvent } from "../../../../domain/architecture/deprecate/ArchitectureDeprecatedEvent.js";
import { IArchitectureDeprecatedProjector } from "./IArchitectureDeprecatedProjector.js";

/**
 * Event handler for ArchitectureDeprecatedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when architecture is deprecated. Subscribes to ArchitectureDeprecatedEvent via event bus.
 */
export class ArchitectureDeprecatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IArchitectureDeprecatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const architectureDeprecatedEvent = event as ArchitectureDeprecatedEvent;
    await this.projector.applyArchitectureDeprecated(
      architectureDeprecatedEvent,
    );
  }
}
