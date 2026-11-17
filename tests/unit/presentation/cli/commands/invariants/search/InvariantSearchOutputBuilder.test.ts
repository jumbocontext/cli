import { describe, it, expect, beforeEach } from "@jest/globals";
import { InvariantView } from "../../../../../../../src/application/context/invariants/InvariantView.js";
import { InvariantSearchOutputBuilder } from "../../../../../../../src/presentation/cli/commands/invariants/search/InvariantSearchOutputBuilder.js";

describe("InvariantSearchOutputBuilder", () => {
  let outputBuilder: InvariantSearchOutputBuilder;

  const mockInvariants: InvariantView[] = [
    {
      invariantId: "inv_1",
      title: "Clean Architecture",
      description: "Keep layer boundaries clear",
      rationale: "Reduces coupling",
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
    {
      invariantId: "inv_2",
      title: "Stdout Pollution Prohibition",
      description: "Programmatic output must be clean",
      rationale: null,
      version: 1,
      createdAt: "2025-01-02T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
    },
  ];

  beforeEach(() => {
    outputBuilder = new InvariantSearchOutputBuilder();
  });

  describe("build (TTY output)", () => {
    it("should render invariant count and details in default format", () => {
      const output = outputBuilder.build(mockInvariants, "default");
      const text = output.toHumanReadable();

      expect(text).toContain("Invariants (2)");
      expect(text).toContain("Clean Architecture");
      expect(text).toContain("Keep layer boundaries clear");
      expect(text).toContain("Reduces coupling");
      expect(text).toContain("inv_1");
    });

    it("should render only id and title in compact format", () => {
      const output = outputBuilder.build(mockInvariants, "compact");
      const text = output.toHumanReadable();

      expect(text).toContain("inv_1");
      expect(text).toContain("Clean Architecture");
      expect(text).not.toContain("Keep layer boundaries clear");
      expect(text).not.toContain("Rationale:");
    });

    it("should render empty state message", () => {
      const output = outputBuilder.build([], "default");
      const text = output.toHumanReadable();

      expect(text).toContain("No invariants matched the search criteria.");
    });
  });

  describe("buildStructuredOutput (JSON output)", () => {
    it("should include full invariant data in default format", () => {
      const output = outputBuilder.buildStructuredOutput(mockInvariants, "default");
      const dataSection = output.getSections().find(s => s.type === "data");
      const data = dataSection!.content as { count: number; invariants: Record<string, unknown>[] };

      expect(data.count).toBe(2);
      expect(data.invariants[0].invariantId).toBe("inv_1");
      expect(data.invariants[0].description).toBe("Keep layer boundaries clear");
      expect(data.invariants[0].rationale).toBe("Reduces coupling");
      expect(data.invariants[0].version).toBe(1);
    });

    it("should include only id and title in compact format", () => {
      const output = outputBuilder.buildStructuredOutput(mockInvariants, "compact");
      const dataSection = output.getSections().find(s => s.type === "data");
      const data = dataSection!.content as { count: number; invariants: Record<string, unknown>[] };

      expect(data.count).toBe(2);
      expect(data.invariants[0]).toEqual({
        invariantId: "inv_1",
        title: "Clean Architecture",
      });
      expect(data.invariants[0]).not.toHaveProperty("description");
      expect(data.invariants[0]).not.toHaveProperty("rationale");
    });

    it("should return zero count and empty array", () => {
      const output = outputBuilder.buildStructuredOutput([], "default");
      const dataSection = output.getSections().find(s => s.type === "data");
      const data = dataSection!.content as { count: number; invariants: unknown[] };

      expect(data.count).toBe(0);
      expect(data.invariants).toEqual([]);
    });
  });
});
