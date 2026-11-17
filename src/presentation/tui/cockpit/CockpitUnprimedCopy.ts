export const CockpitUnprimedCopy = {
  intro:
    "This looks like an existing project.\nStart by giving Jumbo some project context before adding your first goal.",
  nextStepsHeading: "NEXT STEPS",
  nextSteps: [
    "1. Open another shell in this directory",
    "2. Start AI coding agent (e.g. claude, codex, etc.)",
    "3. Let the agent explore the project and save insights to Jumbo's memory when it asks",
  ],
  agentNudgeNote:
    "Note: You'll need to nudge your agent by prompting 'follow instructions'.",
  skipPrompt: {
    keyChar: "s",
    prefix: "Press ",
    suffix: " to skip this screen for now",
  },
} as const;
