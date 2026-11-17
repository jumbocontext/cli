import { describe, expect, it } from "@jest/globals";
import { AnimatedBillboardWordmarkArt } from "../../../../../src/presentation/tui/billboard/AnimatedBillboardWordmarkArt.js";

describe("AnimatedBillboardWordmarkArt", () => {
  it("defines non-empty static wordmark rows", () => {
    expect(AnimatedBillboardWordmarkArt.length).toBeGreaterThan(0);
    expect(
      AnimatedBillboardWordmarkArt.every((line) => line.trim().length > 0),
    ).toBe(true);
  });
});
