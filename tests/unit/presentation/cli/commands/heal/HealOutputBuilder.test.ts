import { describe, expect, it } from "@jest/globals";
import { HealOutputBuilder } from "../../../../../../src/presentation/cli/commands/heal/HealOutputBuilder.js";

describe("HealOutputBuilder", () => {
  it("renders success output with replayed event count", () => {
    const builder = new HealOutputBuilder();

    const output = builder.buildSuccess({
      success: true,
      eventsReplayed: 42,
    });

    const text = output.toHumanReadable();
    expect(text).toContain("Projection Rebuild");
    expect(text).toContain("Rebuild complete");
    expect(text).toContain("success");
    expect(text).toContain("Events replayed");
    expect(text).toContain("42");
  });

  it("renders confirmation-required output", () => {
    const builder = new HealOutputBuilder();

    const output = builder.buildConfirmationRequired();

    expect(output.toHumanReadable()).toContain("Use --yes flag to proceed");
  });

  it("renders failure output with error message", () => {
    const builder = new HealOutputBuilder();

    const output = builder.buildFailureError(new Error("projection store unavailable"));

    const text = output.toHumanReadable();
    expect(text).toContain("Projection rebuild failed");
    expect(text).toContain("projection store unavailable");
  });

  it("returns structured output for non-text renderers", () => {
    const builder = new HealOutputBuilder();

    expect(
      builder.buildStructuredOutput({
        success: true,
        eventsReplayed: 9,
      })
    ).toEqual({
      success: true,
      eventsReplayed: 9,
    });
  });
});
