/**
 * Braille Spinner
 *
 * Single-character braille spinner that cycles through the letters of a word,
 * displayed alongside the latin text with a continuous gradient shimmer.
 */

import {
  rgb,
  getSmoothedColor,
  SPINNER_COLORS,
  COLOR_CYCLE_FRAMES,
} from "./GradientPalette.js";
import type { RGB } from "./GradientPalette.js";

const RESET = "\x1b[0m";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";

/** Mapping of latin letters to braille equivalents */
export const BRAILLE_MAP: Record<string, string> = {
  a: "⠁",
  b: "⠃",
  c: "⠉",
  d: "⠙",
  e: "⠑",
  f: "⠋",
  g: "⠛",
  h: "⠓",
  i: "⠊",
  j: "⠚",
  k: "⠅",
  l: "⠇",
  m: "⠍",
  n: "⠝",
  o: "⠕",
  p: "⠏",
  q: "⠟",
  r: "⠗",
  s: "⠎",
  t: "⠞",
  u: "⠥",
  v: "⠧",
  w: "⠺",
  x: "⠭",
  y: "⠽",
  z: "⠵",
  " ": "⠀",
};

export interface BrailleSpinnerConfig {
  /** The word to spell in braille and display as latin text */
  label: string;
  /** Frames to hold each braille letter (default 8) */
  frameHold?: number;
  /** Timer interval in ms (default 100) */
  intervalMs?: number;
  /** Write function (default: process.stderr.write) */
  write?: (s: string) => void;
}

/**
 * Start a braille spinner animation.
 *
 * Displays: `⠺ Waiting...` where the braille character cycles through
 * each letter of the word, and the entire line shimmers through the
 * gradient spectrum with per-character color offsets.
 *
 * Returns a handle with `stop()` to clear the animation and restore cursor.
 */
export function startBrailleSpinner(config: BrailleSpinnerConfig): {
  stop: () => void;
} {
  const {
    label,
    frameHold = 8,
    intervalMs = 100,
    write = (s: string) => process.stderr.write(s),
  } = config;

  const brailleSeq = label
    .toLowerCase()
    .split("")
    .map((ch) => BRAILLE_MAP[ch] ?? "⠿");
  const capitalLabel = label.charAt(0).toUpperCase() + label.slice(1);
  const totalSteps = brailleSeq.length * frameHold;

  // Non-TTY fallback
  if (!process.stderr.isTTY) {
    write(`  ${capitalLabel}...\n`);
    return { stop() {} };
  }

  let frame = 0;

  write(HIDE_CURSOR);
  const timer = setInterval(() => {
    const step = frame % totalSteps;
    const charIndex = Math.floor(step / frameHold) % brailleSeq.length;
    const text = `${brailleSeq[charIndex]} ${capitalLabel}...`;

    let rendered = "  ";
    for (let i = 0; i < text.length; i++) {
      const [r, g, b] = getSmoothedColor(frame * 3 - i * 8);
      rendered += `${rgb(r, g, b)}${text[i]}`;
    }
    rendered += RESET;

    write(`\r${rendered}  `);
    frame++;
  }, intervalMs);

  return {
    stop() {
      clearInterval(timer);
      write(SHOW_CURSOR);
      write(`\r\x1b[2K`);
    },
  };
}
