import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render } from "ink-testing-library";
import { Wizard } from "../../../../../src/presentation/tui/wizard/Wizard.js";
import type { WizardStepDefinition } from "../../../../../src/presentation/tui/wizard/Wizard.js";
import {
  WizardFieldKind,
  WizardKeyboardHintCopy,
  WizardKeyboardHintKey,
  WizardValidationCopy,
} from "../../../../../src/presentation/tui/wizard/WizardConstants.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
const SHIFT_TAB = "\x1B[Z";

const TWO_STEP_CONFIG: WizardStepDefinition[] = [
  {
    title: "First Step",
    description: "Enter your name",
    fields: [{ key: "name", label: "Name", placeholder: "e.g. Alice" }],
  },
  {
    title: "Second Step",
    fields: [
      { key: "email", label: "Email", placeholder: "e.g. alice@example.com" },
    ],
  },
];

const SINGLE_STEP_CONFIG: WizardStepDefinition[] = [
  {
    title: "Only Step",
    fields: [{ key: "value", label: "Value" }],
  },
];

const MULTI_FIELD_CONFIG: WizardStepDefinition[] = [
  {
    title: "Details",
    fields: [
      { key: "first", label: "First name" },
      { key: "last", label: "Last name" },
    ],
  },
];

const YES_NO_CONFIG: WizardStepDefinition[] = [
  {
    title: "Question",
    fields: [
      {
        key: "enabled",
        label: "Enable feature?",
        kind: WizardFieldKind.YES_NO,
        defaultValue: "no",
      },
    ],
  },
];

const MULTI_SELECT_CONFIG: WizardStepDefinition[] = [
  {
    title: "Choices",
    fields: [
      {
        key: "choices",
        label: "Choices",
        kind: WizardFieldKind.MULTI_SELECT,
        options: [
          { value: "alpha", label: "Alpha" },
          { value: "beta", label: "Beta" },
        ],
        defaultValue: "alpha,beta",
      },
    ],
  },
];

const SINGLE_SELECT_CONFIG: WizardStepDefinition[] = [
  {
    title: "Choice",
    fields: [
      {
        key: "choice",
        label: "Choice",
        kind: WizardFieldKind.SINGLE_SELECT,
        options: [
          { value: "alpha", label: "Alpha" },
          { value: "beta", label: "Beta" },
        ],
        defaultValue: "alpha",
      },
    ],
  },
];

describe("Wizard", () => {
  it("renders the wizard title", () => {
    const { lastFrame } = render(
      <Wizard
        title="Test Wizard"
        steps={TWO_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(lastFrame()).toContain("Test Wizard");
  });

  it("does not render redundant step counter text in the header", () => {
    const { lastFrame } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(lastFrame()).not.toContain("Step 1 of 2");
    expect(lastFrame()).toContain("1/2");
  });

  it("does not duplicate the current step title in the header", () => {
    const { lastFrame } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(lastFrame()).not.toContain("First Step");
  });

  it("renders step description when provided", () => {
    const { lastFrame } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(lastFrame()).toContain("Enter your name");
  });

  it("renders field labels", () => {
    const { lastFrame } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(lastFrame()).toContain("Name");
  });

  it("renders placeholder text for empty fields", () => {
    const { lastFrame } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(lastFrame()).toContain("e.g. Alice");
  });

  it("accepts text input into the active field", async () => {
    const { lastFrame, stdin } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    stdin.write("Hello");
    await tick();
    expect(lastFrame()).toContain("Hello");
  });

  it("shows validation error when advancing with empty required field", async () => {
    const { lastFrame, stdin } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    stdin.write("\r");
    await tick();
    expect(lastFrame()).toContain(WizardValidationCopy.required);
  });

  it("advances to next step after filling field and pressing enter", async () => {
    const { lastFrame, stdin } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    stdin.write("Alice");
    await tick();
    stdin.write("\r");
    await tick();
    expect(lastFrame()).toContain("2/2");
    expect(lastFrame()).toContain("Email");
  });

  it("calls onCancel when escape is pressed", async () => {
    const handleCancel = jest.fn();
    const { stdin } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={handleCancel}
      />,
    );
    stdin.write("\x1b");
    await tick();
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm with collected values on last step", async () => {
    const handleConfirm = jest.fn();
    const { stdin } = render(
      <Wizard
        title="Setup"
        steps={SINGLE_STEP_CONFIG}
        onConfirm={handleConfirm}
        onCancel={() => {}}
      />,
    );
    stdin.write("test-value");
    await tick();
    stdin.write("\r");
    await tick();
    expect(handleConfirm).toHaveBeenCalledWith({ value: "test-value" });
  });

  it("renders multiple fields in a single step", () => {
    const { lastFrame } = render(
      <Wizard
        title="Setup"
        steps={MULTI_FIELD_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(lastFrame()).toContain("First name");
    expect(lastFrame()).toContain("Last name");
  });

  it("renders navigation hints", () => {
    const { lastFrame } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(lastFrame()).toContain(WizardKeyboardHintKey.cancel);
    expect(lastFrame()).toContain(WizardKeyboardHintCopy.cancel);
  });

  it("renders a structured overlay", () => {
    const { lastFrame } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Setup");
    expect(frame).toContain("Enter your name");
    expect(frame).toContain("──");
  });

  it("handles backspace to delete characters", async () => {
    const { lastFrame, stdin } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    stdin.write("Hello");
    await tick();
    stdin.write("\x7f");
    await tick();
    expect(lastFrame()).toContain("Hell");
  });

  it("does not show back hint on first step", () => {
    const { lastFrame } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(lastFrame()).not.toContain(WizardKeyboardHintCopy.back);
  });

  it("shows Ctrl+B back hint when parent back is available", () => {
    const { lastFrame } = render(
      <Wizard
        title="Setup"
        steps={SINGLE_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
        onBack={() => {}}
      />,
    );
    expect(lastFrame()).toContain(WizardKeyboardHintKey.back);
    expect(lastFrame()).toContain(WizardKeyboardHintCopy.back);
  });

  it("shows back hint on first step when a parent back handler is available on a toggle", () => {
    const { lastFrame } = render(
      <Wizard
        title="Setup"
        steps={YES_NO_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
        onBack={() => {}}
      />,
    );
    expect(lastFrame()).toContain(WizardKeyboardHintKey.back);
    expect(lastFrame()).toContain(WizardKeyboardHintCopy.back);
  });

  it("calls parent back handler with Ctrl+B but not Left Arrow", async () => {
    const handleBack = jest.fn();
    const { stdin } = render(
      <Wizard
        title="Setup"
        steps={YES_NO_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
        onBack={handleBack}
      />,
    );
    stdin.write("\x1B[D");
    await tick();
    expect(handleBack).not.toHaveBeenCalled();

    stdin.write("\x02");
    await tick();
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it("types b into focused text fields instead of navigating back", async () => {
    const handleBack = jest.fn();
    const { lastFrame, stdin } = render(
      <Wizard
        title="Setup"
        steps={SINGLE_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
        onBack={handleBack}
      />,
    );

    stdin.write("b");
    await tick();

    expect(lastFrame()).toContain("b");
    expect(handleBack).not.toHaveBeenCalled();
  });

  it("shows Confirm label on last step", async () => {
    const { lastFrame, stdin } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    stdin.write("Alice");
    await tick();
    stdin.write("\r");
    await tick();
    expect(lastFrame()).toContain(WizardKeyboardHintCopy.confirm);
  });

  it("moves to next field with tab", async () => {
    const { lastFrame, stdin } = render(
      <Wizard
        title="Setup"
        steps={MULTI_FIELD_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    stdin.write("Alice");
    await tick();
    stdin.write("\t");
    await tick();
    stdin.write("Smith");
    await tick();
    expect(lastFrame()).toContain("Alice");
    expect(lastFrame()).toContain("Smith");
  });

  it("moves to next field with enter when not on last field", async () => {
    const { lastFrame, stdin } = render(
      <Wizard
        title="Setup"
        steps={MULTI_FIELD_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    stdin.write("Alice");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Smith");
    await tick();
    expect(lastFrame()).toContain("Alice");
    expect(lastFrame()).toContain("Smith");
  });

  it("moves back to the previous field with up arrow", async () => {
    const { lastFrame, stdin } = render(
      <Wizard
        title="Setup"
        steps={MULTI_FIELD_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    stdin.write("Alice");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Smith");
    await tick();
    stdin.write("\x1B[A");
    await tick();
    stdin.write("a");
    await tick();

    expect(lastFrame()).toContain("Alicea");
    expect(lastFrame()).toContain("Smith");
  });

  it("moves back to the previous field with shift-tab", async () => {
    const { lastFrame, stdin } = render(
      <Wizard
        title="Setup"
        steps={MULTI_FIELD_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    stdin.write("Alice");
    await tick();
    stdin.write("\t");
    await tick();
    stdin.write("Smith");
    await tick();
    stdin.write(SHIFT_TAB);
    await tick();
    stdin.write("a");
    await tick();

    expect(lastFrame()).toContain("Alicea");
    expect(lastFrame()).toContain("Smith");
  });

  it("navigates back with Ctrl+B but not Left Arrow while preserving text", async () => {
    const handleConfirm = jest.fn();
    const { lastFrame, stdin } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={handleConfirm}
        onCancel={() => {}}
      />,
    );
    stdin.write("Alice");
    await tick();
    stdin.write("\r");
    await tick();
    expect(lastFrame()).toContain(WizardKeyboardHintKey.back);
    expect(lastFrame()).toContain(WizardKeyboardHintCopy.back);
    expect(lastFrame()).toContain("ctrl+b");

    stdin.write("alice@example.com");
    await tick();
    stdin.write("\x1B[D");
    await tick();
    expect(lastFrame()).toContain("2/2");

    stdin.write("\x02");
    await tick();
    expect(lastFrame()).toContain("1/2");
    expect(lastFrame()).toContain("Alice");

    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    expect(handleConfirm).toHaveBeenCalledWith({
      name: "Alice",
      email: "alice@example.com",
    });
  });

  it("uses a supplied progress label instead of local step count", () => {
    const { lastFrame } = render(
      <Wizard
        title="Setup"
        steps={SINGLE_STEP_CONFIG}
        progressLabel="2/7"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(lastFrame()).toContain("2/7");
    expect(lastFrame()).not.toContain("1/1");
  });

  it("collects values across multiple steps", async () => {
    const handleConfirm = jest.fn();
    const { stdin } = render(
      <Wizard
        title="Setup"
        steps={TWO_STEP_CONFIG}
        onConfirm={handleConfirm}
        onCancel={() => {}}
      />,
    );
    stdin.write("Alice");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("alice@test.com");
    await tick();
    stdin.write("\r");
    await tick();
    expect(handleConfirm).toHaveBeenCalledWith({
      name: "Alice",
      email: "alice@test.com",
    });
  });

  it("renders yes/no fields as toggles instead of text inputs", () => {
    const { lastFrame } = render(
      <Wizard
        title="Setup"
        steps={YES_NO_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(lastFrame()).toContain("Enable feature?");
    expect(lastFrame()).toContain("Yes");
    expect(lastFrame()).toContain("▸ No");
    expect(lastFrame()).toContain(WizardKeyboardHintKey.toggle);
    expect(lastFrame()).toContain(WizardKeyboardHintCopy.toggle);
  });

  it("toggles yes/no fields with space and submits the selected value", async () => {
    const handleConfirm = jest.fn();
    const { stdin } = render(
      <Wizard
        title="Setup"
        steps={YES_NO_CONFIG}
        onConfirm={handleConfirm}
        onCancel={() => {}}
      />,
    );

    stdin.write(" ");
    await tick();
    stdin.write("\r");
    await tick();

    expect(handleConfirm).toHaveBeenCalledWith({ enabled: "yes" });
  });

  it("renders multi-select fields with selected options", () => {
    const { lastFrame } = render(
      <Wizard
        title="Setup"
        steps={MULTI_SELECT_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(lastFrame()).toContain("Choices");
    expect(lastFrame()).toContain("▸ [x] Alpha");
    expect(lastFrame()).toContain("[x] Beta");
    expect(lastFrame()).toContain(WizardKeyboardHintKey.toggle);
    expect(lastFrame()).toContain(WizardKeyboardHintCopy.toggle);
  });

  it("toggles multi-select options with space and submits selected values", async () => {
    const handleConfirm = jest.fn();
    const { stdin } = render(
      <Wizard
        title="Setup"
        steps={MULTI_SELECT_CONFIG}
        onConfirm={handleConfirm}
        onCancel={() => {}}
      />,
    );

    stdin.write(" ");
    await tick();
    stdin.write("\r");
    await tick();

    expect(handleConfirm).toHaveBeenCalledWith({ choices: "beta" });
  });

  it("renders single-select fields with one selected option", () => {
    const { lastFrame } = render(
      <Wizard
        title="Setup"
        steps={SINGLE_SELECT_CONFIG}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(lastFrame()).toContain("Choice");
    expect(lastFrame()).toContain("▸ (x) Alpha");
    expect(lastFrame()).toContain("( ) Beta");
    expect(lastFrame()).toContain(WizardKeyboardHintKey.toggle);
    expect(lastFrame()).toContain(WizardKeyboardHintCopy.toggle);
  });

  it("changes single-select value with down arrow and submits the selected value", async () => {
    const handleConfirm = jest.fn();
    const { stdin } = render(
      <Wizard
        title="Setup"
        steps={SINGLE_SELECT_CONFIG}
        onConfirm={handleConfirm}
        onCancel={() => {}}
      />,
    );

    stdin.write("\x1B[B");
    await tick();
    stdin.write("\r");
    await tick();

    expect(handleConfirm).toHaveBeenCalledWith({ choice: "beta" });
  });
});
