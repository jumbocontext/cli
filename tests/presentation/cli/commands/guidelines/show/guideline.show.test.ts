import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import chalk from "chalk";
import { stripVTControlCharacters } from "node:util";
import { GuidelineView } from "../../../../../../src/application/context/guidelines/GuidelineView.js";
import { ShowGuidelineController } from "../../../../../../src/application/context/guidelines/show/ShowGuidelineController.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { guidelineShow, metadata } from "../../../../../../src/presentation/cli/commands/guidelines/show/guideline.show.js";
import { GuidelineShowOutputBuilder } from "../../../../../../src/presentation/cli/commands/guidelines/show/GuidelineShowOutputBuilder.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe.each([0, 3] as const)("guideline.show command (color level %s)", (colorLevel) => {
  let originalColorLevel: typeof chalk.level;
  let handle: jest.MockedFunction<ShowGuidelineController["handle"]>;
  let container: Partial<IApplicationContainer>;
  let stdout: jest.SpiedFunction<typeof console.log>;
  let stderr: jest.SpiedFunction<typeof console.error>;
  let isTtyDescriptor: PropertyDescriptor | undefined;
  let originalExitCode: typeof process.exitCode;
  let originalFormat: string | undefined;

  const guideline: GuidelineView = {
    guidelineId: "guide_123",
    category: "testing",
    title: "Isolate tests",
    description: "Each test must be independent.\nRestore process-global state.",
    rationale: "Prevents cascading failures.",
    examples: ["tests/first.test.ts", "tests/second.test.ts", "tests/third.test.ts", "tests/fourth.test.ts"],
    isRemoved: false,
    removedAt: null,
    removalReason: null,
    version: 2,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-02-01T11:00:00.000Z",
  };

  beforeEach(() => {
    originalColorLevel = chalk.level;
    chalk.level = colorLevel;
    isTtyDescriptor = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
    originalExitCode = process.exitCode;
    originalFormat = process.env.JUMBO_FORMAT;
    delete process.env.JUMBO_FORMAT;
    Renderer.reset();
    handle = jest.fn();
    container = {
      showGuidelineController: { handle } as unknown as ShowGuidelineController,
    };
    stdout = jest.spyOn(console, "log").mockImplementation(() => undefined);
    stderr = jest.spyOn(console, "error").mockImplementation(() => undefined);
    process.exitCode = undefined;
  });

  afterEach(() => {
    chalk.level = originalColorLevel;
    Renderer.reset();
    process.exitCode = originalExitCode;
    if (originalFormat === undefined) {
      delete process.env.JUMBO_FORMAT;
    } else {
      process.env.JUMBO_FORMAT = originalFormat;
    }
    if (isTtyDescriptor) {
      Object.defineProperty(process.stdout, "isTTY", isTtyDescriptor);
    } else {
      Reflect.deleteProperty(process.stdout, "isTTY");
    }
    jest.restoreAllMocks();
  });

  it("declares required ID metadata, examples, related commands, and project scope", () => {
    expect(metadata.requiredOptions).toEqual([
      expect.objectContaining({ flags: "-i, --id <guidelineId>" }),
    ]);
    expect(metadata.examples).toEqual(expect.arrayContaining([
      expect.objectContaining({ command: "jumbo guideline show --id guide_abc123" }),
      expect.objectContaining({ command: "jumbo guideline show --id guide_abc123 --format json" }),
      expect.objectContaining({ command: "jumbo guideline show --id guide_abc123 --format text" }),
    ]));
    expect(metadata.related).toEqual(expect.arrayContaining(["guidelines list", "guidelines search", "guideline update"]));
    expect(metadata.requiresProject).toBe(true);
  });

  it.each([
    { isTTY: false, format: undefined, expectedFormat: "json" },
    { isTTY: true, format: undefined, expectedFormat: "text" },
    { isTTY: false, format: "text" as const, expectedFormat: "text" },
    { isTTY: true, format: "json" as const, expectedFormat: "json" },
  ])("delegates and renders $expectedFormat for TTY=$isTTY with format=$format", async ({ isTTY, format, expectedFormat }) => {
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: isTTY });
    if (format) Renderer.configure({ format });
    handle.mockResolvedValue({ guideline });
    const build = jest.spyOn(GuidelineShowOutputBuilder.prototype, "build");
    const buildStructured = jest.spyOn(GuidelineShowOutputBuilder.prototype, "buildStructuredOutput");
    const banner = jest.spyOn(Renderer.getInstance(), "banner");
    const info = jest.spyOn(Renderer.getInstance(), "info");

    await guidelineShow({ id: guideline.guidelineId }, container as IApplicationContainer);

    expect(handle).toHaveBeenCalledTimes(1);
    expect(handle).toHaveBeenCalledWith({ guidelineId: guideline.guidelineId });
    expect(stdout).toHaveBeenCalledTimes(1);
    if (expectedFormat === "json") {
      expect(JSON.parse(String(stdout.mock.calls[0][0]))).toEqual(guideline);
      expect(buildStructured).toHaveBeenCalledWith(guideline);
      expect(build).not.toHaveBeenCalled();
      expect(banner).not.toHaveBeenCalled();
    } else {
      const text = stripVTControlCharacters(String(stdout.mock.calls[0][0]));
      for (const value of Object.values(guideline).flat().filter((value) => value !== null)) {
        expect(text).toContain(String(value));
      }
      expect(build).toHaveBeenCalledWith(guideline);
      expect(buildStructured).not.toHaveBeenCalled();
      expect(banner).toHaveBeenCalledWith([build.mock.results[0].value.toHumanReadable()]);
    }
    // The info renderer adds legacy colors; rich output must retain only builder styling.
    expect(info).not.toHaveBeenCalled();
    expect(stderr).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });

  describe.each(["json", "text"] as const)("%s failure output", (format) => {
    it("reports unknown IDs through the builder only on stderr with non-zero exit code", async () => {
      Renderer.configure({ format });
      handle.mockRejectedValue(new Error("Guideline not found: guide_missing"));
      const notFound = jest.spyOn(GuidelineShowOutputBuilder.prototype, "buildNotFoundError");
      const failure = jest.spyOn(GuidelineShowOutputBuilder.prototype, "buildFailureError");

      await guidelineShow({ id: "guide_missing" }, container as IApplicationContainer);

      expect(stdout).not.toHaveBeenCalled();
      expect(stderr).toHaveBeenCalledTimes(1);
      expect(notFound).toHaveBeenCalledWith("guide_missing");
      expect(failure).not.toHaveBeenCalled();
      const diagnostic = format === "json"
        ? JSON.parse(String(stderr.mock.calls[0][0])).error
        : String(stderr.mock.calls[0][0]);
      expect(stripVTControlCharacters(diagnostic)).toContain(
        stripVTControlCharacters(notFound.mock.results[0].value.toHumanReadable())
      );
      expect(process.exitCode).toBe(1);
    });

    it.each([new Error("reader failed"), "reader failed"])("routes unexpected failure %s through builder-owned diagnostics", async (error) => {
      Renderer.configure({ format });
      handle.mockRejectedValue(error);
      const failure = jest.spyOn(GuidelineShowOutputBuilder.prototype, "buildFailureError");
      const notFound = jest.spyOn(GuidelineShowOutputBuilder.prototype, "buildNotFoundError");

      await guidelineShow({ id: guideline.guidelineId }, container as IApplicationContainer);

      expect(stdout).not.toHaveBeenCalled();
      expect(stderr).toHaveBeenCalledTimes(1);
      expect(failure).toHaveBeenCalledWith(error);
      expect(notFound).not.toHaveBeenCalled();
      const diagnostic = format === "json"
        ? JSON.parse(String(stderr.mock.calls[0][0])).error
        : String(stderr.mock.calls[0][0]);
      expect(stripVTControlCharacters(diagnostic)).toContain(
        stripVTControlCharacters(failure.mock.results[0].value.toHumanReadable())
      );
      expect(process.exitCode).toBe(1);
    });
  });
});
