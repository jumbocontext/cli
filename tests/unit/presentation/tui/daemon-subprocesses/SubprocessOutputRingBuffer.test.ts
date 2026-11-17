import { describe, expect, it } from "@jest/globals";
import { SubprocessOutputRingBuffer } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessOutputRingBuffer.js";

describe("SubprocessOutputRingBuffer", () => {
  it("splits output into non-empty retained lines and keeps only the newest entries", () => {
    const buffer = new SubprocessOutputRingBuffer();
    const lines: string[] = [];

    const appended = buffer.appendLines(
      lines,
      Array.from({ length: 30 }, (_, index) => `line ${index}`).join("\n"),
    );

    expect(appended).toHaveLength(30);
    expect(lines).toHaveLength(25);
    expect(lines[0]).toBe("line 5");
    expect(lines[24]).toBe("line 29");
  });

  it("caps chunks and retained line values at their transport boundaries", () => {
    const buffer = new SubprocessOutputRingBuffer();
    const lines: string[] = [];
    const oversized = `${"x".repeat(20_000)}tail`;

    expect(buffer.limitChunk(oversized)).toHaveLength(16_384);

    buffer.appendLines(lines, `${oversized}\n`);

    expect(lines[0]).toHaveLength(2_048);
    expect(lines[0]).toContain("tail");
    expect(buffer.limitTextField(oversized)).toHaveLength(2_048);
  });
});
