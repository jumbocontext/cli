import { jest, describe, it, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("../../../../../../../src/presentation/cli/animations/GlimmerEffect.js", () => ({
  playGlimmer: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule("../../../../../../../src/presentation/cli/animations/BrailleSpinner.js", () => ({
  startBrailleSpinner: jest.fn().mockReturnValue({ stop: jest.fn() }),
}));

const { ReviewerDisplay } = await import("../../../../../../../src/presentation/cli/commands/work/review/ReviewerDisplay.js");
const { playGlimmer } = await import("../../../../../../../src/presentation/cli/animations/GlimmerEffect.js");
const { startBrailleSpinner } = await import("../../../../../../../src/presentation/cli/animations/BrailleSpinner.js");

const mockPlayGlimmer = playGlimmer as jest.MockedFunction<typeof playGlimmer>;
const mockStartBrailleSpinner = startBrailleSpinner as jest.MockedFunction<typeof startBrailleSpinner>;

describe("ReviewerDisplay", () => {
  let captured: string;
  let display: InstanceType<typeof ReviewerDisplay>;

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

    display = new ReviewerDisplay(runtimeConfig);
    (display as unknown as { write: (s: string) => void }).write = (s: string) => { captured += s; };
  });

  describe("renderHeader", () => {
    it("calls playGlimmer with the Jumbo Reviewer title", async () => {
      await display.renderHeader();
      expect(mockPlayGlimmer).toHaveBeenCalledWith(
        "Jumbo Reviewer",
        expect.any(String),
        expect.objectContaining({ baseColor: expect.any(String) }),
        expect.any(Function),
      );
    });
  });

  describe("startWaiting", () => {
    it("starts a braille spinner with the awaiting submissions label", () => {
      display.startWaiting();
      expect(mockStartBrailleSpinner).toHaveBeenCalledWith(
        expect.objectContaining({ label: "awaiting submissions" }),
      );
    });
  });

  describe("startProcessing", () => {
    it("starts a braille spinner with the reviewing label", () => {
      display.startProcessing();
      expect(mockStartBrailleSpinner).toHaveBeenCalledWith(
        expect.objectContaining({ label: "reviewing" }),
      );
    });
  });

  describe("renderReviewOutcome", () => {
    it("renders approved outcome with success styling", () => {
      display.renderReviewOutcome(
        "abcdef12-3456-7890-abcd-ef1234567890",
        "Test objective",
        1,
        "approved",
      );
      expect(captured).toContain("approved");
      expect(captured).toContain("abcdef12");
      expect(captured).toContain("1 attempt");
      expect(captured).not.toContain("1 attempts");
    });

    it("renders rejected outcome with warning styling", () => {
      display.renderReviewOutcome(
        "abcdef12-3456-7890-abcd-ef1234567890",
        "Test objective",
        2,
        "rejected",
      );
      expect(captured).toContain("rejected");
      expect(captured).toContain("abcdef12");
      expect(captured).toContain("2 attempts");
    });

    it("truncates long objectives", () => {
      const longObjective = "A".repeat(100);
      display.renderReviewOutcome(
        "abcdef12-3456-7890-abcd-ef1234567890",
        longObjective,
        1,
        "approved",
      );
      expect(captured).toContain("...");
    });

    it("treats unknown outcome as rejected styling", () => {
      display.renderReviewOutcome(
        "abcdef12-3456-7890-abcd-ef1234567890",
        "Test objective",
        1,
        "unknown",
      );
      // Non-approved outcomes fall through to the warning/rejected branch
      expect(captured).not.toContain("approved");
    });
  });

  describe("renderGoalSkipped", () => {
    it("outputs the reviewed status in the skip message", () => {
      display.renderGoalSkipped("abcdef12-3456-7890-abcd-ef1234567890", "submitted", 3);
      expect(captured).toContain("did not reach 'reviewed'");
      expect(captured).toContain("3 attempts");
      expect(captured).toContain("status: submitted");
    });
  });

  describe("renderShutdown", () => {
    it("outputs the Reviewer name in the shutdown message", () => {
      display.renderShutdown();
      expect(captured).toContain("Reviewer stopped");
    });
  });
});
