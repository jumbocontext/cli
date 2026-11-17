import { describe, expect, it } from "@jest/globals";
import {
  COMMAND_CATEGORIES,
  COMMAND_CATEGORY_LABELS,
} from "../../../../../src/presentation/cli/help/CommandCategories.js";

describe("CommandCategories", () => {
  it("defines every category in root-help display order", () => {
    expect(COMMAND_CATEGORIES).toEqual([
      "host",
      "project-knowledge",
      "work",
      "solution",
      "relations",
    ]);
  });

  it("provides a display label for every category", () => {
    for (const category of COMMAND_CATEGORIES) {
      expect(COMMAND_CATEGORY_LABELS[category]).toBeTruthy();
    }
  });
});
