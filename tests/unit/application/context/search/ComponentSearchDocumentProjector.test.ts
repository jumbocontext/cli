import { describe, expect, it } from "@jest/globals";
import { ComponentEventType, ComponentStatus } from "../../../../../src/domain/components/Constants.js";
import { ComponentSearchDocumentProjector } from "../../../../../src/application/context/search/projectors/ComponentSearchDocumentProjector.js";
import { SearchCategory } from "../../../../../src/application/context/search/SearchCategory.js";
import type { ComponentEvent } from "../../../../../src/domain/components/EventIndex.js";

describe("ComponentSearchDocumentProjector", () => {
  it("maps component events to document-agnostic search documents", () => {
    const projector = new ComponentSearchDocumentProjector();

    const change = projector.project(
      {
        type: ComponentEventType.ADDED,
        aggregateId: "comp-1",
        version: 1,
        timestamp: "2026-01-01T00:00:00.000Z",
        payload: {
          name: "SearchIndex",
          type: "service",
          description: "Projects searchable memory",
          responsibility: "Indexes events",
          path: "src/search",
          status: ComponentStatus.ACTIVE,
        },
      } as ComponentEvent,
      null
    );

    expect(change?.operation).toBe("upsert");
    if (change?.operation !== "upsert") throw new Error("Expected upsert");
    expect(change.document).toMatchObject({
      source: { type: SearchCategory.COMPONENT, id: "comp-1" },
      category: SearchCategory.COMPONENT,
      title: "SearchIndex",
      summary: "Projects searchable memory",
      facets: { type: "service", status: ComponentStatus.ACTIVE, path: "src/search" },
    });
  });

  it("merges partial update events against the current indexed document", () => {
    const projector = new ComponentSearchDocumentProjector();
    const added = projector.project(
      {
        type: ComponentEventType.ADDED,
        aggregateId: "comp-1",
        version: 1,
        timestamp: "2026-01-01T00:00:00.000Z",
        payload: {
          name: "SearchIndex",
          type: "service",
          description: "Projects searchable memory",
          responsibility: "Indexes events",
          path: "src/search",
          status: ComponentStatus.ACTIVE,
        },
      } as ComponentEvent,
      null
    );

    if (added?.operation !== "upsert") throw new Error("Expected seed upsert");

    const updated = projector.project(
      {
        type: ComponentEventType.UPDATED,
        aggregateId: "comp-1",
        version: 2,
        timestamp: "2026-01-02T00:00:00.000Z",
        payload: { description: "Updated summary" },
      } as ComponentEvent,
      added.document
    );

    expect(updated?.operation).toBe("upsert");
    if (updated?.operation !== "upsert") throw new Error("Expected update upsert");
    expect(updated.document.title).toBe("SearchIndex");
    expect(updated.document.summary).toBe("Updated summary");
    expect(updated.document.content).toContain("Indexes events");
  });
});
