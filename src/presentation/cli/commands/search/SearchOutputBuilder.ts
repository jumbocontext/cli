import { SearchHit } from "../../../../application/context/search/SearchHit.js";
import { SearchHitGroup } from "../../../../application/context/search/SearchHitGroup.js";
import { SearchResponse } from "../../../../application/context/search/SearchResponse.js";
import { TerminalOutput } from "../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../output/TerminalOutputBuilder.js";
import { Colors, BrandColors } from "../../rendering/StyleConfig.js";
import {
  contentLine,
  heading,
  metaField,
  wrapContent,
} from "../../rendering/OutputLayout.js";

export type SearchOutputFormat = "default" | "compact";

interface SearchOutputCriteria {
  readonly query: string;
  readonly category?: string;
  readonly limit?: number;
}

export class SearchOutputBuilder {
  private readonly builder = new TerminalOutputBuilder();

  build(
    response: SearchResponse,
    criteria: SearchOutputCriteria,
    format: SearchOutputFormat,
  ): TerminalOutput {
    this.builder.reset();

    if (response.hits.length === 0) {
      this.builder.addPrompt(
        Colors.muted(`No memory search results matched "${criteria.query}".`),
      );
      return this.builder.build();
    }

    const lines: string[] = [];
    lines.push("");
    lines.push(heading(`Search Results (${response.hits.length})`));

    for (const group of this.resolveGroups(response)) {
      lines.push("");
      lines.push(
        contentLine(
          Colors.bold(
            `${formatCategory(group.category)} (${group.hits.length})`,
          ),
        ),
      );

      for (const hit of group.hits) {
        lines.push(...this.renderHit(hit, format));
      }
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(
    response: SearchResponse,
    criteria: SearchOutputCriteria,
    format: SearchOutputFormat,
  ): TerminalOutput {
    this.builder.reset();

    this.builder.addData({
      query: criteria.query,
      category: criteria.category ?? null,
      limit: criteria.limit ?? null,
      count: response.hits.length,
      groups: this.resolveGroups(response).map((group) => ({
        category: group.category,
        count: group.hits.length,
        hits: group.hits.map((hit) => serializeHit(hit, format)),
      })),
    });

    return this.builder.build();
  }

  private renderHit(hit: SearchHit, format: SearchOutputFormat): string[] {
    if (format === "compact") {
      return [
        contentLine(
          `${Colors.muted(hit.source.id)}  ${BrandColors.accentCyan(hit.title)}  ${Colors.dim(`score ${hit.score}`)}`,
        ),
      ];
    }

    const lines: string[] = [];
    lines.push(
      contentLine(
        `${BrandColors.accentCyan(hit.title)} ${Colors.dim(`score ${hit.score}`)}`,
      ),
    );

    if (hit.summary) {
      lines.push(...wrapContent(hit.summary));
    }

    if (hit.snippet) {
      lines.push(...wrapContent(hit.snippet));
    }

    lines.push(
      metaField(
        "Source",
        Colors.muted(`${hit.source.type}:${hit.source.id}`),
        8,
      ),
    );

    const facets = formatFacets(hit);
    if (facets.length > 0) {
      lines.push(metaField("Facets", Colors.muted(facets.join(", ")), 8));
    }

    return lines;
  }

  private resolveGroups(response: SearchResponse): readonly SearchHitGroup[] {
    if (response.groups) {
      return response.groups;
    }

    const groups = new Map<string, SearchHit[]>();
    for (const hit of response.hits) {
      const hits = groups.get(hit.category) ?? [];
      hits.push(hit);
      groups.set(hit.category, hits);
    }

    return [...groups.entries()].map(([category, hits]) => ({
      category,
      hits,
    }));
  }
}

function serializeHit(
  hit: SearchHit,
  format: SearchOutputFormat,
): Record<string, unknown> {
  const base = {
    source: hit.source,
    category: hit.category,
    title: hit.title,
    score: hit.score,
  };

  if (format === "compact") {
    return base;
  }

  return {
    ...base,
    summary: hit.summary,
    snippet: hit.snippet,
    facets: hit.facets,
  };
}

function formatCategory(category: string): string {
  return category
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatFacets(hit: SearchHit): string[] {
  return Object.entries(hit.facets).map(
    ([key, value]) => `${key}: ${formatFacetValue(value)}`,
  );
}

function formatFacetValue(value: SearchHit["facets"][string]): string {
  if (Array.isArray(value)) {
    return value.join("|");
  }

  return value === null ? "null" : String(value);
}
