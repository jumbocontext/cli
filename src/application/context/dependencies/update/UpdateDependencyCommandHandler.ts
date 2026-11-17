import { UpdateDependencyCommand } from "./UpdateDependencyCommand.js";
import { IDependencyUpdatedEventWriter } from "./IDependencyUpdatedEventWriter.js";
import { IDependencyUpdatedEventReader } from "./IDependencyUpdatedEventReader.js";
import { IDependencyUpdateReader } from "./IDependencyUpdateReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Dependency } from "../../../../domain/dependencies/Dependency.js";
import {
  DependencyErrorMessages,
  formatErrorMessage,
} from "../../../../domain/dependencies/Constants.js";

/**
 * Application layer command handler for updating a dependency.
 * Orchestrates: load aggregate - domain logic - persist event - publish to bus
 */
export class UpdateDependencyCommandHandler {
  constructor(
    private readonly eventWriter: IDependencyUpdatedEventWriter,
    private readonly eventReader: IDependencyUpdatedEventReader,
    private readonly dependencyReader: IDependencyUpdateReader,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    command: UpdateDependencyCommand,
  ): Promise<{ dependencyId: string }> {
    // 1. Check if dependency exists
    const existingView = await this.dependencyReader.findById(command.id);
    if (!existingView) {
      throw new Error(
        formatErrorMessage(DependencyErrorMessages.NOT_FOUND, {
          id: command.id,
        }),
      );
    }

    // 2. Rehydrate aggregate from event store
    const history = await this.eventReader.readStream(command.id);
    const dependency = Dependency.rehydrate(command.id, history);

    // 3. Domain logic produces event
    const event = dependency.update(
      command.endpoint,
      command.contract,
      command.status,
    );

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus
    await this.eventBus.publish(event);

    return { dependencyId: command.id };
  }
}
