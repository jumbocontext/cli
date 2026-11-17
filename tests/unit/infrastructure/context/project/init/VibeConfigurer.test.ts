/**
 * Tests for VibeConfigurer infrastructure implementation
 */

import { VibeConfigurer } from "../../../../../../src/infrastructure/context/project/init/VibeConfigurer";

describe("VibeConfigurer", () => {
  const configurer = new VibeConfigurer();

  describe("agent", () => {
    it("should have the correct agent identity", () => {
      expect(configurer.agent).toEqual({ id: "vibe", name: "Vibe" });
    });
  });

  describe("skillPlatforms", () => {
    it("should declare .vibe/skills as the skill platform", () => {
      expect(configurer.skillPlatforms).toEqual([".vibe/skills"]);
    });
  });

  describe("configure()", () => {
    it("should complete without error", async () => {
      await expect(configurer.configure("/fake/root")).resolves.not.toThrow();
    });
  });

  describe("getPlannedFileChanges()", () => {
    it("should return no planned file changes", async () => {
      const changes = await configurer.getPlannedFileChanges("/fake/root");
      expect(changes).toEqual([]);
    });
  });
});
