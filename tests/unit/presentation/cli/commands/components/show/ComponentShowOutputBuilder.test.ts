/**
 * Tests for ComponentShowOutputBuilder
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { ComponentShowOutputBuilder } from "../../../../../../../src/presentation/cli/commands/components/show/ComponentShowOutputBuilder.js";
import { ComponentView } from "../../../../../../../src/application/context/components/ComponentView.js";
import { RelationView } from "../../../../../../../src/application/context/relations/RelationView.js";

describe("ComponentShowOutputBuilder", () => {
  let outputBuilder: ComponentShowOutputBuilder;

  const mockComponent: ComponentView = {
    componentId: "comp_123",
    name: "UserService",
    type: "service",
    description: "Handles user operations",
    responsibility: "User management",
    path: "src/services/user",
    status: "active",
    deprecationReason: null,
    version: 1,
    createdAt: "2025-01-01T10:00:00Z",
    updatedAt: "2025-01-01T10:00:00Z",
  };

  const mockRelations: RelationView[] = [
    {
      relationId: "rel_1",
      fromEntityType: "component",
      fromEntityId: "comp_123",
      toEntityType: "component",
      toEntityId: "comp_456",
      relationType: "uses",
      strength: "strong",
      description: "Uses AuthProvider for authentication",
      status: "active",
      version: 1,
      createdAt: "2025-01-01T10:00:00Z",
      updatedAt: "2025-01-01T10:00:00Z",
    },
    {
      relationId: "rel_2",
      fromEntityType: "goal",
      fromEntityId: "goal_789",
      toEntityType: "component",
      toEntityId: "comp_123",
      relationType: "involves",
      strength: "strong",
      description: "Goal involves this component",
      status: "active",
      version: 1,
      createdAt: "2025-01-01T11:00:00Z",
      updatedAt: "2025-01-01T11:00:00Z",
    },
  ];

  beforeEach(() => {
    outputBuilder = new ComponentShowOutputBuilder();
  });

  describe("build (TTY output)", () => {
    it("should render component details", () => {
      const output = outputBuilder.build(mockComponent, mockRelations);
      const text = output.toHumanReadable();

      expect(text).toContain("Component");
      expect(text).toContain("UserService");
      expect(text).toContain("comp_123");
      expect(text).toContain("service");
      expect(text).toContain("active");
      expect(text).toContain("Handles user operations");
      expect(text).toContain("User management");
      expect(text).toContain("src/services/user");
    });

    it("should render relations section", () => {
      const output = outputBuilder.build(mockComponent, mockRelations);
      const text = output.toHumanReadable();

      expect(text).toContain("Relations");
      expect(text).toContain("uses");
      expect(text).toContain("involves");
    });

    it("should show outgoing relation direction", () => {
      const output = outputBuilder.build(mockComponent, mockRelations);
      const text = output.toHumanReadable();

      expect(text).toContain("component:comp_456");
    });

    it("should show incoming relation direction", () => {
      const output = outputBuilder.build(mockComponent, mockRelations);
      const text = output.toHumanReadable();

      expect(text).toContain("goal:goal_789");
    });

    it("should show no relations message when empty", () => {
      const output = outputBuilder.build(mockComponent, []);
      const text = output.toHumanReadable();

      expect(text).toContain("No relations registered");
    });

    it("should show deprecation reason when present", () => {
      const deprecated = {
        ...mockComponent,
        status: "deprecated" as const,
        deprecationReason: "Replaced by NewService",
      };
      const output = outputBuilder.build(deprecated, []);
      const text = output.toHumanReadable();

      expect(text).toContain("Replaced by NewService");
    });
  });

  describe("buildStructuredOutput (JSON output)", () => {
    it("should include component data", () => {
      const output = outputBuilder.buildStructuredOutput(mockComponent, mockRelations);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");

      expect(dataSection).toBeDefined();
      const data = dataSection!.content as Record<string, unknown>;
      const component = data.component as Record<string, unknown>;

      expect(component.componentId).toBe("comp_123");
      expect(component.name).toBe("UserService");
      expect(component.type).toBe("service");
    });

    it("should include relations data", () => {
      const output = outputBuilder.buildStructuredOutput(mockComponent, mockRelations);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");
      const data = dataSection!.content as Record<string, unknown>;
      const relations = data.relations as Record<string, unknown>[];

      expect(relations).toHaveLength(2);
      expect(relations[0].relationType).toBe("uses");
      expect(relations[1].relationType).toBe("involves");
    });
  });

  describe("buildNotFoundError", () => {
    it("should render not found message", () => {
      const output = outputBuilder.buildNotFoundError("NonExistent");
      const text = output.toHumanReadable();

      expect(text).toContain("Component not found");
    });
  });

  describe("buildFailureError", () => {
    it("should render error message from Error object", () => {
      const output = outputBuilder.buildFailureError(new Error("Something broke"));
      const text = output.toHumanReadable();

      expect(text).toContain("Failed to show component");
    });

    it("should render error message from string", () => {
      const output = outputBuilder.buildFailureError("Something broke");
      const text = output.toHumanReadable();

      expect(text).toContain("Failed to show component");
    });
  });
});
