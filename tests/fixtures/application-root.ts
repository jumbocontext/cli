import { jest } from "@jest/globals";
import os from "node:os";
import path from "node:path";
import { ApplicationRoot } from "../../src/application/host/ApplicationRoot.js";

/** Use a disposable home distinct from the workspace, so its .jumbo is not a legacy artifact. */
export function applicationEnvironment(
  testDirectory: string,
): NodeJS.ProcessEnv {
  const home = path.join(testDirectory, "user-home");
  return {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    JUMBO_TELEMETRY_DISABLED: "1",
  };
}

export function applicationRoot(testDirectory: string) {
  return applicationRootInHome(path.join(testDirectory, "user-home"));
}

/** Supply an isolated root to consumers without resetting the production singleton. */
export function applicationRootInHome(home: string): ApplicationRoot {
  const homedir = jest.spyOn(os, "homedir").mockReturnValue(home);
  try {
    const root = Reflect.construct(ApplicationRoot, []) as ApplicationRoot;
    jest.spyOn(ApplicationRoot, "getInstance").mockReturnValue(root);
    return root;
  } finally {
    homedir.mockRestore();
  }
}
