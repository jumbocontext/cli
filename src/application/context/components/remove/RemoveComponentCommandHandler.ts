import { RemoveComponentCommand } from "./RemoveComponentCommand.js";
import { IComponentRemovedEventWriter } from "./IComponentRemovedEventWriter.js";
import { IComponentRemoveReader } from "./IComponentRemoveReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Component } from "../../../../domain/components/Component.js";
import { ComponentEvent } from "../../../../domain/components/EventIndex.js";

export class RemoveComponentCommandHandler {
  constructor(
    private readonly eventWriter: IComponentRemovedEventWriter,
    private readonly eventBus: IEventBus,
    private readonly reader: IComponentRemoveReader,
  ) {}

  async execute(
    command: RemoveComponentCommand,
  ): Promise<{ componentId: string; name: string }> {
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
    const event = component.remove();

    // 4. Persist event
    await this.eventWriter.append(event);

    // 5. Publish to event bus
    await this.eventBus.publish(event);

    return { componentId: command.componentId, name: existing.name };
  }
}
