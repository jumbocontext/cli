import { describe, expect, it } from "@jest/globals";
import { RelationTraversalQueryNormalizer } from "../../../../../../src/application/context/relations/traverse/RelationTraversalQueryNormalizer.js";

describe("RelationTraversalQueryNormalizer", () => {
  const normalizer = new RelationTraversalQueryNormalizer();

  it("applies traversal defaults and preserves every projection filter", () => {
    expect(
      normalizer.normalize({
        relationType: "requires",
        relatedEntityType: "component",
        strength: "weak",
      }),
    ).toEqual({
      depth: 1,
      direction: "both",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "weak",
      status: "active",
    });
  });

  it("supports a caller-specific default depth", () => {
    expect(normalizer.normalize({}, 5).depth).toBe(5);
  });

  it.each([0, 1.5, 6])("rejects invalid depth %s", (depth) => {
    expect(() => normalizer.normalize({ depth })).toThrow(
      "Depth must be an integer from 1 through 5",
    );
  });

  it("rejects invalid direction, status, entity type, and strength values", () => {
    expect(() =>
      normalizer.normalize({ direction: "sideways" as "both" }),
    ).toThrow("Direction must be one of");
    expect(() => normalizer.normalize({ status: "stale" as "active" })).toThrow(
      "Status must be one of",
    );
    expect(() =>
      normalizer.normalize({ relatedEntityType: "widget" as "goal" }),
    ).toThrow("Related entity type must be one of");
    expect(() =>
      normalizer.normalize({ strength: "critical" as "strong" }),
    ).toThrow("Strength must be one of");
  });
});
