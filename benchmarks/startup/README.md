# CLI startup benchmark

Keep this benchmark's runner, probe, tests, documentation, and saved results in
`benchmarks/startup/`. Only npm script wiring belongs outside this namespace.

Measure startup overhead for every registered command, including hidden commands
and top-level aliases. Every run saves a timestamped result so you can track
performance across the twelve startup goals and subsequent development.

## Namespace layout

```text
benchmarks/startup/
├── cli-startup.mjs          # Runner, statistics, report saving, and comparison
├── cli-startup-probe.cjs    # Stops benchmark children at the timing boundary
├── cli-startup.test.mjs     # Unit and isolated end-to-end tests
├── README.md               # Usage and measurement contract
└── results/                # Timestamped JSON reports retained across runs
```

## Run

```sh
npm run build
npm run test:benchmark:startup
npm run benchmark:startup

# After implementing changes, rebuild and compare with any saved run.
npm run build
npm run benchmark:startup -- \
  --compare benchmarks/startup/results/cli-startup-2026-10-27T20-11-57-024Z.json
```

The default is one separately recorded first sample plus **20 repeated samples**
per invocation. A full run takes several minutes. The runner prints a table and
saves raw samples, first-sample time, median, nearest-rank p95, mean, min, and max.
An even-sized median is the average of the two central values. First samples are
not included in the repeated-sample statistics.

## Result artifacts and history

Each successful run automatically saves a new JSON file under
`benchmarks/startup/results/`, including runs using `--compare`. Filenames use the
report's `recordedAt` completion time in UTC, with milliseconds and filesystem-safe
separators: `cli-startup-YYYY-MM-DDTHH-mm-ss-SSSZ.json`. The runner prints the saved
path. Runs that finish in the same millisecond receive `-001`, `-002`, etc. suffixes;
exclusive file creation prevents overwrites, including concurrent runs.

Use `--output-dir <directory>` to collect timestamped reports elsewhere, or
`--output <file>` to choose an exact filename. These options are mutually exclusive.
Explicit filenames are never overwritten or silently renamed. `--compare <file>`
accepts any historical report; there are no special "before" or "after" slots.
Keep earlier reports to compare successive changes or return to the original
baseline. A comparison run saves both its new measurements and the comparison
results in its own timestamped artifact; it does not modify the selected baseline.

List the available reports, then pass the desired path to `--compare`:

```sh
ls -1 benchmarks/startup/results/cli-startup-*.json
npm run benchmark:startup -- --compare <saved-report-path>
```

Choose a report with the intended build, environment, and command coverage, not
just the newest filename. Full runs have `config.command: null`; filtered runs
record the selected command there. The runner does not automatically choose or
replace a "latest" baseline.

### Quick checks and alternate checkouts

Quick checks also save reports. Use a separate output directory if you do not
want smoke-test results mixed into the full-run history:

```sh
npm run benchmark:startup -- --samples 3 --command 'goal start' \
  --output-dir /tmp/jumbo-startup-smoke
npm run benchmark:startup -- --build-root /path/to/built/checkout \
  --output-dir /tmp/jumbo-startup-results
```

`--command` accepts an exact canonical command or alias. Use
`--command=--help` or `--command=--version` for the built-in flags.
Filtered comparisons label unmeasured commands rather than claiming they were
removed. Run without this option when capturing the full baseline. Use
`--timeout-ms` to override the 30-second per-process timeout.

## Measurement contract

For registered commands, timing starts immediately before spawning a new Node
process and stops at the **first statement of the selected exported CLI handler**.
It includes process creation, Node initialization, module loading/evaluation,
project discovery, infrastructure construction, Commander registration/parsing,
and any dispatch-time service construction or lazy handler loading. It excludes
the handler body, rendering, daemon execution, telemetry shutdown, pipe delivery,
and process/database cleanup. Required options receive placeholder values so that
Commander reaches dispatch instead of measuring an argument error. Domain
validation never runs.

The runner copies `dist/`, `package.json`, and `assets/` to a temporary directory
and links that copy to the selected checkout's installed `node_modules/`. It
inserts one stop statement at each command handler's entry **in the copy only**.
It does not alter production source, the original build, or the handler import
graph. A small CommonJS preload captures the original `process.exit`, provides
the stop function, writes a timestamp to a dedicated file descriptor, and exits
without entering command logic. Capturing exit before AppRunner replaces it keeps
the telemetry wrapper from swallowing the stop. Instrumentation and discovery
happen outside all timed processes; there is no module tracing in latency runs.

The timestamps use Node's system-wide monotonic `hrtime` clock in parent and
child. Every sample must exit successfully and produce exactly one marker for
the expected handler, within the parent's measured process interval. Missing or
incorrect markers, nonzero exits, signals, and timeouts abort the run; they are
never reported as fast startup. The cost of loading the probe and parsing the
inserted statements is included in every measurement, not estimated or subtracted.

Three extra invocations are reported with explicitly different boundaries:

- **`node (probe control)`**: a fresh Node process using the same preload and stop
  function, with no CLI imports. This is a control for process/probe overhead,
  not a bare `node -e ''` process-lifetime measurement.
- **`jumbo --help` and `jumbo --version`**: time to their first stdout write,
  stopped before writing output. These have no command handler; formatting before
  the first write is included. Do not interpret these as handler-entry samples.

Bare interactive `jumbo`, TUI first render, parent-command help pages, every
optional flag combination, and separately launched worker daemons are not part
of this command-handler benchmark. No timings here measure application work or
explain delays inside a command.

## Fixture and isolation

Project-scoped commands run in a disposable **empty, migrated local project**.
An untimed intercepted startup prepares its SQLite schema, settings, and worker
identity; no project command handler is executed. This fixture has no project
history or domain records and is not representative of large-project data costs.
The prepared directory and user home are copied back before **every** sample,
outside the timer, so startup writes cannot accumulate across cases or rounds.
Commands not requiring a project run in a fresh directory without `.jumbo`.
Consequently, current initialization startup includes creation of storage, while
ordinary commands include opening already-migrated storage.

Children use isolated HOME/XDG/Windows configuration and temporary directories,
a stable synthetic terminal session ID, disabled telemetry, disabled Node disk
compile cache, and no inherited `NODE_OPTIONS`, IDE session IDs, or credentials.
Only OS executable-lookup variables are inherited. The real repository's
`.jumbo`, worker state, user settings, and credentials are not used. Temporary
files are removed on completion or errors. A forcibly terminated runner can leave
a `jumbo-startup-*` directory in the system temporary directory.

All children run serially. Case order is shuffled deterministically each round
to reduce fixed-order drift. **Cold means a fresh process, not cold OS filesystem
caches.** Copying and discovery already touch the build before the first sample;
no root privileges, cache dropping, or artificial warm-up of measured processes
are used. The first sample is not a claim of first-ever disk access.

## Comparing results

Use the same machine, Node executable/version, installed dependencies, power
settings, and low background load. Build and test before, not during, a benchmark.
Repeat runs if changes are small relative to the raw-sample spread. There are no
machine-dependent pass/fail timing thresholds.

Reports identify the Git revision and working-tree status, CLI version, SHA-256
of the original runtime build, lockfile and harness hashes, Node executable,
CPU, OS, hostname, configuration, scenarios, argv, and exit status. The runner
does not silently rebuild: `npm run build` is the operator's responsibility.
Archive the identified checkout/build if it must be reproduced exactly; a Git
revision alone does not identify uncommitted code or installed dependency drift.

Comparisons report per-command median deltas, median percentage changes, and p95
deltas. Negative numbers mean faster. Added/removed commands and changed argv,
scenarios, or boundaries are reported separately, not compared as equivalent.
Different schema versions, measurement contracts, or fixtures are rejected;
changes in machine, Node, harness, or sample count generate warnings. Warnings
must be investigated before attributing a difference to the startup refactor.

The benchmark discovers the generated registry rather than maintaining a manual
command list. Its instrumentation adapter expects directly exported named
handler functions, matching the current command contract. It supports eager,
lazy, and mixed registries, so it can run between startup goals. Eager handlers
use their exported function names. Lazy wrappers have the inferred name `handler`;
the adapter instead uses the registry generator's command-to-function naming
convention (for example, `architecture define` → `architectureDefine`) to locate
the implementation, never the wrapper. Metadata-only registries use the same
naming fallback. If a refactor changes registry location, handler exports, or
that convention, update the adapter and its tests; **never fall back to timing help,
validation failures, process exit, or a point before selected services are built**.
Keep the handler-entry boundary and fixture semantics unchanged for valid
before/after comparisons. Work moved into the handler body is outside this metric
and must not be described as a startup improvement without separate analysis.

This baseline harness complements goal 12/12's broader module-loading,
construction-isolation, TUI, and daemon acceptance tests; it does not implement
those tests or mark that goal complete.

## Original baseline artifact

The pre-refactor result is stored in
`benchmarks/startup/results/cli-startup-2026-10-27T20-11-57-024Z.json`. It was captured on
2026-10-27 from revision `b476115599278e204cf41f892a11a8ec2c96f0fd`, using Node
v26.8.1 on Linux x64. It contains 2,100 measured fresh processes: 96 canonical
commands, one alias, help, version, and the Node control, each with a first sample
and 20 repeated samples.

| Invocation | Median (ms) | p95 (ms) |
| --- | ---: | ---: |
| Node with probe | 18.30 | 22.55 |
| `jumbo --help` | 177.13 | 204.93 |
| `jumbo --version` | 170.90 | 200.80 |
| `jumbo goal start` | 184.91 | 240.13 |
| `jumbo session start` | 185.54 | 235.65 |
| `jumbo project init` | 193.40 | 252.80 |

Handler-entry medians range from 181.86 to 197.59 ms. These are observations for
this machine and fixture, not performance guarantees. Other operating systems
have not been verified. See the JSON for build/environment identity, all command
results, and raw samples. The original artifact was renamed using its existing
`recordedAt` timestamp; its contents and measurements are unchanged. Timestamped
saving was added after this capture, so comparisons will warn that the harness
hash differs. That change affects report storage, not the measurement boundary.

To compare the rebuilt CLI with this captured baseline:

```sh
npm run build
npm run benchmark:startup -- \
  --compare benchmarks/startup/results/cli-startup-2026-10-27T20-11-57-024Z.json
```
