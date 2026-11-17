import { IDeprecateComponentGateway } from "./IDeprecateComponentGateway.js";
import { DeprecateComponentRequest } from "./DeprecateComponentRequest.js";
import { DeprecateComponentResponse } from "./DeprecateComponentResponse.js";
import { DeprecateComponentCommandHandler } from "./DeprecateComponentCommandHandler.js";
import { IComponentDeprecateReader } from "./IComponentDeprecateReader.js";

export class LocalDeprecateComponentGateway implements IDeprecateComponentGateway {
  constructor(
    private readonly commandHandler: DeprecateComponentCommandHandler,
    private readonly reader: IComponentDeprecateReader,
  ) {}

  async deprecateComponent(
    request: DeprecateComponentRequest,
  ): Promise<DeprecateComponentResponse> {
    await this.commandHandler.execute({
      componentId: request.componentId,
      reason: request.reason,
    });

    const view = await this.reader.findById(request.componentId);

    return {
      componentId: request.componentId,
      name: view?.name || "Unknown",
      status: view?.status || "deprecated",
      reason: request.reason,
    };
  }
}
