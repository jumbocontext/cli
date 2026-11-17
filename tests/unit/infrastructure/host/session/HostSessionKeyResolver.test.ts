import { HostSessionKeyResolver } from "../../../../../src/infrastructure/host/session/HostSessionKeyResolver";

describe("HostSessionKeyResolver", () => {
  let resolver: HostSessionKeyResolver;

  beforeEach(() => {
    resolver = new HostSessionKeyResolver();
  });

  describe("resolve", () => {
    it("returns a result with key and parts", () => {
      const result = resolver.resolve();

      expect(result).toHaveProperty("key");
      expect(result).toHaveProperty("parts");
      expect(typeof result.key).toBe("string");
      expect(Array.isArray(result.parts)).toBe(true);
    });

    it("returns a stable key for same environment", () => {
      const result1 = resolver.resolve();
      const result2 = resolver.resolve();

      expect(result1.key).toBe(result2.key);
    });

    it("returns key as SHA-256 hash (64 hex characters)", () => {
      const result = resolver.resolve();

      expect(result.key).toMatch(/^[a-f0-9]{64}$/);
    });

    it("includes at least one part with source and value", () => {
      const result = resolver.resolve();

      expect(result.parts.length).toBeGreaterThan(0);
      expect(result.parts[0]).toHaveProperty("source");
      expect(result.parts[0]).toHaveProperty("value");
    });
  });

  describe("environment variable detection", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("uses WT_SESSION when available", () => {
      process.env.WT_SESSION = "test-wt-session-id";

      const result = resolver.resolve();

      expect(result.parts).toContainEqual({
        source: "WT_SESSION",
        value: "test-wt-session-id",
      });
    });

    it("uses VSCODE_PID when available", () => {
      process.env.VSCODE_PID = "12345";

      const result = resolver.resolve();

      expect(result.parts).toContainEqual({
        source: "VSCODE_PID",
        value: "12345",
      });
    });

    it("prefers VSCODE_IPC_HOOK_CLI over VSCODE_PID", () => {
      process.env.VSCODE_IPC_HOOK_CLI = "/tmp/vscode-ipc-hook";
      process.env.VSCODE_PID = "12345";

      const result = resolver.resolve();

      expect(result.parts).toContainEqual({
        source: "VSCODE_IPC_HOOK_CLI",
        value: "/tmp/vscode-ipc-hook",
      });
      expect(result.parts).not.toContainEqual(
        expect.objectContaining({ source: "VSCODE_PID" })
      );
    });

    it("uses ITERM_SESSION_ID when available", () => {
      // Clear higher-priority env vars
      delete process.env.WT_SESSION;
      delete process.env.VSCODE_IPC_HOOK_CLI;
      delete process.env.VSCODE_PID;
      process.env.ITERM_SESSION_ID = "w0t0p0:session-guid";

      const result = resolver.resolve();

      expect(result.parts).toContainEqual({
        source: "ITERM_SESSION_ID",
        value: "w0t0p0:session-guid",
      });
    });

    it("uses TERM_SESSION_ID when available", () => {
      // Clear higher-priority env vars
      delete process.env.WT_SESSION;
      delete process.env.VSCODE_IPC_HOOK_CLI;
      delete process.env.VSCODE_PID;
      delete process.env.ITERM_SESSION_ID;
      process.env.TERM_SESSION_ID = "term-session-123";

      const result = resolver.resolve();

      expect(result.parts).toContainEqual({
        source: "TERM_SESSION_ID",
        value: "term-session-123",
      });
    });

    it("falls back to PPID-based resolution when no env vars present", () => {
      // Clear all session-related env vars
      delete process.env.WT_SESSION;
      delete process.env.VSCODE_IPC_HOOK_CLI;
      delete process.env.VSCODE_PID;
      delete process.env.ITERM_SESSION_ID;
      delete process.env.TERM_SESSION_ID;
      delete process.env.TERM_PROGRAM;
      delete process.env.TERM_PROGRAM_VERSION;

      const result = resolver.resolve();

      expect(result.parts).toContainEqual(
        expect.objectContaining({ source: "PPID" })
      );
      expect(result.parts).toContainEqual(
        expect.objectContaining({ source: "USER" })
      );
      expect(result.parts).toContainEqual(
        expect.objectContaining({ source: "HOST" })
      );
    });
  });
});
