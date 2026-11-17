import { describe, expect, it, beforeEach } from "@jest/globals";
import { ProjectShowOutputBuilder } from "../../../../../../../src/presentation/cli/commands/project/show/ProjectShowOutputBuilder.js";
import { ProjectView } from "../../../../../../../src/application/context/project/ProjectView.js";
import { ProjectNorthStarView } from "../../../../../../../src/application/context/project/query/north-star/ProjectNorthStarView.js";

describe("ProjectShowOutputBuilder", () => {
  let builder: ProjectShowOutputBuilder;

  const project: ProjectView = {
    projectId: "project-1",
    name: "Jumbo",
    purpose: "Context orchestration",
    lifecycleState: "primed",
    version: 1,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  beforeEach(() => {
    builder = new ProjectShowOutputBuilder();
  });

  it("should return only core ProjectView fields by default", () => {
    const output = builder.buildStructuredProject(project);
    const data = output.getSections()[0].content as Record<string, unknown>;

    expect(data.project).toEqual(project);
    expect(data).not.toHaveProperty("audiences");
    expect(data).not.toHaveProperty("audiencePains");
    expect(data).not.toHaveProperty("valuePropositions");
  });

  it("should return north-star packet when requested", () => {
    const northStar: ProjectNorthStarView = {
      project,
      audiences: [
        {
          audienceId: "aud-1",
          name: "Developers",
          description: "Software developers",
          priority: "primary",
          isRemoved: false,
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ],
      audiencePains: [],
      valuePropositions: [],
    };

    const output = builder.buildStructuredNorthStar(northStar);
    const data = output.getSections()[0].content as Record<string, unknown>;

    expect(data.project).toEqual(project);
    expect(data.audiences).toHaveLength(1);
    expect(data).toHaveProperty("audiencePains");
    expect(data).toHaveProperty("valuePropositions");
  });
});
