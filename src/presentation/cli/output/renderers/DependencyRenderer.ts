import { EntityRenderer } from "./EntityRenderer.js";
import { Annotation } from "../Annotation.js";

/**
 * DependencyContextView from ContextualGoalView
 */
export interface DependencyContextView {
  readonly dependencyId: string;
  readonly name: string;
  readonly ecosystem: string;
  readonly packageName: string;
  readonly versionConstraint?: string | null;
  readonly purpose: string;
}

/**
 * Renders Dependency entities for terminal output.
 */
export class DependencyRenderer implements EntityRenderer<DependencyContextView> {
  toHumanReadable(dependency: DependencyContextView): string {
    const version = dependency.versionConstraint
      ? `@${dependency.versionConstraint}`
      : "";
    return `- ${dependency.ecosystem}:${dependency.packageName}${version} (${dependency.name}): ${dependency.purpose}`;
  }

  toJSON(dependency: DependencyContextView): unknown {
    return {
      dependencyId: dependency.dependencyId,
      name: dependency.name,
      ecosystem: dependency.ecosystem,
      packageName: dependency.packageName,
      versionConstraint: dependency.versionConstraint ?? null,
      purpose: dependency.purpose,
    };
  }

  getDefaultAnnotation(): Annotation {
    return {
      type: "instruction",
      text: "INSTRUCTION: You (the developer) MUST consider the following dependencies while implementing this goal.",
    };
  }

  getGroupHeader(): string {
    return "## Relevant Dependencies:";
  }
}
