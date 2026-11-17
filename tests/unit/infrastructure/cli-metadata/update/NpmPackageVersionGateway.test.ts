import { describe, expect, it, jest } from "@jest/globals";
import { NpmPackageVersionGateway } from "../../../../../src/infrastructure/cli-metadata/update/NpmPackageVersionGateway.js";
import { CliUpdateFailureReason } from "../../../../../src/application/cli-metadata/update/CliUpdateFailureReason.js";

describe("NpmPackageVersionGateway", () => {
  it("returns the latest npm package version", async () => {
    const fetchImplementation = jest.fn(async () => ({
      ok: true,
      json: async () => ({ version: "1.3.0" }),
    })) as unknown as typeof fetch;
    const telemetry = { track: jest.fn() };
    const gateway = new NpmPackageVersionGateway(
      telemetry,
      undefined,
      fetchImplementation,
    );

    await expect(gateway.getLatestVersion("jumbo-cli")).resolves.toEqual({
      ok: true,
      version: "1.3.0",
    });
    expect(telemetry.track).toHaveBeenCalledWith(
      "npm_latest_version_lookup_completed",
      expect.objectContaining({ packageName: "jumbo-cli", success: true }),
    );
  });

  it("returns an explicit test version without calling the npm registry", async () => {
    const fetchImplementation = jest.fn() as unknown as typeof fetch;
    const telemetry = { track: jest.fn() };
    const logger = { warn: jest.fn(), info: jest.fn() };
    const gateway = new NpmPackageVersionGateway(
      telemetry,
      logger,
      fetchImplementation,
      "9999.0.0",
    );

    await expect(gateway.getLatestVersion("jumbo-cli")).resolves.toEqual({
      ok: true,
      version: "9999.0.0",
    });
    expect(fetchImplementation).not.toHaveBeenCalled();
    expect(telemetry.track).toHaveBeenCalledWith(
      "npm_latest_version_lookup_completed",
      expect.objectContaining({ packageName: "jumbo-cli", success: true }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      "npm latest version override enabled",
      expect.objectContaining({
        packageName: "jumbo-cli",
        env: "JUMBO_CLI_UPDATE_TEST_VERSION",
        version: "9999.0.0",
      }),
    );
  });

  it("maps non-2xx responses to registry errors", async () => {
    const fetchImplementation = jest.fn(async () => ({
      ok: false,
      status: 503,
    })) as unknown as typeof fetch;
    const logger = { warn: jest.fn() };
    const gateway = new NpmPackageVersionGateway(
      undefined,
      logger,
      fetchImplementation,
    );

    await expect(gateway.getLatestVersion("jumbo-cli")).resolves.toMatchObject({
      ok: false,
      reason: CliUpdateFailureReason.RegistryError,
      errorType: "RegistryHttpError",
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "npm latest version lookup failed",
      expect.objectContaining({
        packageName: "jumbo-cli",
        reason: CliUpdateFailureReason.RegistryError,
      }),
    );
  });

  it("maps invalid registry payloads to version parse failures", async () => {
    const fetchImplementation = jest.fn(async () => ({
      ok: true,
      json: async () => ({ version: 123 }),
    })) as unknown as typeof fetch;
    const gateway = new NpmPackageVersionGateway(
      undefined,
      undefined,
      fetchImplementation,
    );

    await expect(gateway.getLatestVersion("jumbo-cli")).resolves.toMatchObject({
      ok: false,
      reason: CliUpdateFailureReason.VersionParseFailure,
      errorType: "RegistryPayloadError",
    });
  });

  it("maps fetch failures to registry errors", async () => {
    const fetchImplementation = jest.fn(async () => {
      throw new TypeError("offline");
    }) as unknown as typeof fetch;
    const gateway = new NpmPackageVersionGateway(
      undefined,
      undefined,
      fetchImplementation,
    );

    await expect(gateway.getLatestVersion("jumbo-cli")).resolves.toMatchObject({
      ok: false,
      reason: CliUpdateFailureReason.RegistryError,
      errorType: "TypeError",
    });
  });

  it("maps aborted lookups to offline failures", async () => {
    const fetchImplementation = jest.fn(async () => {
      throw new DOMException("timeout", "AbortError");
    }) as unknown as typeof fetch;
    const telemetry = { track: jest.fn() };
    const gateway = new NpmPackageVersionGateway(
      telemetry,
      undefined,
      fetchImplementation,
    );

    await expect(gateway.getLatestVersion("jumbo-cli")).resolves.toMatchObject({
      ok: false,
      reason: CliUpdateFailureReason.Offline,
      errorType: "AbortError",
    });
    expect(telemetry.track).toHaveBeenCalledWith(
      "npm_latest_version_lookup_completed",
      expect.objectContaining({
        success: false,
        reason: CliUpdateFailureReason.Offline,
        errorType: "AbortError",
      }),
    );
  });
});
