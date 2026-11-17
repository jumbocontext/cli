import { describe, expect, it, jest } from "@jest/globals";
import { ISearchDocumentProjector } from "../../../../../src/application/context/search/ISearchDocumentProjector.js";
import { ISearchIndexWriter } from "../../../../../src/application/context/search/ISearchIndexWriter.js";
import { ISearchIndexReader } from "../../../../../src/application/context/search/ISearchIndexReader.js";
import { SearchCategory } from "../../../../../src/application/context/search/SearchCategory.js";
import { SearchIndexEventHandler } from "../../../../../src/application/context/search/SearchIndexEventHandler.js";
import { ComponentEventType } from "../../../../../src/domain/components/Constants.js";

describe("SearchIndexEventHandler", () => {
  it("projects supported events through the document projector and search index writer", async () => {
    const document = {
      source: { type: SearchCategory.COMPONENT, id: "comp-1" },
      category: SearchCategory.COMPONENT,
      title: "Component",
      summary: null,
      content: "Component",
      facets: {},
      metadata: {},
      version: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const documentProjector: ISearchDocumentProjector = {
      eventTypes: [ComponentEventType.ADDED],
      getSource: () => ({ type: SearchCategory.COMPONENT, id: "comp-1" }),
      project: jest.fn<ISearchDocumentProjector["project"]>().mockReturnValue({
        operation: "upsert",
        document,
      }),
    };
    const reader: jest.Mocked<ISearchIndexReader> = {
      findBySource: jest.fn<ISearchIndexReader["findBySource"]>().mockResolvedValue(null),
      search: jest.fn(),
    };
    const writer: jest.Mocked<ISearchIndexWriter> = {
      upsert: jest.fn<ISearchIndexWriter["upsert"]>().mockResolvedValue(undefined),
      remove: jest.fn(),
    };

    const handler = new SearchIndexEventHandler([documentProjector], reader, writer);
    await handler.handle({
      type: ComponentEventType.ADDED,
      aggregateId: "comp-1",
      version: 1,
      timestamp: "2026-01-01T00:00:00.000Z",
      payload: {},
    });

    expect(reader.findBySource).toHaveBeenCalledWith({ type: SearchCategory.COMPONENT, id: "comp-1" });
    expect(writer.upsert).toHaveBeenCalledWith(document);
  });
});
