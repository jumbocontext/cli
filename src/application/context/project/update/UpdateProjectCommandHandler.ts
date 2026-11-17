/**
 * UpdateProjectCommandHandler - Command handler for project updates.
 *
 * This handler:
 * 1. Validates preconditions (project is initialized)
 * 2. Rehydrates the Project aggregate from event store
 * 3. Executes domain logic (update)
 * 4. Persists event to event store (if changes detected)
 * 5. Publishes event to event bus for projection updates
 */

import { UpdateProjectCommand } from "./UpdateProjectCommand.js";
import { IProjectUpdatedEventWriter } from "./IProjectUpdatedEventWriter.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { IProjectUpdateReader } from "./IProjectUpdateReader.js";
import { IProjectIdentityResolver } from "../../../identity/IProjectIdentityResolver.js";
import { Project } from "../../../../domain/project/Project.js";
import { ProjectErrorMessages } from "../../../../domain/project/Constants.js";

export class UpdateProjectCommandHandler {
  constructor(
    private readonly eventWriter: IProjectUpdatedEventWriter,
    private readonly eventBus: IEventBus,
    private readonly reader: IProjectUpdateReader,
    private readonly projectIdentityResolver: IProjectIdentityResolver,
  ) {}

  async execute(command: UpdateProjectCommand): Promise<{
    updated: boolean;
    changedFields: string[];
  }> {
    // 1. Check if project exists
    const existingView = await this.reader.getProject();
    if (!existingView) {
      throw new Error(ProjectErrorMessages.NOT_INITIALIZED);
    }

    // 2. Rehydrate aggregate from event history
    const projectId =
      await this.projectIdentityResolver.resolveExistingProjectId(
        existingView.projectId,
        async (candidateProjectId) =>
          (await this.eventWriter.readStream(candidateProjectId)).length > 0,
      );
    const history = await this.eventWriter.readStream(projectId);
    const project = Project.rehydrate(projectId, history);

    // 3. Domain logic produces event (or null if no changes)
    const event = project.update(command.purpose);

    // 4. If no changes, return early (idempotent)
    if (!event) {
      return { updated: false, changedFields: [] };
    }

    // 5. Persist event to file store
    await this.eventWriter.append(event);

    // 6. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    // 7. Return which fields changed
    const changedFields = Object.keys(event.payload);
    return { updated: true, changedFields };
  }
}
