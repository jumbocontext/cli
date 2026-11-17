import { ArchitectureDeprecatedEvent } from "../../../../domain/architecture/deprecate/ArchitectureDeprecatedEvent.js";

/**
 * Port interface for projecting ArchitectureDeprecatedEvent to the read model.
 * Used by ArchitectureDeprecatedEventHandler to update the projection store.
 */
export interface IArchitectureDeprecatedProjector {
  applyArchitectureDeprecated(
    event: ArchitectureDeprecatedEvent,
  ): Promise<void>;
}
