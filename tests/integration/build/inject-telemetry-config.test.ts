import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";

const SCRIPT_PATH = path.resolve("build/inject-telemetry-config.mjs");

describe("inject-telemetry-config", () => {
  let tempDir: string;
  let constantsDir: string;
  let constantsPath: string;

  const compiledTemplate = [
    'export const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY || "";',
    'export const POSTHOG_HOST = process.env.POSTHOG_HOST || "";',
    "export const POSTHOG_SHUTDOWN_TIMEOUT_MS = 5000;",
    "",
  ].join("\n");

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "jumbo-inject-"));
    constantsDir = path.join(
      tempDir,
      "dist",
      "infrastructure",
      "telemetry"
    );
    fs.mkdirSync(constantsDir, { recursive: true });
    constantsPath = path.join(constantsDir, "PostHogTelemetryConstants.js");
    fs.writeFileSync(constantsPath, compiledTemplate, "utf-8");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function runScript(env: Record<string, string> = {}): string {
    // Override the script's __dirname-relative path by symlinking the dist
    // directory structure. Instead, we run the script from the temp dir
    // after copying it there and adjusting the path resolution.
    //
    // Simpler approach: copy the script into tempDir/build/ so its
    // __dirname resolution finds tempDir/dist/.
    const buildDir = path.join(tempDir, "build");
    fs.mkdirSync(buildDir, { recursive: true });
    fs.copyFileSync(SCRIPT_PATH, path.join(buildDir, "inject-telemetry-config.mjs"));

    return execSync(
      `node "${path.join(buildDir, "inject-telemetry-config.mjs")}"`,
      {
        cwd: tempDir,
        env: { ...process.env, ...env },
        encoding: "utf-8",
      }
    );
  }

  it("skips injection when no env vars are set", () => {
    const output = runScript({
      POSTHOG_API_KEY: "",
      POSTHOG_HOST: "",
    });

    expect(output).toContain("skipping");
    expect(fs.readFileSync(constantsPath, "utf-8")).toBe(compiledTemplate);
  });

  it("injects API key and host when both env vars are set", () => {
    runScript({
      POSTHOG_API_KEY: "phc_test_key_123",
      POSTHOG_HOST: "https://eu.posthog.test",
    });

    const result = fs.readFileSync(constantsPath, "utf-8");
    expect(result).toContain('const POSTHOG_API_KEY = "phc_test_key_123"');
    expect(result).toContain('const POSTHOG_HOST = "https://eu.posthog.test"');
    expect(result).not.toContain("process.env");
  });

  it("fails when only API key is set without host", () => {
    expect(() =>
      runScript({
        POSTHOG_API_KEY: "phc_only_key",
        POSTHOG_HOST: "",
      })
    ).toThrow();

    expect(fs.readFileSync(constantsPath, "utf-8")).toBe(compiledTemplate);
  });

  it("fails when only host is set without API key", () => {
    expect(() =>
      runScript({
        POSTHOG_API_KEY: "",
        POSTHOG_HOST: "https://eu.posthog.test",
      })
    ).toThrow();

    expect(fs.readFileSync(constantsPath, "utf-8")).toBe(compiledTemplate);
  });

  it("preserves POSTHOG_SHUTDOWN_TIMEOUT_MS unchanged", () => {
    runScript({
      POSTHOG_API_KEY: "phc_test",
      POSTHOG_HOST: "https://eu.posthog.test",
    });

    const result = fs.readFileSync(constantsPath, "utf-8");
    expect(result).toContain("POSTHOG_SHUTDOWN_TIMEOUT_MS = 5000");
  });

  it("exits with error when dist file is missing", () => {
    fs.unlinkSync(constantsPath);

    expect(() =>
      runScript({
        POSTHOG_API_KEY: "phc_test",
        POSTHOG_HOST: "https://eu.posthog.test",
      })
    ).toThrow();
  });
});
