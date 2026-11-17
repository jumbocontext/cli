import { describe, expect, it } from "@jest/globals";
import type { DaemonName } from "../../../../../src/presentation/tui/daemon-subprocesses/DaemonName.js";

describe("DaemonName", () => {
  it("aliases the worker daemon name union used by TUI subprocess controls", () => {
    const names: readonly DaemonName[] = ["refiner", "reviewer", "codifier"];

    expect(names).toEqual(["refiner", "reviewer", "codifier"]);
  });
});
