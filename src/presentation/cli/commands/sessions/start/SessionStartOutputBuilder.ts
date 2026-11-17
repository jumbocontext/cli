import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { SessionStartResponse } from "../../../../../application/context/sessions/start/SessionStartResponse.js";
import { GoalBacklogPreviewItem } from "../../../../../application/context/goals/query/GoalBacklogPreviewItem.js";
import { YamlFormatter } from "../../../formatting/YamlFormatter.js";

const SESSION_ROUTER_SCHEMA_VERSION = "jumbo.sessionStart.router.v1";
const SESSION_ROUTER_PACKET_TYPE = "session.router";
const GOAL_FALLBACK_COMMAND = "jumbo goals list --format json";
const ROUTER_PRIMARY_ACTION = "ask_user_to_choose_workflow";
const ROUTER_PROMPT =
  "Prompt the user for input about what goal or workflow to work on. Session start includes only a bounded backlog preview with goalId, title, status, and createdAt. Ask whether they want to work on one of the shown goals, design or define a goal, refine a goal, execute a goal, review a goal, codify a goal, or do something different. IMPORTANT: Run the appropriate route command for the chosen goal before doing any work.";

const ROUTES = {
  design_or_define_goal: {
    command: "jumbo project show --northstar --format json",
  },
  refine_goal: {
    command: "jumbo goal refine --id <goalId>",
    fallbackCommand: GOAL_FALLBACK_COMMAND,
  },
  execute_goal: {
    command: "jumbo goal start --id <goalId>",
    fallbackCommand: GOAL_FALLBACK_COMMAND,
  },
  review_goal: {
    command: "jumbo goal review --id <goalId>",
    fallbackCommand: GOAL_FALLBACK_COMMAND,
  },
  codify_goal: {
    command: "jumbo goal codify --id <goalId>",
    fallbackCommand: GOAL_FALLBACK_COMMAND,
  },
} as const;

/**
 * SessionStartOutputBuilder - Top-level output builder for session start command.
 *
 * Produces the minimal workflow router packet. Follow-up commands load the
 * workflow-specific context needed for the user's chosen action.
 *
 * Pattern: Follows OutputBuilder composition pattern per decision dec_34f667f7.
 */
export class SessionStartOutputBuilder {
  private readonly builder: TerminalOutputBuilder;
  private readonly yamlFormatter: YamlFormatter;

  constructor() {
    this.builder = new TerminalOutputBuilder();
    this.yamlFormatter = new YamlFormatter();
  }

  /**
   * Build human-readable session router output.
   */
  buildSessionStartOutput(response: SessionStartResponse): TerminalOutput {
    this.builder.reset();

    this.builder.addPrompt(this.renderRouterText(response));

    if (response.isUnprimedBrownfield) {
      this.builder.addPrompt(this.buildBrownfieldInstruction());
    }

    return this.builder.build();
  }

  /**
   * Build structured JSON output for session start command.
   */
  buildStructuredOutput(
    response: SessionStartResponse,
  ): Record<string, unknown> {
    const output: Record<string, unknown> = {
      schemaVersion: SESSION_ROUTER_SCHEMA_VERSION,
      packetType: SESSION_ROUTER_PACKET_TYPE,
      session: {
        sessionId: response.sessionId,
        status: response.status,
      },
      agentInstruction: {
        primaryAction: ROUTER_PRIMARY_ACTION,
        prompt: ROUTER_PROMPT,
      },
      backlogPreview: response.backlogPreview,
      routes: ROUTES,
    };

    if (response.isUnprimedBrownfield) {
      output.brownfieldInstruction = {
        prompt: this.buildBrownfieldInstruction(),
      };
    }

    return output;
  }

  private renderRouterText(response: SessionStartResponse): string {
    return [
      "session:",
      `  sessionId: ${response.sessionId}`,
      `  status: ${response.status}`,
      "",
      this.renderBacklogPreview(response.backlogPreview),
      "",
      `@LLM: ${ROUTER_PROMPT}`,
      "",
      "routes:",
      `  design_or_define_goal: ${ROUTES.design_or_define_goal.command}`,
      `  refine_goal: ${ROUTES.refine_goal.command}`,
      `    fallbackCommand: ${ROUTES.refine_goal.fallbackCommand}`,
      `  execute_goal: ${ROUTES.execute_goal.command}`,
      `    fallbackCommand: ${ROUTES.execute_goal.fallbackCommand}`,
      `  review_goal: ${ROUTES.review_goal.command}`,
      `    fallbackCommand: ${ROUTES.review_goal.fallbackCommand}`,
      `  codify_goal: ${ROUTES.codify_goal.command}`,
      `    fallbackCommand: ${ROUTES.codify_goal.fallbackCommand}`,
    ].join("\n");
  }

  private renderBacklogPreview(
    preview: readonly GoalBacklogPreviewItem[],
  ): string {
    return this.yamlFormatter.toYaml({ backlogPreview: preview }).trimEnd();
  }

  private buildBrownfieldInstruction(): string {
    return [
      "",
      "@LLM: This is a BROWNFIELD PROJECT — your Jumbo workspace has no context yet.",
      "Jumbo is your persistent memory. What you register here survives session boundaries and is available to any agent working on this project.",
      "",
      "REQUIRED ACTION: Proactively engage the user with the following approach:",
      "",
      "1. GREET and ACKNOWLEDGE: \"Hi! I can see that you've added Jumbo to this project. ",
      '   This looks like an existing codebase with valuable context to preserve."',
      "",
      '2. OFFER HELP: "Would you like me to help transfer your existing project knowledge into Jumbo? ',
      '   I can scan your documentation, code structure, and patterns to capture:"',
      "   - Project purpose and target audience (from README, docs)",
      "   - Architectural components and dependencies (from code structure)",
      "   - Development guidelines and coding standards (from patterns)",
      "   - Architectural decisions (from docs, comments, ADRs)",
      "",
      "3. GET PERMISSION: \"I'll ask for your confirmation before adding anything to Jumbo. ",
      '   Should we start by scanning your project documentation?"',
      "",
      "IMPORTANT:",
      "- Take initiative: Don't wait passively. Actively offer to help.",
      "- Be conversational: Use natural language, not robotic instructions.",
      "- Human-in-the-loop: Always get user confirmation before running jumbo commands.",
      "- Start with docs: README.md, package.json, or docs/ are good starting points.",
      "",
      "AVAILABLE COMMANDS (use after getting user permission):",
      "- jumbo component add --name 'ComponentName' --description 'What it does'",
      "- jumbo decision add --title 'Decision' --rationale 'Why' --context 'Background'",
      "- jumbo guideline add --category 'testing' --description 'Guideline text'",
      "- jumbo invariant add --category 'architecture' --description 'Non-negotiable rule'",
      "- jumbo dependency add --name 'package' --version '1.0' --purpose 'What it does'",
      "",
      "Run 'jumbo --help' to see all available commands.",
    ].join("\n");
  }
}
