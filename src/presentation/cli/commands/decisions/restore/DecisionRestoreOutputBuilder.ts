import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import {
  heading,
  contentLine,
  metaField,
} from "../../../rendering/OutputLayout.js";

export class DecisionRestoreOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  buildSuccess(decisionId: string, reason: string): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];
    lines.push("");
    lines.push(heading("Decision Restored"));
    lines.push(
      contentLine(
        `${Symbols.check} ${Colors.success("Decision has been restored")}`,
      ),
    );
    lines.push("");
    lines.push(metaField("Id", Colors.muted(decisionId)));
    lines.push(metaField("Reason", Colors.primary(reason)));
    this.builder.addPrompt(lines.join("\n"));
    this.builder.addData({
      decisionId,
      status: "active",
      reason,
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to restore decision")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
