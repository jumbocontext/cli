/**
 * DependencyRecordMapper - Maps infrastructure DependencyRecord to application DependencyView.
 *
 * Handles type casting at the infrastructure-application boundary.
 */

import { DependencyView } from "../../../application/context/dependencies/DependencyView.js";
import { DependencyStatusType } from "../../../domain/dependencies/Constants.js";
import { DependencyRecord } from "./DependencyRecord.js";

export class DependencyRecordMapper {
  toView(record: DependencyRecord): DependencyView {
    const packageName = record.packageName ?? record.providerId ?? "unknown";
    const ecosystem =
      record.ecosystem ?? (record.providerId ? "legacy-component" : "unknown");
    return {
      dependencyId: record.id,
      name: record.name ?? packageName,
      ecosystem,
      packageName,
      versionConstraint: record.versionConstraint,
      endpoint: record.endpoint,
      contract: record.contract,
      status: record.status as DependencyStatusType,
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      removedAt: record.removedAt,
      removalReason: record.removalReason,
    };
  }
}
