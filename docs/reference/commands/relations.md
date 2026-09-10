---
title: Relation Commands Reference
description: Complete reference for managing relationships between entities in the knowledge graph.
sidebar:
  order: 12
---

Add, list, traverse, find paths through, audit, and remove relationships between entities in the knowledge graph — linking goals, components, decisions, and other entities.

---

## jumbo relation add

Add a relationship between two entities. If an earlier relation with the same source type and ID, target type and ID, and relationship type was removed, adding again creates a new relation with a new ID and the supplied description and strength. The removed relation keeps its original metadata and event history.

Existing non-removed relations retain the usual duplicate behavior: add returns the existing ID without changing metadata or lifecycle status. To replace guidance on an active relation, remove it first, then add the new connection:

```bash
jumbo relation remove --id <oldRelationId>
jumbo relation add --from-type goal --from-id <goalId> --to-type invariant --to-id <invariantId> --type must-respect --description "Respect this constraint within the goal scope" --format json
```

The response contains the new relation ID. Omitted strength becomes `null`, as for any new relation. Use `jumbo relations list --entity-type goal --entity-id <goalId> --status all` to inspect current and removed links. Remove superseded links, such as obsolete `constrained-by` links, explicitly so only the intended guidance contributes to live context.

### Synopsis

```bash
> jumbo relation add --from-type <type> --from-id <id> --to-type <type> --to-id <id> --type <relationType> --description <text> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--from-type <type>` | Source entity type, e.g. `goal`, `component`, `decision` (required) |
| `--from-id <id>` | Source entity ID (required) |
| `--to-type <type>` | Target entity type (required) |
| `--to-id <id>` | Target entity ID (required) |
| `-T, --type <type>` | Relationship type, e.g. `involves`, `uses`, `depends-on` (required) |
| `-d, --description <text>` | Human-readable explanation of the relationship (required) |
| `--strength <level>` | Relationship strength: `strong`, `medium`, `weak` |

### Examples

```bash
# Link a goal to a component
> jumbo relation add \
  --from-type goal --from-id goal_abc123 \
  --to-type component --to-id comp_def456 \
  --type involves \
  --description "Goal modifies this component"

# With strength
> jumbo relation add \
  --from-type component --from-id comp_abc \
  --to-type decision --to-id dec_def \
  --type uses \
  --description "Component follows this decision" \
  --strength strong
```

---

## jumbo relations list

List all knowledge graph relations.

### Synopsis

```bash
> jumbo relations list [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--entity-type <type>` | Filter by entity type, e.g. `goal`, `decision`, `component` |
| `--entity-id <id>` | Filter by entity ID |
| `-d, --direction <direction>` | Filter relative to the entity: `in`, `out`, or `both` (default: `both`) |
| `--relation-type <type>` | Filter by relation type |
| `--related-entity-type <type>` | Filter by the type at the opposite endpoint |
| `--strength <strength>` | Filter by strength: `strong`, `medium`, or `weak` |
| `-s, --status <status>` | Filter by status: `active`, `deactivated`, `removed`, or `all` (default: `active`) |

### Examples

```bash
> jumbo relations list
> jumbo relations list --entity-type goal
> jumbo relations list --entity-type component --entity-id comp_abc123
> jumbo relations list --entity-id comp_abc123 --direction out --relation-type requires
> jumbo relations list --related-entity-type decision --strength strong
> jumbo relations list --status all
```

---

## jumbo relations traverse

Traverse a bounded portion of the relation graph from one entity. Traversal uses deterministic breadth-first search and preserves every relation's original direction.

### Synopsis

```bash
> jumbo relations traverse --id <id> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | Entity ID at the traversal root (required) |
| `--entity-type <type>` | Root entity type; inferred when the ID identifies one endpoint type |
| `--depth <depth>` | Traversal depth from `1` through `5` (default: `1`) |
| `-d, --direction <direction>` | Traversal direction: `in`, `out`, or `both` (default: `both`) |
| `--relation-type <type>` | Filter by relation type |
| `--related-entity-type <type>` | Filter each expansion by the opposite endpoint type |
| `--strength <strength>` | Filter by strength: `strong`, `medium`, or `weak` |
| `-s, --status <status>` | Filter by status: `active`, `deactivated`, `removed`, or `all` (default: `active`) |
| `--limit <limit>` | Maximum distinct edges from `1` through `1000` (default: `100`) |

If an ID appears under multiple entity types, specify `--entity-type`. Results include the resolved root, distinct nodes with their minimum hop distance, directed edges, reached depth, limit, and truncation state. Text output groups results by hop; `--format json` returns the stable structured graph result.

### Examples

```bash
> jumbo relations traverse --id goal_abc123
> jumbo relations traverse --id goal_abc123 --entity-type goal --depth 3
> jumbo relations traverse --id comp_abc123 --direction out --relation-type requires --limit 250
> jumbo relations traverse --id comp_abc123 --depth 2 --format json
```

---

## jumbo relations path

Find one deterministic, unweighted shortest path between two relation endpoints. The query uses bounded breadth-first search, preserves each relation's original direction and description, and treats strength as filter metadata rather than path cost.

### Synopsis

```bash
> jumbo relations path --from-id <id> --to-id <id> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--from-id <id>` | Starting entity ID (required) |
| `--to-id <id>` | Destination entity ID (required) |
| `--from-type <type>` | Starting entity type; inferred when the ID identifies one endpoint type |
| `--to-type <type>` | Destination entity type; inferred when the ID identifies one endpoint type |
| `--max-depth <depth>` | Maximum path depth from `1` through `5` (default: `5`) |
| `-d, --direction <direction>` | Traversal direction: `in`, `out`, or `both` (default: `both`) |
| `--relation-type <type>` | Filter by relation type |
| `--entity-type <type>` | Filter each traversed opposite endpoint by entity type |
| `--strength <strength>` | Filter by strength: `strong`, `medium`, or `weak` |
| `-s, --status <status>` | Filter by status: `active`, `deactivated`, `removed`, or `all` (default: `active`) |

If either ID appears under multiple entity types, specify its matching type option. A disconnected pair is a successful query with `found: false` and empty path data. Text output renders typed endpoint IDs with arrows that retain original relation orientation; `--format json` returns resolved endpoints, hop count, ordered nodes and edges, and query metadata.

### Examples

```bash
> jumbo relations path --from-type goal --from-id goal_abc123 --to-type dependency --to-id dep_def456
> jumbo relations path --from-id goal_abc123 --to-id comp_def456 --direction out --max-depth 3
> jumbo relations path --from-id goal_abc123 --to-id comp_def456 --relation-type involves --strength strong
> jumbo relations path --from-id goal_abc123 --to-id comp_def456 --format json
```

---

## jumbo relations audit

Audit relation graph integrity and coverage without modifying relations, projections, or events. By default, the command runs every check.

### Synopsis

```bash
> jumbo relations audit [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-c, --check <checks...>` | Run one or more checks: `dangling`, `isolated`, `inactive-only`, `ambiguous-id`, or `summary` |
| `--entity-type <type>` | Filter findings and summary data by relation endpoint entity type |

The checks report active relations with missing typed endpoints, current entities without an active relation, current entities connected only by inactive relations, IDs shared by multiple entity types, and counts grouped by entity type, relation type, strength, and status. Only explicitly removed projection records are treated as non-current; deprecated, resolved, completed, ended, and deactivated entities remain auditable context.

Text output uses stable check headings and typed entity IDs. `--format json` returns the requested checks, filter, summary, finding collections, and counts as one structured result.

### Examples

```bash
> jumbo relations audit
> jumbo relations audit --check dangling isolated
> jumbo relations audit --check summary --entity-type component
> jumbo relations audit --format json
```

---

## jumbo relation remove

Remove a relation from the knowledge graph.

### Synopsis

```bash
> jumbo relation remove --id <id> [--reason <text>]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the relation to remove (required) |
| `-r, --reason <text>` | Reason for removing the relation |

### Examples

```bash
> jumbo relation remove --id rel_abc123
> jumbo relation remove --id rel_abc123 --reason "Relationship no longer relevant"
```
