import { beforeEach, describe, expect, it } from "@jest/globals";
import { ProjectStatsOutputBuilder } from "../../../../../../../src/presentation/cli/commands/project/stats/ProjectStatsOutputBuilder.js";
import type { ProjectStatsSnapshotView } from "../../../../../../../src/application/context/project/stats/ProjectStatsSnapshotView.js";

const snapshot: ProjectStatsSnapshotView = {
  project: {
    audiences: {
      totalAudiences: 3,
      primaryAudiences: 1,
      secondaryAudiences: 2,
    },
    audiencePains: {
      audiencePainsCount: 4,
    },
    valuePropositions: {
      valuePropositionsCount: 2,
    },
  },
  work: {
    goals: {
      definedGoalsCount: 1,
      refinedGoalsCount: 2,
      inProgressGoalsCount: 3,
      submittedGoalsCount: 1,
      closedGoalsCount: 4,
    },
    sessions: {
      sessionsCount: 2,
    },
  },
  memory: {
    decisions: {
      decisionsCount: 3,
    },
    components: {
      componentsCount: 2,
    },
    dependencies: {
      dependenciesCount: 1,
    },
    invariants: {
      invariantsCount: 2,
    },
    guidelines: {
      guidelinesCount: 1,
    },
  },
  graph: {
    relationCount: 5,
  },
};

describe("ProjectStatsOutputBuilder", () => {
  let builder: ProjectStatsOutputBuilder;

  beforeEach(() => {
    builder = new ProjectStatsOutputBuilder();
  });

  it("builds structured stats without deprecated Architecture surface", () => {
    const output = builder.buildStructured(snapshot);
    const data = output.getSections()[0].content as {
      projectStats: ProjectStatsSnapshotView;
    };

    expect(data.projectStats.project.audiences.totalAudiences).toBe(3);
    expect(data.projectStats.work.goals.refinedGoalsCount).toBe(2);
    expect(data.projectStats.graph.relationCount).toBe(5);
    expect(JSON.stringify(data)).not.toMatch(/architecture/i);
  });

  it("builds human-readable aggregate stats", () => {
    const text = builder.build(snapshot).toHumanReadable();

    expect(text).toContain("Project Stats");
    expect(text).toContain("Audiences: 3");
    expect(text).toContain("Refined goals: 2");
    expect(text).toContain("Relations: 5");
    expect(text).not.toMatch(/architecture/i);
  });
});
