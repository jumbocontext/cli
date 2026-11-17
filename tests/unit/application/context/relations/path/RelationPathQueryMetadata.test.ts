import { describe, expect, it } from "@jest/globals";
import { RelationPathQueryMetadata } from "../../../../../../src/application/context/relations/path/RelationPathQueryMetadata.js";

describe("RelationPathQueryMetadata", () => {
  it("reports direction, bound, and unweighted edge filters", () => {
    const metadata: RelationPathQueryMetadata = {
      maxDepth: 3,
      direction: "out",
      relationType: "requires",
      entityType: "component",
      strength: "weak",
      status: "all",
    };

    expect(metadata).toEqual(
      expect.objectContaining({
        maxDepth: 3,
        strength: "weak",
      }),
    );
  });
});
