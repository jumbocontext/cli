export * from "./define/ArchitectureDefinedEvent.js";
export * from "./update/ArchitectureUpdatedEvent.js";
export * from "./deprecate/ArchitectureDeprecatedEvent.js";

import { ArchitectureDefinedEvent } from "./define/ArchitectureDefinedEvent.js";
import { ArchitectureUpdatedEvent } from "./update/ArchitectureUpdatedEvent.js";
import { ArchitectureDeprecatedEvent } from "./deprecate/ArchitectureDeprecatedEvent.js";

// Re-export types for backward compatibility
export type { DataStore } from "./define/ArchitectureDefinedEvent.js";

// Union type of all architecture events
export type ArchitectureEvent =
  | ArchitectureDefinedEvent
  | ArchitectureUpdatedEvent
  | ArchitectureDeprecatedEvent;
