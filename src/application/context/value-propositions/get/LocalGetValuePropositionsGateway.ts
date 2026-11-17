import { IGetValuePropositionsGateway } from "./IGetValuePropositionsGateway.js";
import { GetValuePropositionsRequest } from "./GetValuePropositionsRequest.js";
import { GetValuePropositionsResponse } from "./GetValuePropositionsResponse.js";
import { IValuePropositionContextReader } from "../query/IValuePropositionContextReader.js";

export class LocalGetValuePropositionsGateway implements IGetValuePropositionsGateway {
  constructor(
    private readonly valuePropositionContextReader: IValuePropositionContextReader,
  ) {}

  async getValuePropositions(
    _request: GetValuePropositionsRequest,
  ): Promise<GetValuePropositionsResponse> {
    const values = await this.valuePropositionContextReader.findAllActive();
    return { values };
  }
}
