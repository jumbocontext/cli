import { BaseEvent } from "../../../../domain/BaseEvent.js";
import {
  ComponentAddedEvent,
  ComponentDeprecatedEvent,
  ComponentRemovedEvent,
  ComponentRenamedEvent,
  ComponentUndeprecatedEvent,
  ComponentUpdatedEvent,
} from "../../../../domain/components/EventIndex.js";
import {
  ComponentEventType,
  ComponentStatus,
} from "../../../../domain/components/Constants.js";
import { ISearchDocumentProjector } from "../ISearchDocumentProjector.js";
import { SearchCategory } from "../SearchCategory.js";
import { SearchDocument } from "../SearchDocument.js";
import { SearchDocumentChange } from "../SearchDocumentChange.js";
import { SearchDocumentSource } from "../SearchDocumentSource.js";
import { SearchFacetValue } from "../SearchFacetValue.js";

export class ComponentSearchDocumentProjector implements ISearchDocumentProjector {
  readonly eventTypes = Object.values(ComponentEventType);

  getSource(event: BaseEvent): SearchDocumentSource {
    return { type: SearchCategory.COMPONENT, id: event.aggregateId };
  }

  project(
    event: BaseEvent,
    current: SearchDocument | null,
  ): SearchDocumentChange | null {
    if (event.type === ComponentEventType.REMOVED) {
      return { operation: "remove", source: this.getSource(event) };
    }

    if (event.type === ComponentEventType.ADDED) {
      return {
        operation: "upsert",
        document: this.fromAdded(event as ComponentAddedEvent),
      };
    }

    if (!current) return null;

    const metadata = { ...current.metadata };

    if (event.type === ComponentEventType.UPDATED) {
      const payload = (event as ComponentUpdatedEvent).payload;
      if (payload.description !== undefined)
        metadata.description = payload.description;
      if (payload.responsibility !== undefined)
        metadata.responsibility = payload.responsibility;
      if (payload.path !== undefined) metadata.path = payload.path;
      if (payload.type !== undefined) metadata.type = payload.type;
    }

    if (event.type === ComponentEventType.RENAMED) {
      metadata.name = (event as ComponentRenamedEvent).payload.name;
    }

    if (event.type === ComponentEventType.DEPRECATED) {
      const payload = (event as ComponentDeprecatedEvent).payload;
      metadata.status = payload.status;
      metadata.deprecationReason = payload.reason;
    }

    if (event.type === ComponentEventType.UNDEPRECATED) {
      metadata.status = ComponentStatus.ACTIVE;
      metadata.deprecationReason = null;
      metadata.undeprecationReason = (
        event as ComponentUndeprecatedEvent
      ).payload.reason;
    }

    return {
      operation: "upsert",
      document: this.fromMetadata(event, current, metadata),
    };
  }

  private fromAdded(event: ComponentAddedEvent): SearchDocument {
    const metadata: Record<string, SearchFacetValue> = {
      name: event.payload.name,
      type: event.payload.type,
      description: event.payload.description,
      responsibility: event.payload.responsibility,
      path: event.payload.path,
      status: event.payload.status,
      deprecationReason: null,
    };

    return this.fromMetadata(event, null, metadata);
  }

  private fromMetadata(
    event: BaseEvent,
    current: SearchDocument | null,
    metadata: Record<string, SearchFacetValue>,
  ): SearchDocument {
    const title = String(metadata.name ?? current?.title ?? event.aggregateId);
    const summary = this.optionalString(metadata.description);
    const content = [
      title,
      metadata.type,
      metadata.description,
      metadata.responsibility,
      metadata.path,
      metadata.status,
      metadata.deprecationReason,
    ]
      .filter((value) => value !== null && value !== undefined && value !== "")
      .join("\n");

    return {
      source: this.getSource(event),
      category: SearchCategory.COMPONENT,
      title,
      summary,
      content,
      facets: {
        type: metadata.type ?? null,
        status: metadata.status ?? null,
        path: metadata.path ?? null,
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
