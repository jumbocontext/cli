import fs from "fs-extra";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { jest } from "@jest/globals";
import { FsDecisionRemovedEventStore } from "../../../../../src/infrastructure/context/decisions/remove/FsDecisionRemovedEventStore.js";
import { Decision } from "../../../../../src/domain/decisions/Decision.js";
import type { ILogger } from "../../../../../src/application/logging/ILogger.js";

describe("FsDecisionRemovedEventStore", () => {
  let directory: string;
  beforeEach(async () => { directory = await fs.mkdtemp(join(tmpdir(), "decision-remove-store-")); });
  afterEach(async () => { await fs.remove(directory); });

  it("appends removal to existing history and reads pure domain events", async () => {
    const logger: ILogger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const store = new FsDecisionRemovedEventStore(directory, logger);
    const decision = Decision.create();
    const added = decision.add("Use SQLite", "Need local storage");
    await store.append(added);
    const event = decision.remove();
    expect(await store.append(event)).toEqual({ nextSeq: 2 });
    const history = await store.readStream(event.aggregateId);
    expect(history).toEqual([added, event]);
    expect(history[1]).not.toHaveProperty("seq");
    expect(Decision.rehydrate(event.aggregateId, history).snapshot).toEqual(decision.snapshot);
    expect(await store.getAllEvents()).toEqual(history);
  });
});
