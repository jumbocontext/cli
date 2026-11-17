import { SearchDocument } from "../../../application/context/search/SearchDocument.js";
import { SearchFacetValue } from "../../../application/context/search/SearchFacetValue.js";
import { SearchHit } from "../../../application/context/search/SearchHit.js";
import { SearchIndexRecord } from "./SearchIndexRecord.js";

export class SearchIndexRecordMapper {
  toDocument(record: SearchIndexRecord): SearchDocument {
    return {
      source: { type: record.sourceType, id: record.sourceId },
      category: record.category,
      title: record.title,
      summary: record.summary,
      content: record.content,
      facets: this.parseJson(record.facets),
      metadata: this.parseJson(record.metadata),
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  toHit(
    record: SearchIndexRecord,
    query: string | undefined,
    score: number,
  ): SearchHit {
    return {
      source: { type: record.sourceType, id: record.sourceId },
      category: record.category,
      title: record.title,
      summary: record.summary,
      snippet: this.buildSnippet(record, query),
      facets: this.parseJson(record.facets),
      score,
    };
  }

  private parseJson(value: string): Record<string, SearchFacetValue> {
    const parsed = JSON.parse(value) as Record<string, SearchFacetValue>;
    return parsed;
  }

  private buildSnippet(
    record: SearchIndexRecord,
    query: string | undefined,
  ): string | null {
    const normalizedQuery = query?.trim().toLowerCase();
    if (!normalizedQuery) return record.summary;

    const normalizedContent = record.content.toLowerCase();
    const matchIndex = normalizedContent.indexOf(normalizedQuery);
    if (matchIndex < 0) return record.summary;

    const start = Math.max(0, matchIndex - 40);
    const end = Math.min(
      record.content.length,
      matchIndex + normalizedQuery.length + 80,
    );
    return record.content.slice(start, end).replace(/\s+/g, " ").trim();
  }
}
