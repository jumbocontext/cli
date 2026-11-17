import { BaseEvent } from "../../../../domain/BaseEvent.js";
import {
  InvariantAddedEvent,
  InvariantUpdatedEvent,
} from "../../../../domain/invariants/EventIndex.js";
import { InvariantEventType } from "../../../../domain/invariants/Constants.js";
import { ISearchDocumentProjector } from "../ISearchDocumentProjector.js";
import { SearchCategory } from "../SearchCategory.js";
import { SearchDocument } from "../SearchDocument.js";
import { SearchDocumentChange } from "../SearchDocumentChange.js";
import { SearchDocumentSource } from "../SearchDocumentSource.js";
import { SearchFacetValue } from "../SearchFacetValue.js";

export class InvariantSearchDocumentProjector implements ISearchDocumentProjector {
  readonly eventTypes = Object.values(InvariantEventType);

  getSource(event: BaseEvent): SearchDocumentSource {
    return { type: SearchCategory.INVARIANT, id: event.aggregateId };
  }

  project(
    event: BaseEvent,
    current: SearchDocument | null,
  ): SearchDocumentChange | null {
    if (event.type === InvariantEventType.REMOVED) {
      return { operation: "remove", source: this.getSource(event) };
    }

    if (event.type === InvariantEventType.ADDED) {
      return {
        operation: "upsert",
        document: this.fromAdded(event as InvariantAddedEvent),
      };
    }

    if (!current) return null;

    const payload = (event as InvariantUpdatedEvent).payload;
    const metadata = { ...current.metadata };
    if (payload.title !== undefined) metadata.title = payload.title;
    if (payload.description !== undefined)
      metadata.description = payload.description;
    if (payload.rationale !== undefined) metadata.rationale = payload.rationale;

    return {
      operation: "upsert",
      document: this.fromMetadata(event, current, metadata),
    };
  }

  private fromAdded(event: InvariantAddedEvent): SearchDocument {
    const payload = event.payload as InvariantAddedEvent["payload"] & {
      category?: string;
    };
    return this.fromMetadata(event, null, {
      title: payload.title ?? payload.category ?? event.aggregateId,
      invariantCategory: payload.category ?? null,
      description: payload.description,
      rationale: payload.rationale ?? null,
    });
  }

  private fromMetadata(
    event: BaseEvent,
    current: SearchDocument | null,
    metadata: Record<string, SearchFacetValue>,
  ): SearchDocument {
    const title = String(metadata.title ?? current?.title ?? event.aggregateId);
    const summary = this.optionalString(metadata.description);
    const content = [title, metadata.description, metadata.rationale]
      .filter((value) => value !== null && value !== undefined && value !== "")
      .join("\n");

    return {
      source: this.getSource(event),
      category: SearchCategory.INVARIANT,
      title,
      summary,
      content,
      facets: { category: metadata.invariantCategory ?? null },
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
