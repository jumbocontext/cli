import { BaseEvent } from "../../../domain/BaseEvent.js";
import { SearchDocument } from "./SearchDocument.js";
import { SearchDocumentChange } from "./SearchDocumentChange.js";
import { SearchDocumentSource } from "./SearchDocumentSource.js";

export interface ISearchDocumentProjector {
  readonly eventTypes: readonly string[];
  getSource(event: BaseEvent): SearchDocumentSource;
  project(
    event: BaseEvent,
    current: SearchDocument | null,
  ): SearchDocumentChange | null;
}
