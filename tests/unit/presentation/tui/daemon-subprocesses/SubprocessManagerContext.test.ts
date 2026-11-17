import React from "react";
import { describe, expect, it } from "@jest/globals";
import { Text } from "ink";
import { render } from "ink-testing-library";
import { SubprocessManagerContext } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessManagerContext.js";
import type { ISubprocessManager } from "../../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

describe("SubprocessManagerContext", () => {
  it("exposes a presentation fallback subprocess manager as its default value", async () => {
    let observedManager: ISubprocessManager | undefined;

    const { unmount } = render(
      React.createElement(
        SubprocessManagerContext.Consumer,
        undefined,
        (manager) => {
          observedManager = manager;
          return React.createElement(Text, undefined, "context observed");
        },
      ),
    );

    expect(observedManager).toBeDefined();
    await expect(observedManager!.spawn("refiner")).resolves.toMatchObject({
      name: "refiner",
      status: "stopped",
    });
    const statusNames = observedManager!.getAllStatuses().map((snapshot) => snapshot.name);
    expect(statusNames).toEqual(expect.arrayContaining([
      "refiner",
      "reviewer",
      "codifier",
    ]));
    expect(statusNames).toHaveLength(3);
    unmount();
  });
});
