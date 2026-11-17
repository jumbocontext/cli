import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import type { ILogger } from "../../../application/logging/ILogger.js";
import type { ITelemetryClient } from "../../../application/telemetry/ITelemetryClient.js";
import { CliPackageName } from "../../../application/cli-metadata/update/CliPackageName.js";
import type { CliUpgradeFeasibility } from "../../../application/cli-metadata/update/CliUpgradeFeasibility.js";
import type { CliUpgradeResult } from "../../../application/cli-metadata/update/CliUpgradeResult.js";
import { CliUpdateFailureReason } from "../../../application/cli-metadata/update/CliUpdateFailureReason.js";
import type { ICliPackageUpgradeGateway } from "../../../application/cli-metadata/update/ICliPackageUpgradeGateway.js";
import {
  CLI_UPDATE_TEST_MODE_ENV,
  CLI_UPDATE_TEST_UPGRADE_DELAY_MS_ENV,
  CLI_UPDATE_TEST_UPGRADE_RESULT_ENV,
} from "./CliUpdateTestMode.js";

const execFileAsync = promisify(execFile);
const NPM_UPGRADE_TIMEOUT_MS = 120_000;
const NPM_FEASIBILITY_LOOKUP_COMPLETED_EVENT =
  "npm_upgrade_feasibility_lookup_completed";
const NPM_PACKAGE_UPGRADE_COMPLETED_EVENT = "npm_package_upgrade_completed";
const MANUAL_UPDATE_GUIDANCE = `Run npm install -g ${CliPackageName}@latest`;
const NPM_COMMAND = "npm";
const NPM_CLI_PATH_SEGMENTS = [
  "node_modules",
  "npm",
  "bin",
  "npm-cli.js",
] as const;
const NPM_ROOT_OPERATION = "npm-root-global";
const NPM_INSTALL_OPERATION = "npm-install-global";
const NPM_STDIO_TAIL_LENGTH = 500;

interface NpmInvocation {
  readonly command: string;
  readonly args: readonly string[];
  readonly mode: "node-npm-cli" | "path-npm";
}

type TestUpgradeResult = "success" | "failure";

export class NpmPackageUpgradeGateway implements ICliPackageUpgradeGateway {
  constructor(
    private readonly packageEntryPointPath: string = process.argv[1] ?? "",
    private readonly telemetryClient?: Pick<ITelemetryClient, "track">,
    private readonly logger?: Pick<ILogger, "warn" | "info">,
    private readonly npmCliPath:
      string | null = NpmPackageUpgradeGateway.findNpmCliPath(),
    private readonly selfUpgradeTestModeEnabled: boolean = process.env[
      CLI_UPDATE_TEST_MODE_ENV
    ] === "1",
    private readonly testUpgradeResult: TestUpgradeResult = NpmPackageUpgradeGateway.parseTestUpgradeResult(
      process.env[CLI_UPDATE_TEST_UPGRADE_RESULT_ENV],
    ),
    private readonly testUpgradeDelayMs: number = NpmPackageUpgradeGateway.parseTestUpgradeDelayMs(
      process.env[CLI_UPDATE_TEST_UPGRADE_DELAY_MS_ENV],
    ),
  ) {}

  async evaluate(): Promise<CliUpgradeFeasibility> {
    const startedAt = Date.now();
    const context: Record<string, unknown> = {
      entryPointState: this.describePathState(this.packageEntryPointPath),
      npmInvocationMode: this.resolveNpmInvocation([]).mode,
    };

    try {
      if (this.selfUpgradeTestModeEnabled) {
        const result = this.feasibleResult();
        this.logger?.info("npm upgrade feasibility test mode enabled", {
          env: CLI_UPDATE_TEST_MODE_ENV,
        });
        this.trackFeasibility(startedAt, result);
        return result;
      }

      const candidatePaths = this.resolvePackageEntryPointPaths(
        this.packageEntryPointPath,
      );
      const packageRoots = this.findPackageRoots(candidatePaths);
      context.candidatePathCount = candidatePaths.length;
      context.packageRootCount = packageRoots.length;
      const globalRoot = await this.getGlobalNodeModulesRoot();
      context.globalRootResolved = true;
      const safePackageRoot = packageRoots.find(
        (packageRoot) =>
          this.isInsideDirectory(packageRoot, globalRoot) &&
          !this.isSourceCheckout(packageRoot),
      );
      context.safePackageRootFound = safePackageRoot !== undefined;

      if (safePackageRoot === undefined) {
        this.logger?.warn("npm upgrade feasibility unavailable", {
          ...context,
          reason: CliUpdateFailureReason.SelfUpgradeUnavailable,
        });
        return this.unavailable(startedAt, "PackageInstallSourceUnsupported");
      }

      const result = this.feasibleResult();
      this.trackFeasibility(startedAt, result);
      return result;
    } catch (error) {
      const diagnostic = this.describeError(error);
      this.logger?.warn("npm upgrade feasibility lookup failed", {
        ...context,
        ...diagnostic,
      });
      return this.unavailable(startedAt, diagnostic.errorType);
    }
  }

  async upgrade(targetVersion: string): Promise<CliUpgradeResult> {
    const startedAt = Date.now();

    try {
      if (this.selfUpgradeTestModeEnabled) {
        await this.delay(this.testUpgradeDelayMs);

        if (this.testUpgradeResult === "failure") {
          const result: CliUpgradeResult = {
            ok: false,
            reason: CliUpdateFailureReason.UpgradeFailed,
            guidance: MANUAL_UPDATE_GUIDANCE,
            errorType: "TestModeUpgradeFailure",
            message: "Upgrade test mode simulated failure.",
          };
          this.trackUpgrade(startedAt, targetVersion, result);
          this.logger?.warn("npm package upgrade test mode failed", {
            env: CLI_UPDATE_TEST_UPGRADE_RESULT_ENV,
            targetVersion,
          });
          return result;
        }

        const result: CliUpgradeResult = {
          ok: true,
          message:
            "Upgrade test mode completed. Restart Jumbo to continue testing.",
        };
        this.trackUpgrade(startedAt, targetVersion, result);
        this.logger?.info("npm package upgrade test mode completed", {
          env: CLI_UPDATE_TEST_MODE_ENV,
          targetVersion,
        });
        return result;
      }

      await this.runNpm(
        ["install", "-g", `${CliPackageName}@${targetVersion}`],
        NPM_UPGRADE_TIMEOUT_MS,
        NPM_INSTALL_OPERATION,
      );
      const result: CliUpgradeResult = {
        ok: true,
        message: "Upgrade completed. Restart Jumbo to use the new version.",
      };
      this.trackUpgrade(startedAt, targetVersion, result);
      this.logger?.info("npm package upgrade completed", { targetVersion });
      return result;
    } catch (error) {
      const diagnostic = this.describeError(error);
      const result: CliUpgradeResult = {
        ok: false,
        reason: CliUpdateFailureReason.UpgradeFailed,
        guidance: MANUAL_UPDATE_GUIDANCE,
        errorType: diagnostic.errorType,
        message: diagnostic.errorMessage,
      };
      this.trackUpgrade(startedAt, targetVersion, result);
      this.logger?.warn("npm package upgrade failed", {
        targetVersion,
        ...diagnostic,
      });
      return result;
    }
  }

  private async getGlobalNodeModulesRoot(): Promise<string> {
    const result = await this.runNpm(["root", "-g"], 5_000, NPM_ROOT_OPERATION);
    return path.resolve(result.stdout.trim());
  }

  private findPackageRoots(
    candidatePaths: readonly string[],
  ): readonly string[] {
    const packageRoots: string[] = [];
    for (const candidatePath of candidatePaths) {
      const packageRoot = this.findPackageRootFromCandidate(candidatePath);
      if (packageRoot !== null) {
        packageRoots.push(packageRoot);
      }
    }

    return [...new Set(packageRoots)];
  }

  private findPackageRootFromCandidate(candidatePath: string): string | null {
    if (!fs.existsSync(candidatePath)) {
      return null;
    }

    let current = fs.statSync(candidatePath).isDirectory()
      ? path.resolve(candidatePath)
      : path.dirname(path.resolve(candidatePath));

    while (true) {
      const packageJsonPath = path.join(current, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf-8"),
          ) as { name?: unknown };
          if (packageJson.name === CliPackageName) {
            return current;
          }
        } catch {
          return null;
        }
      }

      const parent = path.dirname(current);
      if (parent === current) {
        return null;
      }
      current = parent;
    }
  }

  private resolvePackageEntryPointPaths(startPath: string): readonly string[] {
    if (startPath.length === 0) {
      return [];
    }

    const absoluteStartPath = path.resolve(startPath);
    const candidatePaths = [absoluteStartPath];

    try {
      const realPath = fs.realpathSync(absoluteStartPath);
      if (realPath !== absoluteStartPath) {
        candidatePaths.push(realPath);
      }
    } catch {
      return candidatePaths;
    }

    for (const candidatePath of [...candidatePaths]) {
      const shimTargetPath = this.resolveNpmShimTargetPath(candidatePath);
      if (shimTargetPath !== null) {
        candidatePaths.push(shimTargetPath);
      }
    }

    return [...new Set(candidatePaths)];
  }

  private resolveNpmShimTargetPath(shimPath: string): string | null {
    if (!fs.existsSync(shimPath) || fs.statSync(shimPath).isDirectory()) {
      return null;
    }

    const shimContent = fs.readFileSync(shimPath, "utf-8");
    const packagePathPattern = new RegExp(
      String.raw`(?<target>[^"'\r\n]*node_modules[\\/]${CliPackageName}[\\/]dist[\\/]cli\.js)`,
      "i",
    );
    const match = shimContent.match(packagePathPattern);
    const target = match?.groups?.target;

    if (target === undefined) {
      return null;
    }

    const normalizedTarget = target
      .replace(/%~dp0%?[\\/]?/gi, "")
      .replace(/\$basedir[\\/]?/gi, "")
      .replace(/[\\/]/g, path.sep);
    return path.resolve(path.dirname(shimPath), normalizedTarget);
  }

  private isInsideDirectory(childPath: string, parentPath: string): boolean {
    const relativePath = path.relative(parentPath, childPath);
    return (
      relativePath.length === 0 ||
      (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
    );
  }

  private isSourceCheckout(packageRoot: string): boolean {
    return fs.existsSync(path.join(packageRoot, ".git"));
  }

  private unavailable(
    startedAt: number,
    errorType: string,
  ): CliUpgradeFeasibility {
    const result: CliUpgradeFeasibility = {
      feasible: false,
      reason: CliUpdateFailureReason.SelfUpgradeUnavailable,
      guidance: MANUAL_UPDATE_GUIDANCE,
    };
    this.trackFeasibility(startedAt, result, errorType);
    return result;
  }

  private feasibleResult(): CliUpgradeFeasibility {
    return {
      feasible: true,
      command: NPM_COMMAND,
      args: ["install", "-g", `${CliPackageName}@latest`],
    };
  }

  private trackFeasibility(
    startedAt: number,
    result: CliUpgradeFeasibility,
    errorType?: string,
  ): void {
    this.telemetryClient?.track(NPM_FEASIBILITY_LOOKUP_COMPLETED_EVENT, {
      feasible: result.feasible,
      durationMs: Date.now() - startedAt,
      ...(result.feasible ? {} : { reason: result.reason }),
      ...(errorType ? { errorType } : {}),
    });
  }

  private trackUpgrade(
    startedAt: number,
    targetVersion: string,
    result: CliUpgradeResult,
  ): void {
    this.telemetryClient?.track(NPM_PACKAGE_UPGRADE_COMPLETED_EVENT, {
      targetVersion,
      success: result.ok,
      durationMs: Date.now() - startedAt,
      ...(result.ok
        ? {}
        : {
            reason: result.reason,
            errorType: result.errorType,
          }),
    });
  }

  private async runNpm(
    args: readonly string[],
    timeout: number,
    operation: string,
  ): Promise<{ readonly stdout: string; readonly stderr: string }> {
    const invocation = this.resolveNpmInvocation(args);

    try {
      const result = (await execFileAsync(
        invocation.command,
        [...invocation.args],
        { timeout },
      )) as unknown;
      return this.normalizeExecFileResult(result);
    } catch (error) {
      throw this.decorateNpmError(error, operation, invocation);
    }
  }

  private resolveNpmInvocation(args: readonly string[]): NpmInvocation {
    if (this.npmCliPath !== null) {
      return {
        command: process.execPath,
        args: [this.npmCliPath, ...args],
        mode: "node-npm-cli",
      };
    }

    return {
      command: NPM_COMMAND,
      args,
      mode: "path-npm",
    };
  }

  private normalizeExecFileResult(result: unknown): {
    readonly stdout: string;
    readonly stderr: string;
  } {
    if (typeof result === "string") {
      return { stdout: result, stderr: "" };
    }

    const output = result as {
      readonly stdout?: unknown;
      readonly stderr?: unknown;
    };

    return {
      stdout: typeof output.stdout === "string" ? output.stdout : "",
      stderr: typeof output.stderr === "string" ? output.stderr : "",
    };
  }

  private decorateNpmError(
    error: unknown,
    operation: string,
    invocation: NpmInvocation,
  ): Error {
    const decorated = error instanceof Error ? error : new Error(String(error));
    const details = decorated as Error & {
      operation?: string;
      npmInvocationMode?: string;
      npmCommandBasename?: string;
    };
    details.operation = operation;
    details.npmInvocationMode = invocation.mode;
    details.npmCommandBasename = path.basename(invocation.command);
    return decorated;
  }

  private describeError(error: unknown): Record<string, unknown> & {
    readonly errorType: string;
    readonly errorMessage: string;
  } {
    const shapedError = error as {
      readonly name?: unknown;
      readonly message?: unknown;
      readonly code?: unknown;
      readonly exitCode?: unknown;
      readonly signal?: unknown;
      readonly stdout?: unknown;
      readonly stderr?: unknown;
      readonly operation?: unknown;
      readonly npmInvocationMode?: unknown;
      readonly npmCommandBasename?: unknown;
    };

    return {
      errorType:
        typeof shapedError.name === "string" && shapedError.name.length > 0
          ? shapedError.name
          : "UnknownError",
      errorMessage:
        typeof shapedError.message === "string"
          ? shapedError.message
          : String(error),
      ...(typeof shapedError.code === "string"
        ? { errorCode: shapedError.code }
        : {}),
      ...(typeof shapedError.exitCode === "number"
        ? { exitCode: shapedError.exitCode }
        : {}),
      ...(typeof shapedError.signal === "string"
        ? { signal: shapedError.signal }
        : {}),
      ...(typeof shapedError.operation === "string"
        ? { operation: shapedError.operation }
        : {}),
      ...(typeof shapedError.npmInvocationMode === "string"
        ? { npmInvocationMode: shapedError.npmInvocationMode }
        : {}),
      ...(typeof shapedError.npmCommandBasename === "string"
        ? { npmCommand: shapedError.npmCommandBasename }
        : {}),
      ...(typeof shapedError.stdout === "string" &&
      shapedError.stdout.length > 0
        ? { stdoutTail: this.tail(shapedError.stdout) }
        : {}),
      ...(typeof shapedError.stderr === "string" &&
      shapedError.stderr.length > 0
        ? { stderrTail: this.tail(shapedError.stderr) }
        : {}),
    };
  }

  private describePathState(targetPath: string): string {
    if (targetPath.length === 0) {
      return "empty";
    }

    if (!fs.existsSync(targetPath)) {
      return "missing";
    }

    return fs.statSync(targetPath).isDirectory() ? "directory" : "file";
  }

  private tail(value: string): string {
    return value.slice(-NPM_STDIO_TAIL_LENGTH);
  }

  private async delay(delayMs: number): Promise<void> {
    if (delayMs <= 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  private static parseTestUpgradeResult(
    value: string | undefined,
  ): TestUpgradeResult {
    return value === "failure" ? "failure" : "success";
  }

  private static parseTestUpgradeDelayMs(value: string | undefined): number {
    if (value === undefined) {
      return 0;
    }

    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
  }

  private static findNpmCliPath(): string | null {
    for (const searchPath of (process.env.PATH ?? "").split(path.delimiter)) {
      const candidatePath = path.join(searchPath, ...NPM_CLI_PATH_SEGMENTS);
      if (fs.existsSync(candidatePath)) {
        return candidatePath;
      }
    }

    return null;
  }
}
