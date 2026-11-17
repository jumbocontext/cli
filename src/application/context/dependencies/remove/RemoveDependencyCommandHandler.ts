import { RemoveDependencyCommand } from "./RemoveDependencyCommand.js";
import { IDependencyRemovedEventWriter } from "./IDependencyRemovedEventWriter.js";
import { IDependencyRemovedEventReader } from "./IDependencyRemovedEventReader.js";
import { IDependencyRemoveReader } from "./IDependencyRemoveReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Dependency } from "../../../../domain/dependencies/Dependency.js";
import {
  DependencyErrorMessages,
  formatErrorMessage,
} from "../../../../domain/dependencies/Constants.js";

/**
 * Application layer command handler for removing a dependency.
 * Orchestrates: load aggregate - domain logic - persist event - publish to bus
 */
export class RemoveDependencyCommandHandler {
  constructor(
    private readonly eventWriter: IDependencyRemovedEventWriter,
    private readonly eventReader: IDependencyRemovedEventReader,
    private readonly dependencyReader: IDependencyRemoveReader,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    command: RemoveDependencyCommand,
  ): Promise<{ dependencyId: string }> {
    // 1. Check if dependency exists
    const existingView = await this.dependencyReader.findById(
      command.dependencyId,
    );
    if (!existingView) {
      throw new Error(
        formatErrorMessage(DependencyErrorMessages.NOT_FOUND, {
          id: command.dependencyId,
        }),
      );
    }

    // 2. Load aggregate from event history
    const history = await this.eventReader.readStream(command.dependencyId);
    const dependency = Dependency.rehydrate(command.dependencyId, history);

    // 3. Domain logic produces event
    const event = dependency.remove(command.reason);

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { dependencyId: command.dependencyId };
  }
}
