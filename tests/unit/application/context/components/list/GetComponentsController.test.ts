import { describe, it, expect, jest } from "@jest/globals";
import { GetComponentsController } from "../../../../../../src/application/context/components/list/GetComponentsController.js";
import { IGetComponentsGateway } from "../../../../../../src/application/context/components/list/IGetComponentsGateway.js";
import { GetComponentsRequest } from "../../../../../../src/application/context/components/list/GetComponentsRequest.js";
import { GetComponentsResponse } from "../../../../../../src/application/context/components/list/GetComponentsResponse.js";

describe("GetComponentsController", () => {
  it("should delegate to gateway with the request", async () => {
    const expectedResponse: GetComponentsResponse = {
      components: [
        {
          componentId: "comp_1",
          name: "TestComponent",
          type: "service",
          description: "A test component",
          responsibility: "Testing",
          path: "src/test",
          status: "active",
          deprecationReason: null,
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ],
    };

    const mockGateway: jest.Mocked<IGetComponentsGateway> = {
      getComponents: jest.fn<IGetComponentsGateway["getComponents"]>().mockResolvedValue(expectedResponse),
    };

    const controller = new GetComponentsController(mockGateway);
    const request: GetComponentsRequest = { status: "active" };

    const result = await controller.handle(request);

    expect(mockGateway.getComponents).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should pass through all status filter values", async () => {
    const mockGateway: jest.Mocked<IGetComponentsGateway> = {
      getComponents: jest.fn<IGetComponentsGateway["getComponents"]>().mockResolvedValue({ components: [] }),
    };

    const controller = new GetComponentsController(mockGateway);

    await controller.handle({ status: "all" });
    await controller.handle({ status: "deprecated" });
    await controller.handle({ status: "removed" });

    expect(mockGateway.getComponents).toHaveBeenCalledTimes(3);
    expect(mockGateway.getComponents).toHaveBeenCalledWith({ status: "all" });
    expect(mockGateway.getComponents).toHaveBeenCalledWith({ status: "deprecated" });
    expect(mockGateway.getComponents).toHaveBeenCalledWith({ status: "removed" });
  });
});
