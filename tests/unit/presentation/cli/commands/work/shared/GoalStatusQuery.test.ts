import { jest, describe, it, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("node:child_process", () => ({
  execSync: jest.fn(),
}));

const { execSync } = await import("node:child_process");
const { queryGoalStatus } = await import("../../../../../../../src/presentation/cli/commands/work/shared/GoalStatusQuery.js");

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe("GoalStatusQuery", () => {
  beforeEach(() => {
    mockExecSync.mockClear();
  });

  it("returns the status from the parsed response", () => {
    mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({ status: "refined" })));
    expect(queryGoalStatus("goal-123")).toBe("refined");
  });

  it("falls back to goal.status path", () => {
    mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({ goal: { status: "doing" } })));
    expect(queryGoalStatus("goal-123")).toBe("doing");
  });

  it("returns unknown when subprocess fails", () => {
    mockExecSync.mockImplementation(() => { throw new Error("fail"); });
    expect(queryGoalStatus("goal-123")).toBe("unknown");
  });

  it("returns unknown when response has no status field", () => {
    mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({ other: "data" })));
    expect(queryGoalStatus("goal-123")).toBe("unknown");
  });

  it("calls execSync with correct command and options", () => {
    mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({ status: "defined" })));
    queryGoalStatus("abc-123");
    expect(mockExecSync).toHaveBeenCalledWith(
      "npx jumbo goal show --id abc-123",
      { stdio: ["ignore", "pipe", "ignore"], timeout: 30_000 },
    );
  });
});
