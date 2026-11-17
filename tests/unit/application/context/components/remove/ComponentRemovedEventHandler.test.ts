import { ComponentRemovedEventHandler } from "../../../../../../src/application/context/components/remove/ComponentRemovedEventHandler.js";
import { IComponentRemovedProjector } from "../../../../../../src/application/context/components/remove/IComponentRemovedProjector.js";
import { ComponentRemovedEvent } from "../../../../../../src/domain/components/remove/ComponentRemovedEvent.js";
import { RelationPruningCascade } from "../../../../../../src/application/context/relations/prune/RelationPruningCascade.js";
import { jest } from "@jest/globals";

describe("ComponentRemovedEventHandler", () => {
  let projector: jest.Mocked<IComponentRemovedProjector>;
  let relationPruningCascade: jest.Mocked<RelationPruningCascade>;
  let handler: ComponentRemovedEventHandler;

  beforeEach(() => {
    projector = {
      applyComponentRemoved: jest.fn().mockResolvedValue(undefined),
    };
    relationPruningCascade = {
      execute: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<RelationPruningCascade>;
    handler = new ComponentRemovedEventHandler(projector, relationPruningCascade);
  });

  it("projects removal and cascades relation pruning", async () => {
    const event: ComponentRemovedEvent = {
      type: "ComponentRemovedEvent",
      aggregateId: "comp_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: {
        status: "removed",
      },
    };

    await handler.handle(event);

    expect(projector.applyComponentRemoved).toHaveBeenCalledWith(event);
    expect(relationPruningCascade.execute).toHaveBeenCalledWith(
      "component",
      "comp_123",
      "Automatically pruned because component comp_123 was removed"
    );
  });
});
