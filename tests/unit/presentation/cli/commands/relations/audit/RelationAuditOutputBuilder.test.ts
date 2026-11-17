import { describe, expect, it } from "@jest/globals";
import { RelationAuditResult } from "../../../../../../../src/application/context/relations/audit/RelationAuditResult.js";
import { RelationAuditOutputBuilder } from "../../../../../../../src/presentation/cli/commands/relations/audit/RelationAuditOutputBuilder.js";

const result: RelationAuditResult = {
  requestedChecks: ["dangling", "isolated", "inactive-only", "ambiguous-id", "summary"],
  entityType: null,
  summary: {
    nodes: { count: 2, byEntityType: { component: 1, goal: 1 } },
    relations: {
      count: 2,
      byRelationType: { involves: 2 },
      byStrength: { strong: 1, unspecified: 1 },
      byStatus: { active: 1, deactivated: 1 },
    },
  },
  findings: {
    dangling: {
      count: 1,
      items: [{
        relationId: "relation-1",
        from: { entityType: "goal", entityId: "goal-1" },
        to: { entityType: "component", entityId: "missing" },
        missingEndpoints: [{ entityType: "component", entityId: "missing" }],
      }],
    },
    isolated: {
      count: 1,
      items: [{ entityType: "goal", entityId: "goal-alone", lifecycleState: "todo" }],
    },
    inactiveOnly: {
      count: 1,
      items: [{
        entityType: "component",
        entityId: "component-old",
        lifecycleState: "deprecated",
        relationIds: ["relation-old"],
      }],
    },
    ambiguousId: {
      count: 1,
      items: [{ entityId: "shared", entityTypes: ["component", "goal"] }],
    },
  },
};

describe("RelationAuditOutputBuilder", () => {
  it("uses stable headings and actionable typed IDs in text output", () => {
    const text = new RelationAuditOutputBuilder().build(result).toHumanReadable();

    expect(text).toContain("Summary");
    expect(text).toContain("Dangling relations (1)");
    expect(text).toContain("relation-1: missing component:missing");
    expect(text).toContain("Isolated entities (1)");
    expect(text).toContain("goal:goal-alone [todo]");
    expect(text).toContain("Inactive-only entities (1)");
    expect(text).toContain("component:component-old [deprecated] relations: relation-old");
    expect(text).toContain("Ambiguous entity IDs (1)");
    expect(text).toContain("component:shared, goal:shared");
  });

  it("emits a stable structured summary and finding collection contract", () => {
    const output = new RelationAuditOutputBuilder().buildStructuredOutput(result);
    const content = output.getSections().find((section) => section.type === "data")?.content;

    expect(content).toEqual({
      requestedChecks: result.requestedChecks,
      filter: { entityType: null },
      summary: result.summary,
      findings: result.findings,
    });
    expect(Object.keys(content as object)).toEqual(["requestedChecks", "filter", "summary", "findings"]);
  });

  it("renders only requested check headings", () => {
    const text = new RelationAuditOutputBuilder().build({
      ...result,
      requestedChecks: ["dangling"],
    }).toHumanReadable();

    expect(text).toContain("Dangling relations");
    expect(text).not.toContain("Summary");
    expect(text).not.toContain("Isolated entities");
  });

  it("keeps unrequested structured finding collections empty and stable", () => {
    const selected: RelationAuditResult = {
      ...result,
      requestedChecks: ["summary"],
      findings: {
        dangling: { count: 0, items: [] },
        isolated: { count: 0, items: [] },
        inactiveOnly: { count: 0, items: [] },
        ambiguousId: { count: 0, items: [] },
      },
    };
    const content = new RelationAuditOutputBuilder()
      .buildStructuredOutput(selected)
      .getSections()
      .find((section) => section.type === "data")?.content as Record<string, unknown>;

    expect(content.findings).toEqual(selected.findings);
  });
});
