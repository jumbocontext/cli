import { Decision } from "../../../src/domain/decisions/Decision.js";
import { DecisionId } from "../../../src/domain/decisions/DecisionId.js";
import { DecisionErrorMessages, DecisionEventType, DecisionLimits, DecisionStatus } from "../../../src/domain/decisions/Constants.js";
import type { DecisionEvent } from "../../../src/domain/decisions/EventIndex.js";

function activeDecision() {
  const decision = Decision.create(DecisionId.fromLegacy("dec_123"));
  decision.add("Use REST API", "Need an API layer", "Standard approach", ["GraphQL"], "Easy to implement");
  return decision;
}

describe("Decision", () => {
  it("adds once and updates active decision properties", () => {
    const decision = activeDecision();
    expect(() => decision.add("Duplicate", "Already added")).toThrow();
    const event = decision.update("Use GraphQL", "New requirements", "Flexible", ["REST"], "More tooling");
    expect(event.type).toBe(DecisionEventType.UPDATED);
    expect(decision.snapshot).toMatchObject({ title: "Use GraphQL", context: "New requirements", rationale: "Flexible", alternatives: ["REST"], consequences: "More tooling", version: 2 });
  });

  it("reverses and preserves decision content", () => {
    const decision = activeDecision();
    const before = decision.snapshot;
    const event = decision.reverse("  Requirements changed  ");
    expect(event).toMatchObject({ type: DecisionEventType.REVERSED, aggregateId: before.id, version: 2, payload: { reason: "Requirements changed" } });
    expect(Number.isNaN(Date.parse(event.payload.reversedAt))).toBe(false);
    expect(decision.snapshot).toEqual({ ...before, status: DecisionStatus.REVERSED, reversalReason: event.payload.reason, reversedAt: event.payload.reversedAt, version: 2 });
    expect(() => decision.reverse("Again")).toThrow(DecisionErrorMessages.ALREADY_REVERSED);
    expect(() => decision.supersede("dec_other")).toThrow(DecisionErrorMessages.CANNOT_MODIFY_INACTIVE);
    expect(() => decision.update("Changed")).toThrow(DecisionErrorMessages.CANNOT_MODIFY_INACTIVE);
  });

  it("supersedes and preserves decision content", () => {
    const decision = activeDecision();
    const before = decision.snapshot;
    const event = decision.supersede("dec_other");
    expect(event).toMatchObject({ type: DecisionEventType.SUPERSEDED, aggregateId: before.id, version: 2, payload: { supersededBy: "dec_other" } });
    expect(decision.snapshot).toEqual({ ...before, status: DecisionStatus.SUPERSEDED, supersededBy: "dec_other", version: 2 });
    expect(() => decision.supersede("dec_another")).toThrow(DecisionErrorMessages.ALREADY_SUPERSEDED);
    expect(() => decision.reverse("Changed")).toThrow(DecisionErrorMessages.CANNOT_MODIFY_INACTIVE);
    expect(() => decision.update("Changed")).toThrow(DecisionErrorMessages.CANNOT_MODIFY_INACTIVE);
  });

  it.each(["", "   ", "x".repeat(DecisionLimits.REASON_MAX_LENGTH + 1)])("rejects invalid reversal reason %# without changing state", reason => {
    const decision = activeDecision();
    const before = decision.snapshot;
    expect(() => decision.reverse(reason)).toThrow();
    expect(decision.snapshot).toEqual(before);
  });

  it.each(["", "   "])("rejects invalid superseding ID %#", id => {
    const decision = activeDecision();
    const before = decision.snapshot;
    expect(() => decision.supersede(id)).toThrow(DecisionErrorMessages.SUPERSEDED_BY_REQUIRED);
    expect(decision.snapshot).toEqual(before);
  });

  it.each([DecisionStatus.REVERSED, DecisionStatus.SUPERSEDED])("restores %s and clears inactive metadata", status => {
    const decision = activeDecision();
    if (status === DecisionStatus.REVERSED) decision.reverse("Changed");
    else decision.supersede("dec_other");
    const event = decision.restore("  Still valid  ");
    expect(event).toMatchObject({ type: DecisionEventType.RESTORED, version: 3, payload: { reason: "Still valid" } });
    expect(Number.isNaN(Date.parse(event.payload.restoredAt))).toBe(false);
    expect(decision.snapshot).toMatchObject({ status: DecisionStatus.ACTIVE, reversalReason: null, reversedAt: null, supersededBy: null, version: 3 });
  });

  it("rejects restoring an active decision", () => {
    expect(() => activeDecision().restore("Already valid")).toThrow(DecisionErrorMessages.ALREADY_ACTIVE);
  });

  it.each(["", "   ", "x".repeat(DecisionLimits.REASON_MAX_LENGTH + 1)])("rejects invalid restoration reason %#", reason => {
    const decision = activeDecision();
    decision.reverse("Changed");
    const before = decision.snapshot;
    expect(() => decision.restore(reason)).toThrow();
    expect(decision.snapshot).toEqual(before);
  });

  it.each([DecisionStatus.ACTIVE, DecisionStatus.REVERSED, DecisionStatus.SUPERSEDED])("irreversibly removes a %s decision and rehydrates its history", status => {
    const decision = Decision.create(DecisionId.fromLegacy("dec_123"));
    const history: DecisionEvent[] = [decision.add("Use REST API", "Need an API layer", "Standard", ["GraphQL"], "Easy")];
    if (status === DecisionStatus.REVERSED) history.push(decision.reverse("Changed"));
    if (status === DecisionStatus.SUPERSEDED) history.push(decision.supersede("dec_other"));
    const before = decision.snapshot;
    const event = decision.remove();
    history.push(event);
    expect(event).toMatchObject({ type: DecisionEventType.REMOVED, aggregateId: before.id, version: before.version + 1, payload: { status: DecisionStatus.REMOVED } });
    expect(decision.snapshot).toEqual({ ...before, status: DecisionStatus.REMOVED, version: before.version + 1 });
    const rehydrated = Decision.rehydrate(before.id, history);
    expect(rehydrated.snapshot).toEqual(decision.snapshot);
    for (const removed of [decision, rehydrated]) {
      const snapshot = removed.snapshot;
      expect(() => removed.remove()).toThrow(DecisionErrorMessages.ALREADY_REMOVED);
      expect(() => removed.update("Changed")).toThrow(DecisionErrorMessages.CANNOT_MODIFY_REMOVED);
      expect(() => removed.reverse("Changed")).toThrow(DecisionErrorMessages.CANNOT_MODIFY_REMOVED);
      expect(() => removed.supersede("dec_other")).toThrow(DecisionErrorMessages.CANNOT_MODIFY_REMOVED);
      expect(() => removed.restore("Changed")).toThrow(DecisionErrorMessages.CANNOT_MODIFY_REMOVED);
      expect(removed.snapshot).toEqual(snapshot);
    }
  });
});
