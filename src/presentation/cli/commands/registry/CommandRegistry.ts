import type { Command } from "commander";
import { registerProjectCommands } from "../project/registerProjectCommands.js";
import { registerGoalCommands } from "../goals/registerGoalCommands.js";
import { registerGuidelineCommands } from "../guidelines/registerGuidelineCommands.js";
import { registerInvariantCommands } from "../invariants/registerInvariantCommands.js";
import { registerRelationCommands } from "../relations/registerRelationCommands.js";
import { registerMigrateCommand } from "../migrate/migrate.js";
import { registerEvolveCommand } from "../evolve/evolve.js";
import { registerHealCommand } from "../heal/heal.js";
import { registerIndexCommands } from "../index/registerIndexCommands.js";
import { registerHostCommands } from "../host/registerHostCommands.js";
import { registerSearchCommand } from "../search/search.js";
import { registerSessionCommands } from "../sessions/registerSessionCommands.js";
import { registerTelemetryCommands } from "../telemetry/registerTelemetryCommands.js";
import { registerValuePropositionCommands } from "../value-propositions/registerValuePropositionCommands.js";
import { registerWorkCommands } from "../work/registerWorkCommands.js";
import { registerArchitectureCommands } from "../architecture/registerArchitectureCommands.js";
import { registerAudiencePainCommands } from "../audience-pains/registerAudiencePainCommands.js";
import { registerAudienceCommands } from "../audiences/registerAudienceCommands.js";
import { registerComponentCommands } from "../components/registerComponentCommands.js";
import { registerDecisionCommands } from "../decisions/registerDecisionCommands.js";
import { registerDependencyCommands } from "../dependencies/registerDependencyCommands.js";

/**
 * The manual composition root for the Commander command tree.
 *
 * Each registration function owns one top-level command group. It creates that
 * group's parent command once and registers all of its leaf commands beneath it.
 */
export function registerCliCommands(program: Command): void {
  registerProjectCommands(program);
  registerGoalCommands(program);
  registerGuidelineCommands(program);
  registerInvariantCommands(program);
  registerRelationCommands(program);
  registerMigrateCommand(program);
  registerEvolveCommand(program);
  registerHealCommand(program);
  registerIndexCommands(program);
  registerHostCommands(program);
  registerSearchCommand(program);
  registerSessionCommands(program);
  registerTelemetryCommands(program);
  registerValuePropositionCommands(program);
  registerWorkCommands(program);
  registerArchitectureCommands(program);
  registerAudiencePainCommands(program);
  registerAudienceCommands(program);
  registerComponentCommands(program);
  registerDecisionCommands(program);
  registerDependencyCommands(program);
}
