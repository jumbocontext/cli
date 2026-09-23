/**
 * Host Builder - Application Composition
 *
 * Creates the application container with all infrastructure wired.
 * All concrete type knowledge is encapsulated here.
 *
 * This class is responsible for:
 * - Creating all event stores (Fs implementations)
 * - Creating all projectors/readers (SQLite implementations)
 * - Wiring event handlers to event bus
 * - Returning container with interfaces only
 *
 * Key Design:
 * - ALL concrete imports are in this file (better-sqlite3, Sqlite*, Fs*)
 * - Returns IApplicationContainer (interfaces only)
 * - Presentation layer never sees concrete types
 */

import Database from "better-sqlite3";
import { IApplicationContainer } from "../../application/host/IApplicationContainer.js";
import { IEventStore } from "../../application/persistence/IEventStore.js";
import { IEventBus } from "../../application/messaging/IEventBus.js";
import { IClock } from "../../application/time-and-date/IClock.js";
import { RebuildDatabaseController } from "../../application/maintenance/db/rebuild/RebuildDatabaseController.js";
import { UpgradeCommandHandler } from "../../application/maintenance/upgrade/UpgradeCommandHandler.js";
import { MigrateDependenciesCommandHandler } from "../../application/maintenance/migrate-dependencies/MigrateDependenciesCommandHandler.js";
import { LocalRebuildDatabaseGateway } from "../../application/maintenance/db/rebuild/LocalRebuildDatabaseGateway.js";
import { EvolveController } from "../../application/evolve/EvolveController.js";
import { ITelemetryClient } from "../../application/telemetry/ITelemetryClient.js";

// Infrastructure implementations
import { ProjectRootResolver } from "../context/project/ProjectRootResolver.js";
import { FsEventStore } from "../persistence/FsEventStore.js";
import { InProcessEventBus } from "../messaging/InProcessEventBus.js";
import { SystemClock } from "../time-and-date/SystemClock.js";
import { FileLogger } from "../logging/FileLogger.js";
import { LogLevel } from "../../application/logging/ILogger.js";
import * as path from "path";
import { fileURLToPath } from "node:url";
import { LocalDatabaseRebuildService } from "../local/LocalDatabaseRebuildService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { ProjectionBusFactory } from "../messaging/ProjectionBusFactory.js";
import { MigrationRunner } from "../persistence/MigrationRunner.js";
import { getNamespaceMigrations } from "../persistence/migrations.config.js";
import { LocalSearchGateway } from "../../application/context/search/LocalSearchGateway.js";
import { SearchController } from "../../application/context/search/SearchController.js";
import { SearchIndexEventHandler } from "../../application/context/search/SearchIndexEventHandler.js";
import { SearchDocumentProjectorRegistry } from "../../application/context/search/SearchDocumentProjectorRegistry.js";
import { SqliteSearchIndexStore } from "../context/search/SqliteSearchIndexStore.js";
import { ProjectedSearchIndexProvider } from "../context/search/ProjectedSearchIndexProvider.js";
import { ProjectIdentityResolver } from "../../application/identity/ProjectIdentityResolver.js";

// Session Event Stores - decomposed by use case
import { FsSessionStartedEventStore } from "../context/sessions/start/FsSessionStartedEventStore.js";
import { FsSessionEndedEventStore } from "../context/sessions/end/FsSessionEndedEventStore.js";
// Goal Event Stores - decomposed by use case
import { FsGoalAddedEventStore } from "../context/goals/add/FsGoalAddedEventStore.js";
import { FsGoalStartedEventStore } from "../context/goals/start/FsGoalStartedEventStore.js";
import { FsGoalUpdatedEventStore } from "../context/goals/update/FsGoalUpdatedEventStore.js";
import { FsGoalBlockedEventStore } from "../context/goals/block/FsGoalBlockedEventStore.js";
import { FsGoalUnblockedEventStore } from "../context/goals/unblock/FsGoalUnblockedEventStore.js";
import { FsGoalPausedEventStore } from "../context/goals/pause/FsGoalPausedEventStore.js";
import { FsGoalPostponedEventStore } from "../context/goals/postpone/FsGoalPostponedEventStore.js";
import { FsGoalReinstatedEventStore } from "../context/goals/reinstate/FsGoalReinstatedEventStore.js";
import { FsGoalResumedEventStore } from "../context/goals/resume/FsGoalResumedEventStore.js";
import { FsGoalCompletedEventStore } from "../context/goals/complete/FsGoalCompletedEventStore.js";
import { FsGoalCodifyingStartedEventStore } from "../context/goals/codify/FsGoalCodifyingStartedEventStore.js";
import { FsGoalClosedEventStore } from "../context/goals/close/FsGoalClosedEventStore.js";
import { FsGoalRefinedEventStore } from "../context/goals/refine/FsGoalRefinedEventStore.js";
import { FsGoalResetEventStore } from "../context/goals/reset/FsGoalResetEventStore.js";
import { FsGoalRemovedEventStore } from "../context/goals/remove/FsGoalRemovedEventStore.js";
import { FsGoalProgressUpdatedEventStore } from "../context/goals/update-progress/FsGoalProgressUpdatedEventStore.js";
// Decision Controllers
import { AddDecisionCommandHandler } from "../../application/context/decisions/add/AddDecisionCommandHandler.js";
import { LocalAddDecisionGateway } from "../../application/context/decisions/add/LocalAddDecisionGateway.js";
import { AddDecisionController } from "../../application/context/decisions/add/AddDecisionController.js";
import { LocalGetDecisionsGateway } from "../../application/context/decisions/get/LocalGetDecisionsGateway.js";
import { GetDecisionsController } from "../../application/context/decisions/get/GetDecisionsController.js";
import { LocalSearchDecisionsGateway } from "../../application/context/decisions/search/LocalSearchDecisionsGateway.js";
import { SearchDecisionsController } from "../../application/context/decisions/search/SearchDecisionsController.js";
import { LocalShowDecisionGateway } from "../../application/context/decisions/show/LocalShowDecisionGateway.js";
import { ShowDecisionController } from "../../application/context/decisions/show/ShowDecisionController.js";
import { ReverseDecisionCommandHandler } from "../../application/context/decisions/reverse/ReverseDecisionCommandHandler.js";
import { LocalReverseDecisionGateway } from "../../application/context/decisions/reverse/LocalReverseDecisionGateway.js";
import { ReverseDecisionController } from "../../application/context/decisions/reverse/ReverseDecisionController.js";
import { RestoreDecisionCommandHandler } from "../../application/context/decisions/restore/RestoreDecisionCommandHandler.js";
import { LocalRestoreDecisionGateway } from "../../application/context/decisions/restore/LocalRestoreDecisionGateway.js";
import { RestoreDecisionController } from "../../application/context/decisions/restore/RestoreDecisionController.js";
import { SupersedeDecisionCommandHandler } from "../../application/context/decisions/supersede/SupersedeDecisionCommandHandler.js";
import { LocalSupersedeDecisionGateway } from "../../application/context/decisions/supersede/LocalSupersedeDecisionGateway.js";
import { SupersedeDecisionController } from "../../application/context/decisions/supersede/SupersedeDecisionController.js";
import { UpdateDecisionCommandHandler } from "../../application/context/decisions/update/UpdateDecisionCommandHandler.js";
import { LocalUpdateDecisionGateway } from "../../application/context/decisions/update/LocalUpdateDecisionGateway.js";
import { UpdateDecisionController } from "../../application/context/decisions/update/UpdateDecisionController.js";
// Decision Event Stores - decomposed by use case
import { FsDecisionAddedEventStore } from "../context/decisions/add/FsDecisionAddedEventStore.js";
import { FsDecisionUpdatedEventStore } from "../context/decisions/update/FsDecisionUpdatedEventStore.js";
import { FsDecisionReversedEventStore } from "../context/decisions/reverse/FsDecisionReversedEventStore.js";
import { FsDecisionRestoredEventStore } from "../context/decisions/restore/FsDecisionRestoredEventStore.js";
import { FsDecisionSupersededEventStore } from "../context/decisions/supersede/FsDecisionSupersededEventStore.js";
// Architecture Event Stores - decomposed by use case
import { FsArchitectureDefinedEventStore } from "../context/architecture/define/FsArchitectureDefinedEventStore.js";
import { FsArchitectureUpdatedEventStore } from "../context/architecture/update/FsArchitectureUpdatedEventStore.js";
import { FsArchitectureDeprecatedEventStore } from "../context/architecture/deprecate/FsArchitectureDeprecatedEventStore.js";
// Component Event Stores - decomposed by use case
import { FsComponentAddedEventStore } from "../context/components/add/FsComponentAddedEventStore.js";
import { FsComponentUpdatedEventStore } from "../context/components/update/FsComponentUpdatedEventStore.js";
import { FsComponentDeprecatedEventStore } from "../context/components/deprecate/FsComponentDeprecatedEventStore.js";
import { FsComponentUndeprecatedEventStore } from "../context/components/undeprecate/FsComponentUndeprecatedEventStore.js";
import { FsComponentRemovedEventStore } from "../context/components/remove/FsComponentRemovedEventStore.js";
import { FsComponentRenamedEventStore } from "../context/components/rename/FsComponentRenamedEventStore.js";
// Dependency Controllers
import { AddDependencyCommandHandler } from "../../application/context/dependencies/add/AddDependencyCommandHandler.js";
import { LocalAddDependencyGateway } from "../../application/context/dependencies/add/LocalAddDependencyGateway.js";
import { AddDependencyController } from "../../application/context/dependencies/add/AddDependencyController.js";
import { LocalGetDependenciesGateway } from "../../application/context/dependencies/get/LocalGetDependenciesGateway.js";
import { GetDependenciesController } from "../../application/context/dependencies/get/GetDependenciesController.js";
import { UpdateDependencyCommandHandler } from "../../application/context/dependencies/update/UpdateDependencyCommandHandler.js";
import { LocalUpdateDependencyGateway } from "../../application/context/dependencies/update/LocalUpdateDependencyGateway.js";
import { UpdateDependencyController } from "../../application/context/dependencies/update/UpdateDependencyController.js";
import { RemoveDependencyCommandHandler } from "../../application/context/dependencies/remove/RemoveDependencyCommandHandler.js";
import { LocalRemoveDependencyGateway } from "../../application/context/dependencies/remove/LocalRemoveDependencyGateway.js";
import { RemoveDependencyController } from "../../application/context/dependencies/remove/RemoveDependencyController.js";
// Dependency Event Stores - decomposed by use case
import { FsDependencyAddedEventStore } from "../context/dependencies/add/FsDependencyAddedEventStore.js";
import { FsDependencyUpdatedEventStore } from "../context/dependencies/update/FsDependencyUpdatedEventStore.js";
import { FsDependencyRemovedEventStore } from "../context/dependencies/remove/FsDependencyRemovedEventStore.js";
import { SqliteLegacyDependencyReader } from "../context/dependencies/get/SqliteLegacyDependencyReader.js";
// Guideline Controllers
import { AddGuidelineCommandHandler } from "../../application/context/guidelines/add/AddGuidelineCommandHandler.js";
import { LocalAddGuidelineGateway } from "../../application/context/guidelines/add/LocalAddGuidelineGateway.js";
import { AddGuidelineController } from "../../application/context/guidelines/add/AddGuidelineController.js";
import { LocalUpdateGuidelineGateway } from "../../application/context/guidelines/update/LocalUpdateGuidelineGateway.js";
import { UpdateGuidelineController } from "../../application/context/guidelines/update/UpdateGuidelineController.js";
import { RemoveGuidelineCommandHandler } from "../../application/context/guidelines/remove/RemoveGuidelineCommandHandler.js";
import { LocalRemoveGuidelineGateway } from "../../application/context/guidelines/remove/LocalRemoveGuidelineGateway.js";
import { RemoveGuidelineController } from "../../application/context/guidelines/remove/RemoveGuidelineController.js";
// Invariant Controllers
import { AddInvariantCommandHandler } from "../../application/context/invariants/add/AddInvariantCommandHandler.js";
import { LocalAddInvariantGateway } from "../../application/context/invariants/add/LocalAddInvariantGateway.js";
import { AddInvariantController } from "../../application/context/invariants/add/AddInvariantController.js";
import { RemoveInvariantCommandHandler } from "../../application/context/invariants/remove/RemoveInvariantCommandHandler.js";
import { LocalRemoveInvariantGateway } from "../../application/context/invariants/remove/LocalRemoveInvariantGateway.js";
import { RemoveInvariantController } from "../../application/context/invariants/remove/RemoveInvariantController.js";
import { LocalGetInvariantsGateway } from "../../application/context/invariants/get/LocalGetInvariantsGateway.js";
import { GetInvariantsController } from "../../application/context/invariants/get/GetInvariantsController.js";
import { UpdateInvariantCommandHandler } from "../../application/context/invariants/update/UpdateInvariantCommandHandler.js";
import { LocalUpdateInvariantGateway } from "../../application/context/invariants/update/LocalUpdateInvariantGateway.js";
import { UpdateInvariantController } from "../../application/context/invariants/update/UpdateInvariantController.js";
// Guideline Event Stores - decomposed by use case
import { FsGuidelineAddedEventStore } from "../context/guidelines/add/FsGuidelineAddedEventStore.js";
import { FsGuidelineUpdatedEventStore } from "../context/guidelines/update/FsGuidelineUpdatedEventStore.js";
import { FsGuidelineRemovedEventStore } from "../context/guidelines/remove/FsGuidelineRemovedEventStore.js";
// Invariant Event Stores - decomposed by use case
import { FsInvariantAddedEventStore } from "../context/invariants/add/FsInvariantAddedEventStore.js";
import { FsInvariantUpdatedEventStore } from "../context/invariants/update/FsInvariantUpdatedEventStore.js";
import { FsInvariantRemovedEventStore } from "../context/invariants/remove/FsInvariantRemovedEventStore.js";
// Project Event Stores - decomposed by use case
import { FsProjectInitializedEventStore } from "../context/project/init/FsProjectInitializedEventStore.js";
import { FsProjectUpdatedEventStore } from "../context/project/update/FsProjectUpdatedEventStore.js";
import { UpdateProjectCommandHandler } from "../../application/context/project/update/UpdateProjectCommandHandler.js";
import { LocalUpdateProjectGateway } from "../../application/context/project/update/LocalUpdateProjectGateway.js";
import { UpdateProjectController } from "../../application/context/project/update/UpdateProjectController.js";
import { LocalShowProjectGateway } from "../../application/context/project/show/LocalShowProjectGateway.js";
import { ShowProjectController } from "../../application/context/project/show/ShowProjectController.js";
import { GetProjectStatsQueryHandler } from "../../application/context/project/stats/GetProjectStatsQueryHandler.js";
import { LocalProjectStatsGateway } from "../../application/context/project/stats/LocalProjectStatsGateway.js";
import { ProjectStatsController } from "../../application/context/project/stats/ProjectStatsController.js";
import { SqliteProjectStatsQuery } from "../context/project/stats/SqliteProjectStatsQuery.js";
// Audience Event Stores - decomposed by use case
import { FsAudienceAddedEventStore } from "../context/audiences/add/FsAudienceAddedEventStore.js";
import { FsAudienceUpdatedEventStore } from "../context/audiences/update/FsAudienceUpdatedEventStore.js";
import { FsAudienceRemovedEventStore } from "../context/audiences/remove/FsAudienceRemovedEventStore.js";
// AudiencePain Event Stores - decomposed by use case
import { FsAudiencePainAddedEventStore } from "../context/audience-pains/add/FsAudiencePainAddedEventStore.js";
import { FsAudiencePainUpdatedEventStore } from "../context/audience-pains/update/FsAudiencePainUpdatedEventStore.js";
// ValueProposition Event Stores - decomposed by use case
import { FsValuePropositionAddedEventStore } from "../context/value-propositions/add/FsValuePropositionAddedEventStore.js";
import { FsValuePropositionUpdatedEventStore } from "../context/value-propositions/update/FsValuePropositionUpdatedEventStore.js";
import { FsValuePropositionRemovedEventStore } from "../context/value-propositions/remove/FsValuePropositionRemovedEventStore.js";
// Relations Event Stores - decomposed by use case
import { FsRelationAddedEventStore } from "../context/relations/add/FsRelationAddedEventStore.js";
import { FsRelationDeactivatedEventStore } from "../context/relations/deactivate/FsRelationDeactivatedEventStore.js";
import { FsRelationReactivatedEventStore } from "../context/relations/reactivate/FsRelationReactivatedEventStore.js";
import { FsRelationRemovedEventStore } from "../context/relations/remove/FsRelationRemovedEventStore.js";

// Session Projection Stores - decomposed by use case
import { SqliteSessionStartedProjector } from "../context/sessions/start/SqliteSessionStartedProjector.js";
import { SqliteSessionEndedProjector } from "../context/sessions/end/SqliteSessionEndedProjector.js";
import { SqliteActiveSessionReader } from "../context/sessions/end/SqliteActiveSessionReader.js";
import { SqliteSessionViewReader } from "../context/sessions/get/SqliteSessionViewReader.js";
// Goal Projection Stores - decomposed by use case
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
import { SqliteGoalContextAssembler } from "../context/SqliteGoalContextAssembler.js";
import { SqliteGetGoalViewReader } from "../context/goals/get/SqliteGetGoalViewReader.js";
import { SqliteGoalStatusReader } from "../context/goals/SqliteGoalStatusReader.js";
// Decision Projection Stores - decomposed by use case
import { SqliteDecisionAddedProjector } from "../context/decisions/add/SqliteDecisionAddedProjector.js";
import { SqliteDecisionUpdatedProjector } from "../context/decisions/update/SqliteDecisionUpdatedProjector.js";
import { SqliteDecisionReversedProjector } from "../context/decisions/reverse/SqliteDecisionReversedProjector.js";
import { SqliteDecisionRestoredProjector } from "../context/decisions/restore/SqliteDecisionRestoredProjector.js";
import { SqliteDecisionSupersededProjector } from "../context/decisions/supersede/SqliteDecisionSupersededProjector.js";
import { SqliteDecisionViewReader } from "../context/decisions/get/SqliteDecisionViewReader.js";
// Architecture Projection Stores - decomposed by use case
import { SqliteArchitectureDefinedProjector } from "../context/architecture/define/SqliteArchitectureDefinedProjector.js";
import { SqliteArchitectureUpdatedProjector } from "../context/architecture/update/SqliteArchitectureUpdatedProjector.js";
import { SqliteArchitectureDeprecatedProjector } from "../context/architecture/deprecate/SqliteArchitectureDeprecatedProjector.js";
import { SqliteArchitectureReader } from "../context/architecture/SqliteArchitectureReader.js";
// Component Projection Stores - decomposed by use case
import { SqliteComponentAddedProjector } from "../context/components/add/SqliteComponentAddedProjector.js";
import { SqliteComponentUpdatedProjector } from "../context/components/update/SqliteComponentUpdatedProjector.js";
import { SqliteComponentDeprecatedProjector } from "../context/components/deprecate/SqliteComponentDeprecatedProjector.js";
import { SqliteComponentUndeprecatedProjector } from "../context/components/undeprecate/SqliteComponentUndeprecatedProjector.js";
import { SqliteComponentRemovedProjector } from "../context/components/remove/SqliteComponentRemovedProjector.js";
import { SqliteComponentRenamedProjector } from "../context/components/rename/SqliteComponentRenamedProjector.js";
import { SqliteComponentViewReader } from "../context/components/get/SqliteComponentViewReader.js";
import { SqliteComponentReader } from "../context/components/get/SqliteComponentReader.js";
// Dependency Projection Stores - decomposed by use case
import { SqliteDependencyAddedProjector } from "../context/dependencies/add/SqliteDependencyAddedProjector.js";
import { SqliteDependencyUpdatedProjector } from "../context/dependencies/update/SqliteDependencyUpdatedProjector.js";
import { SqliteDependencyRemovedProjector } from "../context/dependencies/remove/SqliteDependencyRemovedProjector.js";
import { SqliteDependencyViewReader } from "../context/dependencies/get/SqliteDependencyViewReader.js";
// Guideline Projection Stores - decomposed by use case
import { SqliteGuidelineAddedProjector } from "../context/guidelines/add/SqliteGuidelineAddedProjector.js";
import { SqliteGuidelineUpdatedProjector } from "../context/guidelines/update/SqliteGuidelineUpdatedProjector.js";
import { SqliteGuidelineRemovedProjector } from "../context/guidelines/remove/SqliteGuidelineRemovedProjector.js";
import { SqliteGuidelineViewReader } from "../context/guidelines/get/SqliteGuidelineViewReader.js";
import { LocalGetGuidelinesGateway } from "../../application/context/guidelines/get/LocalGetGuidelinesGateway.js";
import { GetGuidelinesController } from "../../application/context/guidelines/get/GetGuidelinesController.js";
import { LocalSearchGuidelinesGateway } from "../../application/context/guidelines/search/LocalSearchGuidelinesGateway.js";
import { SearchGuidelinesController } from "../../application/context/guidelines/search/SearchGuidelinesController.js";
// Invariant Projection Stores - decomposed by use case
import { SqliteInvariantAddedProjector } from "../context/invariants/add/SqliteInvariantAddedProjector.js";
import { SqliteInvariantUpdatedProjector } from "../context/invariants/update/SqliteInvariantUpdatedProjector.js";
import { SqliteInvariantRemovedProjector } from "../context/invariants/remove/SqliteInvariantRemovedProjector.js";
import { SqliteInvariantViewReader } from "../context/invariants/get/SqliteInvariantViewReader.js";
// Relations Projection Stores - decomposed by use case
import { SqliteRelationAddedProjector } from "../context/relations/add/SqliteRelationAddedProjector.js";
import { SqliteRelationDeactivatedProjector } from "../context/relations/deactivate/SqliteRelationDeactivatedProjector.js";
import { SqliteRelationReactivatedProjector } from "../context/relations/reactivate/SqliteRelationReactivatedProjector.js";
import { SqliteRelationRemovedProjector } from "../context/relations/remove/SqliteRelationRemovedProjector.js";
import { SqliteRelationViewReader } from "../context/relations/get/SqliteRelationViewReader.js";
import { SqliteRelationNodeCatalog } from "../context/relations/audit/SqliteRelationNodeCatalog.js";
// AudiencePain Projection Stores - decomposed by use case
import { SqliteAudiencePainAddedProjector } from "../context/audience-pains/add/SqliteAudiencePainAddedProjector.js";
import { SqliteAudiencePainUpdatedProjector } from "../context/audience-pains/update/SqliteAudiencePainUpdatedProjector.js";
// Audience Projection Stores - decomposed by use case
import { SqliteAudienceAddedProjector } from "../context/audiences/add/SqliteAudienceAddedProjector.js";
import { SqliteAudienceUpdatedProjector } from "../context/audiences/update/SqliteAudienceUpdatedProjector.js";
import { SqliteAudienceRemovedProjector } from "../context/audiences/remove/SqliteAudienceRemovedProjector.js";
// ValueProposition Projection Stores - decomposed by use case
import { SqliteValuePropositionAddedProjector } from "../context/value-propositions/add/SqliteValuePropositionAddedProjector.js";
import { SqliteValuePropositionUpdatedProjector } from "../context/value-propositions/update/SqliteValuePropositionUpdatedProjector.js";
import { SqliteValuePropositionRemovedProjector } from "../context/value-propositions/remove/SqliteValuePropositionRemovedProjector.js";
// Project Projection Stores - decomposed by use case
import { SqliteProjectInitializedProjector } from "../context/project/init/SqliteProjectInitializedProjector.js";
import { SqliteProjectUpdatedProjector } from "../context/project/update/SqliteProjectUpdatedProjector.js";
import { SqliteProjectContextReader } from "../context/project/query/SqliteProjectContextReader.js";
// Project Services
import { AgentFileProtocol } from "../context/project/init/AgentFileProtocol.js";
import { FsGitignoreProtocol } from "../context/project/init/FsGitignoreProtocol.js";
import { InitializeProjectCommandHandler } from "../../application/context/project/init/InitializeProjectCommandHandler.js";
import { LocalPlanProjectInitGateway } from "../../application/context/project/init/LocalPlanProjectInitGateway.js";
import { PlanProjectInitController } from "../../application/context/project/init/PlanProjectInitController.js";
import { LocalInitializeProjectGateway } from "../../application/context/project/init/LocalInitializeProjectGateway.js";
import { InitializeProjectController } from "../../application/context/project/init/InitializeProjectController.js";
// Audience Context Reader
import { SqliteAudienceContextReader } from "../context/audiences/query/SqliteAudienceContextReader.js";
// AudiencePain Context Reader
import { SqliteAudiencePainContextReader } from "../context/audience-pains/query/SqliteAudiencePainContextReader.js";
// ValueProposition Context Reader
import { SqliteValuePropositionContextReader } from "../context/value-propositions/query/SqliteValuePropositionContextReader.js";
// CLI Version Reader
import { CliVersionReader } from "../cli-metadata/query/CliVersionReader.js";
import { CliUpdateController } from "../../application/cli-metadata/update/CliUpdateController.js";
import { NpmPackageUpgradeGateway } from "../cli-metadata/update/NpmPackageUpgradeGateway.js";
import { NpmPackageVersionGateway } from "../cli-metadata/update/NpmPackageVersionGateway.js";
// Brownfield Status Reader
import { SqliteBrownfieldStatusReader } from "../context/sessions/start/SqliteBrownfieldStatusReader.js";
// Settings Infrastructure
import { FsSettingsReader } from "../settings/FsSettingsReader.js";
import { FsSettingsInitializer } from "../settings/FsSettingsInitializer.js";
import { ProcessTelemetryEnvironmentReader } from "../telemetry/ProcessTelemetryEnvironmentReader.js";
import { NoOpTelemetryClient } from "../telemetry/NoOpTelemetryClient.js";
import { PostHogTelemetryClient } from "../telemetry/PostHogTelemetryClient.js";

// Event Handlers (Projection Handlers)
import { SessionStartedEventHandler } from "../../application/context/sessions/start/SessionStartedEventHandler.js";
import { SessionEndedEventHandler } from "../../application/context/sessions/end/SessionEndedEventHandler.js";
import { GoalAddedEventHandler } from "../../application/context/goals/add/GoalAddedEventHandler.js";
import { GoalStartedEventHandler } from "../../application/context/goals/start/GoalStartedEventHandler.js";
import { GoalUpdatedEventHandler } from "../../application/context/goals/update/GoalUpdatedEventHandler.js";
import { GoalBlockedEventHandler } from "../../application/context/goals/block/GoalBlockedEventHandler.js";
import { GoalUnblockedEventHandler } from "../../application/context/goals/unblock/GoalUnblockedEventHandler.js";
import { GoalPausedEventHandler } from "../../application/context/goals/pause/GoalPausedEventHandler.js";
import { GoalPostponedEventHandler } from "../../application/context/goals/postpone/GoalPostponedEventHandler.js";
import { GoalReinstatedEventHandler } from "../../application/context/goals/reinstate/GoalReinstatedEventHandler.js";
import { GoalEventType } from "../../domain/goals/Constants.js";
import { GoalResumedEventHandler } from "../../application/context/goals/resume/GoalResumedEventHandler.js";
import { GoalCompletedEventHandler } from "../../application/context/goals/complete/GoalCompletedEventHandler.js";
import { GoalRefinedEventHandler } from "../../application/context/goals/refine/GoalRefinedEventHandler.js";
import { GoalResetEventHandler } from "../../application/context/goals/reset/GoalResetEventHandler.js";
import { GoalRemovedEventHandler } from "../../application/context/goals/remove/GoalRemovedEventHandler.js";
import { GoalProgressUpdatedEventHandler } from "../../application/context/goals/update-progress/GoalProgressUpdatedEventHandler.js";
import { GoalSubmittedForReviewEventHandler } from "../../application/context/goals/review/GoalSubmittedForReviewEventHandler.js";
import { GoalQualifiedEventHandler } from "../../application/context/goals/qualify/GoalQualifiedEventHandler.js";
import { GoalRefinementStartedEventHandler } from "../../application/context/goals/refine/GoalRefinementStartedEventHandler.js";
import { GoalCommittedEventHandler } from "../../application/context/goals/commit/GoalCommittedEventHandler.js";
import { GoalRejectedEventHandler } from "../../application/context/goals/reject/GoalRejectedEventHandler.js";
import { GoalSubmittedEventHandler } from "../../application/context/goals/submit/GoalSubmittedEventHandler.js";
import { GoalCodifyingStartedEventHandler } from "../../application/context/goals/codify/GoalCodifyingStartedEventHandler.js";
import { GoalClosedEventHandler } from "../../application/context/goals/close/GoalClosedEventHandler.js";
import { GoalApprovedEventHandler } from "../../application/context/goals/approve/GoalApprovedEventHandler.js";
import { GoalStatusMigratedEventHandler } from "../../application/context/goals/migrate/GoalStatusMigratedEventHandler.js";
// Decision Event Handlers - decomposed by use case
import { DecisionAddedEventHandler } from "../../application/context/decisions/add/DecisionAddedEventHandler.js";
import { DecisionUpdatedEventHandler } from "../../application/context/decisions/update/DecisionUpdatedEventHandler.js";
import { DecisionReversedEventHandler } from "../../application/context/decisions/reverse/DecisionReversedEventHandler.js";
import { DecisionRestoredEventHandler } from "../../application/context/decisions/restore/DecisionRestoredEventHandler.js";
import { DecisionSupersededEventHandler } from "../../application/context/decisions/supersede/DecisionSupersededEventHandler.js";
// Architecture Event Handlers - decomposed by use case
import { ArchitectureDefinedEventHandler } from "../../application/context/architecture/define/ArchitectureDefinedEventHandler.js";
import { ArchitectureUpdatedEventHandler } from "../../application/context/architecture/update/ArchitectureUpdatedEventHandler.js";
import { ArchitectureDeprecatedEventHandler } from "../../application/context/architecture/deprecate/ArchitectureDeprecatedEventHandler.js";
// Component Event Handlers - decomposed by use case
import { ComponentAddedEventHandler } from "../../application/context/components/add/ComponentAddedEventHandler.js";
import { ComponentUpdatedEventHandler } from "../../application/context/components/update/ComponentUpdatedEventHandler.js";
import { ComponentDeprecatedEventHandler } from "../../application/context/components/deprecate/ComponentDeprecatedEventHandler.js";
import { ComponentUndeprecatedEventHandler } from "../../application/context/components/undeprecate/ComponentUndeprecatedEventHandler.js";
import { ComponentRemovedEventHandler } from "../../application/context/components/remove/ComponentRemovedEventHandler.js";
import { ComponentRenamedEventHandler } from "../../application/context/components/rename/ComponentRenamedEventHandler.js";
// Dependency Event Handlers - decomposed by use case
import { DependencyAddedEventHandler } from "../../application/context/dependencies/add/DependencyAddedEventHandler.js";
import { DependencyUpdatedEventHandler } from "../../application/context/dependencies/update/DependencyUpdatedEventHandler.js";
import { DependencyRemovedEventHandler } from "../../application/context/dependencies/remove/DependencyRemovedEventHandler.js";
// Guideline Event Handlers - decomposed by use case
import { GuidelineAddedEventHandler } from "../../application/context/guidelines/add/GuidelineAddedEventHandler.js";
import { GuidelineUpdatedEventHandler } from "../../application/context/guidelines/update/GuidelineUpdatedEventHandler.js";
import { GuidelineRemovedEventHandler } from "../../application/context/guidelines/remove/GuidelineRemovedEventHandler.js";
// Invariant Event Handlers - decomposed by use case
import { InvariantAddedEventHandler } from "../../application/context/invariants/add/InvariantAddedEventHandler.js";
import { InvariantUpdatedEventHandler } from "../../application/context/invariants/update/InvariantUpdatedEventHandler.js";
import { InvariantRemovedEventHandler } from "../../application/context/invariants/remove/InvariantRemovedEventHandler.js";
// Project Event Handlers - decomposed by use case
import { ProjectInitializedEventHandler } from "../../application/context/project/init/ProjectInitializedEventHandler.js";
import { ProjectUpdatedEventHandler } from "../../application/context/project/update/ProjectUpdatedEventHandler.js";
// AudiencePain Event Handlers - decomposed by use case
import { AudiencePainAddedEventHandler } from "../../application/context/audience-pains/add/AudiencePainAddedEventHandler.js";
import { AudiencePainUpdatedEventHandler } from "../../application/context/audience-pains/update/AudiencePainUpdatedEventHandler.js";
import { UpdateAudiencePainCommandHandler } from "../../application/context/audience-pains/update/UpdateAudiencePainCommandHandler.js";
import { LocalUpdateAudiencePainGateway } from "../../application/context/audience-pains/update/LocalUpdateAudiencePainGateway.js";
import { UpdateAudiencePainController } from "../../application/context/audience-pains/update/UpdateAudiencePainController.js";
import { LocalGetAudiencePainsGateway } from "../../application/context/audience-pains/list/LocalGetAudiencePainsGateway.js";
import { GetAudiencePainsController } from "../../application/context/audience-pains/list/GetAudiencePainsController.js";
// Audience Event Handlers - decomposed by use case
import { AudienceAddedEventHandler } from "../../application/context/audiences/add/AudienceAddedEventHandler.js";
import { AudienceUpdatedEventHandler } from "../../application/context/audiences/update/AudienceUpdatedEventHandler.js";
import { AudienceRemovedEventHandler } from "../../application/context/audiences/remove/AudienceRemovedEventHandler.js";
import { UpdateAudienceCommandHandler } from "../../application/context/audiences/update/UpdateAudienceCommandHandler.js";
import { LocalUpdateAudienceGateway } from "../../application/context/audiences/update/LocalUpdateAudienceGateway.js";
import { UpdateAudienceController } from "../../application/context/audiences/update/UpdateAudienceController.js";
// ValueProposition Event Handlers - decomposed by use case
import { ValuePropositionAddedEventHandler } from "../../application/context/value-propositions/add/ValuePropositionAddedEventHandler.js";
import { ValuePropositionUpdatedEventHandler } from "../../application/context/value-propositions/update/ValuePropositionUpdatedEventHandler.js";
import { ValuePropositionRemovedEventHandler } from "../../application/context/value-propositions/remove/ValuePropositionRemovedEventHandler.js";
import { AddValuePropositionCommandHandler } from "../../application/context/value-propositions/add/AddValuePropositionCommandHandler.js";
import { LocalAddValuePropositionGateway } from "../../application/context/value-propositions/add/LocalAddValuePropositionGateway.js";
import { AddValuePropositionController } from "../../application/context/value-propositions/add/AddValuePropositionController.js";
import { RemoveValuePropositionCommandHandler } from "../../application/context/value-propositions/remove/RemoveValuePropositionCommandHandler.js";
import { LocalRemoveValuePropositionGateway } from "../../application/context/value-propositions/remove/LocalRemoveValuePropositionGateway.js";
import { RemoveValuePropositionController } from "../../application/context/value-propositions/remove/RemoveValuePropositionController.js";
import { LocalGetValuePropositionsGateway } from "../../application/context/value-propositions/get/LocalGetValuePropositionsGateway.js";
import { GetValuePropositionsController } from "../../application/context/value-propositions/get/GetValuePropositionsController.js";
import { UpdateValuePropositionCommandHandler } from "../../application/context/value-propositions/update/UpdateValuePropositionCommandHandler.js";
import { LocalUpdateValuePropositionGateway } from "../../application/context/value-propositions/update/LocalUpdateValuePropositionGateway.js";
import { UpdateValuePropositionController } from "../../application/context/value-propositions/update/UpdateValuePropositionController.js";
// Relations Event Handlers - decomposed by use case
import { RelationAddedEventHandler } from "../../application/context/relations/add/RelationAddedEventHandler.js";
import { AddRelationCommandHandler } from "../../application/context/relations/add/AddRelationCommandHandler.js";
import { LocalAddRelationGateway } from "../../application/context/relations/add/LocalAddRelationGateway.js";
import { AddRelationController } from "../../application/context/relations/add/AddRelationController.js";
import { RelationDeactivatedEventHandler } from "../../application/context/relations/deactivate/RelationDeactivatedEventHandler.js";
import { DeactivateRelationCommandHandler } from "../../application/context/relations/deactivate/DeactivateRelationCommandHandler.js";
import { RelationDeactivationCascade } from "../../application/context/relations/deactivate/RelationDeactivationCascade.js";
import { RelationPruningCascade } from "../../application/context/relations/prune/RelationPruningCascade.js";
import { RelationReactivatedEventHandler } from "../../application/context/relations/reactivate/RelationReactivatedEventHandler.js";
import { ReactivateRelationCommandHandler } from "../../application/context/relations/reactivate/ReactivateRelationCommandHandler.js";
import { RelationReactivationCascade } from "../../application/context/relations/reactivate/RelationReactivationCascade.js";
import { RelationMaintenanceGoalRegistrar } from "../../application/context/relations/maintain/RelationMaintenanceGoalRegistrar.js";
import { RelationDiscoveryGoalRegistrar } from "../../application/context/relations/discover/RelationDiscoveryGoalRegistrar.js";
import { RelationDiscoveryEventHandler } from "../../application/context/relations/discover/RelationDiscoveryEventHandler.js";
import { RelationRemovedEventHandler } from "../../application/context/relations/remove/RelationRemovedEventHandler.js";
import { RemoveRelationCommandHandler } from "../../application/context/relations/remove/RemoveRelationCommandHandler.js";
import { LocalRemoveRelationGateway } from "../../application/context/relations/remove/LocalRemoveRelationGateway.js";
import { RemoveRelationController } from "../../application/context/relations/remove/RemoveRelationController.js";
import { GetRelationsController } from "../../application/context/relations/get/GetRelationsController.js";
import { LocalGetRelationsGateway } from "../../application/context/relations/get/LocalGetRelationsGateway.js";
import { LocalTraverseRelationsGateway } from "../../application/context/relations/traverse/LocalTraverseRelationsGateway.js";
import { TraverseRelationsController } from "../../application/context/relations/traverse/TraverseRelationsController.js";
import { RelationNodeReferenceResolver } from "../../application/context/relations/traverse/RelationNodeReferenceResolver.js";
import { RelationTraversalPolicy } from "../../application/context/relations/traverse/RelationTraversalPolicy.js";
import { RelationTraversalQueryNormalizer } from "../../application/context/relations/traverse/RelationTraversalQueryNormalizer.js";
import { FindRelationPathController } from "../../application/context/relations/path/FindRelationPathController.js";
import { LocalFindRelationPathGateway } from "../../application/context/relations/path/LocalFindRelationPathGateway.js";
import { RelationShortestPathFinder } from "../../application/context/relations/path/RelationShortestPathFinder.js";
import { AuditRelationsController } from "../../application/context/relations/audit/AuditRelationsController.js";
import { RelationAuditPolicy } from "../../application/context/relations/audit/RelationAuditPolicy.js";
// Context
import { GoalContextQueryHandler } from "../../application/context/goals/get/GoalContextQueryHandler.js";
import { GoalBacklogPreviewQueryHandler } from "../../application/context/goals/query/GoalBacklogPreviewQueryHandler.js";

// Goal Controllers
import { AddGoalCommandHandler } from "../../application/context/goals/add/AddGoalCommandHandler.js";
import { LocalAddGoalGateway } from "../../application/context/goals/add/LocalAddGoalGateway.js";
import { AddGoalController } from "../../application/context/goals/add/AddGoalController.js";
import { ReviewGoalController } from "../../application/context/goals/review/ReviewGoalController.js";
import { SubmitGoalForReviewCommandHandler } from "../../application/context/goals/review/SubmitGoalForReviewCommandHandler.js";
import { LocalReviewGoalGateway } from "../../application/context/goals/review/LocalReviewGoalGateway.js";
import { FsGoalSubmittedForReviewEventStore } from "../context/goals/review/FsGoalSubmittedForReviewEventStore.js";
import { QualifyGoalController } from "../../application/context/goals/qualify/QualifyGoalController.js";
import { QualifyGoalCommandHandler } from "../../application/context/goals/qualify/QualifyGoalCommandHandler.js";
import { LocalQualifyGoalGateway } from "../../application/context/goals/qualify/LocalQualifyGoalGateway.js";
import { FsGoalQualifiedEventStore } from "../context/goals/qualify/FsGoalQualifiedEventStore.js";
// CommitGoal Controller-Gateway
import { CommitGoalCommandHandler } from "../../application/context/goals/commit/CommitGoalCommandHandler.js";
import { LocalCommitGoalGateway } from "../../application/context/goals/commit/LocalCommitGoalGateway.js";
import { CommitGoalController } from "../../application/context/goals/commit/CommitGoalController.js";
import { FsGoalCommittedEventStore } from "../context/goals/commit/FsGoalCommittedEventStore.js";
// RejectGoal Controller-Gateway
import { RejectGoalCommandHandler } from "../../application/context/goals/reject/RejectGoalCommandHandler.js";
import { LocalRejectGoalGateway } from "../../application/context/goals/reject/LocalRejectGoalGateway.js";
import { RejectGoalController } from "../../application/context/goals/reject/RejectGoalController.js";
import { FsGoalRejectedEventStore } from "../context/goals/reject/FsGoalRejectedEventStore.js";

// SubmitGoal Controller-Gateway
import { SubmitGoalCommandHandler } from "../../application/context/goals/submit/SubmitGoalCommandHandler.js";
import { LocalSubmitGoalGateway } from "../../application/context/goals/submit/LocalSubmitGoalGateway.js";
import { SubmitGoalController } from "../../application/context/goals/submit/SubmitGoalController.js";
import { FsGoalSubmittedEventStore } from "../context/goals/submit/FsGoalSubmittedEventStore.js";

// CodifyGoal Controller-Gateway
import { CodifyGoalCommandHandler } from "../../application/context/goals/codify/CodifyGoalCommandHandler.js";
import { LocalCodifyGoalGateway } from "../../application/context/goals/codify/LocalCodifyGoalGateway.js";
import { CodifyGoalController } from "../../application/context/goals/codify/CodifyGoalController.js";

// CloseGoal Controller-Gateway
import { CloseGoalCommandHandler } from "../../application/context/goals/close/CloseGoalCommandHandler.js";
import { LocalCloseGoalGateway } from "../../application/context/goals/close/LocalCloseGoalGateway.js";
import { CloseGoalController } from "../../application/context/goals/close/CloseGoalController.js";

// BlockGoal Controller-Gateway
import { RefineGoalCommandHandler } from "../../application/context/goals/refine/RefineGoalCommandHandler.js";
import { LocalRefineGoalGateway } from "../../application/context/goals/refine/LocalRefineGoalGateway.js";
import { RefineGoalController } from "../../application/context/goals/refine/RefineGoalController.js";
import { BlockGoalCommandHandler } from "../../application/context/goals/block/BlockGoalCommandHandler.js";
import { LocalBlockGoalGateway } from "../../application/context/goals/block/LocalBlockGoalGateway.js";
import { BlockGoalController } from "../../application/context/goals/block/BlockGoalController.js";

// UnblockGoal Controller-Gateway
import { UnblockGoalCommandHandler } from "../../application/context/goals/unblock/UnblockGoalCommandHandler.js";
import { LocalUnblockGoalGateway } from "../../application/context/goals/unblock/LocalUnblockGoalGateway.js";
import { UnblockGoalController } from "../../application/context/goals/unblock/UnblockGoalController.js";

// RemoveGoal Controller-Gateway
import { RemoveGoalCommandHandler } from "../../application/context/goals/remove/RemoveGoalCommandHandler.js";
import { LocalRemoveGoalGateway } from "../../application/context/goals/remove/LocalRemoveGoalGateway.js";
import { RemoveGoalController } from "../../application/context/goals/remove/RemoveGoalController.js";

// ResetGoal Controller-Gateway
import { ResetGoalCommandHandler } from "../../application/context/goals/reset/ResetGoalCommandHandler.js";
import { LocalResetGoalGateway } from "../../application/context/goals/reset/LocalResetGoalGateway.js";
import { ResetGoalController } from "../../application/context/goals/reset/ResetGoalController.js";

// UpdateGoal Controller-Gateway
import { UpdateGoalCommandHandler } from "../../application/context/goals/update/UpdateGoalCommandHandler.js";
import { LocalUpdateGoalGateway } from "../../application/context/goals/update/LocalUpdateGoalGateway.js";
import { UpdateGoalController } from "../../application/context/goals/update/UpdateGoalController.js";

// UpdateGoalProgress Controller-Gateway
import { UpdateGoalProgressCommandHandler } from "../../application/context/goals/update-progress/UpdateGoalProgressCommandHandler.js";
import { LocalUpdateGoalProgressGateway } from "../../application/context/goals/update-progress/LocalUpdateGoalProgressGateway.js";
import { UpdateGoalProgressController } from "../../application/context/goals/update-progress/UpdateGoalProgressController.js";

// StartGoal Controller-Gateway
import { StartGoalCommandHandler } from "../../application/context/goals/start/StartGoalCommandHandler.js";
import { PrerequisitePolicy } from "../../domain/goals/rules/PrerequisitePolicy.js";
import { LocalStartGoalGateway } from "../../application/context/goals/start/LocalStartGoalGateway.js";
import { StartGoalController } from "../../application/context/goals/start/StartGoalController.js";

// PauseGoal Controller-Gateway
import { PauseGoalCommandHandler } from "../../application/context/goals/pause/PauseGoalCommandHandler.js";
import { LocalPauseGoalGateway } from "../../application/context/goals/pause/LocalPauseGoalGateway.js";
import { PauseGoalController } from "../../application/context/goals/pause/PauseGoalController.js";

// PostponeGoal Controller-Gateway
import { PostponeGoalCommandHandler } from "../../application/context/goals/postpone/PostponeGoalCommandHandler.js";
import { LocalPostponeGoalGateway } from "../../application/context/goals/postpone/LocalPostponeGoalGateway.js";
import { PostponeGoalController } from "../../application/context/goals/postpone/PostponeGoalController.js";

// ReinstateGoal Controller-Gateway
import { ReinstateGoalCommandHandler } from "../../application/context/goals/reinstate/ReinstateGoalCommandHandler.js";
import { LocalReinstateGoalGateway } from "../../application/context/goals/reinstate/LocalReinstateGoalGateway.js";
import { ReinstateGoalController } from "../../application/context/goals/reinstate/ReinstateGoalController.js";

// GetGoals Controller-Gateway
import { GetGoalsController } from "../../application/context/goals/get/GetGoalsController.js";
import { LocalGetGoalsGateway } from "../../application/context/goals/get/LocalGetGoalsGateway.js";
// ShowGoal Controller-Gateway
import { ShowGoalController } from "../../application/context/goals/get/ShowGoalController.js";
import { LocalShowGoalGateway } from "../../application/context/goals/get/LocalShowGoalGateway.js";

// Session Controllers
import { SessionStartController } from "../../application/context/sessions/start/SessionStartController.js";
import { GetTelemetryStatusController } from "../../application/context/telemetry/get/GetTelemetryStatusController.js";
import { LocalGetTelemetryStatusGateway } from "../../application/context/telemetry/get/LocalGetTelemetryStatusGateway.js";
import { TelemetryConsentStatusResolver } from "../../application/context/telemetry/TelemetryConsentStatusResolver.js";
import { UpdateTelemetryConsentCommandHandler } from "../../application/context/telemetry/update/UpdateTelemetryConsentCommandHandler.js";
import { LocalUpdateTelemetryConsentGateway } from "../../application/context/telemetry/update/LocalUpdateTelemetryConsentGateway.js";
import { UpdateTelemetryConsentController } from "../../application/context/telemetry/update/UpdateTelemetryConsentController.js";
import { LocalStartSessionGateway } from "../../application/context/sessions/start/LocalStartSessionGateway.js";
import { EndSessionController } from "../../application/context/sessions/end/EndSessionController.js";
import { LocalEndSessionGateway } from "../../application/context/sessions/end/LocalEndSessionGateway.js";
import { EndSessionCommandHandler } from "../../application/context/sessions/end/EndSessionCommandHandler.js";
import { GetSessionsController } from "../../application/context/sessions/get/GetSessionsController.js";
import { LocalGetSessionsGateway } from "../../application/context/sessions/get/LocalGetSessionsGateway.js";
// Worker Controllers
import { ViewWorkerController } from "../../application/context/host/workers/view/ViewWorkerController.js";
import { LocalViewWorkerGateway } from "../../application/context/host/workers/view/LocalViewWorkerGateway.js";
import { SessionContextQueryHandler } from "../../application/context/sessions/get/SessionContextQueryHandler.js";
import { StartSessionCommandHandler } from "../../application/context/sessions/start/StartSessionCommandHandler.js";

// Work Command Handlers
import { PauseWorkCommandHandler } from "../../application/context/work/pause/PauseWorkCommandHandler.js";
import { LocalPauseWorkGateway } from "../../application/context/work/pause/LocalPauseWorkGateway.js";
import { PauseWorkController } from "../../application/context/work/pause/PauseWorkController.js";
import { ResumeWorkController } from "../../application/context/work/resume/ResumeWorkController.js";
import { LocalResumeWorkGateway } from "../../application/context/work/resume/LocalResumeWorkGateway.js";
import { ResumeGoalCommandHandler } from "../../application/context/goals/resume/ResumeGoalCommandHandler.js";
import { LocalResumeGoalGateway } from "../../application/context/goals/resume/LocalResumeGoalGateway.js";
import { ResumeGoalController } from "../../application/context/goals/resume/ResumeGoalController.js";

// Architecture Controllers
import { AddAudiencePainCommandHandler } from "../../application/context/audience-pains/add/AddAudiencePainCommandHandler.js";
import { LocalAddAudiencePainGateway } from "../../application/context/audience-pains/add/LocalAddAudiencePainGateway.js";
import { AddAudiencePainController } from "../../application/context/audience-pains/add/AddAudiencePainController.js";
import { DefineArchitectureController } from "../../application/context/architecture/define/DefineArchitectureController.js";
import { LocalDefineArchitectureGateway } from "../../application/context/architecture/define/LocalDefineArchitectureGateway.js";
import { UpdateArchitectureController } from "../../application/context/architecture/update/UpdateArchitectureController.js";
import { LocalUpdateArchitectureGateway } from "../../application/context/architecture/update/LocalUpdateArchitectureGateway.js";
import { GetArchitectureController } from "../../application/context/architecture/get/GetArchitectureController.js";
import { LocalGetArchitectureGateway } from "../../application/context/architecture/get/LocalGetArchitectureGateway.js";

// Component Controllers
import { AddComponentCommandHandler } from "../../application/context/components/add/AddComponentCommandHandler.js";
import { LocalAddComponentGateway } from "../../application/context/components/add/LocalAddComponentGateway.js";
import { AddComponentController } from "../../application/context/components/add/AddComponentController.js";
import { LocalGetComponentsGateway } from "../../application/context/components/list/LocalGetComponentsGateway.js";
import { GetComponentsController } from "../../application/context/components/list/GetComponentsController.js";
import { LocalSearchComponentsGateway } from "../../application/context/components/search/LocalSearchComponentsGateway.js";
import { SearchComponentsController } from "../../application/context/components/search/SearchComponentsController.js";
import { UpdateComponentCommandHandler } from "../../application/context/components/update/UpdateComponentCommandHandler.js";
import { LocalUpdateComponentGateway } from "../../application/context/components/update/LocalUpdateComponentGateway.js";
import { UpdateComponentController } from "../../application/context/components/update/UpdateComponentController.js";
import { RenameComponentCommandHandler } from "../../application/context/components/rename/RenameComponentCommandHandler.js";
import { LocalRenameComponentGateway } from "../../application/context/components/rename/LocalRenameComponentGateway.js";
import { RenameComponentController } from "../../application/context/components/rename/RenameComponentController.js";
import { LocalShowComponentGateway } from "../../application/context/components/show/LocalShowComponentGateway.js";
import { ShowComponentController } from "../../application/context/components/show/ShowComponentController.js";
import { DeprecateComponentCommandHandler } from "../../application/context/components/deprecate/DeprecateComponentCommandHandler.js";
import { LocalDeprecateComponentGateway } from "../../application/context/components/deprecate/LocalDeprecateComponentGateway.js";
import { DeprecateComponentController } from "../../application/context/components/deprecate/DeprecateComponentController.js";
import { UndeprecateComponentCommandHandler } from "../../application/context/components/undeprecate/UndeprecateComponentCommandHandler.js";
import { LocalUndeprecateComponentGateway } from "../../application/context/components/undeprecate/LocalUndeprecateComponentGateway.js";
import { UndeprecateComponentController } from "../../application/context/components/undeprecate/UndeprecateComponentController.js";
import { RemoveComponentCommandHandler } from "../../application/context/components/remove/RemoveComponentCommandHandler.js";
import { LocalRemoveComponentGateway } from "../../application/context/components/remove/LocalRemoveComponentGateway.js";
import { RemoveComponentController } from "../../application/context/components/remove/RemoveComponentController.js";

// Audience Controllers
import { AddAudienceCommandHandler } from "../../application/context/audiences/add/AddAudienceCommandHandler.js";
import { LocalAddAudienceGateway } from "../../application/context/audiences/add/LocalAddAudienceGateway.js";
import { AddAudienceController } from "../../application/context/audiences/add/AddAudienceController.js";
import { ListAudiencesController } from "../../application/context/audiences/list/ListAudiencesController.js";
import { LocalListAudiencesGateway } from "../../application/context/audiences/list/LocalListAudiencesGateway.js";
import { RemoveAudienceCommandHandler } from "../../application/context/audiences/remove/RemoveAudienceCommandHandler.js";
import { LocalRemoveAudienceGateway } from "../../application/context/audiences/remove/LocalRemoveAudienceGateway.js";
import { RemoveAudienceController } from "../../application/context/audiences/remove/RemoveAudienceController.js";


// Worker Identity
import { HostSessionKeyResolver } from "./session/HostSessionKeyResolver.js";
import { SqliteWorkerIdentityRegistry } from "./workers/SqliteWorkerIdentityRegistry.js";
import { FsWorkerIdentifiedEventStore } from "./workers/identify/FsWorkerIdentifiedEventStore.js";
import { SqliteWorkerIdentifiedProjector } from "./workers/identify/SqliteWorkerIdentifiedProjector.js";
import { WorkerIdentifiedEventHandler } from "../../application/host/workers/identify/WorkerIdentifiedEventHandler.js";

// Goal Claims
import { SqliteGoalClaimStore } from "../context/goals/claims/SqliteGoalClaimStore.js";
import { GoalClaimPolicy } from "../../application/context/goals/claims/GoalClaimPolicy.js";

export class HostBuilder {
  private readonly rootDir: string;
  private readonly db: Database.Database;
  private readonly registerTelemetryClient:
    | ((telemetryClient: ITelemetryClient) => void)
    | undefined;

  constructor(
    rootDir: string,
    db: Database.Database,
    registerTelemetryClient?: (telemetryClient: ITelemetryClient) => void
  ) {
    this.rootDir = rootDir;
    this.db = db;
    this.registerTelemetryClient = registerTelemetryClient;
  }

  /**
   * Builds the application container with all infrastructure wired.
   *
   * Creates all event stores, projectors, readers, and wires event handlers
   * to the event bus. Returns an IApplicationContainer with interfaces only.
   *
   * @returns Promise<IApplicationContainer> - Container with all services
   */
  async build(): Promise<IApplicationContainer> {
    // ============================================================
    // STEP 1: Get Core Infrastructure
    // ============================================================

    const projectRootResolver = new ProjectRootResolver();
    const eventBus = new InProcessEventBus();
    const clock = new SystemClock();
    const cliVersionReader = new CliVersionReader();

    // Create logger (writes to .jumbo/logs/<yyyyddmm>.log, one file per day)
    const logDir = path.join(this.rootDir, "logs");
    const logger = new FileLogger(logDir, LogLevel.DEBUG);

    const eventStore = new FsEventStore(this.rootDir, logger);

    // Initialize settings file if it doesn't exist
    const settingsInitializer = new FsSettingsInitializer(this.rootDir);
    await settingsInitializer.ensureSettingsFileExists();

    const settingsReader = new FsSettingsReader(this.rootDir);
    const projectIdentityResolver = new ProjectIdentityResolver(settingsReader);
    const telemetryEnvironmentReader = new ProcessTelemetryEnvironmentReader();
    const telemetryConsentStatusResolver = new TelemetryConsentStatusResolver();
    const settings = await settingsReader.read();
    const telemetryConfigured = await settingsReader.hasTelemetryConfiguration();
    const telemetryStatus = telemetryConsentStatusResolver.resolve(
      settings,
      telemetryConfigured,
      {
        ciDetected: telemetryEnvironmentReader.isCiEnvironment(),
        environmentDisabled:
          telemetryEnvironmentReader.isTelemetryDisabledByEnvironment(),
      }
    );
    const telemetryClient: ITelemetryClient =
      telemetryStatus.effectiveEnabled && telemetryStatus.anonymousId !== null
        ? new PostHogTelemetryClient(telemetryStatus.anonymousId)
        : new NoOpTelemetryClient();
    this.registerTelemetryClient?.(telemetryClient);
    const cliUpdateController = new CliUpdateController(
      new NpmPackageVersionGateway(telemetryClient, logger),
      new NpmPackageUpgradeGateway(process.argv[1] ?? "", telemetryClient, logger),
      telemetryClient,
      logger,
    );

    // Create worker identity components
    const hostSessionKeyResolver = new HostSessionKeyResolver();
    const workerIdentifiedEventStore = new FsWorkerIdentifiedEventStore(this.rootDir, logger);
    const workerIdentifiedProjector = new SqliteWorkerIdentifiedProjector(this.db);
    const workerIdentityRegistry = new SqliteWorkerIdentityRegistry(
      this.db,
      hostSessionKeyResolver,
      workerIdentifiedEventStore,
      eventBus
    );
    const workerIdentityReader = workerIdentityRegistry;

    // Create goal claim components
    const goalClaimStore = new SqliteGoalClaimStore(this.db);
    const goalClaimPolicy = new GoalClaimPolicy(goalClaimStore, clock);

    // Create database rebuild service and controller
    const projectionBusFactory = new ProjectionBusFactory();
    const databaseRebuildService = new LocalDatabaseRebuildService(
      this.rootDir,
      this.db,
      eventStore,
      (db) => projectionBusFactory.create(db),
      logger
    );
    const rebuildDatabaseGateway = new LocalRebuildDatabaseGateway(databaseRebuildService);
    const rebuildDatabaseController = new RebuildDatabaseController(rebuildDatabaseGateway);

    // Upgrade command handler (uses event store + goal status reader created later)
    // Deferred: upgradeCommandHandler is created after projectors are available

    // ============================================================
    // STEP 2: Create Domain Event Stores
    // ============================================================

    // Work Category - Session Event Stores - decomposed by use case
    const sessionStartedEventStore = new FsSessionStartedEventStore(this.rootDir, logger);
    const sessionEndedEventStore = new FsSessionEndedEventStore(this.rootDir, logger);
    // Goal Event Stores - decomposed by use case
    const goalAddedEventStore = new FsGoalAddedEventStore(this.rootDir, logger);
    const goalStartedEventStore = new FsGoalStartedEventStore(this.rootDir, logger);
    const goalUpdatedEventStore = new FsGoalUpdatedEventStore(this.rootDir, logger);
    const goalBlockedEventStore = new FsGoalBlockedEventStore(this.rootDir, logger);
    const goalUnblockedEventStore = new FsGoalUnblockedEventStore(this.rootDir, logger);
    const goalPausedEventStore = new FsGoalPausedEventStore(this.rootDir, logger);
    const goalPostponedEventStore = new FsGoalPostponedEventStore(this.rootDir, logger);
    const goalReinstatedEventStore = new FsGoalReinstatedEventStore(this.rootDir, logger);
    const goalResumedEventStore = new FsGoalResumedEventStore(this.rootDir, logger);
    const goalCompletedEventStore = new FsGoalCompletedEventStore(this.rootDir, logger);
    const goalRefinedEventStore = new FsGoalRefinedEventStore(this.rootDir, logger);
    const goalResetEventStore = new FsGoalResetEventStore(this.rootDir, logger);
    const goalRemovedEventStore = new FsGoalRemovedEventStore(this.rootDir, logger);
    const goalProgressUpdatedEventStore = new FsGoalProgressUpdatedEventStore(this.rootDir, logger);
    const goalSubmittedForReviewEventStore = new FsGoalSubmittedForReviewEventStore(this.rootDir, logger);
    const goalQualifiedEventStore = new FsGoalQualifiedEventStore(this.rootDir, logger);
    const goalCommittedEventStore = new FsGoalCommittedEventStore(this.rootDir, logger);
    const goalRejectedEventStore = new FsGoalRejectedEventStore(this.rootDir, logger);
    const goalSubmittedEventStore = new FsGoalSubmittedEventStore(this.rootDir, logger);
    const goalCodifyingStartedEventStore = new FsGoalCodifyingStartedEventStore(this.rootDir, logger);
    const goalClosedEventStore = new FsGoalClosedEventStore(this.rootDir, logger);

    // Solution Category
    // Architecture Event Stores - decomposed by use case
    const architectureDefinedEventStore = new FsArchitectureDefinedEventStore(this.rootDir, logger);
    const architectureUpdatedEventStore = new FsArchitectureUpdatedEventStore(this.rootDir, logger);
    const architectureDeprecatedEventStore = new FsArchitectureDeprecatedEventStore(this.rootDir, logger);
    // Component Event Stores - decomposed by use case
    const componentAddedEventStore = new FsComponentAddedEventStore(this.rootDir, logger);
    const componentUpdatedEventStore = new FsComponentUpdatedEventStore(this.rootDir, logger);
    const componentDeprecatedEventStore = new FsComponentDeprecatedEventStore(this.rootDir, logger);
    const componentUndeprecatedEventStore = new FsComponentUndeprecatedEventStore(this.rootDir, logger);
    const componentRemovedEventStore = new FsComponentRemovedEventStore(this.rootDir, logger);
    const componentRenamedEventStore = new FsComponentRenamedEventStore(this.rootDir, logger);
    // Dependency Event Stores - decomposed by use case
    const dependencyAddedEventStore = new FsDependencyAddedEventStore(this.rootDir, logger);
    const dependencyUpdatedEventStore = new FsDependencyUpdatedEventStore(this.rootDir, logger);
    const dependencyRemovedEventStore = new FsDependencyRemovedEventStore(this.rootDir, logger);
    // Decision Event Stores - decomposed by use case
    const decisionAddedEventStore = new FsDecisionAddedEventStore(this.rootDir, logger);
    const decisionUpdatedEventStore = new FsDecisionUpdatedEventStore(this.rootDir, logger);
    const decisionReversedEventStore = new FsDecisionReversedEventStore(this.rootDir, logger);
    const decisionRestoredEventStore = new FsDecisionRestoredEventStore(this.rootDir, logger);
    const decisionSupersededEventStore = new FsDecisionSupersededEventStore(this.rootDir, logger);
    // Guideline Event Stores - decomposed by use case
    const guidelineAddedEventStore = new FsGuidelineAddedEventStore(this.rootDir, logger);
    const guidelineUpdatedEventStore = new FsGuidelineUpdatedEventStore(this.rootDir, logger);
    const guidelineRemovedEventStore = new FsGuidelineRemovedEventStore(this.rootDir, logger);
    // Invariant Event Stores - decomposed by use case
    const invariantAddedEventStore = new FsInvariantAddedEventStore(this.rootDir, logger);
    const invariantUpdatedEventStore = new FsInvariantUpdatedEventStore(this.rootDir, logger);
    const invariantRemovedEventStore = new FsInvariantRemovedEventStore(this.rootDir, logger);

    // Project Knowledge Category
    // Project Event Stores - decomposed by use case
    const projectInitializedEventStore = new FsProjectInitializedEventStore(this.rootDir, logger);
    const projectUpdatedEventStore = new FsProjectUpdatedEventStore(this.rootDir, logger);
    // Project Services
    const agentFileProtocol = new AgentFileProtocol();
    // Audience Event Stores - decomposed by use case
    const audienceAddedEventStore = new FsAudienceAddedEventStore(this.rootDir, logger);
    const audienceUpdatedEventStore = new FsAudienceUpdatedEventStore(this.rootDir, logger);
    const audienceRemovedEventStore = new FsAudienceRemovedEventStore(this.rootDir, logger);
    // AudiencePain Event Stores - decomposed by use case
    const audiencePainAddedEventStore = new FsAudiencePainAddedEventStore(this.rootDir, logger);
    const audiencePainUpdatedEventStore = new FsAudiencePainUpdatedEventStore(this.rootDir, logger);
// ValueProposition Event Stores - decomposed by use case
    const valuePropositionAddedEventStore = new FsValuePropositionAddedEventStore(this.rootDir, logger);
    const valuePropositionUpdatedEventStore = new FsValuePropositionUpdatedEventStore(this.rootDir, logger);
    const valuePropositionRemovedEventStore = new FsValuePropositionRemovedEventStore(this.rootDir, logger);

    // Relations Category - Event Stores - decomposed by use case
    const relationAddedEventStore = new FsRelationAddedEventStore(this.rootDir, logger);
    const relationDeactivatedEventStore = new FsRelationDeactivatedEventStore(this.rootDir, logger);
    const relationReactivatedEventStore = new FsRelationReactivatedEventStore(this.rootDir, logger);
    const relationRemovedEventStore = new FsRelationRemovedEventStore(this.rootDir, logger);

    // ============================================================
    // STEP 3: Create Projection Stores (Read Models)
    // ============================================================

    // Work Category - Session Projection Stores - decomposed by use case
    const sessionStartedProjector = new SqliteSessionStartedProjector(this.db);
    const sessionEndedProjector = new SqliteSessionEndedProjector(this.db);
    const activeSessionReader = new SqliteActiveSessionReader(this.db);
    const sessionViewReader = new SqliteSessionViewReader(this.db);
    // Goal Projection Stores - decomposed by use case
    const goalAddedProjector = new SqliteGoalAddedProjector(this.db);
    const goalStartedProjector = new SqliteGoalStartedProjector(this.db);
    const goalUpdatedProjector = new SqliteGoalUpdatedProjector(this.db);
    const goalBlockedProjector = new SqliteGoalBlockedProjector(this.db);
    const goalUnblockedProjector = new SqliteGoalUnblockedProjector(this.db);
    const goalPausedProjector = new SqliteGoalPausedProjector(this.db);
    const goalPostponedProjector = new SqliteGoalPostponedProjector(this.db);
    const goalReinstatedProjector = new SqliteGoalReinstatedProjector(this.db);
    const goalResumedProjector = new SqliteGoalResumedProjector(this.db);
    const goalCompletedProjector = new SqliteGoalCompletedProjector(this.db);
    const goalRefinedProjector = new SqliteGoalRefinedProjector(this.db);
    const goalResetProjector = new SqliteGoalResetProjector(this.db);
    const goalRemovedProjector = new SqliteGoalRemovedProjector(this.db);
    const goalProgressUpdatedProjector = new SqliteGoalProgressUpdatedProjector(this.db);
    const goalSubmittedForReviewProjector = new SqliteGoalSubmittedForReviewProjector(this.db);
    const goalQualifiedProjector = new SqliteGoalQualifiedProjector(this.db);
    const goalCommittedProjector = new SqliteGoalCommittedProjector(this.db);
    const goalRejectedProjector = new SqliteGoalRejectedProjector(this.db);
    const goalSubmittedProjector = new SqliteGoalSubmittedProjector(this.db);
    const goalCodifyingStartedProjector = new SqliteGoalCodifyingStartedProjector(this.db);
    const goalClosedProjector = new SqliteGoalClosedProjector(this.db);
    const goalApprovedProjector = new SqliteGoalApprovedProjector(this.db);
    const goalStatusMigratedProjector = new SqliteGoalStatusMigratedProjector(this.db);
    const goalViewReader = new SqliteGetGoalViewReader(this.db);
    const goalStatusReader = new SqliteGoalStatusReader(this.db);

    // Upgrade command handler
    const upgradeCommandHandler = new UpgradeCommandHandler(eventStore, goalStatusReader);

    // Legacy dependency reader (for migration)
    const legacyDependencyReader = new SqliteLegacyDependencyReader(this.db);

    // Solution Category
    // Architecture Projection Stores - decomposed by use case
    const architectureDefinedProjector = new SqliteArchitectureDefinedProjector(this.db);
    const architectureUpdatedProjector = new SqliteArchitectureUpdatedProjector(this.db);
    const architectureDeprecatedProjector = new SqliteArchitectureDeprecatedProjector(this.db);
    const architectureReader = new SqliteArchitectureReader(this.db);
    // Component Projection Stores - decomposed by use case
    const componentAddedProjector = new SqliteComponentAddedProjector(this.db);
    const componentUpdatedProjector = new SqliteComponentUpdatedProjector(this.db);
    const componentDeprecatedProjector = new SqliteComponentDeprecatedProjector(this.db);
    const componentUndeprecatedProjector = new SqliteComponentUndeprecatedProjector(this.db);
    const componentRemovedProjector = new SqliteComponentRemovedProjector(this.db);
    const componentRenamedProjector = new SqliteComponentRenamedProjector(this.db);
    const componentViewReader = new SqliteComponentViewReader(this.db);
    const componentReader = new SqliteComponentReader(this.db);
    // Dependency Projection Stores - decomposed by use case
    const dependencyAddedProjector = new SqliteDependencyAddedProjector(this.db);
    const dependencyUpdatedProjector = new SqliteDependencyUpdatedProjector(this.db);
    const dependencyRemovedProjector = new SqliteDependencyRemovedProjector(this.db);
    const dependencyViewReader = new SqliteDependencyViewReader(this.db);
    // Decision Projection Stores - decomposed by use case
    const decisionAddedProjector = new SqliteDecisionAddedProjector(this.db);
    const decisionUpdatedProjector = new SqliteDecisionUpdatedProjector(this.db);
    const decisionReversedProjector = new SqliteDecisionReversedProjector(this.db);
    const decisionRestoredProjector = new SqliteDecisionRestoredProjector(this.db);
    const decisionSupersededProjector = new SqliteDecisionSupersededProjector(this.db);
    const decisionViewReader = new SqliteDecisionViewReader(this.db);
    // Guideline Projection Stores - decomposed by use case
    const guidelineAddedProjector = new SqliteGuidelineAddedProjector(this.db);
    const guidelineUpdatedProjector = new SqliteGuidelineUpdatedProjector(this.db);
    const guidelineRemovedProjector = new SqliteGuidelineRemovedProjector(this.db);
    const guidelineViewReader = new SqliteGuidelineViewReader(this.db);
    const getGuidelinesGateway = new LocalGetGuidelinesGateway(guidelineViewReader);
    const getGuidelinesController = new GetGuidelinesController(getGuidelinesGateway);
    const searchGuidelinesGateway = new LocalSearchGuidelinesGateway(guidelineViewReader);
    const searchGuidelinesController = new SearchGuidelinesController(searchGuidelinesGateway);
    const addGuidelineCommandHandler = new AddGuidelineCommandHandler(
      guidelineAddedEventStore,
      eventBus
    );
    const addGuidelineGateway = new LocalAddGuidelineGateway(
      addGuidelineCommandHandler
    );
    const addGuidelineController = new AddGuidelineController(
      addGuidelineGateway
    );

    // UpdateGuideline Controller
    const updateGuidelineGateway = new LocalUpdateGuidelineGateway(
      guidelineUpdatedEventStore,
      guidelineUpdatedEventStore,
      guidelineUpdatedProjector,
      eventBus
    );
    const updateGuidelineController = new UpdateGuidelineController(
      updateGuidelineGateway
    );

    // RemoveGuideline Controller
    const removeGuidelineCommandHandler = new RemoveGuidelineCommandHandler(
      guidelineRemovedEventStore,
      guidelineRemovedEventStore,
      eventBus
    );
    const removeGuidelineGateway = new LocalRemoveGuidelineGateway(
      removeGuidelineCommandHandler,
      guidelineRemovedProjector
    );
    const removeGuidelineController = new RemoveGuidelineController(
      removeGuidelineGateway
    );

    // Invariant Projection Stores - decomposed by use case
    const invariantAddedProjector = new SqliteInvariantAddedProjector(this.db);
    const invariantUpdatedProjector = new SqliteInvariantUpdatedProjector(this.db);
    const invariantRemovedProjector = new SqliteInvariantRemovedProjector(this.db);
    const invariantViewReader = new SqliteInvariantViewReader(this.db);
    const searchIndexStore = new SqliteSearchIndexStore(this.db);

    // AddInvariant Controller
    const addInvariantCommandHandler = new AddInvariantCommandHandler(
      invariantAddedEventStore,
      invariantAddedProjector,
      eventBus
    );
    const addInvariantGateway = new LocalAddInvariantGateway(
      addInvariantCommandHandler
    );
    const addInvariantController = new AddInvariantController(
      addInvariantGateway
    );

    // UpdateInvariant Controller
    const updateInvariantCommandHandler = new UpdateInvariantCommandHandler(
      invariantUpdatedEventStore,
      invariantUpdatedEventStore,
      eventBus
    );
    const updateInvariantGateway = new LocalUpdateInvariantGateway(
      updateInvariantCommandHandler,
      invariantUpdatedProjector
    );
    const updateInvariantController = new UpdateInvariantController(
      updateInvariantGateway
    );

    // RemoveInvariant Controller
    const removeInvariantCommandHandler = new RemoveInvariantCommandHandler(
      invariantRemovedEventStore,
      invariantRemovedEventStore,
      invariantRemovedProjector,
      eventBus
    );
    const removeInvariantGateway = new LocalRemoveInvariantGateway(
      removeInvariantCommandHandler,
      invariantRemovedProjector
    );
    const removeInvariantController = new RemoveInvariantController(
      removeInvariantGateway
    );

    // GetInvariants Controller
    const getInvariantsGateway = new LocalGetInvariantsGateway(invariantViewReader);
    const getInvariantsController = new GetInvariantsController(getInvariantsGateway);
    const projectedSearchIndexProvider = new ProjectedSearchIndexProvider(searchIndexStore);
    const searchGateway = new LocalSearchGateway([projectedSearchIndexProvider]);
    const searchController = new SearchController(searchGateway);

    // Brownfield Status
    const brownfieldStatusReader = new SqliteBrownfieldStatusReader(this.db);

    // Project Knowledge Category
    // Project Projection Stores - decomposed by use case
    const projectInitializedProjector = new SqliteProjectInitializedProjector(this.db);
    const projectUpdatedProjector = new SqliteProjectUpdatedProjector(this.db);
    const projectContextReader = new SqliteProjectContextReader(this.db);
    const projectStatsQuery = new SqliteProjectStatsQuery(this.db);
    // Audience Projection Stores - decomposed by use case
    const audienceAddedProjector = new SqliteAudienceAddedProjector(this.db);
    const audienceUpdatedProjector = new SqliteAudienceUpdatedProjector(this.db);
    const audienceRemovedProjector = new SqliteAudienceRemovedProjector(this.db);
    const audienceContextReader = new SqliteAudienceContextReader(this.db);
    // AudiencePain Projection Stores - decomposed by use case
    const audiencePainAddedProjector = new SqliteAudiencePainAddedProjector(this.db);
    const audiencePainUpdatedProjector = new SqliteAudiencePainUpdatedProjector(this.db);
const audiencePainContextReader = new SqliteAudiencePainContextReader(this.db);
    // ValueProposition Projection Stores - decomposed by use case
    const valuePropositionAddedProjector = new SqliteValuePropositionAddedProjector(this.db);
    const valuePropositionUpdatedProjector = new SqliteValuePropositionUpdatedProjector(this.db);
    const valuePropositionRemovedProjector = new SqliteValuePropositionRemovedProjector(this.db);
    const valuePropositionContextReader = new SqliteValuePropositionContextReader(this.db);

    // Relations Category - Projection Stores - decomposed by use case
    const relationAddedProjector = new SqliteRelationAddedProjector(this.db);
    const relationDeactivatedProjector = new SqliteRelationDeactivatedProjector(this.db);
    const relationReactivatedProjector = new SqliteRelationReactivatedProjector(this.db);
    const relationRemovedProjector = new SqliteRelationRemovedProjector(this.db);
    const relationViewReader = new SqliteRelationViewReader(this.db);
    const relationNodeCatalog = new SqliteRelationNodeCatalog(this.db);

    // ============================================================
    // STEP 4: Create Application Services / Controllers
    // ============================================================

    // Goal Context Assembler - assembles context from relations
    const goalContextAssembler = new SqliteGoalContextAssembler(
      goalStartedProjector, // Implements IGoalReader (findById)
      relationRemovedProjector, // Also implements IRelationReader
      componentViewReader,
      dependencyViewReader,
      decisionViewReader,
      invariantViewReader,
      guidelineViewReader
    );
    const goalContextQueryHandler = new GoalContextQueryHandler(
      goalContextAssembler
    );
    const goalBacklogPreviewQueryHandler = new GoalBacklogPreviewQueryHandler(
      goalStatusReader
    );
    // Project Controllers
    const updateProjectCommandHandler = new UpdateProjectCommandHandler(
      projectUpdatedEventStore,
      eventBus,
      projectUpdatedProjector,
      projectIdentityResolver
    );
    const updateProjectGateway = new LocalUpdateProjectGateway(
      updateProjectCommandHandler,
      projectUpdatedProjector
    );
    const updateProjectController = new UpdateProjectController(
      updateProjectGateway
    );
    const showProjectGateway = new LocalShowProjectGateway(
      projectContextReader,
      audienceContextReader,
      audiencePainContextReader,
      valuePropositionContextReader
    );
    const showProjectController = new ShowProjectController(showProjectGateway);
    const projectStatsQueryHandler = new GetProjectStatsQueryHandler(
      projectStatsQuery
    );
    const projectStatsGateway = new LocalProjectStatsGateway(
      projectStatsQueryHandler
    );
    const projectStatsController = new ProjectStatsController(
      projectStatsGateway
    );

    // Session Controllers
    const sessionContextQueryHandler = new SessionContextQueryHandler(
      sessionViewReader,
      goalStatusReader,
      decisionViewReader,
      projectContextReader
    );
    const startSessionCommandHandler = new StartSessionCommandHandler(
      sessionStartedEventStore,
      eventBus
    );
    const startSessionGateway = new LocalStartSessionGateway(
      startSessionCommandHandler,
      brownfieldStatusReader,
      settingsReader,
      goalBacklogPreviewQueryHandler
    );
    const sessionStartController = new SessionStartController(
      startSessionGateway
    );
    const getTelemetryStatusGateway = new LocalGetTelemetryStatusGateway(
      settingsReader,
      telemetryEnvironmentReader,
      telemetryConsentStatusResolver
    );
    const getTelemetryStatusController = new GetTelemetryStatusController(
      getTelemetryStatusGateway
    );
    const updateTelemetryConsentCommandHandler =
      new UpdateTelemetryConsentCommandHandler(settingsReader);
    const updateTelemetryConsentGateway =
      new LocalUpdateTelemetryConsentGateway(
        updateTelemetryConsentCommandHandler,
        telemetryEnvironmentReader
      );
    const updateTelemetryConsentController =
      new UpdateTelemetryConsentController(updateTelemetryConsentGateway);
    const getSessionsGateway = new LocalGetSessionsGateway(sessionViewReader);
    const getSessionsController = new GetSessionsController(
      getSessionsGateway
    );
    const endSessionCommandHandler = new EndSessionCommandHandler(
      sessionEndedEventStore,
      sessionEndedEventStore,
      activeSessionReader,
      eventBus
    );
    const endSessionGateway = new LocalEndSessionGateway(endSessionCommandHandler);
    const endSessionController = new EndSessionController(endSessionGateway);

    // Worker Controllers
    const viewWorkerGateway = new LocalViewWorkerGateway(
      workerIdentityReader,
      settingsReader
    );
    const viewWorkerController = new ViewWorkerController(viewWorkerGateway);

    // Goal Controllers
    const addGoalCommandHandler = new AddGoalCommandHandler(
      goalAddedEventStore,
      eventBus,
      goalUpdatedEventStore,
      goalUpdatedEventStore,
      goalUpdatedProjector
    );
    const addGoalGateway = new LocalAddGoalGateway(addGoalCommandHandler);
    const addGoalController = new AddGoalController(addGoalGateway);

    // ReviewGoalController dependencies
    const submitGoalForReviewCommandHandler = new SubmitGoalForReviewCommandHandler(
      goalSubmittedForReviewEventStore,
      goalSubmittedForReviewEventStore,
      goalStartedProjector,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader,
      settingsReader,
      goalContextQueryHandler
    );
    const reviewGoalGateway = new LocalReviewGoalGateway(
      submitGoalForReviewCommandHandler,
      goalStartedProjector
    );
    const reviewGoalController = new ReviewGoalController(
      reviewGoalGateway
    );
    // QualifyGoalController dependencies
    const qualifyGoalCommandHandler = new QualifyGoalCommandHandler(
      goalQualifiedEventStore,
      goalQualifiedEventStore,
      goalStartedProjector,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader,
      goalContextQueryHandler
    );
    const qualifyGoalGateway = new LocalQualifyGoalGateway(
      qualifyGoalCommandHandler,
      goalStartedProjector,
      goalClaimPolicy,
      workerIdentityReader
    );
    const qualifyGoalController = new QualifyGoalController(
      qualifyGoalGateway
    );

    // BlockGoal Controller
    const blockGoalCommandHandler = new BlockGoalCommandHandler(
      goalBlockedEventStore,
      goalBlockedEventStore,
      eventBus
    );
    const blockGoalGateway = new LocalBlockGoalGateway(
      blockGoalCommandHandler
    );
    const blockGoalController = new BlockGoalController(
      blockGoalGateway
    );

    // UnblockGoal Controller
    const unblockGoalCommandHandler = new UnblockGoalCommandHandler(
      goalUnblockedEventStore,
      goalUnblockedEventStore,
      eventBus
    );
    const unblockGoalGateway = new LocalUnblockGoalGateway(
      unblockGoalCommandHandler
    );
    const unblockGoalController = new UnblockGoalController(
      unblockGoalGateway
    );

    // StartGoal Controller
    const prerequisitePolicy = new PrerequisitePolicy();
    const startGoalCommandHandler = new StartGoalCommandHandler(
      goalStartedEventStore,
      goalStartedEventStore,
      goalStartedProjector,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader,
      settingsReader,
      goalContextQueryHandler,
      prerequisitePolicy
    );
    const startGoalGateway = new LocalStartGoalGateway(
      startGoalCommandHandler
    );
    const startGoalController = new StartGoalController(
      startGoalGateway
    );

    // PauseGoal Controller
    const pauseGoalCommandHandler = new PauseGoalCommandHandler(
      goalPausedEventStore,
      goalPausedEventStore,
      goalPausedProjector,
      eventBus
    );
    const pauseGoalGateway = new LocalPauseGoalGateway(
      pauseGoalCommandHandler,
      goalPausedProjector
    );
    const pauseGoalController = new PauseGoalController(
      pauseGoalGateway
    );

    // PostponeGoal Controller
    const postponeGoalCommandHandler = new PostponeGoalCommandHandler(
      goalPostponedEventStore,
      goalPostponedEventStore,
      goalViewReader,
      eventBus
    );
    const postponeGoalGateway = new LocalPostponeGoalGateway(postponeGoalCommandHandler);
    const postponeGoalController = new PostponeGoalController(postponeGoalGateway);

    // ReinstateGoal Controller
    const reinstateGoalCommandHandler = new ReinstateGoalCommandHandler(
      goalReinstatedEventStore,
      goalReinstatedEventStore,
      goalViewReader,
      eventBus
    );
    const reinstateGoalGateway = new LocalReinstateGoalGateway(reinstateGoalCommandHandler);
    const reinstateGoalController = new ReinstateGoalController(reinstateGoalGateway);

    // RemoveGoal Controller
    const removeGoalCommandHandler = new RemoveGoalCommandHandler(
      goalRemovedEventStore,
      goalRemovedEventStore,
      goalRemovedProjector,
      eventBus
    );
    const removeGoalGateway = new LocalRemoveGoalGateway(
      removeGoalCommandHandler,
      goalRemovedProjector
    );
    const removeGoalController = new RemoveGoalController(
      removeGoalGateway
    );

    // ResetGoal Controller
    const resetGoalCommandHandler = new ResetGoalCommandHandler(
      goalResetEventStore,
      goalResetEventStore,
      goalResetProjector,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader
    );
    const resetGoalGateway = new LocalResetGoalGateway(
      resetGoalCommandHandler,
      goalResetProjector
    );
    const resetGoalController = new ResetGoalController(
      resetGoalGateway
    );

    // UpdateGoal Controller
    const updateGoalCommandHandler = new UpdateGoalCommandHandler(
      goalUpdatedEventStore,
      goalUpdatedEventStore,
      goalUpdatedProjector,
      eventBus
    );
    const updateGoalGateway = new LocalUpdateGoalGateway(
      updateGoalCommandHandler
    );
    const updateGoalController = new UpdateGoalController(
      updateGoalGateway
    );

    // UpdateGoalProgress Controller
    const updateGoalProgressCommandHandler = new UpdateGoalProgressCommandHandler(
      goalProgressUpdatedEventStore,
      goalProgressUpdatedEventStore,
      goalProgressUpdatedProjector,
      eventBus,
      goalContextQueryHandler
    );
    const updateGoalProgressGateway = new LocalUpdateGoalProgressGateway(
      updateGoalProgressCommandHandler
    );
    const updateGoalProgressController = new UpdateGoalProgressController(
      updateGoalProgressGateway
    );

    // RefineGoal Controller
    const refineGoalCommandHandler = new RefineGoalCommandHandler(
      goalRefinedEventStore,
      goalRefinedEventStore,
      goalRefinedProjector,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader,
      settingsReader,
      goalContextQueryHandler
    );
    const refineGoalGateway = new LocalRefineGoalGateway(
      refineGoalCommandHandler
    );
    const refineGoalController = new RefineGoalController(
      refineGoalGateway
    );

    // CommitGoal Controller
    const commitGoalCommandHandler = new CommitGoalCommandHandler(
      goalCommittedEventStore,
      goalCommittedEventStore,
      goalCommittedProjector,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader,
      goalContextQueryHandler
    );
    const commitGoalGateway = new LocalCommitGoalGateway(
      commitGoalCommandHandler
    );
    const commitGoalController = new CommitGoalController(
      commitGoalGateway
    );

    // RejectGoal Controller
    const rejectGoalCommandHandler = new RejectGoalCommandHandler(
      goalRejectedEventStore,
      goalRejectedEventStore,
      goalRejectedProjector,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader,
      goalContextQueryHandler
    );
    const rejectGoalGateway = new LocalRejectGoalGateway(
      rejectGoalCommandHandler
    );
    const rejectGoalController = new RejectGoalController(
      rejectGoalGateway
    );

    // SubmitGoal Controller
    const submitGoalCommandHandler = new SubmitGoalCommandHandler(
      goalSubmittedEventStore,
      goalSubmittedEventStore,
      goalSubmittedProjector,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader,
      goalContextQueryHandler
    );
    const submitGoalGateway = new LocalSubmitGoalGateway(
      submitGoalCommandHandler
    );
    const submitGoalController = new SubmitGoalController(
      submitGoalGateway
    );

    // CodifyGoal Controller
    const codifyGoalCommandHandler = new CodifyGoalCommandHandler(
      goalCodifyingStartedEventStore,
      goalCodifyingStartedEventStore,
      goalCodifyingStartedProjector,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader,
      settingsReader,
      goalContextQueryHandler
    );
    const codifyGoalGateway = new LocalCodifyGoalGateway(
      codifyGoalCommandHandler
    );
    const codifyGoalController = new CodifyGoalController(
      codifyGoalGateway
    );

    // CloseGoal Controller
    const closeGoalCommandHandler = new CloseGoalCommandHandler(
      goalClosedEventStore,
      goalClosedEventStore,
      goalClosedProjector,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader,
      goalContextQueryHandler
    );
    const closeGoalGateway = new LocalCloseGoalGateway(
      closeGoalCommandHandler,
      goalClosedProjector,
      goalClaimPolicy,
      workerIdentityReader
    );
    const closeGoalController = new CloseGoalController(
      closeGoalGateway
    );

    // GetGoals Controller
    const getGoalsGateway = new LocalGetGoalsGateway(goalStatusReader);
    const getGoalsController = new GetGoalsController(getGoalsGateway);

    // ShowGoal Controller
    const showGoalGateway = new LocalShowGoalGateway(goalContextQueryHandler);
    const showGoalController = new ShowGoalController(showGoalGateway);

    // Work Controllers
    const pauseWorkCommandHandler = new PauseWorkCommandHandler(
      workerIdentityReader,
      goalStatusReader,
      pauseGoalCommandHandler,
      logger
    );
    const pauseWorkGateway = new LocalPauseWorkGateway(pauseWorkCommandHandler);
    const pauseWorkController = new PauseWorkController(pauseWorkGateway);
    const resumeGoalCommandHandler = new ResumeGoalCommandHandler(
      goalResumedEventStore,
      goalResumedEventStore,
      goalResumedProjector,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader,
      settingsReader,
      goalContextQueryHandler
    );
    const resumeGoalGateway = new LocalResumeGoalGateway(
      resumeGoalCommandHandler
    );
    const resumeGoalController = new ResumeGoalController(
      resumeGoalGateway
    );
    const resumeWorkGateway = new LocalResumeWorkGateway(
      workerIdentityReader,
      goalStatusReader,
      resumeGoalCommandHandler,
      sessionContextQueryHandler,
      logger
    );
    const resumeWorkController = new ResumeWorkController(
      resumeWorkGateway
    );

    // Architecture Controllers
    const defineArchitectureGateway = new LocalDefineArchitectureGateway(
      architectureDefinedEventStore,
      architectureDefinedProjector,
      eventBus
    );
    const defineArchitectureController = new DefineArchitectureController(
      defineArchitectureGateway
    );
    const updateArchitectureGateway = new LocalUpdateArchitectureGateway(
      architectureUpdatedEventStore,
      architectureUpdatedEventStore,
      eventBus
    );
    const updateArchitectureController = new UpdateArchitectureController(
      updateArchitectureGateway
    );
    const getArchitectureGateway = new LocalGetArchitectureGateway(
      architectureReader
    );
    const getArchitectureController = new GetArchitectureController(
      getArchitectureGateway
    );

    // Decision Controllers
    const addDecisionCommandHandler = new AddDecisionCommandHandler(
      decisionAddedEventStore,
      eventBus
    );
    const addDecisionGateway = new LocalAddDecisionGateway(
      addDecisionCommandHandler
    );
    const addDecisionController = new AddDecisionController(
      addDecisionGateway
    );
    const getDecisionsGateway = new LocalGetDecisionsGateway(
      decisionViewReader
    );
    const getDecisionsController = new GetDecisionsController(
      getDecisionsGateway
    );
    const showDecisionGateway = new LocalShowDecisionGateway(
      decisionViewReader
    );
    const showDecisionController = new ShowDecisionController(
      showDecisionGateway
    );
    const searchDecisionsGateway = new LocalSearchDecisionsGateway(
      decisionViewReader
    );
    const searchDecisionsController = new SearchDecisionsController(
      searchDecisionsGateway
    );
    const reverseDecisionCommandHandler = new ReverseDecisionCommandHandler(
      decisionReversedEventStore,
      decisionReversedProjector,
      eventBus
    );
    const reverseDecisionGateway = new LocalReverseDecisionGateway(
      reverseDecisionCommandHandler
    );
    const reverseDecisionController = new ReverseDecisionController(
      reverseDecisionGateway
    );
    const restoreDecisionCommandHandler = new RestoreDecisionCommandHandler(
      decisionRestoredEventStore,
      decisionRestoredProjector,
      eventBus
    );
    const restoreDecisionGateway = new LocalRestoreDecisionGateway(
      restoreDecisionCommandHandler
    );
    const restoreDecisionController = new RestoreDecisionController(
      restoreDecisionGateway
    );
    const supersedeDecisionCommandHandler = new SupersedeDecisionCommandHandler(
      decisionSupersededEventStore,
      decisionSupersededProjector,
      eventBus
    );
    const supersedeDecisionGateway = new LocalSupersedeDecisionGateway(
      supersedeDecisionCommandHandler
    );
    const supersedeDecisionController = new SupersedeDecisionController(
      supersedeDecisionGateway
    );
    const updateDecisionCommandHandler = new UpdateDecisionCommandHandler(
      decisionUpdatedEventStore,
      decisionUpdatedProjector,
      eventBus
    );
    const updateDecisionGateway = new LocalUpdateDecisionGateway(
      updateDecisionCommandHandler
    );
    const updateDecisionController = new UpdateDecisionController(
      updateDecisionGateway
    );

    // Component Controllers
    const addComponentCommandHandler = new AddComponentCommandHandler(
      componentAddedEventStore,
      eventBus,
      componentAddedProjector
    );
    const addComponentGateway = new LocalAddComponentGateway(
      addComponentCommandHandler,
      componentUpdatedProjector
    );
    const addComponentController = new AddComponentController(
      addComponentGateway
    );
    const getComponentsGateway = new LocalGetComponentsGateway(componentViewReader);
    const getComponentsController = new GetComponentsController(getComponentsGateway);
    const searchComponentsGateway = new LocalSearchComponentsGateway(componentViewReader);
    const searchComponentsController = new SearchComponentsController(searchComponentsGateway);
    const updateComponentCommandHandler = new UpdateComponentCommandHandler(
      componentUpdatedEventStore,
      eventBus,
      componentUpdatedProjector
    );
    const updateComponentGateway = new LocalUpdateComponentGateway(
      updateComponentCommandHandler,
      componentUpdatedProjector
    );
    const updateComponentController = new UpdateComponentController(
      updateComponentGateway
    );
    const renameComponentCommandHandler = new RenameComponentCommandHandler(
      componentRenamedEventStore,
      eventBus,
      componentRenamedProjector
    );
    const renameComponentGateway = new LocalRenameComponentGateway(
      renameComponentCommandHandler,
      componentRenamedProjector
    );
    const renameComponentController = new RenameComponentController(
      renameComponentGateway
    );
    const showComponentGateway = new LocalShowComponentGateway(
      componentReader,
      relationViewReader
    );
    const showComponentController = new ShowComponentController(
      showComponentGateway
    );
    const deprecateComponentCommandHandler = new DeprecateComponentCommandHandler(
      componentDeprecatedEventStore,
      eventBus,
      componentDeprecatedProjector
    );
    const deprecateComponentGateway = new LocalDeprecateComponentGateway(
      deprecateComponentCommandHandler,
      componentDeprecatedProjector
    );
    const deprecateComponentController = new DeprecateComponentController(
      deprecateComponentGateway
    );
    const undeprecateComponentCommandHandler = new UndeprecateComponentCommandHandler(
      componentUndeprecatedEventStore,
      eventBus,
      componentUndeprecatedProjector
    );
    const undeprecateComponentGateway = new LocalUndeprecateComponentGateway(
      undeprecateComponentCommandHandler,
      componentUndeprecatedProjector
    );
    const undeprecateComponentController = new UndeprecateComponentController(
      undeprecateComponentGateway
    );
    const removeComponentCommandHandler = new RemoveComponentCommandHandler(
      componentRemovedEventStore,
      eventBus,
      componentRemovedProjector
    );
    const removeComponentGateway = new LocalRemoveComponentGateway(
      removeComponentCommandHandler,
      componentRemovedProjector
    );
    const removeComponentController = new RemoveComponentController(
      removeComponentGateway
    );

    // Dependency Controllers
    const addDependencyCommandHandler = new AddDependencyCommandHandler(
      dependencyAddedEventStore,
      eventBus,
      dependencyAddedProjector
    );
    const addDependencyGateway = new LocalAddDependencyGateway(
      addDependencyCommandHandler
    );
    const addDependencyController = new AddDependencyController(
      addDependencyGateway
    );
    const getDependenciesGateway = new LocalGetDependenciesGateway(
      dependencyViewReader
    );
    const getDependenciesController = new GetDependenciesController(
      getDependenciesGateway
    );
    const updateDependencyCommandHandler = new UpdateDependencyCommandHandler(
      dependencyUpdatedEventStore,
      dependencyUpdatedEventStore,
      dependencyUpdatedProjector,
      eventBus
    );
    const updateDependencyGateway = new LocalUpdateDependencyGateway(
      updateDependencyCommandHandler,
      dependencyUpdatedProjector
    );
    const updateDependencyController = new UpdateDependencyController(
      updateDependencyGateway
    );
    const removeDependencyCommandHandler = new RemoveDependencyCommandHandler(
      dependencyRemovedEventStore,
      dependencyRemovedEventStore,
      dependencyRemovedProjector,
      eventBus
    );
    const removeDependencyGateway = new LocalRemoveDependencyGateway(
      removeDependencyCommandHandler,
      dependencyRemovedProjector
    );
    const removeDependencyController = new RemoveDependencyController(
      removeDependencyGateway
    );

    // Audience Pain Controllers
    const addAudiencePainCommandHandler = new AddAudiencePainCommandHandler(
      audiencePainAddedEventStore,
      eventBus
    );
    const addAudiencePainGateway = new LocalAddAudiencePainGateway(
      addAudiencePainCommandHandler,
      audiencePainUpdatedProjector
    );
    const addAudiencePainController = new AddAudiencePainController(
      addAudiencePainGateway
    );
    const updateAudiencePainCommandHandler = new UpdateAudiencePainCommandHandler(
      audiencePainUpdatedEventStore,
      eventBus,
      audiencePainUpdatedProjector
    );
    const updateAudiencePainGateway = new LocalUpdateAudiencePainGateway(
      updateAudiencePainCommandHandler,
      audiencePainUpdatedProjector
    );
    const updateAudiencePainController = new UpdateAudiencePainController(
      updateAudiencePainGateway
    );
    const getAudiencePainsGateway = new LocalGetAudiencePainsGateway(audiencePainContextReader);
    const getAudiencePainsController = new GetAudiencePainsController(getAudiencePainsGateway);

    // Audience Controllers
    const addAudienceCommandHandler = new AddAudienceCommandHandler(
      audienceAddedEventStore,
      eventBus
    );
    const addAudienceGateway = new LocalAddAudienceGateway(addAudienceCommandHandler);
    const addAudienceController = new AddAudienceController(addAudienceGateway);
    const listAudiencesGateway = new LocalListAudiencesGateway(audienceContextReader);
    const listAudiencesController = new ListAudiencesController(listAudiencesGateway);
    const removeAudienceCommandHandler = new RemoveAudienceCommandHandler(
      audienceRemovedEventStore,
      eventBus,
      audienceRemovedProjector
    );
    const removeAudienceGateway = new LocalRemoveAudienceGateway(
      removeAudienceCommandHandler,
      audienceRemovedProjector
    );
    const removeAudienceController = new RemoveAudienceController(
      removeAudienceGateway
    );
    const updateAudienceCommandHandler = new UpdateAudienceCommandHandler(
      audienceUpdatedEventStore,
      eventBus
    );
    const updateAudienceGateway = new LocalUpdateAudienceGateway(
      updateAudienceCommandHandler,
      audienceUpdatedProjector
    );
    const updateAudienceController = new UpdateAudienceController(
      updateAudienceGateway
    );

    // Project Initialization Protocol
    const gitignoreProtocol = new FsGitignoreProtocol();
    const initializeProjectCommandHandler = new InitializeProjectCommandHandler(
      projectInitializedEventStore,
      eventBus,
      projectInitializedProjector,
      agentFileProtocol,
      settingsInitializer,
      gitignoreProtocol,
      projectIdentityResolver
    );
    const localPlanProjectInitGateway = new LocalPlanProjectInitGateway(
      agentFileProtocol,
      settingsInitializer,
      gitignoreProtocol
    );
    const planProjectInitController = new PlanProjectInitController(
      localPlanProjectInitGateway
    );
    const localInitializeProjectGateway = new LocalInitializeProjectGateway(
      initializeProjectCommandHandler,
      localPlanProjectInitGateway,
      agentFileProtocol
    );
    const initializeProjectController = new InitializeProjectController(
      localInitializeProjectGateway
    );

    // AddRelation Controller
    const addRelationCommandHandler = new AddRelationCommandHandler(
      relationAddedEventStore,
      eventBus,
      relationAddedProjector
    );
    const addRelationGateway = new LocalAddRelationGateway(
      addRelationCommandHandler
    );
    const addRelationController = new AddRelationController(
      addRelationGateway
    );

    // Migrate Dependencies command handler
    const migrateDependenciesCommandHandler = new MigrateDependenciesCommandHandler(
      legacyDependencyReader,
      addRelationCommandHandler,
      removeDependencyCommandHandler
    );
    const infrastructureDir = path.resolve(__dirname, "..");
    const evolveMigrationRunner = new MigrationRunner(this.db);
    const evolveController = new EvolveController(
      () => evolveMigrationRunner.runNamespaceMigrations(getNamespaceMigrations(infrastructureDir)),
      upgradeCommandHandler,
      migrateDependenciesCommandHandler,
      projectRootResolver,
      agentFileProtocol,
      settingsInitializer,
      databaseRebuildService,
      logger
    );

    // RemoveRelation Controller
    const removeRelationCommandHandler = new RemoveRelationCommandHandler(
      relationRemovedEventStore,
      relationRemovedEventStore,
      eventBus,
      relationRemovedProjector
    );
    const deactivateRelationCommandHandler = new DeactivateRelationCommandHandler(
      relationDeactivatedEventStore,
      relationDeactivatedEventStore,
      eventBus,
      relationDeactivatedProjector
    );
    const relationDeactivationCascade = new RelationDeactivationCascade(
      relationViewReader,
      deactivateRelationCommandHandler
    );
    const relationPruningCascade = new RelationPruningCascade(
      relationViewReader,
      removeRelationCommandHandler
    );
    const reactivateRelationCommandHandler = new ReactivateRelationCommandHandler(
      relationReactivatedEventStore,
      relationReactivatedEventStore,
      eventBus,
      relationReactivatedProjector
    );
    const relationReactivationCascade = new RelationReactivationCascade(
      relationViewReader,
      reactivateRelationCommandHandler
    );
    const relationMaintenanceGoalRegistrar = new RelationMaintenanceGoalRegistrar(
      relationViewReader,
      addGoalCommandHandler
    );
    const relationDiscoveryGoalRegistrar = new RelationDiscoveryGoalRegistrar(
      goalStatusReader,
      addGoalCommandHandler,
      logger
    );
    const relationDiscoveryEventHandler = new RelationDiscoveryEventHandler(
      relationDiscoveryGoalRegistrar
    );
    const removeRelationGateway = new LocalRemoveRelationGateway(
      removeRelationCommandHandler,
      relationRemovedProjector
    );
    const removeRelationController = new RemoveRelationController(
      removeRelationGateway
    );

    // GetRelations Controller
    const getRelationsGateway = new LocalGetRelationsGateway(
      relationViewReader
    );
    const getRelationsController = new GetRelationsController(
      getRelationsGateway
    );
    const relationNodeReferenceResolver = new RelationNodeReferenceResolver(relationViewReader);
    const relationTraversalQueryNormalizer = new RelationTraversalQueryNormalizer();
    const relationTraversalPolicy = new RelationTraversalPolicy();
    const traverseRelationsGateway = new LocalTraverseRelationsGateway(
      relationViewReader,
      relationNodeReferenceResolver,
      relationTraversalQueryNormalizer,
      relationTraversalPolicy
    );
    const traverseRelationsController = new TraverseRelationsController(traverseRelationsGateway);
    const relationShortestPathFinder = new RelationShortestPathFinder(
      relationViewReader,
      relationTraversalPolicy
    );
    const findRelationPathGateway = new LocalFindRelationPathGateway(
      relationNodeReferenceResolver,
      relationTraversalQueryNormalizer,
      relationShortestPathFinder
    );
    const findRelationPathController = new FindRelationPathController(findRelationPathGateway);
    const relationAuditPolicy = new RelationAuditPolicy();
    const auditRelationsController = new AuditRelationsController(
      relationNodeCatalog,
      relationViewReader,
      relationAuditPolicy,
    );

    // ============================================================
    // STEP 5: Create Projection Handlers (Event Subscribers)
    // ============================================================

    // Work Category - Session Projection Handlers - using decomposed projectors
    const sessionStartedEventHandler = new SessionStartedEventHandler(sessionStartedProjector);
    const sessionEndedEventHandler = new SessionEndedEventHandler(sessionEndedProjector);
    const goalAddedEventHandler = new GoalAddedEventHandler(goalAddedProjector);
    const goalStartedEventHandler = new GoalStartedEventHandler(goalStartedProjector);
    const goalUpdatedEventHandler = new GoalUpdatedEventHandler(goalUpdatedProjector, relationMaintenanceGoalRegistrar);
    const goalBlockedEventHandler = new GoalBlockedEventHandler(goalBlockedProjector);
    const goalUnblockedEventHandler = new GoalUnblockedEventHandler(goalUnblockedProjector);
    const goalPausedEventHandler = new GoalPausedEventHandler(goalPausedProjector);
    const goalPostponedEventHandler = new GoalPostponedEventHandler(goalPostponedProjector);
    const goalReinstatedEventHandler = new GoalReinstatedEventHandler(goalReinstatedProjector);
    const goalResumedEventHandler = new GoalResumedEventHandler(goalResumedProjector);
    const goalCompletedEventHandler = new GoalCompletedEventHandler(goalCompletedProjector);
    const goalRefinedEventHandler = new GoalRefinedEventHandler(goalRefinedProjector);
    const goalResetEventHandler = new GoalResetEventHandler(goalResetProjector);
    const goalRemovedEventHandler = new GoalRemovedEventHandler(goalRemovedProjector, relationPruningCascade);
    const goalProgressUpdatedEventHandler = new GoalProgressUpdatedEventHandler(goalProgressUpdatedProjector);
    const goalSubmittedForReviewEventHandler = new GoalSubmittedForReviewEventHandler(goalSubmittedForReviewProjector);
    const goalQualifiedEventHandler = new GoalQualifiedEventHandler(goalQualifiedProjector);
    const goalRefinementStartedEventHandler = new GoalRefinementStartedEventHandler(goalRefinedProjector);
    const goalCommittedEventHandler = new GoalCommittedEventHandler(goalCommittedProjector);
    const goalRejectedEventHandler = new GoalRejectedEventHandler(goalRejectedProjector);
    const goalSubmittedEventHandler = new GoalSubmittedEventHandler(goalSubmittedProjector);
    const goalCodifyingStartedEventHandler = new GoalCodifyingStartedEventHandler(goalCodifyingStartedProjector);
    const goalClosedEventHandler = new GoalClosedEventHandler(goalClosedProjector);
    const goalApprovedEventHandler = new GoalApprovedEventHandler(goalApprovedProjector);
    const goalStatusMigratedEventHandler = new GoalStatusMigratedEventHandler(goalStatusMigratedProjector);

    // Solution Category
    // Architecture Event Handlers - decomposed by use case
    const architectureDefinedEventHandler = new ArchitectureDefinedEventHandler(architectureDefinedProjector);
    const architectureUpdatedEventHandler = new ArchitectureUpdatedEventHandler(architectureUpdatedProjector, relationMaintenanceGoalRegistrar);
    const architectureDeprecatedEventHandler = new ArchitectureDeprecatedEventHandler(architectureDeprecatedProjector);
    // Component Event Handlers - decomposed by use case
    const componentAddedEventHandler = new ComponentAddedEventHandler(componentAddedProjector);
    const componentUpdatedEventHandler = new ComponentUpdatedEventHandler(componentUpdatedProjector, relationMaintenanceGoalRegistrar);
    const componentDeprecatedEventHandler = new ComponentDeprecatedEventHandler(componentDeprecatedProjector, relationDeactivationCascade, relationMaintenanceGoalRegistrar);
    const componentUndeprecatedEventHandler = new ComponentUndeprecatedEventHandler(componentUndeprecatedProjector, relationReactivationCascade, relationMaintenanceGoalRegistrar);
    const componentRemovedEventHandler = new ComponentRemovedEventHandler(componentRemovedProjector, relationPruningCascade);
    const componentRenamedEventHandler = new ComponentRenamedEventHandler(componentRenamedProjector);
    // Dependency Event Handlers - decomposed by use case
    const dependencyAddedEventHandler = new DependencyAddedEventHandler(dependencyAddedProjector);
    const dependencyUpdatedEventHandler = new DependencyUpdatedEventHandler(dependencyUpdatedProjector, relationMaintenanceGoalRegistrar);
    const dependencyRemovedEventHandler = new DependencyRemovedEventHandler(dependencyRemovedProjector, relationMaintenanceGoalRegistrar);
    // Decision Event Handlers - decomposed by use case
    const decisionAddedEventHandler = new DecisionAddedEventHandler(decisionAddedProjector);
    const decisionUpdatedEventHandler = new DecisionUpdatedEventHandler(decisionUpdatedProjector, relationMaintenanceGoalRegistrar);
    const decisionReversedEventHandler = new DecisionReversedEventHandler(decisionReversedProjector, relationDeactivationCascade);
    const decisionRestoredEventHandler = new DecisionRestoredEventHandler(decisionRestoredProjector, relationReactivationCascade, relationMaintenanceGoalRegistrar);
    const decisionSupersededEventHandler = new DecisionSupersededEventHandler(decisionSupersededProjector, relationDeactivationCascade, relationMaintenanceGoalRegistrar);
    // Guideline Event Handlers - decomposed by use case
    const guidelineAddedEventHandler = new GuidelineAddedEventHandler(guidelineAddedProjector);
    const guidelineUpdatedEventHandler = new GuidelineUpdatedEventHandler(guidelineUpdatedProjector, relationMaintenanceGoalRegistrar);
    const guidelineRemovedEventHandler = new GuidelineRemovedEventHandler(guidelineRemovedProjector, relationMaintenanceGoalRegistrar);
    // Invariant Event Handlers - decomposed by use case
    const invariantAddedEventHandler = new InvariantAddedEventHandler(invariantAddedProjector);
    const invariantUpdatedEventHandler = new InvariantUpdatedEventHandler(invariantUpdatedProjector, relationMaintenanceGoalRegistrar);
    const invariantRemovedEventHandler = new InvariantRemovedEventHandler(invariantRemovedProjector, relationMaintenanceGoalRegistrar);
    const searchDocumentProjectorRegistry = new SearchDocumentProjectorRegistry();
    const searchIndexEventHandler = new SearchIndexEventHandler(
      searchDocumentProjectorRegistry.createMemoryProjectors(),
      searchIndexStore,
      searchIndexStore
    );

    // Project Knowledge Category
    // Project Event Handlers - decomposed by use case
    const projectInitializedEventHandler = new ProjectInitializedEventHandler(projectInitializedProjector);
    const projectUpdatedEventHandler = new ProjectUpdatedEventHandler(projectUpdatedProjector, relationMaintenanceGoalRegistrar);
    // AudiencePain Event Handlers - decomposed by use case
    const audiencePainAddedEventHandler = new AudiencePainAddedEventHandler(audiencePainAddedProjector);
    const audiencePainUpdatedEventHandler = new AudiencePainUpdatedEventHandler(audiencePainUpdatedProjector, relationMaintenanceGoalRegistrar);
// Audience Event Handlers - decomposed by use case
    const audienceAddedEventHandler = new AudienceAddedEventHandler(audienceAddedProjector);
    const audienceUpdatedEventHandler = new AudienceUpdatedEventHandler(audienceUpdatedProjector, relationMaintenanceGoalRegistrar);
    const audienceRemovedEventHandler = new AudienceRemovedEventHandler(audienceRemovedProjector, relationMaintenanceGoalRegistrar);
    // ValueProposition Controllers
    const addValuePropositionCommandHandler = new AddValuePropositionCommandHandler(
      valuePropositionAddedEventStore,
      eventBus
    );
    const addValuePropositionGateway = new LocalAddValuePropositionGateway(
      addValuePropositionCommandHandler,
      valuePropositionUpdatedProjector
    );
    const addValuePropositionController = new AddValuePropositionController(
      addValuePropositionGateway
    );
    const removeValuePropositionCommandHandler = new RemoveValuePropositionCommandHandler(
      valuePropositionRemovedEventStore,
      eventBus,
      valuePropositionRemovedProjector
    );
    const removeValuePropositionGateway = new LocalRemoveValuePropositionGateway(
      removeValuePropositionCommandHandler,
      valuePropositionRemovedProjector
    );
    const removeValuePropositionController = new RemoveValuePropositionController(
      removeValuePropositionGateway
    );
    const getValuePropositionsGateway = new LocalGetValuePropositionsGateway(
      valuePropositionContextReader
    );
    const getValuePropositionsController = new GetValuePropositionsController(
      getValuePropositionsGateway
    );
    const updateValuePropositionCommandHandler = new UpdateValuePropositionCommandHandler(
      valuePropositionUpdatedEventStore,
      eventBus,
      valuePropositionUpdatedProjector
    );
    const updateValuePropositionGateway = new LocalUpdateValuePropositionGateway(
      updateValuePropositionCommandHandler,
      valuePropositionUpdatedProjector
    );
    const updateValuePropositionController = new UpdateValuePropositionController(
      updateValuePropositionGateway
    );
    // ValueProposition Event Handlers - decomposed by use case
    const valuePropositionAddedEventHandler = new ValuePropositionAddedEventHandler(valuePropositionAddedProjector);
    const valuePropositionUpdatedEventHandler = new ValuePropositionUpdatedEventHandler(valuePropositionUpdatedProjector, relationMaintenanceGoalRegistrar);
    const valuePropositionRemovedEventHandler = new ValuePropositionRemovedEventHandler(valuePropositionRemovedProjector, relationMaintenanceGoalRegistrar);

    // Relations Category - Event Handlers - decomposed by use case
    const relationAddedEventHandler = new RelationAddedEventHandler(relationAddedProjector);
    const relationDeactivatedEventHandler = new RelationDeactivatedEventHandler(relationDeactivatedProjector);
    const relationReactivatedEventHandler = new RelationReactivatedEventHandler(relationReactivatedProjector);
    const relationRemovedEventHandler = new RelationRemovedEventHandler(relationRemovedProjector);

    // Worker Identity - Event Handlers
    const workerIdentifiedEventHandler = new WorkerIdentifiedEventHandler(workerIdentifiedProjector);

    // ============================================================
    // STEP 6: Subscribe Projection Handlers to Events
    // ============================================================

    // Work Category - Session events
    eventBus.subscribe("SessionStartedEvent", sessionStartedEventHandler);
    eventBus.subscribe("SessionEndedEvent", sessionEndedEventHandler);

    // Work Category - Goal events
    eventBus.subscribe("GoalAddedEvent", goalAddedEventHandler);
    eventBus.subscribe("GoalStartedEvent", goalStartedEventHandler);
    eventBus.subscribe("GoalUpdatedEvent", goalUpdatedEventHandler);
    eventBus.subscribe("GoalBlockedEvent", goalBlockedEventHandler);
    eventBus.subscribe("GoalUnblockedEvent", goalUnblockedEventHandler);
    eventBus.subscribe("GoalPausedEvent", goalPausedEventHandler);
    eventBus.subscribe(GoalEventType.POSTPONED, goalPostponedEventHandler);
    eventBus.subscribe(GoalEventType.REINSTATED, goalReinstatedEventHandler);
    eventBus.subscribe("GoalResumedEvent", goalResumedEventHandler);
    eventBus.subscribe("GoalCompletedEvent", goalCompletedEventHandler);
    eventBus.subscribe("GoalRefinedEvent", goalRefinedEventHandler);
    eventBus.subscribe("GoalResetEvent", goalResetEventHandler);
    eventBus.subscribe("GoalRemovedEvent", goalRemovedEventHandler);
    eventBus.subscribe("GoalProgressUpdatedEvent", goalProgressUpdatedEventHandler);
    eventBus.subscribe("GoalSubmittedForReviewEvent", goalSubmittedForReviewEventHandler);
    eventBus.subscribe("GoalQualifiedEvent", goalQualifiedEventHandler);
    eventBus.subscribe("GoalRefinementStartedEvent", goalRefinementStartedEventHandler);
    eventBus.subscribe("GoalCommittedEvent", goalCommittedEventHandler);
    eventBus.subscribe("GoalRejectedEvent", goalRejectedEventHandler);
    eventBus.subscribe("GoalSubmittedEvent", goalSubmittedEventHandler);
    eventBus.subscribe("GoalCodifyingStartedEvent", goalCodifyingStartedEventHandler);
    eventBus.subscribe("GoalClosedEvent", goalClosedEventHandler);
    eventBus.subscribe("GoalApprovedEvent", goalApprovedEventHandler);
    eventBus.subscribe("GoalStatusMigratedEvent", goalStatusMigratedEventHandler);

    // Solution Category - Architecture events - decomposed by use case
    eventBus.subscribe("ArchitectureDefinedEvent", architectureDefinedEventHandler);
    eventBus.subscribe("ArchitectureUpdatedEvent", architectureUpdatedEventHandler);
    eventBus.subscribe("ArchitectureDeprecatedEvent", architectureDeprecatedEventHandler);

    // Solution Category - Component events - decomposed by use case
    eventBus.subscribe("ComponentAddedEvent", componentAddedEventHandler);
    eventBus.subscribe("ComponentUpdatedEvent", componentUpdatedEventHandler);
    eventBus.subscribe("ComponentDeprecatedEvent", componentDeprecatedEventHandler);
    eventBus.subscribe("ComponentUndeprecatedEvent", componentUndeprecatedEventHandler);
    eventBus.subscribe("ComponentRemovedEvent", componentRemovedEventHandler);
    eventBus.subscribe("ComponentRenamedEvent", componentRenamedEventHandler);

    // Solution Category - Dependency events - decomposed by use case
    eventBus.subscribe("DependencyAddedEvent", dependencyAddedEventHandler);
    eventBus.subscribe("DependencyUpdatedEvent", dependencyUpdatedEventHandler);
    eventBus.subscribe("DependencyRemovedEvent", dependencyRemovedEventHandler);

    // Solution Category - Decision events - decomposed by use case
    eventBus.subscribe("DecisionAddedEvent", decisionAddedEventHandler);
    eventBus.subscribe("DecisionUpdatedEvent", decisionUpdatedEventHandler);
    eventBus.subscribe("DecisionReversedEvent", decisionReversedEventHandler);
    eventBus.subscribe("DecisionRestoredEvent", decisionRestoredEventHandler);
    eventBus.subscribe("DecisionSupersededEvent", decisionSupersededEventHandler);

    // Solution Category - Guideline events - decomposed by use case
    eventBus.subscribe("GuidelineAddedEvent", guidelineAddedEventHandler);
    eventBus.subscribe("GuidelineUpdatedEvent", guidelineUpdatedEventHandler);
    eventBus.subscribe("GuidelineRemovedEvent", guidelineRemovedEventHandler);

    // Solution Category - Invariant events - decomposed by use case
    eventBus.subscribe("InvariantAddedEvent", invariantAddedEventHandler);
    eventBus.subscribe("InvariantUpdatedEvent", invariantUpdatedEventHandler);
    eventBus.subscribe("InvariantRemovedEvent", invariantRemovedEventHandler);

    // Global search index projections
    for (const eventType of searchIndexEventHandler.eventTypes) {
      eventBus.subscribe(eventType, searchIndexEventHandler);
    }

    // Relation discovery - auto-register goals for newly created entities
    eventBus.subscribe("ComponentAddedEvent", relationDiscoveryEventHandler);
    eventBus.subscribe("DecisionAddedEvent", relationDiscoveryEventHandler);
    eventBus.subscribe("DependencyAddedEvent", relationDiscoveryEventHandler);
    eventBus.subscribe("GuidelineAddedEvent", relationDiscoveryEventHandler);
    eventBus.subscribe("InvariantAddedEvent", relationDiscoveryEventHandler);

    // Project Knowledge Category - Project events - decomposed by use case
    eventBus.subscribe("ProjectInitializedEvent", projectInitializedEventHandler);
    eventBus.subscribe("ProjectUpdatedEvent", projectUpdatedEventHandler);

    // Project Knowledge Category - Audience Pain events - decomposed by use case
    eventBus.subscribe("AudiencePainAddedEvent", audiencePainAddedEventHandler);
    eventBus.subscribe("AudiencePainUpdatedEvent", audiencePainUpdatedEventHandler);


    // Project Knowledge Category - Audience events - decomposed by use case
    eventBus.subscribe("AudienceAddedEvent", audienceAddedEventHandler);
    eventBus.subscribe("AudienceUpdatedEvent", audienceUpdatedEventHandler);
    eventBus.subscribe("AudienceRemovedEvent", audienceRemovedEventHandler);

    // Project Knowledge Category - Value Proposition events - decomposed by use case
    eventBus.subscribe("ValuePropositionAddedEvent", valuePropositionAddedEventHandler);
    eventBus.subscribe("ValuePropositionUpdatedEvent", valuePropositionUpdatedEventHandler);
    eventBus.subscribe("ValuePropositionRemovedEvent", valuePropositionRemovedEventHandler);

    // Relations Category - Relation events - decomposed by use case
    eventBus.subscribe("RelationAddedEvent", relationAddedEventHandler);
    eventBus.subscribe("RelationDeactivatedEvent", relationDeactivatedEventHandler);
    eventBus.subscribe("RelationReactivatedEvent", relationReactivatedEventHandler);
    eventBus.subscribe("RelationRemovedEvent", relationRemovedEventHandler);

    // Worker Identity events
    eventBus.subscribe("WorkerIdentifiedEvent", workerIdentifiedEventHandler);

    // Worker identity must resolve through event persistence + projection before handlers use it.
    await workerIdentityRegistry.initialize();

    // ============================================================
    // STEP 7: Return Complete Container (No Lifecycle Management)
    // ============================================================

    return {
      // Core Infrastructure
      projectRootResolver,
      eventBus,
      eventStore,
      clock,
      logger,
      settingsReader,
      settingsInitializer,
      telemetryClient,

      // Worker Identity
      workerIdentityReader,

      // Goal Claims
      goalClaimPolicy,

      // Maintenance Controllers
      rebuildDatabaseController,
      evolveController,
      upgradeCommandHandler,
      migrateDependenciesCommandHandler,

      // CLI Version
      cliVersionReader,
      cliUpdateController,

      // Work Category - Session Event Stores - decomposed by use case
      sessionStartedEventStore,
      sessionEndedEventStore,
      // Goal Event Stores - decomposed by use case
      goalAddedEventStore,
      goalStartedEventStore,
      goalUpdatedEventStore,
      goalBlockedEventStore,
      goalUnblockedEventStore,
      goalPausedEventStore,
      goalPostponedEventStore,
      goalReinstatedEventStore,
      goalResumedEventStore,
      goalCompletedEventStore,
      goalRefinedEventStore,
      goalResetEventStore,
      goalRemovedEventStore,
      goalProgressUpdatedEventStore,
      goalSubmittedForReviewEventStore,
      goalQualifiedEventStore,
      goalCommittedEventStore,
      goalRejectedEventStore,
      goalSubmittedEventStore,
      goalCodifyingStartedEventStore,
      goalClosedEventStore,
      // Session Projection Stores - decomposed by use case
      sessionStartedProjector,
      sessionEndedProjector,
      activeSessionReader,
      sessionViewReader,
      // Goal Projection Stores - decomposed by use case
      goalAddedProjector,
      goalStartedProjector,
      goalUpdatedProjector,
      goalBlockedProjector,
      goalUnblockedProjector,
      goalPausedProjector,
      goalPostponedProjector,
      goalReinstatedProjector,
      goalResumedProjector,
      goalCompletedProjector,
      goalRefinedProjector,
      goalResetProjector,
      goalRemovedProjector,
      goalProgressUpdatedProjector,
      goalCodifyingStartedProjector,
      goalClosedProjector,
      goalContextReader: goalStartedProjector,
      goalContextAssembler,
      goalContextQueryHandler,
      goalBacklogPreviewQueryHandler,
      goalViewReader,
      goalStatusReader,
      // Session Controllers
      sessionStartController,
      endSessionController,
      getSessionsController,
      getTelemetryStatusController,
      updateTelemetryConsentController,
      // Worker Controllers
      viewWorkerController,
      // Goal Controllers
      addGoalController,
      startGoalController,
      reviewGoalController,
      qualifyGoalController,
      commitGoalController,
      rejectGoalController,
      submitGoalController,
      codifyGoalController,
      closeGoalController,
      blockGoalController,
      unblockGoalController,
      getGoalsController,
      showGoalController,
      pauseGoalController,
      postponeGoalController,
      reinstateGoalController,
      resumeGoalController,
      refineGoalController,
      removeGoalController,
      resetGoalController,
      updateGoalController,
      updateGoalProgressController,

      // Decision Controllers
      addDecisionController,
      getDecisionsController,
      showDecisionController,
      searchDecisionsController,
      reverseDecisionController,
      restoreDecisionController,
      supersedeDecisionController,
      updateDecisionController,

      // Work Controllers
      pauseWorkController,
      resumeWorkController,

      // Audience Pain Controllers
      addAudiencePainController,

      // Audience Controllers
      addAudienceController,
      listAudiencesController,
      removeAudienceController,
      updateAudienceController,

      // Architecture Controllers
      defineArchitectureController,
      updateArchitectureController,
      getArchitectureController,

      // Component Controllers
      addComponentController,
      getComponentsController,
      searchComponentsController,
      updateComponentController,
      renameComponentController,
      showComponentController,
      deprecateComponentController,
      undeprecateComponentController,
      removeComponentController,

      // Dependency Controllers
      addDependencyController,
      getDependenciesController,
      updateDependencyController,
      removeDependencyController,

      // Solution Category
      // Architecture Event Stores - decomposed by use case
      architectureDefinedEventStore,
      architectureUpdatedEventStore,
      architectureDeprecatedEventStore,
      // Component Event Stores - decomposed by use case
      componentAddedEventStore,
      componentUpdatedEventStore,
      componentUndeprecatedEventStore,
      componentRenamedEventStore,
      componentRemovedEventStore,
      // Dependency Event Stores - decomposed by use case
      dependencyAddedEventStore,
      dependencyUpdatedEventStore,
      dependencyRemovedEventStore,
      // Decision Event Stores - decomposed by use case
      decisionAddedEventStore,
      decisionUpdatedEventStore,
      decisionReversedEventStore,
      decisionRestoredEventStore,
      decisionSupersededEventStore,
      // Guideline Event Stores - decomposed by use case
      guidelineAddedEventStore,
      guidelineUpdatedEventStore,
      guidelineRemovedEventStore,
      // Invariant Event Stores - decomposed by use case
      invariantAddedEventStore,
      invariantUpdatedEventStore,
      invariantRemovedEventStore,
      // Architecture Projection Stores - decomposed by use case
      architectureDefinedProjector,
      architectureUpdatedProjector,
      architectureDeprecatedProjector,
      architectureReader,
      // Component Projection Stores - decomposed by use case
      componentAddedProjector,
      componentUpdatedProjector,
      componentRenamedProjector,
      componentDeprecatedProjector,
      componentUndeprecatedProjector,
      componentRemovedProjector,
      componentViewReader,
      componentReader,
      // Dependency Projection Stores - decomposed by use case
      dependencyAddedProjector,
      dependencyUpdatedProjector,
      dependencyRemovedProjector,
      dependencyViewReader,
      // Decision Projection Stores - decomposed by use case
      decisionAddedProjector,
      decisionUpdatedProjector,
      decisionReversedProjector,
      decisionRestoredProjector,
      decisionSupersededProjector,
      decisionViewReader,
      // Guideline Projection Stores - decomposed by use case
      guidelineAddedProjector,
      guidelineUpdatedProjector,
      guidelineRemovedProjector,
      guidelineViewReader,
      // Guideline Controllers
      addGuidelineController,
      updateGuidelineController,
      removeGuidelineController,
      getGuidelinesController,
      searchGuidelinesController,
      // Invariant Projection Stores - decomposed by use case
      invariantAddedProjector,
      invariantUpdatedProjector,
      invariantRemovedProjector,
      invariantViewReader,
      searchIndexReader: searchIndexStore,
      searchIndexWriter: searchIndexStore,
      searchController,
      // Invariant Controllers
      addInvariantController,
      updateInvariantController,
      removeInvariantController,
      getInvariantsController,
      // Brownfield Status
      brownfieldStatusReader,

      // Project Knowledge Category
      // Project Event Stores - decomposed by use case
      projectInitializedEventStore,
      projectUpdatedEventStore,
      // Project Services
      agentFileProtocol,
      planProjectInitController,
      initializeProjectController,
      // Audience Event Stores - decomposed by use case
      audienceAddedEventStore,
      audienceUpdatedEventStore,
      audienceRemovedEventStore,
      // AudiencePain Event Stores - decomposed by use case
      audiencePainAddedEventStore,
      audiencePainUpdatedEventStore,
// ValueProposition Event Stores - decomposed by use case
      valuePropositionAddedEventStore,
      valuePropositionUpdatedEventStore,
      valuePropositionRemovedEventStore,
      // Project Projection Stores - decomposed by use case
      projectInitializedProjector,
      projectUpdatedProjector,
      updateProjectController,
      showProjectController,
      projectStatsController,
      projectContextReader,
      // Audience Projection Stores - decomposed by use case
      audienceAddedProjector,
      audienceUpdatedProjector,
      audienceRemovedProjector,
      audienceContextReader,
      // AudiencePain Projection Stores - decomposed by use case
      audiencePainAddedProjector,
      audiencePainUpdatedProjector,
      updateAudiencePainController,
      getAudiencePainsController,
      audiencePainContextReader,
      // ValueProposition Projection Stores - decomposed by use case
      valuePropositionAddedProjector,
      valuePropositionUpdatedProjector,
      valuePropositionRemovedProjector,
      valuePropositionContextReader,
      addValuePropositionController,
      getValuePropositionsController,
      removeValuePropositionController,
      updateValuePropositionController,

      // Relations Category - Controllers
      addRelationController,
      removeRelationController,
      getRelationsController,
      traverseRelationsController,
      findRelationPathController,
      auditRelationsController,
      // Relations Category - decomposed by use case
      relationAddedEventStore,
      relationRemovedEventStore,
      relationAddedProjector,
      relationRemovedProjector,
      relationViewReader,
      relationNodeCatalog,
    };
  }
}
