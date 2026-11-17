import { IAudiencePainContextReader } from "../../audience-pains/query/IAudiencePainContextReader.js";
import { IAudienceContextReader } from "../../audiences/query/IAudienceContextReader.js";
import { IValuePropositionContextReader } from "../../value-propositions/query/IValuePropositionContextReader.js";
import { IProjectContextReader } from "../query/IProjectContextReader.js";
import { IShowProjectGateway } from "./IShowProjectGateway.js";
import { ShowProjectRequest } from "./ShowProjectRequest.js";
import { ShowProjectResponse } from "./ShowProjectResponse.js";

export class LocalShowProjectGateway implements IShowProjectGateway {
  constructor(
    private readonly projectContextReader: IProjectContextReader,
    private readonly audienceContextReader: IAudienceContextReader,
    private readonly audiencePainContextReader: IAudiencePainContextReader,
    private readonly valuePropositionContextReader: IValuePropositionContextReader,
  ) {}

  async showProject(request: ShowProjectRequest): Promise<ShowProjectResponse> {
    const project = await this.projectContextReader.getProject();

    if (!request.northstar || !project) {
      return {
        project,
        northStar: null,
      };
    }

    const [audiences, audiencePains, valuePropositions] = await Promise.all([
      this.audienceContextReader.findAllActive(),
      this.audiencePainContextReader.findAllActive(),
      this.valuePropositionContextReader.findAllActive(),
    ]);

    return {
      project,
      northStar: {
        project,
        audiences,
        audiencePains,
        valuePropositions,
      },
    };
  }
}
