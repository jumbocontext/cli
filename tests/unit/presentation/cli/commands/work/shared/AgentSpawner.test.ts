import { describe, it, expect } from "@jest/globals";
import {
  SUPPORTED_AGENTS,
  AGENT_COMMANDS,
  buildAgentCommandLine,
} from "../../../../../../../src/presentation/cli/commands/work/shared/AgentSpawner.js";

describe("AgentSpawner", () => {
  describe("SUPPORTED_AGENTS", () => {
    it("includes all expected agent identifiers", () => {
      expect(SUPPORTED_AGENTS).toContain("claude");
      expect(SUPPORTED_AGENTS).toContain("antigravity");
      expect(SUPPORTED_AGENTS).toContain("copilot");
      expect(SUPPORTED_AGENTS).toContain("codex");
      expect(SUPPORTED_AGENTS).toContain("cursor");
      expect(SUPPORTED_AGENTS).toContain("vibe");
      expect(SUPPORTED_AGENTS).toHaveLength(6);
      expect(SUPPORTED_AGENTS).not.toContain("gemini");
    });
  });

  describe("AGENT_COMMANDS", () => {
    it("maps each agent to an executable and prompt argument strategy", () => {
      for (const agentId of SUPPORTED_AGENTS) {
        const entry = AGENT_COMMANDS[agentId];
        expect(entry).toBeDefined();
        expect(typeof entry.executable).toBe("string");
        expect(entry.promptFlag !== undefined || entry.args !== undefined).toBe(true);
      }
    });

    it("uses -p as prompt flag for agents whose CLI exposes prompt mode through -p", () => {
      for (const agentId of SUPPORTED_AGENTS.filter((id) => id !== "codex")) {
        expect(AGENT_COMMANDS[agentId].promptFlag).toBe("-p");
      }
    });

    it("maps codex to the non-interactive exec command because -p means profile", () => {
      expect(AGENT_COMMANDS.codex).toEqual({ executable: "codex", args: ["exec"] });
      expect(buildAgentCommandLine(AGENT_COMMANDS.codex, "run refine")).toBe('codex exec "run refine"');
    });

    it("maps copilot to gh copilot executable", () => {
      expect(AGENT_COMMANDS.copilot.executable).toBe("gh copilot");
    });

    it("maps claude to claude executable", () => {
      expect(AGENT_COMMANDS.claude.executable).toBe("claude");
    });

    it("maps antigravity to the documented agy executable", () => {
      expect(AGENT_COMMANDS.antigravity.executable).toBe("agy");
    });
  });
});
