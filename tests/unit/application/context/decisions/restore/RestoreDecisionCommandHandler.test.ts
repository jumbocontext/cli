import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { RestoreDecisionCommandHandler } from "../../../../../../src/application/context/decisions/restore/RestoreDecisionCommandHandler.js";
import { IDecisionRestoredEventWriter } from "../../../../../../src/application/context/decisions/restore/IDecisionRestoredEventWriter.js";
import { IDecisionRestoreReader } from "../../../../../../src/application/context/decisions/restore/IDecisionRestoreReader.js";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus.js";
import { DecisionEventType } from "../../../../../../src/domain/decisions/Constants.js";

describe("RestoreDecisionCommandHandler", () => {
  let handler: RestoreDecisionCommandHandler;
  let mockEventWriter: jest.Mocked<IDecisionRestoredEventWriter>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockReader: jest.Mocked<IDecisionRestoreReader>;

  const decisionId = "dec_test123";

  beforeEach(() => {
    mockEventWriter = {
      append: jest.fn<IDecisionRestoredEventWriter["append"]>().mockResolvedValue({ nextSeq: 1 }),
      readStream: jest.fn<IDecisionRestoredEventWriter["readStream"]>().mockResolvedValue([
        {
          type: DecisionEventType.ADDED,
          aggregateId: decisionId,
          version: 1,
          timestamp: "2026-03-01T00:00:00.000Z",
          payload: {
            title: "Use SQLite",
            context: "Need local DB",
            rationale: null,
            alternatives: [],
            consequences: null,
          },
        },
        {
          type: DecisionEventType.REVERSED,
          aggregateId: decisionId,
          version: 2,
          timestamp: "2026-03-01T01:00:00.000Z",
          payload: {
            reason: "No longer needed",
            reversedAt: "2026-03-01T01:00:00.000Z",
          },
        },
      ]),
    } as jest.Mocked<IDecisionRestoredEventWriter>;

    mockEventBus = {
      publish: jest.fn<IEventBus["publish"]>().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    } as jest.Mocked<IEventBus>;

    mockReader = {
      findById: jest.fn<IDecisionRestoreReader["findById"]>().mockResolvedValue({
        decisionId,
        title: "Use SQLite",
        context: "Need local DB",
        rationale: null,
        alternatives: [],
        consequences: null,
        status: "reversed",
        supersededBy: null,
        reversalReason: "No longer needed",
        reversedAt: "2026-03-01T01:00:00.000Z",
        version: 2,
        createdAt: "2026-03-01T00:00:00.000Z",
        updatedAt: "2026-03-01T01:00:00.000Z",
      }),
    } as jest.Mocked<IDecisionRestoreReader>;

    handler = new RestoreDecisionCommandHandler(mockEventWriter, mockReader, mockEventBus);
  });

  it("restores decision successfully and emits event", async () => {
    const result = await handler.execute({ decisionId, reason: "Decision still applies" });

    expect(result.decisionId).toBe(decisionId);
    expect(mockEventWriter.append).toHaveBeenCalledWith(
      expect.objectContaining({
        type: DecisionEventType.RESTORED,
        aggregateId: decisionId,
        payload: expect.objectContaining({ reason: "Decision still applies" }),
      })
    );
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: DecisionEventType.RESTORED })
    );
  });

  it("throws when decision does not exist", async () => {
    mockReader.findById.mockResolvedValue(null);

    await expect(handler.execute({ decisionId, reason: "test" })).rejects.toThrow(
      `Decision with ID ${decisionId} not found`
    );
  });
});
