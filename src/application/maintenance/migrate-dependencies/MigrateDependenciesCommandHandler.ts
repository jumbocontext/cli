import { MigrateDependenciesCommand } from "./MigrateDependenciesCommand.js";
import {
  MigrateDependenciesResponse,
  ConvertedDependency,
  SkippedDependency,
} from "./MigrateDependenciesResponse.js";
import { ILegacyDependencyReader } from "./ILegacyDependencyReader.js";
import { AddRelationCommandHandler } from "../../context/relations/add/AddRelationCommandHandler.js";
import { RemoveDependencyCommandHandler } from "../../context/dependencies/remove/RemoveDependencyCommandHandler.js";
import { EntityType } from "../../../domain/relations/Constants.js";

const MIGRATION_REMOVAL_REASON = "Migrated to component relation";

/**
 * Handles migration of legacy component-coupling dependencies into relations.
 *
 * For each legacy dependency (consumerId → providerId), creates an equivalent
 * component-to-component relation with type "depends_on" and removes the
 * legacy dependency record.
 *
 * Idempotency: AddRelationCommandHandler returns existing relation if duplicate.
 * Already-removed dependencies are skipped. Reruns produce zero conversions.
 */
export class MigrateDependenciesCommandHandler {
  constructor(
    private readonly legacyReader: ILegacyDependencyReader,
    private readonly addRelationHandler: AddRelationCommandHandler,
    private readonly removeDependencyHandler: RemoveDependencyCommandHandler,
  ) {}

  async handle(
    command: MigrateDependenciesCommand,
  ): Promise<MigrateDependenciesResponse> {
    const dryRun = command.dryRun ?? false;
    const candidates = await this.legacyReader.findLegacyCouplings();

    const converted: ConvertedDependency[] = [];
    const skipped: SkippedDependency[] = [];

    for (const candidate of candidates) {
      if (candidate.status === "removed") {
        skipped.push({
          dependencyId: candidate.dependencyId,
          reason: "Already removed",
        });
        continue;
      }

      if (!candidate.consumerId || !candidate.providerId) {
        skipped.push({
          dependencyId: candidate.dependencyId,
          reason: "Missing consumerId or providerId",
        });
        continue;
      }

      if (dryRun) {
        converted.push({
          dependencyId: candidate.dependencyId,
          relationId: "(dry run)",
          fromEntityId: candidate.consumerId,
          toEntityId: candidate.providerId,
        });
        continue;
      }

      const { relationId } = await this.addRelationHandler.execute({
        fromEntityType: EntityType.COMPONENT,
        fromEntityId: candidate.consumerId,
        toEntityType: EntityType.COMPONENT,
        toEntityId: candidate.providerId,
        relationType: "depends_on",
        description: `Migrated from legacy dependency: ${candidate.consumerId} depends on ${candidate.providerId}.`,
      });

      await this.removeDependencyHandler.execute({
        dependencyId: candidate.dependencyId,
        reason: MIGRATION_REMOVAL_REASON,
      });

      converted.push({
        dependencyId: candidate.dependencyId,
        relationId,
        fromEntityId: candidate.consumerId,
        toEntityId: candidate.providerId,
      });
    }

    return {
      converted,
      skipped,
      totalLegacy: candidates.length,
      dryRun,
    };
  }
}
