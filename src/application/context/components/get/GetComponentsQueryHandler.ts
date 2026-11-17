/**
 * GetComponentsQueryHandler - Query handler for listing software components.
 *
 * This is a standard CQRS query handler that provides read access to
 * the Component projection for listing purposes with optional filtering.
 *
 * Usage:
 *   const query = new GetComponentsQueryHandler(componentViewReader);
 *   const components = await query.execute();
 *   const activeComponents = await query.execute("active");
 *
 * Returns:
 *   - Array of ComponentView ordered by name
 *   - Empty array if no components exist
 */

import {
  IComponentViewReader,
  ComponentStatusFilter,
} from "./IComponentViewReader.js";
import { ComponentView } from "../ComponentView.js";

export class GetComponentsQueryHandler {
  constructor(private readonly componentViewReader: IComponentViewReader) {}

  /**
   * Execute query to retrieve components.
   *
   * @param status - Optional filter by status ("active", "deprecated", "removed", "all")
   * @returns Array of ComponentView sorted by name
   */
  async execute(
    status: ComponentStatusFilter = "all",
  ): Promise<ComponentView[]> {
    return this.componentViewReader.findAll(status);
  }
}
