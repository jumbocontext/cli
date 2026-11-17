import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ActivityMirrorAssembler } from "../../../../../../src/application/context/sessions/start/ActivityMirrorAssembler.js";
import { IEventStore } from "../../../../../../src/application/persistence/IEventStore.js";
import { BaseEvent } from "../../../../../../src/domain/BaseEvent.js";

describe("ActivityMirrorAssembler", () => {
  let eventStore: jest.Mocked<IEventStore>;
  let assembler: ActivityMirrorAssembler;

  beforeEach(() => {
    eventStore = {
      getAllEvents: jest.fn().mockResolvedValue([]),
      append: jest.fn(),
      readStream: jest.fn(),
    } as jest.Mocked<IEventStore>;
    assembler = new ActivityMirrorAssembler(eventStore);
  });

  function event(type: string, timestamp: string): BaseEvent {
    return {
      type,
      aggregateId: `agg-${Math.random().toString(36).slice(2, 8)}`,
      version: 1,
      timestamp,
    };
  }

  it("should return null when no session start events exist", async () => {
    eventStore.getAllEvents.mockResolvedValue([
      event("ComponentAddedEvent", "2025-01-01T10:00:00Z"),
    ]);

    const result = await assembler.assemble();

    expect(result).toBeNull();
  });

  it("should return null when no proactive actions exist in lookback window", async () => {
    eventStore.getAllEvents.mockResolvedValue([
      event("SessionStartedEvent", "2025-01-01T10:00:00Z"),
      event("SessionEndedEvent", "2025-01-01T11:00:00Z"),
    ]);

    const result = await assembler.assemble();

    expect(result).toBeNull();
  });

  it("should count entity registrations (components, invariants, guidelines)", async () => {
    eventStore.getAllEvents.mockResolvedValue([
      event("SessionStartedEvent", "2025-01-01T10:00:00Z"),
      event("ComponentAddedEvent", "2025-01-01T10:01:00Z"),
      event("InvariantAddedEvent", "2025-01-01T10:02:00Z"),
      event("GuidelineAddedEvent", "2025-01-01T10:03:00Z"),
      event("ComponentAddedEvent", "2025-01-01T10:04:00Z"),
    ]);

    const result = await assembler.assemble();

    expect(result).not.toBeNull();
    expect(result!.entitiesRegistered).toBe(4);
  });

  it("should count decisions separately from entities", async () => {
    eventStore.getAllEvents.mockResolvedValue([
      event("SessionStartedEvent", "2025-01-01T10:00:00Z"),
      event("DecisionAddedEvent", "2025-01-01T10:01:00Z"),
      event("DecisionAddedEvent", "2025-01-01T10:02:00Z"),
      event("ComponentAddedEvent", "2025-01-01T10:03:00Z"),
    ]);

    const result = await assembler.assemble();

    expect(result!.decisionsRecorded).toBe(2);
    expect(result!.entitiesRegistered).toBe(1);
  });

  it("should count relation and goal additions", async () => {
    eventStore.getAllEvents.mockResolvedValue([
      event("SessionStartedEvent", "2025-01-01T10:00:00Z"),
      event("RelationAddedEvent", "2025-01-01T10:01:00Z"),
      event("RelationAddedEvent", "2025-01-01T10:02:00Z"),
      event("RelationAddedEvent", "2025-01-01T10:03:00Z"),
      event("GoalAddedEvent", "2025-01-01T10:04:00Z"),
    ]);

    const result = await assembler.assemble();

    expect(result!.relationsAdded).toBe(3);
    expect(result!.goalsAdded).toBe(1);
  });

  it("should only count events from the last 3 sessions", async () => {
    eventStore.getAllEvents.mockResolvedValue([
      // Session 1 - outside lookback
      event("SessionStartedEvent", "2025-01-01T10:00:00Z"),
      event("ComponentAddedEvent", "2025-01-01T10:01:00Z"),
      // Session 2
      event("SessionStartedEvent", "2025-01-02T10:00:00Z"),
      event("ComponentAddedEvent", "2025-01-02T10:01:00Z"),
      // Session 3
      event("SessionStartedEvent", "2025-01-03T10:00:00Z"),
      event("DecisionAddedEvent", "2025-01-03T10:01:00Z"),
      // Session 4
      event("SessionStartedEvent", "2025-01-04T10:00:00Z"),
      event("GoalAddedEvent", "2025-01-04T10:01:00Z"),
    ]);

    const result = await assembler.assemble();

    // Last 3 sessions: 2, 3, 4. Session 1 component excluded.
    expect(result!.sessionCount).toBe(3);
    expect(result!.entitiesRegistered).toBe(1); // only session 2 component
    expect(result!.decisionsRecorded).toBe(1);
    expect(result!.goalsAdded).toBe(1);
  });

  it("should use fewer sessions when less than 3 exist", async () => {
    eventStore.getAllEvents.mockResolvedValue([
      event("SessionStartedEvent", "2025-01-01T10:00:00Z"),
      event("ComponentAddedEvent", "2025-01-01T10:01:00Z"),
    ]);

    const result = await assembler.assemble();

    expect(result!.sessionCount).toBe(1);
    expect(result!.entitiesRegistered).toBe(1);
  });

  it("should ignore non-proactive event types", async () => {
    eventStore.getAllEvents.mockResolvedValue([
      event("SessionStartedEvent", "2025-01-01T10:00:00Z"),
      event("ComponentUpdatedEvent", "2025-01-01T10:01:00Z"),
      event("DecisionReversedEvent", "2025-01-01T10:02:00Z"),
      event("GoalStartedEvent", "2025-01-01T10:03:00Z"),
      event("SessionEndedEvent", "2025-01-01T11:00:00Z"),
      event("ComponentAddedEvent", "2025-01-01T10:04:00Z"),
    ]);

    const result = await assembler.assemble();

    expect(result!.entitiesRegistered).toBe(1);
    expect(result!.decisionsRecorded).toBe(0);
    expect(result!.relationsAdded).toBe(0);
    expect(result!.goalsAdded).toBe(0);
  });

  it("should exclude events before the lookback cutoff", async () => {
    eventStore.getAllEvents.mockResolvedValue([
      event("ComponentAddedEvent", "2024-12-01T10:00:00Z"), // before any session
      event("SessionStartedEvent", "2025-01-01T10:00:00Z"),
      event("DecisionAddedEvent", "2025-01-01T10:01:00Z"),
    ]);

    const result = await assembler.assemble();

    // Only the decision after session start should count
    expect(result!.entitiesRegistered).toBe(0);
    expect(result!.decisionsRecorded).toBe(1);
  });
});
