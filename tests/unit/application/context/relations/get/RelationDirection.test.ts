import { describe, expect, it } from "@jest/globals";
import { RelationDirection } from "../../../../../../src/application/context/relations/get/RelationDirection.js";

describe("RelationDirection", () => {
  it("models the three directed graph read modes", () => {
    const values: RelationDirection[] = ["in", "out", "both"];
    expect(values).toEqual(["in", "out", "both"]);
  });
});
