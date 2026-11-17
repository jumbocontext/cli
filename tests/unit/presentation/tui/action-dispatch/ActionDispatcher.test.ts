import { describe, expect, it } from "@jest/globals";
import { ActionDispatcher } from "../../../../../src/presentation/tui/action-dispatch/ActionDispatcher.js";

describe("ActionDispatcher", () => {
  it("returns controller responses", async () => {
    const controller = {
      handle: async (request: { value: string }) => ({
        echoed: request.value,
      }),
    };

    await expect(
      ActionDispatcher.dispatch(controller, { value: "request" }),
    ).resolves.toEqual({
      ok: true,
      response: { echoed: "request" },
    });
  });

  it("returns thrown Error values without throwing", async () => {
    const expectedError = new Error("Request failed");
    const controller = {
      handle: async () => {
        throw expectedError;
      },
    };

    const result = await ActionDispatcher.dispatch(controller, {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(expectedError);
    }
  });

  it("normalizes thrown non-Error values", async () => {
    const controller = {
      handle: async () => {
        throw "Request failed";
      },
    };

    const result = await ActionDispatcher.dispatch(controller, {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe("Request failed");
    }
  });
});
