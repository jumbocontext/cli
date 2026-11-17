import { describe, expect, it, jest } from "@jest/globals";
import { CliUpdateController } from "../../../../../src/application/cli-metadata/update/CliUpdateController.js";
import { CliUpdateFailureReason } from "../../../../../src/application/cli-metadata/update/CliUpdateFailureReason.js";
import type { ICliPackageUpgradeGateway } from "../../../../../src/application/cli-metadata/update/ICliPackageUpgradeGateway.js";
import type { ICliPackageVersionGateway } from "../../../../../src/application/cli-metadata/update/ICliPackageVersionGateway.js";

describe("CliUpdateController", () => {
  const feasibleUpgradeGateway = (): ICliPackageUpgradeGateway => ({
    evaluate: jest.fn(async () => ({
      feasible: true,
      command: "npm",
      args: ["install", "-g", "jumbo-cli@latest"],
    })),
    upgrade: jest.fn(async () => ({
      ok: true,
      message: "done",
    })),
  });

  it("returns up-to-date when the published version is not newer", async () => {
    const versionGateway: ICliPackageVersionGateway = {
      getLatestVersion: jest.fn(async () => ({ ok: true, version: "1.2.3" })),
    };
    const telemetry = { track: jest.fn() };
    const controller = new CliUpdateController(
      versionGateway,
      feasibleUpgradeGateway(),
      telemetry,
    );

    await expect(controller.check("1.2.3")).resolves.toMatchObject({
      status: "up-to-date",
      localVersion: "1.2.3",
      latestVersion: "1.2.3",
    });
    expect(telemetry.track).toHaveBeenCalledWith(
      "cli_update_check_completed",
      expect.objectContaining({ status: "up-to-date" }),
    );
  });

  it("returns update availability with upgrade feasibility", async () => {
    const versionGateway: ICliPackageVersionGateway = {
      getLatestVersion: jest.fn(async () => ({ ok: true, version: "1.3.0" })),
    };
    const upgradeGateway = feasibleUpgradeGateway();
    const controller = new CliUpdateController(versionGateway, upgradeGateway);

    await expect(controller.check("1.2.3")).resolves.toMatchObject({
      status: "update-available",
      localVersion: "1.2.3",
      latestVersion: "1.3.0",
      feasibility: { feasible: true },
    });
    expect(upgradeGateway.evaluate).toHaveBeenCalledTimes(1);
  });

  it("returns lookup failures without throwing", async () => {
    const versionGateway: ICliPackageVersionGateway = {
      getLatestVersion: jest.fn(async () => ({
        ok: false,
        reason: CliUpdateFailureReason.RegistryError,
        errorType: "TypeError",
        message: "network down",
      })),
    };
    const logger = { warn: jest.fn(), info: jest.fn() };
    const controller = new CliUpdateController(
      versionGateway,
      feasibleUpgradeGateway(),
      undefined,
      logger,
    );

    await expect(controller.check("1.2.3")).resolves.toMatchObject({
      status: "lookup-failed",
      reason: CliUpdateFailureReason.RegistryError,
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "CLI update lookup failed",
      expect.objectContaining({ reason: CliUpdateFailureReason.RegistryError }),
    );
  });

  it("returns parse failures for invalid version data", async () => {
    const versionGateway: ICliPackageVersionGateway = {
      getLatestVersion: jest.fn(async () => ({ ok: true, version: "latest" })),
    };
    const controller = new CliUpdateController(
      versionGateway,
      feasibleUpgradeGateway(),
    );

    await expect(controller.check("1.2.3")).resolves.toMatchObject({
      status: "version-parse-failed",
      latestVersion: "latest",
    });
  });

  it("delegates upgrade attempts and reports failures", async () => {
    const upgradeGateway: ICliPackageUpgradeGateway = {
      evaluate: jest.fn(async () => ({
        feasible: true,
        command: "npm",
        args: [],
      })),
      upgrade: jest.fn(async () => ({
        ok: false,
        reason: CliUpdateFailureReason.UpgradeFailed,
        guidance: "Run npm install -g jumbo-cli@latest",
        errorType: "Error",
        message: "failed",
      })),
    };
    const controller = new CliUpdateController(
      { getLatestVersion: jest.fn() },
      upgradeGateway,
    );

    await expect(controller.upgrade("1.3.0")).resolves.toMatchObject({
      ok: false,
      reason: CliUpdateFailureReason.UpgradeFailed,
    });
    expect(upgradeGateway.upgrade).toHaveBeenCalledWith("1.3.0");
  });
});
