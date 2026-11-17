import { LocalRebuildDatabaseGateway } from "../../../../../../src/application/maintenance/db/rebuild/LocalRebuildDatabaseGateway";
import { IDatabaseRebuildService } from "../../../../../../src/application/maintenance/db/rebuild/IDatabaseRebuildService";
import { jest } from "@jest/globals";

describe("LocalRebuildDatabaseGateway", () => {
  let databaseRebuildService: jest.Mocked<IDatabaseRebuildService>;
  let gateway: LocalRebuildDatabaseGateway;

  beforeEach(() => {
    databaseRebuildService = {
      rebuild: jest.fn(),
    };
    gateway = new LocalRebuildDatabaseGateway(databaseRebuildService);
  });

  it("should delegate to database rebuild service and return response", async () => {
    databaseRebuildService.rebuild.mockResolvedValue({
      eventsReplayed: 100,
      success: true,
    });

    const result = await gateway.rebuildDatabase({ skipConfirmation: true });

    expect(databaseRebuildService.rebuild).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      eventsReplayed: 100,
      success: true,
    });
  });

  it("should handle zero events", async () => {
    databaseRebuildService.rebuild.mockResolvedValue({
      eventsReplayed: 0,
      success: true,
    });

    const result = await gateway.rebuildDatabase({});

    expect(result).toEqual({
      eventsReplayed: 0,
      success: true,
    });
  });

  it("should propagate service errors", async () => {
    databaseRebuildService.rebuild.mockRejectedValue(new Error("db error"));

    await expect(gateway.rebuildDatabase({})).rejects.toThrow("db error");
  });
});
