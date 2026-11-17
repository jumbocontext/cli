import { IRemoveComponentGateway } from "./IRemoveComponentGateway.js";
import { RemoveComponentRequest } from "./RemoveComponentRequest.js";
import { RemoveComponentResponse } from "./RemoveComponentResponse.js";
import { RemoveComponentCommandHandler } from "./RemoveComponentCommandHandler.js";
import { IComponentRemoveReader } from "./IComponentRemoveReader.js";

export class LocalRemoveComponentGateway implements IRemoveComponentGateway {
  constructor(
    private readonly commandHandler: RemoveComponentCommandHandler,
    private readonly reader: IComponentRemoveReader,
  ) {}

  async removeComponent(
    request: RemoveComponentRequest,
  ): Promise<RemoveComponentResponse> {
    const result = await this.commandHandler.execute({
      componentId: request.componentId,
    });

    const view = await this.reader.findById(request.componentId);

    return {
      componentId: result.componentId,
      name: result.name,
      status: view?.status || "removed",
    };
  }
}
