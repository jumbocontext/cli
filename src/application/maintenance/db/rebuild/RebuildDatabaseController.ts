import { RebuildDatabaseRequest } from "./RebuildDatabaseRequest.js";
import { RebuildDatabaseResponse } from "./RebuildDatabaseResponse.js";
import { IRebuildDatabaseGateway } from "./IRebuildDatabaseGateway.js";

export class RebuildDatabaseController {
  constructor(private readonly gateway: IRebuildDatabaseGateway) {}

  async handle(
    request: RebuildDatabaseRequest,
  ): Promise<RebuildDatabaseResponse> {
    return this.gateway.rebuildDatabase(request);
  }
}
