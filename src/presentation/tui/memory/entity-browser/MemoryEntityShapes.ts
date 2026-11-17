export type MemoryEntityType =
  "decision" | "invariant" | "component" | "dependency" | "guideline";

export interface DecisionEntityRow {
  readonly id: string;
  readonly title: string;
  readonly context: string;
  readonly rationale: string;
  readonly alternatives: readonly string[];
  readonly consequences: string;
}

export interface InvariantEntityRow {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly rationale: string;
}

export interface ComponentEntityRow {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly description: string;
  readonly responsibility: string;
}

export interface DependencyEntityRow {
  readonly id: string;
  readonly name: string;
  readonly ecosystem: string;
  readonly packageName: string;
  readonly versionConstraint: string;
  readonly endpoint: string;
  readonly contract: string;
}

export interface GuidelineEntityRow {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly description: string;
  readonly rationale: string;
  readonly examples: readonly string[];
}

export type MemoryEntityRow =
  | DecisionEntityRow
  | InvariantEntityRow
  | ComponentEntityRow
  | DependencyEntityRow
  | GuidelineEntityRow;
