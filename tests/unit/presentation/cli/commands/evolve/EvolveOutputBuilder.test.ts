import { EvolveOutputBuilder } from "../../../../../../src/presentation/cli/commands/evolve/EvolveOutputBuilder.js";
import { EvolveStepResult } from "../../../../../../src/application/evolve/EvolveStepResult.js";

describe("EvolveOutputBuilder", () => {
  let builder: EvolveOutputBuilder;

  beforeEach(() => {
    builder = new EvolveOutputBuilder();
  });

  it("renders a success prompt when all steps succeed", () => {
    const output = builder.buildSuccess([
      { name: "Schema migrations", status: "repaired", detail: "Applied pending schema migrations." },
    ]);

    expect(output.toHumanReadable()).toContain("Complete");
  });

  it("renders an error prompt when any step fails", () => {
    const output = builder.buildSuccess([
      { name: "Schema migrations", status: "failed", detail: "DDL failed" },
    ]);

    expect(output.toHumanReadable()).toContain("Completed with errors");
  });

  it("includes step data in the output", () => {
    const steps: EvolveStepResult[] = [
      { name: "Schema migrations", status: "repaired" },
      { name: "Database projections", status: "skipped", detail: "Skipped because one or more database migration steps failed." },
    ];

    const output = builder.buildSuccess(steps);
    const sections = output.getSections();

    expect(sections.length).toBe(2);
    expect(sections[0].type).toBe("prompt");
    expect(sections[1].type).toBe("data");
  });

  it("renders the confirmation requirement", () => {
    const output = builder.buildConfirmationRequired();

    expect(output.toHumanReadable()).toContain("--yes");
  });
});
