import fs from "fs-extra";
import os from "os";
import path from "path";
import { ILogger } from "../../application/logging/ILogger.js";
import {
  IEventStore,
  AppendResult,
} from "../../application/persistence/IEventStore.js";
import { BaseEvent } from "../../domain/BaseEvent.js";

/**
 * StoredEvent adds infrastructure metadata to domain events.
 * This type exists only in the infrastructure layer.
 */
type StoredEvent = BaseEvent & {
  seq: number; // sequence number within the stream (file system ordering)
};

export class FsEventStore implements IEventStore {
  private readonly tag = "[FsEventStore]";

  constructor(
    private readonly rootDir: string,
    private readonly logger: ILogger,
  ) {}

  async append(e: BaseEvent): Promise<AppendResult> {
    const streamDir = this.streamDir(e.aggregateId);
    await fs.ensureDir(streamDir);

    const files = await fs.readdir(streamDir);
    const nextSeq = files.length + 1;

    const storedEvent: StoredEvent = { ...e, seq: nextSeq };
    const filename = `${String(nextSeq).padStart(6, "0")}.${e.type}.json`;
    const filepath = path.join(streamDir, filename);

    // Atomic write: write to temp file then rename to prevent corruption
    // from concurrent processes or interrupted writes.
    const tmpPath = path.join(
      os.tmpdir(),
      `jumbo-event-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`,
    );
    await fs.writeFile(tmpPath, JSON.stringify(storedEvent, null, 2));
    await fs.move(tmpPath, filepath, { overwrite: true });

    return { nextSeq };
  }

  async readStream<T extends BaseEvent = BaseEvent>(
    streamId: string,
  ): Promise<T[]> {
    const streamDir = this.streamDir(streamId);

    if (!(await fs.pathExists(streamDir))) {
      return [];
    }

    const files = await fs.readdir(streamDir);
    const events: T[] = [];

    for (const file of files.sort()) {
      const filepath = path.join(streamDir, file);
      try {
        const content = await fs.readFile(filepath, "utf-8");
        if (!content.trim()) {
          this.logger.warn(`${this.tag} Skipping empty event file`, {
            filepath,
          });
          continue;
        }
        const storedEvent: StoredEvent = JSON.parse(content);
        // Strip infrastructure metadata before returning domain event.
        // This deserialization seam is the single point where persisted
        // events are narrowed to the caller's requested event type.
        const { seq: _seq, ...domainEvent } = storedEvent;
        events.push(domainEvent as T);
      } catch (error) {
        this.logger.error(
          `${this.tag} Skipping corrupt event file`,
          error instanceof Error ? error : undefined,
          { filepath },
        );
        continue;
      }
    }

    return events;
  }

  async getAllEvents(): Promise<BaseEvent[]> {
    const eventsRoot = path.join(this.rootDir, "events");

    if (!(await fs.pathExists(eventsRoot))) {
      this.logger.debug(`${this.tag} No events directory found`, {
        eventsRoot,
      });
      return [];
    }

    const aggregateDirs = await fs.readdir(eventsRoot);
    this.logger.debug(`${this.tag} Loading events from all streams`, {
      streamCount: aggregateDirs.length,
    });
    const allEvents: BaseEvent[] = [];

    for (const aggregateId of aggregateDirs) {
      const streamEvents = await this.readStream(aggregateId);
      allEvents.push(...streamEvents);
    }

    this.logger.info(`${this.tag} Loaded all events`, {
      totalEvents: allEvents.length,
    });
    // readStream already strips seq, so these are pure domain events
    return allEvents.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  private streamDir(streamId: string): string {
    return path.join(this.rootDir, "events", streamId);
  }
}
