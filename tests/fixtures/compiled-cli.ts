import { spawnSync } from "node:child_process";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ApplicationRoot } from "../../src/application/host/ApplicationRoot.js";
import { applicationEnvironment, applicationRoot } from "./application-root.js";

export interface CliTrace {
  module?: string;
  startupCall?: string;
  tui?: boolean;
  initialized?: boolean;
  planned?: boolean;
}

export async function snapshot(directory: string): Promise<Record<string, string>> {
  const entries: Record<string, string> = {};
  async function walk(current: string): Promise<void> {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      entries[path.relative(directory, file)] = entry.isDirectory() ? "directory" : (await fs.readFile(file)).toString("base64");
      if (entry.isDirectory()) await walk(file);
    }
  }
  await walk(directory);
  return entries;
}

/** Fresh-process CLI tracing; only the interactive launcher is replaced. */
export class CompiledCliFixture {
  readonly cli = path.resolve("dist/app.js");
  readonly cwd: string;
  readonly root: ApplicationRoot;
  private readonly traceFile: string;
  private readonly loader: string;

  private constructor(readonly directory: string) {
    this.cwd = path.join(directory, "checkout");
    this.root = applicationRoot(directory);
    this.traceFile = path.join(directory, "trace.jsonl");
    this.loader = path.join(directory, "loader.mjs");
  }

  static async create(): Promise<CompiledCliFixture> {
    const directory = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-cli-root-")));
    const fixture = new CompiledCliFixture(directory);
    await fs.ensureDir(fixture.cwd);
    await fs.writeFile(fixture.loader, `
      import { appendFileSync } from 'node:fs';
      const record = value => appendFileSync(process.env.JUMBO_TEST_TRACE, JSON.stringify(value) + String.fromCharCode(10));
      export async function load(url, context, nextLoad) {
        const name = new URL(url).pathname;
        if (name.includes('/dist/')) record({ module: name.slice(name.indexOf('/dist/') + 6) });
        if (name.endsWith('/dist/presentation/tui/application-shell/ApplicationLauncher.js')) {
          return { format: 'module', shortCircuit: true, source: \`
            import { appendFileSync } from 'node:fs';
            const record = value => appendFileSync(process.env.JUMBO_TEST_TRACE, JSON.stringify(value) + String.fromCharCode(10));
            export class ApplicationLauncher {
              constructor(version, dependencies, cwd) { this.dependencies = dependencies; this.cwd = cwd; }
              async launch() {
                record({ tui: true, initialized: Boolean(this.dependencies.stateReaderControllers.getProjectSummaryQueryHandler) });
                if (!this.dependencies.stateReaderControllers.getProjectSummaryQueryHandler) {
                  await this.dependencies.actionControllers.planProjectInitController.handle({ projectRoot: this.cwd });
                  record({ planned: true });
                }
              }
            }
          \` };
        }
        const loaded = await nextLoad(url, context);
        const startupClass = name.endsWith('/dist/application/host/ApplicationRoot.js') ? 'ApplicationRoot'
          : name.endsWith('/dist/infrastructure/host/ContextProject.js') ? 'CachedContextProject'
          : name.endsWith('/dist/migration/LegacyInstallationDetector.js') ? 'LegacyInstallationDetector' : null;
        if (startupClass) {
          const method = startupClass === 'LegacyInstallationDetector' ? 'find(workingDirectory) {'
            : startupClass === 'CachedContextProject' ? 'static get() {' : 'static getInstance() {';
          const traceImport = 'import { appendFileSync as recordStartupCall } from "node:fs";';
          const traceCall = 'recordStartupCall(process.env.JUMBO_TEST_TRACE, JSON.stringify({ startupCall: '
            + JSON.stringify(startupClass) + ' }) + String.fromCharCode(10));';
          return { ...loaded, source: traceImport + loaded.source.toString().replace(method, method + traceCall) };
        }
        return loaded;
      }
    `);
    return fixture;
  }

  async invoke(directory: string, args: string[], environment: NodeJS.ProcessEnv = {}) {
    await fs.writeFile(this.traceFile, "");
    const result = spawnSync(process.execPath, ["--experimental-loader", pathToFileURL(this.loader).href, this.cli, ...args], {
      cwd: directory, encoding: "utf8", timeout: 20_000,
      env: { ...applicationEnvironment(this.directory), JUMBO_TEST_TRACE: this.traceFile, ...environment },
    });
    if (result.error) throw result.error;
    const trace = (await fs.readFile(this.traceFile, "utf8")).split("\n").filter(Boolean).map(line => JSON.parse(line)) as CliTrace[];
    return { ...result, trace };
  }

  dispose(): Promise<void> {
    return fs.remove(this.directory);
  }
}
