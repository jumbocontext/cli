import { describe, expect, it } from "@jest/globals";
import { RelationView } from "../../../../../../../src/application/context/relations/RelationView.js";
import { RelationListOutputBuilder } from "../../../../../../../src/presentation/cli/commands/relations/list/RelationListOutputBuilder.js";

const edge: RelationView = {
  relationId: "rel_1",
  fromEntityType: "goal",
  fromEntityId: "goal_1",
  toEntityType: "component",
  toEntityId: "component_1",
  relationType: "requires",
  strength: "strong",
  description: "Required component",
  status: "active",
  version: 1,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

describe("RelationListOutputBuilder", () => {
  it("renders typed endpoints with the original directed orientation", () => {
    const text = new RelationListOutputBuilder().build([edge]).toHumanReadable();

    expect(text).toContain("goal:goal_1 --[requires]--> component:component_1");
  });

  it("owns the empty-result message", () => {
    const text = new RelationListOutputBuilder().build([], "goal:goal_1").toHumanReadable();

    expect(text).toContain("No relations found involving goal:goal_1");
  });

  it("returns every filter and relation field in structured output", () => {
    const output = new RelationListOutputBuilder().buildStructuredOutput([edge], {
      entityType: "goal",
      entityId: "goal_1",
      direction: "out",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "strong",
      status: "active",
    });
    const content = output.getSections().find((section) => section.type === "data")?.content;

    expect(content).toEqual(expect.objectContaining({
      count: 1,
      filter: {
        entityType: "goal",
        entityId: "goal_1",
        direction: "out",
        relationType: "requires",
        relatedEntityType: "component",
        strength: "strong",
        status: "active",
      },
      relations: [expect.objectContaining({ relationId: "rel_1" })],
    }));
  });
});
