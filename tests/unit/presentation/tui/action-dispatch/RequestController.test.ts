import { describe, expect, it } from "@jest/globals";
import type { RequestController } from "../../../../../src/presentation/tui/action-dispatch/RequestController.js";

describe("RequestController", () => {
  it("defines the async request handling contract", async () => {
    const controller: RequestController<
      { readonly value: string },
      { readonly echoed: string }
    > = {
      handle: async (request) => ({ echoed: request.value }),
    };

    await expect(controller.handle({ value: "request" })).resolves.toEqual({
      echoed: "request",
    });
  });
});
