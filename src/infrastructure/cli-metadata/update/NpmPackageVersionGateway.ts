import type { ILogger } from "../../../application/logging/ILogger.js";
import type { ITelemetryClient } from "../../../application/telemetry/ITelemetryClient.js";
import type { CliPackageVersionLookupResult } from "../../../application/cli-metadata/update/CliPackageVersionLookupResult.js";
import { CliUpdateFailureReason } from "../../../application/cli-metadata/update/CliUpdateFailureReason.js";
import type { ICliPackageVersionGateway } from "../../../application/cli-metadata/update/ICliPackageVersionGateway.js";
import { CLI_UPDATE_TEST_VERSION_ENV } from "./CliUpdateTestMode.js";

const NPM_REGISTRY_BASE_URL = "https://registry.npmjs.org";
const NPM_REGISTRY_TIMEOUT_MS = 3_000;
const NPM_LATEST_VERSION_LOOKUP_COMPLETED_EVENT =
  "npm_latest_version_lookup_completed";

export class NpmPackageVersionGateway implements ICliPackageVersionGateway {
  constructor(
    private readonly telemetryClient?: Pick<ITelemetryClient, "track">,
    private readonly logger?: Pick<ILogger, "warn" | "info">,
    private readonly fetchImplementation: typeof fetch = fetch,
    private readonly testLatestVersion: string | null = process.env[
      CLI_UPDATE_TEST_VERSION_ENV
    ] ?? null,
  ) {}

  async getLatestVersion(
    packageName: string,
  ): Promise<CliPackageVersionLookupResult> {
    const startedAt = Date.now();

    if (this.testLatestVersion !== null) {
      const result: CliPackageVersionLookupResult = {
        ok: true,
        version: this.testLatestVersion,
      };
      this.track(packageName, startedAt, true);
      this.logger?.info("npm latest version override enabled", {
        packageName,
        env: CLI_UPDATE_TEST_VERSION_ENV,
        version: this.testLatestVersion,
      });
      return result;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, NPM_REGISTRY_TIMEOUT_MS);

    try {
      const response = await this.fetchImplementation(
        `${NPM_REGISTRY_BASE_URL}/${encodeURIComponent(packageName)}/latest`,
        { signal: controller.signal },
      );

      if (!response.ok) {
        return this.fail(
          packageName,
          startedAt,
          CliUpdateFailureReason.RegistryError,
          "RegistryHttpError",
          `npm registry returned ${response.status}`,
        );
      }

      const payload = (await response.json()) as { version?: unknown };

      if (typeof payload.version !== "string") {
        return this.fail(
          packageName,
          startedAt,
          CliUpdateFailureReason.VersionParseFailure,
          "RegistryPayloadError",
          "npm registry latest payload did not contain a string version",
        );
      }

      const result: CliPackageVersionLookupResult = {
        ok: true,
        version: payload.version,
      };
      this.track(packageName, startedAt, true);
      return result;
    } catch (error) {
      const errorType = this.resolveErrorType(error);
      const message = this.resolveErrorMessage(error);
      const reason =
        errorType === "AbortError"
          ? CliUpdateFailureReason.Offline
          : CliUpdateFailureReason.RegistryError;

      return this.fail(packageName, startedAt, reason, errorType, message);
    } finally {
      clearTimeout(timeout);
    }
  }

  private fail(
    packageName: string,
    startedAt: number,
    reason: CliUpdateFailureReason,
    errorType: string,
    message: string,
  ): CliPackageVersionLookupResult {
    this.track(packageName, startedAt, false, reason, errorType);
    this.logger?.warn("npm latest version lookup failed", {
      packageName,
      reason,
      errorType,
    });

    return {
      ok: false,
      reason,
      errorType,
      message,
    };
  }

  private track(
    packageName: string,
    startedAt: number,
    success: boolean,
    reason?: CliUpdateFailureReason,
    errorType?: string,
  ): void {
    this.telemetryClient?.track(NPM_LATEST_VERSION_LOOKUP_COMPLETED_EVENT, {
      packageName,
      success,
      durationMs: Date.now() - startedAt,
      ...(reason ? { reason } : {}),
      ...(errorType ? { errorType } : {}),
    });
  }

  private resolveErrorType(error: unknown): string {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      typeof error.name === "string" &&
      error.name.length > 0
    ) {
      return error.name;
    }

    return "UnknownError";
  }

  private resolveErrorMessage(error: unknown): string {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }

    return String(error);
  }
}
