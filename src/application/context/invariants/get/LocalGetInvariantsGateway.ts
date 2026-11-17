import { IGetInvariantsGateway } from "./IGetInvariantsGateway.js";
import { GetInvariantRequest } from "./GetInvariantRequest.js";
import { GetInvariantResponse } from "./GetInvariantResponse.js";
import { GetInvariantsRequest } from "./GetInvariantsRequest.js";
import { GetInvariantsResponse } from "./GetInvariantsResponse.js";
import { GetAllInvariantsRequest } from "./GetAllInvariantsRequest.js";
import { GetAllInvariantsResponse } from "./GetAllInvariantsResponse.js";
import { IInvariantViewReader } from "./IInvariantViewReader.js";

export class LocalGetInvariantsGateway implements IGetInvariantsGateway {
  constructor(private readonly invariantViewReader: IInvariantViewReader) {}

  async getInvariant(
    request: GetInvariantRequest,
  ): Promise<GetInvariantResponse> {
    const invariant = await this.invariantViewReader.findById(
      request.invariantId,
    );
    return { invariant };
  }

  async getInvariants(
    request: GetInvariantsRequest,
  ): Promise<GetInvariantsResponse> {
    const invariants = await this.invariantViewReader.findByIds(request.ids);
    return { invariants };
  }

  async getAllInvariants(
    _request: GetAllInvariantsRequest,
  ): Promise<GetAllInvariantsResponse> {
    const invariants = await this.invariantViewReader.findAll();
    return { invariants };
  }
}
