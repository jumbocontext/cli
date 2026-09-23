/**
 * Application Container Interface
 *
 * Defines the services available to the presentation layer.
 * All types are interfaces - no concrete implementations exposed.
 *
 * This interface lives in the application layer to ensure the presentation
 * layer only depends on abstractions, not concrete infrastructure types.
 *
 * Key Design:
 * - NO db: Database.Database - database is hidden in infrastructure
 * - NO lifecycle methods - resources managed by Host via signal handlers
 * - Pure dependency access interface
 */

import { IEventStore } from "../persistence/IEventStore.js";
import { IEventBus } from "../messaging/IEventBus.js";
import { IClock } from "../time-and-date/IClock.js";
import { RebuildDatabaseController } from "../maintenance/db/rebuild/RebuildDatabaseController.js";
import { UpgradeCommandHandler } from "../maintenance/upgrade/UpgradeCommandHandler.js";
import { MigrateDependenciesCommandHandler } from "../maintenance/migrate-dependencies/MigrateDependenciesCommandHandler.js";
import { EvolveController } from "../evolve/EvolveController.js";
import { ILogger } from "../logging/ILogger.js";
import { IProjectRootResolver } from "../context/project/IProjectRootResolver.js";

// Settings
import { ISettingsReader } from "../settings/ISettingsReader.js";
import { ISettingsInitializer } from "../settings/ISettingsInitializer.js";
import { ITelemetryClient } from "../telemetry/ITelemetryClient.js";

// CLI Version
import { ICliVersionReader } from "../cli-metadata/query/ICliMetadataReader.js";
import { CliUpdateController } from "../cli-metadata/update/CliUpdateController.js";

// Port interfaces for session projection stores - decomposed by use case
import { ISessionStartedProjector } from "../context/sessions/start/ISessionStartedProjector.js";
import { ISessionEndedProjector } from "../context/sessions/end/ISessionEndedProjector.js";
import { IActiveSessionReader } from "../context/sessions/end/IActiveSessionReader.js";
import { ISessionViewReader } from "../context/sessions/get/ISessionViewReader.js";
import { IGoalAddedProjector } from "../context/goals/add/IGoalAddedProjector.js";
import { IGoalStartedProjector } from "../context/goals/start/IGoalStartedProjector.js";
import { IGoalReader } from "../context/goals/start/IGoalReader.js";
import { IGoalUpdatedProjector } from "../context/goals/update/IGoalUpdatedProjector.js";
import { IGoalUpdateReader } from "../context/goals/update/IGoalUpdateReader.js";
import { IGoalBlockedProjector } from "../context/goals/block/IGoalBlockedProjector.js";
import { IGoalUnblockedProjector } from "../context/goals/unblock/IGoalUnblockedProjector.js";
import { IGoalPausedProjector } from "../context/goals/pause/IGoalPausedProjector.js";
import { IGoalPauseReader } from "../context/goals/pause/IGoalPauseReader.js";
import { IGoalPostponedProjector } from "../context/goals/postpone/IGoalPostponedProjector.js";
import { IGoalReinstatedProjector } from "../context/goals/reinstate/IGoalReinstatedProjector.js";
import { IGetGoalViewReader } from "../context/goals/get/IGetGoalViewReader.js";
import { IGoalResumedProjector } from "../context/goals/resume/IGoalResumedProjector.js";
import { IGoalCompletedProjector } from "../context/goals/complete/IGoalCompletedProjector.js";
import { IGoalCompleteReader } from "../context/goals/complete/IGoalCompleteReader.js";
import { IGoalRefinedProjector } from "../context/goals/refine/IGoalRefinedProjector.js";
import { IGoalRefineReader } from "../context/goals/refine/IGoalRefineReader.js";
import { IGoalResetProjector } from "../context/goals/reset/IGoalResetProjector.js";
import { IGoalResetReader } from "../context/goals/reset/IGoalResetReader.js";
import { IGoalRemovedProjector } from "../context/goals/remove/IGoalRemovedProjector.js";
import { IGoalRemoveReader } from "../context/goals/remove/IGoalRemoveReader.js";
import { IGoalContextAssembler } from "../context/goals/get/IGoalContextAssembler.js";
import { IGoalStatusReader } from "../context/goals/IGoalStatusReader.js";
import { GoalContextQueryHandler } from "../context/goals/get/GoalContextQueryHandler.js";
import { GoalBacklogPreviewQueryHandler } from "../context/goals/query/GoalBacklogPreviewQueryHandler.js";
// Session Controllers
import { SessionStartController } from "../context/sessions/start/SessionStartController.js";
import { EndSessionController } from "../context/sessions/end/EndSessionController.js";
import { GetSessionsController } from "../context/sessions/get/GetSessionsController.js";
import { ViewWorkerController } from "../context/host/workers/view/ViewWorkerController.js";
import { GetTelemetryStatusController } from "../context/telemetry/get/GetTelemetryStatusController.js";
import { UpdateTelemetryConsentController } from "../context/telemetry/update/UpdateTelemetryConsentController.js";

// Goal Controllers
import { AddGoalController } from "../context/goals/add/AddGoalController.js";
import { StartGoalController } from "../context/goals/start/StartGoalController.js";
import { ReviewGoalController } from "../context/goals/review/ReviewGoalController.js";
import { IGoalSubmittedForReviewEventWriter } from "../context/goals/review/IGoalSubmittedForReviewEventWriter.js";
import { IGoalSubmittedForReviewEventReader } from "../context/goals/review/IGoalSubmittedForReviewEventReader.js";
import { QualifyGoalController } from "../context/goals/qualify/QualifyGoalController.js";
import { CommitGoalController } from "../context/goals/commit/CommitGoalController.js";
import { RefineGoalController } from "../context/goals/refine/RefineGoalController.js";
import { ResetGoalController } from "../context/goals/reset/ResetGoalController.js";
import { BlockGoalController } from "../context/goals/block/BlockGoalController.js";
import { UnblockGoalController } from "../context/goals/unblock/UnblockGoalController.js";
import { GetGoalsController } from "../context/goals/get/GetGoalsController.js";
import { ShowGoalController } from "../context/goals/get/ShowGoalController.js";
import { PauseGoalController } from "../context/goals/pause/PauseGoalController.js";
import { PostponeGoalController } from "../context/goals/postpone/PostponeGoalController.js";
import { ReinstateGoalController } from "../context/goals/reinstate/ReinstateGoalController.js";
import { ResumeGoalController } from "../context/goals/resume/ResumeGoalController.js";
import { RemoveGoalController } from "../context/goals/remove/RemoveGoalController.js";
import { UpdateGoalController } from "../context/goals/update/UpdateGoalController.js";
import { UpdateGoalProgressController } from "../context/goals/update-progress/UpdateGoalProgressController.js";
import { IGoalQualifiedEventWriter } from "../context/goals/qualify/IGoalQualifiedEventWriter.js";
import { IGoalQualifiedEventReader } from "../context/goals/qualify/IGoalQualifiedEventReader.js";
import { IGoalCommitEventWriter } from "../context/goals/commit/IGoalCommitEventWriter.js";
import { IGoalCommitEventReader } from "../context/goals/commit/IGoalCommitEventReader.js";
import { RejectGoalController } from "../context/goals/reject/RejectGoalController.js";
import { IGoalRejectedEventWriter } from "../context/goals/reject/IGoalRejectedEventWriter.js";
import { IGoalRejectedEventReader } from "../context/goals/reject/IGoalRejectedEventReader.js";
import { SubmitGoalController } from "../context/goals/submit/SubmitGoalController.js";
import { IGoalSubmittedEventWriter } from "../context/goals/submit/IGoalSubmittedEventWriter.js";
import { IGoalSubmittedEventReader } from "../context/goals/submit/IGoalSubmittedEventReader.js";
import { CodifyGoalController } from "../context/goals/codify/CodifyGoalController.js";
import { IGoalCodifyingStartedEventWriter } from "../context/goals/codify/IGoalCodifyingStartedEventWriter.js";
import { IGoalCodifyingStartedEventReader } from "../context/goals/codify/IGoalCodifyingStartedEventReader.js";
import { IGoalCodifyingStartedProjector } from "../context/goals/codify/IGoalCodifyingStartedProjector.js";
import { IGoalCodifyReader } from "../context/goals/codify/IGoalCodifyReader.js";
import { CloseGoalController } from "../context/goals/close/CloseGoalController.js";
import { IGoalClosedEventWriter } from "../context/goals/close/IGoalClosedEventWriter.js";
import { IGoalClosedEventReader } from "../context/goals/close/IGoalClosedEventReader.js";
import { IGoalClosedProjector } from "../context/goals/close/IGoalClosedProjector.js";
import { IGoalCloseReader } from "../context/goals/close/IGoalCloseReader.js";

// Audience Pain Controllers
import { AddAudiencePainController } from "../context/audience-pains/add/AddAudiencePainController.js";

// Audience Controllers
import { AddAudienceController } from "../context/audiences/add/AddAudienceController.js";
import { ListAudiencesController } from "../context/audiences/list/ListAudiencesController.js";
import { RemoveAudienceController } from "../context/audiences/remove/RemoveAudienceController.js";
import { UpdateAudienceController } from "../context/audiences/update/UpdateAudienceController.js";

// Architecture Controllers
import { DefineArchitectureController } from "../context/architecture/define/DefineArchitectureController.js";
import { UpdateArchitectureController } from "../context/architecture/update/UpdateArchitectureController.js";

// Work Controllers
import { PauseWorkController } from "../context/work/pause/PauseWorkController.js";
import { ResumeWorkController } from "../context/work/resume/ResumeWorkController.js";

import { AddDecisionController } from "../context/decisions/add/AddDecisionController.js";
import { GetDecisionsController } from "../context/decisions/get/GetDecisionsController.js";
import { SearchDecisionsController } from "../context/decisions/search/SearchDecisionsController.js";
import { ShowDecisionController } from "../context/decisions/show/ShowDecisionController.js";
import { ReverseDecisionController } from "../context/decisions/reverse/ReverseDecisionController.js";
import { RestoreDecisionController } from "../context/decisions/restore/RestoreDecisionController.js";
import { SupersedeDecisionController } from "../context/decisions/supersede/SupersedeDecisionController.js";
import { UpdateDecisionController } from "../context/decisions/update/UpdateDecisionController.js";
import { IDecisionAddedProjector } from "../context/decisions/add/IDecisionAddedProjector.js";
import { IDecisionUpdatedProjector } from "../context/decisions/update/IDecisionUpdatedProjector.js";
import { IDecisionUpdateReader } from "../context/decisions/update/IDecisionUpdateReader.js";
import { IDecisionReversedProjector } from "../context/decisions/reverse/IDecisionReversedProjector.js";
import { IDecisionReverseReader } from "../context/decisions/reverse/IDecisionReverseReader.js";
import { IDecisionRestoredProjector } from "../context/decisions/restore/IDecisionRestoredProjector.js";
import { IDecisionRestoreReader } from "../context/decisions/restore/IDecisionRestoreReader.js";
import { IDecisionSupersededProjector } from "../context/decisions/supersede/IDecisionSupersededProjector.js";
import { IDecisionSupersedeReader } from "../context/decisions/supersede/IDecisionSupersedeReader.js";
import { IDecisionViewReader } from "../context/decisions/get/IDecisionViewReader.js";
import { IArchitectureDefinedProjector } from "../context/architecture/define/IArchitectureDefinedProjector.js";
import { IArchitectureDefineReader } from "../context/architecture/define/IArchitectureDefineReader.js";
import { IArchitectureUpdatedProjector } from "../context/architecture/update/IArchitectureUpdatedProjector.js";
import { IArchitectureUpdateReader } from "../context/architecture/update/IArchitectureUpdateReader.js";
import { IArchitectureDeprecatedProjector } from "../context/architecture/deprecate/IArchitectureDeprecatedProjector.js";
import { IArchitectureDeprecatedEventWriter } from "../context/architecture/deprecate/IArchitectureDeprecatedEventWriter.js";
import { IArchitectureReader } from "../context/architecture/IArchitectureReader.js";
import { GetArchitectureController } from "../context/architecture/get/GetArchitectureController.js";
import { AddComponentController } from "../context/components/add/AddComponentController.js";
import { GetComponentsController } from "../context/components/list/GetComponentsController.js";
import { SearchComponentsController } from "../context/components/search/SearchComponentsController.js";
import { UpdateComponentController } from "../context/components/update/UpdateComponentController.js";
import { RenameComponentController } from "../context/components/rename/RenameComponentController.js";
import { IComponentAddedProjector } from "../context/components/add/IComponentAddedProjector.js";
import { IComponentAddReader } from "../context/components/add/IComponentAddReader.js";
import { IComponentUpdatedProjector } from "../context/components/update/IComponentUpdatedProjector.js";
import { IComponentUpdateReader } from "../context/components/update/IComponentUpdateReader.js";
import { IComponentRenamedProjector } from "../context/components/rename/IComponentRenamedProjector.js";
import { IComponentRenameReader } from "../context/components/rename/IComponentRenameReader.js";
import { DeprecateComponentController } from "../context/components/deprecate/DeprecateComponentController.js";
import { UndeprecateComponentController } from "../context/components/undeprecate/UndeprecateComponentController.js";
import { RemoveComponentController } from "../context/components/remove/RemoveComponentController.js";
import { ShowComponentController } from "../context/components/show/ShowComponentController.js";
import { IComponentRemovedProjector } from "../context/components/remove/IComponentRemovedProjector.js";
import { IComponentRemoveReader } from "../context/components/remove/IComponentRemoveReader.js";
import { IComponentViewReader } from "../context/components/get/IComponentViewReader.js";
import { IComponentReader } from "../context/components/get/IComponentReader.js";
import { AddDependencyController } from "../context/dependencies/add/AddDependencyController.js";
import { GetDependenciesController } from "../context/dependencies/get/GetDependenciesController.js";
import { UpdateDependencyController } from "../context/dependencies/update/UpdateDependencyController.js";
import { RemoveDependencyController } from "../context/dependencies/remove/RemoveDependencyController.js";
import { IDependencyAddedProjector } from "../context/dependencies/add/IDependencyAddedProjector.js";
import { IDependencyAddReader } from "../context/dependencies/add/IDependencyAddReader.js";
import { IDependencyUpdatedProjector } from "../context/dependencies/update/IDependencyUpdatedProjector.js";
import { IDependencyUpdateReader } from "../context/dependencies/update/IDependencyUpdateReader.js";
import { IDependencyRemovedProjector } from "../context/dependencies/remove/IDependencyRemovedProjector.js";
import { IDependencyRemoveReader } from "../context/dependencies/remove/IDependencyRemoveReader.js";
import { IDependencyViewReader } from "../context/dependencies/get/IDependencyViewReader.js";
import { IGuidelineAddedProjector } from "../context/guidelines/add/IGuidelineAddedProjector.js";
import { IGuidelineUpdatedProjector } from "../context/guidelines/update/IGuidelineUpdatedProjector.js";
import { IGuidelineUpdateReader } from "../context/guidelines/update/IGuidelineUpdateReader.js";
import { IGuidelineRemovedProjector } from "../context/guidelines/remove/IGuidelineRemovedProjector.js";
import { IGuidelineRemoveReader } from "../context/guidelines/remove/IGuidelineRemoveReader.js";
import { IGuidelineViewReader } from "../context/guidelines/get/IGuidelineViewReader.js";
import { GetGuidelinesController } from "../context/guidelines/get/GetGuidelinesController.js";
import { SearchGuidelinesController } from "../context/guidelines/search/SearchGuidelinesController.js";
import { SearchController } from "../context/search/SearchController.js";
import { ISearchIndexWriter } from "../context/search/ISearchIndexWriter.js";
import { ISearchIndexReader } from "../context/search/ISearchIndexReader.js";
import { IInvariantAddedProjector } from "../context/invariants/add/IInvariantAddedProjector.js";
import { IInvariantAddReader } from "../context/invariants/add/IInvariantAddReader.js";
import { IInvariantUpdatedProjector } from "../context/invariants/update/IInvariantUpdatedProjector.js";
import { IInvariantUpdateReader } from "../context/invariants/update/IInvariantUpdateReader.js";
import { IInvariantRemovedProjector } from "../context/invariants/remove/IInvariantRemovedProjector.js";
import { IInvariantRemoveReader } from "../context/invariants/remove/IInvariantRemoveReader.js";
import { IInvariantViewReader } from "../context/invariants/get/IInvariantViewReader.js";
import { AddInvariantController } from "../context/invariants/add/AddInvariantController.js";
import { RemoveInvariantController } from "../context/invariants/remove/RemoveInvariantController.js";
import { GetInvariantsController } from "../context/invariants/get/GetInvariantsController.js";
import { UpdateInvariantController } from "../context/invariants/update/UpdateInvariantController.js";
// Relations Projection Store ports - decomposed by use case
import { IRelationAddedProjector } from "../context/relations/add/IRelationAddedProjector.js";
import { IRelationAddedReader } from "../context/relations/add/IRelationAddedReader.js";
import { IRelationRemovedProjector } from "../context/relations/remove/IRelationRemovedProjector.js";
import { IRelationRemovedReader } from "../context/relations/remove/IRelationRemovedReader.js";
import { IRelationReader } from "../context/relations/IRelationReader.js";
import { IRelationViewReader } from "../context/relations/get/IRelationViewReader.js";
import { AuditRelationsController } from "../context/relations/audit/AuditRelationsController.js";
import { IRelationNodeCatalog } from "../context/relations/audit/IRelationNodeCatalog.js";
// Audience Pain Projection Store ports - decomposed by use case
import { IAudiencePainAddedProjector } from "../context/audience-pains/add/IAudiencePainAddedProjector.js";
import { IAudiencePainUpdatedProjector } from "../context/audience-pains/update/IAudiencePainUpdatedProjector.js";
import { IAudiencePainUpdateReader } from "../context/audience-pains/update/IAudiencePainUpdateReader.js";
import { UpdateAudiencePainController } from "../context/audience-pains/update/UpdateAudiencePainController.js";
import { GetAudiencePainsController } from "../context/audience-pains/list/GetAudiencePainsController.js";
// Audience Projection Store ports - decomposed by use case
import { IAudienceAddedProjector } from "../context/audiences/add/IAudienceAddedProjector.js";
import { IAudienceUpdatedProjector } from "../context/audiences/update/IAudienceUpdatedProjector.js";
import { IAudienceUpdateReader } from "../context/audiences/update/IAudienceUpdateReader.js";
import { IAudienceRemovedProjector } from "../context/audiences/remove/IAudienceRemovedProjector.js";
import { IAudienceRemoveReader } from "../context/audiences/remove/IAudienceRemoveReader.js";
// Value Proposition Projection Store ports - decomposed by use case
import { IValuePropositionAddedProjector } from "../context/value-propositions/add/IValuePropositionAddedProjector.js";
import { IValuePropositionUpdatedProjector } from "../context/value-propositions/update/IValuePropositionUpdatedProjector.js";
import { IValuePropositionRemovedProjector } from "../context/value-propositions/remove/IValuePropositionRemovedProjector.js";
import { IValuePropositionUpdateReader } from "../context/value-propositions/update/IValuePropositionUpdateReader.js";
import { IValuePropositionRemoveReader } from "../context/value-propositions/remove/IValuePropositionRemoveReader.js";
import { RemoveValuePropositionController } from "../context/value-propositions/remove/RemoveValuePropositionController.js";
import { UpdateValuePropositionController } from "../context/value-propositions/update/UpdateValuePropositionController.js";
import { IProjectInitializedProjector } from "../context/project/init/IProjectInitializedProjector.js";
import { IProjectUpdatedProjector } from "../context/project/update/IProjectUpdatedProjector.js";
import { IProjectInitReader } from "../context/project/init/IProjectInitReader.js";
import { IProjectUpdateReader } from "../context/project/update/IProjectUpdateReader.js";
import { ProjectStatsController } from "../context/project/stats/ProjectStatsController.js";
import { IProjectContextReader } from "../context/project/query/IProjectContextReader.js";
import { IProjectInitializedEventWriter } from "../context/project/init/IProjectInitializedEventWriter.js";
import { IProjectUpdatedEventWriter } from "../context/project/update/IProjectUpdatedEventWriter.js";
import { IAgentFileProtocol } from "../context/project/init/IAgentFileProtocol.js";
import { PlanProjectInitController } from "../context/project/init/PlanProjectInitController.js";
import { InitializeProjectController } from "../context/project/init/InitializeProjectController.js";
import { UpdateProjectController } from "../context/project/update/UpdateProjectController.js";
import { ShowProjectController } from "../context/project/show/ShowProjectController.js";
import { IAudienceContextReader } from "../context/audiences/query/IAudienceContextReader.js";
import { IAudiencePainContextReader } from "../context/audience-pains/query/IAudiencePainContextReader.js";
import { IValuePropositionContextReader } from "../context/value-propositions/query/IValuePropositionContextReader.js";
// Brownfield Status
import { IBrownfieldStatusReader } from "../context/sessions/start/IBrownfieldStatusReader.js";

// Worker Identity
import { IWorkerIdentityReader } from "./workers/IWorkerIdentityReader.js";

// Goal Claims
import { GoalClaimPolicy } from "../context/goals/claims/GoalClaimPolicy.js";

// Port interfaces for session event stores - decomposed by use case
import { ISessionStartedEventWriter } from "../context/sessions/start/ISessionStartedEventWriter.js";
import { ISessionEndedEventWriter } from "../context/sessions/end/ISessionEndedEventWriter.js";
import { ISessionEndedEventReader } from "../context/sessions/end/ISessionEndedEventReader.js";
// Goal Event Store ports - decomposed by use case
import { IGoalAddedEventWriter } from "../context/goals/add/IGoalAddedEventWriter.js";
import { IGoalStartedEventWriter } from "../context/goals/start/IGoalStartedEventWriter.js";
import { IGoalStartedEventReader } from "../context/goals/start/IGoalStartedEventReader.js";
import { IGoalUpdatedEventWriter } from "../context/goals/update/IGoalUpdatedEventWriter.js";
import { IGoalUpdatedEventReader } from "../context/goals/update/IGoalUpdatedEventReader.js";
import { IGoalBlockedEventWriter } from "../context/goals/block/IGoalBlockedEventWriter.js";
import { IGoalBlockedEventReader } from "../context/goals/block/IGoalBlockedEventReader.js";
import { IGoalUnblockedEventWriter } from "../context/goals/unblock/IGoalUnblockedEventWriter.js";
import { IGoalUnblockedEventReader } from "../context/goals/unblock/IGoalUnblockedEventReader.js";
import { IGoalPausedEventWriter } from "../context/goals/pause/IGoalPausedEventWriter.js";
import { IGoalPausedEventReader } from "../context/goals/pause/IGoalPausedEventReader.js";
import { IGoalPostponedEventWriter } from "../context/goals/postpone/IGoalPostponedEventWriter.js";
import { IGoalPostponedEventReader } from "../context/goals/postpone/IGoalPostponedEventReader.js";
import { IGoalReinstatedEventWriter } from "../context/goals/reinstate/IGoalReinstatedEventWriter.js";
import { IGoalReinstatedEventReader } from "../context/goals/reinstate/IGoalReinstatedEventReader.js";
import { IGoalResumedEventWriter } from "../context/goals/resume/IGoalResumedEventWriter.js";
import { IGoalResumedEventReader } from "../context/goals/resume/IGoalResumedEventReader.js";
import { IGoalCompletedEventWriter } from "../context/goals/complete/IGoalCompletedEventWriter.js";
import { IGoalCompletedEventReader } from "../context/goals/complete/IGoalCompletedEventReader.js";
import { IGoalRefineEventWriter } from "../context/goals/refine/IGoalRefineEventWriter.js";
import { IGoalRefineEventReader } from "../context/goals/refine/IGoalRefineEventReader.js";
import { IGoalResetEventWriter } from "../context/goals/reset/IGoalResetEventWriter.js";
import { IGoalResetEventReader } from "../context/goals/reset/IGoalResetEventReader.js";
import { IGoalRemovedEventWriter } from "../context/goals/remove/IGoalRemovedEventWriter.js";
import { IGoalRemovedEventReader } from "../context/goals/remove/IGoalRemovedEventReader.js";
import { IGoalProgressUpdatedEventWriter } from "../context/goals/update-progress/IGoalProgressUpdatedEventWriter.js";
import { IGoalProgressUpdatedEventReader } from "../context/goals/update-progress/IGoalProgressUpdatedEventReader.js";
import { IGoalProgressUpdatedProjector } from "../context/goals/update-progress/IGoalProgressUpdatedProjector.js";
import { IGoalProgressUpdateReader } from "../context/goals/update-progress/IGoalProgressUpdateReader.js";
import { IDecisionAddedEventWriter } from "../context/decisions/add/IDecisionAddedEventWriter.js";
import { IDecisionUpdatedEventWriter } from "../context/decisions/update/IDecisionUpdatedEventWriter.js";
import { IDecisionReversedEventWriter } from "../context/decisions/reverse/IDecisionReversedEventWriter.js";
import { IDecisionRestoredEventWriter } from "../context/decisions/restore/IDecisionRestoredEventWriter.js";
import { IDecisionSupersededEventWriter } from "../context/decisions/supersede/IDecisionSupersededEventWriter.js";
import { IArchitectureDefinedEventWriter } from "../context/architecture/define/IArchitectureDefinedEventWriter.js";
import { IArchitectureUpdatedEventWriter } from "../context/architecture/update/IArchitectureUpdatedEventWriter.js";
import { IArchitectureUpdatedEventReader } from "../context/architecture/update/IArchitectureUpdatedEventReader.js";
import { IComponentAddedEventWriter } from "../context/components/add/IComponentAddedEventWriter.js";
import { IComponentUpdatedEventWriter } from "../context/components/update/IComponentUpdatedEventWriter.js";
import { IComponentRenamedEventWriter } from "../context/components/rename/IComponentRenamedEventWriter.js";
import { IComponentDeprecatedProjector } from "../context/components/deprecate/IComponentDeprecatedProjector.js";
import { IComponentUndeprecatedProjector } from "../context/components/undeprecate/IComponentUndeprecatedProjector.js";
import { IComponentUndeprecateReader } from "../context/components/undeprecate/IComponentUndeprecateReader.js";
import { IComponentRemovedEventWriter } from "../context/components/remove/IComponentRemovedEventWriter.js";
import { IComponentUndeprecatedEventWriter } from "../context/components/undeprecate/IComponentUndeprecatedEventWriter.js";
import { IDependencyAddedEventWriter } from "../context/dependencies/add/IDependencyAddedEventWriter.js";
import { IDependencyUpdatedEventWriter } from "../context/dependencies/update/IDependencyUpdatedEventWriter.js";
import { IDependencyUpdatedEventReader } from "../context/dependencies/update/IDependencyUpdatedEventReader.js";
import { IDependencyRemovedEventWriter } from "../context/dependencies/remove/IDependencyRemovedEventWriter.js";
import { IDependencyRemovedEventReader } from "../context/dependencies/remove/IDependencyRemovedEventReader.js";
import { IGuidelineAddedEventWriter } from "../context/guidelines/add/IGuidelineAddedEventWriter.js";
import { IGuidelineUpdatedEventWriter } from "../context/guidelines/update/IGuidelineUpdatedEventWriter.js";
import { IGuidelineUpdatedEventReader } from "../context/guidelines/update/IGuidelineUpdatedEventReader.js";
import { IGuidelineRemovedEventWriter } from "../context/guidelines/remove/IGuidelineRemovedEventWriter.js";
import { IGuidelineRemovedEventReader } from "../context/guidelines/remove/IGuidelineRemovedEventReader.js";
import { IInvariantAddedEventWriter } from "../context/invariants/add/IInvariantAddedEventWriter.js";
import { IInvariantUpdatedEventWriter } from "../context/invariants/update/IInvariantUpdatedEventWriter.js";
import { IInvariantUpdatedEventReader } from "../context/invariants/update/IInvariantUpdatedEventReader.js";
import { IInvariantRemovedEventWriter } from "../context/invariants/remove/IInvariantRemovedEventWriter.js";
import { IInvariantRemovedEventReader } from "../context/invariants/remove/IInvariantRemovedEventReader.js";
import { IAudienceAddedEventWriter } from "../context/audiences/add/IAudienceAddedEventWriter.js";
import { IAudienceUpdatedEventWriter } from "../context/audiences/update/IAudienceUpdatedEventWriter.js";
import { IAudienceRemovedEventWriter } from "../context/audiences/remove/IAudienceRemovedEventWriter.js";
import { IAudiencePainAddedEventWriter } from "../context/audience-pains/add/IAudiencePainAddedEventWriter.js";
import { IAudiencePainUpdatedEventWriter } from "../context/audience-pains/update/IAudiencePainUpdatedEventWriter.js";
import { IValuePropositionAddedEventWriter } from "../context/value-propositions/add/IValuePropositionAddedEventWriter.js";
import { AddValuePropositionController } from "../context/value-propositions/add/AddValuePropositionController.js";
import { GetValuePropositionsController } from "../context/value-propositions/get/GetValuePropositionsController.js";
import { IValuePropositionUpdatedEventWriter } from "../context/value-propositions/update/IValuePropositionUpdatedEventWriter.js";
import { IValuePropositionRemovedEventWriter } from "../context/value-propositions/remove/IValuePropositionRemovedEventWriter.js";
// Relations Event Store ports - decomposed by use case
import { AddRelationController } from "../context/relations/add/AddRelationController.js";
import { RemoveRelationController } from "../context/relations/remove/RemoveRelationController.js";
import { GetRelationsController } from "../context/relations/get/GetRelationsController.js";
import { TraverseRelationsController } from "../context/relations/traverse/TraverseRelationsController.js";
import { FindRelationPathController } from "../context/relations/path/FindRelationPathController.js";
import { AddGuidelineController } from "../context/guidelines/add/AddGuidelineController.js";
import { UpdateGuidelineController } from "../context/guidelines/update/UpdateGuidelineController.js";
import { RemoveGuidelineController } from "../context/guidelines/remove/RemoveGuidelineController.js";
import { IRelationAddedEventWriter } from "../context/relations/add/IRelationAddedEventWriter.js";
import { IRelationRemovedEventWriter } from "../context/relations/remove/IRelationRemovedEventWriter.js";
import { IRelationRemovedEventReader } from "../context/relations/remove/IRelationRemovedEventReader.js";

/**
 * IApplicationContainer - Complete dependency injection container interface
 *
 * Contains all infrastructure components, event stores, projection stores,
 * and cross-cutting services needed by the application.
 *
 * This container is created by HostBuilder and provides all dependencies
 * to CLI commands and other application components.
 *
 * Key Design:
 * - NO db: Database.Database - concrete DB types hidden in infrastructure
 * - NO lifecycle methods: No dispose(), no cleanup()
 * - Resources managed by Host via process signal handlers
 * - Pure interface for dependency access
 */
export interface IApplicationContainer {
  // Core Infrastructure
  projectRootResolver: IProjectRootResolver;
  eventBus: IEventBus;
  eventStore: IEventStore;
  clock: IClock;
  logger: ILogger;
  settingsReader: ISettingsReader;
  settingsInitializer: ISettingsInitializer;
  telemetryClient: ITelemetryClient;

  // Worker Identity
  workerIdentityReader: IWorkerIdentityReader;

  // Goal Claims
  goalClaimPolicy: GoalClaimPolicy;

  // Maintenance Controllers
  rebuildDatabaseController: RebuildDatabaseController;
  evolveController: EvolveController;
  upgradeCommandHandler: UpgradeCommandHandler;
  migrateDependenciesCommandHandler: MigrateDependenciesCommandHandler;

  // CLI Version
  cliVersionReader: ICliVersionReader;
  cliUpdateController: CliUpdateController;

  // Work Category - Session Event Stores - decomposed by use case
  sessionStartedEventStore: ISessionStartedEventWriter;
  sessionEndedEventStore: ISessionEndedEventWriter & ISessionEndedEventReader;
  // Goal Event Stores - decomposed by use case
  goalAddedEventStore: IGoalAddedEventWriter;
  goalStartedEventStore: IGoalStartedEventWriter & IGoalStartedEventReader;
  goalUpdatedEventStore: IGoalUpdatedEventWriter & IGoalUpdatedEventReader;
  goalBlockedEventStore: IGoalBlockedEventWriter & IGoalBlockedEventReader;
  goalUnblockedEventStore: IGoalUnblockedEventWriter & IGoalUnblockedEventReader;
  goalPausedEventStore: IGoalPausedEventWriter & IGoalPausedEventReader;
  goalPostponedEventStore: IGoalPostponedEventWriter & IGoalPostponedEventReader;
  goalReinstatedEventStore: IGoalReinstatedEventWriter & IGoalReinstatedEventReader;
  goalResumedEventStore: IGoalResumedEventWriter & IGoalResumedEventReader;
  goalCompletedEventStore: IGoalCompletedEventWriter & IGoalCompletedEventReader;
  goalRefinedEventStore: IGoalRefineEventWriter & IGoalRefineEventReader;
  goalResetEventStore: IGoalResetEventWriter & IGoalResetEventReader;
  goalRemovedEventStore: IGoalRemovedEventWriter & IGoalRemovedEventReader;
  goalProgressUpdatedEventStore: IGoalProgressUpdatedEventWriter & IGoalProgressUpdatedEventReader;
  goalSubmittedForReviewEventStore: IGoalSubmittedForReviewEventWriter & IGoalSubmittedForReviewEventReader;
  goalQualifiedEventStore: IGoalQualifiedEventWriter & IGoalQualifiedEventReader;
  goalCommittedEventStore: IGoalCommitEventWriter & IGoalCommitEventReader;
  goalRejectedEventStore: IGoalRejectedEventWriter & IGoalRejectedEventReader;
  goalSubmittedEventStore: IGoalSubmittedEventWriter & IGoalSubmittedEventReader;
  goalCodifyingStartedEventStore: IGoalCodifyingStartedEventWriter & IGoalCodifyingStartedEventReader;
  goalClosedEventStore: IGoalClosedEventWriter & IGoalClosedEventReader;

  // Work Category - Session Projection Stores - decomposed by use case
  sessionStartedProjector: ISessionStartedProjector;
  sessionEndedProjector: ISessionEndedProjector;
  activeSessionReader: IActiveSessionReader;
  sessionViewReader: ISessionViewReader;
  // Goal Projection Stores - decomposed by use case
  goalAddedProjector: IGoalAddedProjector;
  goalStartedProjector: IGoalStartedProjector & IGoalReader;
  goalUpdatedProjector: IGoalUpdatedProjector & IGoalUpdateReader;
  goalBlockedProjector: IGoalBlockedProjector;
  goalUnblockedProjector: IGoalUnblockedProjector;
  goalPausedProjector: IGoalPausedProjector & IGoalReader & IGoalPauseReader;
  goalPostponedProjector: IGoalPostponedProjector;
  goalReinstatedProjector: IGoalReinstatedProjector;
  goalResumedProjector: IGoalResumedProjector & IGoalReader;
  goalCompletedProjector: IGoalCompletedProjector & IGoalCompleteReader;
  goalRefinedProjector: IGoalRefinedProjector & IGoalRefineReader;
  goalResetProjector: IGoalResetProjector & IGoalResetReader;
  goalRemovedProjector: IGoalRemovedProjector & IGoalRemoveReader;
  goalProgressUpdatedProjector: IGoalProgressUpdatedProjector & IGoalProgressUpdateReader;
  goalCodifyingStartedProjector: IGoalCodifyingStartedProjector & IGoalCodifyReader;
  goalClosedProjector: IGoalClosedProjector & IGoalCloseReader;
  goalContextReader: IGoalReader;
  goalContextAssembler: IGoalContextAssembler;
  goalContextQueryHandler: GoalContextQueryHandler;
  goalBacklogPreviewQueryHandler: GoalBacklogPreviewQueryHandler;
  goalViewReader: IGetGoalViewReader;
  goalStatusReader: IGoalStatusReader;
  // Session Controllers
  sessionStartController: SessionStartController;
  endSessionController: EndSessionController;
  getSessionsController: GetSessionsController;
  getTelemetryStatusController: GetTelemetryStatusController;
  updateTelemetryConsentController: UpdateTelemetryConsentController;

  // Worker Controllers
  viewWorkerController: ViewWorkerController;

  // Goal Controllers
  addGoalController: AddGoalController;
  startGoalController: StartGoalController;
  reviewGoalController: ReviewGoalController;
  qualifyGoalController: QualifyGoalController;
  commitGoalController: CommitGoalController;
  rejectGoalController: RejectGoalController;
  submitGoalController: SubmitGoalController;
  codifyGoalController: CodifyGoalController;
  closeGoalController: CloseGoalController;
  blockGoalController: BlockGoalController;
  unblockGoalController: UnblockGoalController;
  getGoalsController: GetGoalsController;
  showGoalController: ShowGoalController;
  pauseGoalController: PauseGoalController;
  postponeGoalController: PostponeGoalController;
  reinstateGoalController: ReinstateGoalController;
  resumeGoalController: ResumeGoalController;
  refineGoalController: RefineGoalController;
  removeGoalController: RemoveGoalController;
  resetGoalController: ResetGoalController;
  updateGoalController: UpdateGoalController;
  updateGoalProgressController: UpdateGoalProgressController;

  // Decision Controllers
  addDecisionController: AddDecisionController;
  getDecisionsController: GetDecisionsController;
  searchDecisionsController: SearchDecisionsController;
  showDecisionController: ShowDecisionController;
  reverseDecisionController: ReverseDecisionController;
  restoreDecisionController: RestoreDecisionController;
  supersedeDecisionController: SupersedeDecisionController;
  updateDecisionController: UpdateDecisionController;

  // Work Controllers
  pauseWorkController: PauseWorkController;
  resumeWorkController: ResumeWorkController;

  // Audience Pain Controllers
  addAudiencePainController: AddAudiencePainController;

  // Audience Controllers
  addAudienceController: AddAudienceController;
  listAudiencesController: ListAudiencesController;
  removeAudienceController: RemoveAudienceController;
  updateAudienceController: UpdateAudienceController;

  // Architecture Controllers
  defineArchitectureController: DefineArchitectureController;
  updateArchitectureController: UpdateArchitectureController;
  getArchitectureController: GetArchitectureController;

  // Component Controllers
  addComponentController: AddComponentController;
  getComponentsController: GetComponentsController;
  searchComponentsController: SearchComponentsController;
  updateComponentController: UpdateComponentController;
  renameComponentController: RenameComponentController;
  undeprecateComponentController: UndeprecateComponentController;

  // Dependency Controllers
  addDependencyController: AddDependencyController;
  getDependenciesController: GetDependenciesController;
  updateDependencyController: UpdateDependencyController;
  removeDependencyController: RemoveDependencyController;

  // Solution Category - Event Stores
  // Architecture Event Stores - decomposed by use case
  architectureDefinedEventStore: IArchitectureDefinedEventWriter;
  architectureUpdatedEventStore: IArchitectureUpdatedEventWriter & IArchitectureUpdatedEventReader;
  architectureDeprecatedEventStore: IArchitectureDeprecatedEventWriter;
  // Component Event Stores - decomposed by use case
  componentAddedEventStore: IComponentAddedEventWriter;
  componentUpdatedEventStore: IComponentUpdatedEventWriter;
  componentRenamedEventStore: IComponentRenamedEventWriter;
  deprecateComponentController: DeprecateComponentController;
  removeComponentController: RemoveComponentController;
  showComponentController: ShowComponentController;
  componentRemovedEventStore: IComponentRemovedEventWriter;
  componentUndeprecatedEventStore: IComponentUndeprecatedEventWriter;
  // Dependency Event Stores - decomposed by use case
  dependencyAddedEventStore: IDependencyAddedEventWriter;
  dependencyUpdatedEventStore: IDependencyUpdatedEventWriter & IDependencyUpdatedEventReader;
  dependencyRemovedEventStore: IDependencyRemovedEventWriter & IDependencyRemovedEventReader;
  // Decision Event Stores - decomposed by use case
  decisionAddedEventStore: IDecisionAddedEventWriter;
  decisionUpdatedEventStore: IDecisionUpdatedEventWriter;
  decisionReversedEventStore: IDecisionReversedEventWriter;
  decisionRestoredEventStore: IDecisionRestoredEventWriter;
  decisionSupersededEventStore: IDecisionSupersededEventWriter;
  // Guideline Event Stores - decomposed by use case
  guidelineAddedEventStore: IGuidelineAddedEventWriter;
  guidelineUpdatedEventStore: IGuidelineUpdatedEventWriter & IGuidelineUpdatedEventReader;
  guidelineRemovedEventStore: IGuidelineRemovedEventWriter & IGuidelineRemovedEventReader;
  // Invariant Event Stores - decomposed by use case
  invariantAddedEventStore: IInvariantAddedEventWriter;
  invariantUpdatedEventStore: IInvariantUpdatedEventWriter & IInvariantUpdatedEventReader;
  invariantRemovedEventStore: IInvariantRemovedEventWriter & IInvariantRemovedEventReader;

  // Solution Category - Projection Stores
  // Architecture Projection Stores - decomposed by use case
  architectureDefinedProjector: IArchitectureDefinedProjector & IArchitectureDefineReader;
  architectureUpdatedProjector: IArchitectureUpdatedProjector & IArchitectureUpdateReader;
  architectureDeprecatedProjector: IArchitectureDeprecatedProjector;
  architectureReader: IArchitectureReader;
  // Component Projection Stores - decomposed by use case
  componentAddedProjector: IComponentAddedProjector & IComponentAddReader;
  componentUpdatedProjector: IComponentUpdatedProjector & IComponentUpdateReader;
  componentRenamedProjector: IComponentRenamedProjector & IComponentRenameReader;
  componentDeprecatedProjector: IComponentDeprecatedProjector;
  componentUndeprecatedProjector: IComponentUndeprecatedProjector & IComponentUndeprecateReader;
  componentRemovedProjector: IComponentRemovedProjector & IComponentRemoveReader;
  componentViewReader: IComponentViewReader;
  componentReader: IComponentReader;
  // Dependency Projection Stores - decomposed by use case
  dependencyAddedProjector: IDependencyAddedProjector & IDependencyAddReader;
  dependencyUpdatedProjector: IDependencyUpdatedProjector & IDependencyUpdateReader;
  dependencyRemovedProjector: IDependencyRemovedProjector & IDependencyRemoveReader;
  dependencyViewReader: IDependencyViewReader;
  // Decision Projection Stores - decomposed by use case
  decisionAddedProjector: IDecisionAddedProjector;
  decisionUpdatedProjector: IDecisionUpdatedProjector & IDecisionUpdateReader;
  decisionReversedProjector: IDecisionReversedProjector & IDecisionReverseReader;
  decisionRestoredProjector: IDecisionRestoredProjector & IDecisionRestoreReader;
  decisionSupersededProjector: IDecisionSupersededProjector & IDecisionSupersedeReader;
  decisionViewReader: IDecisionViewReader;
  // Guideline Projection Stores - decomposed by use case
  guidelineAddedProjector: IGuidelineAddedProjector;
  guidelineUpdatedProjector: IGuidelineUpdatedProjector & IGuidelineUpdateReader;
  guidelineRemovedProjector: IGuidelineRemovedProjector & IGuidelineRemoveReader;
  guidelineViewReader: IGuidelineViewReader;
  // Guideline Controllers
  addGuidelineController: AddGuidelineController;
  updateGuidelineController: UpdateGuidelineController;
  removeGuidelineController: RemoveGuidelineController;
  getGuidelinesController: GetGuidelinesController;
  searchGuidelinesController: SearchGuidelinesController;
  // Invariant Projection Stores - decomposed by use case
  invariantAddedProjector: IInvariantAddedProjector & IInvariantAddReader;
  invariantUpdatedProjector: IInvariantUpdatedProjector & IInvariantUpdateReader;
  invariantRemovedProjector: IInvariantRemovedProjector & IInvariantRemoveReader;
  invariantViewReader: IInvariantViewReader;
  searchIndexReader: ISearchIndexReader;
  searchIndexWriter: ISearchIndexWriter;
  searchController: SearchController;
  // Invariant Controllers
  addInvariantController: AddInvariantController;
  updateInvariantController: UpdateInvariantController;
  removeInvariantController: RemoveInvariantController;
  getInvariantsController: GetInvariantsController;
  // Brownfield Status
  brownfieldStatusReader: IBrownfieldStatusReader;

  // Project Knowledge Category - Event Stores
  // Project Event Stores - decomposed by use case
  projectInitializedEventStore: IProjectInitializedEventWriter;
  projectUpdatedEventStore: IProjectUpdatedEventWriter;
  // Project Services
  agentFileProtocol: IAgentFileProtocol;
  planProjectInitController: PlanProjectInitController;
  initializeProjectController: InitializeProjectController;
  // Audience Event Stores - decomposed by use case
  audienceAddedEventStore: IAudienceAddedEventWriter;
  audienceUpdatedEventStore: IAudienceUpdatedEventWriter;
  audienceRemovedEventStore: IAudienceRemovedEventWriter;
  // AudiencePain Event Stores - decomposed by use case
  audiencePainAddedEventStore: IAudiencePainAddedEventWriter;
  audiencePainUpdatedEventStore: IAudiencePainUpdatedEventWriter;
// ValueProposition Event Stores - decomposed by use case
  valuePropositionAddedEventStore: IValuePropositionAddedEventWriter;
  valuePropositionUpdatedEventStore: IValuePropositionUpdatedEventWriter;
  valuePropositionRemovedEventStore: IValuePropositionRemovedEventWriter;

  // Project Knowledge Category - Projection Stores
  // Project Projection Stores - decomposed by use case
  projectInitializedProjector: IProjectInitializedProjector & IProjectInitReader;
  projectUpdatedProjector: IProjectUpdatedProjector & IProjectUpdateReader;
  updateProjectController: UpdateProjectController;
  showProjectController: ShowProjectController;
  projectStatsController: ProjectStatsController;
  projectContextReader: IProjectContextReader;
  // Audience Projection Stores - decomposed by use case
  audienceAddedProjector: IAudienceAddedProjector;
  audienceUpdatedProjector: IAudienceUpdatedProjector & IAudienceUpdateReader;
  audienceRemovedProjector: IAudienceRemovedProjector & IAudienceRemoveReader;
  audienceContextReader: IAudienceContextReader;
  // AudiencePain Projection Stores - decomposed by use case
  audiencePainAddedProjector: IAudiencePainAddedProjector;
  audiencePainUpdatedProjector: IAudiencePainUpdatedProjector & IAudiencePainUpdateReader;
  updateAudiencePainController: UpdateAudiencePainController;
  getAudiencePainsController: GetAudiencePainsController;
  audiencePainContextReader: IAudiencePainContextReader;
  // ValueProposition Projection Stores - decomposed by use case
  valuePropositionAddedProjector: IValuePropositionAddedProjector;
  valuePropositionUpdatedProjector: IValuePropositionUpdatedProjector & IValuePropositionUpdateReader;
  valuePropositionRemovedProjector: IValuePropositionRemovedProjector & IValuePropositionRemoveReader;
  valuePropositionContextReader: IValuePropositionContextReader;
  addValuePropositionController: AddValuePropositionController;
  getValuePropositionsController: GetValuePropositionsController;
  removeValuePropositionController: RemoveValuePropositionController;
  updateValuePropositionController: UpdateValuePropositionController;

  // Relations Category - Controllers
  addRelationController: AddRelationController;
  removeRelationController: RemoveRelationController;
  getRelationsController: GetRelationsController;
  traverseRelationsController: TraverseRelationsController;
  findRelationPathController: FindRelationPathController;
  auditRelationsController: AuditRelationsController;

  // Relations Category - Event Stores - decomposed by use case
  relationAddedEventStore: IRelationAddedEventWriter;
  relationRemovedEventStore: IRelationRemovedEventWriter & IRelationRemovedEventReader;

  // Relations Category - Projection Stores - decomposed by use case
  relationAddedProjector: IRelationAddedProjector & IRelationAddedReader;
  relationRemovedProjector: IRelationRemovedProjector & IRelationRemovedReader & IRelationReader;
  relationViewReader: IRelationViewReader;
  relationNodeCatalog: IRelationNodeCatalog;
}
