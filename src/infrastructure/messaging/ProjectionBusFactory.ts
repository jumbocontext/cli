/**
 * Factory that creates an event bus wired with projection-only handlers.
 *
 * Used during database rebuild to replay events through pure projectors
 * without triggering side effects (cascades, maintenance goals, command
 * handlers). Side-effect events are already persisted in the event store
 * from original execution and are replayed as regular projection events.
 *
 * Each projector performs a single synchronous SQLite write with no
 * cross-aggregate reads, so parallel execution via InProcessEventBus
 * is safe.
 */

import Database from "better-sqlite3";
import { IEventBus } from "../../application/messaging/IEventBus.js";
import { BaseEvent } from "../../domain/BaseEvent.js";
import { InProcessEventBus } from "./InProcessEventBus.js";
import { SearchIndexEventHandler } from "../../application/context/search/SearchIndexEventHandler.js";
import { SearchDocumentProjectorRegistry } from "../../application/context/search/SearchDocumentProjectorRegistry.js";
import { SqliteSearchIndexStore } from "../context/search/SqliteSearchIndexStore.js";

// Session projectors
import { SqliteSessionStartedProjector } from "../context/sessions/start/SqliteSessionStartedProjector.js";
import { SqliteSessionEndedProjector } from "../context/sessions/end/SqliteSessionEndedProjector.js";

// Goal projectors
import { SqliteGoalAddedProjector } from "../context/goals/add/SqliteGoalAddedProjector.js";
import { SqliteGoalStartedProjector } from "../context/goals/start/SqliteGoalStartedProjector.js";
import { SqliteGoalUpdatedProjector } from "../context/goals/update/SqliteGoalUpdatedProjector.js";
import { SqliteGoalBlockedProjector } from "../context/goals/block/SqliteGoalBlockedProjector.js";
import { SqliteGoalUnblockedProjector } from "../context/goals/unblock/SqliteGoalUnblockedProjector.js";
import { SqliteGoalPausedProjector } from "../context/goals/pause/SqliteGoalPausedProjector.js";
import { SqliteGoalPostponedProjector } from "../context/goals/postpone/SqliteGoalPostponedProjector.js";
import { SqliteGoalReinstatedProjector } from "../context/goals/reinstate/SqliteGoalReinstatedProjector.js";
import { SqliteGoalResumedProjector } from "../context/goals/resume/SqliteGoalResumedProjector.js";
import { SqliteGoalCompletedProjector } from "../context/goals/complete/SqliteGoalCompletedProjector.js";
import { SqliteGoalRefinedProjector } from "../context/goals/refine/SqliteGoalRefinedProjector.js";
import { SqliteGoalResetProjector } from "../context/goals/reset/SqliteGoalResetProjector.js";
import { SqliteGoalRemovedProjector } from "../context/goals/remove/SqliteGoalRemovedProjector.js";
import { SqliteGoalProgressUpdatedProjector } from "../context/goals/update-progress/SqliteGoalProgressUpdatedProjector.js";
import { SqliteGoalSubmittedForReviewProjector } from "../context/goals/review/SqliteGoalSubmittedForReviewProjector.js";
import { SqliteGoalQualifiedProjector } from "../context/goals/qualify/SqliteGoalQualifiedProjector.js";
import { SqliteGoalCommittedProjector } from "../context/goals/commit/SqliteGoalCommittedProjector.js";
import { SqliteGoalRejectedProjector } from "../context/goals/reject/SqliteGoalRejectedProjector.js";
import { SqliteGoalSubmittedProjector } from "../context/goals/submit/SqliteGoalSubmittedProjector.js";
import { SqliteGoalCodifyingStartedProjector } from "../context/goals/codify/SqliteGoalCodifyingStartedProjector.js";
import { SqliteGoalClosedProjector } from "../context/goals/close/SqliteGoalClosedProjector.js";
import { SqliteGoalApprovedProjector } from "../context/goals/approve/SqliteGoalApprovedProjector.js";
import { SqliteGoalStatusMigratedProjector } from "../context/goals/migrate/SqliteGoalStatusMigratedProjector.js";

// Architecture projectors
import { SqliteArchitectureDefinedProjector } from "../context/architecture/define/SqliteArchitectureDefinedProjector.js";
import { SqliteArchitectureUpdatedProjector } from "../context/architecture/update/SqliteArchitectureUpdatedProjector.js";
import { SqliteArchitectureDeprecatedProjector } from "../context/architecture/deprecate/SqliteArchitectureDeprecatedProjector.js";

// Component projectors
import { SqliteComponentAddedProjector } from "../context/components/add/SqliteComponentAddedProjector.js";
import { SqliteComponentUpdatedProjector } from "../context/components/update/SqliteComponentUpdatedProjector.js";
import { SqliteComponentDeprecatedProjector } from "../context/components/deprecate/SqliteComponentDeprecatedProjector.js";
import { SqliteComponentUndeprecatedProjector } from "../context/components/undeprecate/SqliteComponentUndeprecatedProjector.js";
import { SqliteComponentRemovedProjector } from "../context/components/remove/SqliteComponentRemovedProjector.js";
import { SqliteComponentRenamedProjector } from "../context/components/rename/SqliteComponentRenamedProjector.js";

// Dependency projectors
import { SqliteDependencyAddedProjector } from "../context/dependencies/add/SqliteDependencyAddedProjector.js";
import { SqliteDependencyUpdatedProjector } from "../context/dependencies/update/SqliteDependencyUpdatedProjector.js";
import { SqliteDependencyRemovedProjector } from "../context/dependencies/remove/SqliteDependencyRemovedProjector.js";

// Decision projectors
import { SqliteDecisionAddedProjector } from "../context/decisions/add/SqliteDecisionAddedProjector.js";
import { SqliteDecisionUpdatedProjector } from "../context/decisions/update/SqliteDecisionUpdatedProjector.js";
import { SqliteDecisionReversedProjector } from "../context/decisions/reverse/SqliteDecisionReversedProjector.js";
import { SqliteDecisionRestoredProjector } from "../context/decisions/restore/SqliteDecisionRestoredProjector.js";
import { SqliteDecisionSupersededProjector } from "../context/decisions/supersede/SqliteDecisionSupersededProjector.js";

// Guideline projectors
import { SqliteGuidelineAddedProjector } from "../context/guidelines/add/SqliteGuidelineAddedProjector.js";
import { SqliteGuidelineUpdatedProjector } from "../context/guidelines/update/SqliteGuidelineUpdatedProjector.js";
import { SqliteGuidelineRemovedProjector } from "../context/guidelines/remove/SqliteGuidelineRemovedProjector.js";

// Invariant projectors
import { SqliteInvariantAddedProjector } from "../context/invariants/add/SqliteInvariantAddedProjector.js";
import { SqliteInvariantUpdatedProjector } from "../context/invariants/update/SqliteInvariantUpdatedProjector.js";
import { SqliteInvariantRemovedProjector } from "../context/invariants/remove/SqliteInvariantRemovedProjector.js";

// Project projectors
import { SqliteProjectInitializedProjector } from "../context/project/init/SqliteProjectInitializedProjector.js";
import { SqliteProjectUpdatedProjector } from "../context/project/update/SqliteProjectUpdatedProjector.js";

// Audience pain projectors
import { SqliteAudiencePainAddedProjector } from "../context/audience-pains/add/SqliteAudiencePainAddedProjector.js";
import { SqliteAudiencePainUpdatedProjector } from "../context/audience-pains/update/SqliteAudiencePainUpdatedProjector.js";

// Audience projectors
import { SqliteAudienceAddedProjector } from "../context/audiences/add/SqliteAudienceAddedProjector.js";
import { SqliteAudienceUpdatedProjector } from "../context/audiences/update/SqliteAudienceUpdatedProjector.js";
import { SqliteAudienceRemovedProjector } from "../context/audiences/remove/SqliteAudienceRemovedProjector.js";

// Value proposition projectors
import { SqliteValuePropositionAddedProjector } from "../context/value-propositions/add/SqliteValuePropositionAddedProjector.js";
import { SqliteValuePropositionUpdatedProjector } from "../context/value-propositions/update/SqliteValuePropositionUpdatedProjector.js";
import { SqliteValuePropositionRemovedProjector } from "../context/value-propositions/remove/SqliteValuePropositionRemovedProjector.js";

// Relation projectors
import { SqliteRelationAddedProjector } from "../context/relations/add/SqliteRelationAddedProjector.js";
import { SqliteRelationDeactivatedProjector } from "../context/relations/deactivate/SqliteRelationDeactivatedProjector.js";
import { SqliteRelationReactivatedProjector } from "../context/relations/reactivate/SqliteRelationReactivatedProjector.js";
import { SqliteRelationRemovedProjector } from "../context/relations/remove/SqliteRelationRemovedProjector.js";

// Worker identity projectors
import { SqliteWorkerIdentifiedProjector } from "../host/workers/identify/SqliteWorkerIdentifiedProjector.js";

// Event types and interfaces for type-safe subscription
import { ArchitectureEventType } from "../../domain/architecture/Constants.js";
import { AudiencePainEventType } from "../../domain/audience-pains/Constants.js";
import { AudienceEventType } from "../../domain/audiences/Constants.js";
import { ComponentEventType } from "../../domain/components/Constants.js";
import { DecisionEventType } from "../../domain/decisions/Constants.js";
import { DependencyEventType } from "../../domain/dependencies/Constants.js";
import { GoalEventType } from "../../domain/goals/Constants.js";
import { GuidelineEventType } from "../../domain/guidelines/Constants.js";
import { InvariantEventType } from "../../domain/invariants/Constants.js";
import { ProjectEventType } from "../../domain/project/Constants.js";
import { RelationEventType } from "../../domain/relations/Constants.js";
import { SessionEventType } from "../../domain/sessions/Constants.js";
import { ValuePropositionEventType } from "../../domain/value-propositions/Constants.js";
import { WorkerEventType } from "../../domain/workers/identify/WorkerIdentifiedEvent.js";
import type { ArchitectureDefinedEvent } from "../../domain/architecture/define/ArchitectureDefinedEvent.js";
import type { ArchitectureDeprecatedEvent } from "../../domain/architecture/deprecate/ArchitectureDeprecatedEvent.js";
import type { ArchitectureUpdatedEvent } from "../../domain/architecture/update/ArchitectureUpdatedEvent.js";
import type { AudiencePainAddedEvent } from "../../domain/audience-pains/add/AudiencePainAddedEvent.js";
import type { AudiencePainUpdatedEvent } from "../../domain/audience-pains/update/AudiencePainUpdatedEvent.js";
import type { AudienceAddedEvent } from "../../domain/audiences/add/AudienceAddedEvent.js";
import type { AudienceRemovedEvent } from "../../domain/audiences/remove/AudienceRemovedEvent.js";
import type { AudienceUpdatedEvent } from "../../domain/audiences/update/AudienceUpdatedEvent.js";
import type { ComponentAddedEvent } from "../../domain/components/add/ComponentAddedEvent.js";
import type { ComponentDeprecatedEvent } from "../../domain/components/deprecate/ComponentDeprecatedEvent.js";
import type { ComponentRemovedEvent } from "../../domain/components/remove/ComponentRemovedEvent.js";
import type { ComponentRenamedEvent } from "../../domain/components/rename/ComponentRenamedEvent.js";
import type { ComponentUndeprecatedEvent } from "../../domain/components/undeprecate/ComponentUndeprecatedEvent.js";
import type { ComponentUpdatedEvent } from "../../domain/components/update/ComponentUpdatedEvent.js";
import type { DecisionAddedEvent } from "../../domain/decisions/add/DecisionAddedEvent.js";
import type { DecisionRestoredEvent } from "../../domain/decisions/restore/DecisionRestoredEvent.js";
import type { DecisionReversedEvent } from "../../domain/decisions/reverse/DecisionReversedEvent.js";
import type { DecisionSupersededEvent } from "../../domain/decisions/supersede/DecisionSupersededEvent.js";
import type { DecisionUpdatedEvent } from "../../domain/decisions/update/DecisionUpdatedEvent.js";
import type { DependencyAddedEvent } from "../../domain/dependencies/add/DependencyAddedEvent.js";
import type { DependencyRemovedEvent } from "../../domain/dependencies/remove/DependencyRemovedEvent.js";
import type { DependencyUpdatedEvent } from "../../domain/dependencies/update/DependencyUpdatedEvent.js";
import type { GoalAddedEvent } from "../../domain/goals/add/GoalAddedEvent.js";
import type { GoalApprovedEvent } from "../../domain/goals/approve/GoalApprovedEvent.js";
import type { GoalBlockedEvent } from "../../domain/goals/block/GoalBlockedEvent.js";
import type { GoalClosedEvent } from "../../domain/goals/close/GoalClosedEvent.js";
import type { GoalCodifyingStartedEvent } from "../../domain/goals/codify/GoalCodifyingStartedEvent.js";
import type { GoalCommittedEvent } from "../../domain/goals/commit/GoalCommittedEvent.js";
import type { GoalCompletedEvent } from "../../domain/goals/complete/GoalCompletedEvent.js";
import type { GoalStatusMigratedEvent } from "../../domain/goals/migrate/GoalStatusMigratedEvent.js";
import type { GoalPausedEvent } from "../../domain/goals/pause/GoalPausedEvent.js";
import type { GoalPostponedEvent } from "../../domain/goals/postpone/GoalPostponedEvent.js";
import type { GoalReinstatedEvent } from "../../domain/goals/reinstate/GoalReinstatedEvent.js";
import type { GoalQualifiedEvent } from "../../domain/goals/qualify/GoalQualifiedEvent.js";
import type { GoalRefinedEvent } from "../../domain/goals/refine/GoalRefinedEvent.js";
import type { GoalRefinementStartedEvent } from "../../domain/goals/refine/GoalRefinementStartedEvent.js";
import type { GoalRejectedEvent } from "../../domain/goals/reject/GoalRejectedEvent.js";
import type { GoalRemovedEvent } from "../../domain/goals/remove/GoalRemovedEvent.js";
import type { GoalResetEvent } from "../../domain/goals/reset/GoalResetEvent.js";
import type { GoalResumedEvent } from "../../domain/goals/resume/GoalResumedEvent.js";
import type { GoalSubmittedForReviewEvent } from "../../domain/goals/review/GoalSubmittedForReviewEvent.js";
import type { GoalStartedEvent } from "../../domain/goals/start/GoalStartedEvent.js";
import type { GoalSubmittedEvent } from "../../domain/goals/submit/GoalSubmittedEvent.js";
import type { GoalUnblockedEvent } from "../../domain/goals/unblock/GoalUnblockedEvent.js";
import type { GoalProgressUpdatedEvent } from "../../domain/goals/update-progress/GoalProgressUpdatedEvent.js";
import type { GoalUpdatedEvent } from "../../domain/goals/update/GoalUpdatedEvent.js";
import type { GuidelineAddedEvent } from "../../domain/guidelines/add/GuidelineAddedEvent.js";
import type { GuidelineRemovedEvent } from "../../domain/guidelines/remove/GuidelineRemovedEvent.js";
import type { GuidelineUpdatedEvent } from "../../domain/guidelines/update/GuidelineUpdatedEvent.js";
import type { InvariantAddedEvent } from "../../domain/invariants/add/InvariantAddedEvent.js";
import type { InvariantRemovedEvent } from "../../domain/invariants/remove/InvariantRemovedEvent.js";
import type { InvariantUpdatedEvent } from "../../domain/invariants/update/InvariantUpdatedEvent.js";
import type { ProjectInitializedEvent } from "../../domain/project/init/ProjectInitializedEvent.js";
import type { ProjectUpdatedEvent } from "../../domain/project/update/ProjectUpdatedEvent.js";
import type { RelationAddedEvent } from "../../domain/relations/add/RelationAddedEvent.js";
import type { RelationDeactivatedEvent } from "../../domain/relations/deactivate/RelationDeactivatedEvent.js";
import type { RelationReactivatedEvent } from "../../domain/relations/reactivate/RelationReactivatedEvent.js";
import type { RelationRemovedEvent } from "../../domain/relations/remove/RelationRemovedEvent.js";
import type { SessionEndedEvent } from "../../domain/sessions/end/SessionEndedEvent.js";
import type { SessionStartedEvent } from "../../domain/sessions/start/SessionStartedEvent.js";
import type { ValuePropositionAddedEvent } from "../../domain/value-propositions/add/ValuePropositionAddedEvent.js";
import type { ValuePropositionRemovedEvent } from "../../domain/value-propositions/remove/ValuePropositionRemovedEvent.js";
import type { ValuePropositionUpdatedEvent } from "../../domain/value-propositions/update/ValuePropositionUpdatedEvent.js";
import type { WorkerIdentifiedEvent } from "../../domain/workers/identify/WorkerIdentifiedEvent.js";


/**
 * Type-safe event subscription helper.
 * Narrows BaseEvent to the specific event type at the call site,
 * concentrating the single unavoidable cast in one place.
 */
function on<E extends BaseEvent>(
  bus: InProcessEventBus,
  eventType: E["type"],
  handler: (event: E) => void | Promise<void>,
): void {
  bus.subscribe(eventType, {
    handle: async (event: BaseEvent) => {
      await handler(event as E);
    },
  });
}

export class ProjectionBusFactory {

  /**
   * Creates an event bus with projection-only handlers for the given database.
   */
  create(db: Database.Database): IEventBus {
    const bus = new InProcessEventBus();

    // Session projections
    const sessionStartedProjector = new SqliteSessionStartedProjector(db);
    const sessionEndedProjector = new SqliteSessionEndedProjector(db);
    on<SessionStartedEvent>(bus, SessionEventType.STARTED, (e) => sessionStartedProjector.applySessionStarted(e));
    on<SessionEndedEvent>(bus, SessionEventType.ENDED, (e) => sessionEndedProjector.applySessionEnded(e));

    // Goal projections
    const goalAddedProjector = new SqliteGoalAddedProjector(db);
    const goalStartedProjector = new SqliteGoalStartedProjector(db);
    const goalUpdatedProjector = new SqliteGoalUpdatedProjector(db);
    const goalBlockedProjector = new SqliteGoalBlockedProjector(db);
    const goalUnblockedProjector = new SqliteGoalUnblockedProjector(db);
    const goalPausedProjector = new SqliteGoalPausedProjector(db);
    const goalPostponedProjector = new SqliteGoalPostponedProjector(db);
    const goalReinstatedProjector = new SqliteGoalReinstatedProjector(db);
    const goalResumedProjector = new SqliteGoalResumedProjector(db);
    const goalCompletedProjector = new SqliteGoalCompletedProjector(db);
    const goalRefinedProjector = new SqliteGoalRefinedProjector(db);
    const goalResetProjector = new SqliteGoalResetProjector(db);
    const goalRemovedProjector = new SqliteGoalRemovedProjector(db);
    const goalProgressUpdatedProjector = new SqliteGoalProgressUpdatedProjector(db);
    const goalSubmittedForReviewProjector = new SqliteGoalSubmittedForReviewProjector(db);
    const goalQualifiedProjector = new SqliteGoalQualifiedProjector(db);
    const goalCommittedProjector = new SqliteGoalCommittedProjector(db);
    const goalRejectedProjector = new SqliteGoalRejectedProjector(db);
    const goalSubmittedProjector = new SqliteGoalSubmittedProjector(db);
    const goalCodifyingStartedProjector = new SqliteGoalCodifyingStartedProjector(db);
    const goalClosedProjector = new SqliteGoalClosedProjector(db);
    const goalApprovedProjector = new SqliteGoalApprovedProjector(db);
    const goalStatusMigratedProjector = new SqliteGoalStatusMigratedProjector(db);
    on<GoalAddedEvent>(bus, GoalEventType.ADDED, (e) => goalAddedProjector.applyGoalAdded(e));
    on<GoalStartedEvent>(bus, GoalEventType.STARTED, (e) => goalStartedProjector.applyGoalStarted(e));
    on<GoalUpdatedEvent>(bus, GoalEventType.UPDATED, (e) => goalUpdatedProjector.applyGoalUpdated(e));
    on<GoalBlockedEvent>(bus, GoalEventType.BLOCKED, (e) => goalBlockedProjector.applyGoalBlocked(e));
    on<GoalUnblockedEvent>(bus, GoalEventType.UNBLOCKED, (e) => goalUnblockedProjector.applyGoalUnblocked(e));
    on<GoalPausedEvent>(bus, GoalEventType.PAUSED, (e) => goalPausedProjector.applyGoalPaused(e));
    on<GoalPostponedEvent>(bus, GoalEventType.POSTPONED, (e) => goalPostponedProjector.applyGoalPostponed(e));
    on<GoalReinstatedEvent>(bus, GoalEventType.REINSTATED, (e) => goalReinstatedProjector.applyGoalReinstated(e));
    on<GoalResumedEvent>(bus, GoalEventType.RESUMED, (e) => goalResumedProjector.applyGoalResumed(e));
    on<GoalCompletedEvent>(bus, GoalEventType.COMPLETED, (e) => goalCompletedProjector.applyGoalCompleted(e));
    on<GoalRefinedEvent>(bus, GoalEventType.REFINED, (e) => goalRefinedProjector.applyGoalRefined(e));
    on<GoalResetEvent>(bus, GoalEventType.RESET, (e) => goalResetProjector.applyGoalReset(e));
    on<GoalRemovedEvent>(bus, GoalEventType.REMOVED, (e) => goalRemovedProjector.applyGoalRemoved(e));
    on<GoalProgressUpdatedEvent>(bus, GoalEventType.PROGRESS_UPDATED, (e) => goalProgressUpdatedProjector.applyGoalProgressUpdated(e));
    on<GoalSubmittedForReviewEvent>(bus, GoalEventType.SUBMITTED_FOR_REVIEW, (e) => goalSubmittedForReviewProjector.applyGoalSubmittedForReview(e));
    on<GoalQualifiedEvent>(bus, GoalEventType.QUALIFIED, (e) => goalQualifiedProjector.applyGoalQualified(e));
    on<GoalRefinementStartedEvent>(bus, GoalEventType.REFINEMENT_STARTED, (e) => goalRefinedProjector.applyGoalRefinementStarted(e));
    on<GoalCommittedEvent>(bus, GoalEventType.COMMITTED, (e) => goalCommittedProjector.applyGoalCommitted(e));
    on<GoalRejectedEvent>(bus, GoalEventType.REJECTED, (e) => goalRejectedProjector.applyGoalRejected(e));
    on<GoalSubmittedEvent>(bus, GoalEventType.SUBMITTED, (e) => goalSubmittedProjector.applyGoalSubmitted(e));
    on<GoalCodifyingStartedEvent>(bus, GoalEventType.CODIFYING_STARTED, (e) => goalCodifyingStartedProjector.applyGoalCodifyingStarted(e));
    on<GoalClosedEvent>(bus, GoalEventType.CLOSED, (e) => goalClosedProjector.applyGoalClosed(e));
    on<GoalApprovedEvent>(bus, GoalEventType.APPROVED, (e) => goalApprovedProjector.applyGoalApproved(e));
    on<GoalStatusMigratedEvent>(bus, GoalEventType.STATUS_MIGRATED, (e) => goalStatusMigratedProjector.applyGoalStatusMigrated(e));

    // Architecture projections
    const architectureDefinedProjector = new SqliteArchitectureDefinedProjector(db);
    const architectureUpdatedProjector = new SqliteArchitectureUpdatedProjector(db);
    const architectureDeprecatedProjector = new SqliteArchitectureDeprecatedProjector(db);
    on<ArchitectureDefinedEvent>(bus, ArchitectureEventType.DEFINED, (e) => architectureDefinedProjector.applyArchitectureDefined(e));
    on<ArchitectureUpdatedEvent>(bus, ArchitectureEventType.UPDATED, (e) => architectureUpdatedProjector.applyArchitectureUpdated(e));
    on<ArchitectureDeprecatedEvent>(bus, ArchitectureEventType.DEPRECATED, (e) => architectureDeprecatedProjector.applyArchitectureDeprecated(e));

    // Component projections (projection-only — no cascades)
    const componentAddedProjector = new SqliteComponentAddedProjector(db);
    const componentUpdatedProjector = new SqliteComponentUpdatedProjector(db);
    const componentDeprecatedProjector = new SqliteComponentDeprecatedProjector(db);
    const componentUndeprecatedProjector = new SqliteComponentUndeprecatedProjector(db);
    const componentRemovedProjector = new SqliteComponentRemovedProjector(db);
    const componentRenamedProjector = new SqliteComponentRenamedProjector(db);
    on<ComponentAddedEvent>(bus, ComponentEventType.ADDED, (e) => componentAddedProjector.applyComponentAdded(e));
    on<ComponentUpdatedEvent>(bus, ComponentEventType.UPDATED, (e) => componentUpdatedProjector.applyComponentUpdated(e));
    on<ComponentDeprecatedEvent>(bus, ComponentEventType.DEPRECATED, (e) => componentDeprecatedProjector.applyComponentDeprecated(e));
    on<ComponentUndeprecatedEvent>(bus, ComponentEventType.UNDEPRECATED, (e) => componentUndeprecatedProjector.applyComponentUndeprecated(e));
    on<ComponentRemovedEvent>(bus, ComponentEventType.REMOVED, (e) => componentRemovedProjector.applyComponentRemoved(e));
    on<ComponentRenamedEvent>(bus, ComponentEventType.RENAMED, (e) => componentRenamedProjector.applyComponentRenamed(e));

    // Dependency projections
    const dependencyAddedProjector = new SqliteDependencyAddedProjector(db);
    const dependencyUpdatedProjector = new SqliteDependencyUpdatedProjector(db);
    const dependencyRemovedProjector = new SqliteDependencyRemovedProjector(db);
    on<DependencyAddedEvent>(bus, DependencyEventType.ADDED, (e) => dependencyAddedProjector.applyDependencyAdded(e));
    on<DependencyUpdatedEvent>(bus, DependencyEventType.UPDATED, (e) => dependencyUpdatedProjector.applyDependencyUpdated(e));
    on<DependencyRemovedEvent>(bus, DependencyEventType.REMOVED, (e) => dependencyRemovedProjector.applyDependencyRemoved(e));

    // Decision projections (projection-only — no cascades)
    const decisionAddedProjector = new SqliteDecisionAddedProjector(db);
    const decisionUpdatedProjector = new SqliteDecisionUpdatedProjector(db);
    const decisionReversedProjector = new SqliteDecisionReversedProjector(db);
    const decisionRestoredProjector = new SqliteDecisionRestoredProjector(db);
    const decisionSupersededProjector = new SqliteDecisionSupersededProjector(db);
    on<DecisionAddedEvent>(bus, DecisionEventType.ADDED, (e) => decisionAddedProjector.applyDecisionAdded(e));
    on<DecisionUpdatedEvent>(bus, DecisionEventType.UPDATED, (e) => decisionUpdatedProjector.applyDecisionUpdated(e));
    on<DecisionReversedEvent>(bus, DecisionEventType.REVERSED, (e) => decisionReversedProjector.applyDecisionReversed(e));
    on<DecisionRestoredEvent>(bus, DecisionEventType.RESTORED, (e) => decisionRestoredProjector.applyDecisionRestored(e));
    on<DecisionSupersededEvent>(bus, DecisionEventType.SUPERSEDED, (e) => decisionSupersededProjector.applyDecisionSuperseded(e));

    // Guideline projections
    const guidelineAddedProjector = new SqliteGuidelineAddedProjector(db);
    const guidelineUpdatedProjector = new SqliteGuidelineUpdatedProjector(db);
    const guidelineRemovedProjector = new SqliteGuidelineRemovedProjector(db);
    on<GuidelineAddedEvent>(bus, GuidelineEventType.ADDED, (e) => guidelineAddedProjector.applyGuidelineAdded(e));
    on<GuidelineUpdatedEvent>(bus, GuidelineEventType.UPDATED, (e) => guidelineUpdatedProjector.applyGuidelineUpdated(e));
    on<GuidelineRemovedEvent>(bus, GuidelineEventType.REMOVED, (e) => guidelineRemovedProjector.applyGuidelineRemoved(e));

    // Invariant projections
    const invariantAddedProjector = new SqliteInvariantAddedProjector(db);
    const invariantUpdatedProjector = new SqliteInvariantUpdatedProjector(db);
    const invariantRemovedProjector = new SqliteInvariantRemovedProjector(db);
    on<InvariantAddedEvent>(bus, InvariantEventType.ADDED, (e) => invariantAddedProjector.applyInvariantAdded(e));
    on<InvariantUpdatedEvent>(bus, InvariantEventType.UPDATED, (e) => invariantUpdatedProjector.applyInvariantUpdated(e));
    on<InvariantRemovedEvent>(bus, InvariantEventType.REMOVED, (e) => invariantRemovedProjector.applyInvariantRemoved(e));

    // Global search index projections
    const searchIndexStore = new SqliteSearchIndexStore(db);
    const searchDocumentProjectorRegistry = new SearchDocumentProjectorRegistry();
    const searchIndexEventHandler = new SearchIndexEventHandler(
      searchDocumentProjectorRegistry.createMemoryProjectors(),
      searchIndexStore,
      searchIndexStore
    );
    this.subscribeSearchIndexEvents(bus, searchIndexEventHandler);

    // Project projections
    const projectInitializedProjector = new SqliteProjectInitializedProjector(db);
    const projectUpdatedProjector = new SqliteProjectUpdatedProjector(db);
    on<ProjectInitializedEvent>(bus, ProjectEventType.INITIALIZED, (e) => projectInitializedProjector.applyProjectInitialized(e));
    on<ProjectUpdatedEvent>(bus, ProjectEventType.UPDATED, (e) => projectUpdatedProjector.applyProjectUpdated(e));

    // Audience pain projections
    const audiencePainAddedProjector = new SqliteAudiencePainAddedProjector(db);
    const audiencePainUpdatedProjector = new SqliteAudiencePainUpdatedProjector(db);
    on<AudiencePainAddedEvent>(bus, AudiencePainEventType.ADDED, (e) => audiencePainAddedProjector.applyAudiencePainAdded(e));
    on<AudiencePainUpdatedEvent>(bus, AudiencePainEventType.UPDATED, (e) => audiencePainUpdatedProjector.applyAudiencePainUpdated(e));

    // Audience projections
    const audienceAddedProjector = new SqliteAudienceAddedProjector(db);
    const audienceUpdatedProjector = new SqliteAudienceUpdatedProjector(db);
    const audienceRemovedProjector = new SqliteAudienceRemovedProjector(db);
    on<AudienceAddedEvent>(bus, AudienceEventType.ADDED, (e) => audienceAddedProjector.applyAudienceAdded(e));
    on<AudienceUpdatedEvent>(bus, AudienceEventType.UPDATED, (e) => audienceUpdatedProjector.applyAudienceUpdated(e));
    on<AudienceRemovedEvent>(bus, AudienceEventType.REMOVED, (e) => audienceRemovedProjector.applyAudienceRemoved(e));

    // Value proposition projections
    const valuePropositionAddedProjector = new SqliteValuePropositionAddedProjector(db);
    const valuePropositionUpdatedProjector = new SqliteValuePropositionUpdatedProjector(db);
    const valuePropositionRemovedProjector = new SqliteValuePropositionRemovedProjector(db);
    on<ValuePropositionAddedEvent>(bus, ValuePropositionEventType.ADDED, (e) => valuePropositionAddedProjector.applyValuePropositionAdded(e));
    on<ValuePropositionUpdatedEvent>(bus, ValuePropositionEventType.UPDATED, (e) => valuePropositionUpdatedProjector.applyValuePropositionUpdated(e));
    on<ValuePropositionRemovedEvent>(bus, ValuePropositionEventType.REMOVED, (e) => valuePropositionRemovedProjector.applyValuePropositionRemoved(e));

    // Relation projections
    const relationAddedProjector = new SqliteRelationAddedProjector(db);
    const relationDeactivatedProjector = new SqliteRelationDeactivatedProjector(db);
    const relationReactivatedProjector = new SqliteRelationReactivatedProjector(db);
    const relationRemovedProjector = new SqliteRelationRemovedProjector(db);
    on<RelationAddedEvent>(bus, RelationEventType.ADDED, (e) => relationAddedProjector.applyRelationAdded(e));
    on<RelationDeactivatedEvent>(bus, RelationEventType.DEACTIVATED, (e) => relationDeactivatedProjector.applyRelationDeactivated(e));
    on<RelationReactivatedEvent>(bus, RelationEventType.REACTIVATED, (e) => relationReactivatedProjector.applyRelationReactivated(e));
    on<RelationRemovedEvent>(bus, RelationEventType.REMOVED, (e) => relationRemovedProjector.applyRelationRemoved(e));

    // Worker identity projections
    const workerIdentifiedProjector = new SqliteWorkerIdentifiedProjector(db);
    on<WorkerIdentifiedEvent>(bus, WorkerEventType.IDENTIFIED, (e) => workerIdentifiedProjector.applyWorkerIdentified(e));

    return bus;
  }

  private subscribeSearchIndexEvents(bus: InProcessEventBus, handler: SearchIndexEventHandler): void {
    for (const eventType of handler.eventTypes) {
      bus.subscribe(eventType, handler);
    }
  }
}
