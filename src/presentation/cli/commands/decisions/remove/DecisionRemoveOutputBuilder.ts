import chalk from "chalk";
import type { RemoveDecisionResponse } from "../../../../../application/context/decisions/remove/RemoveDecisionResponse.js";
import { SemanticColors } from "../../../../shared/DesignTokens.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";

export class DecisionRemoveOutputBuilder {
  buildSuccess(response: RemoveDecisionResponse): TerminalOutput {
    return new TerminalOutputBuilder()
      .addPrompt([
        chalk.hex(SemanticColors.headline).bold("Decision Removed"),
        chalk.hex(SemanticColors.success)("Decision and its incoming/outgoing relations have been removed."),
        `Id: ${chalk.hex(SemanticColors.primary)(response.decisionId)}`,
      ].join("\n"))
      .addData({ decisionId: response.decisionId, status: response.status })
      .build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    const message = error instanceof Error ? error.message : error;
    return new TerminalOutputBuilder()
      .addPrompt(chalk.hex(SemanticColors.error)("Failed to remove decision"))
      .addData({ error: "Failed to remove decision", message })
      .build();
  }
}
