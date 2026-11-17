import { IGetArchitectureGateway } from "./IGetArchitectureGateway.js";
import { GetArchitectureRequest } from "./GetArchitectureRequest.js";
import { GetArchitectureResponse } from "./GetArchitectureResponse.js";
import { IArchitectureReader } from "../IArchitectureReader.js";

export class LocalGetArchitectureGateway implements IGetArchitectureGateway {
  constructor(private readonly architectureReader: IArchitectureReader) {}

  async getArchitecture(
    _request: GetArchitectureRequest,
  ): Promise<GetArchitectureResponse> {
    const architecture = await this.architectureReader.find();
    return { architecture };
  }
}
