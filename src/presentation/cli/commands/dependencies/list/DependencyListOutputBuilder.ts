import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { DependencyView } from "../../../../../application/context/dependencies/DependencyView.js";
import {
  Colors,
  BrandColors,
  Symbols,
} from "../../../rendering/StyleConfig.js";
import {
  heading,
  contentLine,
  metaField,
  wrapContent,
} from "../../../rendering/OutputLayout.js";

export class DependencyListOutputBuilder {
  private builder = new TerminalOutputBuilder();

  build(dependencies: DependencyView[], filter: string): TerminalOutput {
    this.builder.reset();
    const filterLabel = filter === "all" ? "" : ` (${filter})`;
    const lines: string[] = [];

    lines.push("");
    lines.push(heading(`Dependencies${filterLabel} (${dependencies.length})`));

    for (let i = 0; i < dependencies.length; i++) {
      const d = dependencies[i];
      if (i > 0) lines.push("");
      const version = d.versionConstraint ? `@${d.versionConstraint}` : "";
      lines.push(
        contentLine(
          BrandColors.accentCyan(`${d.ecosystem}:${d.packageName}${version}`),
        ),
      );
      if (d.name) {
        lines.push(metaField("Name", Colors.primary(d.name), 10));
      }
      if (d.contract) {
        lines.push(...wrapContent(d.contract));
      }
      if (d.endpoint) {
        lines.push(metaField("Endpoint", Colors.muted(d.endpoint), 10));
      }
      lines.push(metaField("ID", Colors.muted(d.dependencyId), 10));
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(
    dependencies: DependencyView[],
    filter: string,
  ): TerminalOutput {
    this.builder.reset();
    this.builder.addData({
      count: dependencies.length,
      filter,
      dependencies: dependencies.map((d) => ({
        dependencyId: d.dependencyId,
        name: d.name,
        ecosystem: d.ecosystem,
        packageName: d.packageName,
        versionConstraint: d.versionConstraint,
        contract: d.contract,
        endpoint: d.endpoint,
        status: d.status,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to list dependencies")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
