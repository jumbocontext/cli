const OUTPUT_RING_BUFFER_SIZE = 25;
const OUTPUT_CHUNK_MAX_LENGTH = 16_384;
const OUTPUT_LINE_MAX_LENGTH = 2_048;

export class SubprocessOutputRingBuffer {
  limitChunk(value: string): string {
    return this.limitTextTail(value, OUTPUT_CHUNK_MAX_LENGTH);
  }

  appendLines(buffer: string[], value: string): string[] {
    const lines = value.split(/\r?\n/).filter((line) => line.length > 0);
    buffer.push(
      ...lines.map((line) => this.limitTextTail(line, OUTPUT_LINE_MAX_LENGTH)),
    );
    while (buffer.length > OUTPUT_RING_BUFFER_SIZE) {
      buffer.shift();
    }
    return lines;
  }

  limitTextField(value: string): string {
    return this.limitTextTail(value, OUTPUT_LINE_MAX_LENGTH);
  }

  private limitTextTail(value: string, maxLength: number): string {
    return value.length > maxLength ? value.slice(-maxLength) : value;
  }
}
