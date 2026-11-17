import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { MemoryEntityScreen } from "../../../../../../src/presentation/tui/memory/entity-browser/MemoryEntityScreen.js";
import type { DecisionEntityRow } from "../../../../../../src/presentation/tui/memory/entity-browser/MemoryEntityShapes.js";

const UP_ARROW = "\x1B[A";
const DOWN_ARROW = "\x1B[B";
const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
const DECISION_ROWS: readonly DecisionEntityRow[] = [
  {
    id: "11111111-aaaa-4aaa-8aaa-111111111111",
    title: "First decision",
    context: "A test row",
    rationale: "Keeps the primitive test local",
    alternatives: [],
    consequences: "",
  },
  {
    id: "22222222-bbbb-4bbb-8bbb-222222222222",
    title: "Second decision",
    context: "Another test row",
    rationale: "Exercises selection",
    alternatives: [],
    consequences: "",
  },
  {
    id: "33333333-cccc-4ccc-8ccc-333333333333",
    title: "Third decision",
    context: "A final test row",
    rationale: "Exercises wraparound",
    alternatives: [],
    consequences: "",
  },
];

function renderScreen(props?: {
  readonly rows?: readonly DecisionEntityRow[];
  readonly loading?: boolean;
  readonly error?: Error | null;
  readonly shortcutsEnabled?: boolean;
}) {
  return render(
    <MemoryEntityScreen
      entityType="decision"
      title="Decisions"
      rows={props?.rows ?? DECISION_ROWS}
      loading={props?.loading}
      error={props?.error}
      shortcutsEnabled={props?.shortcutsEnabled}
    />,
  );
}

describe("MemoryEntityScreen", () => {
  it("renders the first row's detail on mount", async () => {
    const { lastFrame, unmount } = renderScreen();
    await tick();
    const frame = lastFrame() ?? "";

    expect(frame).toContain(DECISION_ROWS[0].id);
    expect(frame).not.toContain(DECISION_ROWS[1].id);
    unmount();
  });

  it("shows the focused position as a current/total indicator", async () => {
    const { lastFrame, stdin, unmount } = renderScreen();
    await tick();

    expect(lastFrame() ?? "").toContain(`1/${DECISION_ROWS.length}`);

    stdin.write(DOWN_ARROW);
    await tick();

    expect(lastFrame() ?? "").toContain(`2/${DECISION_ROWS.length}`);
    unmount();
  });

  it("moves the focused detail with arrow-key scrolling", async () => {
    const { lastFrame, stdin, unmount } = renderScreen();

    stdin.write(DOWN_ARROW);
    await tick();

    const frame = lastFrame() ?? "";
    expect(frame).toContain(DECISION_ROWS[1].id);
    expect(frame).not.toContain(DECISION_ROWS[0].id);
    unmount();
  });

  it("wraps focus from the first row to the last row", async () => {
    const { lastFrame, stdin, unmount } = renderScreen();

    stdin.write(UP_ARROW);
    await tick();

    expect(lastFrame() ?? "").toContain(
      DECISION_ROWS[DECISION_ROWS.length - 1].id,
    );
    unmount();
  });

  it("wraps focus from the last row back to the first row", async () => {
    const { lastFrame, stdin, unmount } = renderScreen();

    for (let press = 0; press < DECISION_ROWS.length; press += 1) {
      stdin.write(DOWN_ARROW);
      await tick();
    }

    expect(lastFrame() ?? "").toContain(DECISION_ROWS[0].id);
    unmount();
  });

  it("ignores scrolling when shortcuts are disabled", async () => {
    const { lastFrame, stdin, unmount } = renderScreen({
      shortcutsEnabled: false,
    });
    await tick();
    const beforeFrame = lastFrame() ?? "";

    stdin.write(DOWN_ARROW);
    await tick();

    expect(lastFrame() ?? "").toEqual(beforeFrame);
    unmount();
  });

  it("no longer reacts to the removed event-replay hotkeys", async () => {
    const { lastFrame, stdin, unmount } = renderScreen();
    await tick();
    const beforeFrame = lastFrame() ?? "";

    stdin.write("[");
    await tick();
    stdin.write("]");
    await tick();

    expect(lastFrame() ?? "").toEqual(beforeFrame);
    unmount();
  });

  it("renders a read error in the detail pane region", async () => {
    const readError = new Error("read failure from the state reader");
    const { lastFrame, unmount } = renderScreen({ error: readError });
    await tick();
    const frame = lastFrame() ?? "";

    expect(frame).toContain(readError.message);
    expect(frame).not.toContain(DECISION_ROWS[0].id);
    unmount();
  });

  it("renders without rows while loading", async () => {
    const { lastFrame, unmount } = renderScreen({ rows: [], loading: true });
    await tick();
    const frame = lastFrame() ?? "";

    expect(frame).not.toContain(DECISION_ROWS[0].id);
    expect(frame.length).toBeGreaterThan(0);
    unmount();
  });
});
