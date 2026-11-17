import { IShowComponentGateway } from "./IShowComponentGateway.js";
import { ShowComponentRequest } from "./ShowComponentRequest.js";
import { ShowComponentResponse } from "./ShowComponentResponse.js";
import { IComponentReader } from "../get/IComponentReader.js";
import { IRelationViewReader } from "../../relations/get/IRelationViewReader.js";

export class LocalShowComponentGateway implements IShowComponentGateway {
  constructor(
    private readonly componentReader: IComponentReader,
    private readonly relationViewReader: IRelationViewReader,
  ) {}

  async showComponent(
    request: ShowComponentRequest,
  ): Promise<ShowComponentResponse> {
    const component = request.componentId
      ? await this.componentReader.findById(request.componentId)
      : request.name
        ? await this.componentReader.findByName(request.name)
        : null;

    if (!component) {
      const identifier = request.componentId || request.name;
      throw new Error(`Component not found: ${identifier}`);
    }

    const relations = await this.relationViewReader.findAll({
      entityType: "component",
      entityId: component.componentId,
      status: "active",
    });

    return { component, relations };
  }
}
