/**
 * DependencyAdded Event
 *
 * Emitted when a new dependency relationship is recorded.
 * This is the first event in the Dependency aggregate's lifecycle.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { DependencyEventType } from "../Constants.js";

export interface ExternalDependencyPayload {
  readonly name: string;
  readonly ecosystem: string;
  readonly packageName: string;
  readonly versionConstraint: string | null;
  readonly endpoint: string | null;
  readonly contract: string | null;
}

export interface LegacyComponentDependencyPayload {
  readonly consumerId: string;
  readonly providerId: string;
  readonly endpoint: string | null;
  readonly contract: string | null;
}

export type DependencyAddedEventPayload =
  ExternalDependencyPayload | LegacyComponentDependencyPayload;

export interface DependencyAddedEvent extends BaseEvent {
  readonly type: typeof DependencyEventType.ADDED;
  readonly payload: DependencyAddedEventPayload;
}
