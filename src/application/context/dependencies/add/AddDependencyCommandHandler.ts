import { AddDependencyCommand } from "./AddDependencyCommand.js";
import { IDependencyAddedEventWriter } from "./IDependencyAddedEventWriter.js";
import { IDependencyAddReader } from "./IDependencyAddReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Dependency } from "../../../../domain/dependencies/Dependency.js";

/**
 * Command handler for AddDependencyCommand.
 * Orchestrates the creation of a new dependency aggregate and event publication.
 */
export class AddDependencyCommandHandler {
  constructor(
    private readonly eventWriter: IDependencyAddedEventWriter,
    private readonly eventBus: IEventBus,
    private readonly dependencyReader: IDependencyAddReader,
  ) {}

  async execute(
    command: AddDependencyCommand,
  ): Promise<{ dependencyId: string }> {
    const identity = this.resolveIdentity(command);

    const existingDependency = await this.dependencyReader.findByIdentity(
      identity.ecosystem,
      identity.packageName,
    );
    if (existingDependency) {
      return { dependencyId: existingDependency.dependencyId };
    }

    // 1. Create new aggregate
    const dependency = Dependency.create();
    const dependencyId = dependency.snapshot.id;

    // 2. Domain logic produces event
    const event = dependency.add(
      identity.name,
      identity.ecosystem,
      identity.packageName,
      identity.versionConstraint,
      command.endpoint,
      command.contract,
    );

    // 3. Persist event to file store
    await this.eventWriter.append(event);

    // 4. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { dependencyId };
  }

  private resolveIdentity(command: AddDependencyCommand): {
    name: string;
    ecosystem: string;
    packageName: string;
    versionConstraint: string | null;
  } {
    if (!command.name || !command.ecosystem || !command.packageName) {
      throw new Error(
        "Dependency identity is required. Provide name/ecosystem/packageName.",
      );
    }

    return {
      name: command.name,
      ecosystem: command.ecosystem,
      packageName: command.packageName,
      versionConstraint: command.versionConstraint ?? null,
    };
  }
}
