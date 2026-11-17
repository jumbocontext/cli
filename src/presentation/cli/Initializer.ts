import { MigrationGate } from "../../migration/MigrationGate.js";
import { renderMigrationRequired } from "../../migration/renderMigrationRequired.js";
import { ProjectNotInitializedError } from "../../application/host/ProjectNotInitializedError.js";
import { renderProjectNotInitializedError } from "./rendering/renderProjectNotInitializedError.js";
import { FAILURE_EXIT_CODE } from "./Constants.js";
import { registerCliCommands } from "./commands/registry/CommandRegistry.js";
import { createCommanderProgram } from "./program/createCommanderProgram.js";

/** Signals that the migration gate already rendered its guidance and exited. */
class MigrationRequiredError extends Error {}

/** Assembles and executes the single Commander CLI program. */
export class Initializer {
  constructor(private readonly version: string) {}

  async run(): Promise<void> {
    const program = createCommanderProgram(this.version);

    const migrationGate = new MigrationGate();
    program.hook("preAction", async (_thisCommand, actionCommand) => {
      const result = await migrationGate.assertInvocationAllowed(actionCommand);
      if (result.kind === "migration-required") {
        renderMigrationRequired(result.projectRoot);
        process.exitCode = FAILURE_EXIT_CODE;
        throw new MigrationRequiredError("Migration required.");
      }
    });

    registerCliCommands(program);

    try {
      await program.parseAsync(process.argv);
    } catch (error) {
      if (error instanceof ProjectNotInitializedError) {
        renderProjectNotInitializedError(error);
        process.exitCode = FAILURE_EXIT_CODE;
        return;
      }
      // The migration gate already rendered its message and set the exit code.
      if (error instanceof MigrationRequiredError) return;
      throw error;
    }
  }
}
