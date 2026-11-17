import React from "react";
import { Text } from "ink";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { useFooterNotificationDismissal } from "../../../../../src/presentation/tui/application-shell/useFooterNotificationDismissal.js";
import type { FooterNotificationDismissalResult } from "../../../../../src/presentation/tui/application-shell/useFooterNotificationDismissal.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("useFooterNotificationDismissal", () => {
  it("adds notification ids to dismissal state and preserves insertion order", async () => {
    const recordedState: {
      latest: FooterNotificationDismissalResult | null;
    } = { latest: null };

    const DismissProbe = () => {
      const dismissal = useFooterNotificationDismissal();
      recordedState.latest = dismissal;

      return React.createElement(
        Text,
        null,
        `dismissed ${recordedState.latest.dismissedNotificationIds.length}`,
      );
    };

    render(React.createElement(DismissProbe));

    expect(recordedState.latest?.dismissedNotificationIds).toEqual([]);

    recordedState.latest?.handleDismissNotification("n-1");
    await tick();

    expect(recordedState.latest?.dismissedNotificationIds).toEqual(["n-1"]);
  });
});
