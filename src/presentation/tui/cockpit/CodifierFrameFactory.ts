import { BaseColors } from "../../shared/DesignTokens.js";
import { DaemonFrameDimensions } from "./DaemonFrameDimensions.js";
import type { DaemonFrameGlyphColorMap } from "./DaemonFrameGlyphTypes.js";

const CODIFIER_GROUP_LENGTH = 4;
const CODIFIER_ROW_REPEAT_COUNT = 7;
const CODIFIER_ALPHANUMERIC_GLYPHS = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
] as const;

const DEFAULT_CODIFIER_GLYPH_COLORS: DaemonFrameGlyphColorMap = {
  "█": BaseColors.shade1,
  "░": BaseColors.shade2,
};

export const CodifierFrameFactory = {
  frameCount: DaemonFrameDimensions.codifierFrameCount,
  defaultFrameDurationMs: DaemonFrameDimensions.defaultCodifierFrameDurationMs,
  defaultGlyphColors: DEFAULT_CODIFIER_GLYPH_COLORS,
  getFrame,
} as const;

function getFrame(index: number): string[] {
  if (index < 0 || index >= DaemonFrameDimensions.codifierFrameCount) {
    return ["error"];
  }

  const random = createSeededRandom(
    createSeed(
      index + DaemonFrameDimensions.codifierFrameCount,
      DaemonFrameDimensions.panelContentWidth *
        DaemonFrameDimensions.codifierGridHeight,
    ),
  );

  return Array.from(
    { length: DaemonFrameDimensions.codifierGridHeight },
    () => {
      const groups = new Set<string>();

      while (groups.size < CODIFIER_ROW_REPEAT_COUNT) {
        groups.add(
          Array.from({ length: CODIFIER_GROUP_LENGTH }, () =>
            pickRandomValue(CODIFIER_ALPHANUMERIC_GLYPHS, random),
          ).join(""),
        );
      }

      return Array.from(groups)
        .map((group) => `${group}.`)
        .join("");
    },
  );
}

function createSeed(frameIndex: number, gridSize: number): number {
  return (frameIndex + 1) * 1009 + gridSize * 9176;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pickRandomValue<T>(values: readonly T[], random: () => number): T {
  return values[Math.floor(random() * values.length)];
}
