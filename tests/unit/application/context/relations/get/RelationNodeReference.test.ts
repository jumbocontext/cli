import { describe, expect, it } from "@jest/globals";
import { RelationNodeReference } from "../../../../../../src/application/context/relations/get/RelationNodeReference.js";

describe("RelationNodeReference", () => {
  it("uses entity type plus entity ID as canonical node identity", () => {
    const reference: RelationNodeReference = { entityType: "goal", entityId: "shared" };
    expect(reference).toEqual({ entityType: "goal", entityId: "shared" });
  });
});
