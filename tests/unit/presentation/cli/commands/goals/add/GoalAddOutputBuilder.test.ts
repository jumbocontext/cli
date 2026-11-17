/**
 * Tests for GoalAddOutputBuilder
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { GoalAddOutputBuilder } from "../../../../../../../src/presentation/cli/commands/goals/add/GoalAddOutputBuilder.js";

describe("GoalAddOutputBuilder", () => {
  let outputBuilder: GoalAddOutputBuilder;

  beforeEach(() => {
    outputBuilder = new GoalAddOutputBuilder();
  });

  describe("buildSuccess", () => {
    it("should render success prompt", () => {
      const output = outputBuilder.buildSuccess("goal_abc123", "JWT Auth", "Implement JWT authentication");
      const text = output.toHumanReadable();

      expect(text).toContain("Goal Defined");
      expect(text).toContain("Goal has been defined");
    });

    it("should render goalId in output", () => {
      const output = outputBuilder.buildSuccess("goal_abc123", "JWT Auth", "Implement JWT authentication");
      const text = output.toHumanReadable();

      expect(text).toContain("goal_abc123");
    });

    it("should render title in output", () => {
      const output = outputBuilder.buildSuccess("goal_abc123", "JWT Auth", "Implement JWT authentication");
      const text = output.toHumanReadable();

      expect(text).toContain("JWT Auth");
    });

    it("should render objective in output", () => {
      const output = outputBuilder.buildSuccess("goal_abc123", "JWT Auth", "Implement JWT authentication");
      const text = output.toHumanReadable();

      expect(text).toContain("Implement JWT authentication");
    });

    it("should render status in output", () => {
      const output = outputBuilder.buildSuccess("goal_abc123", "JWT Auth", "Implement JWT authentication");
      const text = output.toHumanReadable();

      expect(text).toContain("defined");
    });

    it("should include structured data section with goal details", () => {
      const output = outputBuilder.buildSuccess("goal_abc123", "JWT Auth", "Implement JWT authentication");
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");

      expect(dataSection).toBeDefined();
      const data = dataSection!.content as Record<string, unknown>;
      expect(data.goalId).toBe("goal_abc123");
      expect(data.title).toBe("JWT Auth");
      expect(data.objective).toBe("Implement JWT authentication");
      expect(data.status).toBe("defined");
    });
  });

  describe("buildInteractiveHeader", () => {
    it("should render interactive header", () => {
      const output = outputBuilder.buildInteractiveHeader();
      const text = output.toHumanReadable();

      expect(text).toContain("Interactive Goal Creation");
    });
  });

  describe("buildMissingObjectiveError", () => {
    it("should render missing objective error", () => {
      const output = outputBuilder.buildMissingObjectiveError();
      const text = output.toHumanReadable();

      expect(text).toContain("Missing required option");
      expect(text).toContain("--objective");
    });
  });

  describe("buildFailureError", () => {
    it("should render error message from Error object", () => {
      const output = outputBuilder.buildFailureError(new Error("Something broke"));
      const text = output.toHumanReadable();

      expect(text).toContain("Failed to define goal");
      expect(text).toContain("Something broke");
    });

    it("should render error message from string", () => {
      const output = outputBuilder.buildFailureError("Something broke");
      const text = output.toHumanReadable();

      expect(text).toContain("Failed to define goal");
      expect(text).toContain("Something broke");
    });
  });
});
