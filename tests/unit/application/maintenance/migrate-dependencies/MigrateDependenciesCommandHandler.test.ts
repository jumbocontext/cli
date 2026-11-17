import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { MigrateDependenciesCommandHandler } from "../../../../../src/application/maintenance/migrate-dependencies/MigrateDependenciesCommandHandler.js";
import { ILegacyDependencyReader } from "../../../../../src/application/maintenance/migrate-dependencies/ILegacyDependencyReader.js";
import { LegacyDependencyCandidate } from "../../../../../src/application/maintenance/migrate-dependencies/LegacyDependencyCandidate.js";
import { AddRelationCommandHandler } from "../../../../../src/application/context/relations/add/AddRelationCommandHandler.js";
import { RemoveDependencyCommandHandler } from "../../../../../src/application/context/dependencies/remove/RemoveDependencyCommandHandler.js";
import { AddRelationCommand } from "../../../../../src/application/context/relations/add/AddRelationCommand.js";
import { RemoveDependencyCommand } from "../../../../../src/application/context/dependencies/remove/RemoveDependencyCommand.js";

function createMockLegacyReader(candidates: LegacyDependencyCandidate[]): ILegacyDependencyReader {
  return {
    findLegacyCouplings: jest.fn<() => Promise<LegacyDependencyCandidate[]>>().mockResolvedValue(candidates),
  };
}

function createMockAddRelationHandler() {
  return {
    execute: jest.fn<(cmd: AddRelationCommand) => Promise<{ relationId: string }>>().mockImplementation(async (cmd) => ({
      relationId: `relation_mock_${cmd.fromEntityId}_${cmd.toEntityId}`,
    })),
  } as unknown as AddRelationCommandHandler;
}

function createMockRemoveDependencyHandler() {
  return {
    execute: jest.fn<(cmd: RemoveDependencyCommand) => Promise<{ dependencyId: string }>>().mockImplementation(async (cmd) => ({
      dependencyId: cmd.dependencyId,
    })),
  } as unknown as RemoveDependencyCommandHandler;
}

describe("MigrateDependenciesCommandHandler", () => {
  let legacyReader: ILegacyDependencyReader;
  let addRelationHandler: ReturnType<typeof createMockAddRelationHandler>;
  let removeDependencyHandler: ReturnType<typeof createMockRemoveDependencyHandler>;
  let handler: MigrateDependenciesCommandHandler;

  beforeEach(() => {
    addRelationHandler = createMockAddRelationHandler();
    removeDependencyHandler = createMockRemoveDependencyHandler();
  });

  describe("first-run conversion", () => {
    it("converts active legacy dependencies to relations and removes them", async () => {
      const candidates: LegacyDependencyCandidate[] = [
        {
          dependencyId: "dep_1",
          consumerId: "UserController",
          providerId: "AuthService",
          endpoint: "/api/auth",
          contract: "IAuthService",
          status: "active",
        },
        {
          dependencyId: "dep_2",
          consumerId: "OrderService",
          providerId: "PaymentGateway",
          endpoint: null,
          contract: null,
          status: "active",
        },
      ];

      legacyReader = createMockLegacyReader(candidates);
      handler = new MigrateDependenciesCommandHandler(
        legacyReader,
        addRelationHandler,
        removeDependencyHandler
      );

      const response = await handler.handle({});

      expect(response.totalLegacy).toBe(2);
      expect(response.converted).toHaveLength(2);
      expect(response.skipped).toHaveLength(0);
      expect(response.dryRun).toBe(false);

      expect(response.converted[0]).toEqual({
        dependencyId: "dep_1",
        relationId: "relation_mock_UserController_AuthService",
        fromEntityId: "UserController",
        toEntityId: "AuthService",
      });

      expect(response.converted[1]).toEqual({
        dependencyId: "dep_2",
        relationId: "relation_mock_OrderService_PaymentGateway",
        fromEntityId: "OrderService",
        toEntityId: "PaymentGateway",
      });

      // Verify relation creation calls
      expect((addRelationHandler.execute as jest.Mock).mock.calls).toHaveLength(2);
      expect((addRelationHandler.execute as jest.Mock).mock.calls[0][0]).toMatchObject({
        fromEntityType: "component",
        fromEntityId: "UserController",
        toEntityType: "component",
        toEntityId: "AuthService",
        relationType: "depends_on",
      });

      // Verify dependency removal calls
      expect((removeDependencyHandler.execute as jest.Mock).mock.calls).toHaveLength(2);
      expect((removeDependencyHandler.execute as jest.Mock).mock.calls[0][0]).toMatchObject({
        dependencyId: "dep_1",
        reason: "Migrated to component relation",
      });
      expect((removeDependencyHandler.execute as jest.Mock).mock.calls[1][0]).toMatchObject({
        dependencyId: "dep_2",
        reason: "Migrated to component relation",
      });
    });
  });

  describe("rerun idempotency", () => {
    it("skips already-removed dependencies and reports zero additional conversions", async () => {
      const candidates: LegacyDependencyCandidate[] = [
        {
          dependencyId: "dep_1",
          consumerId: "UserController",
          providerId: "AuthService",
          endpoint: null,
          contract: null,
          status: "removed",
        },
      ];

      legacyReader = createMockLegacyReader(candidates);
      handler = new MigrateDependenciesCommandHandler(
        legacyReader,
        addRelationHandler,
        removeDependencyHandler
      );

      const response = await handler.handle({});

      expect(response.totalLegacy).toBe(1);
      expect(response.converted).toHaveLength(0);
      expect(response.skipped).toHaveLength(1);
      expect(response.skipped[0]).toEqual({
        dependencyId: "dep_1",
        reason: "Already removed",
      });

      expect((addRelationHandler.execute as jest.Mock).mock.calls).toHaveLength(0);
      expect((removeDependencyHandler.execute as jest.Mock).mock.calls).toHaveLength(0);
    });

    it("returns zero conversions when no legacy dependencies exist", async () => {
      legacyReader = createMockLegacyReader([]);
      handler = new MigrateDependenciesCommandHandler(
        legacyReader,
        addRelationHandler,
        removeDependencyHandler
      );

      const response = await handler.handle({});

      expect(response.totalLegacy).toBe(0);
      expect(response.converted).toHaveLength(0);
      expect(response.skipped).toHaveLength(0);
    });
  });

  describe("partial-data edge cases", () => {
    it("skips dependencies with missing consumerId", async () => {
      const candidates: LegacyDependencyCandidate[] = [
        {
          dependencyId: "dep_1",
          consumerId: "",
          providerId: "AuthService",
          endpoint: null,
          contract: null,
          status: "active",
        },
      ];

      legacyReader = createMockLegacyReader(candidates);
      handler = new MigrateDependenciesCommandHandler(
        legacyReader,
        addRelationHandler,
        removeDependencyHandler
      );

      const response = await handler.handle({});

      expect(response.converted).toHaveLength(0);
      expect(response.skipped).toHaveLength(1);
      expect(response.skipped[0].reason).toBe("Missing consumerId or providerId");
    });

    it("skips dependencies with missing providerId", async () => {
      const candidates: LegacyDependencyCandidate[] = [
        {
          dependencyId: "dep_1",
          consumerId: "UserController",
          providerId: "",
          endpoint: null,
          contract: null,
          status: "active",
        },
      ];

      legacyReader = createMockLegacyReader(candidates);
      handler = new MigrateDependenciesCommandHandler(
        legacyReader,
        addRelationHandler,
        removeDependencyHandler
      );

      const response = await handler.handle({});

      expect(response.converted).toHaveLength(0);
      expect(response.skipped).toHaveLength(1);
      expect(response.skipped[0].reason).toBe("Missing consumerId or providerId");
    });

    it("handles a mix of convertible, skipped-removed, and skipped-partial", async () => {
      const candidates: LegacyDependencyCandidate[] = [
        {
          dependencyId: "dep_active",
          consumerId: "A",
          providerId: "B",
          endpoint: null,
          contract: null,
          status: "active",
        },
        {
          dependencyId: "dep_removed",
          consumerId: "C",
          providerId: "D",
          endpoint: null,
          contract: null,
          status: "removed",
        },
        {
          dependencyId: "dep_partial",
          consumerId: "",
          providerId: "E",
          endpoint: null,
          contract: null,
          status: "active",
        },
      ];

      legacyReader = createMockLegacyReader(candidates);
      handler = new MigrateDependenciesCommandHandler(
        legacyReader,
        addRelationHandler,
        removeDependencyHandler
      );

      const response = await handler.handle({});

      expect(response.totalLegacy).toBe(3);
      expect(response.converted).toHaveLength(1);
      expect(response.converted[0].dependencyId).toBe("dep_active");
      expect(response.skipped).toHaveLength(2);
      expect(response.skipped[0].dependencyId).toBe("dep_removed");
      expect(response.skipped[1].dependencyId).toBe("dep_partial");
    });
  });

  describe("dry run", () => {
    it("reports what would be converted without executing commands", async () => {
      const candidates: LegacyDependencyCandidate[] = [
        {
          dependencyId: "dep_1",
          consumerId: "UserController",
          providerId: "AuthService",
          endpoint: null,
          contract: null,
          status: "active",
        },
      ];

      legacyReader = createMockLegacyReader(candidates);
      handler = new MigrateDependenciesCommandHandler(
        legacyReader,
        addRelationHandler,
        removeDependencyHandler
      );

      const response = await handler.handle({ dryRun: true });

      expect(response.dryRun).toBe(true);
      expect(response.converted).toHaveLength(1);
      expect(response.converted[0].relationId).toBe("(dry run)");
      expect(response.converted[0].fromEntityId).toBe("UserController");
      expect(response.converted[0].toEntityId).toBe("AuthService");

      // No commands should have been executed
      expect((addRelationHandler.execute as jest.Mock).mock.calls).toHaveLength(0);
      expect((removeDependencyHandler.execute as jest.Mock).mock.calls).toHaveLength(0);
    });
  });
});
