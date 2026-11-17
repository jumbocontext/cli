import { describe, expect, it } from "@jest/globals";
import { categorizeCommand } from "../../../../../src/presentation/cli/help/CategoryFormatter.js";
import { COMMAND_CATEGORIES } from "../../../../../src/presentation/cli/help/CommandCategories.js";
import { createCommanderProgram } from "../../../../../src/presentation/cli/program/createCommanderProgram.js";

describe("createCommanderProgram", () => {
  it.each(["--version", "-V", "-v"])("preserves version output and Commander utility exit for %s", async flag => {
    let output = "";
    const program = createCommanderProgram("1.2.3").exitOverride().configureOutput({ writeOut: text => { output += text; } });
    await expect(program.parseAsync([flag], { from: "user" })).rejects.toMatchObject({ code: "commander.version", exitCode: 0 });
    expect(output).toBe("1.2.3\n");
  });

  it("supports the version subcommand without application commands", async () => {
    let output = "";
    const program = createCommanderProgram("1.2.3").configureOutput({ writeOut: text => { output += text; } });
    await program.parseAsync(["version"], { from: "user" });
    expect(output).toBe("1.2.3\n");
  });

  it("builds categorized discovery from direct Commander registrations", () => {
    const program = createCommanderProgram("1.2.3");
    const fixture = program.command("fixture").description("Fixture");

    categorizeCommand(fixture, COMMAND_CATEGORIES[2]);

    expect(program.name()).toBe("jumbo");
    expect(program.helpInformation()).toContain("WORK");
    expect(program.helpInformation()).toContain("fixture");
    expect(program.helpInformation()).toContain("--version");
  });
});
