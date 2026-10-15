import { jest } from "@jest/globals";
import { DecisionRemovedEventHandler } from "../../../../../src/application/context/decisions/remove/DecisionRemovedEventHandler.js";
import type { IDecisionRemovedProjector } from "../../../../../src/application/context/decisions/remove/IDecisionRemovedProjector.js";
import type { RelationPruningCascade } from "../../../../../src/application/context/relations/prune/RelationPruningCascade.js";
import { Decision } from "../../../../../src/domain/decisions/Decision.js";
import { EntityType } from "../../../../../src/domain/relations/Constants.js";

describe("DecisionRemovedEventHandler", () => {
  function setup() {
    const decision = Decision.create();
    decision.add("Use SQLite", "Need local storage");
    const event = decision.remove();
    const projector = { applyDecisionRemoved: jest.fn<IDecisionRemovedProjector["applyDecisionRemoved"]>().mockResolvedValue(undefined) };
    const cascade = { execute: jest.fn<RelationPruningCascade["execute"]>().mockResolvedValue(0) };
    return { event, projector, cascade, handler: new DecisionRemovedEventHandler(projector, cascade) };
  }

  it("projects before pruning relations for the typed decision endpoint", async () => {
    const { event, projector, cascade, handler } = setup();
    const order: string[] = [];
    projector.applyDecisionRemoved.mockImplementation(async () => { order.push("project"); });
    cascade.execute.mockImplementation(async () => { order.push("prune"); return 2; });
    await handler.handle(event);
    expect(projector.applyDecisionRemoved).toHaveBeenCalledWith(event);
    expect(cascade.execute).toHaveBeenCalledWith(EntityType.DECISION, event.aggregateId, expect.any(String));
    expect(order).toEqual(["project", "prune"]);
  });

  it("propagates projection failure without pruning", async () => {
    const { event, projector, cascade, handler } = setup();
    const failure = new Error("Projection unavailable");
    projector.applyDecisionRemoved.mockRejectedValue(failure);
    await expect(handler.handle(event)).rejects.toBe(failure);
    expect(cascade.execute).not.toHaveBeenCalled();
  });

  it("propagates cascade failure", async () => {
    const { event, cascade, handler } = setup();
    const failure = new Error("Pruning unavailable");
    cascade.execute.mockRejectedValue(failure);
    await expect(handler.handle(event)).rejects.toBe(failure);
  });
});
