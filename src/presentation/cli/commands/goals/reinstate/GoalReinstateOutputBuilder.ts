import { ReinstateGoalResponse } from "../../../../../application/context/goals/reinstate/ReinstateGoalResponse.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";

/** Builds human-readable and structured output for goal.reinstate. */
export class GoalReinstateOutputBuilder {
  private readonly builder = new TerminalOutputBuilder();

  buildSuccess(response: ReinstateGoalResponse): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(`${Symbols.check} ${Colors.success(`Goal ${response.status}`)}`);
    this.builder.addData({ status: response.status });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    const details = error instanceof Error ? error.message : error;
    this.builder.reset();
    this.builder.addPrompt(`${Symbols.cross} ${Colors.error(`Failed to reinstate goal: ${details}`)}`);
    this.builder.addData({ error: "Failed to reinstate goal", details });
    return this.builder.build();
  }
}
