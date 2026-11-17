import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { SettingsScreen } from "../../../../../src/presentation/tui/settings/SettingsScreen.js";

describe("SettingsScreen", () => {
  it("renders the Settings placeholder screen", () => {
    const { lastFrame } = render(<SettingsScreen />);

    expect(lastFrame()).toContain("Settings");
    expect(lastFrame()).toContain("not editable");
  });
});
