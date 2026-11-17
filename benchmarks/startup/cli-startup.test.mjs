import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import {
  statistics, commandCases, instrumentHandler, isolatedEnvironment, runSample, compareReports,
  reportFileName, saveReport,
} from "./cli-startup.mjs";

function temporary(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "jumbo-startup-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

const baseCase = {
  id: "jumbo fixture run", commandPath: "fixture run", argv: [],
  boundary: "handler-entry", scenario: "project",
};

function sample(t, source, overrides = {}, timeoutMs = 5000) {
  const root = temporary(t);
  const entry = path.join(root, "cli.mjs");
  fs.writeFileSync(entry, source);
  return runSample({ entry, benchmarkCase: { ...baseCase, ...overrides }, cwd: root, env: isolatedEnvironment(root), timeoutMs });
}

test("report names use sortable, filesystem-safe UTC timestamps with milliseconds", () => {
  assert.equal(reportFileName("2026-10-27T20:11:57.024Z"), "cli-startup-2026-10-27T20-11-57-024Z.json");
  assert.equal(reportFileName("2026-10-27T22:11:57.024+02:00"), reportFileName("2026-10-27T20:11:57.024Z"));
  assert.ok(reportFileName("2026-10-27T20:11:57.024Z") < reportFileName("2026-10-28T00:00:00.000Z"));
  assert.throws(() => reportFileName("not a date"));
});

test("timestamp collisions retain every report and explicit filenames are never overwritten", t => {
  const outputDir = path.join(temporary(t), "results");
  const report = { recordedAt: "2026-10-27T20:11:57.024Z", results: [] };
  const first = saveReport(report, { outputDir });
  const second = saveReport({ ...report, note: "second" }, { outputDir });
  const third = saveReport({ ...report, note: "third" }, { outputDir });
  assert.equal(path.basename(first), reportFileName(report.recordedAt));
  assert.equal(path.basename(second), "cli-startup-2026-10-27T20-11-57-024Z-001.json");
  assert.equal(path.basename(third), "cli-startup-2026-10-27T20-11-57-024Z-002.json");
  assert.deepEqual(JSON.parse(fs.readFileSync(first, "utf8")), report);
  assert.equal(JSON.parse(fs.readFileSync(second, "utf8")).note, "second");
  const explicit = path.join(outputDir, "explicit.json");
  assert.equal(saveReport(report, { output: explicit }), explicit);
  assert.throws(() => saveReport(report, { output: explicit }), { code: "EEXIST" });
  assert.equal(fs.readdirSync(outputDir).length, 4);
});

test("median averages the middle pair; p95 uses nearest rank; samples stay untouched", () => {
  const samples = [4, 1, 2, 3];
  assert.deepEqual(statistics(samples), { medianMs: 2.5, p95Ms: 4, minMs: 1, maxMs: 4, meanMs: 2.5 });
  assert.deepEqual(samples, [4, 1, 2, 3]);
  assert.equal(statistics([3, 1, 2]).medianMs, 2);
  assert.equal(statistics(Array.from({ length: 20 }, (_, i) => i + 1)).p95Ms, 19);
  for (const values of [[], [NaN], [Infinity], [-1]]) assert.throws(() => statistics(values));
});

test("discovers hidden commands, aliases, required variadic flags, and defaults", () => {
  const cases = commandCases([{
    path: "project init", metadata: {
      requiresProject: false, hidden: true, topLevelAliases: ["init"],
      requiredOptions: [
        { flags: "-n, --name <name>" }, { flags: "--criteria <criteria...>" },
        { flags: "--yes" }, { flags: "--reason [reason]", default: "why" },
      ],
    },
  }, { path: "goals list", metadata: { requiresProject: true } }]);
  assert.equal(cases.length, 3);
  const alias = cases.find(c => c.id === "jumbo init");
  assert.equal(alias.commandPath, "project init");
  assert.equal(alias.aliasFor, "project init");
  assert.equal(alias.hidden, true);
  assert.equal(alias.scenario, "outside-project");
  assert.deepEqual(alias.argv, ["init", "--name", "benchmark-placeholder", "--criteria", "benchmark-placeholder", "--yes", "--reason", "benchmark-placeholder"]);
  assert.equal(cases.find(c => c.id === "jumbo goals list").scenario, "project");
});

test("discovery fails on missing project metadata, empty/duplicate names, and unknown flags", () => {
  assert.throws(() => commandCases([]), /empty/);
  assert.throws(() => commandCases([{ path: "missing", metadata: {} }]), /requiresProject/);
  assert.throws(() => commandCases([{ path: "duplicate", metadata: { requiresProject: true, topLevelAliases: ["duplicate"] } }]), /duplicate/);
  assert.throws(() => commandCases([{ path: "bad", metadata: { requiresProject: true, requiredOptions: [{ flags: "bad" }] } }]), /option syntax/);
});

test("instrumentation stops before the first handler statement, even with intercepted exit", t => {
  const source = `
    import fs from 'node:fs';
    export async function fixtureRun() {
      fs.writeFileSync('HANDLER-RAN', 'unsafe');
      throw new Error('handler must never run');
    }
    process.exit = () => { throw new Error('telemetry exit trap'); };
    await fixtureRun();
  `;
  const root = temporary(t);
  const entry = path.join(root, "cli.mjs");
  fs.writeFileSync(entry, instrumentHandler(source, "fixtureRun", "fixture run"));
  const result = runSample({ entry, benchmarkCase: baseCase, cwd: root, env: isolatedEnvironment(root) });
  assert.equal(result.exitStatus, 0);
  assert.ok(result.elapsedMs > 0);
  assert.equal(fs.existsSync(path.join(root, "HANDLER-RAN")), false);
  assert.ok(source.includes("export async function fixtureRun() {\n      fs.writeFileSync"));
});

test("instrumentation preserves the import graph and rejects unsupported handler shapes", () => {
  const source = `import './dependency.js';\nexport async function selected() { return 'untouched'; }`;
  const instrumented = instrumentHandler(source, "selected", "fixture run");
  assert.equal(instrumented.replace('\n globalThis.__jumboStartupBenchmarkStop("fixture run");\n', ""), source);
  assert.throws(() => instrumentHandler("export const selected = () => {};", "selected", "fixture run"), /Expected one exported function/);
  assert.throws(() => instrumentHandler(source, "missing", "fixture run"), /found 0/);
});

test("missing marker, wrong handler, nonzero exits, and timeouts never become timings", t => {
  assert.throws(() => sample(t, "// clean exit without a marker"), /missing or invalid startup marker/);
  assert.throws(() => sample(t, 'globalThis.__jumboStartupBenchmarkStop("wrong");'), /incorrect startup marker/);
  assert.throws(() => sample(t, "process.exit(7);"), /exit 7/);
  assert.throws(() => sample(t, "setInterval(() => {}, 1000);", {}, 100), /ETIMEDOUT/);
});

test("malformed, duplicate, and out-of-interval markers are rejected", t => {
  const write = "import { writeSync } from 'node:fs';";
  assert.throws(() => sample(t, write + "writeSync(3, 'not JSON');"), /invalid startup marker/);
  assert.throws(() => sample(t, write + `writeSync(3, JSON.stringify({ commandPath: 'fixture run', stoppedAt: '1' }));`), /outside the parent process interval/);
  assert.throws(() => sample(t, write + `writeSync(3, '{}\\n{}');`), /invalid startup marker/);
});

test("help/version stop at first stdout write; node control uses the same probe", t => {
  assert.ok(sample(t, `console.log('help'); throw new Error('should not execute');`, {
    commandPath: "--help", boundary: "first-stdout-write",
  }).elapsedMs > 0);
  assert.ok(sample(t, "throw new Error('control must not load entry');", {
    commandPath: "node", boundary: "node-control",
  }).elapsedMs > 0);
});

test("child environment omits inherited injection flags and credentials", () => {
  const env = isolatedEnvironment("/isolated/home");
  assert.equal(env.HOME, "/isolated/home");
  assert.equal(env.JUMBO_TELEMETRY_DISABLED, "1");
  assert.equal(env.NODE_DISABLE_COMPILE_CACHE, "1");
  assert.equal(env.NODE_OPTIONS, undefined);
  assert.equal(env.POSTHOG_API_KEY, undefined);
  assert.equal(env.VSCODE_PID, undefined);
});

function report(results) {
  return {
    schemaVersion: 1, metric: "test", fixture: "empty", environment: { node: "v1" },
    config: { samples: 20 }, harnessSha256: "harness", build: { sha256: "build" }, results,
  };
}
function row(id, medianMs = 100, p95Ms = 200) {
  return { ...baseCase, id, medianMs, p95Ms };
}

test("comparison reports speedups, regressions, new/removed commands and changed invocations", () => {
  const previous = report([row("faster"), row("slower"), row("removed"), row("changed")]);
  const current = report([row("faster", 50, 100), row("slower", 120, 220), row("added"), { ...row("changed"), argv: ["new"] }]);
  const comparison = compareReports(previous, current);
  assert.equal(comparison.rows[0].medianChangePercent, -50);
  assert.equal(comparison.rows[0].p95DeltaMs, -100);
  assert.equal(comparison.rows[1].medianDeltaMs, 20);
  assert.equal(comparison.rows[2].status, "added");
  assert.equal(comparison.rows[3].status, "changed invocation");
  assert.equal(comparison.rows[4].status, "removed");
  assert.deepEqual(comparison.warnings, []);
  assert.throws(() => compareReports(previous, { ...current, metric: "different" }), /measurement contracts/);
  assert.ok(compareReports(previous, { ...current, environment: { node: "v2" } }).warnings.includes("Environment differs: node"));
  assert.equal(compareReports(previous, { ...current, config: { samples: 20, command: "faster" } }).rows.at(-1).status, "not measured (filtered run)");
});

test("CLI validates arguments and protects existing baseline files before running", t => {
  const cli = path.resolve("benchmarks/startup/cli-startup.mjs");
  assert.match(execFileSync(process.execPath, [cli, "--help"], { encoding: "utf8" }), /--compare/);
  for (const value of ["0", "-1", "1.5", "NaN", "Infinity"]) {
    const child = spawnSync(process.execPath, [cli, `--samples=${value}`], { encoding: "utf8" });
    assert.equal(child.status, 1);
    assert.match(child.stderr, /positive integer/);
  }
  const root = temporary(t);
  const baseline = path.join(root, "baseline.json");
  fs.writeFileSync(baseline, "keep me");
  const child = spawnSync(process.execPath, [cli, "--output", baseline], { encoding: "utf8" });
  assert.equal(child.status, 1);
  assert.match(child.stderr, /already exists/);
  assert.equal(fs.readFileSync(baseline, "utf8"), "keep me");
  const conflicting = spawnSync(process.execPath, [cli, "--output", baseline, "--output-dir", root], { encoding: "utf8" });
  assert.equal(conflicting.status, 1);
  assert.match(conflicting.stderr, /either --output or --output-dir/);
});

for (const registryStyle of ["eager", "lazy", "mixed"]) test(
  `end-to-end ${registryStyle} registry discovers all commands, saves comparable reports, and leaves build and handlers untouched`, t => {
  const root = temporary(t);
  const registryDir = path.join(root, "dist/presentation/cli/commands/registry");
  fs.mkdirSync(registryDir, { recursive: true });
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ type: "module", version: "0.0.0-test" }));
  fs.symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"), "junction");
  const handlerFile = path.join(registryDir, "handlers.js");
  const handlerSource = `
    import fs from 'node:fs';
    export async function fixtureRun() { fs.writeFileSync(${JSON.stringify(path.join(root, "HANDLER-RAN"))}, 'bad'); }
    export async function fixtureInit() { throw new Error('initialization must not execute'); }
    // A generic exported function must not be mistaken for a lazy wrapper's target.
    export function handler() { throw new Error('unrelated function'); }
  `;
  fs.writeFileSync(handlerFile, handlerSource);
  const wrapperMarker = path.join(root, "WRAPPER-RAN");
  const lazyHandler = name => `async () => {
    const fs = await import('node:fs');
    fs.writeFileSync(${JSON.stringify(wrapperMarker)}, 'wrapper ran before handler entry');
    const { ${name} } = await import('./handlers.js');
    await ${name}();
    throw new Error('handler-entry probe must exit');
  }`;
  fs.writeFileSync(path.join(registryDir, "generated-commands.js"), `
    ${registryStyle === "eager" ? "import { fixtureRun, fixtureInit } from './handlers.js';"
      : registryStyle === "mixed" ? "import { fixtureInit } from './handlers.js';" : ""}
    export const commands = [
      { path: 'fixture run', handler: ${registryStyle === "eager" ? "fixtureRun" : lazyHandler("fixtureRun")}, metadata: { requiresProject: true, hidden: true, requiredOptions: [{ flags: '--id <id>' }] } },
      { path: 'fixture init', handler: ${registryStyle === "lazy" ? lazyHandler("fixtureInit") : "fixtureInit"}, metadata: { requiresProject: false, topLevelAliases: ['init'] } }
    ];
  `);
  fs.writeFileSync(path.join(root, "dist/cli.js"), `
    import { Command } from 'commander';
    import fs from 'node:fs';
    import { commands } from './presentation/cli/commands/registry/generated-commands.js';
    const program = new Command().version('fixture');
    const parent = program.command('fixture');
    for (const command of commands) {
      const cmd = parent.command(command.path.split(' ')[1]);
      for (const option of command.metadata.requiredOptions ?? []) cmd.requiredOption(option.flags);
      cmd.action(() => {
        if (command.metadata.requiresProject && !fs.existsSync('.jumbo')) throw new Error('no fixture');
        return command.handler();
      });
      for (const alias of command.metadata.topLevelAliases ?? []) program.command(alias).action(command.handler);
    }
    await program.parseAsync();
  `);
  // Copy the harness too, so its real default results directory is tested without
  // writing test reports into the repository's benchmark history.
  const harnessDir = path.join(root, "benchmarks/startup");
  fs.mkdirSync(harnessDir, { recursive: true });
  for (const file of ["cli-startup.mjs", "cli-startup-probe.cjs"]) {
    fs.copyFileSync(path.resolve("benchmarks/startup", file), path.join(harnessDir, file));
  }
  const cli = path.join(harnessDir, "cli-startup.mjs");
  const resultsDir = path.join(harnessDir, "results");
  const args = [cli, "--build-root", root, "--samples", "2"];
  execFileSync(process.execPath, args, { stdio: "pipe" });
  const firstFiles = fs.readdirSync(resultsDir);
  assert.equal(firstFiles.length, 1);
  const before = path.join(resultsDir, firstFiles[0]);
  const originalReport = fs.readFileSync(before, "utf8");
  execFileSync(process.execPath, [...args, "--compare", before], { stdio: "pipe" });
  const files = fs.readdirSync(resultsDir);
  assert.equal(files.length, 2);
  assert.equal(fs.readFileSync(before, "utf8"), originalReport);
  const after = path.join(resultsDir, files.find(file => file !== firstFiles[0]));
  const report = JSON.parse(fs.readFileSync(after, "utf8"));
  assert.equal(path.basename(after), reportFileName(report.recordedAt));
  assert.equal(report.results.length, 6); // Two commands, alias, help, version, Node control.
  assert.equal(report.comparison.rows.length, 6);
  assert.ok(report.comparison.rows.every(row => row.status === "compared"));
  assert.equal(report.build.sha256, JSON.parse(fs.readFileSync(before, "utf8")).build.sha256);
  assert.equal(report.environment.executable, process.execPath);
  for (const result of report.results) {
    assert.equal(result.samplesMs.length, 2);
    assert.equal(result.exitStatus, 0);
    assert.ok(result.firstSampleMs > 0);
    assert.deepEqual(statistics(result.samplesMs), {
      medianMs: result.medianMs, p95Ms: result.p95Ms, minMs: result.minMs,
      maxMs: result.maxMs, meanMs: result.meanMs,
    });
  }
  assert.equal(fs.existsSync(path.join(root, "HANDLER-RAN")), false);
  assert.equal(fs.existsSync(wrapperMarker), registryStyle !== "eager");
  assert.equal(fs.existsSync(path.join(root, ".jumbo")), false);
  assert.equal(fs.readFileSync(handlerFile, "utf8"), handlerSource);
  const alternateResults = path.join(root, "alternate-results");
  execFileSync(process.execPath, [...args, "--command", "fixture run", "--output-dir", alternateResults], { stdio: "pipe" });
  const alternateFiles = fs.readdirSync(alternateResults);
  assert.equal(alternateFiles.length, 1);
  const alternate = JSON.parse(fs.readFileSync(path.join(alternateResults, alternateFiles[0]), "utf8"));
  assert.equal(alternateFiles[0], reportFileName(alternate.recordedAt));
  assert.equal(alternate.results.length, 1);
  assert.equal(alternate.results[0].id, "jumbo fixture run");
  assert.equal(fs.readdirSync(resultsDir).length, 2);
  report.results[0].medianMs += 10;
  const tampered = path.join(root, "tampered.json");
  fs.writeFileSync(tampered, JSON.stringify(report));
  const rejected = spawnSync(process.execPath, [...args, "--compare", tampered], { encoding: "utf8" });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /statistics do not match raw samples/);
  assert.doesNotMatch(rejected.stderr, /Measuring/);
});
