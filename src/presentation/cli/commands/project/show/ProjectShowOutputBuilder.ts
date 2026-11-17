import { ProjectNorthStarView } from "../../../../../application/context/project/query/north-star/ProjectNorthStarView.js";
import { ProjectView } from "../../../../../application/context/project/ProjectView.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { YamlFormatter } from "../../../formatting/YamlFormatter.js";

export class ProjectShowOutputBuilder {
  private readonly builder = new TerminalOutputBuilder();
  private readonly yamlFormatter = new YamlFormatter();

  build(project: ProjectView | null): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      this.yamlFormatter.toYaml({ project: this.buildProjectData(project) }),
    );
    return this.builder.build();
  }

  buildNorthStar(northStar: ProjectNorthStarView | null): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      this.yamlFormatter.toYaml(this.buildNorthStarData(northStar)),
    );
    return this.builder.build();
  }

  buildStructuredProject(project: ProjectView | null): TerminalOutput {
    this.builder.reset();
    this.builder.addData({
      project: this.buildProjectData(project),
    });
    return this.builder.build();
  }

  buildStructuredNorthStar(
    northStar: ProjectNorthStarView | null,
  ): TerminalOutput {
    this.builder.reset();
    this.builder.addData(this.buildNorthStarData(northStar));
    return this.builder.build();
  }

  private buildNorthStarData(
    northStar: ProjectNorthStarView | null,
  ): Record<string, unknown> {
    if (!northStar) {
      return {
        project: null,
        audiences: [],
        audiencePains: [],
        valuePropositions: [],
      };
    }

    return {
      project: this.buildProjectData(northStar.project),
      audiences: northStar.audiences.map((a) => ({
        audienceId: a.audienceId,
        name: a.name,
        description: a.description,
        priority: a.priority,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
      audiencePains: northStar.audiencePains.map((p) => ({
        painId: p.painId,
        title: p.title,
        description: p.description,
        status: p.status,
        resolvedAt: p.resolvedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      valuePropositions: northStar.valuePropositions.map((v) => ({
        valuePropositionId: v.valuePropositionId,
        title: v.title,
        description: v.description,
        benefit: v.benefit,
        measurableOutcome: v.measurableOutcome,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
    };
  }

  private buildProjectData(
    project: ProjectView | null,
  ): Record<string, unknown> | null {
    if (!project) {
      return null;
    }

    return {
      projectId: project.projectId,
      name: project.name,
      purpose: project.purpose,
      lifecycleState: project.lifecycleState,
      version: project.version,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
