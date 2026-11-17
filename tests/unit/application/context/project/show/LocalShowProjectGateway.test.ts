import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { LocalShowProjectGateway } from "../../../../../../src/application/context/project/show/LocalShowProjectGateway.js";
import { IProjectContextReader } from "../../../../../../src/application/context/project/query/IProjectContextReader.js";
import { ProjectView } from "../../../../../../src/application/context/project/ProjectView.js";
import { IAudienceContextReader } from "../../../../../../src/application/context/audiences/query/IAudienceContextReader.js";
import { IAudiencePainContextReader } from "../../../../../../src/application/context/audience-pains/query/IAudiencePainContextReader.js";
import { IValuePropositionContextReader } from "../../../../../../src/application/context/value-propositions/query/IValuePropositionContextReader.js";

describe("LocalShowProjectGateway", () => {
  let projectContextReader: jest.Mocked<IProjectContextReader>;
  let audienceContextReader: jest.Mocked<IAudienceContextReader>;
  let audiencePainContextReader: jest.Mocked<IAudiencePainContextReader>;
  let valuePropositionContextReader: jest.Mocked<IValuePropositionContextReader>;
  let gateway: LocalShowProjectGateway;

  const project = {
    projectId: "project-1",
    name: "Jumbo",
    purpose: "Context orchestration",
    version: 1,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  } as ProjectView;

  beforeEach(() => {
    projectContextReader = {
      getProject: jest.fn().mockResolvedValue(project),
    } as unknown as jest.Mocked<IProjectContextReader>;
    audienceContextReader = {
      findAllActive: jest.fn().mockResolvedValue([{ audienceId: "aud-1" }]),
    } as unknown as jest.Mocked<IAudienceContextReader>;
    audiencePainContextReader = {
      findAllActive: jest.fn().mockResolvedValue([{ painId: "pain-1" }]),
    } as unknown as jest.Mocked<IAudiencePainContextReader>;
    valuePropositionContextReader = {
      findAllActive: jest.fn().mockResolvedValue([{ valuePropositionId: "vp-1" }]),
    } as unknown as jest.Mocked<IValuePropositionContextReader>;
    gateway = new LocalShowProjectGateway(
      projectContextReader,
      audienceContextReader,
      audiencePainContextReader,
      valuePropositionContextReader
    );
  });

  it("should return only core project data by default", async () => {
    const result = await gateway.showProject({});

    expect(result.project).toBe(project);
    expect(result.northStar).toBeNull();
    expect(audienceContextReader.findAllActive).not.toHaveBeenCalled();
    expect(audiencePainContextReader.findAllActive).not.toHaveBeenCalled();
    expect(valuePropositionContextReader.findAllActive).not.toHaveBeenCalled();
  });

  it("should return north-star packet when requested", async () => {
    const result = await gateway.showProject({ northstar: true });

    expect(result.northStar).toEqual({
      project,
      audiences: [{ audienceId: "aud-1" }],
      audiencePains: [{ painId: "pain-1" }],
      valuePropositions: [{ valuePropositionId: "vp-1" }],
    });
  });

  it("should not query north-star relations when project is missing", async () => {
    projectContextReader.getProject.mockResolvedValue(null);

    const result = await gateway.showProject({ northstar: true });

    expect(result).toEqual({
      project: null,
      northStar: null,
    });
    expect(audienceContextReader.findAllActive).not.toHaveBeenCalled();
  });
});
