import { IRebuildDatabaseGateway } from "./IRebuildDatabaseGateway.js";
import { RebuildDatabaseRequest } from "./RebuildDatabaseRequest.js";
import { RebuildDatabaseResponse } from "./RebuildDatabaseResponse.js";
import { IDatabaseRebuildService } from "./IDatabaseRebuildService.js";

export class LocalRebuildDatabaseGateway implements IRebuildDatabaseGateway {
  constructor(
    private readonly databaseRebuildService: IDatabaseRebuildService,
  ) {}

  async rebuildDatabase(
    request: RebuildDatabaseRequest,
  ): Promise<RebuildDatabaseResponse> {
    const result = await this.databaseRebuildService.rebuild();
    return {
      eventsReplayed: result.eventsReplayed,
      success: result.success,
    };
  }
}
