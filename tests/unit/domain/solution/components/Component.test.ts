/**
 * Tests for Component aggregate
 */

import { Component } from "../../../../../src/domain/components/Component";
import { ComponentEventType, ComponentStatus } from "../../../../../src/domain/components/Constants";
import type { ComponentState } from "../../../../../src/domain/components/Component";
import type { ComponentTypeValue } from "../../../../../src/domain/components/Constants";

describe("Component Aggregate", () => {
  describe("add()", () => {
    it("should create ComponentAdded event with all required fields", () => {
      // Arrange
      const component = Component.create("comp_123");

      // Act
      const event = component.add(
        "UserController",
        "service",
        "Handles user-related HTTP requests",
        "User authentication and profile management",
        "src/api/user-controller.ts"
      );

      // Assert
      expect(event.type).toBe(ComponentEventType.ADDED);
      expect(event.aggregateId).toBe("comp_123");
      expect(event.version).toBe(1);
      expect(event.payload.name).toBe("UserController");
      expect(event.payload.type).toBe("service");
      expect(event.payload.description).toBe("Handles user-related HTTP requests");
      expect(event.payload.responsibility).toBe("User authentication and profile management");
      expect(event.payload.path).toBe("src/api/user-controller.ts");
      expect(event.payload.status).toBe(ComponentStatus.ACTIVE);
      expect(event.timestamp).toBeDefined();
    });

    it("should throw error if name is empty", () => {
      // Arrange
      const component = Component.create("comp_123");

      // Act & Assert
      expect(() => component.add("", "service", "Desc", "Resp", "path")).toThrow(
        "Component name must be provided"
      );
    });

    it("should throw error if name is too long", () => {
      // Arrange
      const component = Component.create("comp_123");
      const longName = "a".repeat(101); // Max is 100

      // Act & Assert
      expect(() => component.add(longName, "service", "Desc", "Resp", "path")).toThrow(
        "Component name must be less than 100 characters"
      );
    });

    it("should throw error if type is invalid", () => {
      // Arrange
      const component = Component.create("comp_123");

      // Act & Assert
      expect(() => component.add("Name", "invalid" as unknown as ComponentTypeValue, "Desc", "Resp", "path")).toThrow(
        "Component type must be one of: service, db, queue, ui, lib, api, worker, cache, storage"
      );
    });

    it("should throw error if description is empty", () => {
      // Arrange
      const component = Component.create("comp_123");

      // Act & Assert
      expect(() => component.add("Name", "service", "", "Resp", "path")).toThrow(
        "Component description must be provided"
      );
    });

    it("should throw error if description is too long", () => {
      // Arrange
      const component = Component.create("comp_123");
      const longDescription = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => component.add("Name", "service", longDescription, "Resp", "path")).toThrow(
        "Component description must be less than 500 characters"
      );
    });

    it("should throw error if responsibility is empty", () => {
      // Arrange
      const component = Component.create("comp_123");

      // Act & Assert
      expect(() => component.add("Name", "service", "Desc", "", "path")).toThrow(
        "Component responsibility must be provided"
      );
    });

    it("should throw error if responsibility is too long", () => {
      // Arrange
      const component = Component.create("comp_123");
      const longResponsibility = "a".repeat(301); // Max is 300

      // Act & Assert
      expect(() => component.add("Name", "service", "Desc", longResponsibility, "path")).toThrow(
        "Component responsibility must be less than 300 characters"
      );
    });

    it("should throw error if path is empty", () => {
      // Arrange
      const component = Component.create("comp_123");

      // Act & Assert
      expect(() => component.add("Name", "service", "Desc", "Resp", "")).toThrow(
        "Component path must be provided"
      );
    });

    it("should throw error if path is too long", () => {
      // Arrange
      const component = Component.create("comp_123");
      const longPath = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => component.add("Name", "service", "Desc", "Resp", longPath)).toThrow(
        "Component path must be less than 500 characters"
      );
    });
  });

  describe("update()", () => {
    it("should create ComponentUpdated event when updating description only", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Old description", "Responsibility", "path");

      // Act
      const event = component.update("New description");

      // Assert
      expect(event.type).toBe(ComponentEventType.UPDATED);
      expect(event.aggregateId).toBe("comp_123");
      expect(event.version).toBe(2);
      expect(event.payload.description).toBe("New description");
      expect(event.payload.responsibility).toBeUndefined();
      expect(event.payload.path).toBeUndefined();
      expect(event.payload.type).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create ComponentUpdated event when updating responsibility only", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Old responsibility", "path");

      // Act
      const event = component.update(undefined, "New responsibility");

      // Assert
      expect(event.type).toBe(ComponentEventType.UPDATED);
      expect(event.payload.description).toBeUndefined();
      expect(event.payload.responsibility).toBe("New responsibility");
      expect(event.payload.path).toBeUndefined();
      expect(event.payload.type).toBeUndefined();
    });

    it("should create ComponentUpdated event when updating path only", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "old/path");

      // Act
      const event = component.update(undefined, undefined, "new/path");

      // Assert
      expect(event.payload.description).toBeUndefined();
      expect(event.payload.responsibility).toBeUndefined();
      expect(event.payload.path).toBe("new/path");
      expect(event.payload.type).toBeUndefined();
    });

    it("should create ComponentUpdated event when updating type only", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");

      // Act
      const event = component.update(undefined, undefined, undefined, "api");

      // Assert
      expect(event.payload.description).toBeUndefined();
      expect(event.payload.responsibility).toBeUndefined();
      expect(event.payload.path).toBeUndefined();
      expect(event.payload.type).toBe("api");
    });

    it("should create ComponentUpdated event when updating multiple fields", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Old description", "Old responsibility", "old/path");

      // Act
      const event = component.update(
        "New description",
        "New responsibility",
        "new/path",
        "api"
      );

      // Assert
      expect(event.payload.description).toBe("New description");
      expect(event.payload.responsibility).toBe("New responsibility");
      expect(event.payload.path).toBe("new/path");
      expect(event.payload.type).toBe("api");
    });

    it("should throw error if component is already removed", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");
      component.deprecate("Old component");
      component.remove();

      // Act & Assert
      expect(() => component.update("New description")).toThrow(
        "Component has been removed"
      );
    });

    it("should throw error if description is too long", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");
      const longDescription = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => component.update(longDescription)).toThrow(
        "Component description must be less than 500 characters"
      );
    });

    it("should throw error if no fields are provided", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");

      // Act & Assert
      expect(() => component.update()).toThrow(
        "At least one field must be provided to update"
      );
    });
  });

  describe("rename()", () => {
    it("should create ComponentRenamed event with new name", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("OldName", "service", "Description", "Responsibility", "path");

      // Act
      const event = component.rename("NewName");

      // Assert
      expect(event.type).toBe(ComponentEventType.RENAMED);
      expect(event.aggregateId).toBe("comp_123");
      expect(event.version).toBe(2);
      expect(event.payload.name).toBe("NewName");
      expect(event.timestamp).toBeDefined();
    });

    it("should throw error if component is already removed", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");
      component.deprecate("Old component");
      component.remove();

      // Act & Assert
      expect(() => component.rename("NewName")).toThrow(
        "Component has been removed"
      );
    });

    it("should throw error if new name is same as current name", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");

      // Act & Assert
      expect(() => component.rename("UserController")).toThrow(
        "New name must be different from the current name"
      );
    });

    it("should throw error if name is empty", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");

      // Act & Assert
      expect(() => component.rename("")).toThrow(
        "Component name must be provided"
      );
    });

    it("should throw error if name is too long", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");
      const longName = "a".repeat(101); // Max is 100

      // Act & Assert
      expect(() => component.rename(longName)).toThrow(
        "Component name must be less than 100 characters"
      );
    });

    it("should update state after rename", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("OldName", "service", "Description", "Responsibility", "path");

      // Act
      component.rename("NewName");

      // Assert - renaming again with same name should fail (proves state was updated)
      expect(() => component.rename("NewName")).toThrow(
        "New name must be different from the current name"
      );
    });

    it("should increment version correctly", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path"); // version 1
      component.update("New description"); // version 2

      // Act
      const event = component.rename("NewName");

      // Assert
      expect(event.version).toBe(3);
    });
  });

  describe("deprecate()", () => {
    it("should create ComponentDeprecated event with reason", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");

      // Act
      const event = component.deprecate("Migrated to new architecture");

      // Assert
      expect(event.type).toBe(ComponentEventType.DEPRECATED);
      expect(event.aggregateId).toBe("comp_123");
      expect(event.version).toBe(2);
      expect(event.payload.reason).toBe("Migrated to new architecture");
      expect(event.payload.status).toBe(ComponentStatus.DEPRECATED);
      expect(event.timestamp).toBeDefined();
    });

    it("should create ComponentDeprecated event without reason", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");

      // Act
      const event = component.deprecate();

      // Assert
      expect(event.type).toBe(ComponentEventType.DEPRECATED);
      expect(event.aggregateId).toBe("comp_123");
      expect(event.version).toBe(2);
      expect(event.payload.reason).toBe(null);
      expect(event.payload.status).toBe(ComponentStatus.DEPRECATED);
      expect(event.timestamp).toBeDefined();
    });

    it("should allow deprecating an already deprecated component (idempotent)", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");
      component.deprecate("First deprecation");

      // Act
      const event = component.deprecate("Updated deprecation reason");

      // Assert
      expect(event.type).toBe(ComponentEventType.DEPRECATED);
      expect(event.payload.reason).toBe("Updated deprecation reason");
      expect(event.payload.status).toBe("deprecated");
    });

    it("should throw error if component is already removed", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");
      component.deprecate("Deprecated");
      component.remove();

      // Act & Assert
      expect(() => component.deprecate("Try to deprecate again")).toThrow(
        "Component has been removed"
      );
    });
  });

  describe("remove()", () => {
    it("should create ComponentRemoved event", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");
      component.deprecate("No longer needed");

      // Act
      const event = component.remove();

      // Assert
      expect(event.type).toBe(ComponentEventType.REMOVED);
      expect(event.aggregateId).toBe("comp_123");
      expect(event.version).toBe(3);
      expect(event.payload.status).toBe(ComponentStatus.REMOVED);
      expect(event.timestamp).toBeDefined();
    });

    it("should throw error if component is not deprecated", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");

      // Act & Assert
      expect(() => component.remove()).toThrow(
        "Component must be deprecated before removal"
      );
    });

    it("should increment version correctly", () => {
      // Arrange
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path"); // version 1
      component.update("New description"); // version 2
      component.deprecate("Deprecated"); // version 3

      // Act
      const event = component.remove();

      // Assert
      expect(event.version).toBe(4);
    });
  });

  describe("undeprecate()", () => {
    it("should create ComponentUndeprecated event from deprecated status", () => {
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");
      component.deprecate("Deprecated");

      const event = component.undeprecate("Still required");

      expect(event.type).toBe(ComponentEventType.UNDEPRECATED);
      expect(event.aggregateId).toBe("comp_123");
      expect(event.version).toBe(3);
      expect(event.payload.reason).toBe("Still required");
      expect(event.payload.undeprecatedAt).toBeDefined();
    });

    it("should throw when component is active", () => {
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");

      expect(() => component.undeprecate("Still required")).toThrow("Component is already active");
    });

    it("should throw when component is removed", () => {
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");
      component.deprecate("Deprecated");
      component.remove();

      expect(() => component.undeprecate("Still required")).toThrow("Removed components cannot be undeprecated");
    });

    it("should clear deprecationReason and set status to active", () => {
      const component = Component.create("comp_123");
      component.add("UserController", "service", "Description", "Responsibility", "path");
      component.deprecate("Deprecated");
      component.undeprecate("Still required");

      const state = (component as unknown as { state: ComponentState }).state;
      expect(state.status).toBe(ComponentStatus.ACTIVE);
      expect(state.deprecationReason).toBeNull();
    });
  });
});
