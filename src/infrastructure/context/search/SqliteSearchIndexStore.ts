import { Database } from "better-sqlite3";
import { ISearchIndexWriter } from "../../../application/context/search/ISearchIndexWriter.js";
import { ISearchIndexReader } from "../../../application/context/search/ISearchIndexReader.js";
import { ISearchIndexRebuildStore } from "../../../application/context/search/ISearchIndexRebuildStore.js";
import { SearchCategory } from "../../../application/context/search/SearchCategory.js";
import { SearchCriteria } from "../../../application/context/search/SearchCriteria.js";
import { SearchDocument } from "../../../application/context/search/SearchDocument.js";
import { SearchDocumentSource } from "../../../application/context/search/SearchDocumentSource.js";
import { SearchHit } from "../../../application/context/search/SearchHit.js";
import { SearchResultLimit } from "../../../application/context/search/SearchResultLimit.js";
import { SearchIndexRecord } from "./SearchIndexRecord.js";
import { SearchIndexRecordMapper } from "./SearchIndexRecordMapper.js";

export class SqliteSearchIndexStore
  implements ISearchIndexWriter, ISearchIndexReader, ISearchIndexRebuildStore
{
  private readonly mapper = new SearchIndexRecordMapper();

  constructor(private readonly db: Database) {}

  async upsert(document: SearchDocument): Promise<void> {
    this.db
      .prepare(
        `
        INSERT INTO search_index_entries (
          sourceType, sourceId, category, title, summary, content,
          facets, metadata, version, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(sourceType, sourceId) DO UPDATE SET
          category = excluded.category,
          title = excluded.title,
          summary = excluded.summary,
          content = excluded.content,
          facets = excluded.facets,
          metadata = excluded.metadata,
          version = excluded.version,
          updatedAt = excluded.updatedAt
      `,
      )
      .run(
        document.source.type,
        document.source.id,
        document.category,
        document.title,
        document.summary,
        document.content,
        JSON.stringify(document.facets),
        JSON.stringify(document.metadata),
        document.version,
        document.createdAt,
        document.updatedAt,
      );
  }

  async remove(source: SearchDocumentSource): Promise<void> {
    this.db
      .prepare(
        "DELETE FROM search_index_entries WHERE sourceType = ? AND sourceId = ?",
      )
      .run(source.type, source.id);
  }

  async findBySource(
    source: SearchDocumentSource,
  ): Promise<SearchDocument | null> {
    const row = this.db
      .prepare(
        "SELECT * FROM search_index_entries WHERE sourceType = ? AND sourceId = ?",
      )
      .get(source.type, source.id) as SearchIndexRecord | undefined;

    return row ? this.mapper.toDocument(row) : null;
  }

  async clear(): Promise<number> {
    const result = this.db.prepare("DELETE FROM search_index_entries").run();
    return result.changes;
  }

  async countByCategory(): Promise<
    Readonly<Partial<Record<SearchCategory, number>>>
  > {
    const rows = this.db
      .prepare(
        `
        SELECT category, COUNT(*) AS count
        FROM search_index_entries
        GROUP BY category
        ORDER BY category ASC
      `,
      )
      .all() as Array<{ category: SearchCategory; count: number }>;

    return rows.reduce<Partial<Record<SearchCategory, number>>>(
      (counts, row) => {
        counts[row.category] = row.count;
        return counts;
      },
      {},
    );
  }

  async search(criteria: SearchCriteria): Promise<SearchHit[]> {
    const clauses: string[] = [];
    const params: unknown[] = [];
    const query = criteria.query?.trim();

    if (criteria.category) {
      clauses.push("category = ?");
      params.push(criteria.category);
    }

    if (query) {
      const like = `%${query.toLowerCase()}%`;
      clauses.push(`(
        LOWER(title) LIKE ?
        OR LOWER(COALESCE(summary, '')) LIKE ?
        OR LOWER(content) LIKE ?
      )`);
      params.push(like, like, like);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = Math.min(
      Math.max(
        criteria.limit ?? SearchResultLimit.DEFAULT,
        SearchResultLimit.MIN,
      ),
      SearchResultLimit.MAX,
    );
    const rows = this.db
      .prepare(
        `
        SELECT *,
          CASE
            WHEN ? IS NOT NULL AND LOWER(title) LIKE ? THEN 30
            WHEN ? IS NOT NULL AND LOWER(COALESCE(summary, '')) LIKE ? THEN 20
            WHEN ? IS NOT NULL AND LOWER(content) LIKE ? THEN 10
            ELSE 1
          END AS score
        FROM search_index_entries
        ${where}
        ORDER BY score DESC, updatedAt DESC, title ASC
        LIMIT ?
      `,
      )
      .all(
        query ?? null,
        query ? `%${query.toLowerCase()}%` : "",
        query ?? null,
        query ? `%${query.toLowerCase()}%` : "",
        query ?? null,
        query ? `%${query.toLowerCase()}%` : "",
        ...params,
        limit,
      ) as (SearchIndexRecord & { score: number })[];

    return rows.map((row) => this.mapper.toHit(row, query, row.score));
  }
}
