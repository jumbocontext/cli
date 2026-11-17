import { RelationDiscoveryEventHandler } from "../../../../../../src/application/context/relations/discover/RelationDiscoveryEventHandler.js";
import { IRelationDiscoveryGoalRegistrar } from "../../../../../../src/application/context/relations/discover/IRelationDiscoveryGoalRegistrar.js";
import { EntityType } from "../../../../../../src/domain/relations/Constants.js";
import { jest } from "@jest/globals";

describe("RelationDiscoveryEventHandler", () => {
  let relationDiscoveryGoalRegistrar: jest.Mocked<IRelationDiscoveryGoalRegistrar>;
  let handler: RelationDiscoveryEventHandler;

  beforeEach(() => {
    relationDiscoveryGoalRegistrar = {
      execute: jest.fn().mockResolvedValue("goal_new_123"),
    };
    handler = new RelationDiscoveryEventHandler(relationDiscoveryGoalRegistrar);
  });

  it("delegates ComponentAddedEvent to relation discovery registrar", async () => {
    await handler.handle({
      type: "ComponentAddedEvent",
      aggregateId: "comp_1",
      version: 1,
      timestamp: "2026-04-16T00:00:00.000Z",
      payload: {},
    });

    expect(relationDiscoveryGoalRegistrar.execute).toHaveBeenCalledWith(
      EntityType.COMPONENT,
      "comp_1"
    );
  });

  it("delegates DecisionAddedEvent to relation discovery registrar", async () => {
    await handler.handle({
      type: "DecisionAddedEvent",
      aggregateId: "dec_1",
      version: 1,
      timestamp: "2026-04-16T00:00:00.000Z",
      payload: {},
    });

    expect(relationDiscoveryGoalRegistrar.execute).toHaveBeenCalledWith(
      EntityType.DECISION,
      "dec_1"
    );
  });

  it("delegates DependencyAddedEvent to relation discovery registrar", async () => {
    await handler.handle({
      type: "DependencyAddedEvent",
      aggregateId: "dep_1",
      version: 1,
      timestamp: "2026-04-16T00:00:00.000Z",
      payload: {},
    });

    expect(relationDiscoveryGoalRegistrar.execute).toHaveBeenCalledWith(
      EntityType.DEPENDENCY,
      "dep_1"
    );
  });

  it("delegates GuidelineAddedEvent to relation discovery registrar", async () => {
    await handler.handle({
      type: "GuidelineAddedEvent",
      aggregateId: "guide_1",
      version: 1,
      timestamp: "2026-04-16T00:00:00.000Z",
      payload: {},
    });

    expect(relationDiscoveryGoalRegistrar.execute).toHaveBeenCalledWith(
      EntityType.GUIDELINE,
      "guide_1"
    );
  });

  it("delegates InvariantAddedEvent to relation discovery registrar", async () => {
    await handler.handle({
      type: "InvariantAddedEvent",
      aggregateId: "inv_1",
      version: 1,
      timestamp: "2026-04-16T00:00:00.000Z",
      payload: {},
    });

    expect(relationDiscoveryGoalRegistrar.execute).toHaveBeenCalledWith(
      EntityType.INVARIANT,
      "inv_1"
    );
  });

  it("ignores unrecognized event types", async () => {
    await handler.handle({
      type: "SomeOtherEvent",
      aggregateId: "other_1",
      version: 1,
      timestamp: "2026-04-16T00:00:00.000Z",
      payload: {},
    });

    expect(relationDiscoveryGoalRegistrar.execute).not.toHaveBeenCalled();
  });
});
