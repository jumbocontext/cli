import { IGetComponentsGateway } from "./IGetComponentsGateway.js";
import { GetComponentsRequest } from "./GetComponentsRequest.js";
import { GetComponentsResponse } from "./GetComponentsResponse.js";
import { IComponentViewReader } from "../get/IComponentViewReader.js";

export class LocalGetComponentsGateway implements IGetComponentsGateway {
  constructor(private readonly componentViewReader: IComponentViewReader) {}

  async getComponents(
    request: GetComponentsRequest,
  ): Promise<GetComponentsResponse> {
    const components = await this.componentViewReader.findAll(request.status);
    return { components };
  }
}
