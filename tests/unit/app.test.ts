import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

const getVersion = jest.fn(() => ({ version: "1.2.3" }));
const launchTui = jest.fn<(version: string) => Promise<void>>();
const runCli = jest.fn<() => Promise<void>>();
const constructCliInitializer = jest.fn();

jest.unstable_mockModule("../../src/infrastructure/cli-metadata/query/CliVersionReader.js", () => ({
  CliVersionReader: class {
    getVersion = getVersion;
  },
}));
jest.unstable_mockModule("../../src/presentation/tui/Initializer.js", () => ({
  Initializer: class TuiInitializer {
    launch = launchTui;
  },
}));
jest.unstable_mockModule("../../src/presentation/cli/Initializer.js", () => ({
  Initializer: class CliInitializer {
    constructor(version: string) {
      constructCliInitializer(version);
    }

    run = runCli;
  },
}));

const { runApp } = await import("../../src/app.js");
let originalArgv: string[];
let nodeEnvDescriptor: PropertyDescriptor | undefined;

beforeEach(() => {
  originalArgv = process.argv;
  nodeEnvDescriptor = Object.getOwnPropertyDescriptor(process.env, "NODE_ENV");
  jest.clearAllMocks();
  getVersion.mockReturnValue({ version: "1.2.3" });
  launchTui.mockResolvedValue(undefined);
  runCli.mockResolvedValue(undefined);
});

afterEach(() => {
  process.argv = originalArgv;
  if (nodeEnvDescriptor) {
    Object.defineProperty(process.env, "NODE_ENV", nodeEnvDescriptor);
  } else {
    Reflect.deleteProperty(process.env, "NODE_ENV");
  }
});

describe("runApp", () => {
  it.each([undefined, "development"])(
    "launches the TUI for a bare invocation and preserves NODE_ENV %s",
    async (nodeEnv) => {
      if (nodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = nodeEnv;
      process.argv = ["node", "jumbo"];

      await runApp();

      expect(getVersion).toHaveBeenCalledTimes(1);
      expect(launchTui).toHaveBeenCalledWith("1.2.3");
      expect(process.env.NODE_ENV).toBe(nodeEnv ?? "production");
      expect(constructCliInitializer).not.toHaveBeenCalled();
      expect(runCli).not.toHaveBeenCalled();
    },
  );

  it("routes an invocation with arguments to the CLI initializer", async () => {
    process.argv = ["node", "jumbo", "project", "show"];

    await runApp();

    expect(getVersion).toHaveBeenCalledTimes(1);
    expect(constructCliInitializer).toHaveBeenCalledWith("1.2.3");
    expect(runCli).toHaveBeenCalledTimes(1);
    expect(launchTui).not.toHaveBeenCalled();
  });

  it("propagates initializer failures", async () => {
    const failure = new Error("CLI initialization failed");
    runCli.mockRejectedValueOnce(failure);
    process.argv = ["node", "jumbo", "--help"];

    await expect(runApp()).rejects.toBe(failure);

    expect(constructCliInitializer).toHaveBeenCalledWith("1.2.3");
    expect(launchTui).not.toHaveBeenCalled();
  });
});
