/**
 * Daemon Display
 *
 * Base class for work daemon display rendering. Provides the shared
 * layout structure (header, spinners, goal lifecycle messages, shutdown)
 * with configurable labels so each daemon can customize its appearance.
 */

import {
  Colors,
  BrandColors,
  Symbols,
} from "../../../rendering/StyleConfig.js";
import { playGlimmer } from "../../../animations/GlimmerEffect.js";
import { startBrailleSpinner } from "../../../animations/BrailleSpinner.js";

// Raw ANSI codes for the glimmer animation API
const RESET = "\x1b[0m";
const BRIGHT_WHITE = "\x1b[97m";
const [jbR, jbG, jbB] = BrandColors.jumboBlueRaw;
const JUMBO_BLUE = `\x1b[38;2;${jbR};${jbG};${jbB}m`;

export interface DaemonDisplayConfig {
  /** Display title shown in the glimmer header (e.g. "Jumbo Refinery") */
  readonly title: string;
  /** Label for the idle spinner (e.g. "foraging") */
  readonly idleLabel: string;
  /** Label for the active spinner (e.g. "refining") */
  readonly activeLabel: string;
  /** Status word shown on goal completion (e.g. "refined") */
  readonly completeStatus: string;
  /** Daemon name for the shutdown message (e.g. "Refinery") */
  readonly daemonName: string;
}

export interface DaemonRuntimeConfig {
  readonly agentId: string;
  readonly pollIntervalS: number;
  readonly maxRetries: number;
}

export class DaemonDisplay {
  protected readonly displayConfig: DaemonDisplayConfig;
  protected readonly runtimeConfig: DaemonRuntimeConfig;
  protected readonly write: (s: string) => void;

  constructor(
    displayConfig: DaemonDisplayConfig,
    runtimeConfig: DaemonRuntimeConfig,
  ) {
    this.displayConfig = displayConfig;
    this.runtimeConfig = runtimeConfig;
    this.write = (s: string) => process.stderr.write(s);
  }

  /** Render the header block: accent bar + glimmer title + config + divider */
  async renderHeader(): Promise<void> {
    const { agentId, pollIntervalS, maxRetries } = this.runtimeConfig;

    this.line("");
    await playGlimmer(
      this.displayConfig.title,
      `  ${JUMBO_BLUE}│${RESET} `,
      {
        baseColor: JUMBO_BLUE,
        highlightColor: BRIGHT_WHITE,
      },
      this.write,
    );
    this.out("\n");

    this.line(
      `  ${BrandColors.jumboBlue(Symbols.accentBar)} ${Colors.dim(`${agentId} · poll ${pollIntervalS}s · retries ${maxRetries} · Q to stop`)}`,
    );
    this.divider();
  }

  /** Start the idle braille spinner */
  startWaiting(): { stop: () => void } {
    return startBrailleSpinner({
      label: this.displayConfig.idleLabel,
      write: this.write,
    });
  }

  /** Start the active processing braille spinner */
  startProcessing(): { stop: () => void } {
    return startBrailleSpinner({
      label: this.displayConfig.activeLabel,
      write: this.write,
    });
  }

  /** Render goal discovery info */
  renderGoalStart(
    goalId: string,
    objective: string,
    attempt: number,
    maxRetries: number,
  ): void {
    const sid = this.shortId(goalId);
    this.line(
      `  ${Colors.success(Symbols.filledCircle)} ${Colors.bold(sid)}  ${Colors.dim(`attempt ${attempt}/${maxRetries}`)}`,
    );
    this.line(`  ${Colors.dim(this.truncateObjective(objective))}`);
  }

  /** Render goal completion */
  renderGoalComplete(
    goalId: string,
    objective: string,
    attempts: number,
  ): void {
    const sid = this.shortId(goalId);
    this.line(
      `  ${Colors.success(Symbols.check)} ${Colors.success(this.displayConfig.completeStatus)}  ${Colors.bold(sid)}  ${Colors.dim(`${attempts} attempt${attempts !== 1 ? "s" : ""}`)}`,
    );
    this.line(`  ${Colors.dim(this.truncateObjective(objective))}`);
    this.line("");
  }

  /** Render goal exhaustion/skip warning */
  renderGoalSkipped(goalId: string, status: string, maxRetries: number): void {
    const sid = this.shortId(goalId);
    this.line(
      `  ${Colors.warning(Symbols.warning)} ${sid} did not reach '${this.displayConfig.completeStatus}' after ${maxRetries} attempts (status: ${status}). Skipping.`,
    );
    this.line("");
  }

  /** Render unknown agent error */
  renderUnknownAgent(agent: string, supported: readonly string[]): void {
    this.line(
      `${Colors.error(Symbols.cross)} Unknown agent '${agent}'. Supported: ${supported.join(", ")}`,
    );
  }

  /** Render shutdown message */
  renderShutdown(): void {
    this.line("");
    this.line(
      `  ${Colors.dim(`${Symbols.arrow} ${this.displayConfig.daemonName} stopped.`)}`,
    );
  }

  // --- Protected helpers ---

  protected out(msg: string): void {
    this.write(msg);
  }

  protected line(msg: string): void {
    this.write(`${msg}\n`);
  }

  protected divider(): void {
    this.line(`  ${Colors.dim("─".repeat(50))}`);
  }

  protected truncateObjective(text: string, max = 60): string {
    if (text.length <= max) return text;
    return text.slice(0, max - 3) + "...";
  }

  protected shortId(goalId: string): string {
    return goalId.length > 12 ? goalId.slice(0, 8) : goalId;
  }
}
