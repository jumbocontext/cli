import { describe, expect, it, jest } from "@jest/globals";
import { IRelationViewReader } from "../../../../../../src/application/context/relations/get/IRelationViewReader.js";
import { RelationNodeReferenceResolver } from "../../../../../../src/application/context/relations/traverse/RelationNodeReferenceResolver.js";

function readerWithTypes(
  types: Awaited<ReturnType<IRelationViewReader["findEndpointTypes"]>>,
): IRelationViewReader {
  return {
    findAll: jest.fn<IRelationViewReader["findAll"]>().mockResolvedValue([]),
    findEndpointTypes: jest
      .fn<IRelationViewReader["findEndpointTypes"]>()
      .mockResolvedValue(types),
  };
}

describe("RelationNodeReferenceResolver", () => {
  it("returns and trims an explicitly typed reference without projection inference", async () => {
    const reader = readerWithTypes([]);

    await expect(
      new RelationNodeReferenceResolver(reader).resolve(" goal_1 ", "goal"),
    ).resolves.toEqual({ entityType: "goal", entityId: "goal_1" });
    expect(reader.findEndpointTypes).not.toHaveBeenCalled();
  });

  it("infers the single projection endpoint type for ID-only input", async () => {
    await expect(
      new RelationNodeReferenceResolver(readerWithTypes(["component"])).resolve(
        "shared",
      ),
    ).resolves.toEqual({ entityType: "component", entityId: "shared" });
  });

  it("reports sorted ambiguity using the endpoint-specific option", async () => {
    await expect(
      new RelationNodeReferenceResolver(
        readerWithTypes(["goal", "decision"]),
      ).resolve("shared", undefined, "--from-type", "From entity"),
    ).rejects.toThrow("decision, goal. Specify --from-type explicitly");
  });

  it("rejects missing IDs, unknown inference, and invalid explicit types", async () => {
    const resolver = new RelationNodeReferenceResolver(readerWithTypes([]));

    await expect(resolver.resolve(" ")).rejects.toThrow(
      "Entity ID must be provided",
    );
    await expect(
      resolver.resolve("unknown", undefined, "--to-type"),
    ).rejects.toThrow("Specify --to-type explicitly");
    await expect(resolver.resolve("known", "widget" as "goal")).rejects.toThrow(
      "Entity type must be one of",
    );
  });
});
