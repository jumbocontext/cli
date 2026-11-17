import { describe, it, expect, beforeEach } from "@jest/globals";
import { ComponentSearchOutputBuilder } from "../../../../../../../src/presentation/cli/commands/components/search/ComponentSearchOutputBuilder.js";
import { ComponentView } from "../../../../../../../src/application/context/components/ComponentView.js";

describe("ComponentSearchOutputBuilder", () => {
  let outputBuilder: ComponentSearchOutputBuilder;

  const mockComponents: ComponentView[] = [
    {
      componentId: "comp_1",
      name: "AuthService",
      type: "service",
      description: "Handles authentication",
      responsibility: "User auth",
      path: "src/auth",
      status: "active",
      deprecationReason: null,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
    {
      componentId: "comp_2",
      name: "UserApi",
      type: "api",
      description: "User API endpoints",
      responsibility: "User management",
      path: "src/api/user",
      status: "active",
      deprecationReason: null,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    outputBuilder = new ComponentSearchOutputBuilder();
  });

  describe("build (TTY output)", () => {
    describe("default format", () => {
      it("should render component count and details", () => {
        const output = outputBuilder.build(mockComponents, "default");
        const text = output.toHumanReadable();

        expect(text).toContain("Components (2)");
        expect(text).toContain("AuthService");
        expect(text).toContain("service");
        expect(text).toContain("active");
        expect(text).toContain("Handles authentication");
        expect(text).toContain("src/auth");
        expect(text).toContain("comp_1");
      });

      it("should render multiple components", () => {
        const output = outputBuilder.build(mockComponents, "default");
        const text = output.toHumanReadable();

        expect(text).toContain("AuthService");
        expect(text).toContain("UserApi");
      });
    });

    describe("compact format", () => {
      it("should render only id, name, and type", () => {
        const output = outputBuilder.build(mockComponents, "compact");
        const text = output.toHumanReadable();

        expect(text).toContain("comp_1");
        expect(text).toContain("AuthService");
        expect(text).toContain("(service)");
        expect(text).toContain("comp_2");
        expect(text).toContain("UserApi");
        expect(text).toContain("(api)");
      });

      it("should not include description in compact format", () => {
        const output = outputBuilder.build(mockComponents, "compact");
        const text = output.toHumanReadable();

        expect(text).not.toContain("Handles authentication");
        expect(text).not.toContain("Path:");
      });
    });

    describe("empty results", () => {
      it("should render empty state message", () => {
        const output = outputBuilder.build([], "default");
        const text = output.toHumanReadable();

        expect(text).toContain("No components matched the search criteria.");
      });
    });
  });

  describe("buildStructuredOutput (JSON output)", () => {
    describe("default format", () => {
      it("should include full component data", () => {
        const output = outputBuilder.buildStructuredOutput(mockComponents, "default");
        const sections = output.getSections();
        const dataSection = sections.find(s => s.type === "data");

        expect(dataSection).toBeDefined();
        const data = dataSection!.content as { count: number; components: Record<string, unknown>[] };

        expect(data.count).toBe(2);
        expect(data.components[0].componentId).toBe("comp_1");
        expect(data.components[0].description).toBe("Handles authentication");
        expect(data.components[0].responsibility).toBe("User auth");
        expect(data.components[0].path).toBe("src/auth");
      });
    });

    describe("compact format", () => {
      it("should include only id, name, and type", () => {
        const output = outputBuilder.buildStructuredOutput(mockComponents, "compact");
        const sections = output.getSections();
        const dataSection = sections.find(s => s.type === "data");
        const data = dataSection!.content as { count: number; components: Record<string, unknown>[] };

        expect(data.count).toBe(2);
        expect(data.components[0]).toEqual({
          componentId: "comp_1",
          name: "AuthService",
          type: "service",
        });
        expect(data.components[0]).not.toHaveProperty("description");
        expect(data.components[0]).not.toHaveProperty("path");
      });
    });

    describe("empty results", () => {
      it("should return zero count and empty array", () => {
        const output = outputBuilder.buildStructuredOutput([], "default");
        const sections = output.getSections();
        const dataSection = sections.find(s => s.type === "data");
        const data = dataSection!.content as { count: number; components: unknown[] };

        expect(data.count).toBe(0);
        expect(data.components).toEqual([]);
      });
    });
  });
});
