import { describe, expect, it, jest } from "@jest/globals";
import { ProjectStatsController } from "../../../../../../src/application/context/project/stats/ProjectStatsController.js";
import type { IProjectStatsGateway } from "../../../../../../src/application/context/project/stats/IProjectStatsGateway.js";

describe("ProjectStatsController", () => {
  it("delegates stats requests to the gateway", async () => {
    const response = {
      snapshot: {
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
            definedGoalsCount: 0,
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
      },
    };
    const gateway = {
      getProjectStats: jest.fn().mockResolvedValue(response),
    } as jest.Mocked<IProjectStatsGateway>;
    const controller = new ProjectStatsController(gateway);

    await expect(controller.handle({ currentOnly: true })).resolves.toBe(
      response,
    );
    expect(gateway.getProjectStats).toHaveBeenCalledWith({
      currentOnly: true,
    });
  });
});
