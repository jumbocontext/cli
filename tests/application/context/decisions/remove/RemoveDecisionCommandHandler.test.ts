import { jest } from "@jest/globals";
import { RemoveDecisionCommandHandler } from "../../../../../src/application/context/decisions/remove/RemoveDecisionCommandHandler.js";
import type { IDecisionRemovedEventWriter } from "../../../../../src/application/context/decisions/remove/IDecisionRemovedEventWriter.js";
import type { IDecisionViewReader } from "../../../../../src/application/context/decisions/get/IDecisionViewReader.js";
import type { IEventBus } from "../../../../../src/application/messaging/IEventBus.js";
import { Decision } from "../../../../../src/domain/decisions/Decision.js";
import type { DecisionEvent } from "../../../../../src/domain/decisions/EventIndex.js";
import { DecisionEventType, DecisionStatus, DecisionErrorMessages } from "../../../../../src/domain/decisions/Constants.js";

function setup() {
  const decision = Decision.create();
  const added = decision.add("Use SQLite", "Need local storage");
  const history: DecisionEvent[] = [added];
  const writer = {
    append: jest.fn<IDecisionRemovedEventWriter["append"]>().mockResolvedValue({ nextSeq: 2 }),
    readStream: jest.fn<IDecisionRemovedEventWriter["readStream"]>().mockResolvedValue(history),
  };
  const reader = {
    findByIds: jest.fn<IDecisionViewReader["findByIds"]>().mockResolvedValue([{
      ...decision.snapshot, decisionId: added.aggregateId, createdAt: added.timestamp, updatedAt: added.timestamp,
    }]),
    findAll: jest.fn<IDecisionViewReader["findAll"]>(),
    search: jest.fn<IDecisionViewReader["search"]>(),
  };
  const bus = { publish: jest.fn<IEventBus["publish"]>().mockResolvedValue(undefined), subscribe: jest.fn<IEventBus["subscribe"]>() };
  return { decision, history, writer, reader, bus, handler: new RemoveDecisionCommandHandler(writer, reader, bus), command: { decisionId: added.aggregateId } };
}

describe("RemoveDecisionCommandHandler", () => {
  it.each([DecisionStatus.ACTIVE, DecisionStatus.REVERSED, DecisionStatus.SUPERSEDED])("rehydrates %s, persists, then publishes the same removal event", async status => {
    const { decision, history, writer, reader, bus, handler, command } = setup();
    if (status === DecisionStatus.REVERSED) history.push(decision.reverse("Changed"));
    if (status === DecisionStatus.SUPERSEDED) history.push(decision.supersede("dec_other"));
    const order: string[] = [];
    writer.append.mockImplementation(async () => { order.push("append"); return { nextSeq: history.length + 1 }; });
    bus.publish.mockImplementation(async () => { order.push("publish"); });
    expect(await handler.execute(command)).toEqual(command);
    expect(reader.findByIds).toHaveBeenCalledWith([command.decisionId]);
    expect(writer.readStream).toHaveBeenCalledWith(command.decisionId);
    const event = writer.append.mock.calls[0][0];
    expect(event).toMatchObject({ type: DecisionEventType.REMOVED, aggregateId: command.decisionId, version: history.length + 1, payload: { status: DecisionStatus.REMOVED } });
    expect(bus.publish).toHaveBeenCalledWith(event);
    expect(order).toEqual(["append", "publish"]);
  });

  it("rejects a missing decision without reading or writing history", async () => {
    const { writer, reader, bus, handler, command } = setup();
    reader.findByIds.mockResolvedValue([]);
    await expect(handler.execute(command)).rejects.toThrow();
    expect(writer.readStream).not.toHaveBeenCalled();
    expect(writer.append).not.toHaveBeenCalled();
    expect(bus.publish).not.toHaveBeenCalled();
  });

  it("rejects already removed history even if its projection is stale", async () => {
    const { decision, history, writer, bus, handler, command } = setup();
    history.push(decision.remove());
    await expect(handler.execute(command)).rejects.toThrow(DecisionErrorMessages.ALREADY_REMOVED);
    expect(writer.append).not.toHaveBeenCalled();
    expect(bus.publish).not.toHaveBeenCalled();
  });

  it("does not publish when persistence fails", async () => {
    const { writer, bus, handler, command } = setup();
    const failure = new Error("Storage unavailable");
    writer.append.mockRejectedValue(failure);
    await expect(handler.execute(command)).rejects.toBe(failure);
    expect(bus.publish).not.toHaveBeenCalled();
  });
});
