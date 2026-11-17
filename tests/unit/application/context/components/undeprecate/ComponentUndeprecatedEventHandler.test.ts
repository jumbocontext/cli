import { ComponentUndeprecatedEventHandler } from "../../../../../../src/application/context/components/undeprecate/ComponentUndeprecatedEventHandler.js";
import { IComponentUndeprecatedProjector } from "../../../../../../src/application/context/components/undeprecate/IComponentUndeprecatedProjector.js";
import { ComponentUndeprecatedEvent } from "../../../../../../src/domain/components/undeprecate/ComponentUndeprecatedEvent.js";
import { ComponentEventType } from "../../../../../../src/domain/components/Constants.js";
import { RelationReactivationCascade } from "../../../../../../src/application/context/relations/reactivate/RelationReactivationCascade.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("ComponentUndeprecatedEventHandler", () => {
  let projector: jest.Mocked<IComponentUndeprecatedProjector>;
  let relationReactivationCascade: jest.Mocked<RelationReactivationCascade>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: ComponentUndeprecatedEventHandler;

  beforeEach(() => {
    projector = {
      applyComponentUndeprecated: jest.fn().mockResolvedValue(undefined),
    };
    relationReactivationCascade = {
      execute: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<RelationReactivationCascade>;
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new ComponentUndeprecatedEventHandler(projector, relationReactivationCascade, relationMaintenanceGoalRegistrar);
  });

  it("projects undeprecation and cascades relation reactivation", async () => {
    const event: ComponentUndeprecatedEvent = {
      type: ComponentEventType.UNDEPRECATED,
      aggregateId: "comp_123",
      version: 3,
      timestamp: "2026-03-02T00:00:00.000Z",
      payload: {
        reason: "Component still needed",
        undeprecatedAt: "2026-03-02T00:00:00.000Z",
      },
    };

    await handler.handle(event);

    expect(projector.applyComponentUndeprecated).toHaveBeenCalledWith(event);
    expect(relationReactivationCascade.execute).toHaveBeenCalledWith(
      "component",
      "comp_123",
      "Automatically reactivated because component comp_123 was undeprecated: Component still needed"
    );
    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "component",
      "comp_123",
      "component was undeprecated: Component still needed"
    );
  });
});
