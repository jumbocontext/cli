/**
 * Tests for RemoveDependencyCommandHandler (command handler)
 */

import { RemoveDependencyCommandHandler } from "../../../../../../src/application/context/dependencies/remove/RemoveDependencyCommandHandler";
import { RemoveDependencyCommand } from "../../../../../../src/application/context/dependencies/remove/RemoveDependencyCommand";
import { IDependencyRemovedEventWriter } from "../../../../../../src/application/context/dependencies/remove/IDependencyRemovedEventWriter";
import { IDependencyRemovedEventReader } from "../../../../../../src/application/context/dependencies/remove/IDependencyRemovedEventReader";
import { IDependencyRemoveReader } from "../../../../../../src/application/context/dependencies/remove/IDependencyRemoveReader";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { DependencyAddedEvent } from "../../../../../../src/domain/dependencies/EventIndex";
import { DependencyEventType, DependencyStatus } from "../../../../../../src/domain/dependencies/Constants";
import { DependencyView } from "../../../../../../src/application/context/dependencies/DependencyView";
import { jest } from "@jest/globals";

describe("RemoveDependencyCommandHandler", () => {
  let eventWriter: IDependencyRemovedEventWriter;
  let eventReader: IDependencyRemovedEventReader;
  let dependencyReader: IDependencyRemoveReader;
  let eventBus: IEventBus;
  let handler: RemoveDependencyCommandHandler;

  beforeEach(() => {
    // Mock event writer
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 2 }),
    };

    // Mock event reader
    eventReader = {
      readStream: jest.fn().mockResolvedValue([]),
    };

    // Mock dependency reader
    dependencyReader = {
      findById: jest.fn().mockResolvedValue(null),
    };

    // Mock event bus
    eventBus = {
      subscribe: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined),
    };

    handler = new RemoveDependencyCommandHandler(eventWriter, eventReader, dependencyReader, eventBus);
  });

  it("should remove dependency without reason and publish DependencyRemoved event", async () => {
    // Arrange
    const existingView: DependencyView = {
      dependencyId: "dep_123",
      consumerId: "UserService",
      providerId: "DatabaseClient",
      endpoint: "/api/users",
      contract: "IUserRepository",
      status: DependencyStatus.ACTIVE,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      removedAt: null,
      removalReason: null,
    };

    const addedEvent: DependencyAddedEvent = {
      type: DependencyEventType.ADDED,
      aggregateId: "dep_123",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        consumerId: "UserService",
        providerId: "DatabaseClient",
        endpoint: "/api/users",
        contract: "IUserRepository",
      },
    };

    (dependencyReader.findById as jest.Mock).mockResolvedValue(existingView);
    (eventReader.readStream as jest.Mock).mockResolvedValue([addedEvent]);

    const command: RemoveDependencyCommand = {
      dependencyId: "dep_123",
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.dependencyId).toBe("dep_123");

    // Verify dependency existence check
    expect(dependencyReader.findById).toHaveBeenCalledWith("dep_123");

    // Verify event history retrieval
    expect(eventReader.readStream).toHaveBeenCalledWith("dep_123");

    // Verify event was appended to event store
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(DependencyEventType.REMOVED);
    expect(appendedEvent.aggregateId).toBe("dep_123");
    expect(appendedEvent.version).toBe(2);
    expect(appendedEvent.payload.reason).toBeNull();

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(DependencyEventType.REMOVED);
    expect(publishedEvent.aggregateId).toBe("dep_123");
  });

  it("should remove dependency with reason and publish DependencyRemoved event", async () => {
    // Arrange
    const existingView: DependencyView = {
      dependencyId: "dep_456",
      consumerId: "UserService",
      providerId: "PostgreSQL",
      endpoint: "/api/users",
      contract: "IUserRepository",
      status: DependencyStatus.ACTIVE,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      removedAt: null,
      removalReason: null,
    };

    const addedEvent: DependencyAddedEvent = {
      type: DependencyEventType.ADDED,
      aggregateId: "dep_456",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        consumerId: "UserService",
        providerId: "PostgreSQL",
        endpoint: "/api/users",
        contract: "IUserRepository",
      },
    };

    (dependencyReader.findById as jest.Mock).mockResolvedValue(existingView);
    (eventReader.readStream as jest.Mock).mockResolvedValue([addedEvent]);

    const command: RemoveDependencyCommand = {
      dependencyId: "dep_456",
      reason: "Migrated to MongoDB",
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.dependencyId).toBe("dep_456");

    // Verify event payload includes reason
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(DependencyEventType.REMOVED);
    expect(appendedEvent.payload.reason).toBe("Migrated to MongoDB");
  });

  it("should throw error if dependency not found", async () => {
    // Arrange
    (dependencyReader.findById as jest.Mock).mockResolvedValue(null);

    const command: RemoveDependencyCommand = {
      dependencyId: "nonexistent_dep",
    };

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Dependency with id nonexistent_dep not found"
    );

    // Verify event was not appended
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("should throw error if dependency is already removed", async () => {
    // Arrange
    const existingView: DependencyView = {
      dependencyId: "dep_789",
      consumerId: "UserService",
      providerId: "DatabaseClient",
      endpoint: "/api/users",
      contract: "IUserRepository",
      status: DependencyStatus.REMOVED,
      version: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      removedAt: new Date().toISOString(),
      removalReason: "Already removed",
    };

    const events = [
      {
        type: DependencyEventType.ADDED,
        aggregateId: "dep_789",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          consumerId: "UserService",
          providerId: "DatabaseClient",
          endpoint: "/api/users",
          contract: "IUserRepository",
        },
      },
      {
        type: DependencyEventType.REMOVED,
        aggregateId: "dep_789",
        version: 2,
        timestamp: new Date().toISOString(),
        payload: {
          reason: "Already removed",
        },
      },
    ];

    (dependencyReader.findById as jest.Mock).mockResolvedValue(existingView);
    (eventReader.readStream as jest.Mock).mockResolvedValue(events);

    const command: RemoveDependencyCommand = {
      dependencyId: "dep_789",
      reason: "Try to remove again",
    };

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Dependency is already removed"
    );

    // Verify event was not appended
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
