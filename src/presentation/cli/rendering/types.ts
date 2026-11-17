/**
 * Output format types for CLI rendering
 */
export const OUTPUT_FORMATS = ["text", "json", "yaml", "ndjson"] as const;

export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

/**
 * Keyed references to the canonical output-format values, so call sites
 * never repeat format strings as magic literals.
 */
export const OUTPUT_FORMAT = {
  text: "text",
  json: "json",
  yaml: "yaml",
  ndjson: "ndjson",
} as const satisfies Record<OutputFormat, string>;

/**
 * Verbosity levels for text output
 */
export type VerbosityLevel = "quiet" | "normal" | "verbose";

/**
 * Renderer configuration
 */
export interface RendererConfig {
  /** Output format (auto-detected if not specified) */
  format?: OutputFormat;

  /** Verbosity level (default: normal) */
  verbosity?: VerbosityLevel;

  /** Force human-friendly output regardless of TTY (for onboarding) */
  forceHuman?: boolean;
}

/**
 * Data to be rendered with optional metadata
 */
export interface RenderData {
  [key: string]: unknown;
}

/**
 * Base interface for all format renderers
 */
export interface IFormatRenderer {
  /**
   * Render a success message with optional data
   */
  success(message: string, data?: RenderData): void;

  /**
   * Render an error message
   */
  error(message: string, err?: Error | string): void;

  /**
   * Render an info message
   */
  info(message: string, data?: RenderData): void;

  /**
   * Render raw data without a message wrapper
   */
  data(data: RenderData): void;

  /**
   * Render a section header (text mode only, ignored in structured formats)
   */
  section(title: string): void;

  /**
   * Render a headline (text mode only, ignored in structured formats)
   */
  headline(title: string): void;

  /**
   * Render the banner (text mode only, ignored in structured formats)
   */
  banner(lines: string[]): void;

  /**
   * Render a horizontal divider across the current viewport (text mode only, ignored in structured formats)
   */
  divider(): void;
}
