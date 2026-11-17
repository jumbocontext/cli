import { IEventStore } from "../../../application/persistence/IEventStore.js";
import { ISearchIndexReader } from "../../../application/context/search/ISearchIndexReader.js";
import { ISearchIndexRebuildGateway } from "../../../application/context/search/ISearchIndexRebuildGateway.js";
import { ISearchIndexRebuildStore } from "../../../application/context/search/ISearchIndexRebuildStore.js";
import { ISearchIndexWriter } from "../../../application/context/search/ISearchIndexWriter.js";
import { SearchDocumentProjectorRegistry } from "../../../application/context/search/SearchDocumentProjectorRegistry.js";
import { SearchIndexEventHandler } from "../../../application/context/search/SearchIndexEventHandler.js";
import { SearchIndexRebuildRequest } from "../../../application/context/search/SearchIndexRebuildRequest.js";
import { SearchIndexRebuildResponse } from "../../../application/context/search/SearchIndexRebuildResponse.js";

export class LocalSearchIndexRebuildGateway implements ISearchIndexRebuildGateway {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly rebuildStore: ISearchIndexRebuildStore,
    private readonly reader: ISearchIndexReader,
    private readonly writer: ISearchIndexWriter,
    private readonly projectorRegistry = new SearchDocumentProjectorRegistry(),
  ) {}

  async rebuildSearchIndex(
    _request: SearchIndexRebuildRequest,
  ): Promise<SearchIndexRebuildResponse> {
    const events = await this.eventStore.getAllEvents();
    const removedEntries = await this.rebuildStore.clear();
    const eventHandler = new SearchIndexEventHandler(
      this.projectorRegistry.createMemoryProjectors(),
      this.reader,
      this.writer,
    );

    for (const event of events) {
      await eventHandler.handle(event);
    }

    const countsByCategory = await this.rebuildStore.countByCategory();

    return {
      success: true,
      eventsInspected: events.length,
      documentsIndexed: Object.values(countsByCategory).reduce<number>(
        (sum, count) => sum + (count ?? 0),
        0,
      ),
      removedEntries,
      countsByCategory,
    };
  }
}
