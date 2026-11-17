import { jest } from "@jest/globals";
import { Command } from "commander";
import { GoalStatus } from "../../../../../../../src/domain/goals/Constants";
import {
  goalReinstate,
  registerGoalReinstateCommand,
} from "../../../../../../../src/presentation/cli/commands/goals/reinstate/goal.reinstate.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer";
import type { GoalReinstateDependencies } from "../../../../../../../src/presentation/cli/commands/goals/reinstate/goal.reinstate.js";

describe("goal reinstate command", () => {
  const controller = { handle: jest.fn<() => Promise<{ status: string }>>() };
  const container = { reinstateGoalController: controller } as unknown as GoalReinstateDependencies;
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
    const goal = new Command("goal");
    registerGoalReinstateCommand(goal);
    const command = goal.commands.find((c) => c.name() === "reinstate");
    expect(command).toBeDefined();

    const idOption = command!.options.find((o) => o.flags === "-i, --id <id>");
    expect(idOption).toBeDefined();
    expect(idOption!.description).toBe("ID of the postponed goal to reinstate");

    expect(command!.description()).toContain("postponed goal as defined");
    expect(command!.description()).toContain("eligible for refinement");

    const help = command!.helpInformation();
    expect(help).toContain("postponed goal as defined");
    expect(help).toContain("-i, --id <id>  ID of the postponed goal to reinstate");
    expect(help).toContain("Return a postponed goal to defined status");
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

    const jsonLine = logSpy.mock.calls
      .map((call) => String(call[0]))
      .find((line) => line.startsWith("{"));
    expect(jsonLine).toBeDefined();
    const parsed = JSON.parse(jsonLine!);
    expect(parsed.info).toContain(`Goal ${GoalStatus.TODO}`);
  });

  it("uses the standard error renderer and exits on failure", async () => {
    Renderer.configure({ format: "json" });
    controller.handle.mockRejectedValue(new Error("wrong state"));

    await expect(goalReinstate({ id: "goal_123" }, container)).rejects.toThrow("exit 1");
    const jsonLine = logSpy.mock.calls
      .map((call) => String(call[0]))
      .find((line) => line.startsWith("{"));
    expect(jsonLine).toBeDefined();
    const parsed = JSON.parse(jsonLine!);
    expect(parsed.info).toContain("Failed to reinstate goal");
    expect(parsed.info).toContain("wrong state");
  });
});
