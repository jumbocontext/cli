import { describe, expect, it } from "@jest/globals";
import { AnimatedBillboardPhase } from "../../../../../src/presentation/tui/billboard/AnimatedBillboardPhase.js";

describe("AnimatedBillboardPhase", () => {
  it("names the full billboard animation lifecycle", () => {
    expect(Object.values(AnimatedBillboardPhase)).toHaveLength(4);
    expect(new Set(Object.values(AnimatedBillboardPhase)).size).toBe(4);
  });
});
