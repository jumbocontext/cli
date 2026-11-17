/**
 * Base interface that all domain events must extend.
 * Ensures every event has proper metadata for event sourcing.
 */

export type UUID = string;
export type ISO8601 = string;

export interface BaseEvent {
  readonly type: string; // e.g., "AccountOpened"
  readonly aggregateId: UUID; // stream id
  readonly version: number; // event version within the stream (optimistic concurrency)
  readonly timestamp: ISO8601;
  readonly loggedBy?: "human" | "machine";
  readonly payload?: unknown; // Event-specific data (overridden by concrete events)
}
