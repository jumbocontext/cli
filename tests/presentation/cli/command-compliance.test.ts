import fs from "fs-extra";
import fastGlob from "fast-glob";
import path from "path";
import { classifyCommand } from "../../../src/presentation/cli/commands/CommandClassifier.js";
import { commands } from "../../../src/presentation/cli/commands/registry/generated-commands.js";

describe("Command Compliance", () => {
  let files: { rel: string; content: string }[];

  beforeAll(async () => {
    const absPaths = await fastGlob(["src/presentation/cli/commands/**/*.*.ts"], {
      ignore: ["**/*.test.ts", "**/index.ts", "**/*.d.ts"],
      cwd: process.cwd(),
      absolute: true,
    });
    files = await Promise.all(
      absPaths.map(async (abs) => ({
        rel: path.relative(process.cwd(), abs),
        content: await fs.readFile(abs, "utf-8"),
      })),
    );
  });

  const isProjectInit = (rel: string) => rel.endsWith("project.init.ts");

  const violations = (predicate: (f: { rel: string; content: string }) => boolean, skipInit = false) =>
    files.filter((f) => (skipInit && isProjectInit(f.rel) ? false : predicate(f))).map((f) => f.rel);

  test("at least one command file is discovered", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  test("all commands receive container as parameter", () => {
    expect(
      violations(
        (f) =>
          !f.content.includes("container: IApplicationContainer") &&
          !f.content.includes("container?: IApplicationContainer"),
      ),
    ).toEqual([]);
  });

  test("no commands call SqliteConnectionManager.close()", () => {
    expect(violations((f) => f.content.includes("SqliteConnectionManager.close()"))).toEqual([]);
  });

  test("no commands call SqliteConnectionManager.getConnection()", () => {
    expect(violations((f) => f.content.includes("SqliteConnectionManager.getConnection("))).toEqual([]);
  });

  test("no commands import old SqliteConnectionManager path", () => {
    expect(
      violations((f) =>
        f.content.includes('from "../../../../infrastructure/persistence/SqliteConnectionManager.js"'),
      ),
    ).toEqual([]);
  });

  test("no commands call bootstrap() directly (except project.init)", () => {
    expect(violations((f) => /const container = bootstrap\(/.test(f.content), true)).toEqual([]);
  });

  test("no commands create infrastructure manually (except project.init)", () => {
    const banned = ["new InProcessEventBus()", "new FsEventStore(", "new SqliteConnectionManager("];
    expect(violations((f) => banned.some((b) => f.content.includes(b)), true)).toEqual([]);
  });

  test("no commands have finally blocks with dispose/close (except project.init)", () => {
    expect(violations((f) => /finally\s*\{[\s\S]*?(dispose|close)\(\)/.test(f.content), true)).toEqual([]);
  });

  test("all commands export metadata", () => {
    expect(violations((f) => !f.content.includes("export const metadata"))).toEqual([]);
  });

  test("global search command metadata supports project guard and output detail", () => {
    const command = commands.find((c) => c.path === "search");

    expect(command).toBeDefined();
    expect(command?.metadata.requiresProject).toBe(true);
    expect(command?.metadata.requiredOptions?.map((option) => option.flags)).toEqual(["-q, --query <query>"]);
    expect(command?.metadata.options?.map((option) => option.flags)).toEqual([
      "-c, --category <category>",
      "-l, --limit <limit>",
      "-o, --output <output>",
    ]);
    expect(command?.metadata.options?.find((option) => option.flags === "-o, --output <output>")?.description).toContain(
      "default or compact"
    );
  });

  test("global search command is classified as project-scoped", () => {
    const classification = classifyCommand(["node", "jumbo", "search", "--query", "memory"], commands);

    expect(classification).toEqual({
      requiresInfrastructure: true,
      requiresProject: true,
      commandPath: "search",
    });
  });

  test("index rebuild command metadata supports project guard and structured output", () => {
    const command = commands.find((c) => c.path === "index rebuild");

    expect(command).toBeDefined();
    expect(command?.metadata.requiresProject).toBe(true);
    expect(command?.metadata.requiredOptions).toBeUndefined();
    expect(command?.metadata.options).toBeUndefined();
    expect(command?.metadata.examples?.map((example) => example.command)).toContain("jumbo index rebuild --format json");
    expect(command?.metadata.related).toEqual(expect.arrayContaining(["search", "heal", "evolve"]));
  });

  test("index rebuild command is classified as project-scoped", () => {
    const classification = classifyCommand(["node", "jumbo", "index", "rebuild"], commands);

    expect(classification).toEqual({
      requiresInfrastructure: true,
      requiresProject: true,
      commandPath: "index rebuild",
    });
  });

  test("relations audit command declares project scope and selectable checks", () => {
    const command = commands.find((candidate) => candidate.path === "relations audit");

    expect(command).toBeDefined();
    expect(command?.metadata.requiresProject).toBe(true);
    expect(command?.metadata.options?.map((option) => option.flags)).toEqual([
      "-c, --check <checks...>",
      "--entity-type <type>",
    ]);
    expect(command?.metadata.examples?.map((example) => example.command)).toContain(
      "jumbo relations audit --format json",
    );
  });

  test("goal postpone is a project-scoped command with a required id and automatic-selection help", () => {
    const command = commands.find((candidate) => candidate.path === "goal postpone");

    expect(command).toBeDefined();
    expect(command?.metadata.requiresProject).toBe(true);
    expect(command?.metadata.requiredOptions?.map((option) => option.flags)).toEqual(["-i, --id <id>"]);
    expect(command?.metadata.description).toContain("automatic work streams");
  });

  test("goal reinstate is project-scoped with a required id and renewed refinement help", () => {
    const command = commands.find((candidate) => candidate.path === "goal reinstate");

    expect(command).toBeDefined();
    expect(command?.metadata.requiresProject).toBe(true);
    expect(command?.metadata.requiredOptions?.map((option) => option.flags)).toEqual(["-i, --id <id>"]);
    expect(command?.metadata.description).toContain("postponed goal as defined");
    expect(command?.metadata.description).toContain("eligible for refinement");
  });
});
