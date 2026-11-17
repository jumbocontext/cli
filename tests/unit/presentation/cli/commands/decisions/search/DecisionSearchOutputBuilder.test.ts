import { beforeEach, describe, expect, it } from "@jest/globals";
import { DecisionView } from "../../../../../../../src/application/context/decisions/DecisionView.js";
import { DecisionSearchOutputBuilder } from "../../../../../../../src/presentation/cli/commands/decisions/search/DecisionSearchOutputBuilder.js";

describe("DecisionSearchOutputBuilder", () => {
  let outputBuilder: DecisionSearchOutputBuilder;

  const mockDecisions: DecisionView[] = [
    {
      decisionId: "dec_1",
      title: "Use Event Sourcing",
      context: "Need to track all state changes",
      rationale: "Enables full audit trail",
      alternatives: ["CRUD"],
      consequences: "More projection code",
      status: "active",
      supersededBy: null,
      reversalReason: null,
      reversedAt: null,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
    {
      decisionId: "dec_2",
      title: "Use Gateway Pattern",
      context: "Need a boundary",
      rationale: "Keeps application decoupled",
      alternatives: [],
      consequences: null,
      status: "superseded",
      supersededBy: "dec_3",
      reversalReason: null,
      reversedAt: null,
      version: 1,
      createdAt: "2025-01-02T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
    },
  ];

  beforeEach(() => {
    outputBuilder = new DecisionSearchOutputBuilder();
  });

  describe("build (TTY output)", () => {
    it("should render decision count and details in default format", () => {
      const output = outputBuilder.build(mockDecisions, "default");
      const text = output.toHumanReadable();

      expect(text).toContain("Architectural Decisions (2)");
      expect(text).toContain("Use Event Sourcing");
      expect(text).toContain("active");
      expect(text).toContain("Need to track all state changes");
      expect(text).toContain("Enables full audit trail");
      expect(text).toContain("dec_1");
    });

    it("should render only id, title, and status in compact format", () => {
      const output = outputBuilder.build(mockDecisions, "compact");
      const text = output.toHumanReadable();

      expect(text).toContain("dec_1");
      expect(text).toContain("Use Event Sourcing");
      expect(text).toContain("[active]");
      expect(text).not.toContain("Need to track all state changes");
      expect(text).not.toContain("Rationale:");
    });

    it("should render empty state message", () => {
      const output = outputBuilder.build([], "default");
      const text = output.toHumanReadable();

      expect(text).toContain("No decisions matched the search criteria.");
    });
  });

  describe("buildStructuredOutput (JSON output)", () => {
    it("should include full decision data in default format", () => {
      const output = outputBuilder.buildStructuredOutput(mockDecisions, "default");
      const dataSection = output.getSections().find(s => s.type === "data");
      const data = dataSection!.content as { count: number; decisions: Record<string, unknown>[] };

      expect(data.count).toBe(2);
      expect(data.decisions[0].decisionId).toBe("dec_1");
      expect(data.decisions[0].context).toBe("Need to track all state changes");
      expect(data.decisions[0].alternatives).toEqual(["CRUD"]);
      expect(data.decisions[0].status).toBe("active");
    });

    it("should include only id, title, and status in compact format", () => {
      const output = outputBuilder.buildStructuredOutput(mockDecisions, "compact");
      const dataSection = output.getSections().find(s => s.type === "data");
      const data = dataSection!.content as { count: number; decisions: Record<string, unknown>[] };

      expect(data.count).toBe(2);
      expect(data.decisions[0]).toEqual({
        decisionId: "dec_1",
        title: "Use Event Sourcing",
        status: "active",
      });
      expect(data.decisions[0]).not.toHaveProperty("context");
      expect(data.decisions[0]).not.toHaveProperty("rationale");
    });

    it("should return zero count and empty array for empty results", () => {
      const output = outputBuilder.buildStructuredOutput([], "default");
      const dataSection = output.getSections().find(s => s.type === "data");
      const data = dataSection!.content as { count: number; decisions: unknown[] };

      expect(data.count).toBe(0);
      expect(data.decisions).toEqual([]);
    });
  });
});
