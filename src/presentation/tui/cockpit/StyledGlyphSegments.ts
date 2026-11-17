import { BaseColors } from "../../shared/DesignTokens.js";
import { SubprocessStatus } from "../daemon-subprocesses/SubprocessStatus.js";
import type { CockpitDaemonSnapshot } from "./CockpitDaemonSnapshot.js";
import type {
  DaemonFrameGlyphColorMap,
  DaemonFrameGlyphStyle,
} from "./DaemonFrameGlyphTypes.js";

const DEFAULT_STYLED_GLYPH_SEGMENT_STYLE: DaemonFrameGlyphStyle = {
  color: BaseColors.shade3,
  dimColor: false,
};

export function getStyledGlyphSegments(
  line: string,
  glyphColors: DaemonFrameGlyphColorMap,
  snapshot: CockpitDaemonSnapshot,
): Array<DaemonFrameGlyphStyle & { text: string }> {
  const segments: Array<DaemonFrameGlyphStyle & { text: string }> = [];

  for (const character of line) {
    const glyphStyle = getGlyphStyle(character, glyphColors, snapshot);
    const previousSegment = segments[segments.length - 1];

    if (
      previousSegment !== undefined &&
      previousSegment.color === glyphStyle.color &&
      previousSegment.dimColor === glyphStyle.dimColor
    ) {
      previousSegment.text += character;
      continue;
    }

    segments.push({
      text: character,
      color: glyphStyle.color,
      dimColor: glyphStyle.dimColor,
    });
  }

  return segments;
}

function getGlyphStyle(
  character: string,
  glyphColors: DaemonFrameGlyphColorMap,
  snapshot: CockpitDaemonSnapshot,
): DaemonFrameGlyphStyle {
  const color = glyphColors[character];

  if (color === undefined) {
    return {
      ...DEFAULT_STYLED_GLYPH_SEGMENT_STYLE,
      color: getDaemonGlyphColor(
        snapshot,
        DEFAULT_STYLED_GLYPH_SEGMENT_STYLE.color,
      ),
    };
  }

  return { color: getDaemonGlyphColor(snapshot, color) };
}

function getDaemonGlyphColor(
  snapshot: CockpitDaemonSnapshot,
  animatedColor: string,
): string {
  return snapshot.status === SubprocessStatus.RUNNING
    ? animatedColor
    : BaseColors.shade6;
}
