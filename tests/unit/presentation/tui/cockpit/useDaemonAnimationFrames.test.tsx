import React, { useState } from "react";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { Text } from "ink";
import { render } from "ink-testing-library";
import { act } from "react";
import { useDaemonAnimationFrames } from "../../../../../src/presentation/tui/cockpit/useDaemonAnimationFrames.js";

function AnimationFrameHarness(): React.ReactElement {
  const [reviewerFrameIndex, setReviewerFrameIndex] = useState(0);
  const [refinerFrameIndex, setRefinerFrameIndex] = useState(0);
  const [codifierFrameIndex, setCodifierFrameIndex] = useState(0);

  useDaemonAnimationFrames({
    reviewerFrameDurationMs: 10,
    refinerFrameDurationMs: 20,
    codifierFrameDurationMs: 30,
    setReviewerFrameIndex,
    setRefinerFrameIndex,
    setCodifierFrameIndex,
  });

  return (
    <Text>
      {reviewerFrameIndex}:{refinerFrameIndex}:{codifierFrameIndex}
    </Text>
  );
}

describe("useDaemonAnimationFrames", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("advances reviewer, refiner, and codifier frame indexes on their own timers", () => {
    jest.useFakeTimers();
    const { lastFrame, unmount } = render(<AnimationFrameHarness />);

    expect(lastFrame()).toContain("0:0:0");

    act(() => {
      jest.advanceTimersByTime(30);
    });

    expect(lastFrame()).toContain("3:1:1");
    unmount();
  });
});
