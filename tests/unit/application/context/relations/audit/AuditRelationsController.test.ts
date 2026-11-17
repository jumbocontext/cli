import { describe, expect, it, jest } from "@jest/globals";
import { AuditRelationsController } from "../../../../../../src/application/context/relations/audit/AuditRelationsController.js";
import { IRelationNodeCatalog } from "../../../../../../src/application/context/relations/audit/IRelationNodeCatalog.js";
import { RelationAuditPolicy } from "../../../../../../src/application/context/relations/audit/RelationAuditPolicy.js";
import { IRelationViewReader } from "../../../../../../src/application/context/relations/get/IRelationViewReader.js";

describe("AuditRelationsController", () => {
  it("queries both read ports and requests all relation lifecycle states", async () => {
    const findNodes = jest.fn<IRelationNodeCatalog["findAll"]>().mockResolvedValue([]);
    const findRelations = jest.fn<IRelationViewReader["findAll"]>().mockResolvedValue([]);
    const controller = new AuditRelationsController(
      { findAll: findNodes },
      { findAll: findRelations, findEndpointTypes: jest.fn() },
      new RelationAuditPolicy(),
    );

    const result = await controller.handle({ checks: ["summary"] });

    expect(findNodes).toHaveBeenCalledTimes(1);
    expect(findRelations).toHaveBeenCalledWith({ status: "all" });
    expect(result.summary).toEqual({
      nodes: { count: 0, byEntityType: {} },
      relations: {
        count: 0,
        byRelationType: {},
        byStrength: {},
        byStatus: {},
      },
    });
  });
});
