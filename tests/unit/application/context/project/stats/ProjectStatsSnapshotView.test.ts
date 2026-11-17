import type { AudiencePainStatsView } from "../../../../../../src/application/context/project/stats/AudiencePainStatsView.js";
import type { AudiencePainsCount } from "../../../../../../src/application/context/project/stats/AudiencePainsCount.js";
import type { AudienceStatsView } from "../../../../../../src/application/context/project/stats/AudienceStatsView.js";
import type { ClosedGoalsCount } from "../../../../../../src/application/context/project/stats/ClosedGoalsCount.js";
import type { ComponentStatsView } from "../../../../../../src/application/context/project/stats/ComponentStatsView.js";
import type { ComponentsCount } from "../../../../../../src/application/context/project/stats/ComponentsCount.js";
import type { DecisionsCount } from "../../../../../../src/application/context/project/stats/DecisionsCount.js";
import type { DecisionStatsView } from "../../../../../../src/application/context/project/stats/DecisionStatsView.js";
import type { DefinedGoalsCount } from "../../../../../../src/application/context/project/stats/DefinedGoalsCount.js";
import type { DependenciesCount } from "../../../../../../src/application/context/project/stats/DependenciesCount.js";
import type { DependencyStatsView } from "../../../../../../src/application/context/project/stats/DependencyStatsView.js";
import type { GoalStatsView } from "../../../../../../src/application/context/project/stats/GoalStatsView.js";
import type { GraphStatsView } from "../../../../../../src/application/context/project/stats/GraphStatsView.js";
import type { GuidelineStatsView } from "../../../../../../src/application/context/project/stats/GuidelineStatsView.js";
import type { GuidelinesCount } from "../../../../../../src/application/context/project/stats/GuidelinesCount.js";
import type { InProgressGoalsCount } from "../../../../../../src/application/context/project/stats/InProgressGoalsCount.js";
import type { InvariantStatsView } from "../../../../../../src/application/context/project/stats/InvariantStatsView.js";
import type { InvariantsCount } from "../../../../../../src/application/context/project/stats/InvariantsCount.js";
import type { MemoryStatsView } from "../../../../../../src/application/context/project/stats/MemoryStatsView.js";
import type { PrimaryAudiences } from "../../../../../../src/application/context/project/stats/PrimaryAudiences.js";
import type { ProjectStatsSnapshotView } from "../../../../../../src/application/context/project/stats/ProjectStatsSnapshotView.js";
import type { ProjectStatsView } from "../../../../../../src/application/context/project/stats/ProjectStatsView.js";
import type { RefinedGoalsCount } from "../../../../../../src/application/context/project/stats/RefinedGoalsCount.js";
import type { RelationCount } from "../../../../../../src/application/context/project/stats/RelationCount.js";
import type { SecondaryAudiences } from "../../../../../../src/application/context/project/stats/SecondaryAudiences.js";
import type { SessionsCount } from "../../../../../../src/application/context/project/stats/SessionsCount.js";
import type { SessionsStatsView } from "../../../../../../src/application/context/project/stats/SessionsStatsView.js";
import type { SubmittedGoalsCount } from "../../../../../../src/application/context/project/stats/SubmittedGoalsCount.js";
import type { TotalAudiences } from "../../../../../../src/application/context/project/stats/TotalAudiences.js";
import type { ValuePropositionsCount } from "../../../../../../src/application/context/project/stats/ValuePropositionsCount.js";
import type { ValuePropositionsStatsView } from "../../../../../../src/application/context/project/stats/ValuePropositionsStatsView.js";
import type { WorkStatsView } from "../../../../../../src/application/context/project/stats/WorkStatsView.js";

describe("ProjectStatsSnapshotView", () => {
  it("composes the decomposed stats views without changing the snapshot shape", () => {
    const audiences: AudienceStatsView = {
      totalAudiences: 3 satisfies TotalAudiences,
      primaryAudiences: 1 satisfies PrimaryAudiences,
      secondaryAudiences: 2 satisfies SecondaryAudiences,
    };
    const audiencePains: AudiencePainStatsView = {
      audiencePainsCount: 4 satisfies AudiencePainsCount,
    };
    const valuePropositions: ValuePropositionsStatsView = {
      valuePropositionsCount: 5 satisfies ValuePropositionsCount,
    };
    const project: ProjectStatsView = {
      audiences,
      audiencePains,
      valuePropositions,
    };

    const goals: GoalStatsView = {
      definedGoalsCount: 6 satisfies DefinedGoalsCount,
      refinedGoalsCount: 7 satisfies RefinedGoalsCount,
      inProgressGoalsCount: 8 satisfies InProgressGoalsCount,
      submittedGoalsCount: 9 satisfies SubmittedGoalsCount,
      closedGoalsCount: 10 satisfies ClosedGoalsCount,
    };
    const sessions: SessionsStatsView = {
      sessionsCount: 11 satisfies SessionsCount,
    };
    const work: WorkStatsView = {
      goals,
      sessions,
    };

    const memory: MemoryStatsView = {
      decisions: {
        decisionsCount: 12 satisfies DecisionsCount,
      } satisfies DecisionStatsView,
      components: {
        componentsCount: 13 satisfies ComponentsCount,
      } satisfies ComponentStatsView,
      dependencies: {
        dependenciesCount: 14 satisfies DependenciesCount,
      } satisfies DependencyStatsView,
      invariants: {
        invariantsCount: 15 satisfies InvariantsCount,
      } satisfies InvariantStatsView,
      guidelines: {
        guidelinesCount: 16 satisfies GuidelinesCount,
      } satisfies GuidelineStatsView,
    };

    const graph: GraphStatsView = {
      relationCount: 17 satisfies RelationCount,
    };
    const snapshot: ProjectStatsSnapshotView = {
      project,
      work,
      memory,
      graph,
    };

    expect(snapshot).toEqual({
      project: {
        audiences: {
          totalAudiences: 3,
          primaryAudiences: 1,
          secondaryAudiences: 2,
        },
        audiencePains: { audiencePainsCount: 4 },
        valuePropositions: { valuePropositionsCount: 5 },
      },
      work: {
        goals: {
          definedGoalsCount: 6,
          refinedGoalsCount: 7,
          inProgressGoalsCount: 8,
          submittedGoalsCount: 9,
          closedGoalsCount: 10,
        },
        sessions: { sessionsCount: 11 },
      },
      memory: {
        decisions: { decisionsCount: 12 },
        components: { componentsCount: 13 },
        dependencies: { dependenciesCount: 14 },
        invariants: { invariantsCount: 15 },
        guidelines: { guidelinesCount: 16 },
      },
      graph: { relationCount: 17 },
    });
  });
});
