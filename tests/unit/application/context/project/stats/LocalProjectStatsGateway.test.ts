import { describe, expect, it, jest } from "@jest/globals";
import { LocalProjectStatsGateway } from "../../../../../../src/application/context/project/stats/LocalProjectStatsGateway.js";
import type { GetProjectStatsQueryHandler } from "../../../../../../src/application/context/project/stats/GetProjectStatsQueryHandler.js";

describe("LocalProjectStatsGateway", () => {
  it("wraps the query snapshot in a response", async () => {
    const snapshot = {
      project: {
        audiences: {
          totalAudiences: 0,
          primaryAudiences: 0,
          secondaryAudiences: 0,
        },
        audiencePains: {
          audiencePainsCount: 0,
        },
        valuePropositions: {
          valuePropositionsCount: 0,
        },
      },
      work: {
        goals: {
          definedGoalsCount: 1,
          refinedGoalsCount: 0,
          inProgressGoalsCount: 0,
          submittedGoalsCount: 0,
          closedGoalsCount: 0,
        },
        sessions: {
          sessionsCount: 0,
        },
      },
      memory: {
        decisions: {
          decisionsCount: 0,
        },
        components: {
          componentsCount: 0,
        },
        dependencies: {
          dependenciesCount: 0,
        },
        invariants: {
          invariantsCount: 0,
        },
        guidelines: {
          guidelinesCount: 0,
        },
      },
      graph: {
        relationCount: 0,
      },
    };
    const queryHandler = {
      execute: jest.fn().mockResolvedValue(snapshot),
    } as unknown as jest.Mocked<Pick<GetProjectStatsQueryHandler, "execute">>;
    const gateway = new LocalProjectStatsGateway(
      queryHandler as GetProjectStatsQueryHandler,
    );

    await expect(gateway.getProjectStats({ currentOnly: true })).resolves.toEqual(
      { snapshot },
    );
  });
});
