import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { EventEmitter } from "node:events";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";

const spawnMock = jest.fn();

jest.unstable_mockModule("node:child_process", () => ({
  spawn: spawnMock,
}));

const { AgentCliGateway } = await import("../../../../src/infrastructure/agents/AgentCliGateway.js");

function childProcess(): EventEmitter & { stdout: Readable; stderr: Readable } {
  const child = new EventEmitter() as EventEmitter & { stdout: Readable; stderr: Readable };
  child.stdout = new Readable({ read() {} });
  child.stderr = new Readable({ read() {} });
  return child;
}

describe("AgentCliGateway", () => {
  let telemetryClient: { track: jest.Mock; flush: jest.Mock; shutdown: jest.Mock };
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    spawnMock.mockReset();
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    telemetryClient = {
      track: jest.fn(),
      flush: jest.fn(),
      shutdown: jest.fn(),
    };
  });

  afterEach(() => {
    delete process.env.JUMBO_AGENT_COMMAND_VIBE;
    delete process.env.JUMBO_AGENT_ARGS_VIBE;
    stderrSpy.mockRestore();
  });

  it("spawns codex exec with the repository trust check bypassed for daemon automation", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);

    const promise = new AgentCliGateway(telemetryClient).invoke({
      agentId: "codex",
      prompt: "run codify",
    });
    child.emit("close", 0);

    await expect(promise).resolves.toEqual({ exitCode: 0, stdout: "", stderr: "" });
    const jumboRoot = path.join(os.homedir(), ".jumbo");
    expect(spawnMock).toHaveBeenCalledWith(
      `codex exec --skip-git-repo-check --sandbox workspace-write --add-dir ${jumboRoot} "run codify"`,
      [],
      {
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
      },
    );
    expect(telemetryClient.track).toHaveBeenCalledWith(
      "agent_invocation_completed",
      expect.objectContaining({ agentId: "codex", exitCode: 0, success: true }),
    );
  });

  it("keeps refinement prompts containing flags, spaces, and quotes inside the quoted prompt payload", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);
    const prompt = 'Run the Jumbo refinement workflow for goal goal_1. Execute: jumbo goal refine --id goal_1 --note "quoted value"';

    const promise = new AgentCliGateway(telemetryClient).invoke({
      agentId: "claude",
      prompt,
    });
    child.emit("close", 0);

    await expect(promise).resolves.toEqual({ exitCode: 0, stdout: "", stderr: "" });
    expect(spawnMock).toHaveBeenCalledWith(
      'claude -p "Run the Jumbo refinement workflow for goal goal_1. Execute: jumbo goal refine --id goal_1 --note \\"quoted value\\""',
      [],
      expect.objectContaining({ shell: true }),
    );
  });

  it("uses the same command-with-space mapping as the working legacy copilot command", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);

    const promise = new AgentCliGateway(telemetryClient).invoke({
      agentId: "copilot",
      prompt: "run review",
    });
    child.emit("close", 0);

    await expect(promise).resolves.toEqual({ exitCode: 0, stdout: "", stderr: "" });
    expect(spawnMock).toHaveBeenCalledWith(
      'gh copilot -p "run review"',
      [],
      expect.objectContaining({ shell: true }),
    );
  });

  it("spawns Antigravity through the documented agy executable", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);

    const promise = new AgentCliGateway(telemetryClient).invoke({
      agentId: "antigravity",
      prompt: "run review",
    });
    child.emit("close", 0);

    await expect(promise).resolves.toEqual({ exitCode: 0, stdout: "", stderr: "" });
    expect(spawnMock).toHaveBeenCalledWith(
      'agy -p "run review"',
      [],
      expect.objectContaining({ shell: true }),
    );
    expect(telemetryClient.track).toHaveBeenCalledWith(
      "agent_invocation_completed",
      expect.objectContaining({ agentId: "antigravity", exitCode: 0, success: true }),
    );
  });

  it("captures bounded agent stdout and stderr tails without mirroring raw output to daemon stderr", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);
    const oversizedStdout = `${"x".repeat(20_000)}stdout tail\n`;
    const oversizedStderr = `${"y".repeat(20_000)}stderr tail\n`;

    const promise = new AgentCliGateway(telemetryClient).invoke({
      agentId: "codex",
      prompt: "run codify",
    });
    child.stdout.emit("data", Buffer.from(oversizedStdout));
    child.stderr.emit("data", Buffer.from(oversizedStderr));
    child.emit("close", 1);

    const result = await promise;
    expect(result).toEqual({
      exitCode: 1,
      stdout: expect.stringContaining("stdout tail\n"),
      stderr: expect.stringContaining("stderr tail\n"),
    });
    expect(result.stdout).toHaveLength(16_384);
    expect(result.stderr).toHaveLength(16_384);
    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it("allows a supported agent executable to be overridden for deterministic daemon automation", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);
    process.env.JUMBO_AGENT_COMMAND_VIBE = '"C:\\Tools\\fake-agent.exe" --mode success';

    const promise = new AgentCliGateway(telemetryClient).invoke({
      agentId: "vibe",
      prompt: "run review",
    });
    child.emit("close", 0);

    await expect(promise).resolves.toEqual({ exitCode: 0, stdout: "", stderr: "" });
    expect(spawnMock).toHaveBeenCalledWith(
      '"C:\\Tools\\fake-agent.exe" --mode success -p "run review"',
      [],
      expect.objectContaining({ shell: true }),
    );
  });

  it("launches structured override arguments directly without shell interpretation", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);
    process.env.JUMBO_AGENT_COMMAND_VIBE = "C:\\Program Files\\nodejs\\node.exe";
    process.env.JUMBO_AGENT_ARGS_VIBE = JSON.stringify([
      "C:\\fixtures\\fake-agent.js",
      "--fake-mode",
      "failure",
    ]);

    const promise = new AgentCliGateway(telemetryClient).invoke({
      agentId: "vibe",
      prompt: "run review",
    });
    child.emit("close", 1);

    await expect(promise).resolves.toEqual({ exitCode: 1, stdout: "", stderr: "" });
    expect(spawnMock).toHaveBeenCalledWith(
      "C:\\Program Files\\nodejs\\node.exe",
      ["C:\\fixtures\\fake-agent.js", "--fake-mode", "failure", "-p", "run review"],
      {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
      },
    );
  });

  it("streams stdout and stderr activity while the agent child is still running", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);
    const activity: unknown[] = [];

    const promise = new AgentCliGateway(telemetryClient).invoke({
      agentId: "codex",
      prompt: "run codify",
      onActivity: (event: unknown) => activity.push(event),
    });
    child.stdout.emit("data", Buffer.from("first stdout line\n"));
    child.stderr.emit("data", Buffer.from("first stderr line\n"));

    expect(activity).toEqual([
      { stream: "stdout", text: "first stdout line\n" },
      { stream: "stderr", text: "first stderr line\n" },
    ]);

    child.emit("close", 0);
    await expect(promise).resolves.toEqual({
      exitCode: 0,
      stdout: "first stdout line\n",
      stderr: "first stderr line\n",
    });
  });

  it("returns a failed invocation result when the child process errors", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);

    const promise = new AgentCliGateway(telemetryClient).invoke({
      agentId: "codex",
      prompt: "run codify",
    });
    child.emit("error", new Error("spawn failed"));

    await expect(promise).resolves.toEqual({ exitCode: 1, stdout: "", stderr: "spawn failed" });
    expect(telemetryClient.track).toHaveBeenCalledWith(
      "agent_invocation_completed",
      expect.objectContaining({
        agentId: "codex",
        exitCode: 1,
        success: false,
        errorType: "Error",
        errorMessage: "spawn failed",
      }),
    );
  });

  it("rejects unsupported agents before spawning", async () => {
    await expect(
      new AgentCliGateway(telemetryClient).invoke({
        agentId: "unknown",
        prompt: "run codify",
      }),
    ).rejects.toThrow("Unsupported agent: unknown");
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("rejects the retired Gemini agent before spawning", async () => {
    await expect(
      new AgentCliGateway(telemetryClient).invoke({
        agentId: "gemini",
        prompt: "run codify",
      }),
    ).rejects.toThrow("Unsupported agent: gemini");
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("rejects Cursor because editor integrations are not daemon agent CLIs", async () => {
    await expect(
      new AgentCliGateway(telemetryClient).invoke({
        agentId: "cursor",
        prompt: "run codify",
      }),
    ).rejects.toThrow("Unsupported agent: cursor");
    expect(spawnMock).not.toHaveBeenCalled();
  });
});
