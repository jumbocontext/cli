/**
 * GetDependenciesQueryHandler - Query handler for listing component dependencies.
 *
 * This is a standard CQRS query handler that provides read access to
 * the Dependency projection for listing purposes with optional filtering.
 *
 * Usage:
 *   const query = new GetDependenciesQueryHandler(dependencyViewReader);
 *   const dependencies = await query.execute();
 *   const filteredDeps = await query.execute({ consumer: "UserService" });
 *
 * Returns:
 *   - Array of DependencyView ordered by creation date (newest first)
 *   - Empty array if no dependencies exist
 */

import {
  IDependencyViewReader,
  DependencyListFilter,
} from "./IDependencyViewReader.js";
import { DependencyView } from "../DependencyView.js";

export class GetDependenciesQueryHandler {
  constructor(private readonly dependencyViewReader: IDependencyViewReader) {}

  /**
   * Execute query to retrieve dependencies.
   *
   * @param filter - Optional filter by consumer or provider component
   * @returns Array of DependencyView sorted by creation date (newest first)
   */
  async execute(filter?: DependencyListFilter): Promise<DependencyView[]> {
    return this.dependencyViewReader.findAll(filter);
  }
}
