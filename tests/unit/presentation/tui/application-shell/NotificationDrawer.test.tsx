import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render } from "ink-testing-library";
import { NotificationDrawer } from "../../../../../src/presentation/tui/application-shell/NotificationDrawer.js";
import type { NotificationDrawerNotification } from "../../../../../src/presentation/tui/application-shell/NotificationDrawer.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));

const notifications: readonly NotificationDrawerNotification[] = [
  {
    id: "version-check",
    title: "New CLI version available",
    body: "A placeholder update notice will connect to version checks later.",
    unread: true,
  },
  {
    id: "daemon-health",
    title: "Daemon failure detected",
    body: "A placeholder daemon alert will connect to process events later.",
    unread: true,
  },
];

describe("NotificationDrawer", () => {
  const defaultProps = {
    notifications,
    onDismiss: () => {},
    onClose: () => {},
    terminalWidth: 80,
  };

  it("renders placeholder notifications in a drawer overlay", () => {
    const { lastFrame } = render(<NotificationDrawer {...defaultProps} />);
    const frame = lastFrame()!;

    expect(frame).toContain("Notifications");
    expect(frame).toContain("New CLI version available");
    expect(frame).toContain("Daemon failure detected");
    expect(frame).toContain("d dismiss");
  });

  it("moves the selected notification down", async () => {
    const { lastFrame, stdin } = render(
      <NotificationDrawer {...defaultProps} />,
    );

    stdin.write("\x1B[B");
    await tick();

    expect(lastFrame()).toContain("▸ ● Daemon failure detected");
  });

  it("dismisses the selected notification", async () => {
    const onDismiss = jest.fn();
    const { stdin } = render(
      <NotificationDrawer {...defaultProps} onDismiss={onDismiss} />,
    );

    stdin.write("\x1B[B");
    await tick();
    stdin.write("d");
    await tick();

    expect(onDismiss).toHaveBeenCalledWith("daemon-health");
  });

  it("runs the selected notification action", async () => {
    const onAction = jest.fn();
    const { stdin } = render(
      <NotificationDrawer
        {...defaultProps}
        notifications={[
          {
            id: "version-check",
            title: "New CLI version available",
            body: "Update from the drawer.",
            unread: true,
            action: {
              char: "u",
              label: "upgrade",
            },
          },
        ]}
        onAction={onAction}
      />,
    );

    stdin.write("u");
    await tick();

    expect(onAction).toHaveBeenCalledWith("version-check");
  });

  it("closes on escape", async () => {
    const onClose = jest.fn();
    const { stdin } = render(
      <NotificationDrawer {...defaultProps} onClose={onClose} />,
    );

    stdin.write("\x1B");
    await tick();

    expect(onClose).toHaveBeenCalled();
  });

  it("renders an empty state when all notifications are dismissed", () => {
    const { lastFrame } = render(
      <NotificationDrawer {...defaultProps} notifications={[]} />,
    );

    expect(lastFrame()).toContain("No notifications");
  });
});
