import { AddComponentCommand } from "./AddComponentCommand.js";
import { IComponentAddedEventWriter } from "./IComponentAddedEventWriter.js";
import { IComponentAddReader } from "./IComponentAddReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Component } from "../../../../domain/components/Component.js";
import { ComponentEvent } from "../../../../domain/components/EventIndex.js";

export class AddComponentCommandHandler {
  constructor(
    private readonly eventWriter: IComponentAddedEventWriter,
    private readonly eventBus: IEventBus,
    private readonly reader: IComponentAddReader,
  ) {}

  async execute(
    command: AddComponentCommand,
  ): Promise<{ componentId: string }> {
    // Check if component with same name already exists
    const existing = await this.reader.findByName(command.name);

    let componentId: string;
    let event;

    if (existing) {
      // Update existing component (idempotent behavior)
      componentId = existing.componentId;
      const history = await this.eventWriter.readStream(componentId);
      const component = Component.rehydrate(
        componentId,
        history as ComponentEvent[],
      );

      event = component.update(
        command.description,
        command.responsibility,
        command.path,
        command.type,
      );
    } else {
      // Create new component
      const component = Component.create();
      componentId = component.snapshot.id;

      event = component.add(
        command.name,
        command.type,
        command.description,
        command.responsibility,
        command.path,
      );
    }

    // Persist event
    await this.eventWriter.append(event);

    // Publish to event bus
    await this.eventBus.publish(event);

    return { componentId };
  }
}
