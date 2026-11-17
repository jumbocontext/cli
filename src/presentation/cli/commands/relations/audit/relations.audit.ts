/**
 * CLI Command: jumbo relations audit
 *
 * Audits relation graph coverage and disconnected context.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { AuditRelationsController } from "../../../../../application/context/relations/audit/AuditRelationsController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { AuditRelationsRequest } from "../../../../../application/context/relations/audit/AuditRelationsRequest.js";
import {
  EntityTypeValue,
  RelationAuditCheckValue,
} from "../../../../../domain/relations/Constants.js";
import { RelationAuditOutputBuilder } from "./RelationAuditOutputBuilder.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo relations audit",
    description: "Run every relation graph audit check",
  },
  {
    command: "jumbo relations audit --check dangling isolated",
    description: "Find missing endpoints and isolated entities",
  },
  {
    command: "jumbo relations audit --check summary --entity-type component",
    description: "Summarize component graph coverage",
  },
  {
    command: "jumbo relations audit --format json",
    description: "Return the stable audit result as JSON",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["relations list", "relations traverse", "relations path"];

/**
 * The abstract ports the `relations audit` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface RelationsAuditDependencies {
  readonly auditRelationsController: AuditRelationsController;
}

/**
 * Composes exactly the features the `relations audit` leaf uses.
 */
async function createRelationsAuditDependencies(): Promise<RelationsAuditDependencies> {
  return new LeafContainerBuilder().withAuditRelationsFeature().build();
}

/** Registers the `relations audit` leaf under the parent supplied by its group. */
export function registerRelationsAuditCommand(relations: Command): void {
  const command = relations
    .command("audit")
    .description("Audit relation graph coverage and disconnected context")
    .option(
      "-c, --check <checks...>",
      "Checks: dangling, isolated, inactive-only, ambiguous-id, summary (all by default)",
    )
    .option(
      "--entity-type <type>",
      "Filter findings and summary data by relation endpoint entity type",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "relations audit",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.relations,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: RelationsAuditDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createRelationsAuditDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Relations audit dependencies were not initialized.");
    }
    await relationsAudit(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function relationsAudit(
  options: { check?: string[] | string; entityType?: string },
  container: RelationsAuditDependencies,
): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new RelationAuditOutputBuilder();

  try {
    const checks = options.check
      ? (Array.isArray(options.check) ? options.check : [options.check]).map(
          (check) => check.toLowerCase(),
        )
      : undefined;
    const request: AuditRelationsRequest = {
      checks: checks as RelationAuditCheckValue[] | undefined,
      entityType: options.entityType as EntityTypeValue | undefined,
    };
    const result = await container.auditRelationsController.handle(request);
    const output =
      renderer.getConfig().format === "text"
        ? outputBuilder.build(result)
        : outputBuilder.buildStructuredOutput(result);
    const dataSection = output
      .getSections()
      .find((section) => section.type === "data");
    if (renderer.getConfig().format === "text")
      renderer.info(output.toHumanReadable());
    else if (dataSection) renderer.data(dataSection.content as RenderData);
  } catch (error) {
    const output = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    if (renderer.getConfig().format === "text")
      renderer.error(output.toHumanReadable());
    else {
      const dataSection = output
        .getSections()
        .find((section) => section.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
    process.exit(1);
  }
}
