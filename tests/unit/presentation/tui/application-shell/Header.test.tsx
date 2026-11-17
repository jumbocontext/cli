import React from "react";
import { describe, expect, it } from "@jest/globals";
import { Box, Text } from "ink";
import { render } from "ink-testing-library";
import { Header } from "../../../../../src/presentation/tui/application-shell/Header.js";

type ElementWithChildren = React.ReactElement<{
  readonly children?: React.ReactNode;
  readonly flexShrink?: number;
}>;

function childElements(element: ElementWithChildren): ElementWithChildren[] {
  return React.Children.toArray(element.props.children).filter(
    React.isValidElement,
  ) as ElementWithChildren[];
}

describe("Header", () => {
  it("renders the projectName prop value", () => {
    const { lastFrame } = render(
      <Header
        projectName="MyProject"
        directoryPath={"C:\\projects\\jumbo\\cli"}
        version="1.2.3"
        terminalWidth={80}
      />,
    );
    expect(lastFrame()).toContain("MyProject");
  });

  it("renders the version prop value", () => {
    const { lastFrame } = render(
      <Header
        projectName="MyProject"
        directoryPath={"C:\\projects\\jumbo\\cli"}
        version="1.2.3"
        terminalWidth={80}
      />,
    );
    expect(lastFrame()).toContain("1.2.3");
  });

  it("places the directory path immediately after the project name and before the version", () => {
    const header = Header({
      projectName: "MyProject",
      directoryPath: "C:\\projects\\jumbo\\cli",
      version: "1.2.3",
      terminalWidth: 80,
    });
    const [row] = childElements(header);
    const [leftGroup, versionGroup] = childElements(row as ElementWithChildren);
    const [projectText, directoryText] = childElements(
      leftGroup as ElementWithChildren,
    );
    const [versionText] = childElements(versionGroup as ElementWithChildren);

    expect(row.type).toBe(Box);
    expect(leftGroup.type).toBe(Box);
    expect(projectText.type).toBe(Text);
    expect(projectText.props.children).toBe("MyProject");
    expect(directoryText.type).toBe(Text);
    expect(directoryText.props.children).toEqual([
      " ",
      "C:\\projects\\jumbo\\cli",
    ]);
    expect(versionGroup.props.flexShrink).toBe(0);
    expect(versionText.props.children).toBe("Jumbo ● v1.2.3");
  });

  it("truncates the directory path before it can consume the version column", () => {
    const header = Header({
      projectName: "MyProject",
      directoryPath: "C:\\projects\\jumbo\\cli\\with\\a\\long\\path",
      version: "1.2.3",
      terminalWidth: 32,
    });
    const [row] = childElements(header);
    const [leftGroup, versionGroup] = childElements(row as ElementWithChildren);
    const [, directoryText] = childElements(leftGroup as ElementWithChildren);
    const [versionText] = childElements(versionGroup as ElementWithChildren);

    expect(directoryText.props.children).toEqual([" ", "C:..."]);
    expect(versionText.props.children).toBe("Jumbo ● v1.2.3");
  });
});
