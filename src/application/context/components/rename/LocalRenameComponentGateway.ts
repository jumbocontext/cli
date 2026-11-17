import { IRenameComponentGateway } from "./IRenameComponentGateway.js";
import { RenameComponentRequest } from "./RenameComponentRequest.js";
import { RenameComponentResponse } from "./RenameComponentResponse.js";
import { RenameComponentCommandHandler } from "./RenameComponentCommandHandler.js";
import { IComponentRenameReader } from "./IComponentRenameReader.js";

export class LocalRenameComponentGateway implements IRenameComponentGateway {
  constructor(
    private readonly commandHandler: RenameComponentCommandHandler,
    private readonly reader: IComponentRenameReader,
  ) {}

  async renameComponent(
    request: RenameComponentRequest,
  ): Promise<RenameComponentResponse> {
    const result = await this.commandHandler.execute({
      componentId: request.componentId,
      name: request.name,
    });

    const view = await this.reader.findById(result.componentId);

    return { componentId: result.componentId, view };
  }
}
