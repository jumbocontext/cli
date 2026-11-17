import { beforeEach, describe, expect, it } from "@jest/globals";
import { DependencyView } from "../../../../../../../src/application/context/dependencies/DependencyView.js";
import { DependencySearchOutputBuilder } from "../../../../../../../src/presentation/cli/commands/dependencies/search/DependencySearchOutputBuilder.js";

describe("DependencySearchOutputBuilder", () => {
  let outputBuilder: DependencySearchOutputBuilder;

  const mockDependencies: DependencyView[] = [
    {
      dependencyId: "dep_1",
      name: "Express",
      ecosystem: "npm",
      packageName: "express",
      versionConstraint: "^4.18.0",
      endpoint: "/api",
      contract: "HTTP server",
      status: "active",
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      removedAt: null,
      removalReason: null,
    },
    {
      dependencyId: "dep_2",
      name: "Jest",
      ecosystem: "npm",
      packageName: "jest",
      versionConstraint: "^30.3.0",
      endpoint: null,
      contract: "Test runner",
      status: "active",
      version: 1,
      createdAt: "2025-01-02T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
      removedAt: null,
      removalReason: null,
    },
  ];

  beforeEach(() => {
    outputBuilder = new DependencySearchOutputBuilder();
  });

  describe("build (TTY output)", () => {
    it("should render dependency count and details in default format", () => {
      const output = outputBuilder.build(mockDependencies, "default");
      const text = output.toHumanReadable();

      expect(text).toContain("Dependencies (2)");
      expect(text).toContain("npm:express@^4.18.0");
      expect(text).toContain("active");
      expect(text).toContain("HTTP server");
      expect(text).toContain("dep_1");
    });

    it("should render only identity fields in compact format", () => {
      const output = outputBuilder.build(mockDependencies, "compact");
      const text = output.toHumanReadable();

      expect(text).toContain("dep_1");
      expect(text).toContain("Express");
      expect(text).toContain("npm:express");
      expect(text).not.toContain("HTTP server");
      expect(text).not.toContain("Endpoint:");
    });

    it("should render empty state message", () => {
      const output = outputBuilder.build([], "default");
      const text = output.toHumanReadable();

      expect(text).toContain("No dependencies matched the search criteria.");
    });
  });

  describe("buildStructuredOutput (JSON output)", () => {
    it("should include full dependency data in default format", () => {
      const output = outputBuilder.buildStructuredOutput(mockDependencies, "default");
      const dataSection = output.getSections().find(s => s.type === "data");
      const data = dataSection!.content as { count: number; dependencies: Record<string, unknown>[] };

      expect(data.count).toBe(2);
      expect(data.dependencies[0].dependencyId).toBe("dep_1");
      expect(data.dependencies[0].versionConstraint).toBe("^4.18.0");
      expect(data.dependencies[0].contract).toBe("HTTP server");
      expect(data.dependencies[0].status).toBe("active");
    });

    it("should include only compact dependency identity data", () => {
      const output = outputBuilder.buildStructuredOutput(mockDependencies, "compact");
      const dataSection = output.getSections().find(s => s.type === "data");
      const data = dataSection!.content as { count: number; dependencies: Record<string, unknown>[] };

      expect(data.count).toBe(2);
      expect(data.dependencies[0]).toEqual({
        dependencyId: "dep_1",
        name: "Express",
        ecosystem: "npm",
        packageName: "express",
      });
      expect(data.dependencies[0]).not.toHaveProperty("contract");
      expect(data.dependencies[0]).not.toHaveProperty("versionConstraint");
    });

    it("should return zero count and empty array for empty results", () => {
      const output = outputBuilder.buildStructuredOutput([], "default");
      const dataSection = output.getSections().find(s => s.type === "data");
      const data = dataSection!.content as { count: number; dependencies: unknown[] };

      expect(data.count).toBe(0);
      expect(data.dependencies).toEqual([]);
    });
  });
});
