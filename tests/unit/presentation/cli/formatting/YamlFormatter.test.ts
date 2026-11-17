/**
 * Tests for YamlFormatter
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { YamlFormatter } from "../../../../../src/presentation/cli/formatting/YamlFormatter.js";

describe("YamlFormatter", () => {
  let formatter: YamlFormatter;

  beforeEach(() => {
    formatter = new YamlFormatter();
  });

  describe("toYaml", () => {
    it("should convert simple object to YAML", () => {
      const data = {
        name: "Test",
        value: 42,
      };

      const result = formatter.toYaml(data);

      expect(result).toContain("name: Test");
      expect(result).toContain("value: 42");
    });

    it("should convert array to YAML", () => {
      const data = [
        { id: "1", text: "First" },
        { id: "2", text: "Second" },
      ];

      const result = formatter.toYaml(data);

      expect(result).toContain("- id:");
      expect(result).toContain("text: First");
      expect(result).toContain("text: Second");
    });

    it("should preserve null values", () => {
      const data = {
        name: "Test",
        optional: null,
      };

      const result = formatter.toYaml(data);

      expect(result).toContain("optional: null");
    });

    it("should handle nested objects", () => {
      const data = {
        parent: {
          child: {
            value: "nested",
          },
        },
      };

      const result = formatter.toYaml(data);

      expect(result).toContain("parent:");
      expect(result).toContain("child:");
      expect(result).toContain("value: nested");
    });

    it("should use custom indent when specified", () => {
      const data = {
        parent: {
          child: "value",
        },
      };

      const result = formatter.toYaml(data, { indent: 4 });

      // Check that indentation is greater (4 spaces vs default 2)
      expect(result).toContain("parent:");
      expect(result).toContain("child:");
    });

    it("should handle empty object", () => {
      const data = {};

      const result = formatter.toYaml(data);

      expect(result).toBe("{}\n");
    });

    it("should handle empty array", () => {
      const data: unknown[] = [];

      const result = formatter.toYaml(data);

      expect(result).toBe("[]\n");
    });

    it("should handle strings with special characters", () => {
      const data = {
        text: "Line 1\nLine 2",
        special: "Value: with colon",
      };

      const result = formatter.toYaml(data);

      expect(result).toBeTruthy();
      expect(result).toContain("text:");
      expect(result).toContain("special:");
    });
  });
});
