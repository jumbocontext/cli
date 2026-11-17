import { IUndeprecateComponentGateway } from "./IUndeprecateComponentGateway.js";
import { UndeprecateComponentRequest } from "./UndeprecateComponentRequest.js";
import { UndeprecateComponentResponse } from "./UndeprecateComponentResponse.js";
import { UndeprecateComponentCommandHandler } from "./UndeprecateComponentCommandHandler.js";
import { IComponentUndeprecateReader } from "./IComponentUndeprecateReader.js";

export class LocalUndeprecateComponentGateway implements IUndeprecateComponentGateway {
  constructor(
    private readonly commandHandler: UndeprecateComponentCommandHandler,
    private readonly reader: IComponentUndeprecateReader,
  ) {}

  async undeprecateComponent(
    request: UndeprecateComponentRequest,
  ): Promise<UndeprecateComponentResponse> {
    await this.commandHandler.execute({
      componentId: request.componentId,
      reason: request.reason,
    });

    const view = await this.reader.findById(request.componentId);

    return {
      componentId: request.componentId,
      name: view?.name || "Unknown",
      status: view?.status || "active",
      reason: request.reason,
    };
  }
}
