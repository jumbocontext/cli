import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ViewWorkerController } from "../../../../../../../src/application/context/host/workers/view/ViewWorkerController.js";
import { IViewWorkerGateway } from "../../../../../../../src/application/context/host/workers/view/IViewWorkerGateway.js";

describe("ViewWorkerController", () => {
  let controller: ViewWorkerController;
  let mockGateway: jest.Mocked<IViewWorkerGateway>;

  beforeEach(() => {
    mockGateway = {
      viewWorker: jest.fn(),
    } as jest.Mocked<IViewWorkerGateway>;

    controller = new ViewWorkerController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const expectedResponse = {
      workerId: "worker-123",
      claimDurationMinutes: 30,
    };

    mockGateway.viewWorker.mockResolvedValue(expectedResponse);

    const response = await controller.handle({});

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.viewWorker).toHaveBeenCalledWith({});
  });
});
