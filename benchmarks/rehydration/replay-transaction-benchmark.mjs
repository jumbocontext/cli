/**
 * Benchmark: Event replay with vs without transaction wrapping.
 *
 * Simulates the LocalDatabaseRebuildService replay loop using
 * a realistic schema and event payload size. Measures wall-clock
 * time for individual auto-commit writes vs a single wrapping
 * transaction.
 *
 * Usage: node benchmarks/replay-transaction-benchmark.mjs [eventCount]
 */

import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const EVENT_COUNT = parseInt(process.argv[2] ?? "1000", 10);
const WARM_UP_RUNS = 2;
const MEASURED_RUNS = 5;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS goal_views (
  goalId TEXT PRIMARY KEY,
  objective TEXT NOT NULL,
  successCriteria TEXT NOT NULL,
  scopeIn TEXT NOT NULL,
  scopeOut TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  title TEXT,
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_goal_status ON goal_views(status);
CREATE INDEX IF NOT EXISTS idx_goal_created ON goal_views(createdAt);

CREATE TABLE IF NOT EXISTS decision_views (
  decisionId TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  context TEXT NOT NULL,
  outcome TEXT NOT NULL,
  status TEXT NOT NULL,
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS guideline_views (
  guidelineId TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT NOT NULL,
  examples TEXT NOT NULL,
  isRemoved INTEGER NOT NULL DEFAULT 0,
  removedAt TEXT,
  removalReason TEXT,
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS component_views (
  componentId TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS search_index_entries (
  sourceType TEXT NOT NULL,
  sourceId TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  facets TEXT NOT NULL,
  metadata TEXT NOT NULL,
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (sourceType, sourceId)
);
`;

function generateEvents(count) {
  const types = ["goal", "decision", "guideline", "component"];
  const events = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const id = randomUUID();
    const ts = new Date(now.getTime() + i * 100).toISOString();

    switch (type) {
      case "goal":
        events.push({
          type: "GoalAddedEvent",
          write: (db) => {
            db.prepare(`
              INSERT INTO goal_views (goalId, objective, successCriteria, scopeIn, scopeOut, status, title, version, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(id, `Objective for goal ${i}`, '["criterion 1","criterion 2"]', '["scope-a"]', '["scope-b"]', "defined", `Goal ${i}`, 1, ts, ts);
          },
        });
        break;
      case "decision":
        events.push({
          type: "DecisionAddedEvent",
          write: (db) => {
            db.prepare(`
              INSERT INTO decision_views (decisionId, title, context, outcome, status, version, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(id, `Decision ${i}`, `Context for decision ${i} with some detail`, `Outcome for decision ${i}`, "active", 1, ts, ts);
          },
        });
        break;
      case "guideline":
        events.push({
          type: "GuidelineAddedEvent",
          write: (db) => {
            db.prepare(`
              INSERT INTO guideline_views (guidelineId, category, title, description, rationale, examples, version, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(id, "architecture", `Guideline ${i}`, `Description for guideline ${i}`, `Rationale for guideline ${i}`, '["example-1","example-2"]', 1, ts, ts);
          },
        });
        break;
      case "component":
        events.push({
          type: "ComponentAddedEvent",
          write: (db) => {
            db.prepare(`
              INSERT INTO component_views (componentId, name, description, type, status, version, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(id, `component-${i}`, `Description for component ${i}`, "service", "active", 1, ts, ts);
          },
        });
        break;
    }
  }

  return events;
}

function createFreshDb(label) {
  const dbPath = path.join(os.tmpdir(), `jumbo-bench-${label}-${Date.now()}.db`);
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  return { db, dbPath };
}

function replayWithoutTransaction(db, events) {
  for (const event of events) {
    event.write(db);
  }
}

function replayWithTransaction(db, events) {
  db.exec("BEGIN");
  try {
    for (const event of events) {
      event.write(db);
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

function runBenchmark(label, replayFn, events, runs) {
  const times = [];

  for (let r = 0; r < runs; r++) {
    const { db, dbPath } = createFreshDb(`${label}-${r}`);

    const start = process.hrtime.bigint();
    replayFn(db, events);
    const end = process.hrtime.bigint();

    times.push(Number(end - start) / 1_000_000);

    db.close();
    fs.unlinkSync(dbPath);
    try { fs.unlinkSync(`${dbPath}-wal`); } catch {}
    try { fs.unlinkSync(`${dbPath}-shm`); } catch {}
  }

  return times;
}

// --- Main ---

console.log(`\nEvent Replay Transaction Benchmark`);
console.log(`Events: ${EVENT_COUNT} | Warm-up: ${WARM_UP_RUNS} | Measured: ${MEASURED_RUNS}\n`);

const events = generateEvents(EVENT_COUNT);

// Warm-up
runBenchmark("warmup-no-txn", replayWithoutTransaction, events, WARM_UP_RUNS);
runBenchmark("warmup-txn", replayWithTransaction, events, WARM_UP_RUNS);

// Measured runs
const noTxnTimes = runBenchmark("no-txn", replayWithoutTransaction, events, MEASURED_RUNS);
const txnTimes = runBenchmark("txn", replayWithTransaction, events, MEASURED_RUNS);

function stats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return { median, mean, min, max };
}

const noTxnStats = stats(noTxnTimes);
const txnStats = stats(txnTimes);
const speedup = noTxnStats.median / txnStats.median;

console.log(`Without transaction (current code):`);
console.log(`  median: ${noTxnStats.median.toFixed(1)}ms  mean: ${noTxnStats.mean.toFixed(1)}ms  min: ${noTxnStats.min.toFixed(1)}ms  max: ${noTxnStats.max.toFixed(1)}ms`);
console.log(`  runs: [${noTxnTimes.map(t => t.toFixed(1) + "ms").join(", ")}]`);
console.log();
console.log(`With transaction (proposed fix):`);
console.log(`  median: ${txnStats.median.toFixed(1)}ms  mean: ${txnStats.mean.toFixed(1)}ms  min: ${txnStats.min.toFixed(1)}ms  max: ${txnStats.max.toFixed(1)}ms`);
console.log(`  runs: [${txnTimes.map(t => t.toFixed(1) + "ms").join(", ")}]`);
console.log();
console.log(`Speedup: ${speedup.toFixed(1)}x faster (median)`);
console.log(`Per-event: ${(noTxnStats.median / EVENT_COUNT).toFixed(3)}ms -> ${(txnStats.median / EVENT_COUNT).toFixed(3)}ms`);
