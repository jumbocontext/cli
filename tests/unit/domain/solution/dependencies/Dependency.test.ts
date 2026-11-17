import { Dependency } from "../../../../../src/domain/dependencies/Dependency";
import { DependencyEventType, DependencyStatus } from "../../../../../src/domain/dependencies/Constants";
import type { DependencyStatusType } from "../../../../../src/domain/dependencies/Constants";
import { DependencyAddedEvent } from "../../../../../src/domain/dependencies/add/DependencyAddedEvent";

describe("Dependency Aggregate", () => {
  describe("add()", () => {
    it("should create DependencyAdded event with required external identity fields", () => {
      const dependency = Dependency.create("dep_123");

      const event = dependency.add("Express", "npm", "express");

      expect(event.type).toBe(DependencyEventType.ADDED);
      expect(event.aggregateId).toBe("dep_123");
      expect(event.version).toBe(1);
      expect(event.payload.name).toBe("Express");
      expect(event.payload.ecosystem).toBe("npm");
      expect(event.payload.packageName).toBe("express");
      expect(event.payload.versionConstraint).toBeNull();
      expect(event.payload.endpoint).toBeNull();
      expect(event.payload.contract).toBeNull();
      expect(event.timestamp).toBeDefined();
    });

    it("should create DependencyAdded event with optional fields", () => {
      const dependency = Dependency.create("dep_456");

      const event = dependency.add(
        "React",
        "npm",
        "react",
        "^18.0.0",
        "/render",
        "UIContract"
      );

      expect(event.payload.name).toBe("React");
      expect(event.payload.ecosystem).toBe("npm");
      expect(event.payload.packageName).toBe("react");
      expect(event.payload.versionConstraint).toBe("^18.0.0");
      expect(event.payload.endpoint).toBe("/render");
      expect(event.payload.contract).toBe("UIContract");
    });

    it("should throw error if package name is too long", () => {
      const dependency = Dependency.create("dep_123");
      const longPackageName = "a".repeat(301);

      expect(() => dependency.add("Express", "npm", longPackageName)).toThrow(
        "Dependency package name must be less than 300 characters"
      );
    });
  });

  describe("update()", () => {
    it("should create DependencyUpdated event when updating endpoint only", () => {
      const dependency = Dependency.create("dep_123");
      dependency.add("Express", "npm", "express");

      const event = dependency.update("/api/v2/users");

      expect(event.type).toBe(DependencyEventType.UPDATED);
      expect(event.aggregateId).toBe("dep_123");
      expect(event.version).toBe(2);
      expect(event.payload.endpoint).toBe("/api/v2/users");
      expect(event.payload.contract).toBeUndefined();
      expect(event.payload.status).toBeUndefined();
    });

    it("should throw error if status is invalid", () => {
      const dependency = Dependency.create("dep_123");
      dependency.add("Express", "npm", "express");

      expect(() => dependency.update(undefined, undefined, "invalid" as unknown as DependencyStatusType)).toThrow(
        "Status must be one of: active, deprecated, removed"
      );
    });
  });

  describe("rehydration compatibility", () => {
    it("should rehydrate from legacy component-coupling added event payload", () => {
      const legacyAddedEvent: DependencyAddedEvent = {
        type: "DependencyAddedEvent",
        aggregateId: "dep_legacy",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          consumerId: "UserService",
          providerId: "DatabaseClient",
          endpoint: null,
          contract: "IUserRepository",
        },
      };

      const dependency = Dependency.rehydrate("dep_legacy", [legacyAddedEvent]);
      const removed = dependency.remove("cleanup");

      expect(removed.type).toBe(DependencyEventType.REMOVED);
      expect(removed.version).toBe(2);
      expect(removed.payload.reason).toBe("cleanup");
    });
  });

  describe("remove()", () => {
    it("should increment version correctly", () => {
      const dependency = Dependency.create("dep_123");
      dependency.add("Express", "npm", "express");
      dependency.update("/api/v2");

      const event = dependency.remove("No longer needed");

      expect(event.version).toBe(3);
      expect(event.payload.reason).toBe("No longer needed");
      expect(event.type).toBe(DependencyEventType.REMOVED);
    });

    it("should throw error if dependency is already removed", () => {
      const dependency = Dependency.create("dep_789");
      dependency.add("Express", "npm", "express");
      dependency.remove("First removal");

      expect(() => dependency.remove("Second removal")).toThrow("Dependency is already removed");
    });

    it("should allow status update before removal", () => {
      const dependency = Dependency.create("dep_999");
      dependency.add("Express", "npm", "express");
      const updated = dependency.update(undefined, undefined, DependencyStatus.DEPRECATED);

      expect(updated.payload.status).toBe(DependencyStatus.DEPRECATED);
      const removed = dependency.remove();
      expect(removed.version).toBe(3);
    });
  });
});
