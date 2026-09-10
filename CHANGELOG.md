# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Adding relations after removal**: Adding the same connection again creates a new relation with the supplied guidance while preserving the removed relation and its event history.

## [3.23.0] - 2026-09-06

### Added

- **TUI wizard text editing**: Left and right arrows now move the cursor within text fields. Typing inserts text at the cursor, Backspace removes the preceding character, and Delete removes the following character.

### Changed

- **TUI wizard navigation**: Use `Ctrl+B` to return to the previous step; the left arrow now moves the text cursor. Wizard keyboard hints reflect the new shortcut.
- **Goal scope limits**: Increased the maximum number of items in each goal scope list from 20 to 100.

### Fixed

- **Codex compaction hooks**: Managed PreCompact hooks now run `jumbo work pause --format text --quiet`, preventing Codex 0.153.4 from rejecting the non-TTY `[OK]` success prefix as invalid hook JSON. Initialization and repair migrate the previous bare and text-only managed commands while preserving user hooks and JSONC comments. SessionStart continues delivering full startup and resume context.

## [3.22.0] - 2026-08-25

### Added

- **Decision show command**: Added `jumbo decision show` to display the complete architectural decision record by ID, with text and JSON output formats.

### Fixed

- **Goal review verification**: Managed review instructions now discover and run project-supported verification instead of assuming a specific package manager or ecosystem, preventing unrelated review rejections in nonmatching projects.

## [3.21.0] - 2026-08-18

### Added

- **TUI goal creation result screen**: Cockpit and Goals-screen authoring now show a bounded pending, success, or failure result after submission. Successful results include the created goal ID and remain visible until Enter is pressed; failures retain every entered value for retry or allow cancellation with Escape.

### Fixed

- **TUI goal scope authoring**: Scope-in and scope-out values are now collected as independent repeatable items, preserving spaces, item order, and entered values when navigating backward or forward through the goal wizard.
- **TUI goal authoring layout**: Long objective values now wrap within the bounded goal wizard without expanding its background into horizontal bands, and the input cursor remains after the final wrapped character.

## [3.20.0] - 2026-07-25

### Added

- **Relation graph audits**: Added `jumbo relations audit` with selectable dangling, isolated, inactive-only, ambiguous-ID, and summary checks, optional entity-type filtering, deterministic text output, and a stable structured result for relation coverage diagnostics.

## [3.19.0] - 2026-07-24

### Added

- **Shortest relation paths**: Added `jumbo relations path` with typed or uniquely inferred endpoints, deterministic bounded breadth-first search, direction and relation filters, provenance-preserving text output, and a stable structured result for connected or disconnected memories.

## [3.18.0] - 2026-07-23

### Added

- **Bounded relation traversal**: Added `jumbo relations traverse` with deterministic breadth-first traversal, typed root inference, directed graph semantics, depth and edge limits, relation filters, hop-grouped text output, and stable structured output.

### Changed

- **Relation list filters**: Expanded `jumbo relations list` with direction, relation type, related entity type, strength, and entity ID filters while preserving active-only status as the default.

## [3.17.0] - 2026-07-16

### Changed

- **Domain primitive identities**: Newly created audiences, audience pains, components, decisions, dependencies, goals, guidelines, invariants, projects, relations, sessions, value propositions, and workers now receive domain-owned UUID identities. Existing persisted identifiers remain supported during replay and through CLI operations without migration.

## [3.16.1] - 2026-07-10

### Fixed

- **TUI daemon reliability**: Cockpit refiner, reviewer, and codifier workers now stream bounded activity and errors while running, retain meaningful outcomes and elapsed-time heartbeats, survive navigation between TUI screens, and stop exactly once on request or application shutdown.

## [3.16.0] - 2026-07-09

### Changed

- **Antigravity agent support**: Replaced Gemini CLI initialization and worker-agent support with Antigravity CLI support using the documented `agy` executable, `.agents/skills`, and `.agents/hooks.json` hook surface.

### Removed

- **Gemini agent support**: Removed Gemini as a selectable initialization and worker agent target, including obsolete Gemini settings fragments, configurers, command mappings, and logo assets.
- **Co-located evals project**: Removed the `evals/` directory from this repository; the eval framework now lives in its own repository rather than as a nested npm project here.

## [3.15.0] - 2026-07-08

### Added

- **Rejected goal issues on start**: `jumbo goal start` now renders a "Review Issues" section when restarting a goal that was previously rejected during QA review, instructing the developer to address the issues before resubmitting.

## [3.14.0] - 2026-07-08

### Added

- **Evals validity scenarios**: Added the `null-hypothesis-rate-limiter` and `file-reconstruction-expense-tracker` scenarios to validate the eval harness itself, and `eval scenario create` templates now carry structural assertions through to the created scenario.

### Changed

- **Codex initialization**: `jumbo init`, repair, and `jumbo evolve --yes` now install Codex-managed skills to the documented repository skill location `.agents/skills` while keeping `.codex` limited to Codex hooks/configuration.

### Fixed

- **Codex managed artifact preservation**: Obsolete Jumbo-managed Codex skill copies under `.codex/skills` are removed only when byte-identical to the current managed templates, preserving customized skill content, user files, hook comments, unknown hook settings, and unrelated `.codex` configuration.
- **Evals headless permissions**: The Claude Code eval harness adapter now runs sessions with `--dangerously-skip-permissions`, since headless `-p` runs in isolated temp workdirs have no human to approve tool use and were leaving both A/B arms unable to write files.

## [3.13.0] - 2026-07-07

### Removed

- **Deprecated goal qualification command**: Removed the `jumbo goal qualify` command surface. Use `jumbo goal approve` for successful QA review approvals.

## [3.12.2] - 2026-07-06

### Fixed

- **TUI daemon cleanup**: Exiting or interrupting the TUI now routes daemon subprocess shutdown through the launcher, so cleanup is awaited and failures are surfaced instead of relying on fire-and-forget React unmount cleanup.

## [3.12.1] - 2026-07-05

### Fixed

- **Settings preservation during evolve**: `jumbo evolve --yes` now additively inserts missing `.jumbo/settings.jsonc` defaults without overwriting customized known values or unknown user settings, and invalid JSONC settings files fail clearly instead of being partially rewritten.

## [3.12.0] - 2026-07-04

### Added

- **TUI Mega Menu**: Restored the `m` / `M` footer shortcut and overlay navigation menu, with goal-status menu entries that route directly into filtered Goals views and a Settings placeholder route.
- **TUI Goals browser**: Remodeled the Goals screen into a single-goal browser — up/down arrows move between goals in the active state filter, left/right arrows page through every goal-show section (metadata, objective, note, review issues, success criteria, progress, scope, and related components, dependencies, decisions, invariants, and guidelines). Related-entity sections render each entry as a highlighted name with its description, truncated and paginated to stay within the viewport; related decisions show labeled Context and Rationale fields in full at two per page. The CLI `goal show` output now renders those same labeled decision fields.
- **TUI memory screens**: Remodeled the Decisions, Components, Dependencies, Invariants, and Guidelines screens into a single-entity browser matching the Goals screen — a header shows the screen title and a current/total position indicator, up/down arrows scroll through the memories with wraparound, and a detail pane below renders every attribute of the focused entity in full, unabridged.
- **Evals replication driver (Outcome 5, 2/2)**: `eval run` gained a `--replicate <K>` option (default 1) that runs the A/B comparison K times per harness and aggregates the results into a `ReplicationReport` via `aggregateReplications()`, persisted by `runId` and printed with per-dimension mean lift +/- SD and a SIGNAL/none call. `K < 1` errors; `2 <= K < 5` warns that K>=5 is the minimum for a credible signal. `K=1` leaves existing single-run output unchanged.
- **Evals parallel-replication design**: Added `evals/docs/parallel-replication-design.md`, a design doc for a bounded worker-pool `--concurrency N` primitive (`runWithConcurrency`), concluding parallelism does not bias the measurement since all scored dimensions are artefact/count-based rather than wall-clock, and recommending a default of N=1 given rate-limit contention on non-API agent harnesses.

### Changed

- **Project stats snapshot view**: Decomposed the monolithic `ProjectStatsSnapshotView` interface into focused per-domain view and count types (e.g. `GoalStatsView`, `MemoryStatsView`, `GraphStatsView`, and their constituent `*Count` types), each in its own file under `src/application/context/project/stats/`, with no change to the shape or values the CLI/TUI consume.

### Fixed

- **TUI shortcut ownership**: The restored Mega Menu shortcut now stays disabled while another overlay, drawer, wizard, or text-entry flow owns input.
- **TUI hotkey collisions**: The footer notification drawer moved from `n` to `i`, so `n` on the Goals screen opens only the new-goal authoring flow. While a screen-local form such as the Goals authoring flow is capturing text, all shell-level hotkeys (quit, search, Mega Menu, notification drawer) are suppressed so typed characters never trigger navigation; on an uninitialized project, `i` opens only the init flow.
- **TUI Goals screen authoring**: Submitting the goal authoring flow opened with `n`/`a` on the Goals screen now actually creates the goal — the entered values are dispatched to the add-goal controller and the goals list refreshes so the new goal appears immediately. Failed submissions keep the flow open with the error shown, instead of closing silently.

## [3.11.0] - 2026-06-24

### Added

- **TUI global search**: Press `/` in the TUI to search the projected global memory index interactively, with grouped result metadata and a focused generic detail preview for the current hit.
- **Evals replication statistics (Outcome 5, 1/2)**: Added a pure `aggregateReplications` aggregator that combines K replicated A/B comparisons of the same scenario into a `ReplicationReport`, reporting per-dimension mean lift, sample standard deviation, and a t-statistic against the K=5 one-tailed alpha=0.05 threshold so lift can be reported with statistical confidence instead of single-point estimates. Token-efficiency replications scored N/A are excluded and counted separately.

### Changed

- **Evals token-efficiency equivalence gating (Outcome 4)**: Token efficiency is now reported only when both arms are output-equivalent (both produced every expected file and both reached a structural-assertion score >= 0.8); otherwise it is reported as N/A so the ratio never compares the cost of producing different things. The Jumbo arm's lifecycle adherence rate is now surfaced separately in the protocol-adherence dimension rather than averaged into quality lift, keeping quality scores symmetric across arms.
- **CI**: Upgraded GitHub Actions workflows to Node.js 22 (`actions/checkout` v4 → v7, `actions/setup-node` v4 → v6), clearing the Node.js 20 runner deprecation warning. Contributed by [Allan Kimmer Jensen](https://github.com/Saturate).

## [3.10.1] - 2026-06-22

### Changed

- **Evals A/B scoring (Outcome 4)**: The eval A/B runner now scores the Jumbo arm on structural retention and direct `.jumbo/events/` workspace evidence. A new `jumbo-event-capture` scorer confirms the Jumbo arm registered the expected entities by reading the captured event log directly — independent of any CLI command output — via an explicit, exhaustive memory-kind → domain-event-type map. The `jumbo-contract-smoke` validates that map against the real CLI in CI, so a Jumbo event-type rename fails loudly instead of silently under-counting.
- **README**: Refreshed README copy, added a demo gif (`this-is-jumbo.gif`), and removed the stale `docs/flows/cmd-jumbo-flow.md` flow doc.
- **Internal**: Cleaned up TUI namespace and file names by dropping redundant `Tui` prefixes across the presentation TUI modules (e.g. `TuiApp` → `App`, `TuiStateReader` → `StateReader`, `TuiSubprocessManager` → `SubprocessManager`) and split shared TUI constants into focused modules.

## [3.10.0] - 2026-06-17

### Changed

- **`goal show` output**: `jumbo goal show` now includes recorded goal progress entries in both structured JSON output and the human-readable details view.

## [3.9.2] - 2026-06-16

### Added

- **Co-located evals project**: The eval framework (previously the standalone `jumbocontext/evals` repo) now lives in `evals/` as an independent nested npm project so Jumbo primitives and the evals that exercise them are versioned and tested together. Evals run against Jumbo from source (via a build shim that resolves `jumbo` to `dist/cli.js`) rather than a published binary, eliminating version skew.
- **CI contract guard**: A new `evals` job in `.github/workflows/pr-gate.yml` builds Jumbo from the PR's source and runs the evals plus a contract smoke test (`scripts/jumbo-contract-smoke.mjs`) that exercises the CLI surface the evals depend on (init, decision/component/goal add, JSON list output, and the `.jumbo/events/<seq>.<EventType>.json` layout), so a primitive refactor that breaks the CLI contract fails the PR.

### Changed

- **Internal type safety**: Eliminated explicit TypeScript `any` usage across the codebase and now enforce `@typescript-eslint/no-explicit-any` as an ESLint error.

## [3.9.1] - 2026-06-14

### Fixed

- **Project identity stability**: New project initialization now generates a stable UUID project id, persists it in `.jumbo/settings.jsonc`, and reuses it for project updates and projection rebuilds. Existing projects without a persisted id migrate to their current projected identity.

## [3.9.0] - 2026-06-13

### Added

- **Formalize objectives skill**: New shipped `formalize-objectives` skill that, when a user prompt carries an objective not already defined as a Jumbo goal and the structured process has not been explicitly bypassed, transforms the prompt into a structured objective via `jumbo-design-goal` and `define-jumbo-goals`.

### Changed

- **README**: Refreshed positioning copy with an agent-onboarding hook and a bulleted capabilities list (memory, cross-session continuity, automatic goal specification, extended context windows, concurrent agents, harness/model agnostic), and added a star-history chart.

### Fixed

- **Test stability**: Stabilized TUI application-shell interaction tests and Cockpit launchpad daemon tests.

## [3.8.2] - 2026-06-10

### Changed

- **CI security**: GitHub Actions workflows now pin all actions to full commit SHAs instead of mutable version tags, eliminating supply-chain risk from tag mutation.

## [3.8.1] - 2026-06-10

### Fixed

- **CLI self-upgrade**: npm shim path resolution now normalizes path separators before resolving, fixing self-upgrade detection failures on Windows.

## [3.8.0] - 2026-06-09

### Added

- **TUI package update notification**: Bare `jumbo` launches now check the published npm package version in the background and show an update notification in the TUI drawer when a newer version is available, including safe npm self-upgrade handling and manual update guidance when needed.
- **TUI update preview controls**: Developers can locally preview CLI update availability, in-progress, success, and manual-action states with `JUMBO_CLI_UPDATE_TEST_MODE`, `JUMBO_CLI_UPDATE_TEST_VERSION`, `JUMBO_CLI_UPDATE_TEST_UPGRADE_DELAY_MS`, and `JUMBO_CLI_UPDATE_TEST_UPGRADE_RESULT`.

### Changed

- **TUI package update notification**: The update-in-progress notification now includes a rotating Braille glyph that cycles through the letters in `updating`.

### Fixed

- **CLI update diagnostics**: npm self-upgrade feasibility failures now log operation, invocation mode, error message, error code, and bounded npm stdio tails instead of only the error type.

## [3.7.3] - 2026-06-08

### Changed

- **Performance**: `heal` and `evolve` rebuild now replays events into a temporary database inside a single transaction, then swaps it over the original on success. Delivers ~4-5x replay speedup from batched writes and guarantees the original database is untouched if a corrupt event causes replay to fail. Contributed by [Allan Kimmer Jensen](https://github.com/Saturate).

## [3.7.2] - 2026-06-08

### Fixed

- **TUI worker daemons**: Daemon stop controls now wait for real child-process close, prevent duplicate starts while stopping, and escalate process-tree termination after a bounded timeout.
- **Test stability**: Removed a brittle daemon panel copy-count assertion that blocked copy and lifecycle label changes.

## [3.7.1] - 2026-06-08

### Fixed

- **Test stability**: Removed brittle copy/label assertions and oversized snapshot tests for Cockpit stats panel, welcome copy, and HorizontalRule primitive. Refactored `project stats` command handler to eliminate a redundant handler class.

## [3.7.0] - 2026-06-08

### Added

- **Project stats command**: Added `jumbo project stats` to display a snapshot of project health across four dimensions: project context (audiences, audience pains, value propositions), work (goals by lifecycle status, sessions), memory (decisions, components, dependencies, invariants, guidelines), and graph (relations). Supports `--format json` for structured output.
- **Cockpit stats panel**: The TUI Cockpit now shows a live project stats panel derived from the same stats query, giving operators at-a-glance context coverage and goal flow counts without leaving the TUI.

### Changed

- **Internal**: Decomposed `TuiStateReader` into focused per-entity React hooks (`useGoalsList`, `useProjectStats`, `useComponentsList`, `useDecisionsList`, `useDependenciesList`, `useGuidelinesList`, `useInvariantsList`, `useProjectContext`, `useSessionsList`, `useTickingReadModel`) for improved testability and separation of concerns.
- **Internal**: Added `HorizontalRule` TUI primitive for consistent section dividers across Cockpit panels.

## [3.6.1] - 2026-06-06

### Changed

- **Internal**: Decomposed Cockpit screen into focused collaborators (`AnimatedBannerColorGradient`, `AnimatedBannerLineColorSegments`, `AnimatedBannerTiming`, `CockpitDaemonAgentConfigCycler`, `CockpitDaemonConfigsUpdater`, `CockpitDaemonEventSnapshot`) for improved testability and separation of concerns.
- **Internal**: Replaced 62 `as-any` casts in `ProjectionBusFactory` with type-safe event dispatch, eliminating unsafe type coercions across the projection bus.

### Fixed

- **CI gate**: Added PR gate workflow for lint, type-check, and build validation on pull requests.
- **Lint errors**: Resolved all ESLint errors introduced during TUI decomposition.
- **Test stability**: Fixed flaky tests and added missing test coverage for daemon panel status labels, codifier daemon constants, and `CenteredPrompt`.

## [3.6.0] - 2026-06-02

### Changed

- **Managed agent files**: `jumbo init`, `jumbo evolve`, and repair flows now generate bootstrap-only agent instruction files from canonical `assets/agent-files` markdown and JSON fragments, while distributing fine-grained managed skills for session bootstrap, lifecycle hooks, command discovery, context maintenance, and correction capture.

## [3.5.0] - 2026-06-01

### Added

- **Global search command**: Added `jumbo search` for querying the projected global memory search index across components, dependencies, decisions, guidelines, and invariants with grouped text output and structured JSON output.
- **Search index rebuild command**: Added `jumbo index rebuild` for repairing the projected global search index by replaying persisted memory events without rebuilding every Jumbo projection.

### Fixed

- **Top-level command help**: Command-specific help now supports top-level commands such as `jumbo search --help` without requiring a parent/subcommand path.

## [3.4.0] - 2026-05-31

### Added

- **Session start backlog preview**: `jumbo session start` now includes a bounded, settings-configurable backlog preview with `goalId`, `title`, `status`, and `createdAt` so agents can see available work while still loading full goal context through follow-up workflow commands.

### Changed

- **Internal**: Decomposed `TuiSubprocessManager` into focused collaborators (`ManagedSubprocess`, `TuiDaemonOutputEventParser`, `TuiSubprocessConfigResolver`, `TuiSubprocessLifecycleEventRecorder`, `TuiSubprocessOutputRingBuffer`, `TuiSubprocessSnapshotMapper`) for improved testability and separation of concerns.

## [3.3.0] - 2026-05-31

### Added

- **Codex lifecycle hooks**: `jumbo init` and `jumbo evolve` now configure OpenAI Codex with `.codex/hooks.json` containing session-start lifecycle hooks. Hook commands use text output to avoid conflicts with Codex's JSON stdout hook-control envelope parser.

### Fixed

- **TUI worker daemon output bounds**: Agent subprocess stdout/stderr and daemon event/log payloads are now retained as bounded tails so oversized model output cannot grow worker daemon or TUI memory unboundedly.

## [3.2.1] - 2026-05-25

### Fixed

- **Release test stability**: Stabilized TUI and daemon tests by removing brittle long-form interactive TUI expectations and using platform-aware path expectations in daemon tests.

## [3.2.0] - 2026-05-25

### Added

- **Project north-star packet**: Added `jumbo project show --northstar` to return project alignment context for goal design and definition, including project metadata, audiences, audience pains, and value propositions.
- **Decision search command**: Added `jumbo decisions search` with status filtering, title substring and wildcard matching, free-text search across decision fields, and `default` or `compact` output modes.
- **Dependency search command**: Added `jumbo dependencies search` with identity-field filtering, status filtering, legacy consumer/provider filters, free-text search across dependency fields, wildcard support, and `default` or `compact` output modes.
- **Guideline search command**: Added `jumbo guidelines search` with exact category filtering, title substring and wildcard matching, free-text search across title/description/rationale/examples, removed-guideline exclusion, and `default` or `compact` output modes.
- **Invariant search command**: Added `jumbo invariants search` with title filtering, free-text search across title/description/rationale, wildcard support, and `default` or `compact` output modes.
- **Cockpit create-goal footer shortcut**: The primed Cockpit launchpad footer now shows a contextual `g` / create goal badge that opens the existing goal authoring wizard.
- **Cockpit goal authoring**: The primed-empty Cockpit `g` shortcut now opens the goal authoring wizard, registers the goal through the existing goal-add action path, suppresses surrounding shortcuts while typing, and routes to the launchpad after goal creation.
- **Bare command TUI launch**: Running `jumbo` with no arguments now opens the Ink TUI instead of ending at the legacy static banner path, using project-backed state readers when a Jumbo project is available and an uninitialized TUI path otherwise.
- **TUI foundation**: Ink + React terminal UI with app shell (header/body/footer flexbox layout), screen router (Cockpit, Goals, Memory, Session), keyboard navigation (arrow keys, number keys 1-4, q to quit), and shared design tokens (colors, spacing, glyphs). All screens are placeholder stubs awaiting content in future goals.
- **TUI init flow**: Added a production-oriented project initialization wizard inside the TUI that collects project name, purpose, optional audiences, optional value propositions, agent selection, planned changes, confirmation, and inline dispatch errors using the shared wizard primitive.
- **TUI notification prototype**: Footer notification badge with placeholder unread count, N-key drawer toggle, placeholder notification list, and individual dismiss actions.
- **TUI dedicated memory entity screens**: Memory navigation now groups Decisions, Invariants, Components, Dependencies, and Guidelines under a first-level Memory menu category, with each entity type opening a focused placeholder list/detail screen and static event replay controls.
- **Cockpit daemon Events panel**: Renamed the upper-right Cockpit panel from Session to Events and added bounded, timestamped daemon activity rows derived from refiner, reviewer, and codifier subprocess snapshots.
- **TUI header directory context**: The TUI header now shows the launch directory path beside the project label while preserving the right-aligned CLI version.

### Changed

- **Session start router**: `jumbo session start` now returns a minimal workflow router instead of eager project, goal, and decision context; agents load workflow-specific context through the returned route commands.
- **Cockpit daemon controls**: Refiner, Reviewer, and Codifier now keep independent agent, poll interval, and retry settings in the TUI. Pressing a daemon hotkey selects that panel, pressing the selected daemon hotkey again starts or stops it, and the selected daemon title is highlighted in blue.
- **Cockpit daemon panel order**: Moved the launchpad daemon panels into Refiner, Reviewer, Codifier order so the visual flow matches the operator workflow.
- **TUI notification footer priority**: Moved the placeholder notification notifier into the right footer status slot with an adjacent `n` key badge, replacing the previous daemon idle mockup.
- **TUI footer notifications**: Removed placeholder notification rows from the footer drawer until real notification sources are wired.

### Fixed

- **Worker daemon polling**: Refiner, reviewer, and codifier worker daemons now continue polling after completed, skipped, failed, or exhausted goal attempts, and codifier honors the shared poll interval behavior.
- **TUI wizard input ownership**: Goal authoring text fields now keep daemon launchpad hotkeys disabled while the wizard is open, preventing typed characters such as `s` or tab from starting or switching daemons.
- **Goal authoring criteria input**: Success criterion text no longer clears during Cockpit daemon polling or other parent re-renders.
- **Bare TUI bootstrap side effects**: Running bare `jumbo` from a non-project directory or from a subdirectory beneath an ancestor Jumbo project no longer creates `.jumbo` storage just by opening the TUI; storage is created only after project initialization is confirmed.
- **Cockpit lifecycle routing**: Cockpit now resolves lifecycle state for the current working directory, treats any existing goal as evidence of prior goal use, and routes to the primed-with-goals view instead of showing the goals tutorial once goals exist in any status.
- **TUI daemon stop status**: Stopping refiner, reviewer, or codifier daemons from the TUI now reports `stopped` instead of `failed` when termination produces a signal or taskkill-style non-zero exit.
- **Cockpit daemon waiting states**: Running refiner, reviewer, and codifier daemons now show waiting, idle, stopped, and failure state transitions in the Cockpit Events panel, including the refiner's `foraging` state when no defined goals are available.
- **TUI component memory isolation**: Component add, list, and detail views no longer collect or display component source paths as user-facing component metadata.
- **TUI project initialization**: Running bare `jumbo` from an uninitialized directory now opens a controller-backed Init wizard that creates `.jumbo` state and project files, refreshes the TUI after success, and preserves existing `jumbo init` / `jumbo project init` CLI behavior.

## [3.1.0] - 2026-05-11

### Changed

- **Slimmer session context**: `session start` (and composed flows like work resume) now emits only the project name and purpose in the project header. Audiences, audience pains, and value propositions are no longer included in the session context packet, reducing tokens consumed at session start. The `primitive-gaps-detected` session instruction signal and its prompt have been removed; register these primitives via their dedicated commands instead.

## [3.0.3] - 2026-05-02

### Changed

- **Telemetry consent prompt clarity**: The `project init` telemetry consent prompt now enumerates exactly what the telemetry payload contains (command name + a random project ID generated at init) and explicitly states what is not collected (command arguments, file contents, goal data, paths, project names). Replaces the prior vague "anonymous usage data" wording.

## [3.0.2] - 2026-05-02

### Fixed

- **npm publish workflow**: Added `npm run build` step before `npm test` in the publish workflow so the `NoProjectGuard` integration test (which spawns the compiled `dist/cli.js`) can run during release. Prior releases failed to publish to npm because the test suite errored out before `npm publish`.

## [3.0.1] - 2026-05-02

### Fixed

- **No stray `.jumbo` from project-scoped commands**: Running a `requiresProject:true` command (e.g. `decision add`, `component add`, `session start`, `goal add`) outside a Jumbo project root no longer creates a `.jumbo` directory, `jumbo.db`, event files, or migration artifacts in the current working directory. The CLI now detects "outside a project" before any infrastructure is constructed and exits non-zero with a clear stderr warning that directs the agent either to the existing ancestor project root or to run `jumbo project init` deliberately.

## [3.0.0] - 2026-04-29

### BREAKING CHANGES

- **Invariant `--enforcement` removed**: Removed the `--enforcement` field from invariant add/update commands, events, read models, and output. Invariants now consist of title, description, and optional rationale. Update any scripts that pass `--enforcement` to invariant commands.
- **Guideline `--enforcement` removed**: Removed the `--enforcement` field from guideline add/update commands, events, read models, and output. Guidelines now consist of category, title, description, rationale, and optional examples. Update any scripts that pass `--enforcement` to guideline commands.

### Changed

- **Relation cleanup on removal**: Removing components or goals now prunes their relations via `RelationRemovedEvent` instead of deactivating them, and `session start` no longer includes the deactivated-relations warning block.

## [2.15.0] - 2026-04-26

### Changed

- **ESM migration**: Project module system fully migrated to ESM. Jest config converted to `.cjs`, internal imports normalized, and tsconfig adjusted to support Node.js ESM resolution.
- **Dependency audit**: Removed 7 unused dependencies (`inversify`, `date-fns`, `ink`, `react`, `react-dom`, `boxen`, `reflect-metadata`). Updated `chalk` 4→5, `commander` 11→14, `strip-ansi` 6→7. Moved `fast-glob` to devDependencies.
- **inquirer upgraded to v13**: `project init` and `InteractivePromptService` updated to the new inquirer API.
- **TypeScript upgraded to v6**.
- **Jest upgraded to v30**: Test config updated, including a dedicated `tsconfig.jest.json`.

## [2.14.0] - 2026-04-20

### Added

- **`work review` daemon**: Long-running daemon that polls for goals in `submitted` status and delegates QA review to an agent subprocess. Supports `--agent`, `--poll-interval`, and `--max-retries` options. Both `approved` and `rejected` are valid review outcomes.
- **Documentation**: Added `work review` command reference.

### Changed

- **Shared daemon infrastructure**: Extracted `DaemonLoop`, `DaemonDisplay`, `AgentSpawner`, and `GoalStatusQuery` from `work.refine` into `work/shared/` so daemon commands share a common polling, display, and subprocess foundation.

## [2.13.0] - 2026-04-19

### Added

- **Automatic relation-discovery goals**: When an entity is created, a goal to discover its relations is now automatically registered for a future session. Prevents new entities from remaining isolated in the context graph.
- **Documentation**: Added `work refine` command reference and advanced workflow guide for the refinery daemon.

### Changed

- **CLI output alignment**: Extracted shared `OutputLayout` rendering module and introduced dedicated `*ListOutputBuilder` classes for all entity list commands (audiences, audience pains, components, decisions, dependencies, guidelines, invariants, relations, sessions, values). All output builders now use consistent layout primitives from the design library.
- **Legacy ID syntax removed**: Cleaned up residual references to the deprecated prefixed ID syntax across all goal commands.

## [2.12.0] - 2026-04-15

### Added

- **`decompose-architecture-aggregate` skill**: New template-managed skill that guides agents through migrating Architecture entity data to fine-grained entities (Decisions, Invariants, Components, Dependencies) with user confirmation at each step.

### Deprecated

- **Architecture entity**: `architecture define` and `architecture update` now reject with migration guidance directing users to register individual Decisions, Invariants, Components, and Dependencies. `architecture view` remains functional with a deprecation notice and migration mapping table. `session start` shows a conditional deprecation notice when architecture data exists. The Architecture entity will be removed in v3.

### Changed

- **Goal context**: Architecture data removed from goal context output across all goal lifecycle commands (`goal show`, `goal start`, `goal resume`, `goal codify`, `goal refine`, `goal review`). Architecture context is no longer included in the `GoalContext` interface — use Invariants and Decisions instead.

## [2.11.1] - 2026-04-11

### Changed

- **`goal show` output**: Refined output rendering to align with the design library — updated layout, styling, and symbol usage in `GoalShowOutputBuilder` and `StyleConfig`.
- **README**: Added reference to the Shared Jumbo Memories repository.

## [2.11.0] - 2026-04-05

### Added

- **`--continue` flag for cross-phase commands**: `goal commit`, `goal submit`, `goal approve`, `goal reject`, and `goal close` now accept `-c, --continue`. Without the flag, next-step output is informational guidance; with it, output is an imperative directive. This makes phase boundaries explicit handoff points for multi-agent harnesses.

## [2.10.0] - 2026-04-05

### Added

- **Refinery command**: New `jumbo work refine --agent <agent>` long-running daemon that continuously polls for goals in 'defined' state and delegates their refinement to an agent subprocess. Features graceful shutdown (Q key / Ctrl+C), configurable poll interval and retry count.
- **CLI design library**: Shared animation primitives for interactive CLI output:
  - `GradientPalette` — 10 color gradient definitions with smooth interpolation, bar animation
  - `GlimmerEffect` — sweep-highlight animation with flash pop for text elements
  - `BrailleSpinner` — braille character spinner with per-character gradient shimmer
- **RefineryDisplay**: Dedicated display module implementing the refinery mockup design with accent bars, glimmer title, compact config line, dividers, and "Foraging..." / "Refining..." braille animations.
- **BrandColors**: Added `BrandColors.jumboBlue` (#66b4f4) and raw RGB tuple to `StyleConfig.ts`.
- **New Symbols**: Added `accentBar` (│), `dot` (·), and `filledCircle` (●) to `StyleConfig.ts` with TTY/ASCII fallbacks.
- **Design mockup**: `refinery-mockup.svg` documenting the target UX for the refinery command across idle, active, and completion states.

## [2.9.0] - 2026-03-31

### Added

- **Design goal skill**: New `jumbo-design-goal` skill for collaborative pre-definition discovery — aligns proposed goals with project audience, pains, and value propositions before handing off to `define-jumbo-goals`.

### Changed

- **Internal**: Replaced sequential rebuild (`TemporarySequentialDatabaseRebuildService`) with projection-only rebuild via `ProjectionBusFactory`, eliminating the duplicate composition root and enabling parallel projection execution during `heal`/`evolve`.
- **Define goal skill**: Added execution order instruction for goal definition flow.
- **Documentation**: Minor docs refinements across reference pages.

### Fixed

- **Cascade deactivation during evolve**: Fixed double-deactivation error by checking rehydrated aggregate status before deactivating relations.

## [2.8.0] - 2026-03-31

### Added

- **Cursor agent configurer**: `jumbo init` now configures Cursor with `.cursor/rules/jumbo.mdc` (YAML frontmatter referencing JUMBO.md) and `.cursor/hooks.json` (sessionStart hook). Replaces the previously removed Cursor configurer with full rules and hooks support.
- **Vibe agent configurer**: `jumbo init` now configures Mistral Vibe with skill distribution to `.vibe/skills`. Vibe reads AGENTS.md natively.
- **Codex agent configurer**: `jumbo init` now configures OpenAI Codex with skill distribution to `.codex/skills`. Codex reads AGENTS.md natively.
- **Entity registration skills**: Five new template-managed skills for proactive context capture during agent sessions: `jumbo-add-component`, `jumbo-add-decision`, `jumbo-add-dependency`, `jumbo-add-guideline`, `jumbo-add-invariant`.

### Changed

- **Agent selection expanded**: Interactive agent selection in `jumbo init` now includes Cursor, Vibe, and Codex alongside Claude, Gemini, and Copilot.

### Removed

- **GitHub Hooks configurer**: Removed standalone `GitHubHooksConfigurer`; GitHub Hooks configuration is now handled by the Copilot configurer.

### Fixed

- **Erroneous agent option**: Removed an invalid option from agent configuration.

## [2.7.2] - 2026-03-28

### Changed

- **Internal**: Centralized all entity ID generation through `IdGenerator` utility using `crypto.randomUUID()`, replacing scattered direct calls and unsafe `Date.now()+Math.random()` patterns across 10 command handlers.

### Removed

- **Internal**: Removed unused `ulid` dependency.

## [2.7.1] - 2026-03-28

### Fixed

- **Node.js v22 compatibility**: Replaced `uuid` (pure ESM) with Node.js built-in `crypto.randomUUID()` to resolve `ERR_REQUIRE_ESM` errors when running on Node.js v22.

### Removed

- **uuid dependency**: Removed `uuid` and `@types/uuid` packages — no longer needed.

## [2.7.0] - 2026-03-28

### Added

- **Goal workspace fields**: `goal add` and `goal update` now accept `--branch` and `--worktree` options to assign git workspace context for multi-agent collaboration. `goal start` and `goal codify` output includes workspace instructions when these fields are set.

## [2.6.0] - 2026-03-27

### Added

- **Interactive agent selection in init**: `jumbo init` now presents a checkbox prompt for Claude, Gemini, Copilot, and GitHub Hooks before confirmation. Planned changes, agent-specific files, and template-managed skills are filtered to the selected agents, while non-interactive mode still configures all agents.

### Changed

- **Internal**: Logging now writes daily log files (`yyyyddmm.log`) instead of a single unbounded `jumbo.log` file.
- **Internal**: Disconnected ActivityMirror from session start output to eliminate a full event store scan (~12,500 file reads) that was causing sluggish `session start` performance. Backend assembler preserved for future use.

## [2.5.0] - 2026-03-26

### Added

- **Extended init flow**: `jumbo init` now prompts for target audiences, audience pain points, and value propositions after collecting project name and purpose. Each section is gated by a confirm prompt and supports multiple entries via an "Add another?" loop. Non-interactive mode supports new CLI flags: `--audience-name`, `--audience-description`, `--audience-priority`, `--pain-title`, `--pain-description`, `--value-title`, `--value-description`, `--value-benefit`, `--value-measurable-outcome`.
- **Session context primitive gaps nudge**: `session start` now detects when project context is missing audiences, audience pains, or value propositions and emits an `@LLM` instruction listing the gaps with relevant `add` commands.
- **Value propositions in session context**: `session start` now includes value propositions in the project context output alongside audiences and audience pains.

### Changed

- **Internal**: Extracted session instruction signal names (`brownfield-onboarding`, `paused-goals-resume`, `goal-selection-prompt`, `primitive-gaps-detected`) into shared `SessionInstructionSignal` constants, eliminating magic string coupling between application and presentation layers.
- **Internal**: Split refinement relation strategy into entity-category-specific strategies for more targeted relation curation during goal refinement.

## [2.4.0] - 2026-03-22

### Added

- **Activity mirror**: `session start` now surfaces a brief summary of proactive context maintenance actions from recent sessions (entities registered, decisions recorded, relations added, goals added), reinforcing productive LLM behavior.

### Changed

- **Context maintenance instructions**: Replaced generic "be proactive" guidance in JUMBO.md and JumboMdContent with specific, actionable instructions for when and how to register entities during refinement, implementation, and user corrections.
- **Prerequisite discovery during refinement**: Goal refine output now prompts agents to register prerequisite goals immediately when discovered, rather than deferring.
- **Real-time context capture during implementation**: Goal start output now includes specific commands for registering decisions, components, relations, and corrections as they happen.
- **Skills updated**: Define, refine, and start goal skills updated with context maintenance instructions aligned to the new approach.
- **Brownfield onboarding copy**: Improved clarity of brownfield onboarding and paused goals resume prompts in session start output.

## [2.3.1] - 2026-03-21

### Changed

- **Internal**: Replaced orphaned `SolutionContext` cluster (`ISolutionContextReader`, `SolutionContextView`, `UnprimedBrownfieldQualifier`, `SqliteSolutionContextReader`) with focused `IBrownfieldStatusReader` and `SqliteBrownfieldStatusReader`.
- **Internal**: Removed tracked files that should have been gitignored (`.claude/settings.json`, `.vscode/settings.json`, `.codex/rules/`, agent instruction stubs).

### Fixed

- **Broken test**: Fixed failing test in `SessionContextQueryHandler`.
- **README**: Documentation refinements and fixes.

## [2.3.0] - 2026-03-20

### Changed

- **Goals grouped by state**: `goal list` and `session start` now display goals grouped by lifecycle state with bracket-style headings (e.g., `[DOING]`, `[APPROVED]`) and contextual hints describing available actions for each state.
- **Session start output refactored**: Session start rendering decomposed into composable output builders (`SessionContextOutputBuilder`, `SessionGoalsOutputBuilder`, `SessionStartOutputBuilder`) for maintainability.
- **Recent decisions limit reduced**: Session context now includes the 3 most recent decisions (previously 10) to keep context concise.

### Fixed

- **Deprecated command reference in refine skill**: Updated `refine-jumbo-goals` skill to use `jumbo goal commit` instead of the removed `jumbo goal refine --approve`.

## [2.2.0] - 2026-03-18

### Changed

- **Centralized agent instructions in JUMBO.md**: `jumbo init` and `jumbo evolve` now produce a centralized JUMBO.md containing all agent onboarding instructions. AGENTS.md, CLAUDE.md, GEMINI.md, and .github/copilot-instructions.md become thin reference files pointing to JUMBO.md, eliminating content duplication across agent instruction files.

## [2.1.0] - 2026-03-16

### Added

- **Automatic relation maintenance goals**: When an entity with active relations is changed (updated, removed, deprecated, superseded, restored, or undeprecated), a maintenance goal is now automatically registered to review and restore symmetry between the entity and its relations.

### Fixed

- **Required flag validation**: Covered gaps in required flag demarcation across CLI commands.

## [2.0.3] - 2026-03-15

### Changed

- **Internal**: Telemetry configuration externalized from source code to build-time injection.
- **Internal**: Publish workflow and test reliability improvements.

## [2.0.2] - 2026-03-14

### Changed

- **Initialization guidance**: Improved post-init copy to guide users toward creating their first goal instead of starting a session directly. Includes example `goal add` command with all key flags.
- **README**: Fixed npm install command syntax in Quick Start section.

### Added

- **Automated npm publishing**: Added GitHub Actions workflow (`publish.yml`) that publishes to npm via OIDC trusted publisher when a GitHub release is created.

## [2.0.1] - 2026-03-13

### Changed

- **Telemetry opt-out by default**: `jumbo init` now prompts for telemetry consent during interactive initialization with opt-out framing (default: enabled). Non-interactive mode enables telemetry automatically. Users can opt out during init, or later via `jumbo telemetry disable` or `JUMBO_TELEMETRY_DISABLED=1`. Default telemetry setting changed from `false` to `true`.

### Fixed

- **Telemetry consent prompt was dead code**: The `promptForTelemetryConsentIfNeeded` function during `jumbo init` never fired because `FsSettingsReader.read()` auto-created the settings file before `hasTelemetryConfiguration()` was checked, causing it to always return `true`.

## [2.0.0] - 2026-03-11

### BREAKING CHANGES

- **Session pause/resume removed**: The session pause and resume functionality has been completely removed from the CLI. Sessions now only support `session start` and `session end` commands. Any paused sessions will be automatically migrated to active status.
  - Removed commands: `jumbo session pause` and `jumbo session resume`
  - Goal pause/resume functionality remains unchanged
  - Migration docs: [`docs/guides/session-management.md`](docs/guides/session-management.md), [`docs/reference/commands/session.md`](docs/reference/commands/session.md)

- **Goal lifecycle overhauled**: The goal lifecycle has been significantly expanded with new states, commands, and a renamed status vocabulary. The full lifecycle is now: `defined` → `in-refinement` → `refined` → `doing` → `submitted` → `in-review` → `approved` → `codifying` → `done`. Goals can also be `paused`, `blocked`, or `rejected` at various stages.
  - **Status values renamed**: `to-do` → `defined`, `qualified` → `approved`, `completed` → `done`. Legacy values are migrated automatically via `jumbo evolve --yes`.
  - **`goal complete` removed**: Replaced by `jumbo goal codify` (acquires claim for architectural reconciliation) and `jumbo goal close` (releases claim, transitions to `done`).
  - **`goal qualify` deprecated**: Replaced by `jumbo goal approve`. `goal qualify` still works but emits a deprecation warning.
  - **New commands**: `jumbo goal submit` (doing → submitted), `jumbo goal reject` (in-review → rejected), `jumbo goal approve` (in-review → approved), `jumbo goal commit` (in-refinement → refined), `jumbo goal codify` (approved → codifying), `jumbo goal close` (codifying → done)
  - **New states**: `submitted`, `in-refinement`, `rejected`, `codifying`, `done` (replacing `completed`)
  - **Refinement split into two phases**: `jumbo goal refine` now transitions to `in-refinement` and acquires a claim; `jumbo goal commit` transitions to `refined` and releases the claim. The `--approve` flag has been removed from `goal refine`.
  - **Migration**: Run `jumbo evolve --yes` to migrate legacy status values. Update scripts that reference old status names or use `goal complete`/`goal qualify`.
  - Migration docs: [`docs/guides/goal-management.md`](docs/guides/goal-management.md), [`docs/reference/commands/goal.md`](docs/reference/commands/goal.md)

- **`--goal-id` flag renamed to `--id`**: All goal commands now use `--id` instead of `--goal-id`. The goal namespace already provides context, making the prefix redundant.
  - Old flag: `jumbo goal start --goal-id <id>` (no longer works)
  - New flag: `jumbo goal start --id <id>`
  - **Migration**: Update any scripts or automation to use `--id`

- **Command renamed**: The `jumbo goal updateProgress` command has been renamed to `jumbo goal update-progress` (kebab-case) for consistency with other multi-word commands.
  - Old command: `jumbo goal updateProgress` (no longer works)
  - New command: `jumbo goal update-progress`
  - **Migration**: Update any scripts or automation to use the new kebab-case command name
  - Migration docs: [`docs/reference/commands/goal.md`](docs/reference/commands/goal.md)

- **V2 namespace remodel (internal)**: Major internal restructuring of types, namespaces, and architectural boundaries. While these are internal changes, plugins or scripts that depend on internal module paths will break.
  - **Removed types**: `GoalContextView`, `SessionSummaryProjection` (+ handler, store), `RelatedComponent`, `RelatedDecision`, `RelatedDependency`, `RelatedGuideline`, `RelatedInvariant`
  - **Removed namespaces**: `list/` directories and `I*ListReader` interfaces replaced by `get/` and `I*ViewReader`; `get-context/` merged into `get/`
  - **Dropped table**: `session_summary_views` table removed via migration (was orphaned after `SessionSummaryProjection` removal)
  - **Migration**: Run `jumbo evolve --yes` after upgrading to migrate data and rebuild the database with V2 projections
  - Migration docs: [`docs/reference/commands/maintenance.md`](docs/reference/commands/maintenance.md)

- **Command replaced**: `jumbo db rebuild` has been replaced by `jumbo heal --yes`. The heal command replays all events from the event store to reconstruct materialized view projections. The underlying `RebuildDatabaseCommandHandler` is preserved as internal infrastructure.
  - Old command: `jumbo db rebuild --yes` (no longer available)
  - New command: `jumbo heal --yes`
  - Migration docs: [`docs/reference/commands/maintenance.md`](docs/reference/commands/maintenance.md)

- **Maintenance commands consolidated**: `jumbo repair`, `jumbo db upgrade`, and `jumbo dependency migrate` have been replaced by `jumbo evolve --yes`. The new command applies schema migrations, runs idempotent data migrations, refreshes managed configuration, and rebuilds projections as one installation update workflow.
  - Old commands: `jumbo repair`, `jumbo db upgrade --from v1 --to v2`, `jumbo dependency migrate`
  - New command: `jumbo evolve --yes`
  - Migration docs: [`docs/reference/commands/maintenance.md`](docs/reference/commands/maintenance.md)

### Added

- **Heal command**: `jumbo heal --yes` rebuilds database projections by replaying all events from the event store. Replaces `jumbo db rebuild` as the user-facing corruption recovery command.

- **Goal review workflow**: New two-step quality assurance workflow for goals before completion:
  - `jumbo goal review --id <id>` - Submit a goal for review (transitions from `submitted` to `in-review`)
  - `jumbo goal approve --id <id>` - Approve a reviewed goal (transitions from `in-review` to `approved`)
  - Goals in `in-review` or `approved` status are included in session context

- **Goal submit command**: `jumbo goal submit --id <id>` transitions a goal from `doing` to `submitted` and releases the implementer's claim, signaling work is ready for review.

- **Goal reject command**: `jumbo goal reject --id <id>` returns a reviewed goal from `in-review` to `rejected` status with review issues recorded as a dedicated goal state property.

- **Goal codify/close commands**: Final lifecycle phase for architectural reconciliation:
  - `jumbo goal codify --id <id>` - Transition from `approved` to `codifying` (acquires claim)
  - `jumbo goal close --id <id>` - Transition from `codifying` to `done` (releases claim)

- **Goal commit command**: `jumbo goal commit --id <id>` transitions a goal from `in-refinement` to `refined` and releases the refinement claim. Part of the two-phase refinement workflow.

- **Goal title field**: Goals now support a `title` field for human-readable naming.

- **Goal prerequisite goals**: Goals can declare prerequisite goals via the `prerequisiteGoals` property, enabling dependency ordering between goals.

- **Goal pause/resume**: Goals can now be paused and resumed independently of sessions:
  - `jumbo goal pause --id <id>` - Pause work on a goal
  - `jumbo goal resume --id <id>` - Resume a paused goal
  - Paused goals are included in session context and goals list

- **Goal progress tracking**: Track progress notes on goals with `jumbo goal update-progress --id <id> --progress <text>`

- **Goal reset with dynamic target**: `jumbo goal reset` now computes the target state dynamically from the state machine rather than hardcoding a reset destination.

- **Component rename command**: `jumbo component rename` renames an existing component.

- **Component show command**: `jumbo component show` displays component details and its relations.

- **Relation deactivation/reactivation lifecycle**: Relations now support deactivation and reactivation with automatic cascade when a related entity reaches a terminal state.

- **CLI telemetry instrumentation**: Every CLI command invocation is automatically tracked with command name, CLI version, Node.js version, OS platform, architecture, success/failure status, execution duration, and error type on failure. Telemetry is fully non-blocking and gracefully flushes pending events before process exit. Respects consent settings and CI environment detection.

- **Telemetry consent management**: Opt-in anonymous telemetry infrastructure with user control:
  - `jumbo telemetry status` - Show current consent state, effective runtime status, and anonymous ID
  - `jumbo telemetry enable` - Opt into anonymous telemetry (generates anonymous UUID on first enable)
  - `jumbo telemetry disable` - Opt out of anonymous telemetry
  - Telemetry auto-disables in CI environments (CI, GITHUB_ACTIONS, GITLAB_CI, JENKINS_URL, CIRCLECI, TRAVIS, BUILDKITE)
  - Environment variable override: `JUMBO_TELEMETRY_DISABLED=1` disables telemetry regardless of settings
  - First-run consent prompt during `jumbo project init`
  - Settings persisted in `.jumbo/settings.jsonc` under `telemetry` section

- **Worker identification**: The system now tracks which worker (agent/user) is working on each goal, enabling proper claim management across sessions

- **Architecture view command**: New `jumbo architecture view` command to display the current architecture definition

- **Enhanced session context**: Paused and blocked goals are now included in session context output, providing complete visibility into all active work

- **Short flag aliases**: Added short aliases across all entity commands (e.g., `-d` for `--description`, `-n` for `--name`) for faster CLI usage.

- **Gitignore enforcement**: `jumbo project init` now enforces `.gitignore` exclusions for the `.jumbo` directory via `IGitignoreProtocol`.

- **Idempotent claim re-entry**: Entry commands (start, refine, codify) now handle expired claims idempotently, allowing re-entry without manual claim cleanup.

- **Agent configuration improvements**:
  - Updated Claude and Gemini configurers to match current repository settings
  - Added GitHub hooks configurer for `.github/hooks/hooks.json`
  - Agent init now adds `jumbo --help` permission to Claude Code settings
  - Agent init now adds `jumbo --help` to Gemini CLI tools.allowed list

- **Template-managed skills**: `jumbo evolve` and `jumbo project init` now sync template-managed skills from the assets directory.

- **Documentation**: Added reference pages for work commands (`work pause`, `work resume`), worker commands (`worker view`), and maintenance commands (`db rebuild`, `db upgrade`, `repair`). Updated session command reference with `sessions list` and `session compact`. Updated session management guide with paused state lifecycle, work pause/resume workflow, and context compaction.

### Changed

- **Evolve command**: `jumbo evolve --yes` now updates managed skills, configuration, schema, and projections in one command. `heal` remains the focused projection rebuild command.
- **Dependency model clarification**: Dependency commands/documentation now define dependencies as third-party software/services (packages or external APIs). Component coupling is documented under relation commands (`depends_on`).
- **Legacy coupling flag deprecation timeline**: `--consumer-id` and `--provider-id` compatibility flags on `jumbo dependency add` are now explicitly marked deprecated with planned removal in `v3.0.0`.
- **Goal claim storage migrated to SQLite**: Goal claims are now stored in SQLite instead of the filesystem for improved reliability.
- **Worker identity storage migrated to SQLite**: Worker identity persistence moved from filesystem to SQLite for consistency with other state.

- **Internal architecture**:
  - Implemented Host/HostBuilder pattern for cleaner infrastructure composition
  - Introduced Controller-Gateway pattern across all command flows for cleaner separation of presentation and application layers
  - Consolidated `templates/` directory into `assets/` for static file storage

- **V2 namespace remodel (internal)**:
  - Introduced `*Record` types (`GoalRecord`, `SessionRecord`, `ComponentRecord`, `DecisionRecord`, `DependencyRecord`, `GuidelineRecord`, `InvariantRecord`, `RelationRecord`) with dedicated `*RecordMapper` services at the infrastructure/application boundary
  - Replaced five bespoke `Related*` types with generic `RelatedContext<T>` wrapper
  - Split `GoalContext` into pure relations container (`GoalContext`) and composed return type (`ContextualGoalView`)
  - Replaced event-sourced `SessionSummaryProjection` with query-time assembled `SessionContext`
  - Renamed `list/` directories to `get/` and `I*ListReader` interfaces to `I*ViewReader` across all entity namespaces

### Removed

- **Project boundaries**: Removed `boundaries` field from the Project domain model, commands, views, and CLI options. The `--boundary` flag has been removed from `jumbo project init` and `jumbo project update`. Existing databases will have the column dropped via migration.

- **`goal complete` command**: Removed entirely. Replaced by `jumbo goal codify` and `jumbo goal close` for the final lifecycle phase. `GoalCompletedEvent` is retained for backward-compatible event replay.

- **QA mode from goal complete**: The `--commit` flag and interactive QA logic have been removed. Use the new review workflow (`goal submit` → `goal review` → `goal approve`) followed by `goal codify` and `goal close`.

- **Deprecated events**: Removed `GoalReviewedEvent` and `ReviewTurnTracker` which have been superseded by the new review workflow events

### Fixed

- **Managed agent refresh**: The installation update flow now correctly replaces the Jumbo section in AGENTS.md regardless of which version of section markers the file contains. Old installations using the legacy `## Instructions for Jumbo` heading are now detected and updated to the current format instead of appending a duplicate section.

- **Event store hardening**: Event store now handles corruption gracefully with improved observability in evolve/heal workflows.

- **Stale database boot migration**: Pending migrations now run automatically on boot for databases that missed prior upgrades.

- **ProjectRootResolver directory walk**: Fixed the resolver walking up to parent directories, which could cause it to find the wrong `.jumbo` directory.

- **`.jumbo` directory resolution**: Fixed resolution from nearest ancestor to prevent state splitting when multiple `.jumbo` directories exist in the path hierarchy.

- **Hidden commands in help output**: Hidden commands and top-level aliases are no longer shown in help output.

- **TerminalOutput data section rendering**: Fixed `TerminalOutput.toHumanReadable()` to correctly render data section messages.

### Compatibility

- **Backward compatibility in v2.x**: Legacy `--consumer-id` / `--provider-id` behavior remains available during `v2.x` and maps to relations for migration safety.
- **Evolve safety**: The goal status and legacy dependency migrations used by `jumbo evolve --yes` remain idempotent. Re-running a successful evolve produces no duplicate migration events or relations.

### Deprecation Risk Assessment

- **Breaking risk now**: Low. Existing scripts continue to run in `v2.x`, but emit deprecation warnings.
- **Breaking risk at v3.0.0**: High for unattended scripts that still use legacy coupling flags. Migrate these scripts to `jumbo relation add --type depends_on` before adopting `v3.0.0`.
- Migration docs: [`docs/upgrading/v2.md`](docs/upgrading/v2.md), [`docs/reference/commands/dependencies.md`](docs/reference/commands/dependencies.md), [`docs/reference/commands/relations.md`](docs/reference/commands/relations.md)

## [1.0.1] - 2026-01-10

### Changed

- **Documentation**: Removed beta designation from README.md, reflecting stable release status.

## [1.0.0] - 2026-01-10

### Added

- **List commands**: Added `list` subcommand to all entity commands for viewing stored data:
  - `jumbo audience list` - List all audiences
  - `jumbo audience-pain list` - List all audience pains
  - `jumbo value list` - List all value propositions
  - `jumbo relation list` - List all relations
  - `jumbo component list` - List all components
  - `jumbo decision list` - List all decisions
  - `jumbo dependency list` - List all dependencies
  - `jumbo guideline list` - List all guidelines
  - `jumbo invariant list` - List all invariants
  - `jumbo session list` - List all sessions

- **Agent configurer hook support**: Claude and Gemini configurers now support full hook configuration with intelligent merging that preserves existing user settings.

### Changed

- **Internal refactoring**: Migrated bootstrap composition from infrastructure to presentation layer for cleaner architecture.

### Removed

- **Cursor agent configurer**: Removed Cursor-specific agent configuration since Cursor now supports AGENTS.md natively.

## [1.0.0-beta.1] - 2026-01-05

### Added

- **Goal update extended**: 'goal update' extended with '--nextGoalId' for latent goal chaining.

## [1.0.0-beta.0] - 2026-01-01

### Changed

- **Package renamed**: Package renamed from `@jumbo-ctx/cli` to `jumbo-cli` (unscoped).
  Update your installation with `npm install -g jumbo-cli`.

- **Repository moved**: GitHub repository moved from `jumbo-ctx` to `jumbo-dot-tech`
  organization.

- **Animated banner**: Redesigned CLI banner with character-map-based animation frames
  for improved visual presentation.

- **Goal context format**: Improved goal context output format for better LLM clarity
  and parsing.

### Added

- **Goal chaining**: Goals can now be linked together in a chain. Use `--next-goal <goalId>`
  to set which goal should follow the new goal, or `--previous-goal <goalId>` to update
  an existing goal to point to the new goal as its successor.

- **Goal resume**: Resume work on a previously started goal with `jumbo goal resume`.

### Fixed

- **Help screen alignment**: Command descriptions now align at a fixed column position
  for consistent formatting across all command categories.

## [1.0.0-alpha.8] - 2025-12-18

### Fixed

- **Database rebuild now correctly projects all events**: Fixed a bug where historical
  events stored with short type names (e.g., `GoalCompleted`) were not being projected
  during `jumbo db rebuild`. Events are now properly matched to their handlers.

### Added

- **Event type migration script**: Added `scripts/migrations/001-normalize-event-types.js`
  to fix legacy events with missing `Event` suffix in their type field.

### Migration Required

If you used earlier alpha versions and have existing event data, run the migration
script before rebuilding your database:

```bash
# Preview changes (recommended first)
node scripts/migrations/001-normalize-event-types.js --dry-run

# Apply changes
node scripts/migrations/001-normalize-event-types.js

# Rebuild database
jumbo db rebuild --yes
```

## [1.0.0-alpha.7] - 2025-12-11

### Breaking Changes

- **Removed `tagline` from Project**: The `--tagline` option has been removed from
  `project init` and `project update` commands. Remove this option from any scripts
  or automation. The database column remains for backward compatibility but is no
  longer used.

- **Removed `dataFlow` from Architecture**: The `--data-flow` and `--clear-data-flow`
  options have been removed from `architecture define` and `architecture update` commands.
  Remove these options from any scripts or automation. Existing data migrates automatically.

### Removed

- `--tagline` option from `jumbo project init`
- `--tagline` option from `jumbo project update`
- `--data-flow` option from `jumbo architecture define`
- `--data-flow` and `--clear-data-flow` options from `jumbo architecture update`

## [1.0.0-alpha.6] - 2025-12-11

### Added

- Initial public release
- Context management for LLM coding agents
- Event-sourced architecture with CQRS
- Session and goal tracking
- Project knowledge capture (audiences, pains, value propositions)
- Solution documentation (architecture, components, decisions, invariants, guidelines)
- Relation mapping between entities
