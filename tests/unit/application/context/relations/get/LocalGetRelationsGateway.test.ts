import { describe, expect, it, jest } from "@jest/globals";
import { LocalGetRelationsGateway } from "../../../../../../src/application/context/relations/get/LocalGetRelationsGateway.js";
import { IRelationViewReader } from "../../../../../../src/application/context/relations/get/IRelationViewReader.js";

describe("LocalGetRelationsGateway", () => {
  it("passes every read filter to the projection reader", async () => {
    const reader = {
      findAll: jest.fn<IRelationViewReader["findAll"]>().mockResolvedValue([]),
      findEndpointTypes: jest.fn<IRelationViewReader["findEndpointTypes"]>(),
    };
    const gateway = new LocalGetRelationsGateway(reader);

    await gateway.getRelations({
      entityType: "goal",
      entityId: "goal_123",
      direction: "out",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "strong",
      status: "all",
    });

    expect(reader.findAll).toHaveBeenCalledWith({
      entity: { entityType: "goal", entityId: "goal_123" },
      entityType: "goal",
      entityId: "goal_123",
      direction: "out",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "strong",
      status: "all",
    });
  });

  it("returns an empty result without changing the query", async () => {
    const reader = {
      findAll: jest.fn<IRelationViewReader["findAll"]>().mockResolvedValue([]),
      findEndpointTypes: jest.fn<IRelationViewReader["findEndpointTypes"]>(),
    };

    await expect(new LocalGetRelationsGateway(reader).getRelations({ status: "active" }))
      .resolves.toEqual({ relations: [] });
  });

  it("rejects invalid runtime filter values before reading", async () => {
    const reader = {
      findAll: jest.fn<IRelationViewReader["findAll"]>().mockResolvedValue([]),
      findEndpointTypes: jest.fn<IRelationViewReader["findEndpointTypes"]>(),
    };
    const gateway = new LocalGetRelationsGateway(reader);

    await expect(gateway.getRelations({
      status: "active",
      direction: "sideways" as "both",
    })).rejects.toThrow("Direction must be one of");
    expect(reader.findAll).not.toHaveBeenCalled();
  });
});
