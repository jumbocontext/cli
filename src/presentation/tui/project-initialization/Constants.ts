import { AudiencePriority } from "../../../domain/audiences/Constants.js";
import { WizardFieldKind } from "../wizard/WizardConstants.js";

export const InitFlowStage = {
  project: "project",
  audienceGate: "audience-gate",
  audience: "audience",
  valueGate: "value-gate",
  value: "value",
  agentSelection: "agent-selection",
  confirmation: "confirmation",
  success: "success",
} as const;

export type InitFlowStage =
  (typeof InitFlowStage)[keyof typeof InitFlowStage];

export const InitFlowRollback = {
  audience: "audience",
  valueProposition: "value-proposition",
  plan: "plan",
} as const;

export type InitFlowRollback =
  (typeof InitFlowRollback)[keyof typeof InitFlowRollback];

export const InitFlowFieldKey = {
  projectName: "projectName",
  purpose: "purpose",
  addAudience: "addAudience",
  audienceName: "audienceName",
  audienceDescription: "audienceDescription",
  audiencePriority: "audiencePriority",
  addAnotherAudience: "addAnotherAudience",
  addValueProposition: "addValueProposition",
  valueTitle: "valueTitle",
  valueDescription: "valueDescription",
  valueBenefit: "valueBenefit",
  valueMeasurableOutcome: "valueMeasurableOutcome",
  addAnotherValueProposition: "addAnotherValueProposition",
  selectedAgentIds: "selectedAgentIds",
  confirmInitialization: "confirmInitialization",
} as const;

export const InitFlowFieldKind = {
  yesNo: WizardFieldKind.YES_NO,
  singleSelect: WizardFieldKind.SINGLE_SELECT,
  multiSelect: WizardFieldKind.MULTI_SELECT,
} as const;

export const InitFlowYesNoValue = {
  yes: "yes",
  yesShort: "y",
  no: "no",
  noShort: "n",
} as const;

export const InitFlowValidationCopy = {
  yesNo: "Enter yes or no",
  audiencePriority: "Enter primary, secondary, or tertiary",
  agentSelectionRequired: "Select at least one agent",
  unknownAgentId: "Unknown agent id",
} as const;

export const InitFlowControllerErrorCopy = {
  requiredPlan:
    "Project initialization planning is unavailable. Restart Jumbo and try again.",
  requiredInit:
    "Project initialization is unavailable. Restart Jumbo and try again.",
  requiredAudience:
    "Audience registration is unavailable. Restart Jumbo and try again.",
  requiredValueProposition:
    "Value proposition registration is unavailable. Restart Jumbo and try again.",
  requiredProjectDetails:
    "Project details are required before initialization.",
} as const;

export const InitFlowCopy = {
  title: "Initialize Project",
  success: "Project initialized successfully.",
  projectNameTitle: "Project Name",
  projectNameDescription:
    "What is your project called? This name will appear in context packets served to coding agents.",
  projectNameLabel: "Project name",
  projectNamePlaceholder: "e.g. Jumbo",
  purposeTitle: "Purpose",
  purposeDescription:
    "Describe the purpose of your project. What problem does it solve? This helps agents understand the north-star.",
  purposeLabel: "Project purpose",
  purposePlaceholder: "e.g. Context management for LLM coding agents",
  audiencesTitle: "Audiences",
  audiencesDescription:
    "Who are the primary audiences for your project? Understanding your users helps agents make better decisions.",
  addAudienceLabel: "Add an audience?",
  audienceNameLabel: "Audience name",
  audienceNamePlaceholder: "e.g. Software Developers",
  audienceDescriptionLabel: "Audience description",
  audienceDescriptionPlaceholder:
    "e.g. Developers collaborating with LLM coding agents",
  audiencePriorityLabel: "Audience priority",
  audiencePrimaryLabel: "Primary",
  audienceSecondaryLabel: "Secondary",
  audienceTertiaryLabel: "Tertiary",
  addAnotherAudienceLabel: "Add another audience?",
  valuePropositionsTitle: "Value Propositions",
  valuePropositionsDescription:
    "What value does your project deliver? These propositions guide what capabilities matter most.",
  addValuePropositionLabel: "Add a value proposition?",
  valueTitleLabel: "Value proposition title",
  valueTitlePlaceholder: "e.g. Persistent context across sessions",
  valueDescriptionLabel: "Description",
  valueDescriptionPlaceholder: "e.g. Detailed explanation of the value",
  valueBenefitLabel: "Benefit",
  valueBenefitPlaceholder: "e.g. Agents never lose important project context",
  valueMeasurableOutcomeLabel: "Measurable outcome",
  valueMeasurableOutcomePlaceholder: "optional",
  addAnotherValuePropositionLabel: "Add another value proposition?",
  agentSelectionTitle: "Agent Selection",
  agentSelectionDescription: "Select agents to configure.",
  agentsLabel: "Agents",
  confirmationTitle: "Confirmation",
  confirmInitializationLabel: "Proceed with initialization?",
} as const;

export const InitFlowConfirmationCopy = {
  reviewHintKey: "v",
  reviewHintOpenLabel: "Summary",
  reviewHintClosedLabel: "View files",
  noChangesSummary:
    "No file changes are required. Confirm to initialize project state.",
  noChangesReview: "No file changes are required.",
  summaryLead: "Jumbo will create project memory and configure selected agents.",
  plannedChangesLabel: "Planned changes",
  createLabel: "Create",
  modifyLabel: "Modify",
  existingContentPreserved: "Existing content is preserved.",
  managedConfigurationOnly:
    "Jumbo only creates missing files and appends or updates managed configuration where needed.",
  agentConfigurationLabel: "Agent configuration",
  filesLabel: "files",
  reviewFilesLabel: "Files",
  changeSeparator: " - ",
} as const;

export const InitFlowConfirmationGroupLabel = {
  shared: "Shared",
  claude: "Claude",
  codex: "Codex",
  antigravity: "Antigravity",
  copilot: "Copilot",
  cursor: "Cursor",
  opencode: "OpenCode",
  vibe: "Vibe",
} as const;

export const InitFlowAudiencePriorityOption = {
  primary: {
    value: AudiencePriority.PRIMARY,
    label: InitFlowCopy.audiencePrimaryLabel,
  },
  secondary: {
    value: AudiencePriority.SECONDARY,
    label: InitFlowCopy.audienceSecondaryLabel,
  },
  tertiary: {
    value: AudiencePriority.TERTIARY,
    label: InitFlowCopy.audienceTertiaryLabel,
  },
} as const;
