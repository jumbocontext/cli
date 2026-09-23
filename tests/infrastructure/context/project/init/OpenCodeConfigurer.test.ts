import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { AgentFileAssetContent } from "../../../../../src/domain/project/AgentFileAssetContent.js";
import { OpenCodeConfigurer } from "../../../../../src/infrastructure/context/project/init/OpenCodeConfigurer.js";

type ShellFixture = {
  readonly stdout: string;
  readonly stderr?: string;
  readonly exitCode: number;
};

type ShellInvocation = {
  command: string;
  cwd?: string;
  quiet: boolean;
  nothrow: boolean;
};

function createShell(fixtures: ShellFixture[]) {
  const invocations: ShellInvocation[] = [];
  const shell = (strings: TemplateStringsArray, ...values: unknown[]) => {
    const command = strings.reduce(
      (result, part, index) =>
        `${result}${part}${index < values.length ? String(values[index]) : ""}`,
      "",
    );
    const fixture = fixtures.shift();
    if (!fixture) {
      throw new Error(`Unexpected command: ${command}`);
    }

    const invocation: ShellInvocation = {
      command,
      quiet: false,
      nothrow: false,
    };
    invocations.push(invocation);
    const promise = Promise.resolve({
      exitCode: fixture.exitCode,
      stderr: Buffer.from(fixture.stderr ?? ""),
      text: () => fixture.stdout,
    }) as Promise<{ exitCode: number; stderr: Buffer; text(): string }> & {
      cwd(value: string): typeof promise;
      quiet(): typeof promise;
      nothrow(): typeof promise;
    };
    promise.cwd = (value: string) => {
      invocation.cwd = value;
      return promise;
    };
    promise.quiet = () => {
      invocation.quiet = true;
      return promise;
    };
    promise.nothrow = () => {
      invocation.nothrow = true;
      return promise;
    };
    return promise;
  };

  return { shell, invocations };
}

describe("OpenCodeConfigurer", () => {
  let projectRoot: string;
  let configurer: OpenCodeConfigurer;

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "jumbo-opencode-configurer-"),
    );
    configurer = new OpenCodeConfigurer();
  });

  afterEach(async () => {
    await fs.remove(projectRoot);
  });

  it("creates only the managed plugin and preserves existing OpenCode files", async () => {
    const configPath = path.join(projectRoot, "opencode.json");
    const unrelatedPluginPath = path.join(
      projectRoot,
      ".opencode",
      "plugins",
      "custom.js",
    );
    await fs.ensureDir(path.dirname(unrelatedPluginPath));
    await fs.writeFile(configPath, '{"theme":"custom"}\n', "utf-8");
    await fs.writeFile(
      unrelatedPluginPath,
      "export const Custom = async () => ({});\n",
      "utf-8",
    );

    await configurer.configure(projectRoot);
    await configurer.configure(projectRoot);

    expect(await fs.readFile(configPath, "utf-8")).toBe('{"theme":"custom"}\n');
    expect(await fs.readFile(unrelatedPluginPath, "utf-8")).toBe(
      "export const Custom = async () => ({});\n",
    );
    expect(
      await fs.readFile(
        path.join(projectRoot, ".opencode", "plugins", "jumbo.js"),
        "utf-8",
      ),
    ).toBe(AgentFileAssetContent.readScript("opencode-jumbo-plugin.js"));
  });

  it("keeps an existing plugin during additive configuration and refreshes it during repair", async () => {
    const pluginPath = path.join(
      projectRoot,
      ".opencode",
      "plugins",
      "jumbo.js",
    );
    await fs.ensureDir(path.dirname(pluginPath));
    await fs.writeFile(pluginPath, "// local version\n", "utf-8");
    const unrelatedPluginPath = path.join(
      projectRoot,
      ".opencode",
      "plugins",
      "custom.js",
    );
    await fs.writeFile(unrelatedPluginPath, "// keep\n", "utf-8");
    await fs.writeFile(
      path.join(projectRoot, "opencode.json"),
      '{"plugin":["custom-plugin"]}\n',
      "utf-8",
    );

    await configurer.configure(projectRoot);
    expect(await fs.readFile(pluginPath, "utf-8")).toBe("// local version\n");

    await configurer.repair(projectRoot);
    await configurer.repair(projectRoot);
    expect(await fs.readFile(pluginPath, "utf-8")).toBe(
      AgentFileAssetContent.readScript("opencode-jumbo-plugin.js"),
    );
    expect(await fs.readFile(unrelatedPluginPath, "utf-8")).toBe("// keep\n");
    expect(
      await fs.readFile(path.join(projectRoot, "opencode.json"), "utf-8"),
    ).toBe('{"plugin":["custom-plugin"]}\n');
  });

  it("plans creation or refresh without reporting unrelated files", async () => {
    await expect(
      configurer.getPlannedFileChanges(projectRoot),
    ).resolves.toEqual([
      expect.objectContaining({
        path: ".opencode/plugins/jumbo.js",
        action: "create",
      }),
    ]);

    await configurer.configure(projectRoot);

    await expect(
      configurer.getPlannedFileChanges(projectRoot),
    ).resolves.toEqual([
      expect.objectContaining({
        path: ".opencode/plugins/jumbo.js",
        action: "modify",
      }),
    ]);
  });

  it("pauses, contributes active-goal context, and resumes after compaction", async () => {
    await configurer.configure(projectRoot);
    const pluginPath = path.join(
      projectRoot,
      ".opencode",
      "plugins",
      "jumbo.js",
    );
    const module = await import(
      `${pathToFileURL(pluginPath).href}?test=${Date.now()}`
    );
    const { shell, invocations } = createShell([
      {
        stdout: JSON.stringify({
          goalId: "goal-123",
          objective: "Preserve active work",
          status: "paused",
        }),
        exitCode: 0,
      },
      { stdout: "Work resumed\n", exitCode: 0 },
    ]);
    const hooks = await module.JumboCompactionPlugin({
      $: shell,
      directory: projectRoot,
    });
    const output = {
      context: [] as string[],
      prompt: undefined as string | undefined,
    };

    await hooks["experimental.session.compacting"](
      { sessionID: "session-1" },
      output,
    );

    expect(output.context.join("\n")).toContain("goal-123");
    expect(output.context.join("\n")).toContain("Preserve active work");
    expect(invocations[0]).toEqual({
      command: "jumbo work pause --format json --quiet",
      cwd: projectRoot,
      quiet: true,
      nothrow: true,
    });

    await hooks["experimental.compaction.autocontinue"](
      { sessionID: "session-1" },
      { type: "continue" },
    );
    expect(invocations[1]).toEqual({
      command: "jumbo work resume --format text --quiet",
      cwd: projectRoot,
      quiet: true,
      nothrow: true,
    });

    await hooks["experimental.compaction.autocontinue"](
      { sessionID: "session-1" },
      { type: "continue" },
    );
    expect(invocations).toHaveLength(2);
  });

  it("does not resume when compaction did not pause an active goal", async () => {
    await configurer.configure(projectRoot);
    const pluginPath = path.join(
      projectRoot,
      ".opencode",
      "plugins",
      "jumbo.js",
    );
    const module = await import(
      `${pathToFileURL(pluginPath).href}?empty=${Date.now()}`
    );
    const { shell, invocations } = createShell([
      {
        stdout: JSON.stringify({ info: "No active goal to pause" }),
        exitCode: 0,
      },
    ]);
    const hooks = await module.JumboCompactionPlugin({
      $: shell,
      directory: projectRoot,
    });

    await hooks["experimental.session.compacting"](
      { sessionID: "session-1" },
      { context: [] },
    );
    await hooks["experimental.compaction.autocontinue"](
      { sessionID: "session-1" },
      { type: "continue" },
    );

    expect(invocations).toHaveLength(1);
  });

  it("surfaces Jumbo command failures to the compaction lifecycle", async () => {
    await configurer.configure(projectRoot);
    const pluginPath = path.join(
      projectRoot,
      ".opencode",
      "plugins",
      "jumbo.js",
    );
    const module = await import(
      `${pathToFileURL(pluginPath).href}?failure=${Date.now()}`
    );
    const { shell } = createShell([
      { stdout: "", stderr: "storage unavailable", exitCode: 1 },
    ]);
    const hooks = await module.JumboCompactionPlugin({
      $: shell,
      directory: projectRoot,
    });

    await expect(
      hooks["experimental.session.compacting"]({}, { context: [] }),
    ).rejects.toThrow(
      "Jumbo failed to pause work before compaction: storage unavailable",
    );
  });
});
