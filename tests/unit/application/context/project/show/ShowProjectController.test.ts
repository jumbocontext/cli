import { describe, expect, it, jest } from "@jest/globals";
import { IShowProjectGateway } from "../../../../../../src/application/context/project/show/IShowProjectGateway.js";
import { ShowProjectController } from "../../../../../../src/application/context/project/show/ShowProjectController.js";
import { ShowProjectResponse } from "../../../../../../src/application/context/project/show/ShowProjectResponse.js";

describe("ShowProjectController", () => {
  it("should delegate to gateway", async () => {
    const response: ShowProjectResponse = {
      project: null,
      northStar: null,
    };
    const gateway: jest.Mocked<IShowProjectGateway> = {
      showProject: jest.fn().mockResolvedValue(response),
    };
    const controller = new ShowProjectController(gateway);

    const result = await controller.handle({ northstar: true });

    expect(result).toBe(response);
    expect(gateway.showProject).toHaveBeenCalledWith({ northstar: true });
  });
});
