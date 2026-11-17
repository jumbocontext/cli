/**
 * Frame-Based Terminal Animator
 *
 * Displays ASCII art frames in sequence for smooth terminal animations.
 * Optimized for speed - uses cursor movement instead of clearing screen.
 */

/**
 * Animation configuration
 */
export interface AnimationConfig {
  /** Array of frames to display (each frame is an array of lines) */
  frames: string[][];

  /** Delay between frames in milliseconds */
  frameDelay: number;

  /** Clear screen before starting animation */
  clearScreen?: boolean;

  /** Move cursor to home position after animation */
  resetCursor?: boolean;
}

/**
 * Sleep utility for frame delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get the height of a frame (number of lines)
 */
function getFrameHeight(frame: string[]): number {
  return frame.length;
}

/**
 * ANSI escape codes for terminal control
 */
const ANSI = {
  // Cursor control
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",
  saveCursor: "\x1b7",
  restoreCursor: "\x1b8",
  clearScreen: "\x1bc",

  // Move cursor up N lines
  cursorUp: (n: number) => `\x1b[${n}A`,

  // Move cursor to start of line
  cursorToStart: "\x1b[0G",

  // Clear from cursor to end of screen
  clearToEnd: "\x1b[J",
};

/**
 * Play an animation frame-by-frame
 */
export async function playAnimation(config: AnimationConfig): Promise<void> {
  // Only animate in TTY mode
  if (!process.stdout.isTTY) {
    // Non-TTY: just show the last frame
    const lastFrame = config.frames[config.frames.length - 1];
    console.log(lastFrame.join("\n"));
    return;
  }

  const {
    frames,
    frameDelay,
    clearScreen = false,
    resetCursor = true,
  } = config;

  if (frames.length === 0) {
    return;
  }

  // Hide cursor during animation
  process.stdout.write(ANSI.hideCursor);

  try {
    // Clear screen if requested
    if (clearScreen) {
      process.stdout.write(ANSI.clearScreen);
    }

    // Play each frame
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const frameHeight = getFrameHeight(frame);

      // Move to start of line and clear to end (prevents cursor artifacts)
      process.stdout.write(ANSI.cursorToStart + ANSI.clearToEnd);

      // Display the frame (using write instead of log for more control)
      process.stdout.write(frame.join("\n"));

      // If not the last frame, move cursor back up to overwrite
      if (i < frames.length - 1) {
        await sleep(frameDelay);

        // Move cursor up to start of frame (frameHeight lines up)
        process.stdout.write(ANSI.cursorUp(frameHeight));
      }
    }

    // Final delay to show last frame
    await sleep(frameDelay);
  } finally {
    // Always show cursor again
    process.stdout.write(ANSI.showCursor);

    if (resetCursor) {
      process.stdout.write("\n"); // Add newline after animation
    }
  }
}

/**
 * Create a simple fade-in effect by gradually revealing lines
 */
export function createFadeInFrames(
  lines: string[],
  stepsPerLine = 2,
): string[][] {
  const frames: string[][] = [];
  const totalLines = lines.length;

  // Reveal lines gradually
  for (let i = 0; i <= totalLines; i++) {
    const visibleLines = lines.slice(0, i);

    // Pad with empty lines to maintain frame height
    const paddedFrame = [...Array(totalLines - i).fill(""), ...visibleLines];

    frames.push(paddedFrame);

    // Add intermediate frames for smoother animation
    if (i < totalLines && stepsPerLine > 1) {
      for (let j = 1; j < stepsPerLine; j++) {
        frames.push(paddedFrame); // Repeat frame for slower reveal
      }
    }
  }

  return frames;
}

/**
 * Create a slide-in effect from top
 */
export function createSlideInFrames(lines: string[], steps = 10): string[][] {
  const frames: string[][] = [];
  const totalLines = lines.length;

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const visibleCount = Math.floor(totalLines * progress);

    const visibleLines = lines.slice(0, visibleCount);
    const paddedFrame = [
      ...Array(totalLines - visibleCount).fill(""),
      ...visibleLines,
    ];

    frames.push(paddedFrame);
  }

  return frames;
}

/**
 * Create a simple blink effect (show/hide)
 */
export function createBlinkFrames(lines: string[], blinkCount = 2): string[][] {
  const frames: string[][] = [];
  const emptyFrame = Array(lines.length).fill("");

  for (let i = 0; i < blinkCount; i++) {
    frames.push(emptyFrame);
    frames.push(lines);
  }

  // End with visible
  frames.push(lines);

  return frames;
}

/**
 * RGB color type
 */
interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Interpolate between two RGB colors
 */
function lerpColor(color1: RGB, color2: RGB, progress: number): RGB {
  return {
    r: Math.round(color1.r + (color2.r - color1.r) * progress),
    g: Math.round(color1.g + (color2.g - color1.g) * progress),
    b: Math.round(color1.b + (color2.b - color1.b) * progress),
  };
}

/**
 * Get color from a gradient path at a specific progress (0-1)
 */
function getColorFromGradient(anchorColors: RGB[], progress: number): RGB {
  if (anchorColors.length === 0) return { r: 255, g: 255, b: 255 };
  if (anchorColors.length === 1) return anchorColors[0];

  // Clamp progress to 0-1
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Calculate which segment we're in
  const segmentCount = anchorColors.length - 1;
  const segmentLength = 1 / segmentCount;
  const segmentIndex = Math.min(
    Math.floor(clampedProgress / segmentLength),
    segmentCount - 1,
  );

  // Calculate progress within this segment (0-1)
  const segmentProgress =
    (clampedProgress - segmentIndex * segmentLength) / segmentLength;

  // Interpolate between the two anchor colors
  return lerpColor(
    anchorColors[segmentIndex],
    anchorColors[segmentIndex + 1],
    segmentProgress,
  );
}

/**
 * Easing function for smooth animation (ease-in-out)
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Create elephant walk animation frames
 * The elephant moves from left to right and back, changing colors smoothly
 */
export function createElephantWalkFrames(
  elephantLines: string[],
  anchorColors: RGB[],
  terminalWidth: number,
  options: {
    totalFrames?: number;
    useEasing?: boolean;
  } = {},
): string[][] {
  const { totalFrames = 60, useEasing = true } = options;

  // Calculate elephant width (plain text without ANSI)
  const elephantWidth = 30; // Known width of the ASCII art
  const maxOffset = Math.max(0, terminalWidth - elephantWidth);

  const frames: string[][] = [];

  // Generate frames for round trip (0 -> 1 -> 0)
  for (let i = 0; i < totalFrames; i++) {
    // Calculate progress for round trip
    const rawProgress = i / (totalFrames - 1);

    // Create bounce effect: 0 -> 1 -> 0
    const bounceProgress =
      rawProgress < 0.5
        ? rawProgress * 2 // First half: 0 -> 1
        : 2 - rawProgress * 2; // Second half: 1 -> 0

    // Apply easing for smoother motion
    const easedProgress = useEasing
      ? easeInOutCubic(bounceProgress)
      : bounceProgress;

    // Calculate position
    const xOffset = Math.floor(easedProgress * maxOffset);

    // Color follows the position
    const colorProgress =
      rawProgress < 0.5
        ? rawProgress * 2 // First half: 0 -> 1 (blue to red)
        : 2 - rawProgress * 2; // Second half: 1 -> 0 (red to blue)
    const color = getColorFromGradient(anchorColors, colorProgress);

    // Create frame - brute force approach: manually build each line with spaces + colored art
    const frame = elephantLines.map((line) => {
      // Add padding spaces first
      const padding = " ".repeat(xOffset);
      // Then add the colored line (using background color so it's solid)
      return (
        padding + `\x1b[48;2;${color.r};${color.g};${color.b}m${line}\x1b[0m`
      );
    });

    frames.push(frame);
  }

  return frames;
}
