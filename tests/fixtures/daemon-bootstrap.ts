import { spawnSync } from "node:child_process";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ApplicationRoot } from "../../src/application/host/ApplicationRoot.js";
import { applicationRoot, applicationEnvironment } from "./application-root.js";

/** Trace daemon routing while replacing service construction and the endless polling loop. */
export class DaemonBootstrapFixture {
  readonly outside: string;
  readonly project: string;
  readonly nested: string;
  readonly root: ApplicationRoot;
  private readonly trace: string;
  private readonly loader: string;

  private constructor(readonly directory: string) {
    this.outside = path.join(directory, "outside");
    this.project = path.join(directory, "project");
    this.nested = path.join(this.project, "nested");
    this.root = applicationRoot(directory);
    this.trace = path.join(directory, "trace.jsonl");
    this.loader = path.join(directory, "loader.mjs");
  }

  static async create(): Promise<DaemonBootstrapFixture> {
    const directory = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-daemon-bootstrap-")));
    const fixture = new DaemonBootstrapFixture(directory);
    await fs.ensureDir(fixture.outside);
    await fs.ensureDir(fixture.nested);
    const git = spawnSync("git", ["init", fixture.project], { encoding: "utf8" });
    if (git.error || git.status !== 0) throw git.error ?? new Error(git.stderr);
    await fs.outputJson(fixture.root.getProjectSettings(fixture.project), { project: { id: "daemon-project" }, connection: { backend: "local" } });
    await fs.writeFile(path.join(fixture.outside, "sentinel"), "unchanged outside");
    await fs.outputFile(fixture.root.getProjectDbFile(fixture.project), "unchanged database");
    await fs.writeFile(fixture.loader, `
      import { appendFileSync } from 'node:fs';
      const record = value => appendFileSync(process.env.JUMBO_TEST_TRACE, JSON.stringify(value) + String.fromCharCode(10));
      export async function load(url, context, nextLoad) {
        if (url.endsWith('/host/LeafContainerBuilder.js')) {
          record({ compositionImported: true });
          return { format: 'module', shortCircuit: true, source: \`
            import { appendFileSync } from 'node:fs';
            import { CachedContextProject } from './ContextProject.js';
            import { ApplicationRoot } from '../../application/host/ApplicationRoot.js';
            export class LeafContainerBuilder {
              constructor() {
                return new Proxy(this, {
                  get(target, property) {
                    if (property === 'then') return undefined;
                    if (property === 'build') {
                      return async () => {
                        const root = ApplicationRoot.getInstance().getProjectDirectory(CachedContextProject.get().path);
                        appendFileSync(process.env.JUMBO_TEST_TRACE, JSON.stringify({ root }) + String.fromCharCode(10));
                        return { telemetryClient: {} };
                      };
                    }
                    if (property === 'dispose') return async () => {};
                    return () => target;
                  },
                });
              }
            }
          \` };
        }
        if (url.endsWith('/daemons/PollingLoop.js')) return { format: 'module', shortCircuit: true, source: 'export class PollingLoop { async run() {} }' };
        if (['LocalProjectDatabase.js', 'MigrationRunner.js'].some(name => url.endsWith('/' + name))) throw new Error('Forbidden storage import: ' + url);
        return nextLoad(url, context);
      }
    `);
    return fixture;
  }

  async invoke(daemon: string, cwd: string) {
    await fs.writeFile(this.trace, "");
    const result = spawnSync(process.execPath, ["--experimental-loader", pathToFileURL(this.loader).href, path.resolve(`dist/presentation/work/${daemon}.daemon.js`)], {
      cwd, encoding: "utf8", timeout: 20_000, env: { ...applicationEnvironment(this.directory), JUMBO_TEST_TRACE: this.trace },
    });
    if (result.error) throw result.error;
    const records = (await fs.readFile(this.trace, "utf8")).split("\n").filter(Boolean).map(line => JSON.parse(line)) as unknown[];
    return { ...result, records };
  }

  dispose(): Promise<void> {
    return fs.remove(this.directory);
  }
}
