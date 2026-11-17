import { BaseEvent } from "../../../../domain/BaseEvent.js";
import {
  DependencyAddedEvent,
  DependencyRemovedEvent,
  DependencyUpdatedEvent,
} from "../../../../domain/dependencies/EventIndex.js";
import {
  DependencyEventType,
  DependencyStatus,
} from "../../../../domain/dependencies/Constants.js";
import { ISearchDocumentProjector } from "../ISearchDocumentProjector.js";
import { SearchCategory } from "../SearchCategory.js";
import { SearchDocument } from "../SearchDocument.js";
import { SearchDocumentChange } from "../SearchDocumentChange.js";
import { SearchDocumentSource } from "../SearchDocumentSource.js";
import { SearchFacetValue } from "../SearchFacetValue.js";

export class DependencySearchDocumentProjector implements ISearchDocumentProjector {
  readonly eventTypes = Object.values(DependencyEventType);

  getSource(event: BaseEvent): SearchDocumentSource {
    return { type: SearchCategory.DEPENDENCY, id: event.aggregateId };
  }

  project(
    event: BaseEvent,
    current: SearchDocument | null,
  ): SearchDocumentChange | null {
    if (event.type === DependencyEventType.REMOVED) {
      const removedEvent = event as DependencyRemovedEvent;
      return { operation: "remove", source: this.getSource(removedEvent) };
    }

    if (event.type === DependencyEventType.ADDED) {
      return {
        operation: "upsert",
        document: this.fromAdded(event as DependencyAddedEvent),
      };
    }

    if (!current) return null;

    const payload = (event as DependencyUpdatedEvent).payload;
    const metadata = { ...current.metadata };
    if (payload.endpoint !== undefined) metadata.endpoint = payload.endpoint;
    if (payload.contract !== undefined) metadata.contract = payload.contract;
    if (payload.status !== undefined) metadata.status = payload.status;

    return {
      operation: "upsert",
      document: this.fromMetadata(event, current, metadata),
    };
  }

  private fromAdded(event: DependencyAddedEvent): SearchDocument {
    const metadata: Record<string, SearchFacetValue> =
      "name" in event.payload
        ? {
            name: event.payload.name,
            ecosystem: event.payload.ecosystem,
            packageName: event.payload.packageName,
            versionConstraint: event.payload.versionConstraint,
            endpoint: event.payload.endpoint,
            contract: event.payload.contract,
            status: DependencyStatus.ACTIVE,
          }
        : {
            name: `${event.payload.consumerId} -> ${event.payload.providerId}`,
            consumerId: event.payload.consumerId,
            providerId: event.payload.providerId,
            endpoint: event.payload.endpoint,
            contract: event.payload.contract,
            status: DependencyStatus.ACTIVE,
          };

    return this.fromMetadata(event, null, metadata);
  }

  private fromMetadata(
    event: BaseEvent,
    current: SearchDocument | null,
    metadata: Record<string, SearchFacetValue>,
  ): SearchDocument {
    const title = String(
      metadata.name ??
        metadata.packageName ??
        current?.title ??
        event.aggregateId,
    );
    const summary = this.firstString(
      metadata.contract,
      metadata.endpoint,
      metadata.packageName,
    );
    const content = [
      title,
      metadata.ecosystem,
      metadata.packageName,
      metadata.versionConstraint,
      metadata.consumerId,
      metadata.providerId,
      metadata.endpoint,
      metadata.contract,
      metadata.status,
    ]
      .filter((value) => value !== null && value !== undefined && value !== "")
      .join("\n");

    return {
      source: this.getSource(event),
      category: SearchCategory.DEPENDENCY,
      title,
      summary,
      content,
      facets: {
        ecosystem: metadata.ecosystem ?? null,
        status: metadata.status ?? null,
        packageName: metadata.packageName ?? null,
      },
      metadata,
      version: event.version,
      createdAt: current?.createdAt ?? event.timestamp,
      updatedAt: event.timestamp,
    };
  }

  private firstString(...values: readonly SearchFacetValue[]): string | null {
    const match = values.find(
      (value) => typeof value === "string" && value.length > 0,
    );
    return typeof match === "string" ? match : null;
  }
}
