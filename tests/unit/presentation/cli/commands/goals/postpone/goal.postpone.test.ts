import { jest } from "@jest/globals";
import { Command } from "commander";
import { GoalStatus } from "../../../../../../../src/domain/goals/Constants";
import {
  goalPostpone,
  registerGoalPostponeCommand,
} from "../../../../../../../src/presentation/cli/commands/goals/postpone/goal.postpone.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer";
import type { GoalPostponeDependencies } from "../../../../../../../src/presentation/cli/commands/goals/postpone/goal.postpone.js";

describe("goal postpone command", () => {
  const controller = { handle: jest.fn<() => Promise<{ status: string }>>() };
  const container = { postponeGoalController: controller } as unknown as GoalPostponeDependencies;
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
    const goal = new Command("goal");
    registerGoalPostponeCommand(goal);
    const command = goal.commands.find((c) => c.name() === "postpone");
    expect(command).toBeDefined();

    const idOption = command!.options.find((o) => o.flags === "-i, --id <id>");
    expect(idOption).toBeDefined();
    expect(idOption!.description).toBe("ID of the defined goal to postpone");

    expect(command!.description()).toContain("automatic work streams");

    const help = command!.helpInformation();
    expect(help).toContain("automatic work streams");
    expect(help).toContain("-i, --id <id>  ID of the defined goal to postpone");
    expect(help).toContain("excluding it from automatic work streams");
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

    const jsonLine = logSpy.mock.calls
      .map((call) => String(call[0]))
      .find((line) => line.startsWith("{"));
    expect(jsonLine).toBeDefined();
    const parsed = JSON.parse(jsonLine!);
    expect(parsed.info).toContain(`Goal ${GoalStatus.POSTPONED}`);
  });

  it("uses the standard error renderer and exits on failure", async () => {
    Renderer.configure({ format: "json" });
    controller.handle.mockRejectedValue(new Error("wrong state"));

    await expect(goalPostpone({ id: "goal_123" }, container)).rejects.toThrow("exit 1");
    const jsonLine = logSpy.mock.calls
      .map((call) => String(call[0]))
      .find((line) => line.startsWith("{"));
    expect(jsonLine).toBeDefined();
    const parsed = JSON.parse(jsonLine!);
    expect(parsed.info).toContain("Failed to postpone goal");
    expect(parsed.info).toContain("wrong state");
  });
});
