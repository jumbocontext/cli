import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render } from "ink-testing-library";
import stripAnsi from "strip-ansi";
import { Tumbler } from "../../../../../src/presentation/tui/ui-primitives/Tumbler.js";
import { TumblerCopy } from "../../../../../src/presentation/tui/ui-primitives/TumblerConstants.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
const plainFrame = (lastFrame: () => string | undefined) =>
  stripAnsi(lastFrame() ?? "");

describe("Tumbler", () => {
  const items = [
    { key: "minus-two", value: "Item -2" },
    { key: "minus-one", value: "Item -1" },
    { key: "zero", value: "Item 0" },
    { key: "one", value: "Item 1" },
    { key: "two", value: "Item 2" },
  ];

  it("renders the focused item in the center row", () => {
    const { lastFrame } = render(
      <Tumbler items={items} initialFocusedKey="zero" />,
    );

    expect(plainFrame(lastFrame)).toContain(
      "  Item -2\n  Item -1\n▸ Item 0\n  Item 1\n  Item 2",
    );
  });

  it("rotates down to the next item while keeping focus centered", async () => {
    const { lastFrame, stdin } = render(
      <Tumbler items={items} initialFocusedKey="zero" />,
    );

    stdin.write("\x1B[B");
    await tick();

    expect(plainFrame(lastFrame)).toContain(
      "  Item -1\n  Item 0\n▸ Item 1\n  Item 2\n  Item -2",
    );
  });

  it("rotates up to the previous item while keeping focus centered", async () => {
    const { lastFrame, stdin } = render(
      <Tumbler items={items} initialFocusedKey="zero" />,
    );

    stdin.write("\x1B[A");
    await tick();

    expect(plainFrame(lastFrame)).toContain(
      "  Item 2\n  Item -2\n▸ Item -1\n  Item 0\n  Item 1",
    );
  });

  it("wraps from the last item to the first item", async () => {
    const { lastFrame, stdin } = render(
      <Tumbler items={items} initialFocusedKey="two" />,
    );

    stdin.write("\x1B[B");
    await tick();

    expect(plainFrame(lastFrame)).toContain("▸ Item -2");
  });

  it("wraps from the first item to the last item", async () => {
    const { lastFrame, stdin } = render(
      <Tumbler items={items} initialFocusedKey="minus-two" />,
    );

    stdin.write("\x1B[A");
    await tick();

    expect(plainFrame(lastFrame)).toContain("▸ Item 2");
  });

  it("notifies consumers when the focused item changes", async () => {
    const onFocusedItemChange = jest.fn();
    const { stdin } = render(
      <Tumbler
        items={items}
        initialFocusedKey="zero"
        onFocusedItemChange={onFocusedItemChange}
      />,
    );

    stdin.write("\x1B[B");
    await tick();

    expect(onFocusedItemChange).toHaveBeenLastCalledWith({
      key: "one",
      value: "Item 1",
    });
  });

  it("ignores arrow keys when inactive", async () => {
    const { lastFrame, stdin } = render(
      <Tumbler items={items} initialFocusedKey="zero" isActive={false} />,
    );

    stdin.write("\x1B[B");
    await tick();

    expect(plainFrame(lastFrame)).toContain("▸ Item 0");
  });

  it("renders an empty message", () => {
    const { lastFrame } = render(
      <Tumbler items={[]} emptyMessage="Nothing available" />,
    );

    expect(plainFrame(lastFrame)).toContain("Nothing available");
  });

  it("renders the default empty message from the primitive copy contract", () => {
    const { lastFrame } = render(<Tumbler items={[]} />);

    expect(plainFrame(lastFrame)).toContain(TumblerCopy.emptyMessage);
  });

  it("normalizes even visible counts to keep a center row", () => {
    const { lastFrame } = render(
      <Tumbler items={items} initialFocusedKey="zero" visibleCount={4} />,
    );

    expect(plainFrame(lastFrame)).toContain(
      "  Item -2\n  Item -1\n▸ Item 0\n  Item 1\n  Item 2",
    );
  });

  it("truncates rendered values to the max display length", () => {
    const { lastFrame } = render(
      <Tumbler
        items={[{ key: "long", value: "A very long display value" }]}
        maxDisplayLength={12}
      />,
    );

    expect(plainFrame(lastFrame)).toContain("▸ A very lo...");
    expect(plainFrame(lastFrame)).not.toContain("A very long display value");
  });

  it("uses dots only when max display length cannot fit a full ellipsis", () => {
    const { lastFrame } = render(
      <Tumbler
        items={[{ key: "long", value: "Long value" }]}
        maxDisplayLength={2}
      />,
    );

    expect(plainFrame(lastFrame)).toContain("▸ ..");
  });
});
