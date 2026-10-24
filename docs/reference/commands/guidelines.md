---
title: Guideline Commands Reference
description: Complete reference for managing execution guidelines — testing, coding style, process, and more.
sidebar:
  order: 10
---

Define execution guidelines that govern how work is done — coding style, testing practices, process rules, and more.

---

## jumbo guideline add

Add an execution guideline.

### Synopsis

```bash
> jumbo guideline add --category <category> --title <text> --description <text> --rationale <text> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-c, --category <category>` | Category: `testing`, `codingStyle`, `process`, `communication`, `documentation`, `security`, `performance`, `other` (required) |
| `-t, --title <text>` | Guideline title (required) |
| `-d, --description <text>` | Detailed description (required) |
| `--rationale <text>` | Why this guideline is important (required) |
| `--example <paths...>` | Example file paths demonstrating the guideline |

### Examples

```bash
> jumbo guideline add \
  --category testing \
  --title "Unit test isolation" \
  --description "Each unit test must be independent" \
  --rationale "Prevents cascading failures"

# With examples
> jumbo guideline add \
  --category codingStyle \
  --title "Use relative imports" \
  --description "Always use relative paths for local imports" \
  --rationale "Ensures portability" \
  --example "./src/services/UserService.ts" "./src/api/routes.ts"
```

---

## jumbo guidelines list

List all execution guidelines.

### Synopsis

```bash
> jumbo guidelines list [--category <category>]
```

### Options

| Option | Description |
|--------|-------------|
| `-c, --category <category>` | Filter by category: `testing`, `codingStyle`, `process`, `communication`, `documentation`, `security`, `performance`, `other` |

### Examples

```bash
> jumbo guidelines list
> jumbo guidelines list --category testing
> jumbo guidelines list --category codingStyle
```

---

## jumbo guidelines search

Search execution guidelines by category, title, or free-text query.

### Synopsis

```bash
> jumbo guidelines search [--category <category>] [--title <text>] [--query <text>] [--output default|compact]
```

### Options

| Option | Description |
|--------|-------------|
| `-c, --category <category>` | Filter by exact category: `testing`, `codingStyle`, `process`, `communication`, `documentation`, `security`, `performance`, `other` |
| `-t, --title <text>` | Filter by title substring, or use `*` wildcards such as `Output*` or `*Style` |
| `-q, --query <text>` | Free-text search across title, description, rationale, and examples; supports `*` wildcards |
| `-o, --output <output>` | Output detail level: `default` or `compact` |

### Examples

```bash
> jumbo guidelines search --category testing
> jumbo guidelines search --title "Output*"
> jumbo guidelines search --query "stdout" --output compact
> jumbo guidelines search --query "stdout" --format json
```

---

## jumbo guideline show

Retrieve one complete guideline by ID, including removed guidelines. Requires an initialized Jumbo project.

### Synopsis

```bash
> jumbo guideline show --id <guidelineId> [--format text|json]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <guidelineId>` | ID of the guideline to show (required) |
| `--format <format>` | Explicit output format: `text` or `json` |

### Output

By default, terminals receive rich text and non-TTY/piped output receives exactly one JSON object. Explicit `--format text` or `--format json` overrides this default.

JSON is the complete `GuidelineView`, without a wrapper: `guidelineId`, `category`, `title`, `description`, `rationale`, `examples`, `isRemoved`, `removedAt`, `removalReason`, `version`, `createdAt`, and `updatedAt`. No fields or examples are truncated. JSON preserves nulls and empty values; text displays them explicitly as `(null)` and `(empty)`.

Unknown IDs and unexpected failures produce diagnostics on stderr, leave stdout empty, and exit non-zero.

### Examples

```bash
> jumbo guideline show --id guide_abc123
> jumbo guideline show --id guide_abc123 --format json
> jumbo guideline show --id guide_abc123 --format text
```

Related: `jumbo guidelines list`, `jumbo guidelines search`, `jumbo guideline update`.

---

## jumbo guideline update

Update an existing guideline.

### Synopsis

```bash
> jumbo guideline update --id <id> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the guideline to update (required) |
| `-c, --category <category>` | Updated category: `testing`, `codingStyle`, `process`, `communication`, `documentation`, `security`, `performance`, `other` |
| `-t, --title <text>` | Updated title |
| `-d, --description <text>` | Updated description |
| `--rationale <text>` | Updated rationale |
| `--example <paths...>` | Updated example paths (replaces existing) |

### Examples

```bash
> jumbo guideline update --id guide_abc123 --rationale "Aligned with automated linting"
> jumbo guideline update --id guide_abc123 --category security --title "Input validation"
```

---

## jumbo guideline remove

Remove an execution guideline.

### Synopsis

```bash
> jumbo guideline remove --id <id> [--reason <text>]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the guideline to remove (required) |
| `-r, --reason <text>` | Reason for removal |

### Examples

```bash
> jumbo guideline remove --id guide_abc123
> jumbo guideline remove --id guide_abc123 --reason "Superseded by automated linting"
```
