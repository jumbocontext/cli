import React from "react";
import { describe, expect, it } from "@jest/globals";
import { Text } from "ink";
import { render } from "ink-testing-library";
import { SubprocessManagerContext } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessManagerContext.js";
import { SubprocessManagerProvider } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessManagerProvider.js";
import type { ISubprocessManager } from "../../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

function createSubprocessManager(): ISubprocessManager {
  return {
    spawn: async () => {
      throw new Error("spawn is not exercised by this provider contract test");
    },
    terminate: async () => {
      throw new Error("terminate is not exercised by this provider contract test");
    },
    terminateAll: async () => {},
    getStatus: () => {
      throw new Error("getStatus is not exercised by this provider contract test");
    },
    getAllStatuses: () => [],
  };
}

describe("SubprocessManagerProvider", () => {
  it("provides the configured subprocess manager while preserving child rendering", () => {
    const manager = createSubprocessManager();
    let observedManager: ISubprocessManager | undefined;

    const { lastFrame, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <SubprocessManagerContext.Consumer>
          {(value) => {
            observedManager = value;
            return <Text>daemon child rendered</Text>;
          }}
        </SubprocessManagerContext.Consumer>
      </SubprocessManagerProvider>,
    );

    expect(observedManager).toBe(manager);
    expect(lastFrame()).toContain("daemon child rendered");
    unmount();
  });
});
