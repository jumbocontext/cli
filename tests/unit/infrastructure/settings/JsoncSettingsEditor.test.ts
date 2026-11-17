import { describe, expect, it } from "@jest/globals";
import {
  JsonObject,
  applyMissingDefaults,
  assertValidJsonc,
  collectMissingDefaults,
  setJsoncValue,
} from "../../../../src/infrastructure/settings/JsoncSettingsEditor.js";

describe("JsoncSettingsEditor", () => {
  describe("assertValidJsonc", () => {
    it("does not throw for valid JSONC content", () => {
      expect(() => assertValidJsonc('{ "a": 1 }', "settings.jsonc")).not.toThrow();
    });

    it("throws a descriptive error for invalid JSONC content", () => {
      expect(() => assertValidJsonc("{ invalid", "settings.jsonc")).toThrow(
        /Invalid JSON in settings file at settings\.jsonc/
      );
    });
  });

  describe("setJsoncValue", () => {
    it("sets a nested value while preserving comments and unrelated entries", () => {
      const content = `{
  // keep this comment
  "qa": {
    "defaultTurnLimit": 3
  },
  "custom": {
    "flag": true
  }
}
`;

      const updated = setJsoncValue(content, ["qa", "defaultTurnLimit"], 9);

      expect(updated).toContain("// keep this comment");
      expect(JSON.parse(updated.replace(/\/\/.*$/gm, ""))).toEqual({
        qa: { defaultTurnLimit: 9 },
        custom: { flag: true },
      });
    });

    it("inserts a value at a path that does not yet exist", () => {
      const content = `{
  "qa": { "defaultTurnLimit": 3 }
}
`;

      const updated = setJsoncValue(content, ["tui", "showLaunchpadWelcome"], false);

      expect(JSON.parse(updated)).toEqual({
        qa: { defaultTurnLimit: 3 },
        tui: { showLaunchpadWelcome: false },
      });
    });
  });

  describe("collectMissingDefaults", () => {
    it("reports an entire section as missing when its parent key is absent", () => {
      const content = `{ "qa": { "defaultTurnLimit": 3 } }`;
      const defaults: JsonObject = {
        qa: { defaultTurnLimit: 3 },
        tui: { showLaunchpadWelcome: true },
      };

      const entries = collectMissingDefaults(content, defaults);

      expect(entries).toEqual([{ path: ["tui"], value: { showLaunchpadWelcome: true } }]);
    });

    it("reports only the missing nested field when the parent already exists", () => {
      const content = `{ "telemetry": { "enabled": false } }`;
      const defaults: JsonObject = {
        telemetry: { enabled: true, anonymousId: null, consentGiven: false },
      };

      const entries = collectMissingDefaults(content, defaults);

      expect(entries).toEqual(
        expect.arrayContaining([
          { path: ["telemetry", "anonymousId"], value: null },
          { path: ["telemetry", "consentGiven"], value: false },
        ])
      );
      expect(entries).toHaveLength(2);
    });

    it("reports nothing missing when every default field is already present", () => {
      const content = `{ "qa": { "defaultTurnLimit": 3 } }`;
      const defaults: JsonObject = { qa: { defaultTurnLimit: 3 } };

      expect(collectMissingDefaults(content, defaults)).toEqual([]);
    });
  });

  describe("applyMissingDefaults", () => {
    it("adds missing sections and fields without overwriting explicit values", () => {
      const content = `{
  "qa": { "defaultTurnLimit": 7 },
  "custom": { "keep": true }
}
`;
      const defaults: JsonObject = {
        qa: { defaultTurnLimit: 3 },
        tui: { showLaunchpadWelcome: true },
        session: { backlogPreviewSize: 5 },
      };

      const updated = applyMissingDefaults(content, defaults);
      const parsed = JSON.parse(updated);

      expect(parsed.qa).toEqual({ defaultTurnLimit: 7 });
      expect(parsed.custom).toEqual({ keep: true });
      expect(parsed.tui).toEqual({ showLaunchpadWelcome: true });
      expect(parsed.session).toEqual({ backlogPreviewSize: 5 });
    });

    it("returns the content unchanged when nothing is missing", () => {
      const content = `{ "qa": { "defaultTurnLimit": 3 } }`;
      const defaults: JsonObject = { qa: { defaultTurnLimit: 3 } };

      expect(applyMissingDefaults(content, defaults)).toBe(content);
    });
  });
});
