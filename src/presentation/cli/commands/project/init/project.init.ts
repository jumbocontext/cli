/**
 * CLI Command: jumbo project init
 *
 * Initializes a new Jumbo project by recording the initial ProjectInitialized event.
 * By default, runs in interactive mode prompting for each field.
 * Use --non-interactive flag to provide all values via command line options.
 */

import { checkbox, confirm, input, select } from "@inquirer/prompts";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import { CachedContextProject } from "../../../../../infrastructure/host/ContextProject.js";
import {
  ExistingSettingsError,
  ExistingSettingsGuard,
} from "../../../../../application/context/project/init/ExistingSettingsGuard.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import {
  AgentId,
  AvailableAgent,
} from "../../../../../application/context/project/init/AgentSelection.js";
import { PlannedFileChange } from "../../../../../application/context/project/init/PlannedFileChange.js";
import { Renderer } from "../../../rendering/Renderer.js";
import type { PlanProjectInitController } from "../../../../../application/context/project/init/PlanProjectInitController.js";
import type { InitializeProjectController } from "../../../../../application/context/project/init/InitializeProjectController.js";
import type { AddAudienceController } from "../../../../../application/context/audiences/add/AddAudienceController.js";
import type { AddAudiencePainController } from "../../../../../application/context/audience-pains/add/AddAudiencePainController.js";
import type { AddValuePropositionController } from "../../../../../application/context/value-propositions/add/AddValuePropositionController.js";
import type { GetTelemetryStatusController } from "../../../../../application/context/telemetry/get/GetTelemetryStatusController.js";
import type { UpdateTelemetryConsentController } from "../../../../../application/context/telemetry/update/UpdateTelemetryConsentController.js";
import type { ICliVersionReader } from "../../../../../application/cli-metadata/query/ICliMetadataReader.js";
import {
  getBannerLines,
  showAnimatedBanner,
} from "../../../banner/AnimatedBanner.js";
import {
  ProjectErrorMessages,
  ProjectLimits,
} from "../../../../../domain/project/Constants.js";
import {
  AudienceLimits,
  AudiencePriority,
  AudiencePriorityType,
} from "../../../../../domain/audiences/Constants.js";
import { AudiencePainLimits } from "../../../../../domain/audience-pains/Constants.js";
import { ValuePropositionLimits } from "../../../../../domain/value-propositions/Constants.js";
import type { Command } from "commander";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { categorizeCommand } from "../../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";

/**
 * Collected project initialization values
 */
interface ProjectInitOptions {
  name: string;
  purpose?: string;
}

interface AudienceOptions {
  name: string;
  description: string;
  priority: AudiencePriorityType;
}

interface AudiencePainOptions {
  title: string;
  description: string;
}

interface ValuePropositionOptions {
  title: string;
  description: string;
  benefit: string;
  measurableOutcome?: string;
}

interface PrimitiveOptions {
  audiences: AudienceOptions[];
  audiencePains: AudiencePainOptions[];
  valuePropositions: ValuePropositionOptions[];
}

/**
 * The abstract ports the `project init` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface ProjectInitDependencies {
  readonly planProjectInitController: PlanProjectInitController;
  readonly initializeProjectController: InitializeProjectController;
  readonly addAudienceController: AddAudienceController;
  readonly addAudiencePainController: AddAudiencePainController;
  readonly addValuePropositionController: AddValuePropositionController;
  readonly getTelemetryStatusController: GetTelemetryStatusController;
  readonly updateTelemetryConsentController: UpdateTelemetryConsentController;
  readonly cliVersionReader: ICliVersionReader;
}

/**
 * Composes exactly the features the `project init` leaf uses.
 * Each with*() call adds its feature's members to the container's type,
 * so the compiler enforces that the handler only reads composed features.
 */
async function createProjectInitDependencies(): Promise<ProjectInitDependencies> {
  return new LeafContainerBuilder()
    .withProjectInitFeature()
    .withAudienceFeature()
    .withAudiencePainFeature()
    .withValuePropositionFeature()
    .withTelemetryFeature()
    .withCliVersionReader()
    .build();
}

/**
 * Related commands are the only help copy this leaf owns beyond its examples;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["project update"];

/**
 * Usage examples shown in the EXAMPLES section of `--help`.
 * Defined here, alongside the option definitions, so the command file owns
 * its help copy the same way it owns its option copy.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo project init",
    description: "Initialize interactively (recommended)",
  },
  {
    command:
      'jumbo project init --non-interactive --name "MyProject" --purpose "AI memory management"',
    description: "Initialize without prompts using command line options",
  },
  {
    command:
      'jumbo project init --non-interactive --name "MyProject" --audience-name "Developers" --audience-description "Software developers" --audience-priority primary',
    description: "Initialize with audience in non-interactive mode",
  },
  {
    command: "jumbo project init --yolo",
    description: "Initialize interactively but skip the confirmation prompt",
  },
];

/**
 * Registers the `init` command. `project init` is the primary entry point and
 * appears in the PROJECT help category; the root-level `init` remains
 * invocable as a hidden convenience alias.
 */
export function registerProjectInitCommand(project: Command, program: Command): void {
  const projectLeaf = registerInitLeaf(project, "init", {
    hiddenFromCommandList: false,
    usageName: "project init",
  });
  categorizeCommand(projectLeaf, COMMAND_CATEGORY.projectKnowledge);
  registerInitLeaf(program, "init", {
    hiddenFromCommandList: true,
    usageName: "init",
  });
}

function registerInitLeaf(
  parent: Command,
  name: string,
  visibility: {
    /** Exclude this leaf from the parent's command listing, while staying invocable. */
    hiddenFromCommandList: boolean;
    /** Name shown in USAGE when this leaf is an alias (e.g. "init" instead of "project init"). */
    usageName: string | undefined;
  },
): Command {
  const command = parent
    .command(name, { hidden: visibility.hiddenFromCommandList })
    .description("Initialize a new Jumbo project with AI assistant hook configuration")
    .option("-n, --name <name>", "Project name (required in non-interactive mode)")
    .option("--purpose <purpose>", "High-level project purpose")
    .option("--non-interactive", "Skip interactive prompts, use command line options only")
    .option("--yolo", "Skip confirmation prompt and proceed with initialization")
    .option("--audience-name <name>", "Target audience name (non-interactive mode)")
    .option("--audience-description <description>", "Target audience description (non-interactive mode)")
    .option("--audience-priority <priority>", "Target audience priority: primary, secondary, tertiary (non-interactive mode)")
    .option("--pain-title <title>", "Audience pain point title (non-interactive mode)")
    .option("--pain-description <description>", "Audience pain point description (non-interactive mode)")
    .option("--value-title <title>", "Value proposition title (non-interactive mode)")
    .option("--value-description <description>", "Value proposition description (non-interactive mode)")
    .option("--value-benefit <benefit>", "Value proposition benefit (non-interactive mode)")
    .option("--value-measurable-outcome <outcome>", "Value proposition measurable outcome (non-interactive mode)");

  command.helpInformation = () =>
    formatSubcommandHelp(
      {
        path: "project init",
        metadata: metadataFromCommand(command, {
          category: COMMAND_CATEGORY.projectKnowledge,
          examples: EXAMPLES,
          related: RELATED_COMMANDS,
          topLevelAliases: ["init"],
        }),
      },
      visibility.usageName,
    );

  let dependencies: ProjectInitDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createProjectInitDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) throw new Error("Project init dependencies were not initialized.");
    await projectInit(options, dependencies);
  });

  return command;
}

/**
 * Command handler - receives container like all other controllers
 */
export async function projectInit(
  options: {
    name?: string;
    purpose?: string;
    nonInteractive?: boolean;
    yolo?: boolean;
    audienceName?: string;
    audienceDescription?: string;
    audiencePriority?: AudiencePriorityType;
    painTitle?: string;
    painDescription?: string;
    valueTitle?: string;
    valueDescription?: string;
    valueBenefit?: string;
    valueMeasurableOutcome?: string;
  },
  container: ProjectInitDependencies,
) {
  const renderer = Renderer.configure({ forceHuman: true });

  assertNoExistingSettings();

  // Show welcome banner
  if (process.stdout.isTTY) {
    const version = container.cliVersionReader.getVersion().version;
    await showAnimatedBanner([], null, version);
  } else {
    renderer.banner(getBannerLines());
  }

  // Determine project details and primitives based on mode
  let projectDetails: ProjectInitOptions;
  const primitives: PrimitiveOptions = {
    audiences: [],
    audiencePains: [],
    valuePropositions: [],
  };
  let selectedAgentIds: readonly AgentId[] | undefined;

  if (options.nonInteractive) {
    // Non-interactive mode: require --name flag
    if (!options.name) {
      renderer.error(
        "Project name is required in non-interactive mode. Use --name <name>",
      );
      process.exit(1);
    }
    projectDetails = {
      name: options.name,
      purpose: options.purpose,
    };

    // Collect primitives from CLI flags
    if (
      options.audienceName &&
      options.audienceDescription &&
      options.audiencePriority
    ) {
      primitives.audiences.push({
        name: options.audienceName,
        description: options.audienceDescription,
        priority: options.audiencePriority,
      });
    }
    if (options.painTitle && options.painDescription) {
      primitives.audiencePains.push({
        title: options.painTitle,
        description: options.painDescription,
      });
    }
    if (
      options.valueTitle &&
      options.valueDescription &&
      options.valueBenefit
    ) {
      primitives.valuePropositions.push({
        title: options.valueTitle,
        description: options.valueDescription,
        benefit: options.valueBenefit,
        measurableOutcome: options.valueMeasurableOutcome,
      });
    }
  } else {
    // Interactive mode (default): prompt for all fields
    renderer.info(
      "Let's set up your Jumbo project. Press Enter to skip optional fields.\n",
    );
    projectDetails = await promptForProjectDetails();
    primitives.audiences = await promptForAudiences();
    primitives.audiencePains = await promptForAudiencePains();
    primitives.valuePropositions = await promptForValuePropositions();
  }

  await promptForTelemetryConsentIfNeeded(container, !options.nonInteractive);

  const projectRoot = CachedContextProject.get().path;
  const initialPlanResponse = await container.planProjectInitController.handle({
    projectRoot,
  });

  if (!options.nonInteractive) {
    selectedAgentIds = await promptForAgentSelection(
      initialPlanResponse.availableAgents,
    );
  }

  const planResponse = options.nonInteractive
    ? initialPlanResponse
    : await container.planProjectInitController.handle({
        projectRoot,
        selectedAgentIds,
      });

  displayPlannedChanges(renderer, planResponse.plannedChanges);

  // Ask for confirmation (unless --yolo flag is set)
  if (!options.yolo) {
    const confirmed = await confirmChanges();
    if (!confirmed) {
      renderer.info("\nInitialization cancelled.");
      process.exit(0);
    }
  }

  // Show progress header
  renderer.info("\nInitializing project...\n");

  // Execute initialization via controller
  const result = await container.initializeProjectController.handle({
    name: projectDetails.name,
    purpose: projectDetails.purpose,
    projectRoot,
    selectedAgentIds,
  });

  // Show completion status for each change (from the result, not hardcoded)
  console.log();
  result.changes.forEach((change: PlannedFileChange) => {
    const symbol =
      change.action === "create"
        ? Colors.success(Symbols.check)
        : Colors.warning(Symbols.check);
    const verb = change.action === "create" ? "Created" : "Updated";
    console.log(`  ${symbol} ${verb} ${change.path}`);
  });

  // Persist primitives via existing controllers
  const registered: string[] = [];

  for (const audience of primitives.audiences) {
    await container.addAudienceController.handle(audience);
    registered.push(`Audience: ${audience.name}`);
  }

  for (const pain of primitives.audiencePains) {
    await container.addAudiencePainController.handle(pain);
    registered.push(`Pain: ${pain.title}`);
  }

  for (const value of primitives.valuePropositions) {
    await container.addValuePropositionController.handle(value);
    registered.push(`Value: ${value.title}`);
  }

  if (registered.length > 0) {
    console.log();
    registered.forEach((item) => {
      console.log(`  ${Colors.success(Symbols.check)} Registered ${item}`);
    });
  }

  console.log();

  // Success output (verbose for onboarding)
  const data: Record<string, string> = {
    projectId: result.projectId,
    name: projectDetails.name,
  };
  if (projectDetails.purpose) {
    data.purpose = projectDetails.purpose;
  }

  renderer.success("Welcome to Jumbo! Project initialized successfully.", data);
  renderer.info("");

  // Conditional next steps based on which primitives were provided
  const skipped: string[] = [];
  if (primitives.audiences.length === 0)
    skipped.push("audiences ('jumbo audience add')");
  if (primitives.audiencePains.length === 0)
    skipped.push("pain points ('jumbo audience-pain add')");
  if (primitives.valuePropositions.length === 0)
    skipped.push("value propositions ('jumbo value add')");

  if (skipped.length > 0) {
    renderer.info(`Consider defining: ${skipped.join(", ")}`);
    renderer.info("");
  }

  renderer.info(
    "Next steps: Create your first goal then start your coding agent.",
  );
  renderer.info("Jumbo will guide you, then your agent, through everything.");
  renderer.info(
    "Run 'jumbo goal add --help' to see available options for creating your first goal.",
  );
  renderer.info(
    'Example: \'jumbo goal add --title "Set up database" --objective "Install PostgreSQL and create initial schema" --criteria "Database installed" "Initial schema created" "Migrations set up"\'',
  );
}

/**
 * Refuses to initialize when Jumbo settings already exist along the project
 * search path. Existing settings are never overwritten by initialization.
 */
function assertNoExistingSettings(): void {
  try {
    new ExistingSettingsGuard().assertInitializationAllowed();
  } catch (error) {
    if (error instanceof ExistingSettingsError) {
      Renderer.getInstance().error(error.message);
      process.exit(1);
    }
    throw error;
  }
}

function withPromptHelp(message: string, help: string): string {
  return `${message}\n  ${help}\n>`;
}

/**
 * Prompts the user interactively for project initialization values.
 * Each field includes explanatory text to guide the user.
 */
async function promptForProjectDetails(): Promise<ProjectInitOptions> {
  const name = await input({
    message: withPromptHelp(
      "Project name:",
      "A short, memorable name for your project (e.g., 'MyApp', 'DataPipeline')",
    ),
    validate: (input: string) => {
      if (!input.trim()) {
        return "Project name is required";
      }
      if (input.length > ProjectLimits.NAME_MAX_LENGTH) {
        return `Project name must be less than ${ProjectLimits.NAME_MAX_LENGTH} characters`;
      }
      return true;
    },
  });
  const purpose = await input({
    message: withPromptHelp(
      "Purpose (optional):",
      "The high-level goal or problem this project solves",
    ),
    validate: (input: string) => {
      if (input && input.length > ProjectLimits.PURPOSE_MAX_LENGTH) {
        return `Purpose must be less than ${ProjectLimits.PURPOSE_MAX_LENGTH} characters`;
      }
      return true;
    },
  });

  return {
    name: name.trim(),
    purpose: purpose.trim() || undefined,
  };
}

/**
 * Prompts the user to optionally define target audiences.
 * Loops with "Add another?" until the user declines.
 */
async function promptForAudiences(): Promise<AudienceOptions[]> {
  const audiences: AudienceOptions[] = [];

  const defineAudience = await confirm({
    message: withPromptHelp(
      "Define a target audience?",
      "Who is this project for? (you can add more later)",
    ),
    default: true,
  });

  if (!defineAudience) return audiences;

  let addMore = true;
  while (addMore) {
    const name = await input({
      message: withPromptHelp(
        "Audience name:",
        "A short label for this audience (e.g., 'Software Developers')",
      ),
      validate: (input: string) => {
        if (!input.trim()) return "Audience name is required";
        if (input.length > AudienceLimits.NAME_MAX_LENGTH) {
          return `Audience name must be less than ${AudienceLimits.NAME_MAX_LENGTH} characters`;
        }
        return true;
      },
    });
    const description = await input({
      message: withPromptHelp(
        "Audience description:",
        "Who they are and what they do",
      ),
      validate: (input: string) => {
        if (!input.trim()) return "Audience description is required";
        if (input.length > AudienceLimits.DESCRIPTION_MAX_LENGTH) {
          return `Audience description must be less than ${AudienceLimits.DESCRIPTION_MAX_LENGTH} characters`;
        }
        return true;
      },
    });
    const priority = await select<AudiencePriorityType>({
      message: "Audience priority:",
      choices: [
        { name: "Primary", value: AudiencePriority.PRIMARY },
        { name: "Secondary", value: AudiencePriority.SECONDARY },
        { name: "Tertiary", value: AudiencePriority.TERTIARY },
      ],
      default: AudiencePriority.PRIMARY,
    });

    audiences.push({
      name: name.trim(),
      description: description.trim(),
      priority,
    });

    const another = await confirm({
      message: "Add another audience?",
      default: false,
    });
    addMore = another;
  }

  return audiences;
}

/**
 * Prompts the user to optionally define audience pain points.
 * Loops with "Add another?" until the user declines.
 */
async function promptForAudiencePains(): Promise<AudiencePainOptions[]> {
  const pains: AudiencePainOptions[] = [];

  const definePain = await confirm({
    message: withPromptHelp(
      "Define an audience pain point?",
      "What problem does this project solve? (you can add more later)",
    ),
    default: true,
  });

  if (!definePain) return pains;

  let addMore = true;
  while (addMore) {
    const title = await input({
      message: withPromptHelp(
        "Pain point title:",
        "A brief title for the pain point (e.g., 'Context loss between sessions')",
      ),
      validate: (input: string) => {
        if (!input.trim()) return "Pain title is required";
        if (input.length > AudiencePainLimits.TITLE_MAX_LENGTH) {
          return `Pain title must be less than ${AudiencePainLimits.TITLE_MAX_LENGTH} characters`;
        }
        return true;
      },
    });
    const description = await input({
      message: withPromptHelp(
        "Pain point description:",
        "Detailed description of the problem",
      ),
      validate: (input: string) => {
        if (!input.trim()) return "Pain description is required";
        if (input.length > AudiencePainLimits.DESCRIPTION_MAX_LENGTH) {
          return `Pain description must be less than ${AudiencePainLimits.DESCRIPTION_MAX_LENGTH} characters`;
        }
        return true;
      },
    });

    pains.push({
      title: title.trim(),
      description: description.trim(),
    });

    const another = await confirm({
      message: "Add another pain point?",
      default: false,
    });
    addMore = another;
  }

  return pains;
}

/**
 * Prompts the user to optionally define value propositions.
 * Loops with "Add another?" until the user declines.
 */
async function promptForValuePropositions(): Promise<
  ValuePropositionOptions[]
> {
  const values: ValuePropositionOptions[] = [];

  const defineValue = await confirm({
    message: withPromptHelp(
      "Define a value proposition?",
      "What value does this project deliver? (you can add more later)",
    ),
    default: true,
  });

  if (!defineValue) return values;

  let addMore = true;
  while (addMore) {
    const title = await input({
      message: withPromptHelp(
        "Value proposition title:",
        "A short title (e.g., 'Persistent context across sessions')",
      ),
      validate: (input: string) => {
        if (!input.trim()) return "Value proposition title is required";
        if (input.length > ValuePropositionLimits.TITLE_MAX_LENGTH) {
          return `Title must be less than ${ValuePropositionLimits.TITLE_MAX_LENGTH} characters`;
        }
        return true;
      },
    });
    const description = await input({
      message: withPromptHelp(
        "Value proposition description:",
        "Detailed explanation of the value",
      ),
      validate: (input: string) => {
        if (!input.trim()) return "Description is required";
        if (input.length > ValuePropositionLimits.DESCRIPTION_MAX_LENGTH) {
          return `Description must be less than ${ValuePropositionLimits.DESCRIPTION_MAX_LENGTH} characters`;
        }
        return true;
      },
    });
    const benefit = await input({
      message: withPromptHelp("Benefit:", "How this improves the situation"),
      validate: (input: string) => {
        if (!input.trim()) return "Benefit is required";
        if (input.length > ValuePropositionLimits.BENEFIT_MAX_LENGTH) {
          return `Benefit must be less than ${ValuePropositionLimits.BENEFIT_MAX_LENGTH} characters`;
        }
        return true;
      },
    });
    const measurableOutcome = await input({
      message: withPromptHelp(
        "Measurable outcome (optional):",
        "How success is measured",
      ),
      validate: (input: string) => {
        if (
          input &&
          input.length > ValuePropositionLimits.MEASURABLE_OUTCOME_MAX_LENGTH
        ) {
          return `Measurable outcome must be less than ${ValuePropositionLimits.MEASURABLE_OUTCOME_MAX_LENGTH} characters`;
        }
        return true;
      },
    });

    values.push({
      title: title.trim(),
      description: description.trim(),
      benefit: benefit.trim(),
      measurableOutcome: measurableOutcome.trim() || undefined,
    });

    const another = await confirm({
      message: "Add another value proposition?",
      default: false,
    });
    addMore = another;
  }

  return values;
}

async function promptForTelemetryConsentIfNeeded(
  container: ProjectInitDependencies,
  interactive: boolean,
): Promise<void> {
  const status = await container.getTelemetryStatusController.handle({});

  if (
    status.configured ||
    status.disabledByCi ||
    status.disabledByEnvironment
  ) {
    return;
  }

  // Non-interactive mode: enable telemetry by default (opt-out model)
  if (!interactive || !process.stdout.isTTY) {
    await container.updateTelemetryConsentController.handle({ enabled: true });
    return;
  }

  const enabled = await confirm({
    message:
      "Jumbo records the name of each command you run (e.g. 'jumbo goal start') " +
      "along with a random project ID generated at init, so we can see how many projects are active. " +
      "No command arguments, file contents, goal data, paths, or project names are collected. " +
      "You can opt out later with 'jumbo telemetry disable' or JUMBO_TELEMETRY_DISABLED=1. " +
      "Allow telemetry?",
    default: true,
  });

  await container.updateTelemetryConsentController.handle({
    enabled,
  });
}

async function promptForAgentSelection(
  availableAgents: readonly AvailableAgent[],
): Promise<readonly AgentId[]> {
  if (availableAgents.length === 0) {
    return [];
  }

  return checkbox<AgentId>({
    message: "Select agents to configure:",
    choices: availableAgents.map((agent) => ({
      name: agent.name,
      value: agent.id,
      checked: true,
    })),
    validate: (selectedChoices) => {
      if (selectedChoices.length === 0) {
        return "Select at least one agent";
      }
      return true;
    },
  });
}

/**
 * Prompts user to confirm the planned changes
 */
async function confirmChanges(): Promise<boolean> {
  return confirm({
    message: "Proceed with initialization?",
    default: true,
  });
}

/**
 * Displays the planned changes in a user-friendly format
 */
function displayPlannedChanges(
  renderer: Renderer,
  changes: PlannedFileChange[],
): void {
  renderer.info("\nThe following changes will be made to your project:\n");

  const creates = changes.filter((c) => c.action === "create");
  const modifies = changes.filter((c) => c.action === "modify");

  // Calculate the max path length for column alignment
  const maxPathLength = Math.max(...changes.map((c) => c.path.length));

  const renderChangeList = (
    items: PlannedFileChange[],
    symbol: string,
    pathColor: (s: string) => string,
  ) => {
    items.forEach((c) => {
      const padding = " ".repeat(maxPathLength - c.path.length + 2);
      console.log(
        `    ${symbol} ${pathColor(c.path)}${padding}${Colors.dim(c.description)}`,
      );
    });
  };

  if (creates.length > 0) {
    console.log(Colors.success("  Files/directories to create:"));
    renderChangeList(creates, "+", Colors.accent);
    console.log();
  }

  if (modifies.length > 0) {
    console.log(
      Colors.warning("  Files to modify (existing content will be preserved):"),
    );
    renderChangeList(modifies, "~", Colors.accent);
    console.log();
  }
}
