import { Database } from "better-sqlite3";
import { IRelationNodeCatalog } from "../../../../application/context/relations/audit/IRelationNodeCatalog.js";
import { RelationNodeCatalogEntry } from "../../../../application/context/relations/audit/RelationNodeCatalogEntry.js";
import { EntityType, EntityTypeValue } from "../../../../domain/relations/Constants.js";

interface CatalogRow {
  entityType: string;
  entityId: string;
  lifecycleState: string;
  isCurrent: number;
}

const SELECT_BY_ENTITY_TYPE: Record<EntityTypeValue, string> = {
  [EntityType.SESSION]: `SELECT 'session' entityType, sessionId entityId, status lifecycleState, 1 isCurrent FROM session_views`,
  [EntityType.GOAL]: `SELECT 'goal' entityType, goalId entityId, status lifecycleState, 1 isCurrent FROM goal_views`,
  [EntityType.DECISION]: `SELECT 'decision' entityType, decisionId entityId, status lifecycleState, status <> 'removed' isCurrent FROM decision_views`,
  [EntityType.ARCHITECTURE]: `SELECT 'architecture' entityType, architectureId entityId, CASE deprecated WHEN 1 THEN 'deprecated' ELSE 'active' END lifecycleState, 1 isCurrent FROM architecture_views`,
  [EntityType.COMPONENT]: `SELECT 'component' entityType, componentId entityId, status lifecycleState, status <> 'removed' isCurrent FROM component_views`,
  [EntityType.DEPENDENCY]: `SELECT 'dependency' entityType, dependencyId entityId, status lifecycleState, status <> 'removed' isCurrent FROM dependency_views`,
  [EntityType.GUIDELINE]: `SELECT 'guideline' entityType, guidelineId entityId, CASE isRemoved WHEN 1 THEN 'removed' ELSE 'active' END lifecycleState, isRemoved = 0 isCurrent FROM guideline_views`,
  [EntityType.PROJECT]: `SELECT 'project' entityType, projectId entityId, 'active' lifecycleState, 1 isCurrent FROM project_views`,
  [EntityType.AUDIENCE]: `SELECT 'audience' entityType, audienceId entityId, CASE isRemoved WHEN 1 THEN 'removed' ELSE 'active' END lifecycleState, isRemoved = 0 isCurrent FROM audience_views`,
  [EntityType.INVARIANT]: `SELECT 'invariant' entityType, invariantId entityId, 'active' lifecycleState, 1 isCurrent FROM invariant_views`,
  [EntityType.PAIN]: `SELECT 'pain' entityType, painId entityId, status lifecycleState, status <> 'removed' isCurrent FROM audience_pain_views`,
  [EntityType.VALUE]: `SELECT 'value' entityType, valuePropositionId entityId, 'active' lifecycleState, 1 isCurrent FROM value_proposition_views`,
  [EntityType.RELATION]: `SELECT 'relation' entityType, relationId entityId, status lifecycleState, status <> 'removed' isCurrent FROM relation_views`,
};

export class SqliteRelationNodeCatalog implements IRelationNodeCatalog {
  constructor(private readonly db: Database) {}

  async findAll(): Promise<RelationNodeCatalogEntry[]> {
    const query = Object.values(SELECT_BY_ENTITY_TYPE).join(" UNION ALL ") +
      " ORDER BY entityType ASC, entityId ASC";
    const rows = this.db.prepare(query).all() as CatalogRow[];
    return rows.map((row) => ({
      entityType: row.entityType as EntityTypeValue,
      entityId: row.entityId,
      lifecycleState: row.lifecycleState,
      isCurrent: row.isCurrent === 1,
    }));
  }

  getSupportedEntityTypes(): EntityTypeValue[] {
    return Object.keys(SELECT_BY_ENTITY_TYPE).sort() as EntityTypeValue[];
  }
}
