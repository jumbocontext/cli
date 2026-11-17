import { RenameComponentRequest } from "./RenameComponentRequest.js";
import { RenameComponentResponse } from "./RenameComponentResponse.js";

export interface IRenameComponentGateway {
  renameComponent(
    request: RenameComponentRequest,
  ): Promise<RenameComponentResponse>;
}
