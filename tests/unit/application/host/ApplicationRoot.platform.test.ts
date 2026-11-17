import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import os from "node:os";
import path from "node:path";
import type { ApplicationRoot as ApplicationRootType } from "../../../../src/application/host/ApplicationRoot.js";

const pathForPlatform = (platform: string) =>
  platform === "win32" ? path.win32 : path.posix;
jest.unstable_mockModule("node:path", () => ({
  // Jest captures this export once, so resolve the platform inside each operation.
  default: {
    join(...paths: string[]) {
      return pathForPlatform(process.platform).join(...paths);
    },
    isAbsolute(value: string) {
      return pathForPlatform(process.platform).isAbsolute(value);
    },
    normalize(value: string) {
      return pathForPlatform(process.platform).normalize(value);
    },
    get sep() {
      return pathForPlatform(process.platform).sep;
    },
  },
}));
const rootModule = await import("../../../../src/application/host/ApplicationRoot.js");
const { ApplicationRoot } = rootModule;
const platformDescriptor = Object.getOwnPropertyDescriptor(process, "platform")!;

function constructRoot(...args: unknown[]): ApplicationRootType {
  return Reflect.construct(ApplicationRoot, args) as ApplicationRootType;
}

function mockPlatform(platform: string) {
  Object.defineProperty(process, "platform", { ...platformDescriptor, value: platform });
}

beforeEach(() => {
  mockPlatform("linux");
  jest.spyOn(os, "homedir").mockReturnValue("/user");
});

afterEach(() => {
  jest.restoreAllMocks();
  Object.defineProperty(process, "platform", platformDescriptor);
});

describe("ApplicationRoot", () => {
  it("construct_validHome_doesNotExposeIndependentProjectStorage", () => {
    // Arrange
    const exportedNames = Object.keys(rootModule);
    // Act
    const root = constructRoot();
    // Assert
    expect(exportedNames).not.toContain("ProjectStorage");
    expect(root).not.toHaveProperty("project");
  });

  it("construct_callerSuppliesPath_ignoresOverride", () => {
    // Arrange
    const override = "/arbitrary/root";
    // Act
    const root = constructRoot(override);
    // Assert
    expect(root.path).toBe("/user/.jumbo");
  });

  it("construct_homeResolutionFails_propagatesFailure", () => {
    // Arrange
    const failure = new Error("Cannot resolve home directory");
    jest.mocked(os.homedir).mockImplementation(() => { throw failure; });
    // Act
    const construct = () => constructRoot();
    // Assert
    expect(construct).toThrow(failure);
  });

  it.each([
    ["linux", "/home/jjw", "/home/jjw/.jumbo"],
    ["darwin", "/Users/jjw", "/Users/jjw/Library/Application Support/jumbo"],
    ["win32", "C:\\Users\\jjw", "C:\\Users\\jjw\\.jumbo"],
    ["win32", "\\\\server\\users\\jjw", "\\\\server\\users\\jjw\\.jumbo"],
  ])("construct_%sHome%s_selectsPlatformRoot%s", (platform, home, expected) => {
    // Arrange
    mockPlatform(platform);
    jest.mocked(os.homedir).mockReturnValue(home);
    // Act
    const root = constructRoot();
    // Assert
    expect(root.path).toBe(expected);
    expect(os.homedir).toHaveBeenCalledTimes(1);
  });

  it.each(["/other/storage", "D:\\Data", "relative", ""])("construct_environmentOverride%s_usesHomeInstead", value => {
    // Arrange
    jest.replaceProperty(process, "env", { ...process.env, XDG_DATA_HOME: value, XDG_CONFIG_HOME: value, XDG_STATE_HOME: value, APPDATA: value, LOCALAPPDATA: value });
    // Act
    const posixRoot = constructRoot();
    mockPlatform("win32");
    jest.mocked(os.homedir).mockReturnValue("C:\\Users\\jjw");
    const windowsRoot = constructRoot();
    // Assert
    expect(posixRoot.path).toBe("/user/.jumbo");
    expect(windowsRoot.path).toBe("C:\\Users\\jjw\\.jumbo");
  });

  it("construct_validProjectPath_derivesHierarchyFromImmutableRoot", () => {
    // Arrange
    const projectPath = "/home/jjw/jumbo/cli";
    // Act
    const root = constructRoot();
    const directory = root.getProjectDirectory(projectPath);
    // Assert
    expect(root.settingsFile).toBe(`${root.path}/settings.json`);
    expect(root).not.toHaveProperty("workspaceMappingsFile");
    expect(directory).toBe(`${root.path}/projects/--home-jjw-jumbo-cli--`);
    expect(root.getProjectSettings(projectPath)).toBe(`${directory}/settings.json`);
    expect(root.getProjectDbFile(projectPath)).toBe(`${directory}/jumbo.db`);
    expect(root.getProjectEventsDirectory(projectPath)).toBe(`${directory}/events`);
    expect(root.getProjectLogsDirectory(projectPath)).toBe(`${directory}/logs`);
    expect(Object.isFrozen(root)).toBe(true);
    expect(os.homedir).toHaveBeenCalledTimes(1);
  });

  it("construct_environmentChanges_retainsResolvedRoot", () => {
    // Arrange
    const root = constructRoot();
    // Act
    jest.mocked(os.homedir).mockReturnValue("/another-user");
    mockPlatform("darwin");
    // Assert
    expect(root.path).toBe("/user/.jumbo");
    expect(root.settingsFile).toBe("/user/.jumbo/settings.json");
    expect(os.homedir).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["/work/a/api", "/work/b/api"],
    ["/work/a-b", "/work/a/b", "/work/a%2Db"],
  ])("getProjectDirectory_distinctPaths%j_producesDistinctKeys", (...paths) => {
    // Arrange
    const root = constructRoot();
    // Act
    const directories = paths.map(value => root.getProjectDirectory(value));
    // Assert
    expect(new Set(directories).size).toBe(paths.length);
  });

  it("getProjectDirectory_windowsPath_usesNativePathSemantics", () => {
    // Arrange
    mockPlatform("win32");
    jest.mocked(os.homedir).mockReturnValue("C:\\Users\\jjw");
    const root = constructRoot();
    const projectPath = "D:\\work\\cli";
    // Act
    const directory = root.getProjectDirectory(projectPath);
    // Assert
    expect(directory).toBe(`${root.path}\\projects\\--D%3A-work-cli--`);
    expect(root.getProjectSettings(projectPath)).toBe(`${directory}\\settings.json`);
    expect(root.getProjectEventsDirectory(projectPath)).toBe(`${directory}\\events`);
    expect(root.getProjectLogsDirectory(projectPath)).toBe(`${directory}\\logs`);
    expect(root.getProjectDbFile(projectPath)).toBe(`${directory}\\jumbo.db`);
  });

  it("getProjectDirectory_posixDoubleSlash_normalizesWithoutGuessingWindowsSemantics", () => {
    // Arrange
    jest.mocked(os.homedir).mockReturnValue("//user");
    const root = constructRoot();
    // Act
    const directory = root.getProjectDirectory("/work/./cli");
    // Assert
    expect(root.path).toBe("/user/.jumbo");
    expect(directory).toBe("/user/.jumbo/projects/--work-cli--");
  });

  it.each(["relative", "", "/bad\0path", "/bad\rpath", "/bad\npath"])("getProjectDirectory_invalidPath%s_rejectsAcrossAllGetters", value => {
    // Arrange
    const root = constructRoot();
    // Act
    const getters = [() => root.getProjectDirectory(value), () => root.getProjectSettings(value), () => root.getProjectEventsDirectory(value), () => root.getProjectLogsDirectory(value), () => root.getProjectDbFile(value)];
    // Assert
    for (const getter of getters) expect(getter).toThrow(/absolute/);
  });

  it.each(["linux", "darwin", "win32"])("construct_%sWithInvalidHome_rejects", platform => {
    // Arrange
    mockPlatform(platform);
    const homes = ["", "relative", "/bad\0path", "/bad\rpath", "/bad\npath"];
    // Act
    const constructors = homes.map(home => () => {
      jest.mocked(os.homedir).mockReturnValue(home);
      return constructRoot();
    });
    // Assert
    for (const construct of constructors) expect(construct).toThrow(/absolute/);
  });

  it.each(["C:relative", "\\Users\\jjw", "/Users/jjw"])("construct_windowsDriveRelativeHome%s_rejects", home => {
    // Arrange
    mockPlatform("win32");
    jest.mocked(os.homedir).mockReturnValue(home);
    // Act
    const construct = () => constructRoot();
    // Assert
    expect(construct).toThrow(/absolute/);
  });

  it("construct_unsupportedPlatform_rejectsBeforeReadingHome", () => {
    // Arrange
    mockPlatform("freebsd");
    // Act
    const construct = () => constructRoot();
    // Assert
    expect(construct).toThrow(/Unsupported/);
    expect(os.homedir).not.toHaveBeenCalled();
  });

});
