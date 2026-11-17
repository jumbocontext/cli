import type React from "react";
import { useEffect } from "react";
import {
  CODIFIER_FRAME_COUNT,
  REFINER_FRAME_COUNT,
  REVIEWER_FRAME_COUNT,
} from "./CockpitDaemonFrames.js";

interface DaemonAnimationFrameSetters {
  readonly setReviewerFrameIndex: React.Dispatch<React.SetStateAction<number>>;
  readonly setRefinerFrameIndex: React.Dispatch<React.SetStateAction<number>>;
  readonly setCodifierFrameIndex: React.Dispatch<React.SetStateAction<number>>;
}

interface DaemonAnimationFrameDurations {
  readonly reviewerFrameDurationMs: number;
  readonly refinerFrameDurationMs: number;
  readonly codifierFrameDurationMs: number;
}

export function useDaemonAnimationFrames({
  reviewerFrameDurationMs,
  refinerFrameDurationMs,
  codifierFrameDurationMs,
  setReviewerFrameIndex,
  setRefinerFrameIndex,
  setCodifierFrameIndex,
}: DaemonAnimationFrameDurations & DaemonAnimationFrameSetters): void {
  useEffect(() => {
    if (reviewerFrameDurationMs <= 0) return;

    const timer = setInterval(() => {
      setReviewerFrameIndex(
        (previousFrameIndex) => (previousFrameIndex + 1) % REVIEWER_FRAME_COUNT,
      );
    }, reviewerFrameDurationMs);

    return () => clearInterval(timer);
  }, [reviewerFrameDurationMs, setReviewerFrameIndex]);

  useEffect(() => {
    if (REFINER_FRAME_COUNT <= 1 || refinerFrameDurationMs <= 0) return;

    const timer = setInterval(() => {
      setRefinerFrameIndex(
        (previousFrameIndex) => (previousFrameIndex + 1) % REFINER_FRAME_COUNT,
      );
    }, refinerFrameDurationMs);

    return () => clearInterval(timer);
  }, [refinerFrameDurationMs, setRefinerFrameIndex]);

  useEffect(() => {
    if (codifierFrameDurationMs <= 0) return;

    const timer = setInterval(() => {
      setCodifierFrameIndex(
        (previousFrameIndex) => (previousFrameIndex + 1) % CODIFIER_FRAME_COUNT,
      );
    }, codifierFrameDurationMs);

    return () => clearInterval(timer);
  }, [codifierFrameDurationMs, setCodifierFrameIndex]);
}
