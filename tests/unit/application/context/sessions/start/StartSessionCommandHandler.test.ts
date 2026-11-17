/**
 * Tests for StartSessionCommandHandler
 */

import { StartSessionCommandHandler } from "../../../../../../src/application/context/sessions/start/StartSessionCommandHandler";
import { ISessionStartedEventWriter } from "../../../../../../src/application/context/sessions/start/ISessionStartedEventWriter";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { SessionEvent } from "../../../../../../src/domain/sessions/EventIndex";
import { BaseEvent } from "../../../../../../src/domain/BaseEvent";
import { IEventHandler } from "../../../../../../src/application/messaging/IEventHandler";
import { AppendResult } from "../../../../../../src/application/persistence/IEventStore";

// Mock implementations
class MockSessionEventWriter implements ISessionStartedEventWriter {
  events: SessionEvent[] = [];

  async append(
    event: BaseEvent
  ): Promise<AppendResult> {
    this.events.push(event as SessionEvent);
    return { nextSeq: this.events.length };
  }
}

class MockEventBus implements IEventBus {
  publishedEvents: BaseEvent[] = [];
  handlers: Map<string, IEventHandler[]> = new Map();

  subscribe(eventType: string, handler: IEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async publish(event: BaseEvent): Promise<void> {
    this.publishedEvents.push(event);
    const handlers = this.handlers.get(event.type) || [];
    for (const handler of handlers) {
      await handler.handle(event);
    }
  }
}

describe("StartSessionCommandHandler", () => {
  let eventWriter: MockSessionEventWriter;
  let eventBus: MockEventBus;
  let handler: StartSessionCommandHandler;

  beforeEach(() => {
    eventWriter = new MockSessionEventWriter();
    eventBus = new MockEventBus();
    handler = new StartSessionCommandHandler(eventWriter, eventBus);
  });

  it("should create a new session and return session ID", async () => {
    // Arrange
    const command = {};

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.sessionId).toBeDefined();
    expect(result.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("should persist SessionStarted event to event store", async () => {
    // Arrange
    const command = {};

    // Act
    await handler.execute(command);

    // Assert
    expect(eventWriter.events).toHaveLength(1);
    expect(eventWriter.events[0].type).toBe("SessionStartedEvent");
    const event = eventWriter.events[0];
    expect(event.payload).toEqual({});
  });

  it("should publish SessionStarted event to event bus", async () => {
    // Arrange
    const command = {};

    // Act
    await handler.execute(command);

    // Assert
    expect(eventBus.publishedEvents).toHaveLength(1);
    expect(eventBus.publishedEvents[0].type).toBe("SessionStartedEvent");
  });
});
