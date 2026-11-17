// Loaded only by benchmark children, never by the shipped CLI.
const { writeSync } = require("node:fs");
const exit = process.exit.bind(process); // CliRunner later intercepts process.exit requests.

function stop(commandPath) {
  const stoppedAt = process.hrtime.bigint().toString();
  writeSync(3, JSON.stringify({ commandPath, stoppedAt }) + "\n");
  exit(0);
}

globalThis.__jumboStartupBenchmarkStop = stop;

// Help/version have no registered handler. Measure their first output boundary
// separately, before writing anything to stdout, rather than timing process exit.
if (process.env.JUMBO_BENCHMARK_STDOUT_CASE) {
  process.stdout.write = () => stop(process.env.JUMBO_BENCHMARK_STDOUT_CASE);
}
