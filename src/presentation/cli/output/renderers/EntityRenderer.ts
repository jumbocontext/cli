import { Annotation } from "../Annotation.js";

/**
 * Strategy interface for rendering specific entity types.
 * Each entity type (Invariant, Component, etc.) gets its own renderer.
 */
export interface EntityRenderer<T> {
  /**
   * Format entity as human-readable text
   */
  toHumanReadable(entity: T): string;

  /**
   * Format entity for JSON output
   */
  toJSON(entity: T): unknown;

  /**
   * Get the default annotation for this entity type (optional)
   */
  getDefaultAnnotation?(): Annotation;

  /**
   * Get the default group header for collections of this entity type
   */
  getGroupHeader?(): string;
}
