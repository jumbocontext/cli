import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { SessionView } from "../../../../../application/context/sessions/SessionView.js";
import {
  Colors,
  BrandColors,
  Symbols,
} from "../../../rendering/StyleConfig.js";
import {
  heading,
  contentLine,
  metaField,
} from "../../../rendering/OutputLayout.js";

export class SessionListOutputBuilder {
  private builder = new TerminalOutputBuilder();

  build(sessions: SessionView[], filter?: string): TerminalOutput {
    this.builder.reset();
    const filterLabel = filter && filter !== "all" ? ` (${filter})` : "";
    const lines: string[] = [];

    lines.push("");
    lines.push(heading(`Session History${filterLabel} (${sessions.length})`));

    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      if (i > 0) lines.push("");
      const statusTag = `[${s.status.toUpperCase()}]`;
      lines.push(
        contentLine(
          `${Colors.bold(statusTag)} ${BrandColors.accentCyan(s.sessionId)}`,
        ),
      );
      if (s.focus) {
        lines.push(metaField("Focus", Colors.primary(s.focus), 9));
      }
      lines.push(metaField("Started", Colors.muted(s.startedAt), 9));
      if (s.endedAt) {
        lines.push(metaField("Ended", Colors.muted(s.endedAt), 9));
      }
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(
    sessions: SessionView[],
    filter?: string,
  ): TerminalOutput {
    this.builder.reset();
    this.builder.addData({
      count: sessions.length,
      filter: filter ?? "all",
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        status: s.status,
        focus: s.focus,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to list sessions")}`,
    );
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
