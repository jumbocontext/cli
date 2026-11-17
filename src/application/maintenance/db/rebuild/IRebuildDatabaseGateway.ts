import { RebuildDatabaseRequest } from "./RebuildDatabaseRequest.js";
import { RebuildDatabaseResponse } from "./RebuildDatabaseResponse.js";

export interface IRebuildDatabaseGateway {
  rebuildDatabase(
    request: RebuildDatabaseRequest,
  ): Promise<RebuildDatabaseResponse>;
}
