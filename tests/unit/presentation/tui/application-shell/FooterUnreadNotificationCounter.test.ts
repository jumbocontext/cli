import { describe, expect, it } from "@jest/globals";
import type { NotificationDrawerNotification } from "../../../../../src/presentation/tui/application-shell/NotificationDrawer.js";
import { FooterUnreadNotificationCounter } from "../../../../../src/presentation/tui/application-shell/FooterUnreadNotificationCounter.js";

const notifications: readonly NotificationDrawerNotification[] = [
  {
    id: "daemon-failed",
    title: "Daemon failed",
    body: "Daemon failure body",
    unread: true,
  },
  {
    id: "version-check",
    title: "Version check",
    body: "Update available",
    unread: false,
  },
  {
    id: "goal-warning",
    title: "Goal warning",
    body: "Needs attention",
    unread: true,
  },
];

describe("FooterUnreadNotificationCounter", () => {
  it("counts unread visible notifications", () => {
    const unreadCount = FooterUnreadNotificationCounter(notifications);

    expect(unreadCount).toBe(2);
  });

  it("returns zero when all notifications are read", () => {
    const unreadCount = FooterUnreadNotificationCounter([
      {
        id: "resolved",
        title: "Resolved",
        body: "No action needed",
        unread: false,
      },
    ]);

    expect(unreadCount).toBe(0);
  });
});
