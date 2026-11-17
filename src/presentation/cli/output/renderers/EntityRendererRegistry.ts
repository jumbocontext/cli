import { EntityRenderer } from "./EntityRenderer.js";

/**
 * Registry for entity renderers.
 * Maps renderer type strings to renderer instances.
 */
export class EntityRendererRegistry {
  private renderers = new Map<string, EntityRenderer<unknown>>();

  register<T>(type: string, renderer: EntityRenderer<T>): void {
    this.renderers.set(type, renderer as EntityRenderer<unknown>);
  }

  get<T>(type: string): EntityRenderer<T> | undefined {
    return this.renderers.get(type) as EntityRenderer<T> | undefined;
  }

  has(type: string): boolean {
    return this.renderers.has(type);
  }
}
