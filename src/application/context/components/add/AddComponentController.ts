import { AddComponentRequest } from "./AddComponentRequest.js";
import { AddComponentResponse } from "./AddComponentResponse.js";
import { IAddComponentGateway } from "./IAddComponentGateway.js";

export class AddComponentController {
  constructor(private readonly gateway: IAddComponentGateway) {}

  async handle(request: AddComponentRequest): Promise<AddComponentResponse> {
    return this.gateway.addComponent(request);
  }
}
