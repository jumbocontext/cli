import { BaseAggregate, AggregateState } from "../BaseAggregate.js";
import { UUID } from "../BaseEvent.js";
import { GoalId } from "./GoalId.js";
import { ValidationRuleSet } from "../validation/ValidationRule.js";
import { GoalEvent, GoalAddedEvent, GoalRefinedEvent, GoalStartedEvent, GoalUpdatedEvent, GoalBlockedEvent, GoalUnblockedEvent, GoalCompletedEvent, GoalResetEvent, GoalRemovedEvent, GoalPausedEvent, GoalPostponedEvent, GoalResumedEvent, GoalProgressUpdatedEvent, GoalSubmittedForReviewEvent, GoalQualifiedEvent, GoalRefinementStartedEvent, GoalCommittedEvent, GoalRejectedEvent, GoalSubmittedEvent, GoalCodifyingStartedEvent, GoalClosedEvent, GoalApprovedEvent, GoalStatusMigratedEvent } from "./EventIndex.js";
import { GoalEventType, GoalStatus, GoalStatusType, WAITING_STATES, IN_PROGRESS_STATES, TERMINAL_STATES, DETERMINISTIC_RESET_TARGETS } from "./Constants.js";
import { GoalPausedReasonsType } from "./GoalPausedReasons.js";
import { OBJECTIVE_RULES } from "./rules/ObjectiveRules.js";
import { TITLE_RULES } from "./rules/TitleRules.js";
import { SUCCESS_CRITERIA_RULES } from "./rules/SuccessCriteriaRules.js";
import { SCOPE_RULES } from "./rules/ScopeRules.js";
import { UPDATE_RULES } from "./rules/UpdateRules.js";
import { NOTE_RULES, OPTIONAL_NOTE_RULES } from "./rules/NoteRules.js";
import {
  CanAddRule,
  CanRefineRule,
  CanStartRule,
  CanUpdateRule,
  CanCompleteRule,
  CanResetRule,
  CanBlockRule,
  CanUnblockRule,
  CanPauseRule,
  CanResumeRule,
} from "./rules/StateTransitionRules.js";
import { CanSubmitForReviewRule } from "./rules/CanSubmitForReviewRule.js";
import { CanQualifyRule } from "./rules/CanQualifyRule.js";
import { CanCommitRule } from "./rules/CanCommitRule.js";
import { CanRejectRule } from "./rules/CanRejectRule.js";
import { CanSubmitRule } from "./rules/CanSubmitRule.js";
import { CanCodifyRule } from "./rules/CanCodifyRule.js";
import { CanCloseRule } from "./rules/CanCloseRule.js";
import { CanPostponeRule } from "./rules/CanPostponeRule.js";

// Domain state: business properties + aggregate metadata
export interface GoalState extends AggregateState {
  id: GoalId;
  title: string;
  objective: string;
  successCriteria: string[];
  scopeIn: string[];
  scopeOut: string[];
  status: GoalStatusType;
  version: number;
  note?: string;  // Optional: populated when blocked or completed
  reviewIssues?: string;  // Optional: populated when rejected with review findings
  progress: string[];  // Tracks completed sub-tasks (append-only)
  nextGoalId?: UUID;
  prerequisiteGoals?: UUID[];
  branch?: string;  // Optional: git branch for multi-agent collaboration
  worktree?: string;  // Optional: git worktree path for multi-agent collaboration
  lastWaitingStatus?: GoalStatusType;  // Tracks the waiting state entered from when transitioning to in-progress
}

export class Goal extends BaseAggregate<GoalState, GoalEvent> {
  private constructor(state: GoalState) {
    super(state);
  }

  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(state: GoalState, event: GoalEvent): void {
    switch (event.type) {
      case GoalEventType.ADDED: {
        const e = event as GoalAddedEvent;
        state.title = e.payload.title;
        state.objective = e.payload.objective;
        state.successCriteria = e.payload.successCriteria;
        state.scopeIn = e.payload.scopeIn;
        state.scopeOut = e.payload.scopeOut;
        state.status = e.payload.status;
        if (e.payload.nextGoalId !== undefined) {
          state.nextGoalId = e.payload.nextGoalId;
        }
        if (e.payload.prerequisiteGoals !== undefined) {
          state.prerequisiteGoals = e.payload.prerequisiteGoals;
        }
        if (e.payload.branch !== undefined) {
          state.branch = e.payload.branch;
        }
        if (e.payload.worktree !== undefined) {
          state.worktree = e.payload.worktree;
        }
        state.version = e.version;
        break;
      }

      case GoalEventType.REFINED: {
        const e = event as GoalRefinedEvent;
        state.status = e.payload.status;  // "refined"
        state.version = e.version;
        break;
      }

      case GoalEventType.REFINEMENT_STARTED: {
        const e = event as GoalRefinementStartedEvent;
        if (WAITING_STATES.has(state.status)) {
          state.lastWaitingStatus = state.status;
        }
        state.status = e.payload.status;  // "in-refinement"
        state.version = e.version;
        break;
      }

      case GoalEventType.COMMITTED: {
        const e = event as GoalCommittedEvent;
        state.status = e.payload.status;  // "refined"
        state.version = e.version;
        break;
      }

      case GoalEventType.STARTED: {
        const e = event as GoalStartedEvent;
        if (WAITING_STATES.has(state.status)) {
          state.lastWaitingStatus = state.status;
        }
        state.status = e.payload.status;  // "doing"
        state.version = e.version;
        break;
      }

      case GoalEventType.UPDATED: {
        const e = event as GoalUpdatedEvent;
        // Only update provided fields (partial update pattern)
        if (e.payload.title !== undefined) {
          state.title = e.payload.title;
        }
        if (e.payload.objective !== undefined) {
          state.objective = e.payload.objective;
        }
        if (e.payload.successCriteria !== undefined) {
          state.successCriteria = e.payload.successCriteria;
        }
        if (e.payload.scopeIn !== undefined) {
          state.scopeIn = e.payload.scopeIn;
        }
        if (e.payload.scopeOut !== undefined) {
          state.scopeOut = e.payload.scopeOut;
        }
        if (e.payload.nextGoalId !== undefined) {
          state.nextGoalId = e.payload.nextGoalId;
        }
        if (e.payload.prerequisiteGoals !== undefined) {
          state.prerequisiteGoals = e.payload.prerequisiteGoals;
        }
        if (e.payload.branch !== undefined) {
          state.branch = e.payload.branch;
        }
        if (e.payload.worktree !== undefined) {
          state.worktree = e.payload.worktree;
        }
        state.version = e.version;
        break;
      }

      case GoalEventType.BLOCKED: {
        const e = event as GoalBlockedEvent;
        state.status = e.payload.status;  // 'blocked'
        state.note = e.payload.note;       // Reason for blocking
        state.version = e.version;
        break;
      }

      case GoalEventType.UNBLOCKED: {
        const e = event as GoalUnblockedEvent;
        state.status = e.payload.status;  // 'unblocked'
        state.note = e.payload.note;       // Optional resolution note
        state.version = e.version;
        break;
      }

      case GoalEventType.PAUSED: {
        const e = event as GoalPausedEvent;
        state.status = e.payload.status;  // 'paused'
        state.note = e.payload.note;       // Optional note about pausing
        state.version = e.version;
        break;
      }

      case GoalEventType.POSTPONED: {
        const e = event as GoalPostponedEvent;
        state.status = e.payload.status;
        state.version = e.version;
        break;
      }

      case GoalEventType.RESUMED: {
        const e = event as GoalResumedEvent;
        state.status = e.payload.status;  // 'doing'
        state.note = e.payload.note;       // Optional note about resuming
        state.version = e.version;
        break;
      }

      case GoalEventType.COMPLETED: {
        const e = event as GoalCompletedEvent;
        state.status = e.payload.status;  // 'completed'
        state.version = e.version;
        break;
      }

      case GoalEventType.RESET: {
        const e = event as GoalResetEvent;
        state.status = e.payload.status;  // Dynamic target waiting state
        state.note = undefined;            // Clear any notes from previous states
        state.reviewIssues = undefined;    // Clear review issues from previous rejection
        state.lastWaitingStatus = undefined; // Clear tracking on reset
        state.version = e.version;
        break;
      }

      case GoalEventType.PROGRESS_UPDATED: {
        const e = event as GoalProgressUpdatedEvent;
        // Append task description to progress array (append-only)
        state.progress.push(e.payload.taskDescription);
        state.version = e.version;
        break;
      }

      case GoalEventType.SUBMITTED_FOR_REVIEW: {
        const e = event as GoalSubmittedForReviewEvent;
        if (WAITING_STATES.has(state.status)) {
          state.lastWaitingStatus = state.status;
        }
        state.status = e.payload.status;  // 'in-review'
        state.version = e.version;
        break;
      }

      case GoalEventType.QUALIFIED: {
        const e = event as GoalQualifiedEvent;
        state.status = e.payload.status;  // 'qualified'
        state.version = e.version;
        break;
      }

      case GoalEventType.REJECTED: {
        const e = event as GoalRejectedEvent;
        state.status = e.payload.status;  // 'rejected'
        // Backward compatibility: legacy persisted events use 'auditFindings'
        state.reviewIssues = e.payload.reviewIssues ?? e.payload.auditFindings;
        state.version = e.version;
        break;
      }

      case GoalEventType.SUBMITTED: {
        const e = event as GoalSubmittedEvent;
        state.status = e.payload.status;  // 'submitted'
        state.version = e.version;
        break;
      }

      case GoalEventType.CODIFYING_STARTED: {
        const e = event as GoalCodifyingStartedEvent;
        if (WAITING_STATES.has(state.status)) {
          state.lastWaitingStatus = state.status;
        }
        state.status = e.payload.status;  // 'codifying'
        state.version = e.version;
        break;
      }

      case GoalEventType.CLOSED: {
        const e = event as GoalClosedEvent;
        state.status = e.payload.status;  // 'done'
        state.version = e.version;
        break;
      }

      case GoalEventType.APPROVED: {
        const e = event as GoalApprovedEvent;
        state.status = e.payload.status;  // 'approved'
        state.version = e.version;
        break;
      }

      case GoalEventType.STATUS_MIGRATED: {
        const e = event as GoalStatusMigratedEvent;
        state.status = e.payload.status;  // new status value after migration
        state.version = e.version;
        break;
      }

      case GoalEventType.REMOVED: {
        const e = event as GoalRemovedEvent;
        // Goal is removed - projection handles this via row deletion
        state.version = e.version;
        break;
      }
    }
  }

  static create(id: GoalId = GoalId.create()): Goal {
    const state: GoalState = {
      id,
      title: "",
      objective: "",
      successCriteria: [],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.TODO,
      version: 0,
      progress: [],
    };
    return new Goal(state);
  }

  /**
   * Rehydrates aggregate state from full event history.
   * Used to rebuild Goal from event store.
   */
  static rehydrate(id: UUID, history: GoalEvent[]): Goal {
    const state: GoalState = {
      id: GoalId.fromLegacy(id),
      title: "",
      objective: "",
      successCriteria: [],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.TODO,
      version: 0,
      progress: [],
    };

    for (const event of history) {
      Goal.apply(state, event);
    }

    return new Goal(state);
  }

  add(
    title: string,
    objective: string,
    successCriteria: string[],
    scopeIn?: string[],
    scopeOut?: string[],
    nextGoalId?: UUID,
    prerequisiteGoals?: UUID[],
    branch?: string,
    worktree?: string
  ): GoalAddedEvent {
    // State validation: goal can only be defined once (version must be 0)
    ValidationRuleSet.ensure(this.state, [new CanAddRule()]);

    // Input validation using rules
    ValidationRuleSet.ensure(title, TITLE_RULES);
    ValidationRuleSet.ensure(objective, OBJECTIVE_RULES);
    ValidationRuleSet.ensure(successCriteria, SUCCESS_CRITERIA_RULES);
    if (scopeIn) ValidationRuleSet.ensure(scopeIn, SCOPE_RULES);
    if (scopeOut) ValidationRuleSet.ensure(scopeOut, SCOPE_RULES);

    // Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.ADDED,
      {
        title,
        objective,
        successCriteria,
        scopeIn: scopeIn || [],
        scopeOut: scopeOut || [],
        status: GoalStatus.TODO,
        ...(nextGoalId && { nextGoalId }),
        ...(prerequisiteGoals && prerequisiteGoals.length > 0 && { prerequisiteGoals }),
        ...(branch && { branch }),
        ...(worktree && { worktree }),
      },
      Goal.apply
    ) as GoalAddedEvent;
  }

  /**
   * Starts refinement of a goal after creation.
   * Transitions status from "defined" to "in-refinement".
   * Acquires a claim for the worker performing refinement.
   *
   * @param claimInfo - Claim information for the worker starting refinement
   * @returns GoalRefinementStartedEvent
   * @throws Error if goal is not in 'defined' status
   */
  refine(claimInfo: {
    claimedBy: string;
    claimedAt: string;
    claimExpiresAt: string;
  }): GoalRefinementStartedEvent {
    // State validation: can only refine from to-do status
    ValidationRuleSet.ensure(this.state, [new CanRefineRule()]);

    // Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.REFINEMENT_STARTED,
      {
        status: GoalStatus.IN_REFINEMENT,
        refinementStartedAt: new Date().toISOString(),
        claimedBy: claimInfo.claimedBy,
        claimedAt: claimInfo.claimedAt,
        claimExpiresAt: claimInfo.claimExpiresAt,
      },
      Goal.apply
    ) as GoalRefinementStartedEvent;
  }

  /**
   * Commits a goal after refinement is complete.
   * Transitions status from "in-refinement" to "refined".
   * Releases the claim held during refinement.
   *
   * @returns GoalCommittedEvent
   * @throws Error if goal is not in 'in-refinement' status
   */
  commit(): GoalCommittedEvent {
    // State validation: can only commit from in-refinement status
    ValidationRuleSet.ensure(this.state, [new CanCommitRule()]);

    // Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.COMMITTED,
      {
        status: GoalStatus.REFINED,
        committedAt: new Date().toISOString(),
      },
      Goal.apply
    ) as GoalCommittedEvent;
  }

  /**
   * Starts a refined goal (begins work).
   * Transitions status from "refined" to "doing".
   * Goal must be refined before starting.
   *
   * @param claimInfo - Optional claim information to embed in the event
   * @returns GoalStarted event
   * @throws Error if goal is blocked, completed, or not yet refined
   */
  start(claimInfo?: {
    claimedBy: string;
    claimedAt: string;
    claimExpiresAt: string;
  }): GoalStartedEvent {
    // State validation using rules
    // Note: CanStartRule allows 'doing' status (idempotent) and 'refined' status
    ValidationRuleSet.ensure(this.state, [new CanStartRule()]);

    // Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.STARTED,
      {
        status: GoalStatus.DOING,
        // Include claim info if provided
        ...(claimInfo && {
          claimedBy: claimInfo.claimedBy,
          claimedAt: claimInfo.claimedAt,
          claimExpiresAt: claimInfo.claimExpiresAt,
        }),
      },
      Goal.apply
    ) as GoalStartedEvent;
  }

  /**
   * Updates goal properties. Only provided fields are updated.
   * @throws Error if goal is completed or no changes provided
   */
  update(
    title?: string,
    objective?: string,
    successCriteria?: string[],
    scopeIn?: string[],
    scopeOut?: string[],
    nextGoalId?: UUID,
    prerequisiteGoals?: UUID[],
    branch?: string,
    worktree?: string
  ): GoalUpdatedEvent {
    // 1. State validation using rules - cannot update completed goals
    ValidationRuleSet.ensure(this.state, [new CanUpdateRule()]);

    // 2. Check if any update is provided (including nextGoalId and prerequisiteGoals)
    const hasNextGoalIdUpdate = nextGoalId !== undefined;
    const hasPrerequisiteGoalsUpdate = prerequisiteGoals !== undefined;
    const hasBranchUpdate = branch !== undefined;
    const hasWorktreeUpdate = worktree !== undefined;

    // 3. Input validation using rules (validates at least one field and validates provided fields)
    // Skip UPDATE_RULES if only metadata fields are being updated
    if (!hasNextGoalIdUpdate && !hasPrerequisiteGoalsUpdate && !hasBranchUpdate && !hasWorktreeUpdate) {
      ValidationRuleSet.ensure(
        { title, objective, successCriteria, scopeIn, scopeOut },
        UPDATE_RULES
      );
    } else if (title || objective || successCriteria || scopeIn || scopeOut) {
      // If both standard fields and chaining fields provided, validate standard fields
      ValidationRuleSet.ensure(
        { title, objective, successCriteria, scopeIn, scopeOut },
        UPDATE_RULES
      );
    }

    // 4. Create and return event
    return this.makeEvent(
      GoalEventType.UPDATED,
      {
        title,
        objective,
        successCriteria,
        scopeIn,
        scopeOut,
        ...(nextGoalId && { nextGoalId }),
        ...(prerequisiteGoals && { prerequisiteGoals }),
        ...(branch !== undefined && { branch }),
        ...(worktree !== undefined && { worktree }),
      },
      Goal.apply
    ) as GoalUpdatedEvent;
  }

  /**
   * Blocks a goal with a reason.
   * Transitions status from "to-do" or "doing" to "blocked".
   *
   * @param note - Reason why the goal is blocked
   * @returns GoalBlocked event
   * @throws Error if goal is already blocked or completed, or if note is invalid
   */
  block(note: string): GoalBlockedEvent {
    // 1. State validation: can only block from to-do or doing status
    ValidationRuleSet.ensure(this.state, [new CanBlockRule()]);

    // 2. Input validation: note must be provided and valid
    ValidationRuleSet.ensure(note, NOTE_RULES);

    // 3. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.BLOCKED,
      {
        status: GoalStatus.BLOCKED,
        note,
      },
      Goal.apply
    ) as GoalBlockedEvent;
  }

  /**
   * Unblocks a goal.
   * Transitions status from "blocked" to "unblocked" (waiting state).
   * The goal must be explicitly started via `goal start` to resume work.
   *
   * @param note - Optional resolution note explaining how the blocker was resolved
   * @returns GoalUnblocked event
   * @throws Error if goal is not blocked, or if note is invalid
   */
  unblock(note?: string): GoalUnblockedEvent {
    // 1. State validation: can only unblock from blocked status
    ValidationRuleSet.ensure(this.state, [new CanUnblockRule()]);

    // 2. Input validation: note is optional but must be valid if provided
    // Sanitize note (trim whitespace, convert empty string to undefined)
    const sanitizedNote = note && note.trim() !== '' ? note.trim() : undefined;

    if (sanitizedNote) {
      ValidationRuleSet.ensure(sanitizedNote, OPTIONAL_NOTE_RULES);
    }

    // 3. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.UNBLOCKED,
      {
        status: GoalStatus.UNBLOCKED,
        note: sanitizedNote,
      },
      Goal.apply
    ) as GoalUnblockedEvent;
  }

  /**
   * Marks the goal as completed. Goal must be in 'doing' or 'blocked' status.
   * @returns GoalCompleted event
   * @throws Error if goal is not yet started or already completed
   */
  complete(): GoalCompletedEvent {
    // State validation using rules
    ValidationRuleSet.ensure(this.state, [new CanCompleteRule()]);

    // Create and return event
    return this.makeEvent(
      GoalEventType.COMPLETED,
      {
        status: GoalStatus.COMPLETED
      },
      Goal.apply
    ) as GoalCompletedEvent;
  }

  /**
   * Resets a goal back to its last waiting state.
   * The target is computed from the state machine:
   * - IN_REFINEMENT → DEFINED
   * - DOING → last waiting state (REFINED, REJECTED, or UNBLOCKED)
   * - IN_REVIEW → SUBMITTED
   * - CODIFYING → APPROVED
   * - DONE → APPROVED
   * Blocked goals cannot be reset. Goals already in waiting states cannot be reset.
   * @returns GoalReset event
   * @throws Error if goal is blocked, already in a waiting state, or target cannot be determined
   */
  reset(): GoalResetEvent {
    // State validation using rules
    ValidationRuleSet.ensure(this.state, [new CanResetRule()]);

    // Compute target status
    const targetStatus = this.computeResetTarget();

    // Create and return event
    return this.makeEvent(
      GoalEventType.RESET,
      {
        status: targetStatus
      },
      Goal.apply
    ) as GoalResetEvent;
  }

  /**
   * Computes the reset target status based on the current state.
   * Uses deterministic mapping for states with single predecessors,
   * and lastWaitingStatus for DOING (which has multiple entry points).
   */
  private computeResetTarget(): GoalStatusType {
    // Check deterministic mapping first (IN_REFINEMENT, IN_REVIEW, CODIFYING, DONE)
    const deterministicTarget = DETERMINISTIC_RESET_TARGETS.get(this.state.status);
    if (deterministicTarget) {
      return deterministicTarget;
    }

    // DOING: use tracked lastWaitingStatus, fall back to REFINED for pre-tracking events
    if (this.state.status === GoalStatus.DOING) {
      return this.state.lastWaitingStatus ?? GoalStatus.REFINED;
    }

    // Fallback (should not be reached if CanResetRule validated correctly)
    return GoalStatus.TODO;
  }

  /**
   * Removes the goal from tracking.
   * The goal's history remains in the event store but will not appear in active queries.
   * @returns GoalRemoved event
   */
  remove(): GoalRemovedEvent {
    // No state validation needed - goals can be removed in any status

    // Create and return event
    return this.makeEvent(
      GoalEventType.REMOVED,
      {
        removedAt: new Date().toISOString()
      },
      Goal.apply
    ) as GoalRemovedEvent;
  }

  /**
   * Pauses a goal.
   * Transitions status from "doing" to "paused".
   *
   * @param reason - Reason why the goal is being paused
   * @param note - Optional additional context about the pause
   * @returns GoalPaused event
   * @throws Error if goal is not in 'doing' status, or if note is invalid
   */
  pause(reason: GoalPausedReasonsType, note?: string): GoalPausedEvent {
    // 1. State validation: can only pause from doing status
    ValidationRuleSet.ensure(this.state, [new CanPauseRule()]);

    // 2. Input validation: note is optional but must be valid if provided
    // Sanitize note (trim whitespace, convert empty string to undefined)
    const sanitizedNote = note && note.trim() !== '' ? note.trim() : undefined;

    if (sanitizedNote) {
      ValidationRuleSet.ensure(sanitizedNote, OPTIONAL_NOTE_RULES);
    }

    // 3. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.PAUSED,
      {
        status: GoalStatus.PAUSED,
        reason,
        note: sanitizedNote,
      },
      Goal.apply
    ) as GoalPausedEvent;
  }

  /**
   * Postpones a defined goal so automatic work selectors ignore it.
   * Transitions status from "defined" to "postponed".
   *
   * @returns GoalPostponedEvent
   * @throws Error if the goal is not in 'defined' status
   */
  postpone(): GoalPostponedEvent {
    ValidationRuleSet.ensure(this.state, [new CanPostponeRule()]);

    return this.makeEvent(
      GoalEventType.POSTPONED,
      { status: GoalStatus.POSTPONED },
      Goal.apply
    ) as GoalPostponedEvent;
  }

  /**
   * Resumes a paused goal.
   * Transitions status from "paused" to "doing".
   *
   * @param note - Optional note explaining the resumption
   * @param claimInfo - Optional claim information to embed in the event
   * @returns GoalResumed event
   * @throws Error if goal is not paused, or if note is invalid
   */
  resume(
    note?: string,
    claimInfo?: {
      claimedBy: string;
      claimedAt: string;
      claimExpiresAt: string;
    }
  ): GoalResumedEvent {
    // 1. State validation: can only resume from paused status
    ValidationRuleSet.ensure(this.state, [new CanResumeRule()]);

    // 2. Input validation: note is optional but must be valid if provided
    // Sanitize note (trim whitespace, convert empty string to undefined)
    const sanitizedNote = note && note.trim() !== '' ? note.trim() : undefined;

    if (sanitizedNote) {
      ValidationRuleSet.ensure(sanitizedNote, OPTIONAL_NOTE_RULES);
    }

    // 3. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.RESUMED,
      {
        status: GoalStatus.DOING,
        note: sanitizedNote,
        // Include claim info if provided
        ...(claimInfo && {
          claimedBy: claimInfo.claimedBy,
          claimedAt: claimInfo.claimedAt,
          claimExpiresAt: claimInfo.claimExpiresAt,
        }),
      },
      Goal.apply
    ) as GoalResumedEvent;
  }

  /**
   * Submits a goal after implementation is complete.
   * Transitions status from "doing" to "submitted".
   * Releases the implementer's claim so a reviewer can pick it up.
   *
   * @returns GoalSubmitted event
   * @throws Error if goal is not in 'doing' status
   */
  submit(): GoalSubmittedEvent {
    // 1. State validation: can only submit from doing status
    ValidationRuleSet.ensure(this.state, [new CanSubmitRule()]);

    // 2. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.SUBMITTED,
      {
        status: GoalStatus.SUBMITTED,
        submittedAt: new Date().toISOString(),
      },
      Goal.apply
    ) as GoalSubmittedEvent;
  }

  /**
   * Submits a goal for QA review.
   * Transitions status from "submitted" to "in-review".
   * Marks the point where QA review begins on a submitted implementation.
   *
   * @returns GoalSubmittedForReview event
   * @throws Error if goal is not in 'submitted' status
   */
  submitForReview(claimInfo?: {
    claimedBy: string;
    claimedAt: string;
    claimExpiresAt: string;
  }): GoalSubmittedForReviewEvent {
    // 1. State validation: can only submit for review from submitted status
    ValidationRuleSet.ensure(this.state, [new CanSubmitForReviewRule()]);

    // 2. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.SUBMITTED_FOR_REVIEW,
      {
        status: GoalStatus.INREVIEW,
        submittedAt: new Date().toISOString(),
        // Include claim info if provided (reviewer claim)
        ...(claimInfo && {
          claimedBy: claimInfo.claimedBy,
          claimedAt: claimInfo.claimedAt,
          claimExpiresAt: claimInfo.claimExpiresAt,
        }),
      },
      Goal.apply
    ) as GoalSubmittedForReviewEvent;
  }

  /**
   * Approves a goal after successful QA review.
   * Transitions status from "in-review" to "approved".
   * Marks the point where a goal has been validated and can proceed to codification.
   *
   * @returns GoalApproved event
   * @throws Error if goal is not in 'in-review' status
   */
  approve(): GoalApprovedEvent {
    // 1. State validation: can only approve from in-review status
    ValidationRuleSet.ensure(this.state, [new CanQualifyRule()]);

    // 2. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.APPROVED,
      {
        status: GoalStatus.QUALIFIED,
        approvedAt: new Date().toISOString(),
      },
      Goal.apply
    ) as GoalApprovedEvent;
  }

  /**
   * @deprecated Use approve() instead. Retained for backward compatibility.
   */
  qualify(): GoalApprovedEvent {
    return this.approve();
  }

  /**
   * Rejects a goal after failed QA review.
   * Transitions status from "in-review" to "rejected".
   * Records review issues describing implementation problems that need fixing.
   * The implementing agent can reference these issues when reworking.
   *
   * @param reviewIssues - Description of implementation problems found during review
   * @returns GoalRejected event
   * @throws Error if goal is not in 'in-review' status or review issues are invalid
   */
  reject(reviewIssues: string): GoalRejectedEvent {
    // 1. State validation: can only reject from in-review status
    ValidationRuleSet.ensure(this.state, [new CanRejectRule()]);

    // 2. Input validation: review issues must be provided and valid
    ValidationRuleSet.ensure(reviewIssues, NOTE_RULES);

    // 3. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.REJECTED,
      {
        status: GoalStatus.REJECTED,
        rejectedAt: new Date().toISOString(),
        reviewIssues,
      },
      Goal.apply
    ) as GoalRejectedEvent;
  }

  /**
   * Starts the codify phase for a goal after approval.
   * Transitions status from "approved" to "codifying".
   * Acquires a claim for the worker performing codification.
   *
   * @param claimInfo - Claim information for the worker starting codification
   * @returns GoalCodifyingStartedEvent
   * @throws Error if goal is not in 'approved' status
   */
  codify(claimInfo: {
    claimedBy: string;
    claimedAt: string;
    claimExpiresAt: string;
  }): GoalCodifyingStartedEvent {
    // State validation: can only codify from approved status
    ValidationRuleSet.ensure(this.state, [new CanCodifyRule()]);

    // Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.CODIFYING_STARTED,
      {
        status: GoalStatus.CODIFYING,
        codifyStartedAt: new Date().toISOString(),
        claimedBy: claimInfo.claimedBy,
        claimedAt: claimInfo.claimedAt,
        claimExpiresAt: claimInfo.claimExpiresAt,
      },
      Goal.apply
    ) as GoalCodifyingStartedEvent;
  }

  /**
   * Closes a goal after codification is complete.
   * Transitions status from "codifying" to "done".
   * Releases the claim held during codification.
   *
   * @returns GoalClosedEvent
   * @throws Error if goal is not in 'codifying' status
   */
  close(): GoalClosedEvent {
    // State validation: can only close from codifying status
    ValidationRuleSet.ensure(this.state, [new CanCloseRule()]);

    // Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.CLOSED,
      {
        status: GoalStatus.DONE,
        closedAt: new Date().toISOString(),
      },
      Goal.apply
    ) as GoalClosedEvent;
  }

  /**
   * Records progress on the goal by appending a task description.
   * Progress is append-only - completed sub-tasks cannot be removed.
   *
   * @param taskDescription - Description of the completed sub-task
   * @returns GoalProgressUpdated event
   * @throws Error if taskDescription is empty or too long
   */
  updateProgress(taskDescription: string): GoalProgressUpdatedEvent {
    // Input validation: taskDescription must be provided and valid
    const trimmed = taskDescription?.trim();
    if (!trimmed) {
      throw new Error("Task description is required");
    }
    if (trimmed.length > 500) {
      throw new Error("Task description must be less than 500 characters");
    }

    // Create and return event
    return this.makeEvent(
      GoalEventType.PROGRESS_UPDATED,
      {
        taskDescription: trimmed,
      },
      Goal.apply
    ) as GoalProgressUpdatedEvent;
  }
}
