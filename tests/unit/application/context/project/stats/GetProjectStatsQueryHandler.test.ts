import { describe, expect, it, jest } from "@jest/globals";
import { GetProjectStatsQueryHandler } from "../../../../../../src/application/context/project/stats/GetProjectStatsQueryHandler.js";
import type { IProjectStatsQuery } from "../../../../../../src/application/context/project/stats/IProjectStatsQuery.js";
import type { ProjectStatsSnapshotView } from "../../../../../../src/application/context/project/stats/ProjectStatsSnapshotView.js";

const snapshot: ProjectStatsSnapshotView = {
  project: {
    audiences: {
      totalAudiences: 3,
      primaryAudiences: 1,
      secondaryAudiences: 2,
    },
    audiencePains: {
      audiencePainsCount: 2,
    },
    valuePropositions: {
      valuePropositionsCount: 1,
    },
  },
  work: {
    goals: {
      definedGoalsCount: 1,
      refinedGoalsCount: 2,
      inProgressGoalsCount: 1,
      submittedGoalsCount: 1,
      closedGoalsCount: 0,
    },
    sessions: {
      sessionsCount: 1,
    },
  },
  memory: {
    decisions: {
      decisionsCount: 1,
    },
    components: {
      componentsCount: 1,
    },
    dependencies: {
      dependenciesCount: 1,
    },
    invariants: {
      invariantsCount: 1,
    },
    guidelines: {
      guidelinesCount: 1,
    },
  },
  graph: {
    relationCount: 2,
  },
};

describe("GetProjectStatsQueryHandler", () => {
  it("returns the current project stats snapshot from the query abstraction", async () => {
    const query = {
      currentSnapshot: jest.fn().mockResolvedValue(snapshot),
    } as jest.Mocked<IProjectStatsQuery>;
    const handler = new GetProjectStatsQueryHandler(query);

    await expect(handler.execute({ currentOnly: true })).resolves.toEqual(
      snapshot,
    );
    expect(query.currentSnapshot).toHaveBeenCalledTimes(1);
  });
});
