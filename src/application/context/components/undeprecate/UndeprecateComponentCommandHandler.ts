import { UndeprecateComponentCommand } from "./UndeprecateComponentCommand.js";
import { IComponentUndeprecatedEventWriter } from "./IComponentUndeprecatedEventWriter.js";
import { IComponentUndeprecateReader } from "./IComponentUndeprecateReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Component } from "../../../../domain/components/Component.js";
import { ComponentEvent } from "../../../../domain/components/EventIndex.js";

export class UndeprecateComponentCommandHandler {
  constructor(
    private readonly eventWriter: IComponentUndeprecatedEventWriter,
    private readonly eventBus: IEventBus,
    private readonly reader: IComponentUndeprecateReader,
  ) {}

  async execute(
    command: UndeprecateComponentCommand,
  ): Promise<{ componentId: string }> {
    const existing = await this.reader.findById(command.componentId);
    if (!existing) {
      throw new Error(`Component not found: ${command.componentId}`);
    }

    const history = await this.eventWriter.readStream(command.componentId);
    const component = Component.rehydrate(
      command.componentId,
      history as ComponentEvent[],
    );

    const event = component.undeprecate(command.reason);

    await this.eventWriter.append(event);
    await this.eventBus.publish(event);

    return { componentId: command.componentId };
  }
}
