import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { EndSessionController } from "../../../../../../src/application/context/sessions/end/EndSessionController.js";
import { IEndSessionGateway } from "../../../../../../src/application/context/sessions/end/IEndSessionGateway.js";

describe("EndSessionController", () => {
  let controller: EndSessionController;
  let mockGateway: jest.Mocked<IEndSessionGateway>;

  beforeEach(() => {
    mockGateway = {
      endSession: jest.fn(),
    } as jest.Mocked<IEndSessionGateway>;

    controller = new EndSessionController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      focus: "Completed authentication implementation",
      summary: "Fixed 3 critical bugs",
    };

    const expectedResponse = {
      sessionId: "session_123",
      focus: "Completed authentication implementation",
      summary: "Fixed 3 critical bugs",
    };

    mockGateway.endSession.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.endSession).toHaveBeenCalledWith(request);
  });

  it("should handle request with only required fields", async () => {
    const request = {
      focus: "Bug fixes",
    };

    const expectedResponse = {
      sessionId: "session_456",
      focus: "Bug fixes",
    };

    mockGateway.endSession.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.endSession).toHaveBeenCalledWith(request);
  });
});
