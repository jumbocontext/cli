import { jest } from "@jest/globals";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { goalPostpone, metadata } from "../../../../../../src/presentation/cli/commands/goals/postpone/goal.postpone";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer";

describe("goal postpone command", () => {
  const controller = { handle: jest.fn<() => Promise<{ status: string }>>() };
  const container = { postponeGoalController: controller } as unknown as IApplicationContainer;
  let logSpy: jest.SpiedFunction<typeof console.log>;
  let errorSpy: jest.SpiedFunction<typeof console.error>;
  let exitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    controller.handle.mockReset().mockResolvedValue({ status: GoalStatus.POSTPONED });
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

  it("declares required id, project scope, and automatic-work-stream help copy", () => {
    expect(metadata.requiredOptions).toEqual([
      { flags: "-i, --id <id>", description: "ID of the defined goal to postpone" },
    ]);
    expect(metadata.requiresProject).toBe(true);
    expect(metadata.description).toContain("automatic work streams");
    expect(metadata.examples?.[0].description).toContain("excluding it from automatic work streams");
  });

  it("routes the id and emits status-only human output", async () => {
    Renderer.configure({ format: "text" });

    await goalPostpone({ id: "goal_123" }, container);

    expect(controller.handle).toHaveBeenCalledWith({ goalId: "goal_123" });
    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Goal postponed");
    expect(output).not.toContain("goal_123");
  });

  it("emits only status in JSON mode", async () => {
    Renderer.configure({ format: "json" });

    await goalPostpone({ id: "goal_123" }, container);

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify({ status: GoalStatus.POSTPONED }));
  });

  it("uses the standard error renderer and exits on failure", async () => {
    Renderer.configure({ format: "json" });
    controller.handle.mockRejectedValue(new Error("wrong state"));

    await expect(goalPostpone({ id: "goal_123" }, container)).rejects.toThrow("exit 1");
    expect(errorSpy).toHaveBeenCalledWith(
      JSON.stringify({ error: "Failed to postpone goal", details: "wrong state" })
    );
  });
});
