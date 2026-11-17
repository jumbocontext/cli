import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
} from "@jest/globals";
import { Command } from "commander";
import { FindRelationPathController } from "../../../../../../../src/application/context/relations/path/FindRelationPathController.js";
import { RelationPathResult } from "../../../../../../../src/application/context/relations/path/RelationPathResult.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import { EntityType } from "../../../../../../../src/domain/relations/Constants.js";
import {
  registerRelationsPathCommand,
  relationsPath,
} from "../../../../../../../src/presentation/cli/commands/relations/path/relations.path.js";

describe("relations path command registration", () => {
  const buildCommand = (): Command => {
    const program = new Command();
    registerRelationsPathCommand(program);
    return program.commands[0]!;
  };

  it("registers the `jumbo relations path` leaf", () => {
    const command = buildCommand();

    expect(command.name()).toBe("path");
    expect(command.description()).toContain("shortest path");
  });

  it("requires --from-id and --to-id options", () => {
    const command = buildCommand();

    const requiredFlags = command.options
      .filter((option) => option.mandatory)
      .map((option) => option.flags);

    expect(requiredFlags).toEqual(["--from-id <fromId>", "--to-id <toId>"]);
  });

  it("declares traversal options", () => {
    const command = buildCommand();

    const flags = command.options.map((option) => option.flags);

    expect(flags).toEqual(
      expect.arrayContaining([
        "--max-depth <maxDepth>",
        "-d, --direction <direction>",
        "--relation-type <type>",
        "--entity-type <type>",
        "--strength <strength>",
        "-s, --status <status>",
      ]),
    );
  });
});

describe("relations path execution", () => {
  const noPathResult: RelationPathResult = {
    found: false,
    from: { entityType: EntityType.goal, entityId: "from" },
    to: { entityType: EntityType.component, entityId: "to" },
    hopCount: 0,
    nodes: [],
    edges: [],
    query: { maxDepth: 5, direction: "both", status: "active" },
  };

  const pathResult: RelationPathResult = {
    found: true,
    from: { entityType: EntityType.goal, entityId: "from" },
    to: { entityType: EntityType.component, entityId: "to" },
    hopCount: 2,
    nodes: [
      { entityType: EntityType.goal, entityId: "from" },
      { entityType: EntityType.component, entityId: "middle" },
      { entityType: EntityType.component, entityId: "to" },
    ],
    edges: [],
    query: { maxDepth: 5, direction: "both", status: "active" },
  };

  let mockController: jest.Mocked<FindRelationPathController>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });
    mockController = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<FindRelationPathController>;
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    Renderer.reset();
    jest.restoreAllMocks();
  });

  it("builds a typed request and renders the path in text mode", async () => {
    mockController.handle.mockResolvedValue(noPathResult);

    await relationsPath(
      { fromId: "from", fromType: "goal", toId: "to", toType: "component" },
      { findRelationPathController: mockController },
    );

    expect(mockController.handle).toHaveBeenCalledWith({
      fromEntityId: "from",
      fromEntityType: "goal",
      toEntityId: "to",
      toEntityType: "component",
      maxDepth: 5,
      direction: "both",
      relationType: undefined,
      relatedEntityType: undefined,
      strength: undefined,
      status: "active",
    });
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("renders structured output in JSON mode", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });
    mockController.handle.mockResolvedValue(pathResult);

    await relationsPath(
      { fromId: "from", toId: "to" },
      { findRelationPathController: mockController },
    );

    expect(mockController.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        fromEntityId: "from",
        toEntityId: "to",
        maxDepth: 5,
        direction: "both",
        status: "active",
      }),
    );

    const output = String(consoleLogSpy.mock.calls.at(-1)?.[0] ?? "");
    const parsed = JSON.parse(output) as { found: boolean; nodes: unknown[] };
    expect(parsed.found).toBe(true);
    expect(Array.isArray(parsed.nodes)).toBe(true);
  });

  it("reports controller failures to stderr and exits non-zero", async () => {
    mockController.handle.mockRejectedValue(new Error("index corrupted"));
    jest.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit called with code ${code}`);
    }) as typeof process.exit);

    await expect(
      relationsPath(
        { fromId: "from", toId: "to" },
        { findRelationPathController: mockController },
      ),
    ).rejects.toThrow("process.exit called with code 1");

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});
