import { BaseEvent } from "../../../domain/BaseEvent.js";
import { IEventHandler } from "../../messaging/IEventHandler.js";
import { ISearchDocumentProjector } from "./ISearchDocumentProjector.js";
import { ISearchIndexWriter } from "./ISearchIndexWriter.js";
import { ISearchIndexReader } from "./ISearchIndexReader.js";

export class SearchIndexEventHandler implements IEventHandler {
  readonly eventTypes: readonly string[];

  constructor(
    private readonly documentProjectors: readonly ISearchDocumentProjector[],
    private readonly reader: ISearchIndexReader,
    private readonly writer: ISearchIndexWriter,
  ) {
    this.eventTypes = [
      ...new Set(
        documentProjectors.flatMap((projector) => projector.eventTypes),
      ),
    ];
  }

  async handle(event: BaseEvent): Promise<void> {
    const documentProjector = this.documentProjectors.find((candidate) =>
      candidate.eventTypes.includes(event.type),
    );
    if (!documentProjector) return;

    const source = documentProjector.getSource(event);
    const current = await this.reader.findBySource(source);
    const change = documentProjector.project(event, current);
    if (!change) return;

    if (change.operation === "upsert") {
      await this.writer.upsert(change.document);
      return;
    }

    await this.writer.remove(change.source);
  }
}
