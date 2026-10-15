import { BaseEvent } from "../../../../domain/BaseEvent.js";
import {
  DecisionAddedEvent,
  DecisionRestoredEvent,
  DecisionReversedEvent,
  DecisionSupersededEvent,
  DecisionUpdatedEvent,
} from "../../../../domain/decisions/EventIndex.js";
import { DecisionEventType, DecisionStatus } from "../../../../domain/decisions/Constants.js";
import { ISearchDocumentProjector } from "../ISearchDocumentProjector.js";
import { SearchCategory } from "../SearchCategory.js";
import { SearchDocument } from "../SearchDocument.js";
import { SearchDocumentChange } from "../SearchDocumentChange.js";
import { SearchDocumentSource } from "../SearchDocumentSource.js";
import { SearchFacetValue } from "../SearchFacetValue.js";

export class DecisionSearchDocumentProjector implements ISearchDocumentProjector {
  readonly eventTypes = Object.values(DecisionEventType);

  getSource(event: BaseEvent): SearchDocumentSource {
    return { type: SearchCategory.DECISION, id: event.aggregateId };
  }

  project(event: BaseEvent, current: SearchDocument | null): SearchDocumentChange | null {
    if (event.type === DecisionEventType.ADDED) {
      return { operation: "upsert", document: this.fromAdded(event as DecisionAddedEvent) };
    }

    if (event.type === DecisionEventType.REMOVED) {
      return { operation: "remove", source: this.getSource(event) };
    }

    if (!current) return null;

    const metadata = { ...current.metadata };

    if (event.type === DecisionEventType.UPDATED) {
      const payload = (event as DecisionUpdatedEvent).payload;
      if (payload.title !== undefined) metadata.title = payload.title;
      if (payload.context !== undefined) metadata.context = payload.context;
      if (payload.rationale !== undefined) metadata.rationale = payload.rationale;
      if (payload.alternatives !== undefined) metadata.alternatives = payload.alternatives;
      if (payload.consequences !== undefined) metadata.consequences = payload.consequences;
    }

    if (event.type === DecisionEventType.REVERSED) {
      metadata.status = DecisionStatus.REVERSED;
      metadata.reversalReason = (event as DecisionReversedEvent).payload.reason;
    }

    if (event.type === DecisionEventType.RESTORED) {
      metadata.status = DecisionStatus.ACTIVE;
      metadata.restorationReason = (event as DecisionRestoredEvent).payload.reason;
    }

    if (event.type === DecisionEventType.SUPERSEDED) {
      metadata.status = DecisionStatus.SUPERSEDED;
      metadata.supersededBy = (event as DecisionSupersededEvent).payload.supersededBy;
    }

    return { operation: "upsert", document: this.fromMetadata(event, current, metadata) };
  }

  private fromAdded(event: DecisionAddedEvent): SearchDocument {
    return this.fromMetadata(event, null, {
      title: event.payload.title,
      context: event.payload.context,
      rationale: event.payload.rationale,
      alternatives: event.payload.alternatives,
      consequences: event.payload.consequences,
      status: DecisionStatus.ACTIVE,
      supersededBy: null,
      reversalReason: null,
    });
  }

  private fromMetadata(
    event: BaseEvent,
    current: SearchDocument | null,
    metadata: Record<string, SearchFacetValue>
  ): SearchDocument {
    const title = String(metadata.title ?? current?.title ?? event.aggregateId);
    const summary = this.optionalString(metadata.context);
    const content = [
      title,
      metadata.context,
      metadata.rationale,
      ...(Array.isArray(metadata.alternatives) ? metadata.alternatives : []),
      metadata.consequences,
      metadata.status,
      metadata.reversalReason,
      metadata.restorationReason,
      metadata.supersededBy,
    ]
      .filter((value) => value !== null && value !== undefined && value !== "")
      .join("\n");

    return {
      source: this.getSource(event),
      category: SearchCategory.DECISION,
      title,
      summary,
      content,
      facets: {
        status: metadata.status ?? null,
        supersededBy: metadata.supersededBy ?? null,
      },
      metadata,
      version: event.version,
      createdAt: current?.createdAt ?? event.timestamp,
      updatedAt: event.timestamp,
    };
  }

  private optionalString(value: SearchFacetValue): string | null {
    return typeof value === "string" && value.length > 0 ? value : null;
  }
}
