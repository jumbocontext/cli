export const SessionInstructionSignal = {
  BROWNFIELD_ONBOARDING: "brownfield-onboarding",
  PAUSED_GOALS_RESUME: "paused-goals-resume",
  GOAL_SELECTION_PROMPT: "goal-selection-prompt",
  ARCHITECTURE_DEPRECATED: "architecture-deprecated",
} as const;

export type SessionInstructionSignalValue =
  (typeof SessionInstructionSignal)[keyof typeof SessionInstructionSignal];
