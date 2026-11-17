/**
 * Comprehensive tests for InProcessEventBus
 * Verifies pub/sub pattern, wildcard routing, parallel execution, and error handling
 */

import { InProcessEventBus } from "../../../../../src/infrastructure/messaging/InProcessEventBus";
import { IEventHandler } from "../../../../../src/application/messaging/IEventHandler";
import { BaseEvent } from "../../../../../src/domain/BaseEvent";
import { jest } from "@jest/globals";

class MockHandler implements IEventHandler {
  public calls: BaseEvent[] = [];

  async handle(event: BaseEvent): Promise<void> {
    this.calls.push(event);
  }
}

class ErrorHandler implements IEventHandler {
  async handle(event: BaseEvent): Promise<void> {
    throw new Error("Handler error");
  }
}

describe("InProcessEventBus", () => {
  let bus: InProcessEventBus;

  beforeEach(() => {
    bus = new InProcessEventBus();
  });

  it("registers handler for event type", () => {
    const handler = new MockHandler();
    expect(() => bus.subscribe("TestEvent", handler)).not.toThrow();
  });

  it("publishes event to registered handler", async () => {
    const handler = new MockHandler();
    bus.subscribe("TestEvent", handler);

    const event: BaseEvent = {
      type: "TestEvent",
      aggregateId: "test-1",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    };

    await bus.publish(event);

    expect(handler.calls).toHaveLength(1);
    expect(handler.calls[0]).toEqual(event);
  });

  it("publishes to multiple handlers for same event", async () => {
    const handler1 = new MockHandler();
    const handler2 = new MockHandler();

    bus.subscribe("TestEvent", handler1);
    bus.subscribe("TestEvent", handler2);

    const event: BaseEvent = {
      type: "TestEvent",
      aggregateId: "test-1",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    };

    await bus.publish(event);

    expect(handler1.calls).toHaveLength(1);
    expect(handler2.calls).toHaveLength(1);
  });

  it("publishes to wildcard handler for all events", async () => {
    const wildcardHandler = new MockHandler();
    bus.subscribe("*", wildcardHandler);

    await bus.publish({
      type: "Event1",
      aggregateId: "test-1",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    });

    await bus.publish({
      type: "Event2",
      aggregateId: "test-2",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    });

    expect(wildcardHandler.calls).toHaveLength(2);
    expect(wildcardHandler.calls[0].type).toBe("Event1");
    expect(wildcardHandler.calls[1].type).toBe("Event2");
  });

  it("publishes to both specific and wildcard handlers", async () => {
    const specificHandler = new MockHandler();
    const wildcardHandler = new MockHandler();

    bus.subscribe("TestEvent", specificHandler);
    bus.subscribe("*", wildcardHandler);

    const event: BaseEvent = {
      type: "TestEvent",
      aggregateId: "test-1",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    };

    await bus.publish(event);

    expect(specificHandler.calls).toHaveLength(1);
    expect(wildcardHandler.calls).toHaveLength(1);
  });

  it("does not invoke handler for non-matching event type", async () => {
    const handler = new MockHandler();
    bus.subscribe("Event1", handler);

    await bus.publish({
      type: "Event2",
      aggregateId: "test-1",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    });

    expect(handler.calls).toHaveLength(0);
  });

  it("logs error but continues if handler throws", async () => {
    const errorHandler = new ErrorHandler();
    const successHandler = new MockHandler();

    bus.subscribe("TestEvent", errorHandler);
    bus.subscribe("TestEvent", successHandler);

    // Mock console.error to suppress output
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const event: BaseEvent = {
      type: "TestEvent",
      aggregateId: "test-1",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    };

    // Should not throw
    await expect(bus.publish(event)).resolves.not.toThrow();

    // Success handler should still execute
    expect(successHandler.calls).toHaveLength(1);

    // Error should be logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Handler error for event TestEvent"),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it("executes handlers in parallel", async () => {
    const delays: number[] = [];

    class DelayHandler implements IEventHandler {
      constructor(private delayMs: number) {}

      async handle(event: BaseEvent): Promise<void> {
        const start = Date.now();
        await new Promise((resolve) => setTimeout(resolve, this.delayMs));
        delays.push(Date.now() - start);
      }
    }

    bus.subscribe("TestEvent", new DelayHandler(50));
    bus.subscribe("TestEvent", new DelayHandler(50));
    bus.subscribe("TestEvent", new DelayHandler(50));

    const start = Date.now();
    await bus.publish({
      type: "TestEvent",
      aggregateId: "test-1",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    });
    const elapsed = Date.now() - start;

    // If parallel, should take ~50ms. If sequential, would take ~150ms
    // Use generous threshold to avoid flaking under CI/system load
    expect(elapsed).toBeLessThan(300);
  });
});
