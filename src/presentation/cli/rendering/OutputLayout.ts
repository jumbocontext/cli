/**
 * OutputLayout — Shared design tokens and palette-aware layout helpers.
 *
 * Extracted from GoalShowOutputBuilder to provide a single source of truth
 * for the accent bar layout, column grid, and brand-colored helpers used
 * across all OutputBuilder implementations.
 *
 * Layout grid (x-axis positioning):
 *   x=0   left margin
 *   x=2   EDGE (2 leading spaces)
 *   x=3   accent bar position (Symbols.accentBar)
 *   x=7   content column (EDGE + CONTENT_PAD)
 *   x=11  indent column (EDGE + INDENT_PAD)
 *   x=90  right boundary (DIVIDER_WIDTH)
 */

import { Colors, BrandColors, Symbols, wordWrap } from "./StyleConfig.js";

// ── Layout grid constants ──

export const EDGE = "  "; // 2 spaces
export const HEADING_PAD = "   "; // bar(1) + space(1) + 1 extra
export const CONTENT_PAD = "     "; // 5 spaces from EDGE → content column
export const INDENT_PAD = "         "; // 9 spaces from EDGE → indent column
export const DIVIDER_WIDTH = 90;
export const WRAP_CONTENT = 83; // max chars at content column (90 - 7 leading)
export const WRAP_INDENT = 81; // max chars at indent column (90 - 9 leading)

// ── Palette-aware helpers ──

/** Styled accent bar in brand blue. */
export function bar(): string {
  return BrandColors.jumboBlue(Symbols.accentBar);
}

/** Full-width dim horizontal divider. */
export function divider(): string {
  return `${EDGE}${Colors.dim("─".repeat(DIVIDER_WIDTH))}`;
}

/** Section heading: accent bar + bold brand-blue title. */
export function heading(title: string): string {
  return `${EDGE}${bar()} ${Colors.bold(BrandColors.jumboBlue(title))}`;
}

/** Key-value metadata field at the content column. */
export function metaField(
  label: string,
  value: string,
  labelWidth = 9,
): string {
  const padded = (label + ":").padEnd(labelWidth);
  return `${EDGE}${CONTENT_PAD}${Colors.muted(padded)}${value}`;
}

/** Content line at the content column. */
export function contentLine(text: string): string {
  return `${EDGE}${CONTENT_PAD}${text}`;
}

/** Indented content line at the indent column. */
export function indentLine(text: string): string {
  return `${EDGE}${INDENT_PAD}${text}`;
}

/** Word-wrap text at the content column width, styled with Colors.primary. */
export function wrapContent(text: string): string[] {
  return wordWrap(text, WRAP_CONTENT, 0).map(
    (line) => `${EDGE}${CONTENT_PAD}${Colors.primary(line.trimStart())}`,
  );
}

/** Bullet + word-wrapped continuation at the indent column. */
export function wrapBulletContinuation(text: string): string[] {
  const lines = wordWrap(text, WRAP_INDENT, 0);
  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    if (i === 0) {
      result.push(
        `${EDGE}${CONTENT_PAD}${Colors.dim("·")} ${Colors.primary(trimmed)}`,
      );
    } else {
      result.push(`${EDGE}${INDENT_PAD}${Colors.primary(trimmed)}`);
    }
  }
  return result;
}
