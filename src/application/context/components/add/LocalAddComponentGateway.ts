import { IAddComponentGateway } from "./IAddComponentGateway.js";
import { AddComponentRequest } from "./AddComponentRequest.js";
import { AddComponentResponse } from "./AddComponentResponse.js";
import { AddComponentCommandHandler } from "./AddComponentCommandHandler.js";
import { IComponentUpdateReader } from "../update/IComponentUpdateReader.js";

export class LocalAddComponentGateway implements IAddComponentGateway {
  constructor(
    private readonly commandHandler: AddComponentCommandHandler,
    private readonly componentReader: IComponentUpdateReader,
  ) {}

  async addComponent(
    request: AddComponentRequest,
  ): Promise<AddComponentResponse> {
    const result = await this.commandHandler.execute({
      name: request.name,
      type: request.type,
      description: request.description,
      responsibility: request.responsibility,
      path: request.path,
    });

    const view = await this.componentReader.findById(result.componentId);

    return {
      componentId: result.componentId,
      name: request.name,
      type: view?.type || request.type,
      path: view?.path || request.path,
      status: view?.status || "active",
      isUpdate: view ? view.version > 1 : false,
    };
  }
}
