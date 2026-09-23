---
title: Goal Management
description: Understand Jumbo's goal lifecycle — how goals move from definition through refinement, execution, review, and codification.
sidebar:
  order: 2
---

Track work effectively with Jumbo's goal system.

---

## Overview

Goals are the heart of Jumbo's context management. You define what needs to be done, and your agent drives the goal through four phases: **refinement**, **implementation**, **review**, and **codification**. At each transition, Jumbo delivers optimized context packets to your agent containing:

- The goal's objective, criteria, and scope
- Relevant components and dependencies
- Applicable invariants and guidelines
- Recent architectural decisions

---

## Goal phases

| Phase | Description |
|-------|-------------|
| **Define** | You set an objective, criteria, and scope |
| **Refine** | Agent links relevant project knowledge to the goal building the exact context needed to implement the goal |
| **Implement** | Agent implements the goal using curated context |
| **Review** | Agent verifies the implementation against criteria |
| **Codify** | Agent captures new learnings and closes the goal |

---

## Creating goals

Goals are created by you from the terminal. Use the interactive wizard or pass options directly:

```bash
jumbo goal add --interactive
```

```bash
jumbo goal add --title "JWT Auth" --objective "Implement JWT authentication" --criteria "Token generation works" "Token validation works"
```

:::tip[Best practice]
Keep goals small and focused. Keep objectives specific — "Implement JWT auth" not "Work on authentication". Define measurable criteria — "Tests pass" not "It works".
:::

See [goal add reference](../reference/commands/goal.md) for the full list of options.

### Postponing defined goals

Postpone defined work that should remain recorded but should not be selected by automatic work streams:

```bash
jumbo goal postpone --id goal_abc123
```

The goal remains visible in CLI lists and the TUI under the `postponed` status. When the work becomes relevant again, return it to `defined` status and renewed refinement eligibility:

```bash
jumbo goal reinstate --id goal_abc123
```

Only postponed goals can be reinstated. Automatic refinement continues to exclude postponed goals until this explicit transition occurs.

### Prerequisite goals

Goals can declare prerequisites that must be completed before they can start:

```bash
jumbo goal add --objective "Deploy to production" --prerequisite-goals goal_abc123 goal_def456
```

Jumbo enforces that all prerequisite goals reach `submitted` or later status before the dependent goal can start.

### Goal chaining

Link goals in a sequence for multi-step work:

```bash
jumbo goal add --objective "Goal B" --previous-goal goal_abc123
```

When `goal_abc123` completes, Jumbo suggests starting Goal B. Chaining is useful for breaking large efforts into smaller, ordered goals — each one benefits from the learnings codified by its predecessor. The agent that starts Goal B receives context that includes everything captured during Goal A.

---

## Phase 1: Refinement

During refinement, the agent searches Jumbo for project knowledge relevant to the goal — components, decisions, invariants, guidelines, and dependencies — and links them as relations. This curates the context packet that the implementing agent will receive.

When finished, the agent commits the refinement, transitioning the goal to `refined`.

:::tip[Best practice]
Always refine before starting. Curating relations ensures the implementing agent gets precise, relevant context instead of working blind.
:::

---

## Phase 2: Implementation

When a refined goal is started, Jumbo delivers the goal's context packet to the agent. The agent receives the objective, criteria, scope, and all related project knowledge in a single prompt.

During implementation, the agent:

- Implements the goal according to the criteria
- Records progress as sub-tasks are completed
- Pauses the goal if the context window is compressed or work is interrupted
- Resumes from a paused state, reloading context where it left off
- Blocks the goal if progress is impeded by an external factor

When implementation is complete, the agent submits the goal for review.

:::tip[Best practice]
Block rather than abandon. Blocking preserves context for future sessions. When you correct the agent during execution, it should capture the correction as a new guideline or invariant in Jumbo.
:::

---

## Phase 3: Review

During review, the agent verifies each criterion against the implementation. Jumbo delivers the goal's full context — objective, criteria, scope, and related entities — as a QA verification prompt.

If all criteria are met, the agent approves the goal, transitioning it to codification.

If issues are found, the agent registers them and rejects the goal, returning it to execution for rework. The agent then re-implements and re-submits.

:::tip[Best practice]
Always review and codify. The review phase catches deviations; codification captures learnings for future goals.
:::

---

## Phase 4: Codification

After approval, the agent reconciles architectural learnings from the implementation. It reflects on whether the work surfaced new invariants, guidelines, decisions, or components that should be registered with Jumbo.

After codification, the agent closes the goal. If the goal is chained to another, Jumbo suggests the next goal to start.

---

## Resetting a goal

Reset dynamically computes a target state based on where the goal currently is:

```bash
jumbo goal reset --id goal_abc123
```

| Current status | Resets to |
|---------------|-----------|
| `in-refinement` | `defined` |
| `in-review` | `submitted` |
| `codifying` | `approved` |
| `doing` | `lastWaitingStatus` or `refined` |

:::note
For goals in `doing`, the reset target is the last "waiting" status the goal was in before entering execution. If the goal was paused and resumed, it resets to where it was before the pause/resume cycle. If no waiting status was recorded, it resets to `refined`.
:::

---

## Other commands

### View goal details

```bash
jumbo goal show --id goal_abc123
```

### Update a goal

Modify goal properties (partial updates supported):

```bash
jumbo goal update --id goal_abc123 --title "New Title" --objective "Updated objective"
```

### Complete a goal (shortcut)

Skip the review/codification phases:

```bash
jumbo goal complete --id goal_abc123
```

### Remove a goal

```bash
jumbo goal remove --id goal_abc123
```

:::note
Event history is preserved; only the active view is removed.
:::

### List goals

```bash
jumbo goals list
jumbo goals list --status doing
jumbo goals list --status doing,blocked
```

Valid status filters: `defined`, `postponed`, `doing`, `blocked`, `paused`, `refined`, `in-refinement`, `in-review`, `approved`, `done`.

---

## What's next?

- [Goal command reference](../reference/commands/goal.md) — Complete command details
