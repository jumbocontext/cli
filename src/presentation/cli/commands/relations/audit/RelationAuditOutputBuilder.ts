import { RelationAuditResult } from "../../../../../application/context/relations/audit/RelationAuditResult.js";
import { RelationAuditCheck } from "../../../../../domain/relations/Constants.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { Symbols } from "../../../rendering/StyleConfig.js";

export class RelationAuditOutputBuilder {
  private readonly builder = new TerminalOutputBuilder();

  build(result: RelationAuditResult): TerminalOutput {
    this.builder.reset();
    const lines = ["Relation Graph Audit"];
    if (result.entityType) lines.push(`Entity type: ${result.entityType}`);

    if (result.requestedChecks.includes(RelationAuditCheck.SUMMARY)) {
      lines.push("", "Summary");
      lines.push(`  Nodes: ${result.summary.nodes.count}`);
      this.appendCounts(lines, result.summary.nodes.byEntityType, "    ");
      lines.push(`  Relations: ${result.summary.relations.count}`);
      lines.push("  By relation type:");
      this.appendCounts(lines, result.summary.relations.byRelationType, "    ");
      lines.push("  By strength:");
      this.appendCounts(lines, result.summary.relations.byStrength, "    ");
      lines.push("  By status:");
      this.appendCounts(lines, result.summary.relations.byStatus, "    ");
    }

    if (result.requestedChecks.includes(RelationAuditCheck.DANGLING)) {
      lines.push("", `Dangling relations (${result.findings.dangling.count})`);
      this.appendEmpty(lines, result.findings.dangling.count);
      for (const finding of result.findings.dangling.items) {
        const missing = finding.missingEndpoints
          .map((endpoint) => `${endpoint.entityType}:${endpoint.entityId}`)
          .join(", ");
        lines.push(`  ${finding.relationId}: missing ${missing}`);
      }
    }

    if (result.requestedChecks.includes(RelationAuditCheck.ISOLATED)) {
      lines.push("", `Isolated entities (${result.findings.isolated.count})`);
      this.appendEmpty(lines, result.findings.isolated.count);
      for (const finding of result.findings.isolated.items) {
        lines.push(
          `  ${finding.entityType}:${finding.entityId} [${finding.lifecycleState}]`,
        );
      }
    }

    if (result.requestedChecks.includes(RelationAuditCheck.INACTIVE_ONLY)) {
      lines.push(
        "",
        `Inactive-only entities (${result.findings.inactiveOnly.count})`,
      );
      this.appendEmpty(lines, result.findings.inactiveOnly.count);
      for (const finding of result.findings.inactiveOnly.items) {
        lines.push(
          `  ${finding.entityType}:${finding.entityId} [${finding.lifecycleState}] relations: ${finding.relationIds.join(", ")}`,
        );
      }
    }

    if (result.requestedChecks.includes(RelationAuditCheck.AMBIGUOUS_ID)) {
      lines.push(
        "",
        `Ambiguous entity IDs (${result.findings.ambiguousId.count})`,
      );
      this.appendEmpty(lines, result.findings.ambiguousId.count);
      for (const finding of result.findings.ambiguousId.items) {
        const typedIds = finding.entityTypes.map(
          (entityType) => `${entityType}:${finding.entityId}`,
        );
        lines.push(`  ${finding.entityId}: ${typedIds.join(", ")}`);
      }
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(result: RelationAuditResult): TerminalOutput {
    this.builder.reset();
    this.builder.addData({
      requestedChecks: [...result.requestedChecks],
      filter: { entityType: result.entityType },
      summary: result.summary,
      findings: result.findings,
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    const message = error instanceof Error ? error.message : error;
    this.builder.addPrompt(
      `${Symbols.cross} Failed to audit relations: ${message}`,
    );
    this.builder.addData({ error: "Failed to audit relations", message });
    return this.builder.build();
  }

  private appendCounts(
    lines: string[],
    counts: Readonly<Record<string, number>>,
    indent: string,
  ): void {
    const entries = Object.entries(counts);
    if (entries.length === 0) {
      lines.push(`${indent}None`);
      return;
    }
    for (const [label, count] of entries)
      lines.push(`${indent}${label}: ${count}`);
  }

  private appendEmpty(lines: string[], count: number): void {
    if (count === 0) lines.push("  None");
  }
}
