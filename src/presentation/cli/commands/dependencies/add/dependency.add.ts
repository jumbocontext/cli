/**
 * CLI Command: jumbo dependency add
 *
 * Registers an external dependency used by the project.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { AddDependencyController } from "../../../../../application/context/dependencies/add/AddDependencyController.js";
import type { AddRelationController } from "../../../../../application/context/relations/add/AddRelationController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { AddDependencyRequest } from "../../../../../application/context/dependencies/add/AddDependencyRequest.js";
import { AddRelationRequest } from "../../../../../application/context/relations/add/AddRelationRequest.js";
import { EntityType } from "../../../../../domain/relations/Constants.js";
import { Renderer } from "../../../rendering/Renderer.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command:
      "jumbo dependency add --name Express --ecosystem npm --package-name express --version-constraint ^4.18.0",
    description: "Register an npm package dependency",
  },
  {
    command:
      "jumbo dependency add --name StripeAPI --ecosystem service --package-name stripe-api --version-constraint 2023-10-16",
    description: "Register a non-database external service dependency",
  },
  {
    command:
      "jumbo dependency add --consumer-id UserController --provider-id AuthMiddleware --endpoint /api/auth/verify --contract IAuthVerifier",
    description:
      "Legacy compatibility path (deprecated, removed in v3.0.0): maps component coupling to relation",
  },
];

const RELATED_COMMANDS = ["dependency update", "dependency remove", "relation add"];

const LEGACY_FLAGS_WARNING =
  "[DEPRECATION] --consumer-id/--provider-id are deprecated and will be removed in v3.0.0. Use 'jumbo relation add --from-type component --from-id <id> --to-type component --to-id <id> --type depends_on --description <text>'.";

function warnLegacyFlags(): void {
  process.stderr.write(`${LEGACY_FLAGS_WARNING}\n`);
}

/**
 * The abstract ports the `dependency add` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface DependencyAddDependencies {
  readonly addDependencyController: AddDependencyController;
  readonly addRelationController: AddRelationController;
}

/**
 * Composes exactly the features the `dependency add` leaf uses.
 */
async function createDependencyAddDependencies(): Promise<DependencyAddDependencies> {
  return new LeafContainerBuilder()
    .withAddDependencyFeature()
    .withAddRelationFeature()
    .build();
}

/** Registers the `dependency add` leaf under the parent supplied by its group. */
export function registerDependencyAddCommand(dependency: Command): void {
  const command = dependency
    .command("add")
    .description("Register a third-party dependency (package or service)")
    .option("--name <name>", "Dependency display name")
    .option("--ecosystem <ecosystem>", "Dependency ecosystem (e.g., npm, pip, maven)")
    .option("--package-name <packageName>", "Package identifier in the ecosystem")
    .option(
      "--version-constraint <constraint>",
      "Optional version constraint (e.g., ^4.18.0)",
    )
    .option(
      "--consumer-id <consumerId>",
      "Legacy (deprecated, removed in v3.0.0): source component ID to map as relation",
    )
    .option(
      "--provider-id <providerId>",
      "Legacy (deprecated, removed in v3.0.0): target component ID to map as relation",
    )
    .option("--endpoint <endpoint>", "Connection point (e.g., '/api/users', 'IUserRepository')")
    .option("--contract <contract>", "Interface or contract specification");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "dependency add",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: DependencyAddDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createDependencyAddDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Dependency add dependencies were not initialized.");
    await dependencyAdd(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function dependencyAdd(
  options: {
    name?: string;
    ecosystem?: string;
    packageName?: string;
    versionConstraint?: string;
    consumerId?: string;
    providerId?: string;
    endpoint?: string;
    contract?: string;
  },
  container: DependencyAddDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const hasLegacyConsumer =
      typeof options.consumerId === "string" && options.consumerId.length > 0;
    const hasLegacyProvider =
      typeof options.providerId === "string" && options.providerId.length > 0;
    const hasLegacyFlags = hasLegacyConsumer || hasLegacyProvider;
    const hasExternalIdentityFlags =
      typeof options.name === "string" ||
      typeof options.ecosystem === "string" ||
      typeof options.packageName === "string";

    if (hasLegacyFlags) {
      if (!hasLegacyConsumer || !hasLegacyProvider) {
        throw new Error(
          "Legacy mode requires both --consumer-id and --provider-id.",
        );
      }
      if (hasExternalIdentityFlags) {
        throw new Error(
          "Cannot mix legacy flags (--consumer-id/--provider-id) with external dependency identity flags (--name/--ecosystem/--package-name).",
        );
      }

      warnLegacyFlags();

      const relationRequest: AddRelationRequest = {
        fromEntityType: EntityType.COMPONENT,
        fromEntityId: options.consumerId as string,
        toEntityType: EntityType.COMPONENT,
        toEntityId: options.providerId as string,
        relationType: "depends_on",
        description: `Legacy dependency compatibility mapping: ${options.consumerId} depends on ${options.providerId}.`,
      };

      const response =
        await container.addRelationController.handle(relationRequest);
      renderer.success("Legacy dependency flags mapped to component relation", {
        relationId: response.relationId,
        from: options.consumerId as string,
        relationType: "depends_on",
        to: options.providerId as string,
      });
      return;
    }

    const request: AddDependencyRequest = {
      name: options.name,
      ecosystem: options.ecosystem,
      packageName: options.packageName,
      versionConstraint: options.versionConstraint,
      endpoint: options.endpoint,
      contract: options.contract,
    };

    const response = await container.addDependencyController.handle(request);

    // Success output
    const data: Record<string, string | number> = {
      dependencyId: response.dependencyId,
    };
    if (options.name) data.name = options.name;
    if (options.ecosystem) data.ecosystem = options.ecosystem;
    if (options.packageName) data.packageName = options.packageName;
    if (options.versionConstraint)
      data.versionConstraint = options.versionConstraint;
    if (options.endpoint) data.endpoint = options.endpoint;
    if (options.contract) data.contract = options.contract;

    const dependencyLabel =
      options.name && options.ecosystem && options.packageName
        ? `${options.ecosystem}:${options.packageName} (${options.name})`
        : response.dependencyId;
    renderer.success(`Dependency '${dependencyLabel}' added`, data);
  } catch (error) {
    renderer.error(
      "Failed to add dependency",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
