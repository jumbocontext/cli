import { StartSessionCommand } from "./StartSessionCommand.js";
import { ISessionStartedEventWriter } from "./ISessionStartedEventWriter.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Session } from "../../../../domain/sessions/Session.js";

/**
 * Handles starting a new session.
 * Creates a new session aggregate, produces SessionStarted event, persists and publishes.
 */
export class StartSessionCommandHandler {
  constructor(
    private readonly eventWriter: ISessionStartedEventWriter,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: StartSessionCommand): Promise<{ sessionId: string }> {
    // Create new aggregate
    const session = Session.create();
    const sessionId = session.snapshot.id;

    // Domain logic produces event
    const event = session.start();

    // Persist event to file store
    await this.eventWriter.append(event);

    // Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { sessionId };
  }
}
