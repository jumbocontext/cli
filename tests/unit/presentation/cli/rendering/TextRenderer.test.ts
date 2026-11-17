/**
 * Tests for TextRenderer divider rendering
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { TextRenderer } from "../../../../../src/presentation/cli/rendering/formats/TextRenderer.js";
import { Layout, stripAnsi } from "../../../../../src/presentation/cli/rendering/StyleConfig.js";

describe("TextRenderer.divider", () => {
  let consoleLogSpy: jest.SpyInstance;
  let originalColumnsDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    originalColumnsDescriptor = Object.getOwnPropertyDescriptor(process.stdout, "columns");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalColumnsDescriptor) {
      Object.defineProperty(process.stdout, "columns", originalColumnsDescriptor);
    } else {
      delete (process.stdout as unknown as { columns?: number }).columns;
    }
  });

  it("renders a divider matching the terminal width", () => {
    const renderer = new TextRenderer("normal");
    Object.defineProperty(process.stdout, "columns", {
      configurable: true,
      get: () => 42,
    });

    renderer.divider();

    expect(consoleLogSpy).toHaveBeenCalledTimes(3);
    expect(consoleLogSpy.mock.calls[0][0]).toBe("\n");
    const output = stripAnsi(consoleLogSpy.mock.calls[1][0] as string);
    expect(output).toHaveLength(42);
    expect(/^─+$/.test(output)).toBe(true);
    expect(consoleLogSpy.mock.calls[2][0]).toBe("\n");
  });

  it("falls back to the default width when terminal width is unavailable", () => {
    const renderer = new TextRenderer("normal");
    Object.defineProperty(process.stdout, "columns", {
      configurable: true,
      get: () => undefined,
    });

    renderer.divider();

    expect(consoleLogSpy).toHaveBeenCalledTimes(3);
    expect(consoleLogSpy.mock.calls[0][0]).toBe("\n");
    const output = stripAnsi(consoleLogSpy.mock.calls[1][0] as string);
    expect(output).toHaveLength(Layout.maxWidth);
    expect(/^─+$/.test(output)).toBe(true);
    expect(consoleLogSpy.mock.calls[2][0]).toBe("\n");
  });

  it("suppresses divider output in quiet mode", () => {
    const renderer = new TextRenderer("quiet");
    Object.defineProperty(process.stdout, "columns", {
      configurable: true,
      get: () => 30,
    });

    renderer.divider();

    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
