import type { ILogger } from "../../logging/ILogger.js";
import type { ITelemetryClient } from "../../telemetry/ITelemetryClient.js";
import { CliPackageName } from "./CliPackageName.js";
import type { ICliPackageUpgradeGateway } from "./ICliPackageUpgradeGateway.js";
import type { ICliPackageVersionGateway } from "./ICliPackageVersionGateway.js";
import type { CliUpdateCheckResult } from "./CliUpdateCheckResult.js";
import { CliUpdateFailureReason } from "./CliUpdateFailureReason.js";
import type { CliUpgradeResult } from "./CliUpgradeResult.js";
import { CliVersionComparator } from "./CliVersionComparator.js";
import { CliVersionComparison } from "./CliVersionComparison.js";

const CLI_UPDATE_CHECK_COMPLETED_EVENT = "cli_update_check_completed";
const CLI_UPDATE_UPGRADE_COMPLETED_EVENT = "cli_update_upgrade_completed";

export class CliUpdateController {
  private readonly comparator = new CliVersionComparator();

  constructor(
    private readonly versionGateway: ICliPackageVersionGateway,
    private readonly upgradeGateway: ICliPackageUpgradeGateway,
    private readonly telemetryClient?: Pick<ITelemetryClient, "track">,
    private readonly logger?: Pick<ILogger, "warn" | "info">,
  ) {}

  async check(localVersion: string): Promise<CliUpdateCheckResult> {
    const startedAt = Date.now();
    const lookup = await this.versionGateway.getLatestVersion(CliPackageName);

    if (!lookup.ok) {
      const result: CliUpdateCheckResult = {
        status: "lookup-failed",
        localVersion,
        reason: lookup.reason,
        errorType: lookup.errorType,
        message: lookup.message,
      };
      this.trackCheck(startedAt, result);
      this.logger?.warn("CLI update lookup failed", {
        reason: lookup.reason,
        errorType: lookup.errorType,
      });
      return result;
    }

    const comparison = this.comparator.compare(localVersion, lookup.version);

    if (comparison === null) {
      const result: CliUpdateCheckResult = {
        status: "version-parse-failed",
        localVersion,
        latestVersion: lookup.version,
      };
      this.trackCheck(startedAt, result);
      this.logger?.warn("CLI update version comparison failed", {
        localVersion,
        latestVersion: lookup.version,
      });
      return result;
    }

    if (comparison !== CliVersionComparison.Older) {
      const result: CliUpdateCheckResult = {
        status: "up-to-date",
        localVersion,
        latestVersion: lookup.version,
      };
      this.trackCheck(startedAt, result);
      return result;
    }

    const feasibility = await this.upgradeGateway.evaluate();
    const result: CliUpdateCheckResult = {
      status: "update-available",
      localVersion,
      latestVersion: lookup.version,
      feasibility,
    };
    this.trackCheck(startedAt, result);
    return result;
  }

  async upgrade(targetVersion: string): Promise<CliUpgradeResult> {
    const startedAt = Date.now();
    const result = await this.upgradeGateway.upgrade(targetVersion);

    this.telemetryClient?.track(CLI_UPDATE_UPGRADE_COMPLETED_EVENT, {
      success: result.ok,
      targetVersion,
      durationMs: Date.now() - startedAt,
      ...(result.ok
        ? {}
        : {
            reason: result.reason,
            errorType: result.errorType,
          }),
    });

    if (result.ok) {
      this.logger?.info("CLI update upgrade completed", { targetVersion });
    } else {
      this.logger?.warn("CLI update upgrade failed", {
        targetVersion,
        reason: result.reason,
        errorType: result.errorType,
      });
    }

    return result;
  }

  private trackCheck(startedAt: number, result: CliUpdateCheckResult): void {
    this.telemetryClient?.track(CLI_UPDATE_CHECK_COMPLETED_EVENT, {
      status: result.status,
      localVersion: result.localVersion,
      latestVersion:
        result.status === "lookup-failed" ? undefined : result.latestVersion,
      durationMs: Date.now() - startedAt,
      ...(result.status === "lookup-failed"
        ? {
            reason: result.reason,
            errorType: result.errorType,
          }
        : {}),
      ...(result.status === "update-available"
        ? {
            selfUpgradeFeasible: result.feasibility.feasible,
            selfUpgradeReason: result.feasibility.feasible
              ? undefined
              : result.feasibility.reason,
          }
        : {}),
      ...(result.status === "version-parse-failed"
        ? { reason: CliUpdateFailureReason.VersionParseFailure }
        : {}),
    });
  }
}
