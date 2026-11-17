import { DaemonFrameDimensions } from "./DaemonFrameDimensions.js";
import type { DaemonFrameGlyphCell } from "./DaemonFrameGlyphTypes.js";

export const DaemonFrameStatusOverlay = {
  isLine,
  getGlyphCellPrefix,
  getGlyphCellSuffix,
  getGlyphTextPrefix,
  getGlyphTextSuffix,
} as const;

function isLine(lineIndex: number): boolean {
  return (
    lineIndex === Math.floor(DaemonFrameDimensions.renderedFrameHeight / 2)
  );
}

function getGlyphCellPrefix(
  line: readonly DaemonFrameGlyphCell[],
  statusLabel: string,
  lineIndex: number,
): readonly DaemonFrameGlyphCell[] {
  if (!isLine(lineIndex)) {
    return line;
  }

  return line.slice(0, getDaemonStatusOverlayStart(line.length, statusLabel));
}

function getGlyphCellSuffix(
  line: readonly DaemonFrameGlyphCell[],
  statusLabel: string,
  lineIndex: number,
): readonly DaemonFrameGlyphCell[] {
  if (!isLine(lineIndex)) {
    return [];
  }

  return line.slice(getDaemonStatusOverlayEnd(line.length, statusLabel));
}

function getGlyphTextPrefix(
  line: string,
  statusLabel: string,
  lineIndex: number,
): string {
  if (!isLine(lineIndex)) {
    return line;
  }

  return line.slice(0, getDaemonStatusOverlayStart(line.length, statusLabel));
}

function getGlyphTextSuffix(
  line: string,
  statusLabel: string,
  lineIndex: number,
): string {
  if (!isLine(lineIndex)) {
    return "";
  }

  return line.slice(getDaemonStatusOverlayEnd(line.length, statusLabel));
}

function getDaemonStatusOverlayStart(
  lineLength: number,
  statusLabel: string,
): number {
  return Math.max(0, Math.floor((lineLength - statusLabel.length) / 2));
}

function getDaemonStatusOverlayEnd(
  lineLength: number,
  statusLabel: string,
): number {
  return Math.min(
    lineLength,
    getDaemonStatusOverlayStart(lineLength, statusLabel) + statusLabel.length,
  );
}
