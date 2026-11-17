/**
 * Port interface for projecting ValuePropositionUpdatedEvent events.
 * Infrastructure layer will implement this.
 */

import { ValuePropositionUpdatedEvent } from "../../../../domain/value-propositions/update/ValuePropositionUpdatedEvent.js";

export interface IValuePropositionUpdatedProjector {
  /**
   * Applies a ValuePropositionUpdatedEvent event to update the materialized view.
   */
  applyValuePropositionUpdated(
    event: ValuePropositionUpdatedEvent,
  ): Promise<void>;
}
