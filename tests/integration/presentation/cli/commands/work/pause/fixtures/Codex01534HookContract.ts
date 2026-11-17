/**
 * Test-only port of the synchronous command output paths verified against Codex
 * rust-v0.153.4, commit 3d2ee51ca2d5db578f328aa75e20aa22c0197c9a:
 * https://github.com/openai/codex/blob/3d2ee51ca2d5db578f328aa75e20aa22c0197c9a/codex-rs/hooks/src/engine/output_parser.rs
 *   parse_json, looks_like_json, parse_pre_compact, parse_session_start
 * https://github.com/openai/codex/blob/3d2ee51ca2d5db578f328aa75e20aa22c0197c9a/codex-rs/hooks/src/events/compact.rs
 *   parse_completed (exit status, empty stdout, invalid JSON-looking stdout)
 * https://github.com/openai/codex/blob/3d2ee51ca2d5db578f328aa75e20aa22c0197c9a/codex-rs/hooks/src/events/session_start.rs
 *   parse_completed (plain stdout becomes context)
 * schema.rs supplies deny_unknown_fields and common field types/defaults.
 *
 * The decisive parser functions and PreCompact wire types were also extracted
 * unchanged into a Rust harness (schema-only derives omitted), compiled with
 * serde 1.0.229/serde_json 1.0.151, and fed compiled Jumbo's piped stdout.
 * `[OK] Work paused` => parse=None, looks_like_json=true; quiet text and empty
 * output => parse=None, looks_like_json=false. Reproduce these checks with the
 * adjacent verifyCodex01534Parser.mjs script. This is a versioned contract fixture,
 * not a replacement for running Codex or a claim about other versions.
 * It covers synchronous exit/stdout/stderr interpretation, not hook execution,
 * trust, timeouts, control-effect permissions, or context spilling.
 */
export class Codex01534HookContract {
  static interpret(
    event: "PreCompact" | "SessionStart",
    result: { stdout: string; stderr: string; status: number | null },
  ): { status: "completed" | "failed" | "stopped"; context: string[]; error?: string } {
    if (result.status !== 0) {
      return {
        status: "failed",
        context: [],
        error: result.stderr.trim() || `hook exited with code ${result.status}`,
      };
    }
    const stdout = result.stdout.trim();
    if (!stdout) return { status: "completed", context: [] };

    let value: unknown;
    try {
      value = JSON.parse(stdout);
    } catch {
      value = undefined;
    }
    if (this.isWireOutput(value, event)) {
      const context: string[] = [];
      if (event === "SessionStart" && this.isObject(value.hookSpecificOutput)) {
        const additionalContext = value.hookSpecificOutput.additionalContext;
        if (typeof additionalContext === "string") context.push(additionalContext);
      }
      return { status: value.continue === false ? "stopped" : "completed", context };
    }
    // Codex checks this AFTER attempting event-specific deserialization.
    if (stdout.startsWith("{") || stdout.startsWith("[")) {
      return { status: "failed", context: [], error: `invalid ${event} hook JSON output` };
    }
    return { status: "completed", context: event === "SessionStart" ? [stdout] : [] };
  }

  private static isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  private static isWireOutput(
    value: unknown,
    event: "PreCompact" | "SessionStart",
  ): value is Record<string, unknown> {
    if (!this.isObject(value)) return false;
    return Object.entries(value).every(([key, field]) => {
      switch (key) {
        case "continue":
        case "suppressOutput":
          return typeof field === "boolean";
        case "stopReason":
        case "systemMessage":
          return field === null || typeof field === "string";
        case "hookSpecificOutput":
          return event === "SessionStart" && (field === null || (
            this.isObject(field) &&
            // The wire deserializer accepts HookEventNameWire; the generated schema
            // documents SessionStart but does not restrict the Rust enum at runtime.
            ["PreToolUse", "PermissionRequest", "PostToolUse", "PreCompact", "PostCompact",
              "SessionStart", "UserPromptSubmit", "SubagentStart", "SubagentStop", "Stop", "Interrupt"
            ].includes(String(field.hookEventName)) &&
            Object.keys(field).every(key => ["hookEventName", "additionalContext"].includes(key)) &&
            (field.additionalContext == null || typeof field.additionalContext === "string")
          ));
        default:
          return false;
      }
    });
  }
}
