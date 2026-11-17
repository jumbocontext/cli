import { EvolveStepResult } from "../../../../application/evolve/EvolveStepResult.js";
import { TerminalOutput } from "../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../output/TerminalOutputBuilder.js";
import { Colors, Symbols } from "../../rendering/StyleConfig.js";
import {
  heading,
  contentLine,
  metaField,
} from "../../rendering/OutputLayout.js";

export class EvolveOutputBuilder {
  private readonly builder = new TerminalOutputBuilder();

  buildSuccess(steps: EvolveStepResult[]): TerminalOutput {
    const hasFailures = steps.some((step) => step.status === "failed");

    this.builder.reset();
    const lines: string[] = [];
    lines.push("");
    lines.push(heading("Evolve"));
    lines.push(
      hasFailures
        ? contentLine(
            `${Symbols.warning} ${Colors.warning("Completed with errors")}`,
          )
        : contentLine(`${Symbols.check} ${Colors.success("Complete")}`),
    );
    lines.push("");
    for (const step of steps) {
      const statusColor =
        step.status === "failed" ? Colors.error : Colors.success;
      lines.push(metaField(step.name, statusColor(step.status), 20));
      if (step.detail) {
        lines.push(contentLine(Colors.muted(step.detail)));
      }
    }
    this.builder.addPrompt(lines.join("\n"));
    this.builder.addData(
      steps.map((step) => ({
        step: step.name,
        status: step.status,
        ...(step.detail ? { detail: step.detail } : {}),
      })),
    );
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(`${Symbols.cross} ${Colors.error("Evolve failed")}`);
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }

  buildConfirmationRequired(): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];
    lines.push("");
    lines.push(heading("Confirmation Required"));
    lines.push(
      contentLine(
        `${Symbols.warning} ${Colors.warning("This will update schema, migrate data, refresh managed agent files")}`,
      ),
    );
    lines.push(
      contentLine(
        Colors.warning("and skills, ensure settings, and rebuild projections."),
      ),
    );
    lines.push(contentLine(Colors.primary("Use --yes flag to proceed.")));
    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }
}
