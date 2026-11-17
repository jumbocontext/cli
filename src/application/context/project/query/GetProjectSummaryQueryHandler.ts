import { IProjectContextReader } from "./IProjectContextReader.js";
import { ProjectSummaryView } from "../ProjectSummaryView.js";
import { ProjectNotInitializedError } from "../../../host/ProjectNotInitializedError.js";

/**
 * GetProjectSummaryQueryHandler - Query handler for project banner information
 *
 * Retrieves the minimal project information needed for CLI banner display.
 * Returns null if no project has been initialized.
 *
 * Usage:
 *   const query = new GetProjectSummaryQueryHandler(projectContextReader);
 *   const summary = await query.execute();
 *   // Render banner with project name and purpose
 */
export class GetProjectSummaryQueryHandler {
  constructor(private readonly projectContextReader: IProjectContextReader) {}

  /**
   * Execute query to get project summary for banner display
   *
   * @returns ProjectSummaryView or null if project not initialized
   */
  async execute(): Promise<ProjectSummaryView | null> {
    let project;
    try {
      project = await this.projectContextReader.getProject();
    } catch (error) {
      if (error instanceof ProjectNotInitializedError) {
        return null;
      }
      throw error;
    }

    if (!project) {
      return null;
    }

    const lifecycleState =
      project.lifecycleState ??
      (await this.projectContextReader.getProjectLifecycleState());

    return {
      name: project.name,
      purpose: project.purpose,
      lifecycleState,
    };
  }
}
