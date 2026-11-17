import { RebuildDatabaseResponse } from "../../../../application/maintenance/db/rebuild/RebuildDatabaseResponse.js";
import { TerminalOutput } from "../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../output/TerminalOutputBuilder.js";
import { Colors, Symbols } from "../../rendering/StyleConfig.js";
import {
  heading,
  contentLine,
  metaField,
} from "../../rendering/OutputLayout.js";

export class HealOutputBuilder extends TerminalOutputBuilder {
  buildSuccess(response: RebuildDatabaseResponse): TerminalOutput {
    this.reset();
    const lines: string[] = [];
    lines.push("");
    lines.push(heading("Projection Rebuild"));
    lines.push(
      contentLine(`${Symbols.check} ${Colors.success("Rebuild complete")}`),
    );
    lines.push("");
    lines.push(
      metaField(
        "Status",
        response.success ? Colors.success("success") : Colors.error("failed"),
        16,
      ),
    );
    lines.push(
      metaField(
        "Events replayed",
        Colors.primary(String(response.eventsReplayed)),
        16,
      ),
    );
    this.addPrompt(lines.join("\n"));
    this.addData(this.buildStructuredOutput(response));
    return this.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.reset();
    this.addPrompt(
      `${Symbols.cross} ${Colors.error("Projection rebuild failed.")}`,
    );
    this.addData({
      success: false,
      message: error instanceof Error ? error.message : error,
    });
    return this.build();
  }

  buildConfirmationRequired(): TerminalOutput {
    this.reset();
    const lines: string[] = [];
    lines.push("");
    lines.push(heading("Confirmation Required"));
    lines.push(
      contentLine(
        `${Symbols.warning} ${Colors.warning("Healing projections will discard the current materialized views")}`,
      ),
    );
    lines.push(contentLine(Colors.warning("and replay the event store.")));
    lines.push(contentLine(Colors.primary("Use --yes flag to proceed.")));
    this.addPrompt(lines.join("\n"));
    return this.build();
  }

  buildStructuredOutput(response: RebuildDatabaseResponse) {
    return {
      success: response.success,
      eventsReplayed: response.eventsReplayed,
    };
  }
}
