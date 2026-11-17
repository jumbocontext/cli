import { IUpdateComponentGateway } from "./IUpdateComponentGateway.js";
import { UpdateComponentRequest } from "./UpdateComponentRequest.js";
import { UpdateComponentResponse } from "./UpdateComponentResponse.js";
import { UpdateComponentCommandHandler } from "./UpdateComponentCommandHandler.js";
import { IComponentUpdateReader } from "./IComponentUpdateReader.js";

export class LocalUpdateComponentGateway implements IUpdateComponentGateway {
  constructor(
    private readonly commandHandler: UpdateComponentCommandHandler,
    private readonly reader: IComponentUpdateReader,
  ) {}

  async updateComponent(
    request: UpdateComponentRequest,
  ): Promise<UpdateComponentResponse> {
    const result = await this.commandHandler.execute({
      componentId: request.componentId,
      description: request.description,
      responsibility: request.responsibility,
      path: request.path,
      type: request.type,
    });

    const view = await this.reader.findById(result.componentId);

    return { componentId: result.componentId, view };
  }
}
