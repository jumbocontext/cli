export const COMMAND_CATEGORIES = [
  "host",
  "project-knowledge",
  "work",
  "solution",
  "relations",
] as const;

export type CommandCategory = (typeof COMMAND_CATEGORIES)[number];

/**
 * Keyed references to the canonical category values, so call sites never
 * repeat category strings as magic literals.
 */
export const COMMAND_CATEGORY = {
  host: "host",
  projectKnowledge: "project-knowledge",
  work: "work",
  solution: "solution",
  relations: "relations",
} as const satisfies Record<string, CommandCategory>;

export const COMMAND_CATEGORY_LABELS: Record<CommandCategory, string> = {
  host: "HOST",
  "project-knowledge": "PROJECT",
  work: "WORK",
  solution: "SOLUTION",
  relations: "GRAPH",
};
