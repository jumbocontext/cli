/**
 * Leaf Container Builder - Fluent Composition for Command Leaves
 *
 * Composes only the feature slices a leaf requests, sharing core
 * infrastructure (database, logger, event bus, settings) across features.
 * Core infrastructure is created lazily on first use.
 *
 * All concrete infrastructure knowledge (Fs*, Sqlite*, Local* types) is
 * encapsulated here. The returned LeafContainer exposes abstractions and
 * application-layer controllers only.
 *
 * When `useRemoteData` is enabled, feature methods compose remote gateways
 * instead of local ones. Remote gateways are not yet implemented; requesting
 * remote composition throws until a later migration phase introduces them.
 */

import * as path from "path";
import type Database from "better-sqlite3";

// Application-layer ports and controllers
import { ProjectIdentityResolver } from "../../application/identity/ProjectIdentityResolver.js";
import { InitializeProjectCommandHandler } from "../../application/context/project/init/InitializeProjectCommandHandler.js";
import { PlanProjectInitController } from "../../application/context/project/init/PlanProjectInitController.js";
import { InitializeProjectController } from "../../application/context/project/init/InitializeProjectController.js";
import { UpdateProjectCommandHandler } from "../../application/context/project/update/UpdateProjectCommandHandler.js";
import { LocalUpdateProjectGateway } from "../../application/context/project/update/LocalUpdateProjectGateway.js";
import { UpdateProjectController } from "../../application/context/project/update/UpdateProjectController.js";
import { AddAudienceCommandHandler } from "../../application/context/audiences/add/AddAudienceCommandHandler.js";
import { LocalAddAudienceGateway } from "../../application/context/audiences/add/LocalAddAudienceGateway.js";
import { AddAudienceController } from "../../application/context/audiences/add/AddAudienceController.js";

// Infrastructure implementations
import { CachedContextProject } from "./ContextProject.js";
import { LocalProjectDatabase } from "./LocalProjectDatabase.js";
import { isProjectInitialized } from "./ProjectInitializationProbe.js";
import { ProjectNotInitializedError } from "../../application/host/ProjectNotInitializedError.js";
import type { IEventBus } from "../../application/messaging/IEventBus.js";
import { FileLogger } from "../logging/FileLogger.js";
import { FsSettingsReader } from "../settings/FsSettingsReader.js";
import { FsSettingsInitializer } from "../settings/FsSettingsInitializer.js";

// Project initialization infrastructure
import { FsProjectInitializedEventStore } from "../context/project/init/FsProjectInitializedEventStore.js";
import { FsProjectUpdatedEventStore } from "../context/project/update/FsProjectUpdatedEventStore.js";
import { SqliteProjectUpdatedProjector } from "../context/project/update/SqliteProjectUpdatedProjector.js";
import { SqliteProjectInitializedProjector } from "../context/project/init/SqliteProjectInitializedProjector.js";
import { AgentFileProtocol } from "../context/project/init/AgentFileProtocol.js";
import { FsGitignoreProtocol } from "../context/project/init/FsGitignoreProtocol.js";
import { LocalPlanProjectInitGateway } from "../../application/context/project/init/LocalPlanProjectInitGateway.js";
import { LogLevel } from "../../application/logging/ILogger.js";
import type { BootContainer } from "../../application/host/BootContainer.js";
import type { LeafContainer } from "../../application/host/LeafContainer.js";
import { SqliteAudiencePainAddedProjector } from "../context/audience-pains/add/SqliteAudiencePainAddedProjector.js";
import { SqliteAudiencePainUpdatedProjector } from "../context/audience-pains/update/SqliteAudiencePainUpdatedProjector.js";
import { LocalAddAudiencePainGateway } from "../../application/context/audience-pains/add/LocalAddAudiencePainGateway.js";
import { AddAudiencePainController } from "../../application/context/audience-pains/add/AddAudiencePainController.js";
import { LocalAddValuePropositionGateway } from "../../application/context/value-propositions/add/LocalAddValuePropositionGateway.js";
import { AddValuePropositionController } from "../../application/context/value-propositions/add/AddValuePropositionController.js";
import { FsValuePropositionUpdatedEventStore } from "../context/value-propositions/update/FsValuePropositionUpdatedEventStore.js";
import { UpdateValuePropositionCommandHandler } from "../../application/context/value-propositions/update/UpdateValuePropositionCommandHandler.js";
import { LocalUpdateValuePropositionGateway } from "../../application/context/value-propositions/update/LocalUpdateValuePropositionGateway.js";
import { UpdateValuePropositionController } from "../../application/context/value-propositions/update/UpdateValuePropositionController.js";
import { FsValuePropositionRemovedEventStore } from "../context/value-propositions/remove/FsValuePropositionRemovedEventStore.js";
import { SqliteValuePropositionRemovedProjector } from "../context/value-propositions/remove/SqliteValuePropositionRemovedProjector.js";
import { RemoveValuePropositionCommandHandler } from "../../application/context/value-propositions/remove/RemoveValuePropositionCommandHandler.js";
import { LocalRemoveValuePropositionGateway } from "../../application/context/value-propositions/remove/LocalRemoveValuePropositionGateway.js";
import { RemoveValuePropositionController } from "../../application/context/value-propositions/remove/RemoveValuePropositionController.js";
import { LocalGetValuePropositionsGateway } from "../../application/context/value-propositions/get/LocalGetValuePropositionsGateway.js";
import { GetValuePropositionsController } from "../../application/context/value-propositions/get/GetValuePropositionsController.js";
import { LocalGetTelemetryStatusGateway } from "../../application/context/telemetry/get/LocalGetTelemetryStatusGateway.js";
import { GetTelemetryStatusController } from "../../application/context/telemetry/get/GetTelemetryStatusController.js";
import { UpdateTelemetryConsentCommandHandler } from "../../application/context/telemetry/update/UpdateTelemetryConsentCommandHandler.js";
import { LocalUpdateTelemetryConsentGateway } from "../../application/context/telemetry/update/LocalUpdateTelemetryConsentGateway.js";
import { UpdateTelemetryConsentController } from "../../application/context/telemetry/update/UpdateTelemetryConsentController.js";
import { CliVersionReader } from "../cli-metadata/query/CliVersionReader.js";
import type { ICliVersionReader } from "../../application/cli-metadata/query/ICliMetadataReader.js";
import { FsAudienceAddedEventStore } from "../context/audiences/add/FsAudienceAddedEventStore.js";
import { AddAudiencePainCommandHandler } from "../../application/context/audience-pains/add/AddAudiencePainCommandHandler.js";
import { ProcessTelemetryEnvironmentReader } from "../telemetry/ProcessTelemetryEnvironmentReader.js";
import { TelemetryConsentStatusResolver } from "../../application/context/telemetry/TelemetryConsentStatusResolver.js";
import { FsValuePropositionAddedEventStore } from "../context/value-propositions/add/FsValuePropositionAddedEventStore.js";
import { SqliteValuePropositionAddedProjector } from "../context/value-propositions/add/SqliteValuePropositionAddedProjector.js";
import { SqliteValuePropositionUpdatedProjector } from "../context/value-propositions/update/SqliteValuePropositionUpdatedProjector.js";
import { AddValuePropositionCommandHandler } from "../../application/context/value-propositions/add/AddValuePropositionCommandHandler.js";
import { FsAudiencePainAddedEventStore } from "../context/audience-pains/add/FsAudiencePainAddedEventStore.js";
import { LocalInitializeProjectGateway } from "../../application/context/project/init/LocalInitializeProjectGateway.js";
import { LocalShowProjectGateway } from "../../application/context/project/show/LocalShowProjectGateway.js";
import { ShowProjectController } from "../../application/context/project/show/ShowProjectController.js";
import { ProjectionBusFactory } from "../messaging/ProjectionBusFactory.js";
import { SqliteProjectContextReader } from "../context/project/query/SqliteProjectContextReader.js";
import { SqliteAudienceContextReader } from "../context/audiences/query/SqliteAudienceContextReader.js";
import { SqliteAudiencePainContextReader } from "../context/audience-pains/query/SqliteAudiencePainContextReader.js";
import { SqliteValuePropositionContextReader } from "../context/value-propositions/query/SqliteValuePropositionContextReader.js";
import { SqliteProjectStatsQuery } from "../context/project/stats/SqliteProjectStatsQuery.js";
import { GetProjectStatsQueryHandler } from "../../application/context/project/stats/GetProjectStatsQueryHandler.js";
import { LocalProjectStatsGateway } from "../../application/context/project/stats/LocalProjectStatsGateway.js";
import { ProjectStatsController } from "../../application/context/project/stats/ProjectStatsController.js";
import { SessionStartController } from "../../application/context/sessions/start/SessionStartController.js";
import { LocalStartSessionGateway } from "../../application/context/sessions/start/LocalStartSessionGateway.js";
import { StartSessionCommandHandler } from "../../application/context/sessions/start/StartSessionCommandHandler.js";
import { FsSessionStartedEventStore } from "../context/sessions/start/FsSessionStartedEventStore.js";
import { SqliteBrownfieldStatusReader } from "../context/sessions/start/SqliteBrownfieldStatusReader.js";
import { EndSessionController } from "../../application/context/sessions/end/EndSessionController.js";
import { LocalEndSessionGateway } from "../../application/context/sessions/end/LocalEndSessionGateway.js";
import { EndSessionCommandHandler } from "../../application/context/sessions/end/EndSessionCommandHandler.js";
import { FsSessionEndedEventStore } from "../context/sessions/end/FsSessionEndedEventStore.js";
import { SqliteActiveSessionReader } from "../context/sessions/end/SqliteActiveSessionReader.js";
import { GetSessionsController } from "../../application/context/sessions/get/GetSessionsController.js";
import { LocalGetSessionsGateway } from "../../application/context/sessions/get/LocalGetSessionsGateway.js";
import { SqliteSessionViewReader } from "../context/sessions/get/SqliteSessionViewReader.js";
import { GoalBacklogPreviewQueryHandler } from "../../application/context/goals/query/GoalBacklogPreviewQueryHandler.js";
import { AddGoalController } from "../../application/context/goals/add/AddGoalController.js";
import { UpdateGoalController } from "../../application/context/goals/update/UpdateGoalController.js";
import { UpdateGoalCommandHandler } from "../../application/context/goals/update/UpdateGoalCommandHandler.js";
import { LocalUpdateGoalGateway } from "../../application/context/goals/update/LocalUpdateGoalGateway.js";
import { PauseGoalController } from "../../application/context/goals/pause/PauseGoalController.js";
import { RemoveGoalController } from "../../application/context/goals/remove/RemoveGoalController.js";
import { ResetGoalController } from "../../application/context/goals/reset/ResetGoalController.js";
import { ResetGoalCommandHandler } from "../../application/context/goals/reset/ResetGoalCommandHandler.js";
import { LocalResetGoalGateway } from "../../application/context/goals/reset/LocalResetGoalGateway.js";
import { FsGoalResetEventStore } from "../context/goals/reset/FsGoalResetEventStore.js";
import { SqliteGoalResetProjector } from "../context/goals/reset/SqliteGoalResetProjector.js";
import { RemoveGoalCommandHandler } from "../../application/context/goals/remove/RemoveGoalCommandHandler.js";
import { LocalRemoveGoalGateway } from "../../application/context/goals/remove/LocalRemoveGoalGateway.js";
import { FsGoalRemovedEventStore } from "../context/goals/remove/FsGoalRemovedEventStore.js";
import { SqliteGoalRemovedProjector } from "../context/goals/remove/SqliteGoalRemovedProjector.js";
import { PauseGoalCommandHandler } from "../../application/context/goals/pause/PauseGoalCommandHandler.js";
import { LocalPauseGoalGateway } from "../../application/context/goals/pause/LocalPauseGoalGateway.js";
import { FsGoalPausedEventStore } from "../context/goals/pause/FsGoalPausedEventStore.js";
import { ResumeGoalController } from "../../application/context/goals/resume/ResumeGoalController.js";
import { ResumeGoalCommandHandler } from "../../application/context/goals/resume/ResumeGoalCommandHandler.js";
import { LocalResumeGoalGateway } from "../../application/context/goals/resume/LocalResumeGoalGateway.js";
import { PauseWorkCommandHandler } from "../../application/context/work/pause/PauseWorkCommandHandler.js";
import { LocalPauseWorkGateway } from "../../application/context/work/pause/LocalPauseWorkGateway.js";
import { PauseWorkController } from "../../application/context/work/pause/PauseWorkController.js";
import { ResumeWorkController } from "../../application/context/work/resume/ResumeWorkController.js";
import { LocalResumeWorkGateway } from "../../application/context/work/resume/LocalResumeWorkGateway.js";
import { SessionContextQueryHandler } from "../../application/context/sessions/get/SessionContextQueryHandler.js";
import { FsGoalResumedEventStore } from "../context/goals/resume/FsGoalResumedEventStore.js";
import { SqliteGoalResumedProjector } from "../context/goals/resume/SqliteGoalResumedProjector.js";
import { FsGoalPostponedEventStore } from "../context/goals/postpone/FsGoalPostponedEventStore.js";
import { SqliteGetGoalViewReader } from "../context/goals/get/SqliteGetGoalViewReader.js";
import { PostponeGoalCommandHandler } from "../../application/context/goals/postpone/PostponeGoalCommandHandler.js";
import { LocalPostponeGoalGateway } from "../../application/context/goals/postpone/LocalPostponeGoalGateway.js";
import { PostponeGoalController } from "../../application/context/goals/postpone/PostponeGoalController.js";
import { ReinstateGoalController } from "../../application/context/goals/reinstate/ReinstateGoalController.js";
import { LocalReinstateGoalGateway } from "../../application/context/goals/reinstate/LocalReinstateGoalGateway.js";
import { ReinstateGoalCommandHandler } from "../../application/context/goals/reinstate/ReinstateGoalCommandHandler.js";
import { FsGoalReinstatedEventStore } from "../context/goals/reinstate/FsGoalReinstatedEventStore.js";
import { SqliteGoalPausedProjector } from "../context/goals/pause/SqliteGoalPausedProjector.js";
import { GetGoalsController } from "../../application/context/goals/get/GetGoalsController.js";
import { LocalGetGoalsGateway } from "../../application/context/goals/get/LocalGetGoalsGateway.js";
import { SqliteGoalStatusReader } from "../context/goals/SqliteGoalStatusReader.js";
import { ShowGoalController } from "../../application/context/goals/get/ShowGoalController.js";
import { LocalShowGoalGateway } from "../../application/context/goals/get/LocalShowGoalGateway.js";
import { GoalContextQueryHandler } from "../../application/context/goals/get/GoalContextQueryHandler.js";
import { LocalAddGoalGateway } from "../../application/context/goals/add/LocalAddGoalGateway.js";
import { AddGoalCommandHandler } from "../../application/context/goals/add/AddGoalCommandHandler.js";
import { FsGoalAddedEventStore } from "../context/goals/add/FsGoalAddedEventStore.js";
import { FsGoalUpdatedEventStore } from "../context/goals/update/FsGoalUpdatedEventStore.js";
import { SqliteGoalUpdatedProjector } from "../context/goals/update/SqliteGoalUpdatedProjector.js";
import { SqliteComponentViewReader } from "../context/components/get/SqliteComponentViewReader.js";
import type { IComponentViewReader } from "../../application/context/components/get/IComponentViewReader.js";
import { SqliteComponentReader } from "../context/components/get/SqliteComponentReader.js";
import { SqliteRelationViewReader } from "../context/relations/get/SqliteRelationViewReader.js";
import { DefineArchitectureController } from "../../application/context/architecture/define/DefineArchitectureController.js";
import { LocalDefineArchitectureGateway } from "../../application/context/architecture/define/LocalDefineArchitectureGateway.js";
import { UpdateArchitectureController } from "../../application/context/architecture/update/UpdateArchitectureController.js";
import { LocalUpdateArchitectureGateway } from "../../application/context/architecture/update/LocalUpdateArchitectureGateway.js";
import { GetArchitectureController } from "../../application/context/architecture/get/GetArchitectureController.js";
import { LocalGetArchitectureGateway } from "../../application/context/architecture/get/LocalGetArchitectureGateway.js";
import { SqliteArchitectureReader } from "../context/architecture/SqliteArchitectureReader.js";
import { FsArchitectureDefinedEventStore } from "../context/architecture/define/FsArchitectureDefinedEventStore.js";
import { SqliteArchitectureDefinedProjector } from "../context/architecture/define/SqliteArchitectureDefinedProjector.js";
import { FsArchitectureUpdatedEventStore } from "../context/architecture/update/FsArchitectureUpdatedEventStore.js";
import { UpdateAudiencePainController } from "../../application/context/audience-pains/update/UpdateAudiencePainController.js";
import { LocalUpdateAudiencePainGateway } from "../../application/context/audience-pains/update/LocalUpdateAudiencePainGateway.js";
import { UpdateAudiencePainCommandHandler } from "../../application/context/audience-pains/update/UpdateAudiencePainCommandHandler.js";
import { FsAudiencePainUpdatedEventStore } from "../context/audience-pains/update/FsAudiencePainUpdatedEventStore.js";
import { GetAudiencePainsController } from "../../application/context/audience-pains/list/GetAudiencePainsController.js";
import { LocalGetAudiencePainsGateway } from "../../application/context/audience-pains/list/LocalGetAudiencePainsGateway.js";
import { ListAudiencesController } from "../../application/context/audiences/list/ListAudiencesController.js";
import { LocalListAudiencesGateway } from "../../application/context/audiences/list/LocalListAudiencesGateway.js";
import { RemoveAudienceController } from "../../application/context/audiences/remove/RemoveAudienceController.js";
import { LocalRemoveAudienceGateway } from "../../application/context/audiences/remove/LocalRemoveAudienceGateway.js";
import { RemoveAudienceCommandHandler } from "../../application/context/audiences/remove/RemoveAudienceCommandHandler.js";
import { FsAudienceRemovedEventStore } from "../context/audiences/remove/FsAudienceRemovedEventStore.js";
import { SqliteAudienceRemovedProjector } from "../context/audiences/remove/SqliteAudienceRemovedProjector.js";
import { UpdateAudienceController } from "../../application/context/audiences/update/UpdateAudienceController.js";
import { LocalUpdateAudienceGateway } from "../../application/context/audiences/update/LocalUpdateAudienceGateway.js";
import { UpdateAudienceCommandHandler } from "../../application/context/audiences/update/UpdateAudienceCommandHandler.js";
import { FsAudienceUpdatedEventStore } from "../context/audiences/update/FsAudienceUpdatedEventStore.js";
import { SqliteAudienceUpdatedProjector } from "../context/audiences/update/SqliteAudienceUpdatedProjector.js";
import { AddComponentController } from "../../application/context/components/add/AddComponentController.js";
import { LocalAddComponentGateway } from "../../application/context/components/add/LocalAddComponentGateway.js";
import { AddComponentCommandHandler } from "../../application/context/components/add/AddComponentCommandHandler.js";
import { FsComponentAddedEventStore } from "../context/components/add/FsComponentAddedEventStore.js";
import { SqliteComponentAddedProjector } from "../context/components/add/SqliteComponentAddedProjector.js";
import { SqliteComponentUpdatedProjector } from "../context/components/update/SqliteComponentUpdatedProjector.js";
import { GetComponentsController } from "../../application/context/components/list/GetComponentsController.js";
import { LocalGetComponentsGateway } from "../../application/context/components/list/LocalGetComponentsGateway.js";
import { SearchComponentsController } from "../../application/context/components/search/SearchComponentsController.js";
import { LocalSearchComponentsGateway } from "../../application/context/components/search/LocalSearchComponentsGateway.js";
import { UpdateComponentController } from "../../application/context/components/update/UpdateComponentController.js";
import { LocalUpdateComponentGateway } from "../../application/context/components/update/LocalUpdateComponentGateway.js";
import { UpdateComponentCommandHandler } from "../../application/context/components/update/UpdateComponentCommandHandler.js";
import { FsComponentUpdatedEventStore } from "../context/components/update/FsComponentUpdatedEventStore.js";
import { RenameComponentController } from "../../application/context/components/rename/RenameComponentController.js";
import { LocalRenameComponentGateway } from "../../application/context/components/rename/LocalRenameComponentGateway.js";
import { RenameComponentCommandHandler } from "../../application/context/components/rename/RenameComponentCommandHandler.js";
import { FsComponentRenamedEventStore } from "../context/components/rename/FsComponentRenamedEventStore.js";
import { SqliteComponentRenamedProjector } from "../context/components/rename/SqliteComponentRenamedProjector.js";
import { ShowComponentController } from "../../application/context/components/show/ShowComponentController.js";
import { LocalShowComponentGateway } from "../../application/context/components/show/LocalShowComponentGateway.js";
import { DeprecateComponentController } from "../../application/context/components/deprecate/DeprecateComponentController.js";
import { LocalDeprecateComponentGateway } from "../../application/context/components/deprecate/LocalDeprecateComponentGateway.js";
import { DeprecateComponentCommandHandler } from "../../application/context/components/deprecate/DeprecateComponentCommandHandler.js";
import { FsComponentDeprecatedEventStore } from "../context/components/deprecate/FsComponentDeprecatedEventStore.js";
import { SqliteComponentDeprecatedProjector } from "../context/components/deprecate/SqliteComponentDeprecatedProjector.js";
import { UndeprecateComponentController } from "../../application/context/components/undeprecate/UndeprecateComponentController.js";
import { LocalUndeprecateComponentGateway } from "../../application/context/components/undeprecate/LocalUndeprecateComponentGateway.js";
import { UndeprecateComponentCommandHandler } from "../../application/context/components/undeprecate/UndeprecateComponentCommandHandler.js";
import { FsComponentUndeprecatedEventStore } from "../context/components/undeprecate/FsComponentUndeprecatedEventStore.js";
import { SqliteComponentUndeprecatedProjector } from "../context/components/undeprecate/SqliteComponentUndeprecatedProjector.js";
import { FsComponentRemovedEventStore } from "../context/components/remove/FsComponentRemovedEventStore.js";
import { SqliteComponentRemovedProjector } from "../context/components/remove/SqliteComponentRemovedProjector.js";
import { RemoveComponentController } from "../../application/context/components/remove/RemoveComponentController.js";
import { LocalRemoveComponentGateway } from "../../application/context/components/remove/LocalRemoveComponentGateway.js";
import { RemoveComponentCommandHandler } from "../../application/context/components/remove/RemoveComponentCommandHandler.js";
import { AddDecisionController } from "../../application/context/decisions/add/AddDecisionController.js";
import { LocalAddDecisionGateway } from "../../application/context/decisions/add/LocalAddDecisionGateway.js";
import { AddDecisionCommandHandler } from "../../application/context/decisions/add/AddDecisionCommandHandler.js";
import { FsDecisionAddedEventStore } from "../context/decisions/add/FsDecisionAddedEventStore.js";
import { GetDecisionsController } from "../../application/context/decisions/get/GetDecisionsController.js";
import { LocalGetDecisionsGateway } from "../../application/context/decisions/get/LocalGetDecisionsGateway.js";
import { ShowDecisionController } from "../../application/context/decisions/show/ShowDecisionController.js";
import { LocalShowDecisionGateway } from "../../application/context/decisions/show/LocalShowDecisionGateway.js";
import { SearchDecisionsController } from "../../application/context/decisions/search/SearchDecisionsController.js";
import { LocalSearchDecisionsGateway } from "../../application/context/decisions/search/LocalSearchDecisionsGateway.js";
import { ReverseDecisionController } from "../../application/context/decisions/reverse/ReverseDecisionController.js";
import { LocalReverseDecisionGateway } from "../../application/context/decisions/reverse/LocalReverseDecisionGateway.js";
import { ReverseDecisionCommandHandler } from "../../application/context/decisions/reverse/ReverseDecisionCommandHandler.js";
import { FsDecisionReversedEventStore } from "../context/decisions/reverse/FsDecisionReversedEventStore.js";
import { SqliteDecisionReversedProjector } from "../context/decisions/reverse/SqliteDecisionReversedProjector.js";
import { FsDecisionUpdatedEventStore } from "../context/decisions/update/FsDecisionUpdatedEventStore.js";
import { SqliteDecisionUpdatedProjector } from "../context/decisions/update/SqliteDecisionUpdatedProjector.js";
import { RemoveDecisionController } from "../../application/context/decisions/remove/RemoveDecisionController.js";
import { LocalRemoveDecisionGateway } from "../../application/context/decisions/remove/LocalRemoveDecisionGateway.js";
import { RemoveDecisionCommandHandler } from "../../application/context/decisions/remove/RemoveDecisionCommandHandler.js";
import { FsDecisionRemovedEventStore } from "../context/decisions/remove/FsDecisionRemovedEventStore.js";
import { RestoreDecisionController } from "../../application/context/decisions/restore/RestoreDecisionController.js";
import { LocalRestoreDecisionGateway } from "../../application/context/decisions/restore/LocalRestoreDecisionGateway.js";
import { RestoreDecisionCommandHandler } from "../../application/context/decisions/restore/RestoreDecisionCommandHandler.js";
import { FsDecisionRestoredEventStore } from "../context/decisions/restore/FsDecisionRestoredEventStore.js";
import { SqliteDecisionRestoredProjector } from "../context/decisions/restore/SqliteDecisionRestoredProjector.js";
import { SupersedeDecisionController } from "../../application/context/decisions/supersede/SupersedeDecisionController.js";
import { LocalSupersedeDecisionGateway } from "../../application/context/decisions/supersede/LocalSupersedeDecisionGateway.js";
import { SupersedeDecisionCommandHandler } from "../../application/context/decisions/supersede/SupersedeDecisionCommandHandler.js";
import { FsDecisionSupersededEventStore } from "../context/decisions/supersede/FsDecisionSupersededEventStore.js";
import { SqliteDecisionSupersededProjector } from "../context/decisions/supersede/SqliteDecisionSupersededProjector.js";
import { UpdateDecisionController } from "../../application/context/decisions/update/UpdateDecisionController.js";
import { LocalUpdateDecisionGateway } from "../../application/context/decisions/update/LocalUpdateDecisionGateway.js";
import { UpdateDecisionCommandHandler } from "../../application/context/decisions/update/UpdateDecisionCommandHandler.js";
import { SqliteDependencyViewReader } from "../context/dependencies/get/SqliteDependencyViewReader.js";
import type { IDependencyViewReader } from "../../application/context/dependencies/get/IDependencyViewReader.js";
import { AddDependencyController } from "../../application/context/dependencies/add/AddDependencyController.js";
import { LocalAddDependencyGateway } from "../../application/context/dependencies/add/LocalAddDependencyGateway.js";
import { AddDependencyCommandHandler } from "../../application/context/dependencies/add/AddDependencyCommandHandler.js";
import { FsDependencyAddedEventStore } from "../context/dependencies/add/FsDependencyAddedEventStore.js";
import { SqliteDependencyAddedProjector } from "../context/dependencies/add/SqliteDependencyAddedProjector.js";
import { GetDependenciesController } from "../../application/context/dependencies/get/GetDependenciesController.js";
import { LocalGetDependenciesGateway } from "../../application/context/dependencies/get/LocalGetDependenciesGateway.js";
import { UpdateDependencyController } from "../../application/context/dependencies/update/UpdateDependencyController.js";
import { LocalUpdateDependencyGateway } from "../../application/context/dependencies/update/LocalUpdateDependencyGateway.js";
import { UpdateDependencyCommandHandler } from "../../application/context/dependencies/update/UpdateDependencyCommandHandler.js";
import { FsDependencyUpdatedEventStore } from "../context/dependencies/update/FsDependencyUpdatedEventStore.js";
import { SqliteDependencyUpdatedProjector } from "../context/dependencies/update/SqliteDependencyUpdatedProjector.js";
import { FsDependencyRemovedEventStore } from "../context/dependencies/remove/FsDependencyRemovedEventStore.js";
import { SqliteDependencyRemovedProjector } from "../context/dependencies/remove/SqliteDependencyRemovedProjector.js";
import { RemoveDependencyController } from "../../application/context/dependencies/remove/RemoveDependencyController.js";
import { LocalRemoveDependencyGateway } from "../../application/context/dependencies/remove/LocalRemoveDependencyGateway.js";
import { RemoveDependencyCommandHandler } from "../../application/context/dependencies/remove/RemoveDependencyCommandHandler.js";
import { SearchDependenciesController } from "../../application/context/dependencies/search/SearchDependenciesController.js";
import { LocalSearchDependenciesGateway } from "../../application/context/dependencies/search/LocalSearchDependenciesGateway.js";
import { SqliteGoalStartedProjector } from "../context/goals/start/SqliteGoalStartedProjector.js";
import type { IGoalReader } from "../../application/context/goals/start/IGoalReader.js";
import { FsGoalRefinedEventStore } from "../context/goals/refine/FsGoalRefinedEventStore.js";
import { SqliteGoalRefinedProjector } from "../context/goals/refine/SqliteGoalRefinedProjector.js";
import { RefineGoalCommandHandler } from "../../application/context/goals/refine/RefineGoalCommandHandler.js";
import { StartGoalCommandHandler } from "../../application/context/goals/start/StartGoalCommandHandler.js";
import { LocalStartGoalGateway } from "../../application/context/goals/start/LocalStartGoalGateway.js";
import { StartGoalController } from "../../application/context/goals/start/StartGoalController.js";
import { PrerequisitePolicy } from "../../domain/goals/rules/PrerequisitePolicy.js";
import { FsGoalStartedEventStore } from "../context/goals/start/FsGoalStartedEventStore.js";
import { LocalRefineGoalGateway } from "../../application/context/goals/refine/LocalRefineGoalGateway.js";
import { RefineGoalController } from "../../application/context/goals/refine/RefineGoalController.js";
import { FsGoalCommittedEventStore } from "../context/goals/commit/FsGoalCommittedEventStore.js";
import { SqliteGoalCommittedProjector } from "../context/goals/commit/SqliteGoalCommittedProjector.js";
import { CommitGoalCommandHandler } from "../../application/context/goals/commit/CommitGoalCommandHandler.js";
import { LocalCommitGoalGateway } from "../../application/context/goals/commit/LocalCommitGoalGateway.js";
import { CommitGoalController } from "../../application/context/goals/commit/CommitGoalController.js";
import { FsGoalSubmittedEventStore } from "../context/goals/submit/FsGoalSubmittedEventStore.js";
import { SqliteGoalSubmittedProjector } from "../context/goals/submit/SqliteGoalSubmittedProjector.js";
import { SubmitGoalCommandHandler } from "../../application/context/goals/submit/SubmitGoalCommandHandler.js";
import { LocalSubmitGoalGateway } from "../../application/context/goals/submit/LocalSubmitGoalGateway.js";
import { SubmitGoalController } from "../../application/context/goals/submit/SubmitGoalController.js";
import { BlockGoalController } from "../../application/context/goals/block/BlockGoalController.js";
import { LocalBlockGoalGateway } from "../../application/context/goals/block/LocalBlockGoalGateway.js";
import { BlockGoalCommandHandler } from "../../application/context/goals/block/BlockGoalCommandHandler.js";
import { FsGoalBlockedEventStore } from "../context/goals/block/FsGoalBlockedEventStore.js";
import { UnblockGoalController } from "../../application/context/goals/unblock/UnblockGoalController.js";
import { LocalUnblockGoalGateway } from "../../application/context/goals/unblock/LocalUnblockGoalGateway.js";
import { UnblockGoalCommandHandler } from "../../application/context/goals/unblock/UnblockGoalCommandHandler.js";
import { FsGoalUnblockedEventStore } from "../context/goals/unblock/FsGoalUnblockedEventStore.js";
import { CodifyGoalController } from "../../application/context/goals/codify/CodifyGoalController.js";
import { CodifyGoalCommandHandler } from "../../application/context/goals/codify/CodifyGoalCommandHandler.js";
import { LocalCodifyGoalGateway } from "../../application/context/goals/codify/LocalCodifyGoalGateway.js";
import { FsGoalCodifyingStartedEventStore } from "../context/goals/codify/FsGoalCodifyingStartedEventStore.js";
import { SqliteGoalCodifyingStartedProjector } from "../context/goals/codify/SqliteGoalCodifyingStartedProjector.js";
import { CloseGoalController } from "../../application/context/goals/close/CloseGoalController.js";
import { CloseGoalCommandHandler } from "../../application/context/goals/close/CloseGoalCommandHandler.js";
import { LocalCloseGoalGateway } from "../../application/context/goals/close/LocalCloseGoalGateway.js";
import { FsGoalClosedEventStore } from "../context/goals/close/FsGoalClosedEventStore.js";
import { SqliteGoalClosedProjector } from "../context/goals/close/SqliteGoalClosedProjector.js";
import { FsGoalRejectedEventStore } from "../context/goals/reject/FsGoalRejectedEventStore.js";
import { SqliteGoalRejectedProjector } from "../context/goals/reject/SqliteGoalRejectedProjector.js";
import { RejectGoalCommandHandler } from "../../application/context/goals/reject/RejectGoalCommandHandler.js";
import { LocalRejectGoalGateway } from "../../application/context/goals/reject/LocalRejectGoalGateway.js";
import { RejectGoalController } from "../../application/context/goals/reject/RejectGoalController.js";
import { QualifyGoalController } from "../../application/context/goals/qualify/QualifyGoalController.js";
import { QualifyGoalCommandHandler } from "../../application/context/goals/qualify/QualifyGoalCommandHandler.js";
import { LocalQualifyGoalGateway } from "../../application/context/goals/qualify/LocalQualifyGoalGateway.js";
import { FsGoalQualifiedEventStore } from "../context/goals/qualify/FsGoalQualifiedEventStore.js";
import { FsGoalSubmittedForReviewEventStore } from "../context/goals/review/FsGoalSubmittedForReviewEventStore.js";
import { SubmitGoalForReviewCommandHandler } from "../../application/context/goals/review/SubmitGoalForReviewCommandHandler.js";
import { LocalReviewGoalGateway } from "../../application/context/goals/review/LocalReviewGoalGateway.js";
import { ReviewGoalController } from "../../application/context/goals/review/ReviewGoalController.js";
import { SystemClock } from "../time-and-date/SystemClock.js";
import { SqliteGoalClaimStore } from "../context/goals/claims/SqliteGoalClaimStore.js";
import { GoalClaimPolicy } from "../../application/context/goals/claims/GoalClaimPolicy.js";
import { HostSessionKeyResolver } from "./session/HostSessionKeyResolver.js";
import { SqliteWorkerIdentityRegistry } from "./workers/SqliteWorkerIdentityRegistry.js";
import { FsWorkerIdentifiedEventStore } from "./workers/identify/FsWorkerIdentifiedEventStore.js";
import { SqliteWorkerIdentifiedProjector } from "./workers/identify/SqliteWorkerIdentifiedProjector.js";
import { FsRelationAddedEventStore } from "../context/relations/add/FsRelationAddedEventStore.js";
import { SqliteRelationAddedProjector } from "../context/relations/add/SqliteRelationAddedProjector.js";
import { AddRelationCommandHandler } from "../../application/context/relations/add/AddRelationCommandHandler.js";
import { EvolveController } from "../../application/evolve/EvolveController.js";
import { UpgradeCommandHandler } from "../../application/maintenance/upgrade/UpgradeCommandHandler.js";
import { MigrateDependenciesCommandHandler } from "../../application/maintenance/migrate-dependencies/MigrateDependenciesCommandHandler.js";
import { SqliteLegacyDependencyReader } from "../context/dependencies/get/SqliteLegacyDependencyReader.js";
import { FsEventStore } from "../persistence/FsEventStore.js";
import { SearchIndexRebuildController } from "../../application/context/search/SearchIndexRebuildController.js";
import { SearchController } from "../../application/context/search/SearchController.js";
import { LocalSearchGateway } from "../../application/context/search/LocalSearchGateway.js";
import { ProjectedSearchIndexProvider } from "../context/search/ProjectedSearchIndexProvider.js";
import { LocalSearchIndexRebuildGateway } from "../context/search/LocalSearchIndexRebuildGateway.js";
import { SqliteSearchIndexStore } from "../context/search/SqliteSearchIndexStore.js";
import { SearchDocumentProjectorRegistry } from "../../application/context/search/SearchDocumentProjectorRegistry.js";
import { LocalDatabaseRebuildService } from "../local/LocalDatabaseRebuildService.js";
import { LocalRebuildDatabaseGateway } from "../../application/maintenance/db/rebuild/LocalRebuildDatabaseGateway.js";
import { RebuildDatabaseController } from "../../application/maintenance/db/rebuild/RebuildDatabaseController.js";
import { MigrationRunner } from "../persistence/MigrationRunner.js";
import { getNamespaceMigrations } from "../persistence/migrations.config.js";
import { LocalAddRelationGateway } from "../../application/context/relations/add/LocalAddRelationGateway.js";
import { AddRelationController } from "../../application/context/relations/add/AddRelationController.js";
import { FsRelationRemovedEventStore } from "../context/relations/remove/FsRelationRemovedEventStore.js";
import { RemoveRelationCommandHandler } from "../../application/context/relations/remove/RemoveRelationCommandHandler.js";
import { LocalRemoveRelationGateway } from "../../application/context/relations/remove/LocalRemoveRelationGateway.js";
import { RemoveRelationController } from "../../application/context/relations/remove/RemoveRelationController.js";
import { LocalGetRelationsGateway } from "../../application/context/relations/get/LocalGetRelationsGateway.js";
import { GetRelationsController } from "../../application/context/relations/get/GetRelationsController.js";
import { RelationNodeReferenceResolver } from "../../application/context/relations/traverse/RelationNodeReferenceResolver.js";
import { RelationTraversalQueryNormalizer } from "../../application/context/relations/traverse/RelationTraversalQueryNormalizer.js";
import { RelationTraversalPolicy } from "../../application/context/relations/traverse/RelationTraversalPolicy.js";
import { LocalTraverseRelationsGateway } from "../../application/context/relations/traverse/LocalTraverseRelationsGateway.js";
import { TraverseRelationsController } from "../../application/context/relations/traverse/TraverseRelationsController.js";
import { RelationShortestPathFinder } from "../../application/context/relations/path/RelationShortestPathFinder.js";
import { LocalFindRelationPathGateway } from "../../application/context/relations/path/LocalFindRelationPathGateway.js";
import { FindRelationPathController } from "../../application/context/relations/path/FindRelationPathController.js";
import { SqliteRelationNodeCatalog } from "../context/relations/audit/SqliteRelationNodeCatalog.js";
import { RelationAuditPolicy } from "../../application/context/relations/audit/RelationAuditPolicy.js";
import { AuditRelationsController } from "../../application/context/relations/audit/AuditRelationsController.js";
import type { IGuidelineViewReader } from "../../application/context/guidelines/get/IGuidelineViewReader.js";
import { AddGuidelineCommandHandler } from "../../application/context/guidelines/add/AddGuidelineCommandHandler.js";
import { LocalAddGuidelineGateway } from "../../application/context/guidelines/add/LocalAddGuidelineGateway.js";
import { AddGuidelineController } from "../../application/context/guidelines/add/AddGuidelineController.js";
import { UpdateGuidelineCommandHandler } from "../../application/context/guidelines/update/UpdateGuidelineCommandHandler.js";
import { LocalUpdateGuidelineGateway } from "../../application/context/guidelines/update/LocalUpdateGuidelineGateway.js";
import { UpdateGuidelineController } from "../../application/context/guidelines/update/UpdateGuidelineController.js";
import { RemoveGuidelineCommandHandler } from "../../application/context/guidelines/remove/RemoveGuidelineCommandHandler.js";
import { LocalRemoveGuidelineGateway } from "../../application/context/guidelines/remove/LocalRemoveGuidelineGateway.js";
import { RemoveGuidelineController } from "../../application/context/guidelines/remove/RemoveGuidelineController.js";
import { ShowGuidelineController } from "../../application/context/guidelines/show/ShowGuidelineController.js";
import { LocalShowGuidelineGateway } from "../../application/context/guidelines/show/LocalShowGuidelineGateway.js";
import { GetGuidelinesController } from "../../application/context/guidelines/get/GetGuidelinesController.js";
import { LocalGetGuidelinesGateway } from "../../application/context/guidelines/get/LocalGetGuidelinesGateway.js";
import { SearchGuidelinesController } from "../../application/context/guidelines/search/SearchGuidelinesController.js";
import { LocalSearchGuidelinesGateway } from "../../application/context/guidelines/search/LocalSearchGuidelinesGateway.js";
import { AddInvariantCommandHandler } from "../../application/context/invariants/add/AddInvariantCommandHandler.js";
import { LocalAddInvariantGateway } from "../../application/context/invariants/add/LocalAddInvariantGateway.js";
import { AddInvariantController } from "../../application/context/invariants/add/AddInvariantController.js";
import { UpdateInvariantCommandHandler } from "../../application/context/invariants/update/UpdateInvariantCommandHandler.js";
import { LocalUpdateInvariantGateway } from "../../application/context/invariants/update/LocalUpdateInvariantGateway.js";
import { UpdateInvariantController } from "../../application/context/invariants/update/UpdateInvariantController.js";
import { RemoveInvariantCommandHandler } from "../../application/context/invariants/remove/RemoveInvariantCommandHandler.js";
import { LocalRemoveInvariantGateway } from "../../application/context/invariants/remove/LocalRemoveInvariantGateway.js";
import { RemoveInvariantController } from "../../application/context/invariants/remove/RemoveInvariantController.js";
import { GetInvariantsController } from "../../application/context/invariants/get/GetInvariantsController.js";
import { LocalGetInvariantsGateway } from "../../application/context/invariants/get/LocalGetInvariantsGateway.js";
import { SearchInvariantsController } from "../../application/context/invariants/search/SearchInvariantsController.js";
import { LocalSearchInvariantsGateway } from "../../application/context/invariants/search/LocalSearchInvariantsGateway.js";
import type { IInvariantViewReader } from "../../application/context/invariants/get/IInvariantViewReader.js";
import type { IDecisionViewReader } from "../../application/context/decisions/get/IDecisionViewReader.js";
import { SqliteRelationRemovedProjector } from "../context/relations/remove/SqliteRelationRemovedProjector.js";
import { SqliteDecisionViewReader } from "../context/decisions/get/SqliteDecisionViewReader.js";
import { SqliteInvariantViewReader } from "../context/invariants/get/SqliteInvariantViewReader.js";
import { SqliteInvariantAddedProjector } from "../context/invariants/add/SqliteInvariantAddedProjector.js";
import { SqliteInvariantUpdatedProjector } from "../context/invariants/update/SqliteInvariantUpdatedProjector.js";
import { SqliteInvariantRemovedProjector } from "../context/invariants/remove/SqliteInvariantRemovedProjector.js";
import { FsInvariantAddedEventStore } from "../context/invariants/add/FsInvariantAddedEventStore.js";
import { FsInvariantUpdatedEventStore } from "../context/invariants/update/FsInvariantUpdatedEventStore.js";
import { FsInvariantRemovedEventStore } from "../context/invariants/remove/FsInvariantRemovedEventStore.js";
import { SqliteGuidelineViewReader } from "../context/guidelines/get/SqliteGuidelineViewReader.js";
import { SqliteGuidelineAddedProjector } from "../context/guidelines/add/SqliteGuidelineAddedProjector.js";
import { SqliteGuidelineUpdatedProjector } from "../context/guidelines/update/SqliteGuidelineUpdatedProjector.js";
import { SqliteGuidelineRemovedProjector } from "../context/guidelines/remove/SqliteGuidelineRemovedProjector.js";
import { FsGuidelineAddedEventStore } from "../context/guidelines/add/FsGuidelineAddedEventStore.js";
import { FsGuidelineUpdatedEventStore } from "../context/guidelines/update/FsGuidelineUpdatedEventStore.js";
import { FsGuidelineRemovedEventStore } from "../context/guidelines/remove/FsGuidelineRemovedEventStore.js";
import { SqliteGoalContextAssembler } from "../context/SqliteGoalContextAssembler.js";
import { FsGoalProgressUpdatedEventStore } from "../context/goals/update-progress/FsGoalProgressUpdatedEventStore.js";
import { SqliteGoalProgressUpdatedProjector } from "../context/goals/update-progress/SqliteGoalProgressUpdatedProjector.js";
import { UpdateGoalProgressCommandHandler } from "../../application/context/goals/update-progress/UpdateGoalProgressCommandHandler.js";
import { LocalUpdateGoalProgressGateway } from "../../application/context/goals/update-progress/LocalUpdateGoalProgressGateway.js";
import { UpdateGoalProgressController } from "../../application/context/goals/update-progress/UpdateGoalProgressController.js";
import { ViewWorkerController } from "../../application/context/host/workers/view/ViewWorkerController.js";
import { LocalViewWorkerGateway } from "../../application/context/host/workers/view/LocalViewWorkerGateway.js";
import type { ITelemetryClient } from "../../application/telemetry/ITelemetryClient.js";
import { NoOpTelemetryClient } from "../telemetry/NoOpTelemetryClient.js";
import { PostHogTelemetryClient } from "../telemetry/PostHogTelemetryClient.js";
import type { IGoalStatusReader } from "../../application/context/goals/IGoalStatusReader.js";
import type { IWorkerIdentityReader } from "../../application/host/workers/IWorkerIdentityReader.js";
import type { IGoalCodifyingStartedProjector } from "../../application/context/goals/codify/IGoalCodifyingStartedProjector.js";
import type { IGoalCodifyReader } from "../../application/context/goals/codify/IGoalCodifyReader.js";
import type { IGoalRefinedProjector } from "../../application/context/goals/refine/IGoalRefinedProjector.js";
import type { IGoalRefineReader } from "../../application/context/goals/refine/IGoalRefineReader.js";
import type { ISettingsReader } from "../../application/settings/ISettingsReader.js";
import type { IProjectContextReader } from "../../application/context/project/query/IProjectContextReader.js";
import { CliUpdateController } from "../../application/cli-metadata/update/CliUpdateController.js";
import { NpmPackageVersionGateway } from "../cli-metadata/update/NpmPackageVersionGateway.js";
import { NpmPackageUpgradeGateway } from "../cli-metadata/update/NpmPackageUpgradeGateway.js";

interface BootInfrastructure {
  readonly projectDataDir: string;
  readonly logger: FileLogger;
}

interface CoreInfrastructure extends BootInfrastructure {
  readonly db: Database.Database;
  readonly eventBus: IEventBus;
  readonly settingsReader: FsSettingsReader;
}


export interface TelemetryClientFeature {
  telemetryClient: ITelemetryClient;
}

export interface GoalStatusReaderFeature {
  goalStatusReader: IGoalStatusReader;
}

export interface GoalClaimPolicyFeature {
  goalClaimPolicy: GoalClaimPolicy;
}

export interface WorkerIdentityReaderFeature {
  workerIdentityReader: IWorkerIdentityReader;
}

export interface GoalCodifyingStartedProjectorFeature {
  goalCodifyingStartedProjector: IGoalCodifyingStartedProjector &
    IGoalCodifyReader;
}

export interface GoalRefinedProjectorFeature {
  goalRefinedProjector: IGoalRefinedProjector & IGoalRefineReader;
}

export interface SettingsReaderFeature {
  settingsReader: ISettingsReader;
}

export interface CliUpdateFeature {
  cliUpdateController: CliUpdateController;
}

export interface ProjectContextReaderFeature {
  projectContextReader: IProjectContextReader;
}

export interface ProjectInitFeature {
  planProjectInitController: PlanProjectInitController;
  initializeProjectController: InitializeProjectController;
}

export interface AudienceFeature {
  addAudienceController: AddAudienceController;
}

export interface AudiencePainFeature {
  addAudiencePainController: AddAudiencePainController;
}

export interface ValuePropositionFeature {
  addValuePropositionController: AddValuePropositionController;
}

export interface GetValuePropositionsFeature {
  getValuePropositionsController: GetValuePropositionsController;
}

export interface UpdateValuePropositionFeature {
  updateValuePropositionController: UpdateValuePropositionController;
}

export interface RemoveValuePropositionFeature {
  removeValuePropositionController: RemoveValuePropositionController;
}

export interface TelemetryFeature {
  getTelemetryStatusController: GetTelemetryStatusController;
  updateTelemetryConsentController: UpdateTelemetryConsentController;
}

export interface ViewWorkerFeature {
  viewWorkerController: ViewWorkerController;
}

export interface CliVersionFeature {
  cliVersionReader: ICliVersionReader;
}

export interface ShowProjectFeature {
  showProjectController: ShowProjectController;
}

export interface UpdateProjectFeature {
  updateProjectController: UpdateProjectController;
}

export interface ProjectStatsFeature {
  projectStatsController: ProjectStatsController;
}

export interface AddGoalFeature {
  addGoalController: AddGoalController;
}

export interface UpdateGoalFeature {
  updateGoalController: UpdateGoalController;
}

export interface UpdateGoalProgressFeature {
  updateGoalProgressController: UpdateGoalProgressController;
}

export interface ComponentViewFeature {
  componentViewReader: IComponentViewReader;
}

export interface ShowGoalFeature {
  showGoalController: ShowGoalController;
}

export interface GetGoalsFeature {
  getGoalsController: GetGoalsController;
}

export interface PostponeGoalFeature {
  postponeGoalController: PostponeGoalController;
}

export interface ResetGoalFeature {
  resetGoalController: ResetGoalController;
}

export interface RemoveGoalFeature {
  removeGoalController: RemoveGoalController;
}

export interface PauseGoalFeature {
  pauseGoalController: PauseGoalController;
}

export interface BlockGoalFeature {
  blockGoalController: BlockGoalController;
}

export interface UnblockGoalFeature {
  unblockGoalController: UnblockGoalController;
}

export interface ReinstateGoalFeature {
  reinstateGoalController: ReinstateGoalController;
}

export interface GoalContextReaderFeature {
  goalContextReader: IGoalReader;
}

export interface RefineGoalFeature {
  refineGoalController: RefineGoalController;
}

export interface ResumeGoalFeature {
  resumeGoalController: ResumeGoalController;
}

export interface PauseWorkFeature {
  pauseWorkController: PauseWorkController;
}

export interface ResumeWorkFeature {
  resumeWorkController: ResumeWorkController;
}

export interface StartGoalFeature {
  startGoalController: StartGoalController;
}

export interface SessionStartFeature {
  sessionStartController: SessionStartController;
}

export interface EndSessionFeature {
  endSessionController: EndSessionController;
}

export interface GetSessionsFeature {
  getSessionsController: GetSessionsController;
}

export interface CommitGoalFeature {
  commitGoalController: CommitGoalController;
}

export interface SubmitGoalFeature {
  submitGoalController: SubmitGoalController;
}

export interface CodifyGoalFeature {
  codifyGoalController: CodifyGoalController;
}

export interface CloseGoalFeature {
  closeGoalController: CloseGoalController;
}

export interface ReviewGoalFeature {
  reviewGoalController: ReviewGoalController;
}

export interface RejectGoalFeature {
  rejectGoalController: RejectGoalController;
}

export interface QualifyGoalFeature {
  qualifyGoalController: QualifyGoalController;
}

export interface GuidelineViewFeature {
  guidelineViewReader: IGuidelineViewReader;
}

export interface AddGuidelineFeature {
  addGuidelineController: AddGuidelineController;
}

export interface UpdateGuidelineFeature {
  updateGuidelineController: UpdateGuidelineController;
}

export interface RemoveGuidelineFeature {
  removeGuidelineController: RemoveGuidelineController;
}

export interface ShowGuidelineFeature {
  showGuidelineController: ShowGuidelineController;
}

export interface GetGuidelinesFeature {
  getGuidelinesController: GetGuidelinesController;
}

export interface SearchGuidelinesFeature {
  searchGuidelinesController: SearchGuidelinesController;
}

export interface InvariantViewFeature {
  invariantViewReader: IInvariantViewReader;
}

export interface AddInvariantFeature {
  addInvariantController: AddInvariantController;
}

export interface UpdateInvariantFeature {
  updateInvariantController: UpdateInvariantController;
}

export interface RemoveInvariantFeature {
  removeInvariantController: RemoveInvariantController;
}

export interface GetInvariantsFeature {
  getInvariantsController: GetInvariantsController;
}

export interface SearchInvariantsFeature {
  searchInvariantsController: SearchInvariantsController;
}

export interface DecisionViewFeature {
  decisionViewReader: IDecisionViewReader;
}

export interface AddRelationFeature {
  addRelationController: AddRelationController;
}

export interface RemoveRelationFeature {
  removeRelationController: RemoveRelationController;
}

export interface GetRelationsFeature {
  getRelationsController: GetRelationsController;
}

export interface AuditRelationsFeature {
  auditRelationsController: AuditRelationsController;
}

export interface FindRelationPathFeature {
  findRelationPathController: FindRelationPathController;
}

export interface TraverseRelationsFeature {
  traverseRelationsController: TraverseRelationsController;
}

export interface EvolveFeature {
  evolveController: EvolveController;
}

export interface RebuildDatabaseFeature {
  rebuildDatabaseController: RebuildDatabaseController;
}

export interface SearchIndexRebuildFeature {
  searchIndexRebuildController: SearchIndexRebuildController;
}

export interface SearchFeature {
  searchController: SearchController;
}

export interface DefineArchitectureFeature {
  defineArchitectureController: DefineArchitectureController;
}

export interface UpdateArchitectureFeature {
  updateArchitectureController: UpdateArchitectureController;
}

export interface GetArchitectureFeature {
  getArchitectureController: GetArchitectureController;
}

export interface UpdateAudiencePainFeature {
  updateAudiencePainController: UpdateAudiencePainController;
}

export interface GetAudiencePainsFeature {
  getAudiencePainsController: GetAudiencePainsController;
}

export interface ListAudiencesFeature {
  listAudiencesController: ListAudiencesController;
}

export interface RemoveAudienceFeature {
  removeAudienceController: RemoveAudienceController;
}

export interface UpdateAudienceFeature {
  updateAudienceController: UpdateAudienceController;
}

export interface AddComponentFeature {
  addComponentController: AddComponentController;
}

export interface GetComponentsFeature {
  getComponentsController: GetComponentsController;
}

export interface SearchComponentsFeature {
  searchComponentsController: SearchComponentsController;
}

export interface UpdateComponentFeature {
  updateComponentController: UpdateComponentController;
}

export interface RenameComponentFeature {
  renameComponentController: RenameComponentController;
}

export interface ShowComponentFeature {
  showComponentController: ShowComponentController;
}

export interface DeprecateComponentFeature {
  deprecateComponentController: DeprecateComponentController;
}

export interface UndeprecateComponentFeature {
  undeprecateComponentController: UndeprecateComponentController;
}

export interface RemoveComponentFeature {
  removeComponentController: RemoveComponentController;
}

export interface AddDecisionFeature {
  addDecisionController: AddDecisionController;
}

export interface GetDecisionsFeature {
  getDecisionsController: GetDecisionsController;
}

export interface ShowDecisionFeature {
  showDecisionController: ShowDecisionController;
}

export interface SearchDecisionsFeature {
  searchDecisionsController: SearchDecisionsController;
}

export interface ReverseDecisionFeature {
  reverseDecisionController: ReverseDecisionController;
}

export interface RemoveDecisionFeature {
  removeDecisionController: RemoveDecisionController;
}

export interface RestoreDecisionFeature {
  restoreDecisionController: RestoreDecisionController;
}

export interface SupersedeDecisionFeature {
  supersedeDecisionController: SupersedeDecisionController;
}

export interface UpdateDecisionFeature {
  updateDecisionController: UpdateDecisionController;
}

export interface DependencyViewFeature {
  dependencyViewReader: IDependencyViewReader;
}

export interface AddDependencyFeature {
  addDependencyController: AddDependencyController;
}

export interface GetDependenciesFeature {
  getDependenciesController: GetDependenciesController;
}

export interface UpdateDependencyFeature {
  updateDependencyController: UpdateDependencyController;
}

export interface RemoveDependencyFeature {
  removeDependencyController: RemoveDependencyController;
}

export interface SearchDependenciesFeature {
  searchDependenciesController: SearchDependenciesController;
}

export class LeafContainerBuilder {
  private boot: BootInfrastructure | undefined;
  private core: CoreInfrastructure | undefined;

  private hasProjectInitFeature = false;
  private hasAudienceFeature = false;
  private hasAudiencePainFeature = false;
  private hasValuePropositionFeature = false;
  private hasGetValuePropositionsFeature = false;
  private hasUpdateValuePropositionFeature = false;
  private hasRemoveValuePropositionFeature = false;
  private hasTelemetryFeature = false;
  private hasCliVersionReader = false;
  private hasShowProjectFeature = false;
  private hasUpdateProjectFeature = false;
  private hasProjectStatsFeature = false;
  private hasAddGoalFeature = false;
  private hasUpdateGoalFeature = false;
  private hasUpdateGoalProgressFeature = false;
  private hasComponentViewFeature = false;
  private hasShowGoalFeature = false;
  private hasPostponeGoalFeature = false;
  private hasResetGoalFeature = false;
  private hasRemoveGoalFeature = false;
  private hasPauseGoalFeature = false;
  private hasBlockGoalFeature = false;
  private hasUnblockGoalFeature = false;
  private hasReinstateGoalFeature = false;
  private hasGetGoalsFeature = false;
  private hasGoalContextReaderFeature = false;
  private hasRefineGoalFeature = false;
  private hasResumeGoalFeature = false;
  private hasPauseWorkFeature = false;
  private hasResumeWorkFeature = false;
  private hasStartGoalFeature = false;
  private hasSessionStartFeature = false;
  private hasEndSessionFeature = false;
  private hasGetSessionsFeature = false;
  private hasCommitGoalFeature = false;
  private hasSubmitGoalFeature = false;
  private hasCodifyGoalFeature = false;
  private hasCloseGoalFeature = false;
  private hasReviewGoalFeature = false;
  private hasRejectGoalFeature = false;
  private hasQualifyGoalFeature = false;
  private hasGuidelineViewFeature = false;
  private hasAddGuidelineFeature = false;
  private hasUpdateGuidelineFeature = false;
  private hasRemoveGuidelineFeature = false;
  private hasShowGuidelineFeature = false;
  private hasGetGuidelinesFeature = false;
  private hasSearchGuidelinesFeature = false;
  private hasInvariantViewFeature = false;
  private hasAddInvariantFeature = false;
  private hasUpdateInvariantFeature = false;
  private hasRemoveInvariantFeature = false;
  private hasGetInvariantsFeature = false;
  private hasSearchInvariantsFeature = false;
  private hasDecisionViewFeature = false;
  private hasAddRelationFeature = false;
  private hasRemoveRelationFeature = false;
  private hasGetRelationsFeature = false;
  private hasAuditRelationsFeature = false;
  private hasFindRelationPathFeature = false;
  private hasTraverseRelationsFeature = false;
  private hasEvolveFeature = false;
  private hasRebuildDatabaseFeature = false;
  private hasSearchIndexRebuildFeature = false;
  private hasSearchFeature = false;
  private hasViewWorkerFeature = false;
  private hasDefineArchitectureFeature = false;
  private hasUpdateArchitectureFeature = false;
  private hasGetArchitectureFeature = false;
  private hasUpdateAudiencePainFeature = false;
  private hasGetAudiencePainsFeature = false;
  private hasListAudiencesFeature = false;
  private hasRemoveAudienceFeature = false;
  private hasUpdateAudienceFeature = false;
  private hasAddComponentFeature = false;
  private hasGetComponentsFeature = false;
  private hasSearchComponentsFeature = false;
  private hasUpdateComponentFeature = false;
  private hasRenameComponentFeature = false;
  private hasShowComponentFeature = false;
  private hasDeprecateComponentFeature = false;
  private hasUndeprecateComponentFeature = false;
  private hasRemoveComponentFeature = false;
  private hasAddDecisionFeature = false;
  private hasGetDecisionsFeature = false;
  private hasShowDecisionFeature = false;
  private hasSearchDecisionsFeature = false;
  private hasReverseDecisionFeature = false;
  private hasRemoveDecisionFeature = false;
  private hasRestoreDecisionFeature = false;
  private hasSupersedeDecisionFeature = false;
  private hasUpdateDecisionFeature = false;
  private hasDependencyViewFeature = false;
  private hasAddDependencyFeature = false;
  private hasGetDependenciesFeature = false;
  private hasUpdateDependencyFeature = false;
  private hasRemoveDependencyFeature = false;
  private hasSearchDependenciesFeature = false;
  private hasTelemetryClientFeature = false;
  private hasGoalStatusReaderFeature = false;
  private hasGoalClaimPolicyFeature = false;
  private hasWorkerIdentityReaderFeature = false;
  private hasGoalCodifyingStartedProjectorFeature = false;
  private hasGoalRefinedProjectorFeature = false;
  private hasSettingsReaderFeature = false;
  private hasCliUpdateFeature = false;
  private hasProjectContextReaderFeature = false;
  private builtTelemetryClient: ITelemetryClient | undefined;
  private readonly cleanups: Array<() => void | Promise<void>> = [];

  constructor(private readonly useRemoteData: boolean = false) {}

  withProjectInitFeature(): this & ProjectInitFeature {
    this.hasProjectInitFeature = true;
    return this as this & ProjectInitFeature;
  }

  withAudienceFeature(): this & AudienceFeature {
    this.hasAudienceFeature = true;
    return this as this & AudienceFeature;
  }

  withAudiencePainFeature(): this & AudiencePainFeature {
    this.hasAudiencePainFeature = true;
    return this as this & AudiencePainFeature;
  }

  withValuePropositionFeature(): this & ValuePropositionFeature {
    this.hasValuePropositionFeature = true;
    return this as this & ValuePropositionFeature;
  }

  withGetValuePropositionsFeature(): this & GetValuePropositionsFeature {
    this.hasGetValuePropositionsFeature = true;
    return this as this & GetValuePropositionsFeature;
  }

  withUpdateValuePropositionFeature(): this & UpdateValuePropositionFeature {
    this.hasUpdateValuePropositionFeature = true;
    return this as this & UpdateValuePropositionFeature;
  }

  withRemoveValuePropositionFeature(): this & RemoveValuePropositionFeature {
    this.hasRemoveValuePropositionFeature = true;
    return this as this & RemoveValuePropositionFeature;
  }

  withTelemetryFeature(): this & TelemetryFeature {
    this.hasTelemetryFeature = true;
    return this as this & TelemetryFeature;
  }

  withCliVersionReader(): this & CliVersionFeature {
    this.hasCliVersionReader = true;
    return this as this & CliVersionFeature;
  }

  withShowProjectFeature(): this & ShowProjectFeature {
    this.hasShowProjectFeature = true;
    return this as this & ShowProjectFeature;
  }

  withUpdateProjectFeature(): this & UpdateProjectFeature {
    this.hasUpdateProjectFeature = true;
    return this as this & UpdateProjectFeature;
  }

  withProjectStatsFeature(): this & ProjectStatsFeature {
    this.hasProjectStatsFeature = true;
    return this as this & ProjectStatsFeature;
  }

  withAddGoalFeature(): this & AddGoalFeature {
    this.hasAddGoalFeature = true;
    return this as this & AddGoalFeature;
  }

  withUpdateGoalFeature(): this & UpdateGoalFeature {
    this.hasUpdateGoalFeature = true;
    return this as this & UpdateGoalFeature;
  }

  withUpdateGoalProgressFeature(): this & UpdateGoalProgressFeature {
    this.hasUpdateGoalProgressFeature = true;
    return this as this & UpdateGoalProgressFeature;
  }

  withComponentViewFeature(): this & ComponentViewFeature {
    this.hasComponentViewFeature = true;
    return this as this & ComponentViewFeature;
  }

  withShowGoalFeature(): this & ShowGoalFeature {
    this.hasShowGoalFeature = true;
    return this as this & ShowGoalFeature;
  }

  withPostponeGoalFeature(): this & PostponeGoalFeature {
    this.hasPostponeGoalFeature = true;
    return this as this & PostponeGoalFeature;
  }

  withResetGoalFeature(): this & ResetGoalFeature {
    this.hasResetGoalFeature = true;
    return this as this & ResetGoalFeature;
  }

  withRemoveGoalFeature(): this & RemoveGoalFeature {
    this.hasRemoveGoalFeature = true;
    return this as this & RemoveGoalFeature;
  }

  withPauseGoalFeature(): this & PauseGoalFeature {
    this.hasPauseGoalFeature = true;
    return this as this & PauseGoalFeature;
  }

  withBlockGoalFeature(): this & BlockGoalFeature {
    this.hasBlockGoalFeature = true;
    return this as this & BlockGoalFeature;
  }

  withUnblockGoalFeature(): this & UnblockGoalFeature {
    this.hasUnblockGoalFeature = true;
    return this as this & UnblockGoalFeature;
  }

  withReinstateGoalFeature(): this & ReinstateGoalFeature {
    this.hasReinstateGoalFeature = true;
    return this as this & ReinstateGoalFeature;
  }

  withGetGoalsFeature(): this & GetGoalsFeature {
    this.hasGetGoalsFeature = true;
    return this as this & GetGoalsFeature;
  }

  withGoalContextReaderFeature(): this & GoalContextReaderFeature {
    this.hasGoalContextReaderFeature = true;
    return this as this & GoalContextReaderFeature;
  }

  withRefineGoalFeature(): this & RefineGoalFeature {
    this.hasRefineGoalFeature = true;
    return this as this & RefineGoalFeature;
  }

  withResumeGoalFeature(): this & ResumeGoalFeature {
    this.hasResumeGoalFeature = true;
    return this as this & ResumeGoalFeature;
  }

  withPauseWorkFeature(): this & PauseWorkFeature {
    this.hasPauseWorkFeature = true;
    return this as this & PauseWorkFeature;
  }

  withResumeWorkFeature(): this & ResumeWorkFeature {
    this.hasResumeWorkFeature = true;
    return this as this & ResumeWorkFeature;
  }

  withStartGoalFeature(): this & StartGoalFeature {
    this.hasStartGoalFeature = true;
    return this as this & StartGoalFeature;
  }

  withSessionStartFeature(): this & SessionStartFeature {
    this.hasSessionStartFeature = true;
    return this as this & SessionStartFeature;
  }

  withEndSessionFeature(): this & EndSessionFeature {
    this.hasEndSessionFeature = true;
    return this as this & EndSessionFeature;
  }

  withGetSessionsFeature(): this & GetSessionsFeature {
    this.hasGetSessionsFeature = true;
    return this as this & GetSessionsFeature;
  }

  withCommitGoalFeature(): this & CommitGoalFeature {
    this.hasCommitGoalFeature = true;
    return this as this & CommitGoalFeature;
  }

  withSubmitGoalFeature(): this & SubmitGoalFeature {
    this.hasSubmitGoalFeature = true;
    return this as this & SubmitGoalFeature;
  }

  withCodifyGoalFeature(): this & CodifyGoalFeature {
    this.hasCodifyGoalFeature = true;
    return this as this & CodifyGoalFeature;
  }

  withCloseGoalFeature(): this & CloseGoalFeature {
    this.hasCloseGoalFeature = true;
    return this as this & CloseGoalFeature;
  }

  withReviewGoalFeature(): this & ReviewGoalFeature {
    this.hasReviewGoalFeature = true;
    return this as this & ReviewGoalFeature;
  }

  withRejectGoalFeature(): this & RejectGoalFeature {
    this.hasRejectGoalFeature = true;
    return this as this & RejectGoalFeature;
  }

  withQualifyGoalFeature(): this & QualifyGoalFeature {
    this.hasQualifyGoalFeature = true;
    return this as this & QualifyGoalFeature;
  }

  withGuidelineViewFeature(): this & GuidelineViewFeature {
    this.hasGuidelineViewFeature = true;
    return this as this & GuidelineViewFeature;
  }

  withAddGuidelineFeature(): this & AddGuidelineFeature {
    this.hasAddGuidelineFeature = true;
    return this as this & AddGuidelineFeature;
  }

  withUpdateGuidelineFeature(): this & UpdateGuidelineFeature {
    this.hasUpdateGuidelineFeature = true;
    return this as this & UpdateGuidelineFeature;
  }

  withRemoveGuidelineFeature(): this & RemoveGuidelineFeature {
    this.hasRemoveGuidelineFeature = true;
    return this as this & RemoveGuidelineFeature;
  }

  withShowGuidelineFeature(): this & ShowGuidelineFeature {
    this.hasShowGuidelineFeature = true;
    return this as this & ShowGuidelineFeature;
  }

  withGetGuidelinesFeature(): this & GetGuidelinesFeature {
    this.hasGetGuidelinesFeature = true;
    return this as this & GetGuidelinesFeature;
  }

  withSearchGuidelinesFeature(): this & SearchGuidelinesFeature {
    this.hasSearchGuidelinesFeature = true;
    return this as this & SearchGuidelinesFeature;
  }

  withInvariantViewFeature(): this & InvariantViewFeature {
    this.hasInvariantViewFeature = true;
    return this as this & InvariantViewFeature;
  }

  withAddInvariantFeature(): this & AddInvariantFeature {
    this.hasAddInvariantFeature = true;
    return this as this & AddInvariantFeature;
  }

  withUpdateInvariantFeature(): this & UpdateInvariantFeature {
    this.hasUpdateInvariantFeature = true;
    return this as this & UpdateInvariantFeature;
  }

  withRemoveInvariantFeature(): this & RemoveInvariantFeature {
    this.hasRemoveInvariantFeature = true;
    return this as this & RemoveInvariantFeature;
  }

  withGetInvariantsFeature(): this & GetInvariantsFeature {
    this.hasGetInvariantsFeature = true;
    return this as this & GetInvariantsFeature;
  }

  withSearchInvariantsFeature(): this & SearchInvariantsFeature {
    this.hasSearchInvariantsFeature = true;
    return this as this & SearchInvariantsFeature;
  }

  withDecisionViewFeature(): this & DecisionViewFeature {
    this.hasDecisionViewFeature = true;
    return this as this & DecisionViewFeature;
  }

  withEvolveFeature(): this & EvolveFeature {
    this.hasEvolveFeature = true;
    return this as this & EvolveFeature;
  }

  withSearchFeature(): this & SearchFeature {
    this.hasSearchFeature = true;
    return this as this & SearchFeature;
  }

  withSearchIndexRebuildFeature(): this & SearchIndexRebuildFeature {
    this.hasSearchIndexRebuildFeature = true;
    return this as this & SearchIndexRebuildFeature;
  }

  withRebuildDatabaseFeature(): this & RebuildDatabaseFeature {
    this.hasRebuildDatabaseFeature = true;
    return this as this & RebuildDatabaseFeature;
  }

  withAddRelationFeature(): this & AddRelationFeature {
    this.hasAddRelationFeature = true;
    return this as this & AddRelationFeature;
  }

  withRemoveRelationFeature(): this & RemoveRelationFeature {
    this.hasRemoveRelationFeature = true;
    return this as this & RemoveRelationFeature;
  }

  withGetRelationsFeature(): this & GetRelationsFeature {
    this.hasGetRelationsFeature = true;
    return this as this & GetRelationsFeature;
  }

  withAuditRelationsFeature(): this & AuditRelationsFeature {
    this.hasAuditRelationsFeature = true;
    return this as this & AuditRelationsFeature;
  }

  withFindRelationPathFeature(): this & FindRelationPathFeature {
    this.hasFindRelationPathFeature = true;
    return this as this & FindRelationPathFeature;
  }

  withTraverseRelationsFeature(): this & TraverseRelationsFeature {
    this.hasTraverseRelationsFeature = true;
    return this as this & TraverseRelationsFeature;
  }

  withViewWorkerFeature(): this & ViewWorkerFeature {
    this.hasViewWorkerFeature = true;
    return this as this & ViewWorkerFeature;
  }

  withDefineArchitectureFeature(): this & DefineArchitectureFeature {
    this.hasDefineArchitectureFeature = true;
    return this as this & DefineArchitectureFeature;
  }

  withUpdateArchitectureFeature(): this & UpdateArchitectureFeature {
    this.hasUpdateArchitectureFeature = true;
    return this as this & UpdateArchitectureFeature;
  }

  withGetArchitectureFeature(): this & GetArchitectureFeature {
    this.hasGetArchitectureFeature = true;
    return this as this & GetArchitectureFeature;
  }

  withUpdateAudiencePainFeature(): this & UpdateAudiencePainFeature {
    this.hasUpdateAudiencePainFeature = true;
    return this as this & UpdateAudiencePainFeature;
  }

  withGetAudiencePainsFeature(): this & GetAudiencePainsFeature {
    this.hasGetAudiencePainsFeature = true;
    return this as this & GetAudiencePainsFeature;
  }

  withListAudiencesFeature(): this & ListAudiencesFeature {
    this.hasListAudiencesFeature = true;
    return this as this & ListAudiencesFeature;
  }

  withRemoveAudienceFeature(): this & RemoveAudienceFeature {
    this.hasRemoveAudienceFeature = true;
    return this as this & RemoveAudienceFeature;
  }

  withUpdateAudienceFeature(): this & UpdateAudienceFeature {
    this.hasUpdateAudienceFeature = true;
    return this as this & UpdateAudienceFeature;
  }

  withAddComponentFeature(): this & AddComponentFeature {
    this.hasAddComponentFeature = true;
    return this as this & AddComponentFeature;
  }

  withGetComponentsFeature(): this & GetComponentsFeature {
    this.hasGetComponentsFeature = true;
    return this as this & GetComponentsFeature;
  }

  withSearchComponentsFeature(): this & SearchComponentsFeature {
    this.hasSearchComponentsFeature = true;
    return this as this & SearchComponentsFeature;
  }

  withUpdateComponentFeature(): this & UpdateComponentFeature {
    this.hasUpdateComponentFeature = true;
    return this as this & UpdateComponentFeature;
  }

  withRenameComponentFeature(): this & RenameComponentFeature {
    this.hasRenameComponentFeature = true;
    return this as this & RenameComponentFeature;
  }

  withShowComponentFeature(): this & ShowComponentFeature {
    this.hasShowComponentFeature = true;
    return this as this & ShowComponentFeature;
  }

  withDeprecateComponentFeature(): this & DeprecateComponentFeature {
    this.hasDeprecateComponentFeature = true;
    return this as this & DeprecateComponentFeature;
  }

  withUndeprecateComponentFeature(): this & UndeprecateComponentFeature {
    this.hasUndeprecateComponentFeature = true;
    return this as this & UndeprecateComponentFeature;
  }

  withRemoveComponentFeature(): this & RemoveComponentFeature {
    this.hasRemoveComponentFeature = true;
    return this as this & RemoveComponentFeature;
  }

  withAddDecisionFeature(): this & AddDecisionFeature {
    this.hasAddDecisionFeature = true;
    return this as this & AddDecisionFeature;
  }

  withGetDecisionsFeature(): this & GetDecisionsFeature {
    this.hasGetDecisionsFeature = true;
    return this as this & GetDecisionsFeature;
  }

  withShowDecisionFeature(): this & ShowDecisionFeature {
    this.hasShowDecisionFeature = true;
    return this as this & ShowDecisionFeature;
  }

  withSearchDecisionsFeature(): this & SearchDecisionsFeature {
    this.hasSearchDecisionsFeature = true;
    return this as this & SearchDecisionsFeature;
  }

  withReverseDecisionFeature(): this & ReverseDecisionFeature {
    this.hasReverseDecisionFeature = true;
    return this as this & ReverseDecisionFeature;
  }

  withRemoveDecisionFeature(): this & RemoveDecisionFeature {
    this.hasRemoveDecisionFeature = true;
    return this as this & RemoveDecisionFeature;
  }

  withRestoreDecisionFeature(): this & RestoreDecisionFeature {
    this.hasRestoreDecisionFeature = true;
    return this as this & RestoreDecisionFeature;
  }

  withSupersedeDecisionFeature(): this & SupersedeDecisionFeature {
    this.hasSupersedeDecisionFeature = true;
    return this as this & SupersedeDecisionFeature;
  }

  withUpdateDecisionFeature(): this & UpdateDecisionFeature {
    this.hasUpdateDecisionFeature = true;
    return this as this & UpdateDecisionFeature;
  }

  withDependencyViewFeature(): this & DependencyViewFeature {
    this.hasDependencyViewFeature = true;
    return this as this & DependencyViewFeature;
  }

  withAddDependencyFeature(): this & AddDependencyFeature {
    this.hasAddDependencyFeature = true;
    return this as this & AddDependencyFeature;
  }

  withGetDependenciesFeature(): this & GetDependenciesFeature {
    this.hasGetDependenciesFeature = true;
    return this as this & GetDependenciesFeature;
  }

  withUpdateDependencyFeature(): this & UpdateDependencyFeature {
    this.hasUpdateDependencyFeature = true;
    return this as this & UpdateDependencyFeature;
  }

  withRemoveDependencyFeature(): this & RemoveDependencyFeature {
    this.hasRemoveDependencyFeature = true;
    return this as this & RemoveDependencyFeature;
  }

  withSearchDependenciesFeature(): this & SearchDependenciesFeature {
    this.hasSearchDependenciesFeature = true;
    return this as this & SearchDependenciesFeature;
  }

  withTelemetryClientFeature(): this & TelemetryClientFeature {
    this.hasTelemetryClientFeature = true;
    return this as this & TelemetryClientFeature;
  }

  withGoalStatusReaderFeature(): this & GoalStatusReaderFeature {
    this.hasGoalStatusReaderFeature = true;
    return this as this & GoalStatusReaderFeature;
  }

  withGoalClaimPolicyFeature(): this & GoalClaimPolicyFeature {
    this.hasGoalClaimPolicyFeature = true;
    return this as this & GoalClaimPolicyFeature;
  }

  withWorkerIdentityReaderFeature(): this & WorkerIdentityReaderFeature {
    this.hasWorkerIdentityReaderFeature = true;
    return this as this & WorkerIdentityReaderFeature;
  }

  withGoalCodifyingStartedProjectorFeature(): this & GoalCodifyingStartedProjectorFeature {
    this.hasGoalCodifyingStartedProjectorFeature = true;
    return this as this & GoalCodifyingStartedProjectorFeature;
  }

  withGoalRefinedProjectorFeature(): this & GoalRefinedProjectorFeature {
    this.hasGoalRefinedProjectorFeature = true;
    return this as this & GoalRefinedProjectorFeature;
  }

  withSettingsReaderFeature(): this & SettingsReaderFeature {
    this.hasSettingsReaderFeature = true;
    return this as this & SettingsReaderFeature;
  }

  withCliUpdateFeature(): this & CliUpdateFeature {
    this.hasCliUpdateFeature = true;
    return this as this & CliUpdateFeature;
  }

  withProjectContextReaderFeature(): this & ProjectContextReaderFeature {
    this.hasProjectContextReaderFeature = true;
    return this as this & ProjectContextReaderFeature;
  }

  /** Releases every resource this composition created, in reverse acquisition order. */
  async dispose(): Promise<void> {
    while (this.cleanups.length > 0) {
      const cleanup = this.cleanups.pop();
      if (!cleanup) continue;
      try {
        await cleanup();
      } catch {
        // Release the remaining resources even when one cleanup fails.
      }
    }
    this.boot = undefined;
    this.core = undefined;
  }

  async buildBoot(): Promise<BootContainer> {
    const boot = this.bootInfra();
    return { logger: boot.logger, projectDataDir: boot.projectDataDir };
  }

  async build(): Promise<this & LeafContainer> {
    if (this.useRemoteData) {
      throw new Error(
        "Remote data composition is not implemented yet. Remote gateways arrive in a later migration phase.",
      );
    }

    const core = this.coreInfra();

    const container: LeafContainer = {
      projectDataDir: core.projectDataDir,
      logger: core.logger,
      eventBus: core.eventBus,
    };

    if (this.hasProjectInitFeature) {
      Object.assign(container, this.buildProjectInitFeature());
    }
    if (this.hasAudienceFeature) {
      Object.assign(container, this.buildAudienceFeature());
    }
    if (this.hasAudiencePainFeature) {
      Object.assign(container, this.buildAudiencePainFeature());
    }
    if (this.hasValuePropositionFeature) {
      Object.assign(container, this.buildValuePropositionFeature());
    }
    if (this.hasGetValuePropositionsFeature) {
      Object.assign(container, this.buildGetValuePropositionsFeature());
    }
    if (this.hasUpdateValuePropositionFeature) {
      Object.assign(container, this.buildUpdateValuePropositionFeature());
    }
    if (this.hasRemoveValuePropositionFeature) {
      Object.assign(container, this.buildRemoveValuePropositionFeature());
    }
    if (this.hasTelemetryFeature) {
      Object.assign(container, this.buildTelemetryFeature());
    }
    if (this.hasShowProjectFeature) {
      Object.assign(container, this.buildShowProjectFeature());
    }
    if (this.hasUpdateProjectFeature) {
      Object.assign(container, this.buildUpdateProjectFeature());
    }
    if (this.hasProjectStatsFeature) {
      Object.assign(container, this.buildProjectStatsFeature());
    }
    if (this.hasAddGoalFeature) {
      Object.assign(container, this.buildAddGoalFeature());
    }
    if (this.hasUpdateGoalFeature) {
      Object.assign(container, this.buildUpdateGoalFeature());
    }
    if (this.hasShowGoalFeature) {
      Object.assign(container, this.buildShowGoalFeature());
    }

    if (this.hasPostponeGoalFeature) {
      Object.assign(container, this.buildPostponeGoalFeature());
    }

    if (this.hasResetGoalFeature) {
      Object.assign(container, await this.buildResetGoalFeature());
    }

    if (this.hasRemoveGoalFeature) {
      Object.assign(container, this.buildRemoveGoalFeature());
    }

    if (this.hasPauseGoalFeature) {
      Object.assign(container, this.buildPauseGoalFeature());
    }

    if (this.hasBlockGoalFeature) {
      Object.assign(container, this.buildBlockGoalFeature());
    }
    if (this.hasUnblockGoalFeature) {
      Object.assign(container, this.buildUnblockGoalFeature());
    }
    if (this.hasReinstateGoalFeature) {
      Object.assign(container, this.buildReinstateGoalFeature());
    }
    if (this.hasGetGoalsFeature) {
      Object.assign(container, this.buildGetGoalsFeature());
    }
    if (this.hasUpdateGoalProgressFeature) {
      Object.assign(container, this.buildUpdateGoalProgressFeature());
    }
    if (this.hasComponentViewFeature) {
      Object.assign(container, this.buildComponentViewFeature());
    }
    if (this.hasGoalContextReaderFeature) {
      Object.assign(container, this.buildGoalContextReaderFeature());
    }
    if (this.hasRefineGoalFeature) {
      Object.assign(container, await this.buildRefineGoalFeature());
    }
    if (this.hasStartGoalFeature) {
      Object.assign(container, await this.buildStartGoalFeature());
    }
    if (this.hasSessionStartFeature) {
      Object.assign(container, await this.buildSessionStartFeature());
    }
    if (this.hasEndSessionFeature) {
      Object.assign(container, await this.buildEndSessionFeature());
    }
    if (this.hasGetSessionsFeature) {
      Object.assign(container, this.buildGetSessionsFeature());
    }
    if (this.hasResumeGoalFeature) {
      Object.assign(container, await this.buildResumeGoalFeature());
    }
    if (this.hasPauseWorkFeature) {
      Object.assign(container, await this.buildPauseWorkFeature());
    }
    if (this.hasResumeWorkFeature) {
      Object.assign(container, await this.buildResumeWorkFeature());
    }
    if (this.hasCommitGoalFeature) {
      Object.assign(container, await this.buildCommitGoalFeature());
    }
    if (this.hasSubmitGoalFeature) {
      Object.assign(container, await this.buildSubmitGoalFeature());
    }
    if (this.hasCodifyGoalFeature) {
      Object.assign(container, await this.buildCodifyGoalFeature());
    }
    if (this.hasCloseGoalFeature) {
      Object.assign(container, await this.buildCloseGoalFeature());
    }
    if (this.hasReviewGoalFeature) {
      Object.assign(container, await this.buildReviewGoalFeature());
    }
    if (this.hasRejectGoalFeature) {
      Object.assign(container, await this.buildRejectGoalFeature());
    }
    if (this.hasQualifyGoalFeature) {
      Object.assign(container, await this.buildQualifyGoalFeature());
    }
    if (this.hasGuidelineViewFeature) {
      Object.assign(container, this.buildGuidelineViewFeature());
    }
    if (this.hasAddGuidelineFeature) {
      Object.assign(container, this.buildAddGuidelineFeature());
    }
    if (this.hasUpdateGuidelineFeature) {
      Object.assign(container, this.buildUpdateGuidelineFeature());
    }
    if (this.hasRemoveGuidelineFeature) {
      Object.assign(container, this.buildRemoveGuidelineFeature());
    }
    if (this.hasShowGuidelineFeature) {
      Object.assign(container, this.buildShowGuidelineFeature());
    }
    if (this.hasGetGuidelinesFeature) {
      Object.assign(container, this.buildGetGuidelinesFeature());
    }
    if (this.hasSearchGuidelinesFeature) {
      Object.assign(container, this.buildSearchGuidelinesFeature());
    }
    if (this.hasAddInvariantFeature) {
      Object.assign(container, this.buildAddInvariantFeature());
    }
    if (this.hasUpdateInvariantFeature) {
      Object.assign(container, this.buildUpdateInvariantFeature());
    }
    if (this.hasRemoveInvariantFeature) {
      Object.assign(container, this.buildRemoveInvariantFeature());
    }
    if (this.hasGetInvariantsFeature) {
      Object.assign(container, this.buildGetInvariantsFeature());
    }
    if (this.hasSearchInvariantsFeature) {
      Object.assign(container, this.buildSearchInvariantsFeature());
    }
    if (this.hasInvariantViewFeature) {
      Object.assign(container, this.buildInvariantViewFeature());
    }
    if (this.hasDecisionViewFeature) {
      Object.assign(container, this.buildDecisionViewFeature());
    }
    if (this.hasAddRelationFeature) {
      Object.assign(container, this.buildAddRelationFeature());
    }
    if (this.hasRemoveRelationFeature) {
      Object.assign(container, this.buildRemoveRelationFeature());
    }
    if (this.hasGetRelationsFeature) {
      Object.assign(container, this.buildGetRelationsFeature());
    }
    if (this.hasAuditRelationsFeature) {
      Object.assign(container, this.buildAuditRelationsFeature());
    }
    if (this.hasFindRelationPathFeature) {
      Object.assign(container, this.buildFindRelationPathFeature());
    }
    if (this.hasTraverseRelationsFeature) {
      Object.assign(container, this.buildTraverseRelationsFeature());
    }
    if (this.hasEvolveFeature) {
      Object.assign(container, this.buildEvolveFeature());
    }
    if (this.hasSearchIndexRebuildFeature) {
      Object.assign(container, this.buildSearchIndexRebuildFeature());
    }
    if (this.hasSearchFeature) {
      Object.assign(container, this.buildSearchFeature());
    }
    if (this.hasRebuildDatabaseFeature) {
      Object.assign(container, this.buildRebuildDatabaseFeature());
    }
    if (this.hasViewWorkerFeature) {
      Object.assign(container, await this.buildViewWorkerFeature());
    }
    if (this.hasDefineArchitectureFeature) {
      Object.assign(container, this.buildDefineArchitectureFeature());
    }
    if (this.hasUpdateArchitectureFeature) {
      Object.assign(container, this.buildUpdateArchitectureFeature());
    }
    if (this.hasGetArchitectureFeature) {
      Object.assign(container, this.buildGetArchitectureFeature());
    }
    if (this.hasUpdateAudiencePainFeature) {
      Object.assign(container, this.buildUpdateAudiencePainFeature());
    }
    if (this.hasGetAudiencePainsFeature) {
      Object.assign(container, this.buildGetAudiencePainsFeature());
    }
    if (this.hasListAudiencesFeature) {
      Object.assign(container, this.buildListAudiencesFeature());
    }
    if (this.hasRemoveAudienceFeature) {
      Object.assign(container, this.buildRemoveAudienceFeature());
    }
    if (this.hasUpdateAudienceFeature) {
      Object.assign(container, this.buildUpdateAudienceFeature());
    }
    if (this.hasAddComponentFeature) {
      Object.assign(container, this.buildAddComponentFeature());
    }
    if (this.hasGetComponentsFeature) {
      Object.assign(container, this.buildGetComponentsFeature());
    }
    if (this.hasSearchComponentsFeature) {
      Object.assign(container, this.buildSearchComponentsFeature());
    }
    if (this.hasUpdateComponentFeature) {
      Object.assign(container, this.buildUpdateComponentFeature());
    }
    if (this.hasRenameComponentFeature) {
      Object.assign(container, this.buildRenameComponentFeature());
    }
    if (this.hasShowComponentFeature) {
      Object.assign(container, this.buildShowComponentFeature());
    }
    if (this.hasDeprecateComponentFeature) {
      Object.assign(container, this.buildDeprecateComponentFeature());
    }
    if (this.hasUndeprecateComponentFeature) {
      Object.assign(container, this.buildUndeprecateComponentFeature());
    }
    if (this.hasRemoveComponentFeature) {
      Object.assign(container, this.buildRemoveComponentFeature());
    }
    if (this.hasAddDecisionFeature) {
      Object.assign(container, this.buildAddDecisionFeature());
    }
    if (this.hasGetDecisionsFeature) {
      Object.assign(container, this.buildGetDecisionsFeature());
    }
    if (this.hasShowDecisionFeature) {
      Object.assign(container, this.buildShowDecisionFeature());
    }
    if (this.hasSearchDecisionsFeature) {
      Object.assign(container, this.buildSearchDecisionsFeature());
    }
    if (this.hasReverseDecisionFeature) {
      Object.assign(container, this.buildReverseDecisionFeature());
    }
    if (this.hasRemoveDecisionFeature) {
      Object.assign(container, this.buildRemoveDecisionFeature());
    }
    if (this.hasRestoreDecisionFeature) {
      Object.assign(container, this.buildRestoreDecisionFeature());
    }
    if (this.hasSupersedeDecisionFeature) {
      Object.assign(container, this.buildSupersedeDecisionFeature());
    }
    if (this.hasUpdateDecisionFeature) {
      Object.assign(container, this.buildUpdateDecisionFeature());
    }
    if (this.hasDependencyViewFeature) {
      Object.assign(container, this.buildDependencyViewFeature());
    }
    if (this.hasAddDependencyFeature) {
      Object.assign(container, this.buildAddDependencyFeature());
    }
    if (this.hasGetDependenciesFeature) {
      Object.assign(container, this.buildGetDependenciesFeature());
    }
    if (this.hasUpdateDependencyFeature) {
      Object.assign(container, this.buildUpdateDependencyFeature());
    }
    if (this.hasRemoveDependencyFeature) {
      Object.assign(container, this.buildRemoveDependencyFeature());
    }
    if (this.hasSearchDependenciesFeature) {
      Object.assign(container, this.buildSearchDependenciesFeature());
    }
    if (this.hasCliVersionReader) {
      container.cliVersionReader = new CliVersionReader();
    }
    if (this.hasTelemetryClientFeature) {
      Object.assign(container, await this.buildTelemetryClientFeature());
    }
    if (this.hasGoalStatusReaderFeature) {
      Object.assign(container, this.buildGoalStatusReaderFeature());
    }
    if (this.hasGoalClaimPolicyFeature) {
      Object.assign(container, this.buildGoalClaimPolicyFeature());
    }
    if (this.hasWorkerIdentityReaderFeature) {
      Object.assign(container, await this.buildWorkerIdentityReaderFeature());
    }
    if (this.hasGoalCodifyingStartedProjectorFeature) {
      Object.assign(container, this.buildGoalCodifyingStartedProjectorFeature());
    }
    if (this.hasGoalRefinedProjectorFeature) {
      Object.assign(container, this.buildGoalRefinedProjectorFeature());
    }
    if (this.hasSettingsReaderFeature) {
      Object.assign(container, this.buildSettingsReaderFeature());
    }
    if (this.hasCliUpdateFeature) {
      Object.assign(container, this.buildCliUpdateFeature());
    }
    if (this.hasProjectContextReaderFeature) {
      Object.assign(container, this.buildProjectContextReaderFeature());
    }

    return container as this & LeafContainer;
  }

  async requireProject(): Promise<this & LeafContainer> {
    const boot = this.bootInfra();
    if (!isProjectInitialized(boot.projectDataDir)) {
      throw new ProjectNotInitializedError(CachedContextProject.get().path);
    }
    return this.build();
  }

  private async buildTelemetryClientFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const telemetryEnvironmentReader = new ProcessTelemetryEnvironmentReader();
    const telemetryConsentStatusResolver = new TelemetryConsentStatusResolver();

    const telemetryClient = await this.resolveTelemetryClient(
      core.settingsReader,
      telemetryEnvironmentReader,
      telemetryConsentStatusResolver,
    );
    this.builtTelemetryClient = telemetryClient;
    this.cleanups.push(() => telemetryClient.shutdown());

    return { telemetryClient };
  }

  private async resolveTelemetryClient(
    settingsReader: FsSettingsReader,
    telemetryEnvironmentReader: ProcessTelemetryEnvironmentReader,
    telemetryConsentStatusResolver: TelemetryConsentStatusResolver,
  ): Promise<ITelemetryClient> {
    const settings = await settingsReader.read();
    const telemetryConfigured =
      await settingsReader.hasTelemetryConfiguration();
    const telemetryStatus = telemetryConsentStatusResolver.resolve(
      settings,
      telemetryConfigured,
      {
        ciDetected: telemetryEnvironmentReader.isCiEnvironment(),
        environmentDisabled:
          telemetryEnvironmentReader.isTelemetryDisabledByEnvironment(),
      },
    );
    return telemetryStatus.effectiveEnabled && telemetryStatus.anonymousId !== null
      ? new PostHogTelemetryClient(telemetryStatus.anonymousId)
      : new NoOpTelemetryClient();
  }

  private buildGoalStatusReaderFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    return {
      goalStatusReader: new SqliteGoalStatusReader(core.db),
    };
  }

  private buildGoalClaimPolicyFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    return {
      goalClaimPolicy: new GoalClaimPolicy(
        new SqliteGoalClaimStore(core.db),
        new SystemClock(),
      ),
    };
  }

  private async buildWorkerIdentityReaderFeature(): Promise<Partial<LeafContainer>> {
    return {
      workerIdentityReader: await this.buildWorkerIdentityRegistry(),
    };
  }

  private buildGoalCodifyingStartedProjectorFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    return {
      goalCodifyingStartedProjector: new SqliteGoalCodifyingStartedProjector(
        core.db,
      ),
    };
  }

  private buildGoalRefinedProjectorFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    return {
      goalRefinedProjector: new SqliteGoalRefinedProjector(core.db),
    };
  }

  private buildSettingsReaderFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    return {
      settingsReader: core.settingsReader,
    };
  }

  private buildCliUpdateFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();
    const telemetryClient = this.requireTelemetryClient();

    return {
      cliUpdateController: new CliUpdateController(
        new NpmPackageVersionGateway(telemetryClient, core.logger),
        new NpmPackageUpgradeGateway(
          process.argv[1] ?? "",
          telemetryClient,
          core.logger,
        ),
        telemetryClient,
        core.logger,
      ),
    };
  }

  private requireTelemetryClient(): ITelemetryClient {
    if (!this.hasTelemetryClientFeature || !this.builtTelemetryClient) {
      throw new Error(
        "The CLI update feature requires the telemetry client feature; call withTelemetryClientFeature() before withCliUpdateFeature().",
      );
    }
    return this.builtTelemetryClient;
  }

  private buildProjectContextReaderFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    return {
      projectContextReader: new SqliteProjectContextReader(core.db),
    };
  }

  private bootInfra(): BootInfrastructure {
    if (this.boot) {
      return this.boot;
    }

    const projectDataDir = CachedContextProject.get().dataPath;
    const logger = new FileLogger(
      path.join(projectDataDir, "logs"),
      LogLevel.DEBUG,
    );
    this.cleanups.push(() => logger.close());
    this.boot = { projectDataDir, logger };
    return this.boot;
  }

  private coreInfra(): CoreInfrastructure {
    if (this.core) {
      return this.core;
    }

    const boot = this.bootInfra();
    const database = new LocalProjectDatabase(boot.projectDataDir);
    const db = database.connection;
    const eventBus = new ProjectionBusFactory().create(db);
    this.cleanups.push(() => database.dispose());
    this.core = {
      projectDataDir: boot.projectDataDir,
      logger: boot.logger,
      db,
      eventBus,
      settingsReader: new FsSettingsReader(boot.projectDataDir),
    };
    return this.core;
  }

  private buildProjectInitFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const projectInitializedEventStore = new FsProjectInitializedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const projectInitializedProjector =
      new SqliteProjectInitializedProjector(core.db);
    const agentFileProtocol = new AgentFileProtocol();
    const gitignoreProtocol = new FsGitignoreProtocol();
    const settingsInitializer = new FsSettingsInitializer(core.projectDataDir);
    const projectIdentityResolver = new ProjectIdentityResolver(
      core.settingsReader,
    );

    const initializeProjectCommandHandler =
      new InitializeProjectCommandHandler(
        projectInitializedEventStore,
        core.eventBus,
        projectInitializedProjector,
        agentFileProtocol,
        settingsInitializer,
        gitignoreProtocol,
        projectIdentityResolver,
      );

    const localPlanProjectInitGateway = new LocalPlanProjectInitGateway(
      agentFileProtocol,
      settingsInitializer,
      gitignoreProtocol,
    );

    const localInitializeProjectGateway = new LocalInitializeProjectGateway(
      initializeProjectCommandHandler,
      localPlanProjectInitGateway,
      agentFileProtocol,
    );

    return {
      planProjectInitController: new PlanProjectInitController(
        localPlanProjectInitGateway,
      ),
      initializeProjectController: new InitializeProjectController(
        localInitializeProjectGateway,
      ),
    };
  }

  private buildAudienceFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const audienceAddedEventStore = new FsAudienceAddedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const addAudienceCommandHandler = new AddAudienceCommandHandler(
      audienceAddedEventStore,
      core.eventBus,
    );
    const addAudienceGateway = new LocalAddAudienceGateway(
      addAudienceCommandHandler,
    );

    return {
      addAudienceController: new AddAudienceController(addAudienceGateway),
    };
  }

  private buildAudiencePainFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const audiencePainAddedEventStore = new FsAudiencePainAddedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const audiencePainAddedProjector =
      new SqliteAudiencePainAddedProjector(core.db);
    const audiencePainUpdatedProjector =
      new SqliteAudiencePainUpdatedProjector(core.db);

    const addAudiencePainCommandHandler = new AddAudiencePainCommandHandler(
      audiencePainAddedEventStore,
      core.eventBus,
    );
    const addAudiencePainGateway = new LocalAddAudiencePainGateway(
      addAudiencePainCommandHandler,
      audiencePainUpdatedProjector,
    );

    return {
      addAudiencePainController: new AddAudiencePainController(
        addAudiencePainGateway,
      ),
    };
  }

  private buildValuePropositionFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const valuePropositionAddedEventStore =
      new FsValuePropositionAddedEventStore(
        core.projectDataDir,
        core.logger,
      );
    const valuePropositionAddedProjector =
      new SqliteValuePropositionAddedProjector(core.db);
    const valuePropositionUpdatedProjector =
      new SqliteValuePropositionUpdatedProjector(core.db);

    const addValuePropositionCommandHandler =
      new AddValuePropositionCommandHandler(
        valuePropositionAddedEventStore,
        core.eventBus,
      );
    const addValuePropositionGateway = new LocalAddValuePropositionGateway(
      addValuePropositionCommandHandler,
      valuePropositionUpdatedProjector,
    );

    return {
      addValuePropositionController: new AddValuePropositionController(
        addValuePropositionGateway,
      ),
    };
  }

  private buildGetValuePropositionsFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const valuePropositionContextReader =
      new SqliteValuePropositionContextReader(core.db);
    const getValuePropositionsGateway = new LocalGetValuePropositionsGateway(
      valuePropositionContextReader,
    );

    return {
      getValuePropositionsController: new GetValuePropositionsController(
        getValuePropositionsGateway,
      ),
    };
  }

  private buildUpdateValuePropositionFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const valuePropositionUpdatedEventStore =
      new FsValuePropositionUpdatedEventStore(
        core.projectDataDir,
        core.logger,
      );
    const valuePropositionUpdatedProjector =
      new SqliteValuePropositionUpdatedProjector(core.db);

    const updateValuePropositionCommandHandler =
      new UpdateValuePropositionCommandHandler(
        valuePropositionUpdatedEventStore,
        core.eventBus,
        valuePropositionUpdatedProjector,
      );
    const updateValuePropositionGateway =
      new LocalUpdateValuePropositionGateway(
        updateValuePropositionCommandHandler,
        valuePropositionUpdatedProjector,
      );

    return {
      updateValuePropositionController: new UpdateValuePropositionController(
        updateValuePropositionGateway,
      ),
    };
  }

  private buildRemoveValuePropositionFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const valuePropositionRemovedEventStore =
      new FsValuePropositionRemovedEventStore(
        core.projectDataDir,
        core.logger,
      );
    const valuePropositionRemovedProjector =
      new SqliteValuePropositionRemovedProjector(core.db);

    const removeValuePropositionCommandHandler =
      new RemoveValuePropositionCommandHandler(
        valuePropositionRemovedEventStore,
        core.eventBus,
        valuePropositionRemovedProjector,
      );
    const removeValuePropositionGateway =
      new LocalRemoveValuePropositionGateway(
        removeValuePropositionCommandHandler,
        valuePropositionRemovedProjector,
      );

    return {
      removeValuePropositionController: new RemoveValuePropositionController(
        removeValuePropositionGateway,
      ),
    };
  }

  private buildUpdateProjectFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const projectUpdatedEventStore = new FsProjectUpdatedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const projectUpdatedProjector = new SqliteProjectUpdatedProjector(core.db);
    const projectIdentityResolver = new ProjectIdentityResolver(
      core.settingsReader,
    );

    const updateProjectCommandHandler = new UpdateProjectCommandHandler(
      projectUpdatedEventStore,
      core.eventBus,
      projectUpdatedProjector,
      projectIdentityResolver,
    );

    const updateProjectGateway = new LocalUpdateProjectGateway(
      updateProjectCommandHandler,
      projectUpdatedProjector,
    );

    return {
      updateProjectController: new UpdateProjectController(updateProjectGateway),
    };
  }

  private buildShowProjectFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const projectContextReader = new SqliteProjectContextReader(core.db);
    const audienceContextReader = new SqliteAudienceContextReader(core.db);
    const audiencePainContextReader = new SqliteAudiencePainContextReader(
      core.db,
    );
    const valuePropositionContextReader =
      new SqliteValuePropositionContextReader(core.db);

    const showProjectGateway = new LocalShowProjectGateway(
      projectContextReader,
      audienceContextReader,
      audiencePainContextReader,
      valuePropositionContextReader,
    );

    return {
      showProjectController: new ShowProjectController(showProjectGateway),
    };
  }

  private buildProjectStatsFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const projectStatsQuery = new SqliteProjectStatsQuery(core.db);
    const projectStatsQueryHandler = new GetProjectStatsQueryHandler(
      projectStatsQuery,
    );
    const projectStatsGateway = new LocalProjectStatsGateway(
      projectStatsQueryHandler,
    );

    return {
      projectStatsController: new ProjectStatsController(projectStatsGateway),
    };
  }

  private buildAddGoalFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const goalAddedEventStore = new FsGoalAddedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const goalUpdatedEventStore = new FsGoalUpdatedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const goalUpdatedProjector = new SqliteGoalUpdatedProjector(core.db);

    const addGoalCommandHandler = new AddGoalCommandHandler(
      goalAddedEventStore,
      core.eventBus,
      goalUpdatedEventStore,
      goalUpdatedEventStore,
      goalUpdatedProjector,
    );
    const addGoalGateway = new LocalAddGoalGateway(addGoalCommandHandler);

    return {
      addGoalController: new AddGoalController(addGoalGateway),
    };
  }

  private buildUpdateGoalFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const goalUpdatedEventStore = new FsGoalUpdatedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const goalUpdatedProjector = new SqliteGoalUpdatedProjector(core.db);

    const updateGoalCommandHandler = new UpdateGoalCommandHandler(
      goalUpdatedEventStore,
      goalUpdatedEventStore,
      goalUpdatedProjector,
      core.eventBus,
    );
    const updateGoalGateway = new LocalUpdateGoalGateway(
      updateGoalCommandHandler,
    );

    return {
      updateGoalController: new UpdateGoalController(updateGoalGateway),
    };
  }

  private buildShowGoalFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const goalReader = new SqliteGoalStartedProjector(core.db);
    const relationReader = new SqliteRelationRemovedProjector(core.db);
    const componentViewReader = new SqliteComponentViewReader(core.db);
    const dependencyViewReader = new SqliteDependencyViewReader(core.db);
    const decisionViewReader = new SqliteDecisionViewReader(core.db);
    const invariantViewReader = new SqliteInvariantViewReader(core.db);
    const guidelineViewReader = new SqliteGuidelineViewReader(core.db);

    const goalContextAssembler = new SqliteGoalContextAssembler(
      goalReader,
      relationReader,
      componentViewReader,
      dependencyViewReader,
      decisionViewReader,
      invariantViewReader,
      guidelineViewReader,
    );
    const goalContextQueryHandler = new GoalContextQueryHandler(
      goalContextAssembler,
    );
    const showGoalGateway = new LocalShowGoalGateway(goalContextQueryHandler);

    return {
      showGoalController: new ShowGoalController(showGoalGateway),
    };
  }

  private buildUpdateGoalProgressFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const goalProgressUpdatedEventStore = new FsGoalProgressUpdatedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const goalProgressUpdatedProjector = new SqliteGoalProgressUpdatedProjector(
      core.db,
    );

    const goalReader = new SqliteGoalStartedProjector(core.db);
    const relationReader = new SqliteRelationRemovedProjector(core.db);
    const componentViewReader = new SqliteComponentViewReader(core.db);
    const dependencyViewReader = new SqliteDependencyViewReader(core.db);
    const decisionViewReader = new SqliteDecisionViewReader(core.db);
    const invariantViewReader = new SqliteInvariantViewReader(core.db);
    const guidelineViewReader = new SqliteGuidelineViewReader(core.db);

    const goalContextAssembler = new SqliteGoalContextAssembler(
      goalReader,
      relationReader,
      componentViewReader,
      dependencyViewReader,
      decisionViewReader,
      invariantViewReader,
      guidelineViewReader,
    );
    const goalContextQueryHandler = new GoalContextQueryHandler(
      goalContextAssembler,
    );

    const updateGoalProgressCommandHandler =
      new UpdateGoalProgressCommandHandler(
        goalProgressUpdatedEventStore,
        goalProgressUpdatedEventStore,
        goalProgressUpdatedProjector,
        core.eventBus,
        goalContextQueryHandler,
      );
    const updateGoalProgressGateway = new LocalUpdateGoalProgressGateway(
      updateGoalProgressCommandHandler,
    );

    return {
      updateGoalProgressController: new UpdateGoalProgressController(
        updateGoalProgressGateway,
      ),
    };
  }

  private buildPostponeGoalFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const goalPostponedEventStore = new FsGoalPostponedEventStore(
      core.projectDataDir,
      core.logger,
    );

    const goalViewReader = new SqliteGetGoalViewReader(core.db);

    const postponeGoalCommandHandler = new PostponeGoalCommandHandler(
      goalPostponedEventStore,
      goalPostponedEventStore,
      goalViewReader,
      core.eventBus,
    );
    const postponeGoalGateway = new LocalPostponeGoalGateway(
      postponeGoalCommandHandler,
    );

    return {
      postponeGoalController: new PostponeGoalController(postponeGoalGateway),
    };
  }

  private async buildResetGoalFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const goalResetEventStore = new FsGoalResetEventStore(
      core.projectDataDir,
      core.logger,
    );

    const goalResetProjector = new SqliteGoalResetProjector(core.db);

    const hostSessionKeyResolver = new HostSessionKeyResolver();
    const workerIdentifiedEventStore = new FsWorkerIdentifiedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const workerIdentifiedProjector = new SqliteWorkerIdentifiedProjector(
      core.db,
    );
    const workerIdentityRegistry = new SqliteWorkerIdentityRegistry(
      core.db,
      hostSessionKeyResolver,
      workerIdentifiedEventStore,
      core.eventBus,
    );
    await workerIdentityRegistry.initialize();

    const goalClaimPolicy = new GoalClaimPolicy(
      new SqliteGoalClaimStore(core.db),
      new SystemClock(),
    );

    const resetGoalCommandHandler = new ResetGoalCommandHandler(
      goalResetEventStore,
      goalResetEventStore,
      goalResetProjector,
      core.eventBus,
      goalClaimPolicy,
      workerIdentityRegistry,
    );
    const resetGoalGateway = new LocalResetGoalGateway(
      resetGoalCommandHandler,
      goalResetProjector,
    );

    return {
      resetGoalController: new ResetGoalController(resetGoalGateway),
    };
  }

  private buildRemoveGoalFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const goalRemovedEventStore = new FsGoalRemovedEventStore(
      core.projectDataDir,
      core.logger,
    );

    const goalRemovedProjector = new SqliteGoalRemovedProjector(core.db);

    const removeGoalCommandHandler = new RemoveGoalCommandHandler(
      goalRemovedEventStore,
      goalRemovedEventStore,
      goalRemovedProjector,
      core.eventBus,
    );
    const removeGoalGateway = new LocalRemoveGoalGateway(
      removeGoalCommandHandler,
      goalRemovedProjector,
    );

    return {
      removeGoalController: new RemoveGoalController(removeGoalGateway),
    };
  }

  private buildPauseGoalFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const goalPausedEventStore = new FsGoalPausedEventStore(
      core.projectDataDir,
      core.logger,
    );

    const goalPausedProjector = new SqliteGoalPausedProjector(core.db);

    const pauseGoalCommandHandler = new PauseGoalCommandHandler(
      goalPausedEventStore,
      goalPausedEventStore,
      goalPausedProjector,
      core.eventBus,
    );
    const pauseGoalGateway = new LocalPauseGoalGateway(
      pauseGoalCommandHandler,
      goalPausedProjector,
    );

    return {
      pauseGoalController: new PauseGoalController(pauseGoalGateway),
    };
  }

  private buildBlockGoalFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const goalBlockedEventStore = new FsGoalBlockedEventStore(
      core.projectDataDir,
      core.logger,
    );

    const blockGoalCommandHandler = new BlockGoalCommandHandler(
      goalBlockedEventStore,
      goalBlockedEventStore,
      core.eventBus,
    );
    const blockGoalGateway = new LocalBlockGoalGateway(blockGoalCommandHandler);

    return {
      blockGoalController: new BlockGoalController(blockGoalGateway),
    };
  }

  private buildUnblockGoalFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const goalUnblockedEventStore = new FsGoalUnblockedEventStore(
      core.projectDataDir,
      core.logger,
    );

    const unblockGoalCommandHandler = new UnblockGoalCommandHandler(
      goalUnblockedEventStore,
      goalUnblockedEventStore,
      core.eventBus,
    );
    const unblockGoalGateway = new LocalUnblockGoalGateway(
      unblockGoalCommandHandler,
    );

    return {
      unblockGoalController: new UnblockGoalController(unblockGoalGateway),
    };
  }

  private buildReinstateGoalFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const goalReinstatedEventStore = new FsGoalReinstatedEventStore(
      core.projectDataDir,
      core.logger,
    );

    const goalViewReader = new SqliteGetGoalViewReader(core.db);

    const reinstateGoalCommandHandler = new ReinstateGoalCommandHandler(
      goalReinstatedEventStore,
      goalReinstatedEventStore,
      goalViewReader,
      core.eventBus,
    );
    const reinstateGoalGateway = new LocalReinstateGoalGateway(
      reinstateGoalCommandHandler,
    );

    return {
      reinstateGoalController: new ReinstateGoalController(reinstateGoalGateway),
    };
  }

  private buildGetGoalsFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const goalStatusReader = new SqliteGoalStatusReader(core.db);
    const getGoalsGateway = new LocalGetGoalsGateway(goalStatusReader);

    return {
      getGoalsController: new GetGoalsController(getGoalsGateway),
    };
  }

  private buildComponentViewFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    return {
      componentViewReader: new SqliteComponentViewReader(core.db),
    };
  }

  private buildGoalContextReaderFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    return {
      goalContextReader: new SqliteGoalStartedProjector(core.db),
    };
  }

  private async buildRefineGoalFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const goalRefinedEventStore = new FsGoalRefinedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const goalRefinedProjector = new SqliteGoalRefinedProjector(core.db);

    const hostSessionKeyResolver = new HostSessionKeyResolver();
    const workerIdentifiedEventStore = new FsWorkerIdentifiedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const workerIdentifiedProjector = new SqliteWorkerIdentifiedProjector(
      core.db,
    );
    const workerIdentityRegistry = new SqliteWorkerIdentityRegistry(
      core.db,
      hostSessionKeyResolver,
      workerIdentifiedEventStore,
      core.eventBus,
    );
    await workerIdentityRegistry.initialize();

    const goalClaimPolicy = new GoalClaimPolicy(
      new SqliteGoalClaimStore(core.db),
      new SystemClock(),
    );

    const goalReader = new SqliteGoalStartedProjector(core.db);
    const relationReader = new SqliteRelationRemovedProjector(core.db);
    const componentViewReader = new SqliteComponentViewReader(core.db);
    const dependencyViewReader = new SqliteDependencyViewReader(core.db);
    const decisionViewReader = new SqliteDecisionViewReader(core.db);
    const invariantViewReader = new SqliteInvariantViewReader(core.db);
    const guidelineViewReader = new SqliteGuidelineViewReader(core.db);

    const goalContextAssembler = new SqliteGoalContextAssembler(
      goalReader,
      relationReader,
      componentViewReader,
      dependencyViewReader,
      decisionViewReader,
      invariantViewReader,
      guidelineViewReader,
    );
    const goalContextQueryHandler = new GoalContextQueryHandler(
      goalContextAssembler,
    );

    const refineGoalCommandHandler = new RefineGoalCommandHandler(
      goalRefinedEventStore,
      goalRefinedEventStore,
      goalRefinedProjector,
      core.eventBus,
      goalClaimPolicy,
      workerIdentityRegistry,
      core.settingsReader,
      goalContextQueryHandler,
    );
    const refineGoalGateway = new LocalRefineGoalGateway(
      refineGoalCommandHandler,
    );

    return {
      refineGoalController: new RefineGoalController(refineGoalGateway),
    };
  }

  private async buildStartGoalFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const goalStartedEventStore = new FsGoalStartedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const goalStartedProjector = new SqliteGoalStartedProjector(core.db);

    const hostSessionKeyResolver = new HostSessionKeyResolver();
    const workerIdentifiedEventStore = new FsWorkerIdentifiedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const workerIdentifiedProjector = new SqliteWorkerIdentifiedProjector(
      core.db,
    );
    const workerIdentityRegistry = new SqliteWorkerIdentityRegistry(
      core.db,
      hostSessionKeyResolver,
      workerIdentifiedEventStore,
      core.eventBus,
    );
    await workerIdentityRegistry.initialize();

    const goalClaimPolicy = new GoalClaimPolicy(
      new SqliteGoalClaimStore(core.db),
      new SystemClock(),
    );

    const goalReader = new SqliteGoalStartedProjector(core.db);
    const relationReader = new SqliteRelationRemovedProjector(core.db);
    const componentViewReader = new SqliteComponentViewReader(core.db);
    const dependencyViewReader = new SqliteDependencyViewReader(core.db);
    const decisionViewReader = new SqliteDecisionViewReader(core.db);
    const invariantViewReader = new SqliteInvariantViewReader(core.db);
    const guidelineViewReader = new SqliteGuidelineViewReader(core.db);

    const goalContextAssembler = new SqliteGoalContextAssembler(
      goalReader,
      relationReader,
      componentViewReader,
      dependencyViewReader,
      decisionViewReader,
      invariantViewReader,
      guidelineViewReader,
    );
    const goalContextQueryHandler = new GoalContextQueryHandler(
      goalContextAssembler,
    );

    const prerequisitePolicy = new PrerequisitePolicy();

    const startGoalCommandHandler = new StartGoalCommandHandler(
      goalStartedEventStore,
      goalStartedEventStore,
      goalStartedProjector,
      core.eventBus,
      goalClaimPolicy,
      workerIdentityRegistry,
      core.settingsReader,
      goalContextQueryHandler,
      prerequisitePolicy,
    );
    const startGoalGateway = new LocalStartGoalGateway(
      startGoalCommandHandler,
    );

    return {
      startGoalController: new StartGoalController(startGoalGateway),
    };
  }

  private async buildSessionStartFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const sessionStartedEventStore = new FsSessionStartedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const startSessionCommandHandler = new StartSessionCommandHandler(
      sessionStartedEventStore,
      core.eventBus,
    );
    const brownfieldStatusReader = new SqliteBrownfieldStatusReader(core.db);
    const goalStatusReader = new SqliteGoalStatusReader(core.db);
    const goalBacklogPreviewQueryHandler = new GoalBacklogPreviewQueryHandler(
      goalStatusReader,
    );
    const startSessionGateway = new LocalStartSessionGateway(
      startSessionCommandHandler,
      brownfieldStatusReader,
      core.settingsReader,
      goalBacklogPreviewQueryHandler,
    );

    return {
      sessionStartController: new SessionStartController(startSessionGateway),
    };
  }

  private async buildEndSessionFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const sessionEndedEventStore = new FsSessionEndedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const activeSessionReader = new SqliteActiveSessionReader(core.db);
    const endSessionCommandHandler = new EndSessionCommandHandler(
      sessionEndedEventStore,
      sessionEndedEventStore,
      activeSessionReader,
      core.eventBus,
    );
    const endSessionGateway = new LocalEndSessionGateway(
      endSessionCommandHandler,
    );

    return {
      endSessionController: new EndSessionController(endSessionGateway),
    };
  }

  private buildGetSessionsFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const sessionViewReader = new SqliteSessionViewReader(core.db);
    const getSessionsGateway = new LocalGetSessionsGateway(sessionViewReader);

    return {
      getSessionsController: new GetSessionsController(getSessionsGateway),
    };
  }

  private async buildResumeGoalFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const goalResumedEventStore = new FsGoalResumedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const goalResumedProjector = new SqliteGoalResumedProjector(core.db);

    const hostSessionKeyResolver = new HostSessionKeyResolver();
    const workerIdentifiedEventStore = new FsWorkerIdentifiedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const workerIdentifiedProjector = new SqliteWorkerIdentifiedProjector(
      core.db,
    );
    const workerIdentityRegistry = new SqliteWorkerIdentityRegistry(
      core.db,
      hostSessionKeyResolver,
      workerIdentifiedEventStore,
      core.eventBus,
    );
    await workerIdentityRegistry.initialize();

    const goalClaimPolicy = new GoalClaimPolicy(
      new SqliteGoalClaimStore(core.db),
      new SystemClock(),
    );

    const goalReader = new SqliteGoalStartedProjector(core.db);
    const relationReader = new SqliteRelationRemovedProjector(core.db);
    const componentViewReader = new SqliteComponentViewReader(core.db);
    const dependencyViewReader = new SqliteDependencyViewReader(core.db);
    const decisionViewReader = new SqliteDecisionViewReader(core.db);
    const invariantViewReader = new SqliteInvariantViewReader(core.db);
    const guidelineViewReader = new SqliteGuidelineViewReader(core.db);

    const goalContextAssembler = new SqliteGoalContextAssembler(
      goalReader,
      relationReader,
      componentViewReader,
      dependencyViewReader,
      decisionViewReader,
      invariantViewReader,
      guidelineViewReader,
    );
    const goalContextQueryHandler = new GoalContextQueryHandler(
      goalContextAssembler,
    );

    const resumeGoalCommandHandler = new ResumeGoalCommandHandler(
      goalResumedEventStore,
      goalResumedEventStore,
      goalResumedProjector,
      core.eventBus,
      goalClaimPolicy,
      workerIdentityRegistry,
      core.settingsReader,
      goalContextQueryHandler,
    );
    const resumeGoalGateway = new LocalResumeGoalGateway(
      resumeGoalCommandHandler,
    );

    return {
      resumeGoalController: new ResumeGoalController(resumeGoalGateway),
    };
  }

  private async buildWorkerIdentityRegistry(): Promise<SqliteWorkerIdentityRegistry> {
    const core = this.coreInfra();

    const hostSessionKeyResolver = new HostSessionKeyResolver();
    const workerIdentifiedEventStore = new FsWorkerIdentifiedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const workerIdentifiedProjector = new SqliteWorkerIdentifiedProjector(
      core.db,
    );
    const workerIdentityRegistry = new SqliteWorkerIdentityRegistry(
      core.db,
      hostSessionKeyResolver,
      workerIdentifiedEventStore,
      core.eventBus,
    );
    await workerIdentityRegistry.initialize();

    return workerIdentityRegistry;
  }

  private async buildPauseWorkFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const goalPausedEventStore = new FsGoalPausedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const goalPausedProjector = new SqliteGoalPausedProjector(core.db);

    const pauseGoalCommandHandler = new PauseGoalCommandHandler(
      goalPausedEventStore,
      goalPausedEventStore,
      goalPausedProjector,
      core.eventBus,
    );

    const workerIdentityRegistry = await this.buildWorkerIdentityRegistry();
    const goalStatusReader = new SqliteGoalStatusReader(core.db);

    const pauseWorkCommandHandler = new PauseWorkCommandHandler(
      workerIdentityRegistry,
      goalStatusReader,
      pauseGoalCommandHandler,
      core.logger,
    );
    const pauseWorkGateway = new LocalPauseWorkGateway(pauseWorkCommandHandler);

    return {
      pauseWorkController: new PauseWorkController(pauseWorkGateway),
    };
  }

  private async buildResumeWorkFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const goalResumedEventStore = new FsGoalResumedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const goalResumedProjector = new SqliteGoalResumedProjector(core.db);

    const workerIdentityRegistry = await this.buildWorkerIdentityRegistry();
    const goalClaimPolicy = new GoalClaimPolicy(
      new SqliteGoalClaimStore(core.db),
      new SystemClock(),
    );

    const goalReader = new SqliteGoalStartedProjector(core.db);
    const relationReader = new SqliteRelationRemovedProjector(core.db);
    const componentViewReader = new SqliteComponentViewReader(core.db);
    const dependencyViewReader = new SqliteDependencyViewReader(core.db);
    const decisionViewReader = new SqliteDecisionViewReader(core.db);
    const invariantViewReader = new SqliteInvariantViewReader(core.db);
    const guidelineViewReader = new SqliteGuidelineViewReader(core.db);

    const goalContextAssembler = new SqliteGoalContextAssembler(
      goalReader,
      relationReader,
      componentViewReader,
      dependencyViewReader,
      decisionViewReader,
      invariantViewReader,
      guidelineViewReader,
    );
    const goalContextQueryHandler = new GoalContextQueryHandler(
      goalContextAssembler,
    );

    const resumeGoalCommandHandler = new ResumeGoalCommandHandler(
      goalResumedEventStore,
      goalResumedEventStore,
      goalResumedProjector,
      core.eventBus,
      goalClaimPolicy,
      workerIdentityRegistry,
      core.settingsReader,
      goalContextQueryHandler,
    );

    const goalStatusReader = new SqliteGoalStatusReader(core.db);
    const sessionViewReader = new SqliteSessionViewReader(core.db);
    const projectContextReader = new SqliteProjectContextReader(core.db);
    const sessionContextQueryHandler = new SessionContextQueryHandler(
      sessionViewReader,
      goalStatusReader,
      decisionViewReader,
      projectContextReader,
    );

    const resumeWorkGateway = new LocalResumeWorkGateway(
      workerIdentityRegistry,
      goalStatusReader,
      resumeGoalCommandHandler,
      sessionContextQueryHandler,
      core.logger,
    );

    return {
      resumeWorkController: new ResumeWorkController(resumeWorkGateway),
    };
  }

  private async buildCommitGoalFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const goalCommittedEventStore = new FsGoalCommittedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const goalCommittedProjector = new SqliteGoalCommittedProjector(core.db);

    const hostSessionKeyResolver = new HostSessionKeyResolver();
    const workerIdentifiedEventStore = new FsWorkerIdentifiedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const workerIdentifiedProjector = new SqliteWorkerIdentifiedProjector(
      core.db,
    );
    const workerIdentityRegistry = new SqliteWorkerIdentityRegistry(
      core.db,
      hostSessionKeyResolver,
      workerIdentifiedEventStore,
      core.eventBus,
    );
    await workerIdentityRegistry.initialize();

    const goalClaimPolicy = new GoalClaimPolicy(
      new SqliteGoalClaimStore(core.db),
      new SystemClock(),
    );

    const goalReader = new SqliteGoalStartedProjector(core.db);
    const relationReader = new SqliteRelationRemovedProjector(core.db);
    const componentViewReader = new SqliteComponentViewReader(core.db);
    const dependencyViewReader = new SqliteDependencyViewReader(core.db);
    const decisionViewReader = new SqliteDecisionViewReader(core.db);
    const invariantViewReader = new SqliteInvariantViewReader(core.db);
    const guidelineViewReader = new SqliteGuidelineViewReader(core.db);

    const goalContextAssembler = new SqliteGoalContextAssembler(
      goalReader,
      relationReader,
      componentViewReader,
      dependencyViewReader,
      decisionViewReader,
      invariantViewReader,
      guidelineViewReader,
    );
    const goalContextQueryHandler = new GoalContextQueryHandler(
      goalContextAssembler,
    );

    const commitGoalCommandHandler = new CommitGoalCommandHandler(
      goalCommittedEventStore,
      goalCommittedEventStore,
      goalCommittedProjector,
      core.eventBus,
      goalClaimPolicy,
      workerIdentityRegistry,
      goalContextQueryHandler,
    );
    const commitGoalGateway = new LocalCommitGoalGateway(
      commitGoalCommandHandler,
    );

    return {
      commitGoalController: new CommitGoalController(commitGoalGateway),
    };
  }

  /**
   * Shared infrastructure for goal lifecycle leaves that acquire worker
   * claims and assemble goal context (submit, review, ...).
   */
  private async buildCommonGoalFeatureInfra(): Promise<{
    goalReader: IGoalReader;
    goalClaimPolicy: GoalClaimPolicy;
    workerIdentityReader: SqliteWorkerIdentityRegistry;
    goalContextQueryHandler: GoalContextQueryHandler;
  }> {
    const core = this.coreInfra();

    const hostSessionKeyResolver = new HostSessionKeyResolver();
    const workerIdentifiedEventStore = new FsWorkerIdentifiedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const workerIdentifiedProjector = new SqliteWorkerIdentifiedProjector(
      core.db,
    );
    const workerIdentityRegistry = new SqliteWorkerIdentityRegistry(
      core.db,
      hostSessionKeyResolver,
      workerIdentifiedEventStore,
      core.eventBus,
    );
    await workerIdentityRegistry.initialize();

    const goalClaimPolicy = new GoalClaimPolicy(
      new SqliteGoalClaimStore(core.db),
      new SystemClock(),
    );

    const goalReader = new SqliteGoalStartedProjector(core.db);
    const relationReader = new SqliteRelationRemovedProjector(core.db);
    const componentViewReader = new SqliteComponentViewReader(core.db);
    const dependencyViewReader = new SqliteDependencyViewReader(core.db);
    const decisionViewReader = new SqliteDecisionViewReader(core.db);
    const invariantViewReader = new SqliteInvariantViewReader(core.db);
    const guidelineViewReader = new SqliteGuidelineViewReader(core.db);

    const goalContextAssembler = new SqliteGoalContextAssembler(
      goalReader,
      relationReader,
      componentViewReader,
      dependencyViewReader,
      decisionViewReader,
      invariantViewReader,
      guidelineViewReader,
    );
    const goalContextQueryHandler = new GoalContextQueryHandler(
      goalContextAssembler,
    );

    return {
      goalReader,
      goalClaimPolicy,
      workerIdentityReader: workerIdentityRegistry,
      goalContextQueryHandler,
    };
  }

  private async buildSubmitGoalFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const goalSubmittedEventStore = new FsGoalSubmittedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const goalSubmittedProjector = new SqliteGoalSubmittedProjector(core.db);

    const { goalClaimPolicy, workerIdentityReader, goalContextQueryHandler } =
      await this.buildCommonGoalFeatureInfra();

    const submitGoalCommandHandler = new SubmitGoalCommandHandler(
      goalSubmittedEventStore,
      goalSubmittedEventStore,
      goalSubmittedProjector,
      core.eventBus,
      goalClaimPolicy,
      workerIdentityReader,
      goalContextQueryHandler,
    );
    const submitGoalGateway = new LocalSubmitGoalGateway(
      submitGoalCommandHandler,
    );

    return {
      submitGoalController: new SubmitGoalController(submitGoalGateway),
    };
  }

  private async buildCodifyGoalFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const goalCodifyingStartedEventStore = new FsGoalCodifyingStartedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const goalCodifyingStartedProjector =
      new SqliteGoalCodifyingStartedProjector(core.db);

    const { goalClaimPolicy, workerIdentityReader, goalContextQueryHandler } =
      await this.buildCommonGoalFeatureInfra();

    const codifyGoalCommandHandler = new CodifyGoalCommandHandler(
      goalCodifyingStartedEventStore,
      goalCodifyingStartedEventStore,
      goalCodifyingStartedProjector,
      core.eventBus,
      goalClaimPolicy,
      workerIdentityReader,
      core.settingsReader,
      goalContextQueryHandler,
    );
    const codifyGoalGateway = new LocalCodifyGoalGateway(
      codifyGoalCommandHandler,
    );

    return {
      codifyGoalController: new CodifyGoalController(codifyGoalGateway),
    };
  }

  private async buildCloseGoalFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const goalClosedEventStore = new FsGoalClosedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const goalClosedProjector = new SqliteGoalClosedProjector(core.db);

    const { goalClaimPolicy, workerIdentityReader, goalContextQueryHandler } =
      await this.buildCommonGoalFeatureInfra();

    const closeGoalCommandHandler = new CloseGoalCommandHandler(
      goalClosedEventStore,
      goalClosedEventStore,
      goalClosedProjector,
      core.eventBus,
      goalClaimPolicy,
      workerIdentityReader,
      goalContextQueryHandler,
    );
    const closeGoalGateway = new LocalCloseGoalGateway(
      closeGoalCommandHandler,
      goalClosedProjector,
      goalClaimPolicy,
      workerIdentityReader,
    );

    return {
      closeGoalController: new CloseGoalController(closeGoalGateway),
    };
  }

  private async buildReviewGoalFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const goalSubmittedForReviewEventStore =
      new FsGoalSubmittedForReviewEventStore(core.projectDataDir, core.logger);

    const { goalReader, goalClaimPolicy, workerIdentityReader, goalContextQueryHandler } =
      await this.buildCommonGoalFeatureInfra();

    const submitGoalForReviewCommandHandler =
      new SubmitGoalForReviewCommandHandler(
        goalSubmittedForReviewEventStore,
        goalSubmittedForReviewEventStore,
        goalReader,
        core.eventBus,
        goalClaimPolicy,
        workerIdentityReader,
        core.settingsReader,
        goalContextQueryHandler,
      );
    const reviewGoalGateway = new LocalReviewGoalGateway(
      submitGoalForReviewCommandHandler,
      goalReader,
    );

    return {
      reviewGoalController: new ReviewGoalController(reviewGoalGateway),
    };
  }

  private async buildRejectGoalFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const goalRejectedEventStore = new FsGoalRejectedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const goalRejectedProjector = new SqliteGoalRejectedProjector(core.db);

    const { goalClaimPolicy, workerIdentityReader, goalContextQueryHandler } =
      await this.buildCommonGoalFeatureInfra();

    const rejectGoalCommandHandler = new RejectGoalCommandHandler(
      goalRejectedEventStore,
      goalRejectedEventStore,
      goalRejectedProjector,
      core.eventBus,
      goalClaimPolicy,
      workerIdentityReader,
      goalContextQueryHandler,
    );
    const rejectGoalGateway = new LocalRejectGoalGateway(
      rejectGoalCommandHandler,
    );

    return {
      rejectGoalController: new RejectGoalController(rejectGoalGateway),
    };
  }

  private async buildQualifyGoalFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const goalQualifiedEventStore = new FsGoalQualifiedEventStore(
      core.projectDataDir,
      core.logger,
    );

    const { goalReader, goalClaimPolicy, workerIdentityReader, goalContextQueryHandler } =
      await this.buildCommonGoalFeatureInfra();

    const qualifyGoalCommandHandler = new QualifyGoalCommandHandler(
      goalQualifiedEventStore,
      goalQualifiedEventStore,
      goalReader,
      core.eventBus,
      goalClaimPolicy,
      workerIdentityReader,
      goalContextQueryHandler,
    );
    const qualifyGoalGateway = new LocalQualifyGoalGateway(
      qualifyGoalCommandHandler,
      goalReader,
      goalClaimPolicy,
      workerIdentityReader,
    );

    return {
      qualifyGoalController: new QualifyGoalController(qualifyGoalGateway),
    };
  }

  private buildGuidelineViewFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    return {
      guidelineViewReader: new SqliteGuidelineViewReader(core.db),
    };
  }

  private buildAddGuidelineFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const guidelineAddedEventStore = new FsGuidelineAddedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const guidelineAddedProjector = new SqliteGuidelineAddedProjector(core.db);

    const addGuidelineCommandHandler = new AddGuidelineCommandHandler(
      guidelineAddedEventStore,
      core.eventBus,
    );
    const addGuidelineGateway = new LocalAddGuidelineGateway(
      addGuidelineCommandHandler,
    );

    return {
      addGuidelineController: new AddGuidelineController(addGuidelineGateway),
    };
  }

  private buildUpdateGuidelineFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const guidelineUpdatedEventStore = new FsGuidelineUpdatedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const guidelineUpdatedProjector = new SqliteGuidelineUpdatedProjector(
      core.db,
    );

    const updateGuidelineGateway = new LocalUpdateGuidelineGateway(
      guidelineUpdatedEventStore,
      guidelineUpdatedEventStore,
      guidelineUpdatedProjector,
      core.eventBus,
    );

    return {
      updateGuidelineController: new UpdateGuidelineController(
        updateGuidelineGateway,
      ),
    };
  }

  private buildRemoveGuidelineFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const guidelineRemovedEventStore = new FsGuidelineRemovedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const guidelineRemovedProjector = new SqliteGuidelineRemovedProjector(
      core.db,
    );

    const removeGuidelineCommandHandler = new RemoveGuidelineCommandHandler(
      guidelineRemovedEventStore,
      guidelineRemovedEventStore,
      core.eventBus,
    );
    const removeGuidelineGateway = new LocalRemoveGuidelineGateway(
      removeGuidelineCommandHandler,
      guidelineRemovedProjector,
    );

    return {
      removeGuidelineController: new RemoveGuidelineController(
        removeGuidelineGateway,
      ),
    };
  }

  private buildShowGuidelineFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const showGuidelineGateway = new LocalShowGuidelineGateway(
      new SqliteGuidelineViewReader(core.db),
    );

    return {
      showGuidelineController: new ShowGuidelineController(showGuidelineGateway),
    };
  }

  private buildGetGuidelinesFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const getGuidelinesGateway = new LocalGetGuidelinesGateway(
      new SqliteGuidelineViewReader(core.db),
    );

    return {
      getGuidelinesController: new GetGuidelinesController(
        getGuidelinesGateway,
      ),
    };
  }

  private buildSearchGuidelinesFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const searchGuidelinesGateway = new LocalSearchGuidelinesGateway(
      new SqliteGuidelineViewReader(core.db),
    );

    return {
      searchGuidelinesController: new SearchGuidelinesController(
        searchGuidelinesGateway,
      ),
    };
  }

  private buildAddInvariantFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const invariantAddedEventStore = new FsInvariantAddedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const invariantAddedProjector = new SqliteInvariantAddedProjector(core.db);

    const addInvariantCommandHandler = new AddInvariantCommandHandler(
      invariantAddedEventStore,
      invariantAddedProjector,
      core.eventBus,
    );
    const addInvariantGateway = new LocalAddInvariantGateway(
      addInvariantCommandHandler,
    );

    return {
      addInvariantController: new AddInvariantController(addInvariantGateway),
    };
  }

  private buildUpdateInvariantFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const invariantUpdatedEventStore = new FsInvariantUpdatedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const invariantUpdatedProjector = new SqliteInvariantUpdatedProjector(
      core.db,
    );

    const updateInvariantCommandHandler = new UpdateInvariantCommandHandler(
      invariantUpdatedEventStore,
      invariantUpdatedEventStore,
      core.eventBus,
    );
    const updateInvariantGateway = new LocalUpdateInvariantGateway(
      updateInvariantCommandHandler,
      invariantUpdatedProjector,
    );

    return {
      updateInvariantController: new UpdateInvariantController(
        updateInvariantGateway,
      ),
    };
  }

  private buildRemoveInvariantFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const invariantRemovedEventStore = new FsInvariantRemovedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const invariantRemovedProjector = new SqliteInvariantRemovedProjector(
      core.db,
    );

    const removeInvariantCommandHandler = new RemoveInvariantCommandHandler(
      invariantRemovedEventStore,
      invariantRemovedEventStore,
      invariantRemovedProjector,
      core.eventBus,
    );
    const removeInvariantGateway = new LocalRemoveInvariantGateway(
      removeInvariantCommandHandler,
      invariantRemovedProjector,
    );

    return {
      removeInvariantController: new RemoveInvariantController(
        removeInvariantGateway,
      ),
    };
  }

  private buildGetInvariantsFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const getInvariantsGateway = new LocalGetInvariantsGateway(
      new SqliteInvariantViewReader(core.db),
    );

    return {
      getInvariantsController: new GetInvariantsController(
        getInvariantsGateway,
      ),
    };
  }

  private buildSearchInvariantsFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const searchInvariantsGateway = new LocalSearchInvariantsGateway(
      new SqliteInvariantViewReader(core.db),
    );

    return {
      searchInvariantsController: new SearchInvariantsController(
        searchInvariantsGateway,
      ),
    };
  }

  private buildInvariantViewFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    return {
      invariantViewReader: new SqliteInvariantViewReader(core.db),
    };
  }

  private buildDecisionViewFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    return {
      decisionViewReader: new SqliteDecisionViewReader(core.db),
    };
  }

  private buildAddRelationFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const relationAddedEventStore = new FsRelationAddedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const relationAddedProjector = new SqliteRelationAddedProjector(core.db);

    const addRelationCommandHandler = new AddRelationCommandHandler(
      relationAddedEventStore,
      core.eventBus,
      relationAddedProjector,
    );
    const addRelationGateway = new LocalAddRelationGateway(
      addRelationCommandHandler,
    );

    return {
      addRelationController: new AddRelationController(addRelationGateway),
    };
  }

  private buildRemoveRelationFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const relationRemovedEventStore = new FsRelationRemovedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const relationRemovedProjector = new SqliteRelationRemovedProjector(core.db);

    const removeRelationCommandHandler = new RemoveRelationCommandHandler(
      relationRemovedEventStore,
      relationRemovedEventStore,
      core.eventBus,
      relationRemovedProjector,
    );
    const removeRelationGateway = new LocalRemoveRelationGateway(
      removeRelationCommandHandler,
      relationRemovedProjector,
    );

    return {
      removeRelationController: new RemoveRelationController(
        removeRelationGateway,
      ),
    };
  }

  private buildGetRelationsFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const relationViewReader = new SqliteRelationViewReader(core.db);
    const getRelationsGateway = new LocalGetRelationsGateway(
      relationViewReader,
    );

    return {
      getRelationsController: new GetRelationsController(getRelationsGateway),
    };
  }

  private buildAuditRelationsFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const relationNodeCatalog = new SqliteRelationNodeCatalog(core.db);
    const relationViewReader = new SqliteRelationViewReader(core.db);
    const relationAuditPolicy = new RelationAuditPolicy();

    return {
      auditRelationsController: new AuditRelationsController(
        relationNodeCatalog,
        relationViewReader,
        relationAuditPolicy,
      ),
    };
  }

  private buildFindRelationPathFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const relationViewReader = new SqliteRelationViewReader(core.db);
    const relationNodeReferenceResolver = new RelationNodeReferenceResolver(
      relationViewReader,
    );
    const relationTraversalQueryNormalizer =
      new RelationTraversalQueryNormalizer();
    const relationTraversalPolicy = new RelationTraversalPolicy();
    const relationShortestPathFinder = new RelationShortestPathFinder(
      relationViewReader,
      relationTraversalPolicy,
    );
    const findRelationPathGateway = new LocalFindRelationPathGateway(
      relationNodeReferenceResolver,
      relationTraversalQueryNormalizer,
      relationShortestPathFinder,
    );

    return {
      findRelationPathController: new FindRelationPathController(
        findRelationPathGateway,
      ),
    };
  }

  private buildTraverseRelationsFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const relationViewReader = new SqliteRelationViewReader(core.db);
    const relationNodeReferenceResolver = new RelationNodeReferenceResolver(
      relationViewReader,
    );
    const relationTraversalQueryNormalizer =
      new RelationTraversalQueryNormalizer();
    const relationTraversalPolicy = new RelationTraversalPolicy();
    const traverseRelationsGateway = new LocalTraverseRelationsGateway(
      relationViewReader,
      relationNodeReferenceResolver,
      relationTraversalQueryNormalizer,
      relationTraversalPolicy,
    );

    return {
      traverseRelationsController: new TraverseRelationsController(
        traverseRelationsGateway,
      ),
    };
  }

  private buildEvolveFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    // Schema migrations
    const migrationRunner = new MigrationRunner(core.db);
    const infrastructureDir = path.resolve(__dirname, "..");

    // v1 → v2 goal status migration
    const eventStore = new FsEventStore(core.projectDataDir, core.logger);
    const goalStatusReader = new SqliteGoalStatusReader(core.db);
    const upgradeCommandHandler = new UpgradeCommandHandler(
      eventStore,
      goalStatusReader,
    );

    // Legacy dependency migration
    const relationAddedEventStore = new FsRelationAddedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const relationAddedProjector = new SqliteRelationAddedProjector(core.db);
    const addRelationCommandHandler = new AddRelationCommandHandler(
      relationAddedEventStore,
      core.eventBus,
      relationAddedProjector,
    );
    const dependencyRemovedEventStore = new FsDependencyRemovedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const dependencyRemovedProjector = new SqliteDependencyRemovedProjector(
      core.db,
    );
    const removeDependencyCommandHandler = new RemoveDependencyCommandHandler(
      dependencyRemovedEventStore,
      dependencyRemovedEventStore,
      dependencyRemovedProjector,
      core.eventBus,
    );
    const legacyDependencyReader = new SqliteLegacyDependencyReader(core.db);
    const migrateDependenciesCommandHandler =
      new MigrateDependenciesCommandHandler(
        legacyDependencyReader,
        addRelationCommandHandler,
        removeDependencyCommandHandler,
      );

    // Database rebuild
    const databaseRebuildService = new LocalDatabaseRebuildService(
      core.projectDataDir,
      core.db,
      eventStore,
      (db) => new ProjectionBusFactory().create(db),
      core.logger,
    );

    const evolveController = new EvolveController(
      () =>
        migrationRunner.runNamespaceMigrations(
          getNamespaceMigrations(infrastructureDir),
        ),
      upgradeCommandHandler,
      migrateDependenciesCommandHandler,
      CachedContextProject.get().path,
      new AgentFileProtocol(),
      new FsSettingsInitializer(core.projectDataDir),
      databaseRebuildService,
      core.logger,
    );

    return { evolveController };
  }

  private buildSearchFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const searchIndexStore = new SqliteSearchIndexStore(core.db);
    const projectedSearchIndexProvider = new ProjectedSearchIndexProvider(
      searchIndexStore,
    );

    return {
      searchController: new SearchController(
        new LocalSearchGateway([projectedSearchIndexProvider]),
      ),
    };
  }

  private buildSearchIndexRebuildFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const eventStore = new FsEventStore(core.projectDataDir, core.logger);
    const searchIndexStore = new SqliteSearchIndexStore(core.db);
    const projectorRegistry = new SearchDocumentProjectorRegistry();

    return {
      searchIndexRebuildController: new SearchIndexRebuildController(
        new LocalSearchIndexRebuildGateway(
          eventStore,
          searchIndexStore,
          searchIndexStore,
          searchIndexStore,
          projectorRegistry,
        ),
      ),
    };
  }

  private buildRebuildDatabaseFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const eventStore = new FsEventStore(core.projectDataDir, core.logger);
    const databaseRebuildService = new LocalDatabaseRebuildService(
      core.projectDataDir,
      core.db,
      eventStore,
      (db) => new ProjectionBusFactory().create(db),
      core.logger,
    );
    const rebuildDatabaseGateway = new LocalRebuildDatabaseGateway(
      databaseRebuildService,
    );

    return {
      rebuildDatabaseController: new RebuildDatabaseController(
        rebuildDatabaseGateway,
      ),
    };
  }

  private async buildViewWorkerFeature(): Promise<Partial<LeafContainer>> {
    const core = this.coreInfra();

    const hostSessionKeyResolver = new HostSessionKeyResolver();
    const workerIdentifiedEventStore = new FsWorkerIdentifiedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const workerIdentifiedProjector = new SqliteWorkerIdentifiedProjector(
      core.db,
    );
    const workerIdentityRegistry = new SqliteWorkerIdentityRegistry(
      core.db,
      hostSessionKeyResolver,
      workerIdentifiedEventStore,
      core.eventBus,
    );
    await workerIdentityRegistry.initialize();

    const viewWorkerGateway = new LocalViewWorkerGateway(
      workerIdentityRegistry,
      core.settingsReader,
    );

    return {
      viewWorkerController: new ViewWorkerController(viewWorkerGateway),
    };
  }

  private buildTelemetryFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const telemetryEnvironmentReader =
      new ProcessTelemetryEnvironmentReader();
    const telemetryConsentStatusResolver =
      new TelemetryConsentStatusResolver();

    const getTelemetryStatusGateway = new LocalGetTelemetryStatusGateway(
      core.settingsReader,
      telemetryEnvironmentReader,
      telemetryConsentStatusResolver,
    );

    const updateTelemetryConsentCommandHandler =
      new UpdateTelemetryConsentCommandHandler(core.settingsReader);
    const updateTelemetryConsentGateway =
      new LocalUpdateTelemetryConsentGateway(
        updateTelemetryConsentCommandHandler,
        telemetryEnvironmentReader,
      );

    return {
      getTelemetryStatusController: new GetTelemetryStatusController(
        getTelemetryStatusGateway,
      ),
      updateTelemetryConsentController: new UpdateTelemetryConsentController(
        updateTelemetryConsentGateway,
      ),
    };
  }

  private buildDefineArchitectureFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const architectureDefinedEventStore = new FsArchitectureDefinedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const architectureDefinedProjector =
      new SqliteArchitectureDefinedProjector(core.db);

    const defineArchitectureGateway = new LocalDefineArchitectureGateway(
      architectureDefinedEventStore,
      architectureDefinedProjector,
      core.eventBus,
    );

    return {
      defineArchitectureController: new DefineArchitectureController(
        defineArchitectureGateway,
      ),
    };
  }

  private buildUpdateArchitectureFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const architectureUpdatedEventStore = new FsArchitectureUpdatedEventStore(
      core.projectDataDir,
      core.logger,
    );

    const updateArchitectureGateway = new LocalUpdateArchitectureGateway(
      architectureUpdatedEventStore,
      architectureUpdatedEventStore,
      core.eventBus,
    );

    return {
      updateArchitectureController: new UpdateArchitectureController(
        updateArchitectureGateway,
      ),
    };
  }

  private buildGetArchitectureFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const getArchitectureGateway = new LocalGetArchitectureGateway(
      new SqliteArchitectureReader(core.db),
    );

    return {
      getArchitectureController: new GetArchitectureController(
        getArchitectureGateway,
      ),
    };
  }

  private buildUpdateAudiencePainFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const audiencePainUpdatedEventStore =
      new FsAudiencePainUpdatedEventStore(core.projectDataDir, core.logger);
    const audiencePainUpdatedProjector =
      new SqliteAudiencePainUpdatedProjector(core.db);

    const updateAudiencePainCommandHandler =
      new UpdateAudiencePainCommandHandler(
        audiencePainUpdatedEventStore,
        core.eventBus,
        audiencePainUpdatedProjector,
      );
    const updateAudiencePainGateway = new LocalUpdateAudiencePainGateway(
      updateAudiencePainCommandHandler,
      audiencePainUpdatedProjector,
    );

    return {
      updateAudiencePainController: new UpdateAudiencePainController(
        updateAudiencePainGateway,
      ),
    };
  }

  private buildGetAudiencePainsFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const getAudiencePainsGateway = new LocalGetAudiencePainsGateway(
      new SqliteAudiencePainContextReader(core.db),
    );

    return {
      getAudiencePainsController: new GetAudiencePainsController(
        getAudiencePainsGateway,
      ),
    };
  }

  private buildListAudiencesFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const listAudiencesGateway = new LocalListAudiencesGateway(
      new SqliteAudienceContextReader(core.db),
    );

    return {
      listAudiencesController: new ListAudiencesController(
        listAudiencesGateway,
      ),
    };
  }

  private buildRemoveAudienceFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const audienceRemovedEventStore = new FsAudienceRemovedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const audienceRemovedProjector = new SqliteAudienceRemovedProjector(
      core.db,
    );

    const removeAudienceCommandHandler = new RemoveAudienceCommandHandler(
      audienceRemovedEventStore,
      core.eventBus,
      audienceRemovedProjector,
    );
    const removeAudienceGateway = new LocalRemoveAudienceGateway(
      removeAudienceCommandHandler,
      audienceRemovedProjector,
    );

    return {
      removeAudienceController: new RemoveAudienceController(
        removeAudienceGateway,
      ),
    };
  }

  private buildUpdateAudienceFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const audienceUpdatedEventStore = new FsAudienceUpdatedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const audienceUpdatedProjector = new SqliteAudienceUpdatedProjector(
      core.db,
    );

    const updateAudienceCommandHandler = new UpdateAudienceCommandHandler(
      audienceUpdatedEventStore,
      core.eventBus,
    );
    const updateAudienceGateway = new LocalUpdateAudienceGateway(
      updateAudienceCommandHandler,
      audienceUpdatedProjector,
    );

    return {
      updateAudienceController: new UpdateAudienceController(
        updateAudienceGateway,
      ),
    };
  }

  private buildAddComponentFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const componentAddedEventStore = new FsComponentAddedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const componentAddedProjector = new SqliteComponentAddedProjector(core.db);
    const componentUpdatedProjector = new SqliteComponentUpdatedProjector(
      core.db,
    );

    const addComponentCommandHandler = new AddComponentCommandHandler(
      componentAddedEventStore,
      core.eventBus,
      componentAddedProjector,
    );
    const addComponentGateway = new LocalAddComponentGateway(
      addComponentCommandHandler,
      componentUpdatedProjector,
    );

    return {
      addComponentController: new AddComponentController(addComponentGateway),
    };
  }

  private buildGetComponentsFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const getComponentsGateway = new LocalGetComponentsGateway(
      new SqliteComponentViewReader(core.db),
    );

    return {
      getComponentsController: new GetComponentsController(
        getComponentsGateway,
      ),
    };
  }

  private buildSearchComponentsFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const searchComponentsGateway = new LocalSearchComponentsGateway(
      new SqliteComponentViewReader(core.db),
    );

    return {
      searchComponentsController: new SearchComponentsController(
        searchComponentsGateway,
      ),
    };
  }

  private buildUpdateComponentFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const componentUpdatedEventStore = new FsComponentUpdatedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const componentUpdatedProjector = new SqliteComponentUpdatedProjector(
      core.db,
    );

    const updateComponentCommandHandler = new UpdateComponentCommandHandler(
      componentUpdatedEventStore,
      core.eventBus,
      componentUpdatedProjector,
    );
    const updateComponentGateway = new LocalUpdateComponentGateway(
      updateComponentCommandHandler,
      componentUpdatedProjector,
    );

    return {
      updateComponentController: new UpdateComponentController(
        updateComponentGateway,
      ),
    };
  }

  private buildRenameComponentFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const componentRenamedEventStore = new FsComponentRenamedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const componentRenamedProjector = new SqliteComponentRenamedProjector(
      core.db,
    );

    const renameComponentCommandHandler = new RenameComponentCommandHandler(
      componentRenamedEventStore,
      core.eventBus,
      componentRenamedProjector,
    );
    const renameComponentGateway = new LocalRenameComponentGateway(
      renameComponentCommandHandler,
      componentRenamedProjector,
    );

    return {
      renameComponentController: new RenameComponentController(
        renameComponentGateway,
      ),
    };
  }

  private buildShowComponentFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const showComponentGateway = new LocalShowComponentGateway(
      new SqliteComponentReader(core.db),
      new SqliteRelationViewReader(core.db),
    );

    return {
      showComponentController: new ShowComponentController(
        showComponentGateway,
      ),
    };
  }

  private buildDeprecateComponentFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const componentDeprecatedEventStore = new FsComponentDeprecatedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const componentDeprecatedProjector =
      new SqliteComponentDeprecatedProjector(core.db);

    const deprecateComponentCommandHandler =
      new DeprecateComponentCommandHandler(
        componentDeprecatedEventStore,
        core.eventBus,
        componentDeprecatedProjector,
      );
    const deprecateComponentGateway = new LocalDeprecateComponentGateway(
      deprecateComponentCommandHandler,
      componentDeprecatedProjector,
    );

    return {
      deprecateComponentController: new DeprecateComponentController(
        deprecateComponentGateway,
      ),
    };
  }

  private buildUndeprecateComponentFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const componentUndeprecatedEventStore =
      new FsComponentUndeprecatedEventStore(core.projectDataDir, core.logger);
    const componentUndeprecatedProjector =
      new SqliteComponentUndeprecatedProjector(core.db);

    const undeprecateComponentCommandHandler =
      new UndeprecateComponentCommandHandler(
        componentUndeprecatedEventStore,
        core.eventBus,
        componentUndeprecatedProjector,
      );
    const undeprecateComponentGateway = new LocalUndeprecateComponentGateway(
      undeprecateComponentCommandHandler,
      componentUndeprecatedProjector,
    );

    return {
      undeprecateComponentController: new UndeprecateComponentController(
        undeprecateComponentGateway,
      ),
    };
  }

  private buildRemoveComponentFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const componentRemovedEventStore = new FsComponentRemovedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const componentRemovedProjector = new SqliteComponentRemovedProjector(
      core.db,
    );

    const removeComponentCommandHandler = new RemoveComponentCommandHandler(
      componentRemovedEventStore,
      core.eventBus,
      componentRemovedProjector,
    );
    const removeComponentGateway = new LocalRemoveComponentGateway(
      removeComponentCommandHandler,
      componentRemovedProjector,
    );

    return {
      removeComponentController: new RemoveComponentController(
        removeComponentGateway,
      ),
    };
  }

  private buildAddDecisionFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const decisionAddedEventStore = new FsDecisionAddedEventStore(
      core.projectDataDir,
      core.logger,
    );

    const addDecisionCommandHandler = new AddDecisionCommandHandler(
      decisionAddedEventStore,
      core.eventBus,
    );
    const addDecisionGateway = new LocalAddDecisionGateway(
      addDecisionCommandHandler,
    );

    return {
      addDecisionController: new AddDecisionController(addDecisionGateway),
    };
  }

  private buildGetDecisionsFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const getDecisionsGateway = new LocalGetDecisionsGateway(
      new SqliteDecisionViewReader(core.db),
    );

    return {
      getDecisionsController: new GetDecisionsController(getDecisionsGateway),
    };
  }

  private buildShowDecisionFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const showDecisionGateway = new LocalShowDecisionGateway(
      new SqliteDecisionViewReader(core.db),
    );

    return {
      showDecisionController: new ShowDecisionController(showDecisionGateway),
    };
  }

  private buildSearchDecisionsFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const searchDecisionsGateway = new LocalSearchDecisionsGateway(
      new SqliteDecisionViewReader(core.db),
    );

    return {
      searchDecisionsController: new SearchDecisionsController(
        searchDecisionsGateway,
      ),
    };
  }

  private buildReverseDecisionFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const decisionReversedEventStore = new FsDecisionReversedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const decisionReversedProjector = new SqliteDecisionReversedProjector(
      core.db,
    );

    const reverseDecisionCommandHandler = new ReverseDecisionCommandHandler(
      decisionReversedEventStore,
      decisionReversedProjector,
      core.eventBus,
    );
    const reverseDecisionGateway = new LocalReverseDecisionGateway(
      reverseDecisionCommandHandler,
    );

    return {
      reverseDecisionController: new ReverseDecisionController(
        reverseDecisionGateway,
      ),
    };
  }

  private buildRemoveDecisionFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const decisionRemovedEventStore = new FsDecisionRemovedEventStore(
      core.projectDataDir,
      core.logger,
    );

    const removeDecisionCommandHandler = new RemoveDecisionCommandHandler(
      decisionRemovedEventStore,
      new SqliteDecisionViewReader(core.db),
      core.eventBus,
    );
    const removeDecisionGateway = new LocalRemoveDecisionGateway(
      removeDecisionCommandHandler,
    );

    return {
      removeDecisionController: new RemoveDecisionController(
        removeDecisionGateway,
      ),
    };
  }

  private buildRestoreDecisionFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const decisionRestoredEventStore = new FsDecisionRestoredEventStore(
      core.projectDataDir,
      core.logger,
    );
    const decisionRestoredProjector = new SqliteDecisionRestoredProjector(
      core.db,
    );

    const restoreDecisionCommandHandler = new RestoreDecisionCommandHandler(
      decisionRestoredEventStore,
      decisionRestoredProjector,
      core.eventBus,
    );
    const restoreDecisionGateway = new LocalRestoreDecisionGateway(
      restoreDecisionCommandHandler,
    );

    return {
      restoreDecisionController: new RestoreDecisionController(
        restoreDecisionGateway,
      ),
    };
  }

  private buildSupersedeDecisionFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const decisionSupersededEventStore = new FsDecisionSupersededEventStore(
      core.projectDataDir,
      core.logger,
    );
    const decisionSupersededProjector =
      new SqliteDecisionSupersededProjector(core.db);

    const supersedeDecisionCommandHandler =
      new SupersedeDecisionCommandHandler(
        decisionSupersededEventStore,
        decisionSupersededProjector,
        core.eventBus,
      );
    const supersedeDecisionGateway = new LocalSupersedeDecisionGateway(
      supersedeDecisionCommandHandler,
    );

    return {
      supersedeDecisionController: new SupersedeDecisionController(
        supersedeDecisionGateway,
      ),
    };
  }

  private buildUpdateDecisionFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const decisionUpdatedEventStore = new FsDecisionUpdatedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const decisionUpdatedProjector = new SqliteDecisionUpdatedProjector(
      core.db,
    );

    const updateDecisionCommandHandler = new UpdateDecisionCommandHandler(
      decisionUpdatedEventStore,
      decisionUpdatedProjector,
      core.eventBus,
    );
    const updateDecisionGateway = new LocalUpdateDecisionGateway(
      updateDecisionCommandHandler,
    );

    return {
      updateDecisionController: new UpdateDecisionController(
        updateDecisionGateway,
      ),
    };
  }

  private buildDependencyViewFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    return {
      dependencyViewReader: new SqliteDependencyViewReader(core.db),
    };
  }

  private buildAddDependencyFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const dependencyAddedEventStore = new FsDependencyAddedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const dependencyAddedProjector = new SqliteDependencyAddedProjector(
      core.db,
    );

    const addDependencyCommandHandler = new AddDependencyCommandHandler(
      dependencyAddedEventStore,
      core.eventBus,
      dependencyAddedProjector,
    );
    const addDependencyGateway = new LocalAddDependencyGateway(
      addDependencyCommandHandler,
    );

    return {
      addDependencyController: new AddDependencyController(
        addDependencyGateway,
      ),
    };
  }

  private buildGetDependenciesFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const getDependenciesGateway = new LocalGetDependenciesGateway(
      new SqliteDependencyViewReader(core.db),
    );

    return {
      getDependenciesController: new GetDependenciesController(
        getDependenciesGateway,
      ),
    };
  }

  private buildUpdateDependencyFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const dependencyUpdatedEventStore = new FsDependencyUpdatedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const dependencyUpdatedProjector = new SqliteDependencyUpdatedProjector(
      core.db,
    );

    const updateDependencyCommandHandler = new UpdateDependencyCommandHandler(
      dependencyUpdatedEventStore,
      dependencyUpdatedEventStore,
      dependencyUpdatedProjector,
      core.eventBus,
    );
    const updateDependencyGateway = new LocalUpdateDependencyGateway(
      updateDependencyCommandHandler,
      dependencyUpdatedProjector,
    );

    return {
      updateDependencyController: new UpdateDependencyController(
        updateDependencyGateway,
      ),
    };
  }

  private buildRemoveDependencyFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const dependencyRemovedEventStore = new FsDependencyRemovedEventStore(
      core.projectDataDir,
      core.logger,
    );
    const dependencyRemovedProjector = new SqliteDependencyRemovedProjector(
      core.db,
    );

    const removeDependencyCommandHandler = new RemoveDependencyCommandHandler(
      dependencyRemovedEventStore,
      dependencyRemovedEventStore,
      dependencyRemovedProjector,
      core.eventBus,
    );
    const removeDependencyGateway = new LocalRemoveDependencyGateway(
      removeDependencyCommandHandler,
      dependencyRemovedProjector,
    );

    return {
      removeDependencyController: new RemoveDependencyController(
        removeDependencyGateway,
      ),
    };
  }

  private buildSearchDependenciesFeature(): Partial<LeafContainer> {
    const core = this.coreInfra();

    const searchDependenciesGateway = new LocalSearchDependenciesGateway(
      new SqliteDependencyViewReader(core.db),
    );

    return {
      searchDependenciesController: new SearchDependenciesController(
        searchDependenciesGateway,
      ),
    };
  }
}
