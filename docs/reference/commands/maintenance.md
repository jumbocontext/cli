---
title: Maintenance Commands Reference
description: Complete reference for projection healing and installation evolution commands.
sidebar:
  order: 15
---

Complete reference for projection healing and full installation evolution commands.

---

## jumbo heal

Rebuild database projections from the event store.

### Synopsis

```bash
> jumbo heal [--yes]
```

### Options

| Option | Description |
|--------|-------------|
| `--yes` | Skip confirmation prompt |

### Behavior

Replays all events from the event store through the event bus, allowing registered projection handlers to reconstruct materialized read model views. Use this when projections have become inconsistent with the underlying event store.

A confirmation prompt is shown unless `--yes` is provided.

### Examples

Rebuild with confirmation prompt:

```bash
> jumbo heal
```

Rebuild without confirmation:

```bash
> jumbo heal --yes
```

---

## jumbo evolve

Update skills, configuration, and database to the current version.

### Synopsis

```bash
> jumbo evolve --yes
```

### Options

| Option | Description |
|--------|-------------|
| `--yes` | Skip confirmation prompt |

### Behavior

Runs the complete installation update workflow in sequence:

1. Apply pending schema migrations
2. Migrate legacy goal statuses from v1 to v2 naming
3. Convert legacy component-coupling dependencies into relations
4. Refresh `AGENTS.md` and managed agent instruction files
5. Sync Jumbo-managed skills from `assets/skills/`
6. Ensure settings files exist and add missing default settings without overwriting user values
7. Refresh managed harness and hook configuration
8. Rebuild database projections from the event store

The command is designed to be idempotent. Re-running it after a successful evolve should not create duplicate events or duplicate relations. Existing `.jumbo/settings.jsonc` files are upgraded additively: missing defaults are inserted, explicit values and unknown entries are preserved, and invalid JSONC fails instead of being partially rewritten. Codex skills are refreshed in `.agents/skills`; obsolete Jumbo-managed copies under `.codex/skills` are removed only when they exactly match the current managed templates, except for explicitly retired skill directories.

The command-discovery skill is now `jumbo-discover-commands`. Evolve removes the retired `jumbo-command-discovery` directory and all its contents, including customizations, from `.agents/skills`, `.claude/skills`, `.vibe/skills`, `.codex/skills`, and `.gemini/skills`. Initialization performs the same retirement cleanup.

### Examples

Evolve the installation to the current CLI version:

```bash
> jumbo evolve --yes
```
