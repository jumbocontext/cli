import { describe, expect, it } from "@jest/globals";
import type { ActionResult } from "../../../../../src/presentation/tui/action-dispatch/ActionResult.js";

describe("ActionResult", () => {
  it("represents successful action responses", () => {
    const result: ActionResult<{ readonly value: string }> = {
      ok: true,
      response: { value: "accepted" },
    };

    expect(result).toEqual({
      ok: true,
      response: { value: "accepted" },
    });
  });

  it("represents failed action responses", () => {
    const error = new Error("Rejected");
    const result: ActionResult<{ readonly value: string }> = {
      ok: false,
      error,
    };

    expect(result).toEqual({
      ok: false,
      error,
    });
  });
});
