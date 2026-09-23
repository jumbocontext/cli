---
title: What Jumbo Creates
description: Understand every file and directory Jumbo adds to your project after installation and initialization.
sidebar:
  order: 4
---

Understand every file and directory Jumbo adds to your project.

---

## The `.jumbo/` directory

The `.jumbo/` directory is Jumbo's local project memory. Everything Jumbo knows about your project lives here.

```
.jumbo/
├── events/                # Event store (source of truth)
│   ├── <aggregate-uuid>/  # One folder per aggregate
│   │   ├── 000001.ProjectInitialized.json
│   │   ├── 000002.ComponentAddedEvent.json
│   │   └── ...
│   └── ...
├── jumbo.db               # SQLite read projection
├── settings.jsonc         # Project-level configuration
└── logs/
    └── jumbo.log          # Runtime log
```

| File / Directory | Purpose |
|---|---|
| `events/` | Append-only event store organized by aggregate UUID |
| `jumbo.db` | SQLite database used as a CQRS read projection |
| `settings.jsonc` | Project identity and user settings (QA turn limits, claim duration, telemetry, TUI, session preview) |
| `logs/jumbo.log` | Runtime log output |

---

## Agent files

Jumbo creates or updates several files outside `.jumbo/` to integrate with AI coding agents. Writes are idempotent: Jumbo preserves user content, merges JSON hook/settings fragments, dedupes existing Jumbo entries, and refreshes managed skills during repair.

**Instruction files** (project root):

| File | Purpose |
|---|---|
| `JUMBO.md` | Bootstrap-only Jumbo instruction file |
| `AGENTS.md` | Points agents to `JUMBO.md` |
| `CLAUDE.md` | Points Claude Code to `JUMBO.md` |
| `GEMINI.md` | Points Antigravity-compatible Gemini context loading to `JUMBO.md` |
| `.github/copilot-instructions.md` | Points GitHub Copilot to `../JUMBO.md` |
| `.cursor/rules/jumbo.mdc` | Points Cursor to `JUMBO.md` with always-apply rules frontmatter |

`JUMBO.md` tells agents to follow Jumbo command prompts and run `jumbo session start` only when a Jumbo command has not already routed the current task. It does not contain a command catalog, workflow guide, or context-maintenance playbook.

**Settings and hooks:**

| File | Purpose |
|---|---|
| `.claude/settings.json` | Claude Code hooks for session start and compaction |
| `.codex/hooks.json` | Codex hooks using full text for session start and quiet text for compaction |
| `.agents/hooks.json` | Antigravity hooks for session bootstrap |
| `.agents/jumbo/antigravity-hook.mjs` | Antigravity hook runner that returns documented JSON hook envelopes |
| `.github/hooks/hooks.json` | GitHub Copilot hooks for session start |
| `.cursor/hooks.json` | Cursor hook for session start |
| `.opencode/plugins/jumbo.js` | OpenCode plugin that pauses active Jumbo work before compaction, preserves goal context, and resumes afterward |

These hooks load the session router when an agent session begins and preserve work state before supported lifecycle events. OpenCode discovers its project plugin automatically, so Jumbo does not modify `opencode.json` or unrelated files under `.opencode/plugins`.

**Managed skills:**

Jumbo copies workflow and maintenance skills from `assets/skills` into the selected agents' skill directories, including bootstrap/session use, lifecycle hooks, command discovery, context maintenance, and correction capture. Additive initialization does not overwrite existing managed skill directories; repair refreshes Jumbo-managed skills from assets while preserving user-created skills.

Codex and Antigravity skills are installed to `.agents/skills`. Jumbo may remove obsolete Codex skill copies from `.codex/skills` during repair or evolve, but only when the obsolete directory is byte-identical to the current managed template and contains no extra user files.

---

## How the event store works

Jumbo uses **event sourcing** as its persistence model. Every state change — adding a goal, recording a decision, updating a component — is stored as an immutable JSON event file.

Events are organized under `.jumbo/events/` by aggregate UUID:

```
.jumbo/events/
  <uuid>/
    000001.ProjectInitialized.json
    000002.ComponentAddedEvent.json
    000003.ComponentUpdatedEvent.json
```

Each file is **append-only** and **sequentially numbered**. The event files are the single source of truth for all project data.

The SQLite database (`jumbo.db`) is a **CQRS read projection** — a denormalized view rebuilt from events. It exists purely for fast querying. If `jumbo.db` is deleted, it can be reconstructed from the event files.

---

## Version control guidance

The following entry will be added to your `.gitignore`.

```
.jumbo/
```

The `.jumbo/` directory is **local project memory**. It is not yet designed for sharing across team members.

---

## Configuration

Jumbo stores project-level settings in `.jumbo/settings.jsonc`. The file supports comments (JSONC format).
When `jumbo evolve --yes` or settings persistence updates this file, Jumbo preserves explicit values and unknown entries while adding any missing defaults.

Default contents:

```jsonc
{
  // Stable project identity
  "project": {
    // Generated at project initialization and reused for project event streams
    "id": "<generated-uuid>"
  },

  // Quality Assurance settings for goal completion
  "qa": {
    // Default turn limit for QA iterations on goal completion
    // When this limit is reached, the goal is automatically completed
    "defaultTurnLimit": 3
  },

  // Claim settings for goal ownership and concurrency control
  "claims": {
    // Duration in minutes that a goal claim remains valid
    // After this duration, the claim expires and another worker can claim the goal
    "claimDurationMinutes": 30
  },

  // Telemetry consent and anonymous identity settings
  "telemetry": {
    // Whether anonymous usage telemetry is enabled (opt-out model)
    "enabled": true,
    // Anonymous identifier used for telemetry events after consent
    "anonymousId": null,
    // Whether the user has explicitly made a telemetry consent decision
    "consentGiven": false
  },

  // TUI presentation preferences
  "tui": {
    // Whether the Cockpit launchpad welcome panel should be shown
    "showLaunchpadWelcome": true
  },

  // Session workflow preferences
  "session": {
    // Maximum number of available backlog goals to include in session start
    "backlogPreviewSize": 5
  }
}
```

| Setting | Default | Description |
|---|---|---|
| `project.id` | Generated UUID | Stable project aggregate id reused across updates and projection rebuilds |
| `qa.defaultTurnLimit` | `3` | Maximum QA review iterations before auto-completing a goal |
| `claims.claimDurationMinutes` | `30` | How long a goal claim stays valid before expiring |
| `telemetry.enabled` | `true` | Stored telemetry consent preference |
| `telemetry.anonymousId` | `null` | Anonymous telemetry id generated after consent |
| `telemetry.consentGiven` | `false` | Whether the user has explicitly made a telemetry consent decision |
| `tui.showLaunchpadWelcome` | `true` | Whether to show the Cockpit launchpad welcome panel |
| `session.backlogPreviewSize` | `5` | Maximum available backlog goals included in session start |

---

## What's next?

- [Core Concepts](concepts.md) — Understand sessions, goals, context packets, and project knowledge
- [Goal Management](../guides/goal-management.md) — Learn the full goal lifecycle
