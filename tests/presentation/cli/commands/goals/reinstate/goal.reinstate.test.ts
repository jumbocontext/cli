import { jest } from "@jest/globals";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { goalReinstate, metadata } from "../../../../../../src/presentation/cli/commands/goals/reinstate/goal.reinstate";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer";

describe("goal reinstate command", () => {
  const controller = { handle: jest.fn<() => Promise<{ status: string }>>() };
  const container = { reinstateGoalController: controller } as unknown as IApplicationContainer;
  let logSpy: jest.SpiedFunction<typeof console.log>;
  let errorSpy: jest.SpiedFunction<typeof console.error>;
  let exitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    controller.handle.mockReset().mockResolvedValue({ status: GoalStatus.TODO });
    logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    exitSpy = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`exit ${code}`);
    });
  });

  afterEach(() => {
    Renderer.reset();
    logSpy.mockRestore();
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("declares required id, project scope, and transition help copy", () => {
    expect(metadata.requiredOptions).toEqual([
      { flags: "-i, --id <id>", description: "ID of the postponed goal to reinstate" },
    ]);
    expect(metadata.requiresProject).toBe(true);
    expect(metadata.description).toContain("postponed goal as defined");
    expect(metadata.description).toContain("eligible for refinement");
  });

  it("routes the id and emits status-only human output", async () => {
    Renderer.configure({ format: "text" });

    await goalReinstate({ id: "goal_123" }, container);

    expect(controller.handle).toHaveBeenCalledWith({ goalId: "goal_123" });
    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Goal defined");
    expect(output).not.toContain("goal_123");
  });

  it("emits only status in JSON mode", async () => {
    Renderer.configure({ format: "json" });

    await goalReinstate({ id: "goal_123" }, container);

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify({ status: GoalStatus.TODO }));
  });

  it("uses the standard error renderer and exits on failure", async () => {
    Renderer.configure({ format: "json" });
    controller.handle.mockRejectedValue(new Error("wrong state"));

    await expect(goalReinstate({ id: "goal_123" }, container)).rejects.toThrow("exit 1");
    expect(errorSpy).toHaveBeenCalledWith(
      JSON.stringify({ error: "Failed to reinstate goal", details: "wrong state" })
    );
  });
});
