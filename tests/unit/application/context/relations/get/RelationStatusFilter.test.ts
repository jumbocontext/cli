import { describe, expect, it } from "@jest/globals";
import { RelationStatusFilter } from "../../../../../../src/application/context/relations/get/RelationStatusFilter.js";

describe("RelationStatusFilter", () => {
  it("models individual projection states and the unfiltered mode", () => {
    const values: RelationStatusFilter[] = ["active", "deactivated", "removed", "all"];
    expect(values).toHaveLength(4);
  });
});
