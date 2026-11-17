import { IGoalContextAssembler } from "../../application/context/goals/get/IGoalContextAssembler.js";
import { ContextualGoalView } from "../../application/context/goals/get/ContextualGoalView.js";
import { RelatedContext } from "../../application/context/goals/get/RelatedContext.js";
import { IGoalReader } from "../../application/context/goals/start/IGoalReader.js";
import { IRelationReader } from "../../application/context/relations/IRelationReader.js";
import { IComponentViewReader } from "../../application/context/components/get/IComponentViewReader.js";
import { IDependencyViewReader } from "../../application/context/dependencies/get/IDependencyViewReader.js";
import { IDecisionViewReader } from "../../application/context/decisions/get/IDecisionViewReader.js";
import { IInvariantViewReader } from "../../application/context/invariants/get/IInvariantViewReader.js";
import { IGuidelineViewReader } from "../../application/context/guidelines/get/IGuidelineViewReader.js";
import { ComponentView } from "../../application/context/components/ComponentView.js";
import { DependencyView } from "../../application/context/dependencies/DependencyView.js";
import { DecisionView } from "../../application/context/decisions/DecisionView.js";
import { InvariantView } from "../../application/context/invariants/InvariantView.js";
import { GuidelineView } from "../../application/context/guidelines/GuidelineView.js";
import { RelationView } from "../../application/context/relations/RelationView.js";
import { EntityType } from "../../domain/relations/Constants.js";

/**
 * SqliteGoalContextAssembler - Assembles goal context from relations and entity readers.
 *
 * Implements relation-based context aggregation:
 * 1. Query active relations from goal
 * 2. Group related entity IDs by type
 * 3. Batch fetch entities (one query per type)
 *    - Fetches only related entities
 * 4. Merge entity data with relation metadata into RelatedContext<T>
 * 5. Return complete ContextualGoalView (goal + context)
 *
 * Performance: ~7 queries worst case (goal + relations + 5 entity types)
 * All queries are indexed. Can optimize with caching if needed.
 */
export class SqliteGoalContextAssembler implements IGoalContextAssembler {
  constructor(
    private readonly goalReader: IGoalReader,
    private readonly relationReader: IRelationReader,
    private readonly componentReader: IComponentViewReader,
    private readonly dependencyReader: IDependencyViewReader,
    private readonly decisionReader: IDecisionViewReader,
    private readonly invariantReader: IInvariantViewReader,
    private readonly guidelineReader: IGuidelineViewReader,
  ) {}

  async assembleContextForGoal(
    goalId: string,
  ): Promise<ContextualGoalView | null> {
    // 1. Fetch goal
    const goal = await this.goalReader.findById(goalId);
    if (!goal) return null;

    // 2. Query relations where fromEntity = goal and status = active
    const allRelations = await this.relationReader.findByFromEntity(
      EntityType.GOAL,
      goalId,
    );
    const relations = allRelations.filter((r) => r.status === "active");

    // 3. Group related entity IDs by type
    const componentIds = relations
      .filter((r) => r.toEntityType === EntityType.COMPONENT)
      .map((r) => r.toEntityId);

    const dependencyIds = relations
      .filter((r) => r.toEntityType === EntityType.DEPENDENCY)
      .map((r) => r.toEntityId);

    const decisionIds = relations
      .filter((r) => r.toEntityType === EntityType.DECISION)
      .map((r) => r.toEntityId);

    const invariantIds = relations
      .filter((r) => r.toEntityType === EntityType.INVARIANT)
      .map((r) => r.toEntityId);

    const guidelineIds = relations
      .filter((r) => r.toEntityType === EntityType.GUIDELINE)
      .map((r) => r.toEntityId);

    // 4. Batch fetch entities (parallel queries)
    const [
      componentViews,
      dependencyViews,
      decisionViews,
      invariantViews,
      guidelineViews,
    ] = await Promise.all([
      this.componentReader.findByIds(componentIds),
      this.dependencyReader.findByIds(dependencyIds),
      this.decisionReader.findByIds(decisionIds),
      this.invariantReader.findByIds(invariantIds),
      this.guidelineReader.findByIds(guidelineIds),
    ]);

    // 5. Merge entity data with relation metadata into RelatedContext<T>
    // Create lookup maps for O(1) relation metadata access
    const relationMap = new Map(
      relations.map((r) => [`${r.toEntityType}:${r.toEntityId}`, r]),
    );

    const components = this.toRelatedContexts(
      componentViews,
      EntityType.COMPONENT,
      (v) => v.componentId,
      relationMap,
    );

    const dependencies = this.toRelatedContexts(
      dependencyViews,
      EntityType.DEPENDENCY,
      (v) => v.dependencyId,
      relationMap,
    );

    const decisions = this.toRelatedContexts(
      decisionViews,
      EntityType.DECISION,
      (v) => v.decisionId,
      relationMap,
    );

    const invariants = this.toRelatedContexts(
      invariantViews,
      EntityType.INVARIANT,
      (v) => v.invariantId,
      relationMap,
    );

    const guidelines = this.toRelatedContexts(
      guidelineViews,
      EntityType.GUIDELINE,
      (v) => v.guidelineId,
      relationMap,
    );

    // 6. Return assembled ContextualGoalView
    return {
      goal,
      context: {
        components,
        dependencies,
        decisions,
        invariants,
        guidelines,
      },
    };
  }

  /**
   * Map entity views to RelatedContext<T> by merging with relation metadata.
   * Filters out entities without matching relations.
   */
  private toRelatedContexts<T>(
    views: T[],
    entityType: string,
    getId: (view: T) => string,
    relationMap: Map<string, RelationView>,
  ): RelatedContext<T>[] {
    return views
      .map((view): RelatedContext<T> | null => {
        const relation = relationMap.get(`${entityType}:${getId(view)}`);
        if (!relation) return null;
        return {
          entity: view,
          relationType: relation.relationType,
          relationDescription: relation.description ?? "",
        };
      })
      .filter((item): item is RelatedContext<T> => item !== null);
  }
}
