import { GetGuidelinesRequest } from "./GetGuidelinesRequest.js";
import { GetGuidelinesResponse } from "./GetGuidelinesResponse.js";
import { IGetGuidelinesGateway } from "./IGetGuidelinesGateway.js";

export class GetGuidelinesController {
  constructor(private readonly gateway: IGetGuidelinesGateway) {}

  async handle(request: GetGuidelinesRequest): Promise<GetGuidelinesResponse> {
    return this.gateway.getGuidelines(request);
  }
}
