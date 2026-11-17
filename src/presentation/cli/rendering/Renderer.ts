/**
 * Centralized Rendering Singleton
 *
 * Provides a single point of control for all CLI output.
 * Supports multiple formats (text/json/yaml/ndjson) and verbosity levels.
 */

import {
  IFormatRenderer,
  OutputFormat,
  OUTPUT_FORMAT,
  OUTPUT_FORMATS,
  RendererConfig,
  RenderData,
  VerbosityLevel,
} from "./types.js";
import { TextRenderer } from "./formats/TextRenderer.js";
import { JsonRenderer } from "./formats/JsonRenderer.js";
import { YamlRenderer } from "./formats/YamlRenderer.js";
import { NdjsonRenderer } from "./formats/NdjsonRenderer.js";

export class Renderer {
  private static instance: Renderer | null = null;
  private renderer: IFormatRenderer;
  private config: Required<RendererConfig>;

  private constructor(config: RendererConfig = {}) {
    // Detect format if not specified
    const format = config.format || this.detectFormat();
    const verbosity = config.verbosity || "normal";
    const forceHuman = config.forceHuman || false;

    this.config = { format, verbosity, forceHuman };
    this.renderer = this.createRenderer(format, verbosity, forceHuman);
  }

  /**
   * Get or create the singleton instance
   */
  static getInstance(): Renderer {
    if (!Renderer.instance) {
      Renderer.instance = new Renderer();
    }
    return Renderer.instance;
  }

  /**
   * Configure the renderer (call once at CLI startup)
   */
  static configure(config: RendererConfig): Renderer {
    Renderer.instance = new Renderer(config);
    return Renderer.instance;
  }

  /**
   * Reset the singleton (primarily for testing)
   */
  static reset(): void {
    Renderer.instance = null;
  }

  /**
   * Auto-detect output format based on TTY
   */
  private detectFormat(): OutputFormat {
    // Check environment variable first
    const envFormat = process.env.JUMBO_FORMAT?.toLowerCase();
    if (envFormat && this.isValidFormat(envFormat)) {
      return envFormat as OutputFormat;
    }

    // Auto-detect: TTY = text, pipe = json
    return process.stdout.isTTY ? OUTPUT_FORMAT.text : OUTPUT_FORMAT.json;
  }

  private isValidFormat(format: string): boolean {
    return (OUTPUT_FORMATS as readonly string[]).includes(format);
  }

  /**
   * Create the appropriate format renderer
   */
  private createRenderer(
    format: OutputFormat,
    verbosity: VerbosityLevel,
    forceHuman: boolean,
  ): IFormatRenderer {
    // Onboarding always uses friendly text mode
    if (forceHuman) {
      return new TextRenderer("verbose");
    }

    switch (format) {
      case OUTPUT_FORMAT.text:
        return new TextRenderer(verbosity);
      case OUTPUT_FORMAT.json:
        return new JsonRenderer();
      case OUTPUT_FORMAT.yaml:
        return new YamlRenderer();
      case OUTPUT_FORMAT.ndjson:
        return new NdjsonRenderer();
      default:
        return new TextRenderer(verbosity);
    }
  }

  // Delegate all rendering methods to the active format renderer

  success(message: string, data?: RenderData): void {
    this.renderer.success(message, data);
  }

  error(message: string, err?: Error | string): void {
    this.renderer.error(message, err);
  }

  info(message: string, data?: RenderData): void {
    this.renderer.info(message, data);
  }

  data(data: RenderData): void {
    this.renderer.data(data);
  }

  section(title: string): void {
    this.renderer.section(title);
  }

  headline(title: string): void {
    this.renderer.headline(title);
  }

  banner(lines: string[]): void {
    this.renderer.banner(lines);
  }

  divider(): void {
    this.renderer.divider();
  }

  /**
   * Get current configuration (for debugging/testing)
   */
  getConfig(): Required<RendererConfig> {
    return { ...this.config };
  }
}
