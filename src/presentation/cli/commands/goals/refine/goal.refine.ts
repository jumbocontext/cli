/**
 * CLI Command: jumbo goal refine
 *
 * Starts refinement of a goal (transitions status from 'defined' to 'in-refinement').
 * Goals must be refined and committed before they can be started.
 *
 * In interactive mode, prompts to register relations with components,
 * dependencies, and other entities.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { IGoalReader } from "../../../../../application/context/goals/start/IGoalReader.js";
import type { RefineGoalController } from "../../../../../application/context/goals/refine/RefineGoalController.js";
import type { IComponentViewReader } from "../../../../../application/context/components/get/IComponentViewReader.js";
import type { IGuidelineViewReader } from "../../../../../application/context/guidelines/get/IGuidelineViewReader.js";
import type { IInvariantViewReader } from "../../../../../application/context/invariants/get/IInvariantViewReader.js";
import type { IDecisionViewReader } from "../../../../../application/context/decisions/get/IDecisionViewReader.js";
import type { AddRelationController } from "../../../../../application/context/relations/add/AddRelationController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { InteractivePromptService } from "../../../prompts/index.js";
import { ComponentView } from "../../../../../application/context/components/ComponentView.js";
import { InvariantView } from "../../../../../application/context/invariants/InvariantView.js";
import { GuidelineView } from "../../../../../application/context/guidelines/GuidelineView.js";
import { DecisionView } from "../../../../../application/context/decisions/DecisionView.js";
import { EntityType } from "../../../../../domain/relations/Constants.js";
import { GoalRefineOutputBuilder } from "./GoalRefineOutputBuilder.js";
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
    command: "jumbo goal refine --id abc123",
    description: "Start refinement and display goal details for review",
  },
  {
    command: "jumbo goal refine --id abc123 --interactive",
    description: "Refine with interactive prompts to register relations",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal add", "goal commit", "goal start", "relation add"];

/**
 * The abstract ports the `goal refine` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface GoalRefineDependencies {
  readonly goalContextReader: IGoalReader;
  readonly refineGoalController: RefineGoalController;
  readonly componentViewReader: IComponentViewReader;
  readonly guidelineViewReader: IGuidelineViewReader;
  readonly invariantViewReader: IInvariantViewReader;
  readonly decisionViewReader: IDecisionViewReader;
  readonly addRelationController: AddRelationController;
}

/**
 * Composes exactly the features the `goal refine` leaf uses.
 */
async function createGoalRefineDependencies(): Promise<GoalRefineDependencies> {
  return new LeafContainerBuilder()
    .withGoalContextReaderFeature()
    .withRefineGoalFeature()
    .withComponentViewFeature()
    .withGuidelineViewFeature()
    .withInvariantViewFeature()
    .withDecisionViewFeature()
    .withAddRelationFeature()
    .build();
}

/** Registers the `goal refine` leaf under the parent supplied by its group. */
export function registerGoalRefineCommand(goal: Command): void {
  const command = goal
    .command("refine")
    .description(
      "Start refinement of a goal by displaying details and transitioning to 'in-refinement' status",
    )
    .requiredOption("-i, --id <id>", "ID of the goal to refine")
    .option(
      "--interactive",
      "Guided refinement with prompts to register relations",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal refine",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalRefineDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalRefineDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) throw new Error("Goal refine dependencies were not initialized.");
    await goalRefine(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalRefine(
  options: {
    id: string;
    interactive?: boolean;
  },
  container: GoalRefineDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalRefineOutputBuilder();

  try {
    // 1. Verify goal exists and is in defined status
    const goalView = await container.goalContextReader.findById(options.id);
    if (!goalView) {
      const output = outputBuilder.buildGoalNotFoundError(options.id);
      renderer.error(output.toHumanReadable());
      process.exit(1);
    }

    // 2. Branch based on mode
    if (options.interactive) {
      // Interactive mode: renderGoalDetails + transition + runInteractiveRelationFlow
      const detailsOutput =
        outputBuilder.buildGoalDetailsAndRefinementPrompt(goalView);
      renderer.info(detailsOutput.toHumanReadable());

      const response = await container.refineGoalController.handle({
        goalId: options.id,
      });
      const successOutput = outputBuilder.buildSuccess(
        response.goalId,
        response.status,
      );
      renderer.info(successOutput.toHumanReadable());

      const createdRelations = await runInteractiveRelationFlow(
        options.id,
        container,
      );

      // Display relations if any were created
      if (createdRelations.length > 0) {
        const relationsOutput =
          outputBuilder.buildCreatedRelations(createdRelations);
        renderer.info(relationsOutput.toHumanReadable());
      }
    } else {
      // Default mode: renderGoalDetails + transition to in-refinement
      const detailsOutput =
        outputBuilder.buildGoalDetailsAndRefinementPrompt(goalView);
      renderer.info(detailsOutput.toHumanReadable());

      const response = await container.refineGoalController.handle({
        goalId: options.id,
      });
      const successOutput = outputBuilder.buildSuccess(
        response.goalId,
        response.status,
      );
      renderer.info(successOutput.toHumanReadable());
    }
  } catch (error) {
    const errorOutput = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    renderer.error(errorOutput.toHumanReadable());
    process.exit(1);
  }
}

/**
 * Runs interactive flow to register relations for the goal
 */
async function runInteractiveRelationFlow(
  goalId: string,
  container: GoalRefineDependencies,
): Promise<
  Array<{
    relationId: string;
    toType: string;
    toId: string;
    relationType: string;
  }>
> {
  const promptService = new InteractivePromptService();
  const createdRelations: Array<{
    relationId: string;
    toType: string;
    toId: string;
    relationType: string;
  }> = [];

  // Fetch all entities in parallel
  const [components, guidelines, invariants, decisions] = await Promise.all([
    container.componentViewReader.findAll(),
    container.guidelineViewReader.findAll(),
    container.invariantViewReader.findAll(),
    container.decisionViewReader.findAll("active"),
  ]);

  const activeComponents = components.filter(
    (c: ComponentView) => c.status === "active",
  );
  const activeGuidelines = guidelines.filter(
    (g: GuidelineView) => !g.isRemoved,
  );

  const refineOutputBuilder = new GoalRefineOutputBuilder();
  const headerOutput = refineOutputBuilder.buildInteractiveFlowHeader();
  const renderer = Renderer.getInstance();
  renderer.info(headerOutput.toHumanReadable());

  // Step 1: Select related components
  const componentResult = await promptService.selectEntities<ComponentView>(
    activeComponents,
    {
      message: "Select components this goal involves:",
      suffix: "  (Use space to select, enter to confirm. Skip if none apply)",
      formatter: (c) => `${c.name} - ${c.description}`,
      emptyMessage:
        "No components defined. Skipping.\n  (Add components with: jumbo component add)",
    },
  );

  // Create relations for selected components
  for (const component of componentResult.selected) {
    const relationType = await promptService.textInput({
      message: `Relation type for ${component.name}:`,
      suffix: "  e.g., involves, modifies, creates, uses",
      required: true,
    });

    const description = await promptService.textInput({
      message: `Description for relation to ${component.name}:`,
      suffix: "  Brief explanation of how this goal relates to the component",
      required: true,
    });

    const relation = await container.addRelationController.handle({
      fromEntityType: EntityType.GOAL,
      fromEntityId: goalId,
      toEntityType: EntityType.COMPONENT,
      toEntityId: component.componentId,
      relationType: relationType!,
      description: description!,
    });
    createdRelations.push({
      relationId: relation.relationId,
      toType: EntityType.COMPONENT,
      toId: component.componentId,
      relationType: relationType!,
    });
  }

  // Step 2: Select related invariants
  const invariantResult = await promptService.selectEntities<InvariantView>(
    invariants,
    {
      message: "Select invariants this goal must respect:",
      suffix: "  (Non-negotiable constraints that apply to this goal)",
      formatter: (inv) => `${inv.title} - ${inv.description}`,
      emptyMessage:
        "No invariants defined. Skipping.\n  (Add invariants with: jumbo invariant add)",
    },
  );

  // Create relations for selected invariants
  for (const invariant of invariantResult.selected) {
    const relation = await container.addRelationController.handle({
      fromEntityType: EntityType.GOAL,
      fromEntityId: goalId,
      toEntityType: EntityType.INVARIANT,
      toEntityId: invariant.invariantId,
      relationType: "must-respect",
      description: `Goal must respect invariant: ${invariant.title}`,
    });
    createdRelations.push({
      relationId: relation.relationId,
      toType: EntityType.INVARIANT,
      toId: invariant.invariantId,
      relationType: "must-respect",
    });
  }

  // Step 3: Select related guidelines
  const guidelineResult = await promptService.selectEntities<GuidelineView>(
    activeGuidelines,
    {
      message: "Select guidelines this goal should follow:",
      suffix: "  (Coding standards and practices to follow)",
      formatter: (g) => `[${g.category}] ${g.title} - ${g.description}`,
      emptyMessage:
        "No guidelines defined. Skipping.\n  (Add guidelines with: jumbo guideline add)",
    },
  );

  // Create relations for selected guidelines
  for (const guideline of guidelineResult.selected) {
    const relation = await container.addRelationController.handle({
      fromEntityType: EntityType.GOAL,
      fromEntityId: goalId,
      toEntityType: EntityType.GUIDELINE,
      toEntityId: guideline.guidelineId,
      relationType: "follows",
      description: `Goal follows guideline: ${guideline.title}`,
    });
    createdRelations.push({
      relationId: relation.relationId,
      toType: EntityType.GUIDELINE,
      toId: guideline.guidelineId,
      relationType: "follows",
    });
  }

  // Step 4: Display decisions for awareness
  if (decisions.length > 0) {
    promptService.displayInfo(
      "Active Decisions (for your awareness):",
      decisions,
      (d: DecisionView) => `${d.title} - ${d.context}`,
    );

    const linkDecisions = await promptService.textInput({
      message: "Link any decisions to this goal? (y/n):",
      suffix: "  Enter 'y' to select decisions to relate",
    });

    if (linkDecisions?.toLowerCase() === "y") {
      const decisionResult = await promptService.selectEntities<DecisionView>(
        decisions,
        {
          message: "Select decisions this goal relates to:",
          formatter: (d) => `${d.title} - ${d.context}`,
        },
      );

      for (const decision of decisionResult.selected) {
        const relation = await container.addRelationController.handle({
          fromEntityType: EntityType.GOAL,
          fromEntityId: goalId,
          toEntityType: EntityType.DECISION,
          toEntityId: decision.decisionId,
          relationType: "implements",
          description: `Goal implements decision: ${decision.title}`,
        });
        createdRelations.push({
          relationId: relation.relationId,
          toType: EntityType.DECISION,
          toId: decision.decisionId,
          relationType: "implements",
        });
      }
    }
  }

  return createdRelations;
}
