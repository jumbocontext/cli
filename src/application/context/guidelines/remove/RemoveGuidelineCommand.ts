/**
 * RemoveGuidelineCommand
 *
 * Command to mark a guideline as removed.
 */

export interface RemoveGuidelineCommand {
  readonly guidelineId: string;
  readonly reason?: string; // Optional reason for removal
}
