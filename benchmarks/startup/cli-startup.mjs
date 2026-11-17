#!/usr/bin/env node
/** Fresh-process startup benchmark. See README.md for the measurement contract. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import ts from "typescript";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const PROBE = path.join(HERE, "cli-startup-probe.cjs");
const METRIC = "spawn-to-handler-entry-v1";
const FIXTURE = "empty-migrated-project-v1";

export function reportFileName(recordedAt) {
  const timestamp = new Date(recordedAt).toISOString().replace(/[:.]/g, "-");
  return `cli-startup-${timestamp}.json`;
}

export function saveReport(report, { output, outputDir = path.join(HERE, "results") } = {}) {
  const defaultPath = path.join(outputDir, reportFileName(report.recordedAt));
  const initialPath = path.resolve(output ?? defaultPath);
  fs.mkdirSync(path.dirname(initialPath), { recursive: true });
  const content = JSON.stringify(report, null, 2) + "\n";
  for (let collision = 0; ; collision++) {
    const destination = collision === 0 ? initialPath
      : initialPath.replace(/\.json$/, `-${String(collision).padStart(3, "0")}.json`);
    try {
      fs.writeFileSync(destination, content, { flag: "wx" });
      return destination;
    } catch (error) {
      // Exclusive creation also protects concurrent runs with the same timestamp.
      // An explicit filename is never silently changed.
      if (output !== undefined || error.code !== "EEXIST") throw error;
    }
  }
}

export function statistics(samples) {
  if (!samples.length || samples.some(n => !Number.isFinite(n) || n < 0)) {
    throw new Error("Samples must be finite, non-negative durations.");
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return {
    medianMs: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
    p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1],
    minMs: sorted[0],
    maxMs: sorted.at(-1),
    meanMs: samples.reduce((sum, n) => sum + n, 0) / samples.length,
  };
}

function handlerNameFor(commandPath) {
  return commandPath.replace(/[-\s]+(.)/g, (_, letter) => letter.toUpperCase());
}

export function commandCases(commands) {
  const cases = [];
  for (const command of commands) {
    if (!command.path || typeof command.metadata?.requiresProject !== "boolean") {
      throw new Error("Every discovered command must declare its path and requiresProject.");
    }
    const requiredArgs = (command.metadata.requiredOptions ?? []).flatMap(option => {
      const flag = option.flags.match(/--[\w-]+/)?.[0] ?? option.flags.match(/-[\w]/)?.[0];
      if (!flag) throw new Error(`Unsupported option syntax: ${option.flags}`);
      // Commander validates presence, not domain semantics. The handler never runs.
      return /[<[]/.test(option.flags) ? [flag, "benchmark-placeholder"] : [flag];
    });
    for (const invocation of [command.path, ...(command.metadata.topLevelAliases ?? [])]) {
      cases.push({
        id: `jumbo ${invocation}`,
        commandPath: command.path,
        argv: [...invocation.split(/\s+/), ...requiredArgs],
        boundary: "handler-entry",
        scenario: command.metadata.requiresProject ? "project" : "outside-project",
        hidden: command.metadata.hidden ?? false,
        aliasFor: invocation === command.path ? null : command.path,
      });
    }
  }
  if (!cases.length || new Set(cases.map(c => c.id)).size !== cases.length) {
    throw new Error("Command discovery returned an empty or duplicate command catalogue.");
  }
  return cases.sort((a, b) => a.id.localeCompare(b.id));
}

/** Insert one statement without reprinting/recompiling the surrounding built JS. */
export function instrumentHandler(source, handlerName, commandPath) {
  const parsed = ts.createSourceFile("command.js", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const matches = parsed.statements.filter(statement =>
    ts.isFunctionDeclaration(statement) && statement.name?.text === handlerName &&
    statement.body && statement.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword));
  if (matches.length !== 1) {
    throw new Error(`Expected one exported function ${handlerName} for ${commandPath}; found ${matches.length}. Update the benchmark adapter, not the measurement boundary.`);
  }
  const position = matches[0].body.getStart(parsed) + 1;
  return source.slice(0, position) +
    `\n globalThis.__jumboStartupBenchmarkStop(${JSON.stringify(commandPath)});\n` + source.slice(position);
}

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(entry => entry.isDirectory() ? filesUnder(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
}

function hashFiles(files, root) {
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(path.relative(root, file).split(path.sep).join("/")).update("\0");
    hash.update(fs.readFileSync(file)).update("\0");
  }
  return hash.digest("hex");
}

export function isolatedEnvironment(home) {
  // Do not inherit NODE_OPTIONS, agent/IDE session IDs, credentials, user config,
  // or Node's on-disk compile cache. Keep just OS executable lookup essentials.
  const env = {};
  for (const key of ["PATH", "Path", "SystemRoot", "WINDIR", "PATHEXT"]) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  return {
    ...env, HOME: home, USERPROFILE: home,
    XDG_CONFIG_HOME: path.join(home, "config"), XDG_CACHE_HOME: path.join(home, "cache"),
    XDG_DATA_HOME: path.join(home, "data"), APPDATA: path.join(home, "config"),
    LOCALAPPDATA: path.join(home, "data"), TMPDIR: home, TMP: home, TEMP: home,
    CI: "1", JUMBO_TELEMETRY_DISABLED: "1", NO_COLOR: "1", TERM: "dumb",
    TERM_SESSION_ID: "jumbo-startup-benchmark", LANG: "C", LC_ALL: "C", TZ: "UTC",
    NODE_DISABLE_COMPILE_CACHE: "1",
  };
}

export function runSample({ entry, benchmarkCase, cwd, env, timeoutMs = 30000 }) {
  const args = ["--require", PROBE];
  if (benchmarkCase.boundary === "node-control") {
    args.push("--eval", 'globalThis.__jumboStartupBenchmarkStop("node");');
  } else {
    args.push(entry, ...benchmarkCase.argv);
  }
  const options = {
    cwd, env: { ...env, ...(benchmarkCase.boundary === "first-stdout-write"
      ? { JUMBO_BENCHMARK_STDOUT_CASE: benchmarkCase.commandPath } : {}) },
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe", "pipe"],
    timeout: timeoutMs, killSignal: "SIGKILL", maxBuffer: 1024 * 1024,
  };
  // hrtime uses the same OS monotonic clock in parent and child. The child stamps
  // the boundary, so pipe delivery and process/SQLite cleanup are not measured.
  const startedAt = process.hrtime.bigint();
  const child = spawnSync(process.execPath, args, options);
  const finishedAt = process.hrtime.bigint();
  if (child.error || child.status !== 0 || child.signal) {
    throw new Error(`${benchmarkCase.id}: ${child.error?.message ?? `exit ${child.status}, signal ${child.signal}`}\n${child.stderr ?? ""}\n${child.stdout ?? ""}`);
  }
  let marker;
  try { marker = JSON.parse(child.output[3]); } catch {
    throw new Error(`${benchmarkCase.id}: missing or invalid startup marker; no latency recorded.\n${child.stderr ?? ""}`);
  }
  if (marker.commandPath !== benchmarkCase.commandPath || !/^\d+$/.test(marker.stoppedAt)) {
    throw new Error(`${benchmarkCase.id}: incorrect startup marker: ${JSON.stringify(marker)}`);
  }
  const stoppedAt = BigInt(marker.stoppedAt);
  if (stoppedAt < startedAt || stoppedAt > finishedAt) {
    throw new Error(`${benchmarkCase.id}: startup timestamp is outside the parent process interval.`);
  }
  return { elapsedMs: Number(stoppedAt - startedAt) / 1e6, exitStatus: child.status };
}

function prepareBuild(buildRoot, temporaryRoot, env) {
  const copiedRoot = path.join(temporaryRoot, "build");
  fs.mkdirSync(copiedRoot);
  fs.copyFileSync(path.join(buildRoot, "package.json"), path.join(copiedRoot, "package.json"));
  const dist = path.join(buildRoot, "dist");
  const runtimeFiles = filesUnder(dist).filter(file => !file.endsWith(".map") && !file.endsWith(".d.ts"));
  const buildSha256 = hashFiles(runtimeFiles, buildRoot);
  fs.cpSync(dist, path.join(copiedRoot, "dist"), { recursive: true });
  // No dependency copies or alternate module resolution in the timed process.
  fs.symlinkSync(path.join(buildRoot, "node_modules"), path.join(copiedRoot, "node_modules"), "junction");
  if (fs.existsSync(path.join(buildRoot, "assets"))) {
    fs.cpSync(path.join(buildRoot, "assets"), path.join(copiedRoot, "assets"), { recursive: true });
  }
  const registry = path.join(copiedRoot, "dist/presentation/cli/commands/registry/generated-commands.js");
  // Discover in an untimed, isolated child, not in any measured Node process.
  const discovery = `
    const { commands } = await import(${JSON.stringify(pathToFileURL(registry).href)});
    console.log(JSON.stringify(commands.map(c => ({ path: c.path, metadata: c.metadata, handlerName: c.handler?.name }))));
  `;
  const commands = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "--eval", discovery], {
    cwd: temporaryRoot, env, encoding: "utf8", timeout: 30000, maxBuffer: 4 * 1024 * 1024,
  }));
  const cases = commandCases(commands);
  const jsFiles = filesUnder(path.join(copiedRoot, "dist/presentation/cli")).filter(file => file.endsWith(".js"));
  const exportedFunctions = new Map();
  for (const file of jsFiles) {
    const source = fs.readFileSync(file, "utf8");
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    for (const statement of parsed.statements) {
      if (ts.isFunctionDeclaration(statement) && statement.name && statement.body &&
          statement.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        const name = statement.name.text;
        exportedFunctions.set(name, [...(exportedFunctions.get(name) ?? []), file]);
      }
    }
  }
  for (const command of commands) {
    // Lazy registry arrows have the inferred name "handler", not the exported
    // implementation's name. Instrument the implementation by the generator's
    // naming convention so dispatch and lazy loading remain inside the timer.
    // A metadata-only registry uses the same fallback; eager names stay intact.
    const name = command.handlerName && command.handlerName !== "handler"
      ? command.handlerName : handlerNameFor(command.path);
    const files = exportedFunctions.get(name) ?? [];
    if (files.length !== 1) throw new Error(`Cannot uniquely locate handler ${name} for ${command.path}. Update the benchmark adapter.`);
    const file = files[0];
    fs.writeFileSync(file, instrumentHandler(fs.readFileSync(file, "utf8"), name, command.path));
  }
  return { entry: path.join(copiedRoot, "dist/cli.js"), cases, buildSha256 };
}

export function compareReports(baseline, current) {
  for (const key of ["schemaVersion", "metric", "fixture"]) {
    if (baseline[key] !== current[key]) throw new Error(`Incompatible baseline ${key}; do not compare different measurement contracts.`);
  }
  const previous = new Map(baseline.results.map(result => [result.id, result]));
  const rows = current.results.map(result => {
    const old = previous.get(result.id);
    previous.delete(result.id);
    if (!old) return { id: result.id, status: baseline.config.command ? "not measured in filtered baseline" : "added" };
    if (old.boundary !== result.boundary || old.scenario !== result.scenario ||
        old.commandPath !== result.commandPath || JSON.stringify(old.argv) !== JSON.stringify(result.argv)) {
      return { id: result.id, status: "changed invocation" };
    }
    return {
      id: result.id, status: "compared",
      medianDeltaMs: result.medianMs - old.medianMs,
      medianChangePercent: old.medianMs === 0 ? null : (result.medianMs / old.medianMs - 1) * 100,
      p95DeltaMs: result.p95Ms - old.p95Ms,
    };
  });
  for (const id of previous.keys()) rows.push({ id, status: current.config.command ? "not measured (filtered run)" : "removed" });
  const warnings = [];
  for (const key of ["node", "platform", "arch", "osRelease", "cpu", "hostname"]) {
    if (baseline.environment[key] !== current.environment[key]) warnings.push(`Environment differs: ${key}`);
  }
  if (baseline.harnessSha256 !== current.harnessSha256) warnings.push("Benchmark harness differs; verify that the measurement boundary is unchanged.");
  if (baseline.config.samples !== current.config.samples) warnings.push("Sample counts differ.");
  return { baselineBuildSha256: baseline.build.sha256, warnings, rows };
}

function readBaseline(file) {
  const baseline = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [key, expected] of [["schemaVersion", 1], ["metric", METRIC], ["fixture", FIXTURE]]) {
    if (baseline[key] !== expected) throw new Error(`Incompatible baseline ${key}; do not compare different measurement contracts.`);
  }
  if (!baseline.environment || !baseline.build || !baseline.config ||
      !Array.isArray(baseline.results) || !baseline.results.length ||
      new Set(baseline.results.map(row => row.id)).size !== baseline.results.length) {
    throw new Error("Invalid baseline report structure.");
  }
  for (const row of baseline.results) {
    if (typeof row.id !== "string" || !Array.isArray(row.argv) ||
        !Array.isArray(row.samplesMs) || row.samplesMs.length !== baseline.config.samples || row.exitStatus !== 0) {
      throw new Error(`Invalid baseline samples for ${row.id}.`);
    }
    const stats = statistics(row.samplesMs);
    if (row.medianMs !== stats.medianMs || row.p95Ms !== stats.p95Ms) {
      throw new Error(`Baseline statistics do not match raw samples for ${row.id}.`);
    }
  }
  return baseline;
}

function gitOutput(buildRoot, args) {
  try { return execFileSync("git", ["-C", buildRoot, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return null; }
}

function shuffle(cases, round) {
  const copy = [...cases];
  let seed = round + 1;
  for (let i = copy.length - 1; i > 0; i--) {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({ args: argv, options: {
    samples: { type: "string", default: "20" },
    "timeout-ms": { type: "string", default: "30000" },
    "build-root": { type: "string", default: ROOT },
    output: { type: "string" }, "output-dir": { type: "string" }, compare: { type: "string" },
    command: { type: "string" }, help: { type: "boolean", short: "h" },
  } });
  if (values.help) {
    console.log(`Usage: node benchmarks/startup/cli-startup.mjs [options]
  --samples <n>       Repeated samples after a separate first sample (default 20)
  --output <path>     Override the timestamped filename; never overwrite a file
  --output-dir <dir>  Directory for timestamped reports (default: benchmarks/startup/results/)
  --compare <path>    Compare against a previously saved report
  --command <path>    Measure one exact command or alias, e.g. "goal start"
  --build-root <dir>  Built checkout containing dist/, node_modules/, package.json
  --timeout-ms <n>    Fail a child after this duration (default 30000)
Run npm run build first. See benchmarks/startup/README.md for methodology.`);
    return;
  }
  const samples = Number(values.samples);
  const timeoutMs = Number(values["timeout-ms"]);
  for (const [name, value] of [["samples", samples], ["timeout-ms", timeoutMs]]) {
    if (!Number.isSafeInteger(value) || value < 1) throw new Error(`--${name} must be a positive integer.`);
  }
  if (values.output !== undefined && values["output-dir"] !== undefined) {
    throw new Error("Use either --output or --output-dir, not both.");
  }
  if (values.output && fs.existsSync(values.output)) throw new Error(`Output already exists: ${values.output}`);
  const baseline = values.compare ? readBaseline(values.compare) : null;
  const buildRoot = path.resolve(values["build-root"]);
  if (!fs.existsSync(path.join(buildRoot, "dist/cli.js"))) throw new Error("Built CLI not found. Run npm run build first.");
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jumbo-startup-"));
  try {
    const home = path.join(temporaryRoot, "home");
    fs.mkdirSync(home);
    const env = isolatedEnvironment(home);
    const prepared = prepareBuild(buildRoot, temporaryRoot, env);
    const control = { id: "node (probe control)", commandPath: "node", argv: [], scenario: "outside-project", boundary: "node-control" };
    const utilities = ["--help", "--version"].map(flag => ({
      id: `jumbo ${flag}`, commandPath: flag, argv: [flag], scenario: "outside-project", boundary: "first-stdout-write",
    }));
    let cases = [control, ...utilities, ...prepared.cases];
    if (values.command) {
      cases = cases.filter(c => c.id === `jumbo ${values.command}`);
      if (!cases.length) throw new Error(`Unknown command: ${values.command}`);
    }
    const seed = path.join(temporaryRoot, "seed");
    fs.mkdirSync(path.join(seed, ".jumbo"), { recursive: true });
    // Bootstrap storage/settings/worker identity once, without running a handler.
    // Clone it before EVERY sample so writes during startup cannot accumulate.
    const seedCase = prepared.cases.find(c => c.scenario === "project");
    if (!seedCase) throw new Error("Cannot prepare fixture: no project-scoped command found.");
    runSample({ entry: prepared.entry, benchmarkCase: seedCase, cwd: seed, env, timeoutMs });
    const seedHome = path.join(temporaryRoot, "seed-home");
    fs.cpSync(home, seedHome, { recursive: true });
    const workspace = path.join(temporaryRoot, "workspace");
    const results = new Map(cases.map(c => [c.id, { ...c, firstSampleMs: null, samplesMs: [], exitStatus: 0 }]));
    console.error(`Measuring ${cases.length} invocations: first sample + ${samples} repeated samples each (serial, fresh processes).`);
    for (let round = 0; round <= samples; round++) {
      for (const benchmarkCase of shuffle(cases, round)) {
        fs.rmSync(home, { recursive: true, force: true });
        fs.cpSync(seedHome, home, { recursive: true });
        fs.rmSync(workspace, { recursive: true, force: true });
        if (benchmarkCase.scenario === "project") fs.cpSync(seed, workspace, { recursive: true });
        else fs.mkdirSync(workspace);
        const sample = runSample({ entry: prepared.entry, benchmarkCase, cwd: workspace, env, timeoutMs });
        const result = results.get(benchmarkCase.id);
        if (round === 0) result.firstSampleMs = sample.elapsedMs;
        else result.samplesMs.push(sample.elapsedMs);
      }
      console.error(round === 0 ? "First samples complete." : `Round ${round}/${samples} complete.`);
    }
    const report = {
      schemaVersion: 1, metric: METRIC, fixture: FIXTURE, recordedAt: new Date().toISOString(),
      harnessSha256: hashFiles([fileURLToPath(import.meta.url), PROBE], ROOT),
      environment: {
        node: process.version, executable: process.execPath, platform: process.platform, arch: process.arch,
        osRelease: os.release(), cpu: os.cpus()[0]?.model ?? "unknown", logicalCpus: os.cpus().length,
        hostname: os.hostname(), totalMemoryBytes: os.totalmem(),
      },
      build: {
        root: buildRoot, revision: gitOutput(buildRoot, ["rev-parse", "HEAD"]),
        workingTree: gitOutput(buildRoot, ["status", "--short"]), sha256: prepared.buildSha256,
        version: JSON.parse(fs.readFileSync(path.join(buildRoot, "package.json"), "utf8")).version,
        packageLockSha256: fs.existsSync(path.join(buildRoot, "package-lock.json"))
          ? hashFiles([path.join(buildRoot, "package-lock.json")], buildRoot) : null,
      },
      config: { samples, timeoutMs, command: values.command ?? null, order: "deterministic shuffle per round, seed = round + 1", telemetry: false, compileCache: false, freshProcess: true, coldFilesystemCache: false },
      results: [...results.values()].map(result => ({ ...result, ...statistics(result.samplesMs) })),
    };
    if (baseline) report.comparison = compareReports(baseline, report);
    console.log("\nCommand                              First ms  Median ms     P95 ms");
    for (const result of report.results) {
      console.log(`${result.id.padEnd(36)} ${result.firstSampleMs.toFixed(2).padStart(9)} ${result.medianMs.toFixed(2).padStart(10)} ${result.p95Ms.toFixed(2).padStart(10)}`);
    }
    if (report.comparison) {
      for (const warning of report.comparison.warnings) console.error(`Warning: ${warning}`);
      console.log("\nCompared with baseline (negative deltas mean faster):");
      for (const row of report.comparison.rows) {
        console.log(row.status === "compared"
          ? `${row.id}: median ${row.medianDeltaMs.toFixed(2)} ms (${row.medianChangePercent?.toFixed(1) ?? "n/a"}%), p95 ${row.p95DeltaMs.toFixed(2)} ms`
          : `${row.id}: ${row.status}`);
      }
    }
    const savedPath = saveReport(report, { output: values.output, outputDir: values["output-dir"] });
    console.error(`Saved ${savedPath}`);
    return report;
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
