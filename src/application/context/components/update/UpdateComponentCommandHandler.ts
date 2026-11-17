import { UpdateComponentCommand } from "./UpdateComponentCommand.js";
import { IComponentUpdatedEventWriter } from "./IComponentUpdatedEventWriter.js";
import { IComponentUpdateReader } from "./IComponentUpdateReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Component } from "../../../../domain/components/Component.js";
import { ComponentEvent } from "../../../../domain/components/EventIndex.js";

export class UpdateComponentCommandHandler {
  constructor(
    private readonly eventWriter: IComponentUpdatedEventWriter,
    private readonly eventBus: IEventBus,
    private readonly reader: IComponentUpdateReader,
  ) {}

  async execute(
    command: UpdateComponentCommand,
  ): Promise<{ componentId: string }> {
    // 1. Check component exists
    const existing = await this.reader.findById(command.componentId);
    if (!existing) {
      throw new Error(`Component not found: ${command.componentId}`);
    }

    // 2. Rehydrate aggregate from event history
    const history = await this.eventWriter.readStream(command.componentId);
    const component = Component.rehydrate(
      command.componentId,
      history as ComponentEvent[],
    );

    // 3. Domain logic produces event
    const event = component.update(
      command.description,
      command.responsibility,
      command.path,
      command.type,
    );

    // 4. Persist event
    await this.eventWriter.append(event);

    // 5. Publish to event bus
    await this.eventBus.publish(event);

    return { componentId: command.componentId };
  }
}
