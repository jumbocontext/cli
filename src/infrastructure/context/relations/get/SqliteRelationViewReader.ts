/**
 * SqliteRelationViewReader - SQLite reader for listing relations.
 *
 * Implements IRelationViewReader for retrieving relation list
 * from the SQLite read model with optional entity filtering.
 */

import { Database } from "better-sqlite3";
import { EntityTypeValue } from "../../../../domain/relations/Constants.js";
import { IRelationViewReader } from "../../../../application/context/relations/get/IRelationViewReader.js";
import { RelationListFilter } from "../../../../application/context/relations/get/RelationListFilter.js";
import { RelationView } from "../../../../application/context/relations/RelationView.js";
import { RelationRecord } from "../RelationRecord.js";
import { RelationRecordMapper } from "../RelationRecordMapper.js";

export class SqliteRelationViewReader implements IRelationViewReader {
  private readonly mapper = new RelationRecordMapper();

  constructor(private db: Database) {}

  async findAll(filter?: RelationListFilter): Promise<RelationView[]> {
    let query = "SELECT * FROM relation_views WHERE 1=1";
    const params: (string | number)[] = [];

    // Apply status filter (default to active only)
    if (!filter?.status || filter.status === "active") {
      query += " AND status = 'active'";
    } else if (filter.status === "deactivated") {
      query += " AND status = 'deactivated'";
    } else if (filter.status === "removed") {
      query += " AND status = 'removed'";
    }
    // If status === 'all', no filter applied

    this.appendEndpointFilter(filter, params, (clause) => {
      query += ` AND ${clause}`;
    });

    if (filter?.relationType) {
      query += " AND relationType = ?";
      params.push(filter.relationType);
    }

    if (filter?.strength) {
      query += " AND strength = ?";
      params.push(filter.strength);
    }

    query += " ORDER BY createdAt ASC, relationId ASC";

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) =>
      this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)),
    );
  }

  async findEndpointTypes(entityId: string): Promise<EntityTypeValue[]> {
    const rows = this.db
      .prepare(
        `
      SELECT entityType
      FROM (
        SELECT fromEntityType AS entityType FROM relation_views WHERE fromEntityId = ?
        UNION
        SELECT toEntityType AS entityType FROM relation_views WHERE toEntityId = ?
      )
      ORDER BY entityType ASC
    `,
      )
      .all(entityId, entityId) as Array<{ entityType: EntityTypeValue }>;

    return rows.map((row) => row.entityType);
  }

  private appendEndpointFilter(
    filter: RelationListFilter | undefined,
    params: (string | number)[],
    append: (clause: string) => void,
  ): void {
    const entityType = filter?.entity?.entityType ?? filter?.entityType;
    const entityId = filter?.entity?.entityId ?? filter?.entityId;
    const from = this.endpointClause("from", entityType, entityId);
    const to = this.endpointClause("to", entityType, entityId);

    if (!from && !to) {
      if (filter?.relatedEntityType) {
        append("(fromEntityType = ? OR toEntityType = ?)");
        params.push(filter.relatedEntityType, filter.relatedEntityType);
      }
      return;
    }

    const direction = filter?.direction ?? "both";
    if (direction === "out") {
      append(
        `${from}${filter?.relatedEntityType ? " AND toEntityType = ?" : ""}`,
      );
      this.pushEndpointParams(params, entityType, entityId);
      if (filter?.relatedEntityType) params.push(filter.relatedEntityType);
      return;
    }

    if (direction === "in") {
      append(
        `${to}${filter?.relatedEntityType ? " AND fromEntityType = ?" : ""}`,
      );
      this.pushEndpointParams(params, entityType, entityId);
      if (filter?.relatedEntityType) params.push(filter.relatedEntityType);
      return;
    }

    const outgoing = `${from}${filter?.relatedEntityType ? " AND toEntityType = ?" : ""}`;
    const incoming = `${to}${filter?.relatedEntityType ? " AND fromEntityType = ?" : ""}`;
    append(`((${outgoing}) OR (${incoming}))`);
    this.pushEndpointParams(params, entityType, entityId);
    if (filter?.relatedEntityType) params.push(filter.relatedEntityType);
    this.pushEndpointParams(params, entityType, entityId);
    if (filter?.relatedEntityType) params.push(filter.relatedEntityType);
  }

  private endpointClause(
    endpoint: "from" | "to",
    entityType: EntityTypeValue | undefined,
    entityId: string | undefined,
  ): string | undefined {
    if (entityType && entityId) {
      return `${endpoint}EntityType = ? AND ${endpoint}EntityId = ?`;
    }
    if (entityType) return `${endpoint}EntityType = ?`;
    if (entityId) return `${endpoint}EntityId = ?`;
    return undefined;
  }

  private pushEndpointParams(
    params: (string | number)[],
    entityType: EntityTypeValue | undefined,
    entityId: string | undefined,
  ): void {
    if (entityType) params.push(entityType);
    if (entityId) params.push(entityId);
  }

  private mapRowToRecord(row: Record<string, unknown>): RelationRecord {
    return {
      id: row.relationId as string,
      fromEntityType: row.fromEntityType as string,
      fromEntityId: row.fromEntityId as string,
      toEntityType: row.toEntityType as string,
      toEntityId: row.toEntityId as string,
      relationType: row.relationType as string,
      strength: (row.strength as string) ?? null,
      description: row.description as string,
      status: row.status as string,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
