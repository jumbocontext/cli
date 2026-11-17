import { BaseEvent } from "../../../../domain/BaseEvent.js";
import {
  GuidelineAddedEvent,
  GuidelineUpdatedEvent,
} from "../../../../domain/guidelines/EventIndex.js";
import { GuidelineEventType } from "../../../../domain/guidelines/Constants.js";
import { ISearchDocumentProjector } from "../ISearchDocumentProjector.js";
import { SearchCategory } from "../SearchCategory.js";
import { SearchDocument } from "../SearchDocument.js";
import { SearchDocumentChange } from "../SearchDocumentChange.js";
import { SearchDocumentSource } from "../SearchDocumentSource.js";
import { SearchFacetValue } from "../SearchFacetValue.js";

export class GuidelineSearchDocumentProjector implements ISearchDocumentProjector {
  readonly eventTypes = Object.values(GuidelineEventType);

  getSource(event: BaseEvent): SearchDocumentSource {
    return { type: SearchCategory.GUIDELINE, id: event.aggregateId };
  }

  project(
    event: BaseEvent,
    current: SearchDocument | null,
  ): SearchDocumentChange | null {
    if (event.type === GuidelineEventType.REMOVED) {
      return { operation: "remove", source: this.getSource(event) };
    }

    if (event.type === GuidelineEventType.ADDED) {
      return {
        operation: "upsert",
        document: this.fromAdded(event as GuidelineAddedEvent),
      };
    }

    if (!current) return null;

    const payload = (event as GuidelineUpdatedEvent).payload;
    const metadata = { ...current.metadata };
    if (payload.category !== undefined)
      metadata.guidelineCategory = payload.category;
    if (payload.title !== undefined) metadata.title = payload.title;
    if (payload.description !== undefined)
      metadata.description = payload.description;
    if (payload.rationale !== undefined) metadata.rationale = payload.rationale;
    if (payload.examples !== undefined) metadata.examples = payload.examples;

    return {
      operation: "upsert",
      document: this.fromMetadata(event, current, metadata),
    };
  }

  private fromAdded(event: GuidelineAddedEvent): SearchDocument {
    return this.fromMetadata(event, null, {
      guidelineCategory: event.payload.category,
      title: event.payload.title,
      description: event.payload.description,
      rationale: event.payload.rationale,
      examples: event.payload.examples,
    });
  }

  private fromMetadata(
    event: BaseEvent,
    current: SearchDocument | null,
    metadata: Record<string, SearchFacetValue>,
  ): SearchDocument {
    const title = String(metadata.title ?? current?.title ?? event.aggregateId);
    const summary = this.optionalString(metadata.description);
    const content = [
      title,
      metadata.guidelineCategory,
      metadata.description,
      metadata.rationale,
      ...(Array.isArray(metadata.examples) ? metadata.examples : []),
    ]
      .filter((value) => value !== null && value !== undefined && value !== "")
      .join("\n");

    return {
      source: this.getSource(event),
      category: SearchCategory.GUIDELINE,
      title,
      summary,
      content,
      facets: { category: metadata.guidelineCategory ?? null },
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
