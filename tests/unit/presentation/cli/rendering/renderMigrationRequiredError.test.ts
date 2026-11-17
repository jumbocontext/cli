import { afterEach, describe, expect, it, jest } from "@jest/globals";
import chalk from "chalk";
import { parse as parseYaml } from "yaml";
import { MigrationRequiredError } from "../../../../../src/application/host/MigrationRequiredError.js";
import { BaseColors } from "../../../../../src/presentation/shared/DesignTokens.js";
import { Renderer } from "../../../../../src/presentation/cli/rendering/Renderer.js";
import { Layout, stripAnsi } from "../../../../../src/presentation/cli/rendering/StyleConfig.js";
import { renderMigrationRequiredError } from "../../../../../src/presentation/cli/rendering/renderMigrationRequiredError.js";

const originalColorLevel = chalk.level;

afterEach(() => {
  chalk.level = originalColorLevel;
  jest.restoreAllMocks();
  Renderer.reset();
});

describe("renderMigrationRequiredError", () => {
  it.each(["normal", "verbose", "quiet"] as const)("omits the header and colors the entire message brandYellow in %s text output", verbosity => {
    chalk.level = 3;
    Renderer.configure({ format: "text", verbosity });
    const output = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = new MigrationRequiredError("/project.with.dots");

    renderMigrationRequiredError(error);

    expect(output).toHaveBeenCalledTimes(1);
    const message = output.mock.calls[0][0] as string;
    expect(stripAnsi(message)).toBe(`${Layout.indent}${error.message}`);
    expect(message).toBe(chalk.hex(BaseColors.brandYellow)(`${Layout.indent}${error.message}`));
    expect(message).not.toContain("Command failed");
    expect(message).not.toContain("Stack trace");
  });

  it.each(["json", "yaml", "ndjson"] as const)("preserves %s error formatting without ANSI colors", format => {
    chalk.level = 3;
    Renderer.configure({ format });
    const output = jest.spyOn(console, "error").mockImplementation(() => {});
    const renderError = jest.spyOn(Renderer.prototype, "error");
    const error = new MigrationRequiredError("/project");

    renderMigrationRequiredError(error);

    expect(renderError).toHaveBeenCalledWith("Command failed", error.message);
    expect(output).toHaveBeenCalledTimes(1);
    const message = output.mock.calls[0][0] as string;
    expect(message).toBe(stripAnsi(message));
    expect(message).not.toContain("stack");
    const parsed = format === "yaml" ? parseYaml(message) : JSON.parse(message);
    expect(parsed).toMatchObject({ error: "Command failed", details: error.message });
  });
});
