import { describe, it, expect } from "@jest/globals";
import { commands } from "../../../../../src/presentation/cli/commands/registry/generated-commands.js";

/**
 * The bootstrap-layer guard treats command metadata as the single source of
 * truth for whether a command may run outside an initialized Jumbo project.
 * Every registered command must therefore declare requiresProject explicitly,
 * and only an explicit allow-list may opt out of project enforcement.
 */
const REQUIRES_PROJECT_FALSE_ALLOWLIST: ReadonlySet<string> = new Set([
  "project init",
]);

describe("requiresProject metadata", () => {
  it("every registered command declares requiresProject as a boolean", () => {
    const offenders = commands.filter(
      (c) => typeof c.metadata.requiresProject !== "boolean"
    );
    expect(offenders.map((c) => c.path)).toEqual([]);
  });

  it("only the explicit allow-list opts out of project enforcement", () => {
    const actualFalse = new Set(
      commands
        .filter((c) => c.metadata.requiresProject === false)
        .map((c) => c.path)
    );
    expect(actualFalse).toEqual(REQUIRES_PROJECT_FALSE_ALLOWLIST);
  });

  it("includes index rebuild as an explicitly project-scoped generated command", () => {
    const command = commands.find((c) => c.path === "index rebuild");

    expect(command).toBeDefined();
    expect(command?.metadata.requiresProject).toBe(true);
  });

  it("includes project stats as an explicitly project-scoped generated command", () => {
    const command = commands.find((c) => c.path === "project stats");

    expect(command).toBeDefined();
    expect(command?.metadata.requiresProject).toBe(true);
  });

  it("includes relations path as an explicitly project-scoped generated command", () => {
    const command = commands.find((c) => c.path === "relations path");

    expect(command).toBeDefined();
    expect(command?.metadata.requiresProject).toBe(true);
  });

  it("includes decision show as an explicitly project-scoped generated command", () => {
    const command = commands.find((c) => c.path === "decision show");

    expect(command).toBeDefined();
    expect(command?.metadata.requiresProject).toBe(true);
  });

  it("registers goal approve and no longer registers goal qualify", () => {
    const paths = commands.map((c) => c.path);

    expect(paths).toContain("goal approve");
    expect(paths).not.toContain("goal qualify");
  });

  it("registers goal postpone as explicitly project-scoped", () => {
    const command = commands.find((c) => c.path === "goal postpone");

    expect(command).toBeDefined();
    expect(command?.metadata.requiresProject).toBe(true);
  });

  it("registers goal reinstate as explicitly project-scoped", () => {
    const command = commands.find((c) => c.path === "goal reinstate");

    expect(command).toBeDefined();
    expect(command?.metadata.requiresProject).toBe(true);
  });
});
