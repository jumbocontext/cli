import { describe, expect, it } from "@jest/globals";
import { RelationPathResult } from "../../../../../../../src/application/context/relations/path/RelationPathResult.js";
import { RelationPathOutputBuilder } from "../../../../../../../src/presentation/cli/commands/relations/path/RelationPathOutputBuilder.js";

const result: RelationPathResult = {
  found: true,
  from: { entityType: "goal", entityId: "goal_1" },
  to: { entityType: "decision", entityId: "decision_1" },
  hopCount: 2,
  nodes: [
    { entityType: "goal", entityId: "goal_1" },
    { entityType: "component", entityId: "component_1" },
    { entityType: "decision", entityId: "decision_1" },
  ],
  edges: [
    {
      relationId: "rel_1",
      fromEntityType: "goal",
      fromEntityId: "goal_1",
      toEntityType: "component",
      toEntityId: "component_1",
      relationType: "requires",
      strength: "strong",
      description: "Goal requires the component",
      status: "active",
      version: 1,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      relationId: "rel_2",
      fromEntityType: "decision",
      fromEntityId: "decision_1",
      toEntityType: "component",
      toEntityId: "component_1",
      relationType: "supports",
      strength: null,
      description: "Decision supports the component",
      status: "active",
      version: 1,
      createdAt: "2026-01-02",
      updatedAt: "2026-01-02",
    },
  ],
  query: {
    maxDepth: 5,
    direction: "both",
    relationType: "requires",
    status: "active",
  },
};

describe("RelationPathOutputBuilder", () => {
  it("renders typed nodes in path order with original directed edge orientation", () => {
    const text = new RelationPathOutputBuilder()
      .build(result)
      .toHumanReadable();

    expect(text).toContain(
      "goal:goal_1 --[requires, strong]--> component:component_1",
    );
    expect(text).toContain(
      "component:component_1 <--[supports]-- decision:decision_1",
    );
    expect(text).toContain("Goal requires the component");
    expect(text).toContain("Decision supports the component");
  });

  it("returns the stable path JSON schema with complete RelationView descriptions", () => {
    const output = new RelationPathOutputBuilder().buildStructuredOutput(
      result,
    );
    const content = output
      .getSections()
      .find((section) => section.type === "data")?.content;

    expect(content).toEqual({
      found: true,
      endpoints: {
        from: result.from,
        to: result.to,
      },
      hopCount: 2,
      nodes: result.nodes,
      edges: [
        expect.objectContaining({
          relationId: "rel_1",
          description: "Goal requires the component",
        }),
        expect.objectContaining({
          relationId: "rel_2",
          description: "Decision supports the component",
        }),
      ],
      query: {
        maxDepth: 5,
        direction: "both",
        relationType: "requires",
        entityType: null,
        strength: null,
        status: "active",
      },
    });
    expect(Object.keys(content as object)).toEqual([
      "found",
      "endpoints",
      "hopCount",
      "nodes",
      "edges",
      "query",
    ]);
  });

  it("renders disconnected results as a successful empty path response", () => {
    const disconnected: RelationPathResult = {
      ...result,
      found: false,
      hopCount: 0,
      nodes: [],
      edges: [],
    };
    const output = new RelationPathOutputBuilder().buildStructuredOutput(
      disconnected,
    );
    const content = output
      .getSections()
      .find((section) => section.type === "data")?.content;

    expect(content).toEqual(
      expect.objectContaining({
        found: false,
        hopCount: 0,
        nodes: [],
        edges: [],
      }),
    );
  });
});
