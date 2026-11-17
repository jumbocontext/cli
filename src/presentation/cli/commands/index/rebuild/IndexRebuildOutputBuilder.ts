import { SearchIndexRebuildResponse } from "../../../../../application/context/search/SearchIndexRebuildResponse.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import {
  contentLine,
  heading,
  metaField,
} from "../../../rendering/OutputLayout.js";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";

export class IndexRebuildOutputBuilder {
  private readonly builder = new TerminalOutputBuilder();

  buildSuccess(response: SearchIndexRebuildResponse): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];
    lines.push("");
    lines.push(heading("Search Index Rebuild"));
    lines.push(
      contentLine(`${Symbols.check} ${Colors.success("Rebuild complete")}`),
    );
    lines.push("");
    lines.push(metaField("Status", Colors.success("success"), 18));
    lines.push(
      metaField(
        "Events inspected",
        Colors.primary(String(response.eventsInspected)),
        18,
      ),
    );
    lines.push(
      metaField(
        "Documents indexed",
        Colors.primary(String(response.documentsIndexed)),
        18,
      ),
    );
    lines.push(
      metaField(
        "Removed entries",
        Colors.primary(String(response.removedEntries)),
        18,
      ),
    );

    const categories = Object.entries(response.countsByCategory);
    if (categories.length > 0) {
      lines.push("");
      lines.push(contentLine(Colors.bold("Indexed Categories")));
      for (const [category, count] of categories) {
        lines.push(metaField(category, Colors.primary(String(count)), 18));
      }
    }

    this.builder.addPrompt(lines.join("\n"));
    this.builder.addData(this.buildStructuredOutput(response));
    return this.builder.build();
  }

  buildFailure(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Search index rebuild failed.")}`,
    );
    this.builder.addData(this.buildFailureData(error));
    return this.builder.build();
  }

  buildStructuredOutput(response: SearchIndexRebuildResponse) {
    return {
      success: response.success,
      eventsInspected: response.eventsInspected,
      documentsIndexed: response.documentsIndexed,
      removedEntries: response.removedEntries,
      countsByCategory: response.countsByCategory,
    };
  }

  buildFailureData(error: Error | string) {
    return {
      success: false,
      error: "Search index rebuild failed",
      details: error instanceof Error ? error.message : error,
    };
  }
}
