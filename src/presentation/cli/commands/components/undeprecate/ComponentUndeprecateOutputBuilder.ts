import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import {
  Colors,
  BrandColors,
  Symbols,
} from "../../../rendering/StyleConfig.js";
import {
  heading,
  contentLine,
  metaField,
} from "../../../rendering/OutputLayout.js";

export class ComponentUndeprecateOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  buildSuccess(
    componentId: string,
    name: string,
    reason: string,
  ): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];
    lines.push("");
    lines.push(heading("Component Undeprecated"));
    lines.push(
      contentLine(
        `${Symbols.check} ${Colors.success("Component has been undeprecated")}`,
      ),
    );
    lines.push("");
    lines.push(metaField("Name", BrandColors.accentCyan(name)));
    lines.push(metaField("Id", Colors.muted(componentId)));
    lines.push(metaField("Reason", Colors.primary(reason)));
    this.builder.addPrompt(lines.join("\n"));
    this.builder.addData({
      componentId,
      name,
      status: "active",
      reason,
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to undeprecate component")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
