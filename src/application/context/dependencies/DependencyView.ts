/**
 * DependencyView
 *
 * Read model for querying dependency data.
 * Represents the materialized view of a dependency aggregate.
 */

import { DependencyStatusType } from "../../../domain/dependencies/Constants.js";

export interface DependencyView {
  dependencyId: string;
  name: string;
  ecosystem: string;
  packageName: string;
  versionConstraint: string | null;
  endpoint: string | null;
  contract: string | null;
  status: DependencyStatusType;
  version: number;
  createdAt: string;
  updatedAt: string;
  removedAt: string | null; // When it was removed
  removalReason: string | null; // Why it was removed
}
