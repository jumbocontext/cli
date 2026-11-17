import type { BootContainer } from "./BootContainer.js";
import type { IEventBus } from "../messaging/IEventBus.js";
import type { PlanProjectInitController } from "../context/project/init/PlanProjectInitController.js";
import type { InitializeProjectController } from "../context/project/init/InitializeProjectController.js";
import type { AddAudienceController } from "../context/audiences/add/AddAudienceController.js";
import type { AddAudiencePainController } from "../context/audience-pains/add/AddAudiencePainController.js";
import type { AddValuePropositionController } from "../context/value-propositions/add/AddValuePropositionController.js";
import type { GetValuePropositionsController } from "../context/value-propositions/get/GetValuePropositionsController.js";
import type { UpdateValuePropositionController } from "../context/value-propositions/update/UpdateValuePropositionController.js";
import type { RemoveValuePropositionController } from "../context/value-propositions/remove/RemoveValuePropositionController.js";
import type { GetTelemetryStatusController } from "../context/telemetry/get/GetTelemetryStatusController.js";
import type { UpdateTelemetryConsentController } from "../context/telemetry/update/UpdateTelemetryConsentController.js";
import type { ICliVersionReader } from "../cli-metadata/query/ICliMetadataReader.js";
import type { ShowProjectController } from "../context/project/show/ShowProjectController.js";
import type { ProjectStatsController } from "../../application/context/project/stats/ProjectStatsController.js";
import type { UpdateProjectController } from "../context/project/update/UpdateProjectController.js";
import type { AddGoalController } from "../context/goals/add/AddGoalController.js";
import type { UpdateGoalController } from "../context/goals/update/UpdateGoalController.js";
import type { UpdateGoalProgressController } from "../context/goals/update-progress/UpdateGoalProgressController.js";
import type { ResumeGoalController } from "../context/goals/resume/ResumeGoalController.js";
import type { IComponentViewReader } from "../context/components/get/IComponentViewReader.js";
import type { ShowGoalController } from "../context/goals/get/ShowGoalController.js";
import type { GetGoalsController } from "../context/goals/get/GetGoalsController.js";
import type { SessionStartController } from "../context/sessions/start/SessionStartController.js";
import type { EndSessionController } from "../context/sessions/end/EndSessionController.js";
import type { GetSessionsController } from "../context/sessions/get/GetSessionsController.js";
import type { IGoalReader } from "../context/goals/start/IGoalReader.js";
import type { RefineGoalController } from "../context/goals/refine/RefineGoalController.js";
import type { StartGoalController } from "../context/goals/start/StartGoalController.js";
import type { CodifyGoalController } from "../context/goals/codify/CodifyGoalController.js";
import type { CloseGoalController } from "../context/goals/close/CloseGoalController.js";
import type { SubmitGoalController } from "../context/goals/submit/SubmitGoalController.js";
import type { ReviewGoalController } from "../context/goals/review/ReviewGoalController.js";
import type { RejectGoalController } from "../context/goals/reject/RejectGoalController.js";
import type { QualifyGoalController } from "../context/goals/qualify/QualifyGoalController.js";
import type { BlockGoalController } from "../context/goals/block/BlockGoalController.js";
import type { UnblockGoalController } from "../context/goals/unblock/UnblockGoalController.js";
import type { PauseGoalController } from "../context/goals/pause/PauseGoalController.js";
import type { PauseWorkController } from "../context/work/pause/PauseWorkController.js";
import type { ResumeWorkController } from "../context/work/resume/ResumeWorkController.js";
import type { RemoveGoalController } from "../context/goals/remove/RemoveGoalController.js";
import type { ResetGoalController } from "../context/goals/reset/ResetGoalController.js";
import type { PostponeGoalController } from "../context/goals/postpone/PostponeGoalController.js";
import type { ReinstateGoalController } from "../context/goals/reinstate/ReinstateGoalController.js";
import type { CommitGoalController } from "../context/goals/commit/CommitGoalController.js";
import type { IGuidelineViewReader } from "../context/guidelines/get/IGuidelineViewReader.js";
import type { AddGuidelineController } from "../context/guidelines/add/AddGuidelineController.js";
import type { UpdateGuidelineController } from "../context/guidelines/update/UpdateGuidelineController.js";
import type { RemoveGuidelineController } from "../context/guidelines/remove/RemoveGuidelineController.js";
import type { ShowGuidelineController } from "../context/guidelines/show/ShowGuidelineController.js";
import type { GetGuidelinesController } from "../context/guidelines/get/GetGuidelinesController.js";
import type { SearchGuidelinesController } from "../context/guidelines/search/SearchGuidelinesController.js";
import type { IInvariantViewReader } from "../context/invariants/get/IInvariantViewReader.js";
import type { AddInvariantController } from "../context/invariants/add/AddInvariantController.js";
import type { UpdateInvariantController } from "../context/invariants/update/UpdateInvariantController.js";
import type { RemoveInvariantController } from "../context/invariants/remove/RemoveInvariantController.js";
import type { GetInvariantsController } from "../context/invariants/get/GetInvariantsController.js";
import type { SearchInvariantsController } from "../context/invariants/search/SearchInvariantsController.js";
import type { IDecisionViewReader } from "../context/decisions/get/IDecisionViewReader.js";
import type { DefineArchitectureController } from "../context/architecture/define/DefineArchitectureController.js";
import type { UpdateArchitectureController } from "../context/architecture/update/UpdateArchitectureController.js";
import type { GetArchitectureController } from "../context/architecture/get/GetArchitectureController.js";
import type { UpdateAudiencePainController } from "../context/audience-pains/update/UpdateAudiencePainController.js";
import type { GetAudiencePainsController } from "../context/audience-pains/list/GetAudiencePainsController.js";
import type { ListAudiencesController } from "../context/audiences/list/ListAudiencesController.js";
import type { RemoveAudienceController } from "../context/audiences/remove/RemoveAudienceController.js";
import type { UpdateAudienceController } from "../context/audiences/update/UpdateAudienceController.js";
import type { AddComponentController } from "../context/components/add/AddComponentController.js";
import type { GetComponentsController } from "../context/components/list/GetComponentsController.js";
import type { SearchComponentsController } from "../context/components/search/SearchComponentsController.js";
import type { UpdateComponentController } from "../context/components/update/UpdateComponentController.js";
import type { RenameComponentController } from "../context/components/rename/RenameComponentController.js";
import type { ShowComponentController } from "../context/components/show/ShowComponentController.js";
import type { DeprecateComponentController } from "../context/components/deprecate/DeprecateComponentController.js";
import type { UndeprecateComponentController } from "../context/components/undeprecate/UndeprecateComponentController.js";
import type { RemoveComponentController } from "../context/components/remove/RemoveComponentController.js";
import type { AddDecisionController } from "../context/decisions/add/AddDecisionController.js";
import type { GetDecisionsController } from "../context/decisions/get/GetDecisionsController.js";
import type { ShowDecisionController } from "../context/decisions/show/ShowDecisionController.js";
import type { SearchDecisionsController } from "../context/decisions/search/SearchDecisionsController.js";
import type { ReverseDecisionController } from "../context/decisions/reverse/ReverseDecisionController.js";
import type { RemoveDecisionController } from "../context/decisions/remove/RemoveDecisionController.js";
import type { RestoreDecisionController } from "../context/decisions/restore/RestoreDecisionController.js";
import type { SupersedeDecisionController } from "../context/decisions/supersede/SupersedeDecisionController.js";
import type { UpdateDecisionController } from "../context/decisions/update/UpdateDecisionController.js";
import type { IDependencyViewReader } from "../context/dependencies/get/IDependencyViewReader.js";
import type { AddDependencyController } from "../context/dependencies/add/AddDependencyController.js";
import type { GetDependenciesController } from "../context/dependencies/get/GetDependenciesController.js";
import type { UpdateDependencyController } from "../context/dependencies/update/UpdateDependencyController.js";
import type { RemoveDependencyController } from "../context/dependencies/remove/RemoveDependencyController.js";
import type { SearchDependenciesController } from "../context/dependencies/search/SearchDependenciesController.js";
import type { AddRelationController } from "../context/relations/add/AddRelationController.js";
import type { RemoveRelationController } from "../context/relations/remove/RemoveRelationController.js";
import type { GetRelationsController } from "../context/relations/get/GetRelationsController.js";
import type { AuditRelationsController } from "../context/relations/audit/AuditRelationsController.js";
import type { FindRelationPathController } from "../context/relations/path/FindRelationPathController.js";
import type { TraverseRelationsController } from "../context/relations/traverse/TraverseRelationsController.js";
import type { ViewWorkerController } from "../context/host/workers/view/ViewWorkerController.js";
import type { EvolveController } from "../evolve/EvolveController.js";
import type { RebuildDatabaseController } from "../maintenance/db/rebuild/RebuildDatabaseController.js";
import type { SearchIndexRebuildController } from "../context/search/SearchIndexRebuildController.js";
import type { SearchController } from "../context/search/SearchController.js";
import type { ITelemetryClient } from "../telemetry/ITelemetryClient.js";
import type { IGoalStatusReader } from "../context/goals/IGoalStatusReader.js";
import type { GoalClaimPolicy } from "../context/goals/claims/GoalClaimPolicy.js";
import type { IWorkerIdentityReader } from "../host/workers/IWorkerIdentityReader.js";
import type { IGoalCodifyingStartedProjector } from "../context/goals/codify/IGoalCodifyingStartedProjector.js";
import type { IGoalCodifyReader } from "../context/goals/codify/IGoalCodifyReader.js";
import type { IGoalRefinedProjector } from "../context/goals/refine/IGoalRefinedProjector.js";
import type { IGoalRefineReader } from "../context/goals/refine/IGoalRefineReader.js";
import type { ISettingsReader } from "../settings/ISettingsReader.js";
import type { CliUpdateController } from "../cli-metadata/update/CliUpdateController.js";
import type { IProjectContextReader } from "../context/project/query/IProjectContextReader.js";

export interface LeafContainer extends BootContainer {
  eventBus: IEventBus;

  // Host worker feature
  viewWorkerController?: ViewWorkerController;

  // Project initialization feature
  planProjectInitController?: PlanProjectInitController;
  initializeProjectController?: InitializeProjectController;

  // Audience feature
  addAudienceController?: AddAudienceController;

  // Audience pain feature
  addAudiencePainController?: AddAudiencePainController;

  // Value proposition feature
  addValuePropositionController?: AddValuePropositionController;
  getValuePropositionsController?: GetValuePropositionsController;
  updateValuePropositionController?: UpdateValuePropositionController;
  removeValuePropositionController?: RemoveValuePropositionController;

  // Telemetry feature
  getTelemetryStatusController?: GetTelemetryStatusController;
  updateTelemetryConsentController?: UpdateTelemetryConsentController;

  // Show project feature
  showProjectController?: ShowProjectController;

  // Update project feature
  updateProjectController?: UpdateProjectController;

  // Project stats feature
  projectStatsController?: ProjectStatsController;

  // CLI version feature
  cliVersionReader?: ICliVersionReader;

  // Add goal feature
  addGoalController?: AddGoalController;
  updateGoalController?: UpdateGoalController;
  updateGoalProgressController?: UpdateGoalProgressController;

  // Component view feature
  componentViewReader?: IComponentViewReader;

  // Show goal feature
  showGoalController?: ShowGoalController;

  getGoalsController?: GetGoalsController;

  // Session start feature
  sessionStartController?: SessionStartController;

  // Session end feature
  endSessionController?: EndSessionController;

  // Get sessions feature
  getSessionsController?: GetSessionsController;

  // Goal context reader feature
  goalContextReader?: IGoalReader;

  // Refine goal feature
  refineGoalController?: RefineGoalController;

  // Resume goal feature
  resumeGoalController?: ResumeGoalController;

  // Resume work feature
  resumeWorkController?: ResumeWorkController;

  // Start goal feature
  startGoalController?: StartGoalController;

  // Commit goal feature
  commitGoalController?: CommitGoalController;

  // Submit goal feature
  submitGoalController?: SubmitGoalController;

  // Codify goal feature
  codifyGoalController?: CodifyGoalController;

  // Close goal feature
  closeGoalController?: CloseGoalController;

  // Review goal feature
  reviewGoalController?: ReviewGoalController;

  // Reject goal feature
  rejectGoalController?: RejectGoalController;

  // Qualify (approve) goal feature
  qualifyGoalController?: QualifyGoalController;

  // Block goal feature
  blockGoalController?: BlockGoalController;

  // Postpone goal feature
  postponeGoalController?: PostponeGoalController;

  // Remove goal feature
  removeGoalController?: RemoveGoalController;

  // Reset goal feature
  resetGoalController?: ResetGoalController;

  // Pause goal feature
  pauseGoalController?: PauseGoalController;

  // Pause work feature
  pauseWorkController?: PauseWorkController;

  // Unblock goal feature
  unblockGoalController?: UnblockGoalController;

  // Reinstate goal feature
  reinstateGoalController?: ReinstateGoalController;

  // Guideline view feature
  guidelineViewReader?: IGuidelineViewReader;

  // Add guideline feature
  addGuidelineController?: AddGuidelineController;

  // Update guideline feature
  updateGuidelineController?: UpdateGuidelineController;

  // Remove guideline feature
  removeGuidelineController?: RemoveGuidelineController;

  // Show guideline feature
  showGuidelineController?: ShowGuidelineController;

  // Get guidelines feature
  getGuidelinesController?: GetGuidelinesController;

  // Search guidelines feature
  searchGuidelinesController?: SearchGuidelinesController;

  // Invariant view feature
  invariantViewReader?: IInvariantViewReader;

  // Add invariant feature
  addInvariantController?: AddInvariantController;

  // Update invariant feature
  updateInvariantController?: UpdateInvariantController;

  // Remove invariant feature
  removeInvariantController?: RemoveInvariantController;

  // Get invariants feature
  getInvariantsController?: GetInvariantsController;

  // Search invariants feature
  searchInvariantsController?: SearchInvariantsController;

  // Decision view feature
  decisionViewReader?: IDecisionViewReader;

  // Add relation feature
  addRelationController?: AddRelationController;

  // Remove relation feature
  removeRelationController?: RemoveRelationController;

  // Get relations feature
  getRelationsController?: GetRelationsController;

  // Audit relations feature
  auditRelationsController?: AuditRelationsController;

  // Find relation path feature
  findRelationPathController?: FindRelationPathController;

  // Traverse relations feature
  traverseRelationsController?: TraverseRelationsController;

  // Evolve feature
  evolveController?: EvolveController;

  // Rebuild database feature
  rebuildDatabaseController?: RebuildDatabaseController;

  // Search index rebuild feature
  searchIndexRebuildController?: SearchIndexRebuildController;

  // Search feature
  searchController?: SearchController;

  // Define architecture feature
  defineArchitectureController?: DefineArchitectureController;

  // Update architecture feature
  updateArchitectureController?: UpdateArchitectureController;

  // Get architecture feature
  getArchitectureController?: GetArchitectureController;

  // Update audience pain feature
  updateAudiencePainController?: UpdateAudiencePainController;

  // Get audience pains feature
  getAudiencePainsController?: GetAudiencePainsController;

  // List audiences feature
  listAudiencesController?: ListAudiencesController;

  // Remove audience feature
  removeAudienceController?: RemoveAudienceController;

  // Update audience feature
  updateAudienceController?: UpdateAudienceController;

  // Add component feature
  addComponentController?: AddComponentController;

  // Get components feature
  getComponentsController?: GetComponentsController;

  // Search components feature
  searchComponentsController?: SearchComponentsController;

  // Update component feature
  updateComponentController?: UpdateComponentController;

  // Rename component feature
  renameComponentController?: RenameComponentController;

  // Show component feature
  showComponentController?: ShowComponentController;

  // Deprecate component feature
  deprecateComponentController?: DeprecateComponentController;

  // Undeprecate component feature
  undeprecateComponentController?: UndeprecateComponentController;

  // Remove component feature
  removeComponentController?: RemoveComponentController;

  // Add decision feature
  addDecisionController?: AddDecisionController;

  // Get decisions feature
  getDecisionsController?: GetDecisionsController;

  // Show decision feature
  showDecisionController?: ShowDecisionController;

  // Search decisions feature
  searchDecisionsController?: SearchDecisionsController;

  // Reverse decision feature
  reverseDecisionController?: ReverseDecisionController;

  // Remove decision feature
  removeDecisionController?: RemoveDecisionController;

  // Restore decision feature
  restoreDecisionController?: RestoreDecisionController;

  // Supersede decision feature
  supersedeDecisionController?: SupersedeDecisionController;

  // Update decision feature
  updateDecisionController?: UpdateDecisionController;

  // Dependency view feature
  dependencyViewReader?: IDependencyViewReader;

  // Add dependency feature
  addDependencyController?: AddDependencyController;

  // Get dependencies feature
  getDependenciesController?: GetDependenciesController;

  // Update dependency feature
  updateDependencyController?: UpdateDependencyController;

  // Remove dependency feature
  removeDependencyController?: RemoveDependencyController;

  // Search dependencies feature
  searchDependenciesController?: SearchDependenciesController;

  // Telemetry client feature
  telemetryClient?: ITelemetryClient;

  // Goal status reader feature
  goalStatusReader?: IGoalStatusReader;

  // Goal claim policy feature
  goalClaimPolicy?: GoalClaimPolicy;

  // Worker identity reader feature
  workerIdentityReader?: IWorkerIdentityReader;

  // Goal codifying started projector feature
  goalCodifyingStartedProjector?: IGoalCodifyingStartedProjector &
    IGoalCodifyReader;

  // Goal refined projector feature
  goalRefinedProjector?: IGoalRefinedProjector & IGoalRefineReader;

  // Settings reader feature
  settingsReader?: ISettingsReader;

  // CLI update feature
  cliUpdateController?: CliUpdateController;

  // Project context reader feature
  projectContextReader?: IProjectContextReader;
}
