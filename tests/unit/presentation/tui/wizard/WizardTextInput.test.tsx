import React, { useState } from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render } from "ink-testing-library";
import { WizardTextInput } from "../../../../../src/presentation/tui/wizard/WizardTextInput.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
const LEFT_ARROW = "\x1B[D";
const RIGHT_ARROW = "\x1B[C";
const BACKSPACE = "\x7f";
const DELETE = "\x1B[3~";

function EditableInput({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  return <WizardTextInput label="Name" value={value} onChange={setValue} />;
}

describe("WizardTextInput", () => {
  it("inserts text and pasted text at the cursor after moving left and right", async () => {
    const { stdin, lastFrame, unmount } = render(
      <EditableInput initialValue="abcd" />,
    );
    await tick();
    for (const key of [LEFT_ARROW, LEFT_ARROW, "XY", RIGHT_ARROW, "!"]) {
      stdin.write(key);
      await tick();
    }
    expect(lastFrame()).toContain("abXYc!▎d");
    unmount();
  });

  it("bounds the cursor and deletes before or after it without corrupting emoji", async () => {
    const { stdin, lastFrame, unmount } = render(
      <EditableInput initialValue="A😀B" />,
    );
    await tick();
    for (const key of [RIGHT_ARROW, DELETE, LEFT_ARROW, BACKSPACE]) {
      stdin.write(key);
      await tick();
    }
    expect(lastFrame()).toContain("A▎B");
    for (const key of [LEFT_ARROW, LEFT_ARROW, BACKSPACE, DELETE]) {
      stdin.write(key);
      await tick();
    }
    expect(lastFrame()).toContain("▎B");
    stdin.write(DELETE);
    await tick();
    stdin.write(DELETE);
    await tick();
    stdin.write("new");
    await tick();
    expect(lastFrame()).toContain("new▎");
    unmount();
  });

  it("synchronizes the cursor when a caller replaces the value", async () => {
    const onChange = jest.fn();
    const { stdin, lastFrame, rerender, unmount } = render(
      <WizardTextInput label="Name" value="original" onChange={onChange} />,
    );
    await tick();
    stdin.write(LEFT_ARROW);
    await tick();
    rerender(<WizardTextInput label="Name" value="new" onChange={onChange} />);
    await tick();
    expect(lastFrame()).toContain("new▎");
    stdin.write("!");
    await tick();
    expect(onChange).toHaveBeenLastCalledWith("new!");
    unmount();
  });

  it("ignores editing input when unfocused and restores the cursor on refocus", async () => {
    const onChange = jest.fn();
    const { stdin, lastFrame, rerender, unmount } = render(
      <WizardTextInput label="Name" value="abc" onChange={onChange} />,
    );
    await tick();
    stdin.write(LEFT_ARROW);
    await tick();
    rerender(
      <WizardTextInput
        label="Name"
        value="abc"
        onChange={onChange}
        focused={false}
      />,
    );
    await tick();
    for (const key of [LEFT_ARROW, RIGHT_ARROW, BACKSPACE, DELETE, "x"]) {
      stdin.write(key);
      await tick();
    }
    expect(onChange).not.toHaveBeenCalled();
    expect(lastFrame()).not.toContain("▎");
    rerender(<WizardTextInput label="Name" value="abc" onChange={onChange} />);
    await tick();
    expect(lastFrame()).toContain("ab▎c");
    stdin.write("\x02");
    await tick();
    expect(onChange).not.toHaveBeenCalled();
    stdin.write("!");
    await tick();
    expect(onChange).toHaveBeenLastCalledWith("ab!c");
    unmount();
  });

  it("renders the label", () => {
    const { lastFrame } = render(
      <WizardTextInput label="Name" value="" onChange={() => {}} />,
    );
    expect(lastFrame()).toContain("Name");
  });

  it("renders the current value", () => {
    const { lastFrame } = render(
      <WizardTextInput label="Name" value="Alice" onChange={() => {}} />,
    );
    expect(lastFrame()).toContain("Alice");
  });

  it("renders placeholder when value is empty", () => {
    const { lastFrame } = render(
      <WizardTextInput
        label="Name"
        value=""
        placeholder="e.g. Alice"
        onChange={() => {}}
      />,
    );
    expect(lastFrame()).toContain("e.g. Alice");
  });

  it("renders the cursor indicator when focused", () => {
    const { lastFrame } = render(
      <WizardTextInput
        label="Name"
        value="test"
        onChange={() => {}}
        focused={true}
      />,
    );
    expect(lastFrame()).toContain("▎");
  });

  it("does not render cursor when not focused", () => {
    const { lastFrame } = render(
      <WizardTextInput
        label="Name"
        value="test"
        onChange={() => {}}
        focused={false}
      />,
    );
    expect(lastFrame()).not.toContain("▎");
  });

  it("renders the cursor for an empty focused input", () => {
    const { lastFrame } = render(
      <WizardTextInput label="Name" value="" onChange={() => {}} />,
    );
    expect(lastFrame()).toContain("▎");
  });
});
