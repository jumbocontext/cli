/**
 * DependencySearchOutputBuilder - Presentation layer output builder
 * for the dependencies search command.
 *
 * Handles both TTY text and structured JSON output modes.
 * Supports default (full detail) and compact (id, name, ecosystem, package) formats.
 */

import { DependencyView } from "../../../../../application/context/dependencies/DependencyView.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import {
  contentLine,
  heading,
  metaField,
  wrapContent,
} from "../../../rendering/OutputLayout.js";
import { BrandColors, Colors } from "../../../rendering/StyleConfig.js";

export type DependencySearchOutputFormat = "default" | "compact";

export class DependencySearchOutputBuilder {
  private builder = new TerminalOutputBuilder();

  build(
    dependencies: DependencyView[],
    format: DependencySearchOutputFormat,
  ): TerminalOutput {
    this.builder.reset();

    if (dependencies.length === 0) {
      this.builder.addPrompt(
        Colors.muted("No dependencies matched the search criteria."),
      );
      return this.builder.build();
    }

    const lines: string[] = [];
    lines.push("");
    lines.push(heading(`Dependencies (${dependencies.length})`));

    if (format === "compact") {
      for (const d of dependencies) {
        lines.push(
          contentLine(
            `${Colors.muted(d.dependencyId)}  ${BrandColors.accentCyan(d.name)}  ${Colors.muted(`${d.ecosystem}:${d.packageName}`)}`,
          ),
        );
      }
    } else {
      for (let i = 0; i < dependencies.length; i++) {
        const d = dependencies[i];
        if (i > 0) lines.push("");
        const version = d.versionConstraint ? `@${d.versionConstraint}` : "";
        lines.push(
          contentLine(
            `${BrandColors.accentCyan(`${d.ecosystem}:${d.packageName}${version}`)} ${Colors.dim(`[${d.status}]`)}`,
          ),
        );
        lines.push(metaField("Name", Colors.primary(d.name), 10));
        if (d.contract) {
          lines.push(...wrapContent(d.contract));
        }
        if (d.endpoint) {
          lines.push(metaField("Endpoint", Colors.muted(d.endpoint), 10));
        }
        lines.push(metaField("ID", Colors.muted(d.dependencyId), 10));
      }
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(
    dependencies: DependencyView[],
    format: DependencySearchOutputFormat,
  ): TerminalOutput {
    this.builder.reset();

    if (format === "compact") {
      this.builder.addData({
        count: dependencies.length,
        dependencies: dependencies.map((d) => ({
          dependencyId: d.dependencyId,
          name: d.name,
          ecosystem: d.ecosystem,
          packageName: d.packageName,
        })),
      });
    } else {
      this.builder.addData({
        count: dependencies.length,
        dependencies: dependencies.map((d) => ({
          dependencyId: d.dependencyId,
          name: d.name,
          ecosystem: d.ecosystem,
          packageName: d.packageName,
          versionConstraint: d.versionConstraint,
          endpoint: d.endpoint,
          contract: d.contract,
          status: d.status,
          version: d.version,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          removedAt: d.removedAt,
          removalReason: d.removalReason,
        })),
      });
    }

    return this.builder.build();
  }
}
