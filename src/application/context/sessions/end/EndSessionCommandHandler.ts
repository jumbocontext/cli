import { EndSessionCommand } from "./EndSessionCommand.js";
import { ISessionEndedEventWriter } from "./ISessionEndedEventWriter.js";
import { ISessionEndedEventReader } from "./ISessionEndedEventReader.js";
import { IActiveSessionReader } from "./IActiveSessionReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Session } from "../../../../domain/sessions/Session.js";
import { SessionEvent } from "../../../../domain/sessions/EventIndex.js";
import { SessionErrorMessages } from "../../../../domain/sessions/Constants.js";

/**
 * Handles ending the current active session.
 * Loads session from event history, produces SessionEnded event, persists and publishes.
 */
export class EndSessionCommandHandler {
  constructor(
    private readonly eventWriter: ISessionEndedEventWriter,
    private readonly eventReader: ISessionEndedEventReader,
    private readonly activeSessionReader: IActiveSessionReader,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: EndSessionCommand): Promise<{ sessionId: string }> {
    // 1. Find active session
    const activeSession = await this.activeSessionReader.findActive();
    if (!activeSession) {
      throw new Error(SessionErrorMessages.NO_ACTIVE_SESSION);
    }

    // 2. Rehydrate session from event store
    const history = await this.eventReader.readStream(activeSession.sessionId);
    const session = Session.rehydrate(
      activeSession.sessionId,
      history as SessionEvent[],
    );

    // 3. Domain logic produces event
    const event = session.end(command.focus, command.summary);

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { sessionId: activeSession.sessionId };
  }
}
