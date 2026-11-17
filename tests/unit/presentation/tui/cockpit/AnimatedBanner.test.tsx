import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render } from "ink-testing-library";
import { AnimatedBanner } from "../../../../../src/presentation/tui/animated-banner/Banner.js";

describe("AnimatedBanner", () => {
  it("renders a non-empty frame on mount", () => {
    const { lastFrame, unmount } = render(<AnimatedBanner onComplete={jest.fn()} />);
    expect((lastFrame() ?? "").trim().length).toBeGreaterThan(0);
    unmount();
  });

  it("renders without crashing when version and projectName are provided", () => {
    const { lastFrame, unmount } = render(
      <AnimatedBanner onComplete={jest.fn()} version="1.0.0" projectName="test-project" />,
    );
    expect((lastFrame() ?? "").trim().length).toBeGreaterThan(0);
    unmount();
  });
});
