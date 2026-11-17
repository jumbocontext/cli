import { describe, expect, it } from "@jest/globals";
import { RelationListFilter } from "../../../../../../src/application/context/relations/get/RelationListFilter.js";

describe("RelationListFilter", () => {
  it("combines the complete typed relation read filter contract", () => {
    const filter: RelationListFilter = {
      entity: { entityType: "goal", entityId: "goal_1" },
      entityType: "goal",
      entityId: "goal_1",
      direction: "out",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "strong",
      status: "active",
    };

    expect(filter).toEqual(expect.objectContaining({ direction: "out", status: "active" }));
  });
});
