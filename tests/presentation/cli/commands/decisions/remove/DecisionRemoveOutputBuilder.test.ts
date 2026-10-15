import { describe, it, expect } from "@jest/globals";
import { DecisionRemoveOutputBuilder } from "../../../../../../src/presentation/cli/commands/decisions/remove/DecisionRemoveOutputBuilder.js";
import { DecisionStatus } from "../../../../../../src/domain/decisions/Constants.js";

describe("DecisionRemoveOutputBuilder", () => {
  it("builds one prompt and a lean success payload", () => {
    const response = { decisionId: "dec_123", status: DecisionStatus.REMOVED };
    const output = new DecisionRemoveOutputBuilder().buildSuccess(response);
    expect(output.getSections().map(section => section.type)).toEqual(["prompt", "data"]);
    expect(output.getSections().find(section => section.type === "data")?.content).toEqual(response);
    expect(output.toHumanReadable()).toContain(response.decisionId);
  });

  it.each([new Error("Unknown decision"), "Removal rejected"])("includes failure details for %s", error => {
    const output = new DecisionRemoveOutputBuilder().buildFailureError(error);
    expect(output.getSections().map(section => section.type)).toEqual(["prompt", "data"]);
    expect(output.getSections().find(section => section.type === "data")?.content).toEqual({
      error: expect.any(String), message: error instanceof Error ? error.message : error,
    });
    expect(output.toHumanReadable()).toContain(error instanceof Error ? error.message : error);
  });

  it("does not retain sections between invocations", () => {
    const builder = new DecisionRemoveOutputBuilder();
    const first = builder.buildSuccess({ decisionId: "first", status: DecisionStatus.REMOVED });
    builder.buildFailureError("Rejected");
    const next = builder.buildSuccess({ decisionId: "next", status: DecisionStatus.REMOVED });
    expect(first.getSections()).toHaveLength(2);
    expect(next.getSections()).toHaveLength(2);
    expect(next.toHumanReadable()).not.toContain("first");
  });
});
