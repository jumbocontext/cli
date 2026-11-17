import { WorkerIdentifiedEventHandler } from "../../../../../../src/application/host/workers/identify/WorkerIdentifiedEventHandler";
import { IWorkerIdentifiedProjector } from "../../../../../../src/application/host/workers/identify/IWorkerIdentifiedProjector";
import { WorkerEventType, WorkerIdentifiedEvent } from "../../../../../../src/domain/workers/identify/WorkerIdentifiedEvent";
import { jest } from "@jest/globals";

describe("WorkerIdentifiedEventHandler", () => {
  let projector: jest.Mocked<IWorkerIdentifiedProjector>;
  let handler: WorkerIdentifiedEventHandler;

  beforeEach(() => {
    projector = {
      applyWorkerIdentified: jest.fn().mockResolvedValue(undefined),
    };
    handler = new WorkerIdentifiedEventHandler(projector);
  });

  it("should delegate to projector with typed event", async () => {
    const event: WorkerIdentifiedEvent = {
      type: WorkerEventType.IDENTIFIED,
      aggregateId: "worker_123",
      version: 1,
      timestamp: "2026-03-01T10:00:00.000Z",
      payload: {
        hostSessionKey: "session-key-abc",
        mode: null,
      },
    };

    await handler.handle(event);

    expect(projector.applyWorkerIdentified).toHaveBeenCalledTimes(1);
    expect(projector.applyWorkerIdentified).toHaveBeenCalledWith(event);
  });
});
