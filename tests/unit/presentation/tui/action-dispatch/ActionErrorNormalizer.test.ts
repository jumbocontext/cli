import { describe, expect, it } from "@jest/globals";
import { ActionErrorNormalizer } from "../../../../../src/presentation/tui/action-dispatch/ActionErrorNormalizer.js";

describe("ActionErrorNormalizer", () => {
  it("returns thrown Error values unchanged", () => {
    const expectedError = new Error("Request failed");

    expect(ActionErrorNormalizer.normalize(expectedError)).toBe(expectedError);
  });

  it("normalizes non-Error thrown values to Error", () => {
    const result = ActionErrorNormalizer.normalize("Request failed");

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Request failed");
  });
});
