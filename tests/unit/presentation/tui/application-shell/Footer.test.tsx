import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render } from "ink-testing-library";
import { Footer } from "../../../../../src/presentation/tui/application-shell/Footer.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("Footer", () => {
  it("renders a non-empty frame", () => {
    const { lastFrame } = render(<Footer terminalWidth={80} />);
    expect((lastFrame() ?? "").trim().length).toBeGreaterThan(0);
  });

  it("advertises the menu shortcut without restoring help", () => {
    const { lastFrame } = render(<Footer terminalWidth={80} />);

    expect(lastFrame()).toContain(" m ");
    expect(lastFrame()).toContain("menu");
    expect(lastFrame()).not.toContain("help");
    expect(lastFrame()).not.toContain(" h ");
  });

  it("renders contextual shortcut badges", () => {
    const { lastFrame } = render(
      <Footer
        terminalWidth={80}
        contextualShortcuts={[{ char: "g", label: "create goal" }]}
      />,
    );

    expect(lastFrame()).toContain(" g ");
    expect(lastFrame()).toContain("create goal");
  });

  it("toggles the notification drawer with i", async () => {
    const { lastFrame, stdin } = render(<Footer terminalWidth={80} />);

    stdin.write("i");
    await tick();
    expect(lastFrame()).toContain("Notifications");

    stdin.write("i");
    await tick();
    expect(lastFrame()).not.toContain("Notifications");
  });

  it("does not toggle the notification drawer with n", async () => {
    const { lastFrame, stdin } = render(<Footer terminalWidth={80} />);

    stdin.write("n");
    await tick();

    expect(lastFrame()).not.toContain("Notifications");
  });

  it("renders an empty notification drawer without placeholder daemon alerts", async () => {
    const { lastFrame, stdin } = render(<Footer terminalWidth={80} />);

    stdin.write("i");
    await tick();

    expect(lastFrame()).toContain("No notifications");
  });

  it("does not toggle the notification drawer when shortcuts are disabled", async () => {
    const { lastFrame, stdin } = render(
      <Footer terminalWidth={80} shortcutsEnabled={false} />,
    );

    stdin.write("i");
    await tick();

    expect(lastFrame()).not.toContain("Notifications");
  });

  it("forwards notification actions from the drawer", async () => {
    const onNotificationAction = jest.fn();
    const { stdin } = render(
      <Footer
        terminalWidth={80}
        notifications={[
          {
            id: "cli-update",
            title: "Jumbo update available",
            body: "Local 1.0.0, latest 1.1.0.",
            unread: true,
            action: {
              char: "u",
              label: "upgrade",
            },
          },
        ]}
        onNotificationAction={onNotificationAction}
      />,
    );

    stdin.write("i");
    await tick();
    stdin.write("u");
    await tick();

    expect(onNotificationAction).toHaveBeenCalledWith("cli-update");
  });
});
