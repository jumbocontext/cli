import { describe, expect, it } from "@jest/globals";
import { Command } from "commander";
import {
  categorizeCommand,
  formatCategorizedCommands,
} from "../../../../../src/presentation/cli/help/CategoryFormatter.js";
import { COMMAND_CATEGORIES } from "../../../../../src/presentation/cli/help/CommandCategories.js";

describe("formatCategorizedCommands", () => {
  it("sorts registered commands, omits hidden commands, and includes uncategorized commands", () => {
    const program = new Command();
    const fixtureZ = program.command("fixture-z").description("Fixture Z");
    const fixtureA = program.command("fixture-a").description("Fixture A");
    program.command("fixture-hidden", { hidden: true }).description("Hidden fixture");
    program.command("uncategorized").description("Uncategorized fixture");

    categorizeCommand(fixtureZ, COMMAND_CATEGORIES[2]);
    categorizeCommand(fixtureA, COMMAND_CATEGORIES[2]);

    const output = formatCategorizedCommands(program);

    expect(output.indexOf("fixture-a")).toBeLessThan(output.indexOf("fixture-z"));
    expect(output).not.toContain("fixture-hidden");
    expect(output).toContain("uncategorized");
  });
});
