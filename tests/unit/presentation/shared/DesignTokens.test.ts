import { describe, expect, it } from "@jest/globals";
import {
  SemanticColors,
  TuiLayout,
} from "../../../../src/presentation/shared/DesignTokens.js";

describe("DesignTokens", () => {
  it("exports production layout dimensions for reusable TUI primitives", () => {
    expect(TuiLayout.panelMinWidth).toBeGreaterThan(0);
    expect(TuiLayout.listPanelWidth).toBeGreaterThan(TuiLayout.panelMinWidth);
    expect(TuiLayout.detailPanelWidth).toBeGreaterThan(TuiLayout.listPanelWidth);
  });

  it("exports semantic surface and focus colors", () => {
    expect(SemanticColors.surface).toMatch(/^#/);
    expect(SemanticColors.surfaceRaised).toMatch(/^#/);
    expect(SemanticColors.focusBorder).toMatch(/^#/);
  });
});
