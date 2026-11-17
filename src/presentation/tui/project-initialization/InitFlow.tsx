import React, { useMemo, useState } from "react";
import { Box, Text } from "ink";
import { Wizard } from "../wizard/Wizard.js";
import type { WizardInputKey, WizardStepDefinition } from "../wizard/Wizard.js";
import { ActionDispatcher } from "../action-dispatch/ActionDispatcher.js";
import type { RequestController } from "../action-dispatch/RequestController.js";
import type { PlanProjectInitRequest } from "../../../application/context/project/init/PlanProjectInitRequest.js";
import type { PlanProjectInitResponse } from "../../../application/context/project/init/PlanProjectInitResponse.js";
import type { InitializeProjectRequest } from "../../../application/context/project/init/InitializeProjectRequest.js";
import type { ILogger } from "../../../application/logging/ILogger.js";
import type { InitializeProjectResponse } from "../../../application/context/project/init/InitializeProjectResponse.js";
import type { AddAudienceRequest } from "../../../application/context/audiences/add/AddAudienceRequest.js";
import type { AddAudienceResponse } from "../../../application/context/audiences/add/AddAudienceResponse.js";
import type { AddValuePropositionRequest } from "../../../application/context/value-propositions/add/AddValuePropositionRequest.js";
import type { AddValuePropositionResponse } from "../../../application/context/value-propositions/add/AddValuePropositionResponse.js";
import type { AgentId } from "../../../application/context/project/init/AgentSelection.js";
import type { PlannedFileChange } from "../../../application/context/project/init/PlannedFileChange.js";
import { SemanticColors } from "../../shared/DesignTokens.js";
import { AudiencePriority } from "../../../domain/audiences/Constants.js";
import {
  InitFlowAudiencePriorityOption,
  InitFlowConfirmationCopy,
  InitFlowConfirmationGroupLabel,
  InitFlowControllerErrorCopy,
  InitFlowCopy,
  InitFlowFieldKey,
  InitFlowFieldKind,
  InitFlowRollback,
  InitFlowStage,
  InitFlowValidationCopy,
  InitFlowYesNoValue,
} from "./Constants.js";
import type {
  InitFlowRollback as InitFlowRollbackValue,
  InitFlowStage as InitFlowStageValue,
} from "./Constants.js";

interface InitFlowStageHistoryEntry {
  readonly stage: InitFlowStageValue;
  readonly restoreStepIndex: number;
  readonly rollback?: InitFlowRollbackValue;
}

const INIT_FLOW_STAGES_WITH_AGENT_SELECTION: readonly InitFlowStageValue[] = [
  InitFlowStage.project,
  InitFlowStage.audienceGate,
  InitFlowStage.audience,
  InitFlowStage.valueGate,
  InitFlowStage.value,
  InitFlowStage.agentSelection,
  InitFlowStage.confirmation,
] as const;

const INIT_FLOW_STAGES_WITHOUT_AGENT_SELECTION: readonly InitFlowStageValue[] = [
  InitFlowStage.project,
  InitFlowStage.audienceGate,
  InitFlowStage.audience,
  InitFlowStage.valueGate,
  InitFlowStage.value,
  InitFlowStage.confirmation,
] as const;
const CONFIRMATION_FILE_REVIEW_PAGE_SIZE = 10;

interface ProjectDetails {
  readonly name: string;
  readonly purpose: string | undefined;
}

export interface InitFlowActionControllers {
  readonly planProjectInitController?: RequestController<
    PlanProjectInitRequest,
    PlanProjectInitResponse
  >;
  readonly initializeProjectController?: RequestController<
    InitializeProjectRequest,
    InitializeProjectResponse
  >;
  readonly addAudienceController?: RequestController<
    AddAudienceRequest,
    AddAudienceResponse
  >;
  readonly addValuePropositionController?: RequestController<
    AddValuePropositionRequest,
    AddValuePropositionResponse
  >;
}

interface InitFlowProps {
  readonly actionControllers?: InitFlowActionControllers;
  readonly onComplete: (values: Record<string, string>) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly logger?: ILogger;
}

const PROJECT_STEPS: readonly WizardStepDefinition[] = [
  {
    title: InitFlowCopy.projectNameTitle,
    description: InitFlowCopy.projectNameDescription,
    fields: [
      {
        key: InitFlowFieldKey.projectName,
        label: InitFlowCopy.projectNameLabel,
        placeholder: InitFlowCopy.projectNamePlaceholder,
      },
    ],
  },
  {
    title: InitFlowCopy.purposeTitle,
    description: InitFlowCopy.purposeDescription,
    fields: [
      {
        key: InitFlowFieldKey.purpose,
        label: InitFlowCopy.purposeLabel,
        placeholder: InitFlowCopy.purposePlaceholder,
        required: false,
      },
    ],
  },
] as const;

const AUDIENCE_GATE_STEPS: readonly WizardStepDefinition[] = [
  {
    title: InitFlowCopy.audiencesTitle,
    description: InitFlowCopy.audiencesDescription,
    fields: [
      {
        key: InitFlowFieldKey.addAudience,
        label: InitFlowCopy.addAudienceLabel,
        kind: InitFlowFieldKind.yesNo,
        defaultValue: InitFlowYesNoValue.no,
        required: false,
        validate: validateOptionalYesNo,
      },
    ],
  },
] as const;

const AUDIENCE_STEPS: readonly WizardStepDefinition[] = [
  {
    title: InitFlowCopy.audiencesTitle,
    description: InitFlowCopy.audiencesDescription,
    fields: [
      {
        key: InitFlowFieldKey.audienceName,
        label: InitFlowCopy.audienceNameLabel,
        placeholder: InitFlowCopy.audienceNamePlaceholder,
      },
      {
        key: InitFlowFieldKey.audienceDescription,
        label: InitFlowCopy.audienceDescriptionLabel,
        placeholder: InitFlowCopy.audienceDescriptionPlaceholder,
      },
      {
        key: InitFlowFieldKey.audiencePriority,
        label: InitFlowCopy.audiencePriorityLabel,
        kind: InitFlowFieldKind.singleSelect,
        options: [
          InitFlowAudiencePriorityOption.primary,
          InitFlowAudiencePriorityOption.secondary,
          InitFlowAudiencePriorityOption.tertiary,
        ],
        defaultValue: AudiencePriority.PRIMARY,
        validate: validateAudiencePriority,
      },
      {
        key: InitFlowFieldKey.addAnotherAudience,
        label: InitFlowCopy.addAnotherAudienceLabel,
        kind: InitFlowFieldKind.yesNo,
        defaultValue: InitFlowYesNoValue.no,
        required: false,
        validate: validateOptionalYesNo,
      },
    ],
  },
] as const;

const VALUE_GATE_STEPS: readonly WizardStepDefinition[] = [
  {
    title: InitFlowCopy.valuePropositionsTitle,
    description: InitFlowCopy.valuePropositionsDescription,
    fields: [
      {
        key: InitFlowFieldKey.addValueProposition,
        label: InitFlowCopy.addValuePropositionLabel,
        kind: InitFlowFieldKind.yesNo,
        defaultValue: InitFlowYesNoValue.no,
        required: false,
        validate: validateOptionalYesNo,
      },
    ],
  },
] as const;

const VALUE_STEPS: readonly WizardStepDefinition[] = [
  {
    title: InitFlowCopy.valuePropositionsTitle,
    description: InitFlowCopy.valuePropositionsDescription,
    fields: [
      {
        key: InitFlowFieldKey.valueTitle,
        label: InitFlowCopy.valueTitleLabel,
        placeholder: InitFlowCopy.valueTitlePlaceholder,
      },
      {
        key: InitFlowFieldKey.valueDescription,
        label: InitFlowCopy.valueDescriptionLabel,
        placeholder: InitFlowCopy.valueDescriptionPlaceholder,
      },
      {
        key: InitFlowFieldKey.valueBenefit,
        label: InitFlowCopy.valueBenefitLabel,
        placeholder: InitFlowCopy.valueBenefitPlaceholder,
      },
      {
        key: InitFlowFieldKey.valueMeasurableOutcome,
        label: InitFlowCopy.valueMeasurableOutcomeLabel,
        placeholder: InitFlowCopy.valueMeasurableOutcomePlaceholder,
        required: false,
      },
      {
        key: InitFlowFieldKey.addAnotherValueProposition,
        label: InitFlowCopy.addAnotherValuePropositionLabel,
        kind: InitFlowFieldKind.yesNo,
        defaultValue: InitFlowYesNoValue.no,
        required: false,
        validate: validateOptionalYesNo,
      },
    ],
  },
] as const;

const INIT_FLOW_STAGE_STEP_COUNTS: Readonly<
  Record<InitFlowStageValue, number>
> = {
  [InitFlowStage.project]: PROJECT_STEPS.length,
  [InitFlowStage.audienceGate]: AUDIENCE_GATE_STEPS.length,
  [InitFlowStage.audience]: AUDIENCE_STEPS.length,
  [InitFlowStage.valueGate]: VALUE_GATE_STEPS.length,
  [InitFlowStage.value]: VALUE_STEPS.length,
  [InitFlowStage.agentSelection]: 1,
  [InitFlowStage.confirmation]: 1,
  [InitFlowStage.success]: 0,
};

export function InitFlow({
  actionControllers = {},
  onComplete,
  onCancel,
  logger,
}: InitFlowProps): React.ReactElement {
  const [stage, setStage] = useState<InitFlowStageValue>(InitFlowStage.project);
  const [stageHistory, setStageHistory] = useState<
    InitFlowStageHistoryEntry[]
  >([]);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(
    null,
  );
  const [audiences, setAudiences] = useState<AddAudienceRequest[]>([]);
  const [valuePropositions, setValuePropositions] = useState<
    AddValuePropositionRequest[]
  >([]);
  const [planResponse, setPlanResponse] =
    useState<PlanProjectInitResponse | null>(null);
  const [selectedAgentIds, setSelectedAgentIds] = useState<
    readonly AgentId[] | undefined
  >(undefined);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [restoreStepIndex, setRestoreStepIndex] = useState(0);
  const [confirmationReviewOpen, setConfirmationReviewOpen] = useState(false);
  const [confirmationReviewOffset, setConfirmationReviewOffset] = useState(0);

  const agentSelectionSteps = useMemo(
    () => buildAgentSelectionSteps(planResponse),
    [planResponse],
  );
  const confirmationSteps = useMemo(
    () =>
      buildConfirmationSteps(
        planResponse?.plannedChanges ?? [],
        confirmationReviewOpen,
        confirmationReviewOffset,
      ),
    [confirmationReviewOffset, confirmationReviewOpen, planResponse],
  );

  const navigateToStage = (
    nextStage: InitFlowStageValue,
    rollback?: InitFlowRollbackValue,
  ) => {
    setStageHistory((current) => [
      ...current,
      {
        stage,
        restoreStepIndex: Math.max(INIT_FLOW_STAGE_STEP_COUNTS[stage] - 1, 0),
        rollback,
      },
    ]);
    setStage(nextStage);
    setRestoreStepIndex(0);
  };

  const handleWizardBack = () => {
    const previousEntry = stageHistory[stageHistory.length - 1];
    if (previousEntry === undefined) {
      return;
    }
    setStageHistory(stageHistory.slice(0, -1));
    applyRollback(previousEntry.rollback);
    setStage(previousEntry.stage);
    setRestoreStepIndex(previousEntry.restoreStepIndex);
  };

  const applyRollback = (rollback: InitFlowRollbackValue | undefined) => {
    if (rollback === InitFlowRollback.audience) {
      setAudiences((current) => current.slice(0, -1));
      return;
    }

    if (rollback === InitFlowRollback.valueProposition) {
      setValuePropositions((current) => current.slice(0, -1));
      return;
    }

    if (rollback === InitFlowRollback.plan) {
      setPlanResponse(null);
      setSelectedAgentIds(undefined);
      setConfirmationReviewOpen(false);
      setConfirmationReviewOffset(0);
    }
  };

  const handleProjectConfirm = async (values: Record<string, string>) => {
    const nextProjectDetails = {
      name: values[InitFlowFieldKey.projectName].trim(),
      purpose: (values[InitFlowFieldKey.purpose] ?? "").trim() || undefined,
    };
    setProjectDetails(nextProjectDetails);
    navigateToStage(InitFlowStage.audienceGate);
  };

  const handleAudienceGateConfirm = (values: Record<string, string>) => {
    navigateToStage(
      isYes(values[InitFlowFieldKey.addAudience] ?? "")
        ? InitFlowStage.audience
        : InitFlowStage.valueGate,
    );
  };

  const handleAudienceConfirm = (values: Record<string, string>) => {
    setAudiences((current) => [
      ...current,
      {
        name: values[InitFlowFieldKey.audienceName].trim(),
        description: values[InitFlowFieldKey.audienceDescription].trim(),
        priority: toAudiencePriority(values[InitFlowFieldKey.audiencePriority]),
      },
    ]);
    navigateToStage(
      isYes(values[InitFlowFieldKey.addAnotherAudience] ?? "")
        ? InitFlowStage.audience
        : InitFlowStage.valueGate,
      InitFlowRollback.audience,
    );
  };

  const handleValueGateConfirm = async (values: Record<string, string>) => {
    if (isYes(values[InitFlowFieldKey.addValueProposition] ?? "")) {
      navigateToStage(InitFlowStage.value);
      return;
    }

    await planProjectInit(undefined, InitFlowRollback.plan);
  };

  const handleValueConfirm = async (values: Record<string, string>) => {
    const nextValuePropositions = [
      ...valuePropositions,
      {
        title: values[InitFlowFieldKey.valueTitle].trim(),
        description: values[InitFlowFieldKey.valueDescription].trim(),
        benefit: values[InitFlowFieldKey.valueBenefit].trim(),
        measurableOutcome:
          (values[InitFlowFieldKey.valueMeasurableOutcome] ?? "").trim().length === 0
            ? undefined
            : values[InitFlowFieldKey.valueMeasurableOutcome].trim(),
      },
    ];
    setValuePropositions(nextValuePropositions);

    if (isYes(values[InitFlowFieldKey.addAnotherValueProposition] ?? "")) {
      navigateToStage(InitFlowStage.value, InitFlowRollback.valueProposition);
      return;
    }

    await planProjectInit(undefined, InitFlowRollback.valueProposition);
  };

  const handleAgentSelectionConfirm = async (values: Record<string, string>) => {
    const parsedAgentIds = parseAgentSelection(
      values[InitFlowFieldKey.selectedAgentIds] ?? "",
    );
    setSelectedAgentIds(parsedAgentIds);
    await planProjectInit(parsedAgentIds);
  };

  const handleWizardInput = (input: string, key: WizardInputKey): boolean => {
    if (stage !== InitFlowStage.confirmation) {
      return false;
    }

    const plannedChanges = planResponse?.plannedChanges ?? [];
    if (input.toLowerCase() === InitFlowConfirmationCopy.reviewHintKey) {
      setConfirmationReviewOpen((isOpen) => !isOpen);
      setConfirmationReviewOffset(0);
      return true;
    }

    if (!confirmationReviewOpen) {
      return false;
    }

    if (key.upArrow) {
      setConfirmationReviewOffset((offset) => Math.max(offset - 1, 0));
      return true;
    }

    if (key.downArrow) {
      setConfirmationReviewOffset((offset) =>
        Math.min(
          offset + 1,
          Math.max(plannedChanges.length - CONFIRMATION_FILE_REVIEW_PAGE_SIZE, 0),
        ),
      );
      return true;
    }

    return false;
  };

  const handleConfirmationConfirm = async (values: Record<string, string>) => {
    if (isExplicitNo(values[InitFlowFieldKey.confirmInitialization] ?? "")) {
      onCancel();
      return;
    }

    await initializeProject();
  };

  const planProjectInit = async (
    nextSelectedAgentIds: readonly AgentId[] | undefined,
    rollback?: InitFlowRollbackValue,
  ) => {
    const controller = actionControllers.planProjectInitController;
    if (controller === undefined) {
      setDispatchError(InitFlowControllerErrorCopy.requiredPlan);
      return;
    }

    setWorking(true);
    setDispatchError(null);
    const result = await ActionDispatcher.dispatch(controller, {
      projectRoot: process.cwd(),
      selectedAgentIds: nextSelectedAgentIds,
    });
    setWorking(false);

    if (!result.ok) {
      setDispatchError(result.error.message);
      return;
    }

    setPlanResponse(result.response);
    if (
      nextSelectedAgentIds === undefined &&
      result.response.availableAgents.length > 0
    ) {
      navigateToStage(InitFlowStage.agentSelection, rollback);
    } else {
      navigateToStage(InitFlowStage.confirmation, rollback);
    }
  };

  const initializeProject = async () => {
    if (projectDetails === null) {
      setDispatchError(InitFlowControllerErrorCopy.requiredProjectDetails);
      return;
    }
    const initializeController = actionControllers.initializeProjectController;
    if (initializeController === undefined) {
      setDispatchError(InitFlowControllerErrorCopy.requiredInit);
      return;
    }

    setWorking(true);
    setDispatchError(null);
    const initResult = await ActionDispatcher.dispatch(initializeController, {
      name: projectDetails.name,
      purpose: projectDetails.purpose,
      projectRoot: process.cwd(),
      selectedAgentIds,
    });

    if (!initResult.ok) {
      setWorking(false);
      logger?.error("Project initialization failed", initResult.error);
      setDispatchError(initResult.error.message);
      return;
    }

    const primitiveResult = await persistCollectedPrimitives(
      actionControllers,
      audiences,
      valuePropositions,
    );
    setWorking(false);

    if (!primitiveResult.ok) {
      logger?.error("Post-initialization persistence failed", primitiveResult.error);
      setDispatchError(primitiveResult.error.message);
      return;
    }

    setStage(InitFlowStage.success);
    await onComplete({
      ...flattenCollectedValues(projectDetails, audiences, valuePropositions),
      projectId: initResult.response.projectId,
    });
  };

  if (stage === InitFlowStage.success) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Text color={SemanticColors.success} bold>
          {InitFlowCopy.success}
        </Text>
      </Box>
    );
  }

  return (
    <Wizard
      title={InitFlowCopy.title}
      steps={resolveSteps(stage, agentSelectionSteps, confirmationSteps)}
      onConfirm={resolveConfirmHandler(stage, {
        handleProjectConfirm,
        handleAudienceGateConfirm,
        handleAudienceConfirm,
        handleValueGateConfirm,
        handleValueConfirm,
        handleAgentSelectionConfirm,
        handleConfirmationConfirm,
      })}
      onCancel={onCancel}
      onBack={stageHistory.length > 0 ? handleWizardBack : undefined}
      initialStepIndex={restoreStepIndex}
      initialValues={resolveInitialValues(stage, projectDetails)}
      dispatchError={dispatchError}
      disabled={working}
      progressLabel={(currentStepIndex) =>
        resolveProgressLabel(stage, planResponse, currentStepIndex)
      }
      extraHints={
        stage === InitFlowStage.confirmation
          ? [
              {
                char: InitFlowConfirmationCopy.reviewHintKey,
                label: confirmationReviewOpen
                  ? InitFlowConfirmationCopy.reviewHintOpenLabel
                  : InitFlowConfirmationCopy.reviewHintClosedLabel,
              },
            ]
          : []
      }
      onInput={handleWizardInput}
    />
  );
}

function resolveSteps(
  stage: InitFlowStageValue,
  agentSelectionSteps: readonly WizardStepDefinition[],
  confirmationSteps: readonly WizardStepDefinition[],
): readonly WizardStepDefinition[] {
  if (stage === InitFlowStage.project) return PROJECT_STEPS;
  if (stage === InitFlowStage.audienceGate) return AUDIENCE_GATE_STEPS;
  if (stage === InitFlowStage.audience) return AUDIENCE_STEPS;
  if (stage === InitFlowStage.valueGate) return VALUE_GATE_STEPS;
  if (stage === InitFlowStage.value) return VALUE_STEPS;
  if (stage === InitFlowStage.agentSelection) return agentSelectionSteps;
  return confirmationSteps;
}

function resolveConfirmHandler(
  stage: InitFlowStageValue,
  handlers: {
    readonly handleProjectConfirm: (values: Record<string, string>) => void;
    readonly handleAudienceGateConfirm: (values: Record<string, string>) => void;
    readonly handleAudienceConfirm: (values: Record<string, string>) => void;
    readonly handleValueGateConfirm: (values: Record<string, string>) => void;
    readonly handleValueConfirm: (values: Record<string, string>) => void;
    readonly handleAgentSelectionConfirm: (
      values: Record<string, string>,
    ) => void;
    readonly handleConfirmationConfirm: (
      values: Record<string, string>,
    ) => void;
  },
): (values: Record<string, string>) => void {
  if (stage === InitFlowStage.project) return handlers.handleProjectConfirm;
  if (stage === InitFlowStage.audienceGate) {
    return handlers.handleAudienceGateConfirm;
  }
  if (stage === InitFlowStage.audience) return handlers.handleAudienceConfirm;
  if (stage === InitFlowStage.valueGate) return handlers.handleValueGateConfirm;
  if (stage === InitFlowStage.value) return handlers.handleValueConfirm;
  if (stage === InitFlowStage.agentSelection) {
    return handlers.handleAgentSelectionConfirm;
  }
  return handlers.handleConfirmationConfirm;
}

function resolveInitialValues(
  stage: InitFlowStageValue,
  projectDetails: ProjectDetails | null,
): Record<string, string> {
  if (stage !== InitFlowStage.project || projectDetails === null) {
    return {};
  }

  return {
    [InitFlowFieldKey.projectName]: projectDetails.name,
    [InitFlowFieldKey.purpose]: projectDetails.purpose ?? "",
  };
}

function buildAgentSelectionSteps(
  planResponse: PlanProjectInitResponse | null,
): readonly WizardStepDefinition[] {
  const availableAgents = planResponse?.availableAgents ?? [];
  return [
    {
      title: InitFlowCopy.agentSelectionTitle,
      description: InitFlowCopy.agentSelectionDescription,
      fields: [
        {
          key: InitFlowFieldKey.selectedAgentIds,
          label: InitFlowCopy.agentsLabel,
          kind: InitFlowFieldKind.multiSelect,
          options: availableAgents.map((agent) => ({
            value: agent.id,
            label: `${agent.name} (${agent.id})`,
          })),
          defaultValue: availableAgents.map((agent) => agent.id).join(","),
          required: false,
          validate: (value) =>
            validateAgentSelection(value, availableAgents.map((agent) => agent.id)),
        },
      ],
    },
  ];
}

function buildConfirmationSteps(
  plannedChanges: readonly PlannedFileChange[],
  reviewOpen: boolean,
  reviewOffset: number,
): readonly WizardStepDefinition[] {
  return [
    {
      title: InitFlowCopy.confirmationTitle,
      description: reviewOpen
        ? formatPlannedChangeReview(plannedChanges, reviewOffset)
        : formatPlannedChangeSummary(plannedChanges),
      fields: [
        {
          key: InitFlowFieldKey.confirmInitialization,
          label: InitFlowCopy.confirmInitializationLabel,
          kind: InitFlowFieldKind.yesNo,
          defaultValue: InitFlowYesNoValue.yes,
          required: false,
          validate: validateOptionalYesNo,
        },
      ],
    },
  ];
}

function resolveProgressLabel(
  stage: InitFlowStageValue,
  planResponse: PlanProjectInitResponse | null,
  currentStepIndex: number,
): string | undefined {
  const stages =
    planResponse !== null && planResponse.availableAgents.length === 0
      ? INIT_FLOW_STAGES_WITHOUT_AGENT_SELECTION
      : INIT_FLOW_STAGES_WITH_AGENT_SELECTION;
  const stageIndex = stages.indexOf(stage);
  if (stageIndex < 0) {
    return undefined;
  }

  const completedSteps = stages
    .slice(0, stageIndex)
    .reduce((total, flowStage) => total + INIT_FLOW_STAGE_STEP_COUNTS[flowStage], 0);
  const totalSteps = stages.reduce(
    (total, flowStage) => total + INIT_FLOW_STAGE_STEP_COUNTS[flowStage],
    0,
  );

  return `${completedSteps + currentStepIndex + 1}/${totalSteps}`;
}

function formatPlannedChangeSummary(
  plannedChanges: readonly PlannedFileChange[],
): string {
  if (plannedChanges.length === 0) {
    return InitFlowConfirmationCopy.noChangesSummary;
  }

  const createCount = plannedChanges.filter((change) => change.action === "create").length;
  const modifyCount = plannedChanges.filter((change) => change.action === "modify").length;
  const groupCounts = summarizePlannedChangeGroups(plannedChanges);

  return [
    InitFlowConfirmationCopy.summaryLead,
    "",
    InitFlowConfirmationCopy.plannedChangesLabel,
    `${InitFlowConfirmationCopy.createLabel}: ${createCount} ${InitFlowConfirmationCopy.filesLabel}`,
    `${InitFlowConfirmationCopy.modifyLabel}: ${modifyCount} ${InitFlowConfirmationCopy.filesLabel}`,
    "",
    InitFlowConfirmationCopy.existingContentPreserved,
    InitFlowConfirmationCopy.managedConfigurationOnly,
    "",
    InitFlowConfirmationCopy.agentConfigurationLabel,
    ...groupCounts.map(
      (group) =>
        `${group.label}: ${group.count} ${InitFlowConfirmationCopy.filesLabel}`,
    ),
  ].join("\n");
}

function formatPlannedChangeReview(
  plannedChanges: readonly PlannedFileChange[],
  reviewOffset: number,
): string {
  if (plannedChanges.length === 0) {
    return InitFlowConfirmationCopy.noChangesReview;
  }

  const visibleChanges = plannedChanges.slice(
    reviewOffset,
    reviewOffset + CONFIRMATION_FILE_REVIEW_PAGE_SIZE,
  );
  const from = reviewOffset + 1;
  const to = reviewOffset + visibleChanges.length;

  return [
    `${InitFlowConfirmationCopy.reviewFilesLabel} ${from}-${to} of ${plannedChanges.length}`,
    "",
    ...visibleChanges.map(
      (change) =>
        `${change.action}: ${change.path}${InitFlowConfirmationCopy.changeSeparator}${change.description}`,
    ),
  ].join("\n");
}

function summarizePlannedChangeGroups(
  plannedChanges: readonly PlannedFileChange[],
): readonly { readonly label: string; readonly count: number }[] {
  const counts = new Map<string, number>();
  for (const change of plannedChanges) {
    const group = classifyPlannedChangeGroup(change.path);
    counts.set(group, (counts.get(group) ?? 0) + 1);
  }

  return [
    InitFlowConfirmationGroupLabel.shared,
    InitFlowConfirmationGroupLabel.claude,
    InitFlowConfirmationGroupLabel.codex,
    InitFlowConfirmationGroupLabel.antigravity,
    InitFlowConfirmationGroupLabel.copilot,
    InitFlowConfirmationGroupLabel.cursor,
    InitFlowConfirmationGroupLabel.vibe,
  ]
    .map((label) => ({ label, count: counts.get(label) ?? 0 }))
    .filter((group) => group.count > 0);
}

function classifyPlannedChangeGroup(path: string): string {
  if (path === "CLAUDE.md" || path.startsWith(".claude/")) {
    return InitFlowConfirmationGroupLabel.claude;
  }
  if (path.startsWith(".codex/")) return InitFlowConfirmationGroupLabel.codex;
  if (path === "GEMINI.md" || path === ".agents/hooks.json" || path.startsWith(".agents/jumbo/")) {
    return InitFlowConfirmationGroupLabel.antigravity;
  }
  if (path.startsWith(".github/")) {
    return InitFlowConfirmationGroupLabel.copilot;
  }
  if (path.startsWith(".cursor/")) return InitFlowConfirmationGroupLabel.cursor;
  if (path.startsWith(".vibe/")) return InitFlowConfirmationGroupLabel.vibe;

  return InitFlowConfirmationGroupLabel.shared;
}

function validateYesNo(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === InitFlowYesNoValue.yes ||
    normalized === InitFlowYesNoValue.yesShort ||
    normalized === InitFlowYesNoValue.no ||
    normalized === InitFlowYesNoValue.noShort
  ) {
    return null;
  }
  return InitFlowValidationCopy.yesNo;
}

function validateOptionalYesNo(value: string): string | null {
  if (value.trim().length === 0) {
    return null;
  }
  return validateYesNo(value);
}

function validateAudiencePriority(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === AudiencePriority.PRIMARY ||
    normalized === AudiencePriority.SECONDARY ||
    normalized === AudiencePriority.TERTIARY
  ) {
    return null;
  }
  return InitFlowValidationCopy.audiencePriority;
}

function validateAgentSelection(
  value: string,
  availableAgentIds: readonly AgentId[],
): string | null {
  const selectedAgentIds = parseAgentSelection(value);
  if (selectedAgentIds.length === 0) {
    return InitFlowValidationCopy.agentSelectionRequired;
  }
  const unknownAgentIds = selectedAgentIds.filter(
    (agentId) => !availableAgentIds.includes(agentId),
  );
  if (unknownAgentIds.length > 0) {
    return `${InitFlowValidationCopy.unknownAgentId}: ${unknownAgentIds.join(", ")}`;
  }
  return null;
}

function parseAgentSelection(value: string): readonly AgentId[] {
  return value
    .split(",")
    .map((agentId) => agentId.trim())
    .filter((agentId) => agentId.length > 0) as readonly AgentId[];
}

function isYes(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === InitFlowYesNoValue.yes ||
    normalized === InitFlowYesNoValue.yesShort
  );
}

function isExplicitNo(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === InitFlowYesNoValue.no ||
    normalized === InitFlowYesNoValue.noShort
  );
}

function toAudiencePriority(value: string): AddAudienceRequest["priority"] {
  return value.trim().toLowerCase() as AddAudienceRequest["priority"];
}

async function persistCollectedPrimitives(
  controllers: InitFlowActionControllers,
  audiences: readonly AddAudienceRequest[],
  valuePropositions: readonly AddValuePropositionRequest[],
): Promise<{ readonly ok: true } | { readonly ok: false; readonly error: Error }> {
  for (const audience of audiences) {
    if (controllers.addAudienceController === undefined) {
      return {
        ok: false,
        error: new Error(InitFlowControllerErrorCopy.requiredAudience),
      };
    }
    const result = await ActionDispatcher.dispatch(
      controllers.addAudienceController,
      audience,
    );
    if (!result.ok) {
      return result;
    }
  }

  for (const valueProposition of valuePropositions) {
    if (controllers.addValuePropositionController === undefined) {
      return {
        ok: false,
        error: new Error(InitFlowControllerErrorCopy.requiredValueProposition),
      };
    }
    const result = await ActionDispatcher.dispatch(
      controllers.addValuePropositionController,
      valueProposition,
    );
    if (!result.ok) {
      return result;
    }
  }

  return { ok: true };
}

function flattenCollectedValues(
  projectDetails: ProjectDetails | null,
  audiences: readonly AddAudienceRequest[],
  valuePropositions: readonly AddValuePropositionRequest[],
): Record<string, string> {
  return {
    [InitFlowFieldKey.projectName]: projectDetails?.name ?? "",
    [InitFlowFieldKey.purpose]: projectDetails?.purpose ?? "",
    audienceCount: String(audiences.length),
    valuePropositionCount: String(valuePropositions.length),
  };
}
