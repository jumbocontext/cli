import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { ProjectStatsController } from "../../../../../../../src/application/context/project/stats/ProjectStatsController.js";
import { projectStats } from "../../../../../../../src/presentation/cli/commands/project/stats/project.stats.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { ProjectStatsDependencies } from "../../../../../../../src/presentation/cli/commands/project/stats/project.stats.js";

describe("project.stats command", () => {
  let mockController: jest.Mocked<Pick<ProjectStatsController, "handle">>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;
  let container: Partial<ProjectStatsDependencies>;

  beforeEach(() => {
    Renderer.configure({ format: "json", verbosity: "normal" });
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    mockController = {
      handle: jest.fn().mockResolvedValue({
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
              refinedGoalsCount: 1,
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
      }),
    } as jest.Mocked<Pick<ProjectStatsController, "handle">>;
    container = {
      projectStatsController:
        mockController as unknown as ProjectStatsController,
    };
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("requests the current stats snapshot", async () => {
    await projectStats({}, container as ProjectStatsDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({ currentOnly: true });
  });

  it("emits one complete JSON object without extra stdout calls", async () => {
    await projectStats({}, container as ProjectStatsDependencies);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(parsed.projectStats.work.goals.refinedGoalsCount).toBe(1);
  });
});
