/**
 * JSON output structure for hook integration.
 * Must match the hook contract expected by the invoking agent harness.
 */
export interface HookOutput {
  decision: "allow" | "deny" | "modify";
  promptSections: Array<{
    type: string;
    content: unknown;
    annotation?: string;
  }>;
  systemMessage?: string;
}
