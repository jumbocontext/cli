/** An existing project must be migrated before it can use application-root storage. */
export class MigrationRequiredError extends Error {
  readonly instruction: string;
  readonly reason: string;

  constructor(projectRoot: string) {
    const instruction = `Run \`jumbo migrate\` from ${projectRoot}.`;
    const reason = "This project's legacy Jumbo data has not been migrated to the application root.";
    super(`${instruction} ${reason}`);
    this.name = "MigrationRequiredError";
    this.instruction = instruction;
    this.reason = reason;
  }
}
