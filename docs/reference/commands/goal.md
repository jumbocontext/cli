---
title: Goal Commands Reference
description: Complete reference for all goal-related commands — definition, refinement, execution, review, codification, and management.
sidebar:
  order: 1
---

Complete reference for all goal-related commands.

---

## jumbo goal add

Define a new goal.

### Synopsis

```bash
> jumbo goal add --objective <text> [options]
> jumbo goal add --interactive
```

### Options

| Option | Description |
|--------|-------------|
| `-t, --title <text>` | Short title for the goal (max 60 characters) |
| `--objective <text>` | What needs to be accomplished (required unless `--interactive`) |
| `--criteria <items...>` | Success criteria (can specify multiple) |
| `--scope-in <items...>` | Components in scope |
| `--scope-out <items...>` | Components explicitly out of scope |
| `--interactive` | Use guided wizard |
| `--next-goal <goalId>` | Chain to another goal after completion |
| `--previous-goal <goalId>` | Chain from another goal to this one |
| `--prerequisite-goals <goalIds...>` | Goal IDs that must be at submitted+ status before this goal can start |
| `--branch <branch>` | Git branch to contain work for this goal (for multi-agent collaboration) |
| `--worktree <worktree>` | Git worktree path to contain work for this goal (for multi-agent collaboration) |

### Examples

```bash
# Create with guided prompts
> jumbo goal add --interactive

# Add with title and criteria
> jumbo goal add --title "JWT Auth" --objective "Implement JWT auth" --criteria "Token generation" "Token validation"

# Add with scope
> jumbo goal add --objective "Refactor UserService" --scope-in UserService AuthMiddleware --scope-out AdminRoutes

# Add with prerequisites
> jumbo goal add --objective "Deploy to prod" --prerequisite-goals goal_abc123 goal_def456
```

---

## jumbo goal refine

Start refinement of a goal — displays details and transitions to `in-refinement`.

### Synopsis

```bash
> jumbo goal refine --id <goalId> [--interactive]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to refine (required) |
| `--interactive` | Guided refinement with prompts to register relations |

### Examples

```bash
> jumbo goal refine --id goal_abc123
> jumbo goal refine --id goal_abc123 --interactive
```

---

## jumbo goal postpone

Postpone a defined goal so it remains visible without entering automatic work-selection streams. This transitions the goal from `defined` to `postponed`.

### Synopsis

```bash
> jumbo goal postpone --id <goalId>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the defined goal to postpone (required) |

### Examples

```bash
> jumbo goal postpone --id goal_abc123
```

:::note
Postponed goals remain available in goal lists and TUI filters. Use `jumbo goal reinstate` when the work should become eligible for refinement again.
:::

---

## jumbo goal reinstate

Return a postponed goal to `defined` status so it becomes eligible for refinement again.

### Synopsis

```bash
> jumbo goal reinstate --id <goalId>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the postponed goal to reinstate (required) |

### Examples

```bash
> jumbo goal reinstate --id goal_abc123
```

Only postponed goals can be reinstated. Other source statuses are rejected without changing the goal.

---

## jumbo goal commit

Commit a goal after refinement is complete — transitions from `in-refinement` to `refined`.

### Synopsis

```bash
> jumbo goal commit --id <goalId> [--continue]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to commit (required) |
| `-c, --continue` | Output next-step as a directive instead of informational guidance |

### Examples

```bash
> jumbo goal commit --id goal_abc123
> jumbo goal commit --id goal_abc123 --continue
```

---

## jumbo goal start

Start a refined goal — transitions from `refined` to `doing` and delivers the goal context packet.

### Synopsis

```bash
> jumbo goal start --id <goalId>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to start (required) |

### Notes

- Prerequisite goals must be at `submitted` or later status before starting
- Delivers the goal's full context packet to the agent

### Examples

```bash
> jumbo goal start --id goal_abc123
```

---

## jumbo goal pause

Pause an active goal — transitions from `doing` to `paused`.

### Synopsis

```bash
> jumbo goal pause --id <goalId> --reason <reason> [--note <text>]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to pause (required) |
| `-r, --reason <reason>` | Reason for pausing: `ContextCompressed`, `WorkPaused`, `Other` (required) |
| `-N, --note <text>` | Additional context about the pause |

### Examples

```bash
> jumbo goal pause --id goal_abc123 --reason ContextCompressed
> jumbo goal pause --id goal_abc123 --reason Other --note "Need to switch priorities"
```

---

## jumbo goal resume

Resume work on a goal — transitions `paused` to `doing`, or reloads context if already `doing`.

### Synopsis

```bash
> jumbo goal resume --id <goalId> [--note <text>]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to resume (required) |
| `-N, --note <text>` | Note about resumption (only used when transitioning from paused) |

### Examples

```bash
> jumbo goal resume --id goal_abc123
> jumbo goal resume --id goal_abc123 --note "Ready to continue"
```

---

## jumbo goal block

Mark a goal as blocked with a reason.

### Synopsis

```bash
> jumbo goal block --id <goalId> --note <reason>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to block (required) |
| `-N, --note <reason>` | Why the goal is blocked (required) |

### Examples

```bash
> jumbo goal block --id goal_abc123 --note "Waiting for API credentials"
```

---

## jumbo goal unblock

Unblock a goal and resume work.

### Synopsis

```bash
> jumbo goal unblock --id <goalId> [--note <resolution>]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to unblock (required) |
| `-N, --note <resolution>` | How the blocker was resolved (optional) |

### Examples

```bash
> jumbo goal unblock --id goal_abc123
> jumbo goal unblock --id goal_abc123 --note "API credentials received"
```

---

## jumbo goal submit

Submit a goal after implementation is complete — transitions from `doing` to `submitted`.

### Synopsis

```bash
> jumbo goal submit --id <goalId> [--continue]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to submit (required) |
| `-c, --continue` | Output next-step as a directive instead of informational guidance |

### Examples

```bash
> jumbo goal submit --id goal_abc123
> jumbo goal submit --id goal_abc123 --continue
```

---

## jumbo goal review

Start QA review on a submitted goal — transitions from `submitted` to `in-review` and delivers the QA verification prompt.

### Synopsis

```bash
> jumbo goal review --id <goalId>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to review (required) |

### Examples

```bash
> jumbo goal review --id goal_abc123
```

---

## jumbo goal approve

Approve a goal after successful QA review — transitions from `in-review` to `approved`.

### Synopsis

```bash
> jumbo goal approve --id <goalId> [--continue]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to approve (required) |
| `-c, --continue` | Output next-step as a directive instead of informational guidance |

### Examples

```bash
> jumbo goal approve --id goal_abc123
> jumbo goal approve --id goal_abc123 --continue
```

## jumbo goal reject

Reject a goal after failed QA review — transitions from `in-review` back to `doing`.

### Synopsis

```bash
> jumbo goal reject --id <goalId> --audit-findings <findings> [--continue]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to reject (required) |
| `-a, --audit-findings <findings>` | Description of implementation problems that need fixing (required) |
| `-c, --continue` | Output next-step as a directive instead of informational guidance |

### Examples

```bash
> jumbo goal reject --id goal_abc123 --audit-findings "Missing error handling in API endpoint"
> jumbo goal reject --id goal_abc123 --audit-findings "Missing tests" --continue
```

---

## jumbo goal codify

Start the codification phase on an approved goal — transitions from `approved` to `codifying`. Prompts for architectural reconciliation.

### Synopsis

```bash
> jumbo goal codify --id <goalId>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to codify (required) |

### Examples

```bash
> jumbo goal codify --id goal_abc123
```

---

## jumbo goal close

Close a goal after codification is complete — transitions from `codifying` to `done`.

### Synopsis

```bash
> jumbo goal close --id <goalId> [--continue]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to close (required) |
| `-c, --continue` | Output next-step as a directive instead of informational guidance |

### Examples

```bash
> jumbo goal close --id goal_abc123
> jumbo goal close --id goal_abc123 --continue
```

---

## jumbo goal reset

Reset a goal back to its last waiting state. The target is computed dynamically based on the current status.

### Synopsis

```bash
> jumbo goal reset --id <goalId>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to reset (required) |

### Reset targets

| Current status | Resets to |
|---------------|-----------|
| `in-refinement` | `defined` |
| `in-review` | `submitted` |
| `codifying` | `approved` |
| `doing` | `lastWaitingStatus` or `refined` |

For goals in `doing`, the reset target is the last "waiting" status before entering execution. This handles pause/resume cycles correctly — a resume does not overwrite the original entry point.

### Examples

```bash
> jumbo goal reset --id goal_abc123
```

---

## jumbo goal update

Update an existing goal's properties. Partial updates are supported — only specified fields change.

### Synopsis

```bash
> jumbo goal update --id <goalId> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to update (required) |
| `-t, --title <text>` | Updated title (max 60 characters) |
| `--objective <text>` | Updated objective |
| `--criteria <items...>` | Updated success criteria |
| `--scope-in <items...>` | Updated in-scope items |
| `--scope-out <items...>` | Updated out-of-scope items |
| `--next-goal <goalId>` | Update the next goal chain |
| `--prerequisite-goals <goalIds...>` | Update prerequisite goal IDs |
| `--branch <branch>` | Update the git branch for this goal (for multi-agent collaboration) |
| `--worktree <worktree>` | Update the git worktree path for this goal (for multi-agent collaboration) |

### Examples

```bash
> jumbo goal update --id goal_abc123 --title "New Title"
> jumbo goal update --id goal_abc123 --objective "Updated goal" --scope-in "Component A"
> jumbo goal update --id goal_abc123 --prerequisite-goals goal_def456
```

---

## jumbo goal update-progress

Append a task description to a goal's progress log.

### Synopsis

```bash
> jumbo goal update-progress --id <goalId> --task-description <text>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal (required) |
| `--task-description <text>` | Description of the completed sub-task (required) |

### Examples

```bash
> jumbo goal update-progress --id goal_abc123 --task-description "Implemented user login form"
```

---

## jumbo goal show

Display full goal details, including recorded progress entries.

### Synopsis

```bash
> jumbo goal show --id <goalId>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to show (required) |

### Examples

```bash
> jumbo goal show --id goal_abc123
```

---

## jumbo goal remove

Remove a goal from active tracking. Event history is preserved; only the active view is removed.

### Synopsis

```bash
> jumbo goal remove --id <goalId>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <goalId>` | ID of the goal to remove (required) |

### Examples

```bash
> jumbo goal remove --id goal_abc123
```

---

## jumbo goals list

List goals filtered by status.

### Synopsis

```bash
> jumbo goals list [--status <statuses>]
```

### Options

| Option | Description |
|--------|-------------|
| `-s, --status <statuses>` | Filter by status (comma-separated) |

### Valid status values

`defined`, `doing`, `blocked`, `paused`, `refined`, `in-refinement`, `in-review`, `approved`, `done`

### Examples

```bash
# List all active goals
> jumbo goals list

# List only goals in progress
> jumbo goals list --status doing

# List doing and blocked goals
> jumbo goals list --status doing,blocked
```
