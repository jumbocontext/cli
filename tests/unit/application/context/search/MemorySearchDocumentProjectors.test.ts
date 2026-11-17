import { describe, expect, it } from "@jest/globals";
import { DecisionSearchDocumentProjector } from "../../../../../src/application/context/search/projectors/DecisionSearchDocumentProjector.js";
import { DependencySearchDocumentProjector } from "../../../../../src/application/context/search/projectors/DependencySearchDocumentProjector.js";
import { GuidelineSearchDocumentProjector } from "../../../../../src/application/context/search/projectors/GuidelineSearchDocumentProjector.js";
import { InvariantSearchDocumentProjector } from "../../../../../src/application/context/search/projectors/InvariantSearchDocumentProjector.js";
import { SearchCategory } from "../../../../../src/application/context/search/SearchCategory.js";
import { DecisionEventType } from "../../../../../src/domain/decisions/Constants.js";
import { DependencyEventType } from "../../../../../src/domain/dependencies/Constants.js";
import { GuidelineEventType } from "../../../../../src/domain/guidelines/Constants.js";
import { InvariantEventType } from "../../../../../src/domain/invariants/Constants.js";
import type { BaseEvent } from "../../../../../src/domain/BaseEvent.js";

describe("MemorySearchDocumentProjectors", () => {
  it("maps dependency, decision, guideline, and invariant add events into generic search documents", () => {
    const cases = [
      {
        projector: new DependencySearchDocumentProjector(),
        event: {
          type: DependencyEventType.ADDED,
          aggregateId: "dep-1",
          version: 1,
          timestamp: "2026-01-01T00:00:00.000Z",
          payload: {
            name: "better-sqlite3",
            ecosystem: "npm",
            packageName: "better-sqlite3",
            versionConstraint: "^12.4.1",
            endpoint: null,
            contract: "SQLite adapter",
          },
        },
        category: SearchCategory.DEPENDENCY,
        title: "better-sqlite3",
      },
      {
        projector: new DecisionSearchDocumentProjector(),
        event: {
          type: DecisionEventType.ADDED,
          aggregateId: "dec-1",
          version: 1,
          timestamp: "2026-01-01T00:00:00.000Z",
          payload: {
            title: "Use projected search",
            context: "Avoid query-time source scans",
            rationale: "Replayable projection",
            alternatives: ["Scan read models"],
            consequences: null,
          },
        },
        category: SearchCategory.DECISION,
        title: "Use projected search",
      },
      {
        projector: new GuidelineSearchDocumentProjector(),
        event: {
          type: GuidelineEventType.ADDED,
          aggregateId: "guide-1",
          version: 1,
          timestamp: "2026-01-01T00:00:00.000Z",
          payload: {
            category: "testing",
            title: "Cover projected search",
            description: "Test replay and query behavior",
            rationale: "Search must survive rebuild",
            examples: ["ProjectionBusFactory"],
          },
        },
        category: SearchCategory.GUIDELINE,
        title: "Cover projected search",
      },
      {
        projector: new InvariantSearchDocumentProjector(),
        event: {
          type: InvariantEventType.ADDED,
          aggregateId: "inv-1",
          version: 1,
          timestamp: "2026-01-01T00:00:00.000Z",
          payload: {
            title: "Projected state via events",
            description: "Read models are rebuilt from events",
            rationale: "Deterministic rebuilds",
          },
        },
        category: SearchCategory.INVARIANT,
        title: "Projected state via events",
      },
    ];

    for (const testCase of cases) {
      const change = testCase.projector.project(testCase.event as BaseEvent, null);

      expect(change?.operation).toBe("upsert");
      if (change?.operation !== "upsert") throw new Error("Expected upsert");
      expect(change.document.category).toBe(testCase.category);
      expect(change.document.title).toBe(testCase.title);
      expect(change.document.source.id).toBe(testCase.event.aggregateId);
      expect(change.document.content.length).toBeGreaterThan(0);
    }
  });
});
