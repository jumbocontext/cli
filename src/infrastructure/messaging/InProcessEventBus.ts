/**
 * In-process event bus implementation using Map-based routing.
 * Provides pub/sub pattern for decoupling event publishers from handlers.
 *
 * Features:
 * - Subscribe handlers to specific event types or wildcard '*'
 * - Publish events to all matching handlers
 * - Parallel handler execution via Promise.all()
 * - Error isolation (handler failures logged but don't block other handlers)
 */

import { IEventBus } from "../../application/messaging/IEventBus.js";
import { IEventHandler } from "../../application/messaging/IEventHandler.js";
import { BaseEvent } from "../../domain/BaseEvent.js";

export class InProcessEventBus implements IEventBus {
  private handlers = new Map<string, IEventHandler[]>();

  subscribe(eventType: string, handler: IEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async publish(event: BaseEvent): Promise<void> {
    // Get handlers for specific event type
    const specificHandlers = this.handlers.get(event.type) || [];

    // Get wildcard handlers (subscribe to all events)
    const wildcardHandlers = this.handlers.get("*") || [];

    // Combine all matching handlers
    const allHandlers = [...specificHandlers, ...wildcardHandlers];

    // Execute all handlers in parallel
    await Promise.all(
      allHandlers.map((handler) =>
        handler.handle(event).catch((err) => {
          // Log error but don't throw - projections can be rebuilt
          console.error(`Handler error for event ${event.type}:`, err);
        }),
      ),
    );
  }
}
