export const SearchCategory = {
  COMPONENT: "component",
  DEPENDENCY: "dependency",
  DECISION: "decision",
  GUIDELINE: "guideline",
  INVARIANT: "invariant",
} as const;

export type KnownSearchCategory =
  (typeof SearchCategory)[keyof typeof SearchCategory];

export type SearchCategory = KnownSearchCategory | (string & {});
