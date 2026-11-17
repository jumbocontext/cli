import { beforeEach, describe, expect, it } from "@jest/globals";
import { DecisionView } from "../../../../../../../src/application/context/decisions/DecisionView.js";
import { DecisionShowOutputBuilder } from "../../../../../../../src/presentation/cli/commands/decisions/show/DecisionShowOutputBuilder.js";

describe("DecisionShowOutputBuilder", () => {
  let outputBuilder: DecisionShowOutputBuilder;

  const decision: DecisionView = {
    decisionId: "dec_123",
    title: "Use event sourcing",
    context: "State changes need a durable audit trail without losing any historical intent.",
    rationale: "Events preserve intent and enable deterministic projection rebuilding.",
    alternatives: ["CRUD snapshots", "Change data capture"],
    consequences: "Readers use asynchronously rebuilt projections.",
    status: "superseded",
    supersededBy: "dec_456",
    reversalReason: "A complete reversal explanation",
    reversedAt: "2026-02-01T11:00:00.000Z",
    version: 7,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-02-01T11:00:00.000Z",
  };

  beforeEach(() => {
    outputBuilder = new DecisionShowOutputBuilder();
  });

  it("renders every decision field without truncation", () => {
    const text = outputBuilder.build(decision).toHumanReadable();

    for (const value of [
      decision.decisionId,
      decision.title,
      decision.context,
      decision.rationale,
      ...decision.alternatives,
      decision.consequences,
      decision.status,
      decision.supersededBy,
      decision.reversalReason,
      decision.reversedAt,
      String(decision.version),
      decision.createdAt,
      decision.updatedAt,
    ]) {
      expect(text).toContain(value);
    }
    expect(text).not.toContain("...");
  });

  it("represents null and empty values explicitly", () => {
    const text = outputBuilder.build({
      ...decision,
      context: "",
      rationale: null,
      alternatives: [],
      consequences: null,
      supersededBy: null,
      reversalReason: null,
      reversedAt: null,
    }).toHumanReadable();

    expect(text).toContain("(empty)");
    expect(text.match(/\(null\)/g)).toHaveLength(5);
  });

  it("builds one data section containing the complete DecisionView", () => {
    const sections = outputBuilder.buildStructuredOutput(decision).getSections();

    expect(sections).toHaveLength(1);
    expect(sections[0]).toEqual({ type: "data", content: decision, metadata: undefined });
    expect(JSON.parse(JSON.stringify(sections[0].content))).toEqual(decision);
  });

  it("owns clear not-found and general failure copy", () => {
    expect(outputBuilder.buildNotFoundError("dec_missing").toHumanReadable())
      .toContain("No decision exists with ID: dec_missing");
    expect(outputBuilder.buildFailureError(new Error("reader failed")).toHumanReadable())
      .toContain("Failed to show decision");
    expect(outputBuilder.buildFailureError("reader failed").toHumanReadable())
      .toContain("reader failed");
  });
});
