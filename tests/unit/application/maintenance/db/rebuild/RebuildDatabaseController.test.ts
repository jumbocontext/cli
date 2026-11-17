import { RebuildDatabaseController } from "../../../../../../src/application/maintenance/db/rebuild/RebuildDatabaseController";
import { IRebuildDatabaseGateway } from "../../../../../../src/application/maintenance/db/rebuild/IRebuildDatabaseGateway";
import { jest } from "@jest/globals";

describe("RebuildDatabaseController", () => {
  let gateway: jest.Mocked<IRebuildDatabaseGateway>;
  let controller: RebuildDatabaseController;

  beforeEach(() => {
    gateway = {
      rebuildDatabase: jest.fn(),
    };
    controller = new RebuildDatabaseController(gateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = { skipConfirmation: true };
    const expectedResponse = { eventsReplayed: 42, success: true };
    gateway.rebuildDatabase.mockResolvedValue(expectedResponse);

    const result = await controller.handle(request);

    expect(gateway.rebuildDatabase).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should pass empty request to gateway", async () => {
    const request = {};
    const expectedResponse = { eventsReplayed: 0, success: true };
    gateway.rebuildDatabase.mockResolvedValue(expectedResponse);

    const result = await controller.handle(request);

    expect(gateway.rebuildDatabase).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should propagate gateway errors", async () => {
    gateway.rebuildDatabase.mockRejectedValue(new Error("rebuild failed"));

    await expect(controller.handle({})).rejects.toThrow("rebuild failed");
  });
});
