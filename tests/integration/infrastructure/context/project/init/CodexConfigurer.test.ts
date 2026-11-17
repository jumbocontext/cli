/**
 * Tests for CodexConfigurer infrastructure implementation
 */

import fs from "fs-extra";
import * as path from "path";
import os from "os";
import { parse } from "jsonc-parser";
import { CodexConfigurer } from "../../../../../../src/infrastructure/context/project/init/CodexConfigurer";
import { jest } from "@jest/globals";

jest.setTimeout(30_000);

describe("CodexConfigurer", () => {
  let tmpDir: string;
  let templateSkillsRoot: string;
  let configurer: CodexConfigurer;

  interface ParsedCodexHooks {
    readonly hooks?: {
      readonly SessionStart?: readonly {
        readonly matcher?: string;
        readonly hooks?: readonly {
          readonly type?: string;
          readonly command?: string;
        }[];
      }[];
    };
    readonly userSettings?: {
      readonly enabled?: boolean;
    };
  }

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-codex-configurer-"));
    templateSkillsRoot = path.join(tmpDir, "assets", "skills");
    configurer = new CodexConfigurer(templateSkillsRoot);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe("agent", () => {
    it("should have the correct agent identity", () => {
      expect(configurer.agent).toEqual({ id: "codex", name: "Codex" });
    });
  });

  describe("skillPlatforms", () => {
    it("should declare .agents/skills as the documented repo skill platform", () => {
      expect(configurer.skillPlatforms).toEqual([".agents/skills"]);
    });
  });

  describe("configure()", () => {
    it("should create .codex/hooks.json with Codex lifecycle hooks using text output", async () => {
      await configurer.configure(tmpDir);

      const hooksPath = path.join(tmpDir, ".codex", "hooks.json");
      expect(await fs.pathExists(hooksPath)).toBe(true);

      const hooks = JSON.parse(await fs.readFile(hooksPath, "utf-8"));

      expect(hooks).toEqual({
        hooks: {
          PreCompact: [
            {
              matcher: "auto",
              hooks: [
                {
                  type: "command",
                  command: "jumbo work pause --format text --quiet",
                },
              ],
            },
          ],
          SessionStart: [
            {
              matcher: "startup",
              hooks: [
                {
                  type: "command",
                  command: "jumbo session start --format text",
                },
              ],
            },
            {
              matcher: "compact",
              hooks: [
                {
                  type: "command",
                  command: "jumbo work resume --format text",
                },
              ],
            },
          ],
        },
      });
    });

    it("should preserve user hooks while replacing stale Jumbo commands", async () => {
      const hooksPath = path.join(tmpDir, ".codex", "hooks.json");
      await fs.ensureDir(path.join(tmpDir, ".codex"));
      await fs.writeFile(
        hooksPath,
        JSON.stringify(
          {
            hooks: {
              SessionStart: [
                {
                  matcher: "startup",
                  hooks: [
                    { type: "command", command: "echo user startup" },
                    { type: "command", command: "jumbo session start" },
                  ],
                },
                {
                  matcher: "compact",
                  hooks: [
                    { type: "command", command: "jumbo work resume" },
                  ],
                },
              ],
              PreCompact: [
                {
                  matcher: "auto",
                  hooks: [
                    { type: "command", command: "echo user compact" },
                    { type: "command", command: "jumbo work pause" },
                  ],
                },
              ],
              Stop: [
                {
                  matcher: "*",
                  hooks: [
                    { type: "command", command: "echo stop" },
                  ],
                },
              ],
            },
          },
          null,
          2
        ),
        "utf-8"
      );

      await configurer.configure(tmpDir);

      const hooks = JSON.parse(await fs.readFile(hooksPath, "utf-8"));
      expect(hooks.hooks.SessionStart).toEqual([
        {
          matcher: "startup",
          hooks: [
            { type: "command", command: "echo user startup" },
            { type: "command", command: "jumbo session start --format text" },
          ],
        },
        {
          matcher: "compact",
          hooks: [
            { type: "command", command: "jumbo work resume --format text" },
          ],
        },
      ]);
      expect(hooks.hooks.PreCompact).toEqual([
        {
          matcher: "auto",
          hooks: [
            { type: "command", command: "echo user compact" },
            { type: "command", command: "jumbo work pause --format text --quiet" },
          ],
        },
      ]);
      expect(hooks.hooks.Stop[0].hooks[0].command).toBe("echo stop");
    });

    it("should preserve nested comments and unknown settings in existing Codex hooks configuration", async () => {
      const hooksPath = path.join(tmpDir, ".codex", "hooks.json");
      await fs.ensureDir(path.join(tmpDir, ".codex"));
      await fs.writeFile(
        hooksPath,
        [
          "{",
          "  // user comment",
          '  "userSettings": {',
          '    "enabled": true',
          "  },",
          '  "hooks": {',
          '    "SessionStart": [',
          "      {",
          "        // keep matcher comment",
          '        "matcher": "startup",',
          '        "hooks": [',
          "          // keep user hook comment",
          '          { "type": "command", "command": "echo user startup" },',
          "          // keep Jumbo hook comment",
          '          { "type": "command", "command": "jumbo session start" }',
          "        ]",
          "      }",
          "    ]",
          "  }",
          "}",
          "",
        ].join("\n"),
        "utf-8"
      );

      await configurer.configure(tmpDir);

      const content = await fs.readFile(hooksPath, "utf-8");
      const hooks = parse(content) as ParsedCodexHooks;
      expect(content).toContain("// user comment");
      expect(content).toContain("// keep matcher comment");
      expect(content).toContain("// keep user hook comment");
      expect(content).toContain("// keep Jumbo hook comment");
      expect(hooks.userSettings?.enabled).toBe(true);
      expect(hooks.hooks?.SessionStart?.[0].hooks).toEqual([
        { type: "command", command: "echo user startup" },
        { type: "command", command: "jumbo session start --format text" },
      ]);
    });

    it("should not duplicate Jumbo hooks across repeated configuration", async () => {
      await configurer.configure(tmpDir);
      await configurer.configure(tmpDir);

      const hooksPath = path.join(tmpDir, ".codex", "hooks.json");
      const hooks = JSON.parse(await fs.readFile(hooksPath, "utf-8"));

      expect(hooks.hooks.SessionStart[0].hooks).toHaveLength(1);
      expect(hooks.hooks.SessionStart[1].hooks).toHaveLength(1);
      expect(hooks.hooks.PreCompact[0].hooks).toHaveLength(1);
    });

    it("reports a filesystem failure without throwing", async () => {
      await fs.writeFile(path.join(tmpDir, ".codex"), "a file blocks directory creation");
      const warning = jest.spyOn(console, "warn").mockImplementation(() => undefined);
      try {
        await expect(configurer.configure(tmpDir)).resolves.not.toThrow();
        expect(warning).toHaveBeenCalledWith(expect.stringMatching(/EEXIST|ENOTDIR/));
        expect(await fs.readFile(path.join(tmpDir, ".codex"), "utf8")).toBe(
          "a file blocks directory creation"
        );
      } finally {
        warning.mockRestore();
      }
    });
  });

  describe("repair()", () => {
    it("should replace stale Jumbo commands", async () => {
      const hooksPath = path.join(tmpDir, ".codex", "hooks.json");
      await fs.ensureDir(path.join(tmpDir, ".codex"));
      await fs.writeFile(
        hooksPath,
        JSON.stringify({
          hooks: {
            SessionStart: [
              {
                matcher: "startup",
                hooks: [
                  { type: "command", command: "jumbo session start" },
                ],
              },
            ],
          },
        }),
        "utf-8"
      );

      await configurer.repair!(tmpDir);

      const hooks = JSON.parse(await fs.readFile(hooksPath, "utf-8"));
      expect(hooks.hooks.SessionStart[0].hooks).toEqual([
        { type: "command", command: "jumbo session start --format text" },
      ]);
    });
  });

  describe.each(["configure", "repair"] as const)("%s PreCompact migration", (operation) => {
    it.each(["jumbo work pause", "jumbo work pause --format text"])(
      "migrates %s in place and preserves JSONC and user configuration on repeat runs",
      async (legacyCommand) => {
        const hooksPath = path.join(tmpDir, ".codex", "hooks.json");
        await fs.ensureDir(path.dirname(hooksPath));
        const content = `{
  // user settings
  "userSettings": { "enabled": false, "nested": { "custom": 42 } },
  "hooks": {
    "PreCompact": [{
      // matcher comment
      "matcher": "auto",
      "hooks": [
        { "type": "command", "command": "echo user compact", "timeout": 17 },
        // managed command with user options
        { "type": "command", "command": "${legacyCommand}", "timeout": 29 },
        { "type": "command", "command": "jumbo work pause --format text --verbose" },
      ],
    }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "echo user stop" }] }],
  },
}
`;
        await fs.writeFile(hooksPath, content);

        await configurer[operation](tmpDir);
        const migrated = await fs.readFile(hooksPath, "utf8");
        const expected = parse(content.replace(legacyCommand, "jumbo work pause --format text --quiet"));
        const actual = parse(migrated);
        expect(actual.hooks.PreCompact).toEqual(expected.hooks.PreCompact);
        expect(actual.hooks.Stop).toEqual(expected.hooks.Stop);
        expect(actual.userSettings).toEqual(expected.userSettings);
        for (const comment of ["// user settings", "// matcher comment", "// managed command with user options"]) {
          expect(migrated).toContain(comment);
        }

        await configurer[operation](tmpDir);
        expect(await fs.readFile(hooksPath, "utf8")).toBe(migrated);
      }
    );
  });

  describe("obsolete .codex/skills cleanup", () => {
    const managedSkillContent =
      "---\nname: managed-skill\ndescription: Managed.\n---\n\n# Managed\n\nCurrent.\n";

    async function writeTemplateSkill(skillName: string, content: string): Promise<void> {
      const templateSkillPath = path.join(templateSkillsRoot, skillName);
      await fs.ensureDir(templateSkillPath);
      await fs.writeFile(path.join(templateSkillPath, "SKILL.md"), content, "utf-8");
    }

    async function writeCodexSkill(skillName: string, content: string): Promise<string> {
      const codexSkillPath = path.join(tmpDir, ".codex", "skills", skillName);
      await fs.ensureDir(codexSkillPath);
      await fs.writeFile(path.join(codexSkillPath, "SKILL.md"), content, "utf-8");
      return codexSkillPath;
    }

    it("should remove a .codex skill copy that is byte-identical to the managed template", async () => {
      await writeTemplateSkill("managed-skill", managedSkillContent);
      const obsoleteSkillPath = await writeCodexSkill("managed-skill", managedSkillContent);

      await configurer.configure(tmpDir);

      expect(await fs.pathExists(obsoleteSkillPath)).toBe(false);
      expect(await fs.pathExists(path.join(tmpDir, ".codex", "skills"))).toBe(false);
    });

    it("should preserve a user-customized skill whose SKILL.md metadata matches a managed template", async () => {
      await writeTemplateSkill("managed-skill", managedSkillContent);
      const customizedSkillPath = await writeCodexSkill(
        "managed-skill",
        "---\nname: managed-skill\ndescription: Managed.\n---\n\n# Managed\n\nUser customized body.\n"
      );

      await configurer.configure(tmpDir);

      expect(await fs.readFile(path.join(customizedSkillPath, "SKILL.md"), "utf-8")).toContain(
        "User customized body."
      );
    });

    it("should preserve user files inside a former managed skill directory", async () => {
      await writeTemplateSkill("managed-skill", managedSkillContent);
      const skillWithUserFilesPath = await writeCodexSkill("managed-skill", managedSkillContent);
      await fs.writeFile(path.join(skillWithUserFilesPath, "user-notes.md"), "# My notes\n", "utf-8");

      await configurer.configure(tmpDir);

      expect(await fs.pathExists(path.join(skillWithUserFilesPath, "SKILL.md"))).toBe(true);
      expect(await fs.readFile(path.join(skillWithUserFilesPath, "user-notes.md"), "utf-8")).toContain(
        "My notes"
      );
    });

    it("should preserve user-created skills that have no managed template counterpart", async () => {
      await writeTemplateSkill("managed-skill", managedSkillContent);
      const userSkillPath = await writeCodexSkill(
        "my-custom-skill",
        "---\nname: my-custom-skill\ndescription: User owned.\n---\n\n# User\n\nKeep me.\n"
      );

      await configurer.configure(tmpDir);

      expect(await fs.readFile(path.join(userSkillPath, "SKILL.md"), "utf-8")).toContain("Keep me.");
      expect(await fs.pathExists(path.join(tmpDir, ".codex", "skills"))).toBe(true);
    });

    it("should be idempotent across repeated repair runs", async () => {
      await writeTemplateSkill("managed-skill", managedSkillContent);
      const obsoleteSkillPath = await writeCodexSkill("managed-skill", managedSkillContent);
      const userSkillPath = await writeCodexSkill(
        "my-custom-skill",
        "---\nname: my-custom-skill\ndescription: User owned.\n---\n\n# User\n\nKeep me.\n"
      );

      await configurer.repair!(tmpDir);
      await configurer.repair!(tmpDir);

      expect(await fs.pathExists(obsoleteSkillPath)).toBe(false);
      expect(await fs.readFile(path.join(userSkillPath, "SKILL.md"), "utf-8")).toContain("Keep me.");
    });
  });

  describe("getPlannedFileChanges()", () => {
    it("should return planned changes for the Codex hooks file", async () => {
      const changes = await configurer.getPlannedFileChanges(tmpDir);

      expect(changes).toEqual([
        {
          path: ".codex/hooks.json",
          action: "create",
          description: expect.any(String),
        },
      ]);
    });

    it("should report modify action when hooks file already exists", async () => {
      await configurer.configure(tmpDir);

      const changes = await configurer.getPlannedFileChanges(tmpDir);

      expect(changes[0].action).toBe("modify");
    });
  });
});
