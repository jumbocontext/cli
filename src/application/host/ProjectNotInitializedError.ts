/** A dependency on project data was used before the project was initialized. */
export class ProjectNotInitializedError extends Error {
  constructor(projectPath: string) {
    const instruction = `Run \`jumbo project init\` from ${projectPath}.`;
    const reason = "This project has not been initialized with Jumbo.";
    super(`${instruction} ${reason}`);
    this.name = "ProjectNotInitializedError";
  }
}
