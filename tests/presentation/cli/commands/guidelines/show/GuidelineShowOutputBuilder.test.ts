import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import chalk from "chalk";
import { stripVTControlCharacters } from "node:util";
import { GuidelineView } from "../../../../../../src/application/context/guidelines/GuidelineView.js";
import { GuidelineShowOutputBuilder } from "../../../../../../src/presentation/cli/commands/guidelines/show/GuidelineShowOutputBuilder.js";

describe.each([0, 3] as const)("GuidelineShowOutputBuilder (color level %s)", (colorLevel) => {
  let outputBuilder: GuidelineShowOutputBuilder;
  let originalColorLevel: typeof chalk.level;

  const guideline: GuidelineView = {
    guidelineId: "guide_123",
    category: "testing",
    title: "Isolate tests",
    description: "Each test must be independent. ".repeat(40) + "Final description detail.",
    rationale: "Prevent cascading failures.\nPreserve process-global state exactly.",
    examples: ["tests/first.test.ts", "tests/second.test.ts", "tests/third.test.ts", "tests/fourth.test.ts", "A multiline example\nwith its complete content"],
    isRemoved: true,
    removedAt: "2026-03-01T12:00:00.000Z",
    removalReason: "Superseded by automated linting",
    version: 7,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-02-01T11:00:00.000Z",
  };

  beforeEach(() => {
    originalColorLevel = chalk.level;
    chalk.level = colorLevel;
    outputBuilder = new GuidelineShowOutputBuilder();
  });

  afterEach(() => {
    chalk.level = originalColorLevel;
  });

  it("renders every guideline field and example without truncation in one prompt section", () => {
    const output = outputBuilder.build(guideline);
    const rendered = output.toHumanReadable();
    const text = stripVTControlCharacters(rendered);

    expect(rendered !== text).toBe(colorLevel > 0);

    expect(output.getSections()).toEqual([{ type: "prompt", content: expect.any(String) }]);
    for (const value of Object.values(guideline).flat()) {
      expect(text).toContain(String(value));
    }
  });

  it("represents each null and empty field explicitly, including false removal state", () => {
    const text = outputBuilder.build({
      ...guideline,
      title: "",
      description: "",
      rationale: "",
      examples: [],
      isRemoved: false,
      removedAt: null,
      removalReason: null,
    }).toHumanReadable();

    expect(text.match(/\(empty\)/g)).toHaveLength(4);
    expect(text.match(/\(null\)/g)).toHaveLength(2);
    expect(text).toContain("false");
  });

  it("represents empty example entries without dropping neighboring examples", () => {
    const text = outputBuilder.build({ ...guideline, examples: ["first", "", "last"] }).toHumanReadable();

    expect(text).toContain("first");
    expect(text).toContain("(empty)");
    expect(text).toContain("last");
  });

  it.each([
    guideline,
    { ...guideline, description: "", rationale: "", examples: [], isRemoved: false, removedAt: null, removalReason: null },
  ])("builds one data section containing the exact complete GuidelineView", (view) => {
    const sections = outputBuilder.buildStructuredOutput(view).getSections();

    expect(sections).toEqual([{ type: "data", content: view, metadata: undefined }]);
    expect(sections[0].content).toBe(view);
    expect(JSON.parse(JSON.stringify(sections[0].content))).toEqual(view);
  });

  it("owns diagnostics containing the unknown ID or failure details", () => {
    for (const output of [
      outputBuilder.buildNotFoundError("guide_missing"),
      outputBuilder.buildFailureError(new Error("reader failed")),
      outputBuilder.buildFailureError("reader failed"),
    ]) {
      expect(output.getSections()).toEqual([{ type: "prompt", content: expect.any(String) }]);
    }
    expect(outputBuilder.buildNotFoundError("guide_missing").toHumanReadable()).toContain("guide_missing");
    expect(outputBuilder.buildFailureError(new Error("reader failed")).toHumanReadable()).toContain("reader failed");
    expect(outputBuilder.buildFailureError("reader failed").toHumanReadable()).toContain("reader failed");
  });

  it("resets sections between rich, structured, and error output without mutating previous results", () => {
    const rich = outputBuilder.build(guideline);
    const structured = outputBuilder.buildStructuredOutput(guideline);
    const notFound = outputBuilder.buildNotFoundError("guide_missing");
    const failure = outputBuilder.buildFailureError("reader failed");

    for (const output of [rich, structured, notFound, failure]) {
      expect(output.getSections()).toHaveLength(1);
    }
    expect(stripVTControlCharacters(rich.toHumanReadable())).toContain(guideline.description);
    expect(structured.getSections()[0].content).toBe(guideline);
    expect(notFound.toHumanReadable()).not.toContain("reader failed");
    expect(failure.toHumanReadable()).not.toContain("guide_missing");
  });
});
