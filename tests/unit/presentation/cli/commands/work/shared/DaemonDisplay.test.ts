import { jest, describe, it, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("../../../../../../../src/presentation/cli/animations/GlimmerEffect.js", () => ({
  playGlimmer: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule("../../../../../../../src/presentation/cli/animations/BrailleSpinner.js", () => ({
  startBrailleSpinner: jest.fn().mockReturnValue({ stop: jest.fn() }),
}));

const { DaemonDisplay } = await import("../../../../../../../src/presentation/cli/commands/work/shared/DaemonDisplay.js");
const { playGlimmer } = await import("../../../../../../../src/presentation/cli/animations/GlimmerEffect.js");
const { startBrailleSpinner } = await import("../../../../../../../src/presentation/cli/animations/BrailleSpinner.js");

const mockPlayGlimmer = playGlimmer as jest.MockedFunction<typeof playGlimmer>;
const mockStartBrailleSpinner = startBrailleSpinner as jest.MockedFunction<typeof startBrailleSpinner>;

describe("DaemonDisplay", () => {
  let captured: string;
  let display: InstanceType<typeof DaemonDisplay>;

  const displayConfig = {
    title: "Test Daemon",
    idleLabel: "waiting",
    activeLabel: "processing",
    completeStatus: "done",
    daemonName: "TestDaemon",
  };

  const runtimeConfig = {
    agentId: "claude",
    pollIntervalS: 30,
    maxRetries: 3,
  };

  beforeEach(() => {
    captured = "";
    mockPlayGlimmer.mockClear();
    mockStartBrailleSpinner.mockClear();
    mockStartBrailleSpinner.mockReturnValue({ stop: jest.fn() });

    display = new DaemonDisplay(displayConfig, runtimeConfig);

    // Override write to capture output
    (display as unknown as { write: (s: string) => void }).write = (s: string) => { captured += s; };
  });

  describe("renderHeader", () => {
    it("calls playGlimmer with the configured title", async () => {
      await display.renderHeader();
      expect(mockPlayGlimmer).toHaveBeenCalledWith(
        "Test Daemon",
        expect.any(String),
        expect.objectContaining({ baseColor: expect.any(String) }),
        expect.any(Function),
      );
    });

    it("includes agent, poll interval, retries, and quit hint in output", async () => {
      await display.renderHeader();
      expect(captured).toContain("claude");
      expect(captured).toContain("poll 30s");
      expect(captured).toContain("retries 3");
      expect(captured).toContain("Q to stop");
    });
  });

  describe("startWaiting", () => {
    it("starts a braille spinner with the idle label", () => {
      display.startWaiting();
      expect(mockStartBrailleSpinner).toHaveBeenCalledWith(
        expect.objectContaining({ label: "waiting" }),
      );
    });

    it("returns a handle with stop method", () => {
      const handle = display.startWaiting();
      expect(typeof handle.stop).toBe("function");
    });
  });

  describe("startProcessing", () => {
    it("starts a braille spinner with the active label", () => {
      display.startProcessing();
      expect(mockStartBrailleSpinner).toHaveBeenCalledWith(
        expect.objectContaining({ label: "processing" }),
      );
    });
  });

  describe("renderGoalStart", () => {
    it("outputs the short goal ID and attempt info", () => {
      display.renderGoalStart("abcdef12-3456-7890-abcd-ef1234567890", "Test objective", 1, 3);
      expect(captured).toContain("abcdef12");
      expect(captured).toContain("attempt 1/3");
    });

    it("truncates long objectives", () => {
      const longObjective = "A".repeat(100);
      display.renderGoalStart("abcdef12-3456-7890-abcd-ef1234567890", longObjective, 1, 3);
      expect(captured).toContain("...");
    });
  });

  describe("renderGoalComplete", () => {
    it("outputs the configured complete status", () => {
      display.renderGoalComplete("abcdef12-3456-7890-abcd-ef1234567890", "Test objective", 2);
      expect(captured).toContain("done");
      expect(captured).toContain("abcdef12");
      expect(captured).toContain("2 attempts");
    });

    it("uses singular 'attempt' for one attempt", () => {
      display.renderGoalComplete("abcdef12-3456-7890-abcd-ef1234567890", "Test objective", 1);
      expect(captured).toContain("1 attempt");
      expect(captured).not.toContain("1 attempts");
    });
  });

  describe("renderGoalSkipped", () => {
    it("outputs the configured complete status in the skip message", () => {
      display.renderGoalSkipped("abcdef12-3456-7890-abcd-ef1234567890", "defined", 3);
      expect(captured).toContain("did not reach 'done'");
      expect(captured).toContain("3 attempts");
      expect(captured).toContain("status: defined");
    });
  });

  describe("renderUnknownAgent", () => {
    it("outputs the unknown agent and supported list", () => {
      display.renderUnknownAgent("badagent", ["claude", "antigravity"]);
      expect(captured).toContain("badagent");
      expect(captured).toContain("claude, antigravity");
    });
  });

  describe("renderShutdown", () => {
    it("outputs the configured daemon name in the shutdown message", () => {
      display.renderShutdown();
      expect(captured).toContain("TestDaemon stopped");
    });
  });
});
