import { describe, expect, it } from "@jest/globals";
import { CliVersionComparator } from "../../../../../src/application/cli-metadata/update/CliVersionComparator.js";
import { CliVersionComparison } from "../../../../../src/application/cli-metadata/update/CliVersionComparison.js";

describe("CliVersionComparator", () => {
  const comparator = new CliVersionComparator();

  it("detects an older local version", () => {
    expect(comparator.compare("1.2.3", "1.3.0")).toBe(
      CliVersionComparison.Older,
    );
  });

  it("detects equal versions", () => {
    expect(comparator.compare("1.2.3", "1.2.3")).toBe(
      CliVersionComparison.Equal,
    );
  });

  it("detects a newer local version", () => {
    expect(comparator.compare("2.0.0", "1.9.9")).toBe(
      CliVersionComparison.Newer,
    );
  });

  it("treats a prerelease as older than the matching release", () => {
    expect(comparator.compare("1.2.3-beta.1", "1.2.3")).toBe(
      CliVersionComparison.Older,
    );
  });

  it("returns null for unparsable versions", () => {
    expect(comparator.compare("dev", "1.2.3")).toBeNull();
  });
});
