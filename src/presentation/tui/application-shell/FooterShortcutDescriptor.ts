export interface FooterShortcutDescriptor {
  readonly char: string;
}

export interface FooterContextualShortcutDescriptor extends FooterShortcutDescriptor {
  readonly label: string;
}

export const FooterShortcut = {
  QUIT: {
    char: "q",
    label: "quit",
  },
  MEGA_MENU: {
    char: "m",
    label: "menu",
  },
  NOTIFICATIONS: {
    char: "i",
  },
} as const satisfies Record<
  string,
  FooterShortcutDescriptor | FooterContextualShortcutDescriptor
>;
