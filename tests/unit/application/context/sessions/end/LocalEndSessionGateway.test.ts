import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalEndSessionGateway } from "../../../../../../src/application/context/sessions/end/LocalEndSessionGateway.js";
import { EndSessionCommandHandler } from "../../../../../../src/application/context/sessions/end/EndSessionCommandHandler.js";

describe("LocalEndSessionGateway", () => {
  let gateway: LocalEndSessionGateway;
  let mockCommandHandler: jest.Mocked<EndSessionCommandHandler>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<EndSessionCommandHandler>;

    gateway = new LocalEndSessionGateway(mockCommandHandler);
  });

  it("should execute command and return session id with focus and summary", async () => {
    const sessionId = "session_123";

    mockCommandHandler.execute.mockResolvedValue({ sessionId });

    const response = await gateway.endSession({
      focus: "Completed authentication",
      summary: "Fixed 3 critical bugs",
    });

    expect(response.sessionId).toBe(sessionId);
    expect(response.focus).toBe("Completed authentication");
    expect(response.summary).toBe("Fixed 3 critical bugs");
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      focus: "Completed authentication",
      summary: "Fixed 3 critical bugs",
    });
  });

  it("should handle request with only required fields", async () => {
    const sessionId = "session_456";

    mockCommandHandler.execute.mockResolvedValue({ sessionId });

    const response = await gateway.endSession({
      focus: "Bug fixes",
    });

    expect(response.sessionId).toBe(sessionId);
    expect(response.focus).toBe("Bug fixes");
    expect(response.summary).toBeUndefined();
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      focus: "Bug fixes",
      summary: undefined,
    });
  });
});
