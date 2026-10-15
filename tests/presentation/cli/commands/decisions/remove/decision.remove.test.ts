import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import process from "node:process";
import { decisionRemove, metadata } from "../../../../../../src/presentation/cli/commands/decisions/remove/decision.remove.js";
import type { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import type { RemoveDecisionController } from "../../../../../../src/application/context/decisions/remove/RemoveDecisionController.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";
import { DecisionStatus } from "../../../../../../src/domain/decisions/Constants.js";

describe("decision.remove", () => {
  let controller: jest.Mocked<Pick<RemoveDecisionController, "handle">>;
  let container: IApplicationContainer;
  let stdout: jest.SpiedFunction<typeof console.log>;
  let stderr: jest.SpiedFunction<typeof console.error>;
  let ttyDescriptor: PropertyDescriptor | undefined;
  let exit: jest.SpiedFunction<typeof process.exit>;
  let originalFormat: string | undefined;

  beforeEach(() => {
    ttyDescriptor = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
    exit = jest.spyOn(process, "exit").mockImplementation(() => undefined as never);
    controller = { handle: jest.fn() };
    container = {
      removeDecisionController: controller as unknown as RemoveDecisionController,
      logger: { error: jest.fn() },
    } as unknown as IApplicationContainer;
    stdout = jest.spyOn(console, "log").mockImplementation(() => {});
    stderr = jest.spyOn(console, "error").mockImplementation(() => {});
    originalFormat = process.env.JUMBO_FORMAT;
    delete process.env.JUMBO_FORMAT;
    Renderer.reset();
  });

  afterEach(() => {
    if (ttyDescriptor) Object.defineProperty(process.stdout, "isTTY", ttyDescriptor);
    else Reflect.deleteProperty(process.stdout, "isTTY");
    if (originalFormat === undefined) delete process.env.JUMBO_FORMAT;
    else process.env.JUMBO_FORMAT = originalFormat;
    jest.restoreAllMocks();
    Renderer.reset();
  });

  it("exports required id metadata and discoverable examples", () => {
    expect(metadata.requiresProject).toBe(true);
    expect(metadata.requiredOptions?.map(option => option.flags)).toEqual(["-i, --id <id>"]);
    expect(metadata.examples?.length).toBeGreaterThan(0);
  });

  it.each([true, false])("uses the typed controller path with TTY=%s", async isTTY => {
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: isTTY });
    const response = { decisionId: "dec_123", status: DecisionStatus.REMOVED };
    controller.handle.mockResolvedValue(response);
    await decisionRemove({ id: response.decisionId }, container);
    expect(controller.handle).toHaveBeenCalledWith({ decisionId: response.decisionId });
    expect(controller.handle).toHaveBeenCalledTimes(1);
    expect(stdout).toHaveBeenCalledTimes(1);
    if (isTTY) expect(stdout.mock.calls[0][0]).toContain(response.decisionId);
    else expect(JSON.parse(String(stdout.mock.calls[0][0]))).toEqual(response);
    expect(stderr).not.toHaveBeenCalled();
  });

  it.each(["json", "text", "yaml", "ndjson"] as const)("honors explicit %s format", async format => {
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: format !== "text" });
    Renderer.configure({ format });
    controller.handle.mockResolvedValue({ decisionId: "dec_123", status: DecisionStatus.REMOVED });
    await decisionRemove({ id: "dec_123" }, container);
    expect(stdout).toHaveBeenCalledTimes(1);
    const output = String(stdout.mock.calls[0][0]);
    if (format === "json" || format === "ndjson") {
      expect(JSON.parse(output)).toEqual({
        ...(format === "ndjson" ? { type: "data" } : {}),
        decisionId: "dec_123", status: DecisionStatus.REMOVED,
      });
    } else if (format === "yaml") expect(output).toContain("decisionId: dec_123");
    else expect(output).toContain("dec_123");
  });

  it.each(["json", "text"] as const)("renders builder-owned failure and logs diagnostics in %s mode", async format => {
    Renderer.configure({ format });
    const error = new Error("Decision not found: missing");
    controller.handle.mockRejectedValue(error);
    await decisionRemove({ id: "missing" }, container);
    expect(exit).toHaveBeenCalledWith(1);
    expect(container.logger.error).toHaveBeenCalledWith(expect.any(String), error, { decisionId: "missing" });
    if (format === "json") {
      expect(stdout).toHaveBeenCalledTimes(1);
      expect(JSON.parse(String(stdout.mock.calls[0][0]))).toEqual({ error: expect.any(String), message: error.message });
      expect(stderr).not.toHaveBeenCalled();
    } else {
      expect(stdout).not.toHaveBeenCalled();
      expect(stderr).toHaveBeenCalled();
    }
  });
});
