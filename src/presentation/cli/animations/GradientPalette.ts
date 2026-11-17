/**
 * Gradient Palette
 *
 * Shared color gradient definitions and interpolation utilities for
 * interactive CLI animations. Uses raw ANSI escapes (no chalk) for
 * performance in tight animation loops.
 */

export type RGB = [number, number, number];

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";

/** ANSI true-color foreground escape */
export function rgb(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}

/** Linear interpolation between two RGB tuples */
export function lerpColor(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/** Build a gradient array of `steps` colors between two RGB endpoints */
export function buildGradient(from: RGB, to: RGB, steps = 10): RGB[] {
  const g: RGB[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    g.push(lerpColor(from, to, t));
  }
  return g;
}

/**
 * 10 gradient palettes cycling through the color spectrum.
 * Each gradient has 10 color stops.
 */
export const GRADIENTS: RGB[][] = [
  buildGradient([255, 182, 193], [150, 0, 0]), // 1  red: light pink → dark maroon
  buildGradient([200, 100, 0], [255, 200, 140]), // 2  orange: deep orange → light peach
  buildGradient([255, 255, 180], [200, 180, 0]), // 3  yellow: light yellow → golden
  buildGradient([100, 140, 0], [240, 255, 180]), // 4  yellow-green: olive → light lime
  buildGradient([200, 255, 200], [0, 80, 0]), // 5  green: light mint → dark green
  buildGradient([30, 80, 160], [140, 200, 255]), // 6  jumbo blue: dark → light
  buildGradient([200, 200, 255], [0, 0, 80]), // 7  blue: light lavender → dark navy
  buildGradient([100, 60, 120], [220, 200, 230]), // 8  purple/mauve: dark → light lavender
  buildGradient([255, 180, 255], [50, 0, 80]), // 9  purple: light pink → dark indigo
  buildGradient([100, 0, 50], [255, 200, 230]), // 10 magenta: dark wine → light pink
];

/** All gradient colors flattened into one continuous sequence */
export const SPINNER_COLORS: RGB[] = GRADIENTS.flat();

/** Total frames for one full slow cycle through the spectrum */
export const COLOR_CYCLE_FRAMES = SPINNER_COLORS.length * 6;

/**
 * Get a smoothly interpolated color at a given frame position.
 * Handles negative frames and wraps around the full spectrum.
 */
export function getSmoothedColor(frame: number): RGB {
  const progress =
    (((frame % COLOR_CYCLE_FRAMES) + COLOR_CYCLE_FRAMES) % COLOR_CYCLE_FRAMES) /
    COLOR_CYCLE_FRAMES;
  const pos = progress * SPINNER_COLORS.length;
  const idx = Math.floor(pos);
  const t = pos - idx;
  const a = SPINNER_COLORS[idx % SPINNER_COLORS.length];
  const b = SPINNER_COLORS[(idx + 1) % SPINNER_COLORS.length];
  return lerpColor(a, b, t);
}

// --- Bar animation (preserved, currently unused) ---

const BAR_WIDTH = 10;

/**
 * Grow/shrink bar animation cycling through all 10 gradients.
 * Alternates direction each cycle.
 */
export function startBarAnimation(
  label: string,
  write: (s: string) => void = (s) => process.stderr.write(s),
): { stop: () => void } {
  let frame = 0;
  const cycleFrames = BAR_WIDTH * 2;

  write(HIDE_CURSOR);
  const timer = setInterval(() => {
    const cycle = Math.floor(frame / cycleFrames) % GRADIENTS.length;
    const gradient = GRADIENTS[cycle];
    const phase = frame % cycleFrames;
    let start: number;
    let end: number;

    const reverse = cycle % 2 === 1;
    if (phase < BAR_WIDTH) {
      if (reverse) {
        start = BAR_WIDTH - phase - 1;
        end = BAR_WIDTH;
      } else {
        start = 0;
        end = phase + 1;
      }
    } else {
      if (reverse) {
        start = 0;
        end = BAR_WIDTH - (phase - BAR_WIDTH) - 1;
      } else {
        start = phase - BAR_WIDTH + 1;
        end = BAR_WIDTH;
      }
    }

    const track = [];
    for (let i = 0; i < BAR_WIDTH; i++) {
      if (i >= start && i < end) {
        const [r, g, b] = gradient[i];
        track.push(`${rgb(r, g, b)}▃${RESET}`);
      } else {
        track.push(" ");
      }
    }

    write(`\r  ${DIM}${label}${RESET}  ${track.join("")}  `);
    frame++;
  }, 120);

  return {
    stop() {
      clearInterval(timer);
      write(SHOW_CURSOR);
      write(`\r\x1b[2K`);
    },
  };
}
