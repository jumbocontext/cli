/**
 * Tests for UpdateDependencyCommandHandler (command handler)
 */

import { UpdateDependencyCommandHandler } from "../../../../../../src/application/context/dependencies/update/UpdateDependencyCommandHandler";
import { UpdateDependencyCommand } from "../../../../../../src/application/context/dependencies/update/UpdateDependencyCommand";
import { IDependencyUpdatedEventWriter } from "../../../../../../src/application/context/dependencies/update/IDependencyUpdatedEventWriter";
import { IDependencyUpdatedEventReader } from "../../../../../../src/application/context/dependencies/update/IDependencyUpdatedEventReader";
import { IDependencyUpdateReader } from "../../../../../../src/application/context/dependencies/update/IDependencyUpdateReader";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { DependencyAddedEvent } from "../../../../../../src/domain/dependencies/EventIndex";
import { DependencyEventType, DependencyStatus } from "../../../../../../src/domain/dependencies/Constants";
import { DependencyView } from "../../../../../../src/application/context/dependencies/DependencyView";
import { jest } from "@jest/globals";

describe("UpdateDependencyCommandHandler", () => {
  let eventWriter: IDependencyUpdatedEventWriter;
  let eventReader: IDependencyUpdatedEventReader;
  let dependencyReader: IDependencyUpdateReader;
  let eventBus: IEventBus;
  let handler: UpdateDependencyCommandHandler;

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

    handler = new UpdateDependencyCommandHandler(eventWriter, eventReader, dependencyReader, eventBus);
  });

  it("should update dependency endpoint and publish DependencyUpdated event", async () => {
    // Arrange
    const existingView: DependencyView = {
      dependencyId: "dep_123",
      consumerId: "UserService",
      providerId: "DatabaseClient",
      endpoint: "/api/v1/users",
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
        endpoint: "/api/v1/users",
        contract: "IUserRepository",
      },
    };

    (dependencyReader.findById as jest.Mock).mockResolvedValue(existingView);
    (eventReader.readStream as jest.Mock).mockResolvedValue([addedEvent]);

    const command: UpdateDependencyCommand = {
      id: "dep_123",
      endpoint: "/api/v2/users",
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
    expect(appendedEvent.type).toBe(DependencyEventType.UPDATED);
    expect(appendedEvent.aggregateId).toBe("dep_123");
    expect(appendedEvent.version).toBe(2);
    expect(appendedEvent.payload.endpoint).toBe("/api/v2/users");
    expect(appendedEvent.payload.contract).toBeUndefined();
    expect(appendedEvent.payload.status).toBeUndefined();

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(DependencyEventType.UPDATED);
    expect(publishedEvent.aggregateId).toBe("dep_123");
  });

  it("should update dependency status only", async () => {
    // Arrange
    const existingView: DependencyView = {
      dependencyId: "dep_456",
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
      aggregateId: "dep_456",
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

    const command: UpdateDependencyCommand = {
      id: "dep_456",
      status: DependencyStatus.DEPRECATED,
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.endpoint).toBeUndefined();
    expect(appendedEvent.payload.contract).toBeUndefined();
    expect(appendedEvent.payload.status).toBe(DependencyStatus.DEPRECATED);
  });

  it("should update multiple fields at once", async () => {
    // Arrange
    const existingView: DependencyView = {
      dependencyId: "dep_789",
      consumerId: "UserService",
      providerId: "DatabaseClient",
      endpoint: "/api/v1/users",
      contract: "REST API",
      status: DependencyStatus.ACTIVE,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      removedAt: null,
      removalReason: null,
    };

    const addedEvent: DependencyAddedEvent = {
      type: DependencyEventType.ADDED,
      aggregateId: "dep_789",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        consumerId: "UserService",
        providerId: "DatabaseClient",
        endpoint: "/api/v1/users",
        contract: "REST API",
      },
    };

    (dependencyReader.findById as jest.Mock).mockResolvedValue(existingView);
    (eventReader.readStream as jest.Mock).mockResolvedValue([addedEvent]);

    const command: UpdateDependencyCommand = {
      id: "dep_789",
      endpoint: "/api/v2/users",
      contract: "gRPC service",
      status: DependencyStatus.DEPRECATED,
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.endpoint).toBe("/api/v2/users");
    expect(appendedEvent.payload.contract).toBe("gRPC service");
    expect(appendedEvent.payload.status).toBe(DependencyStatus.DEPRECATED);
  });

  it("should throw error if dependency not found", async () => {
    // Arrange
    (dependencyReader.findById as jest.Mock).mockResolvedValue(null);

    const command: UpdateDependencyCommand = {
      id: "nonexistent_dep",
      endpoint: "/api/new",
    };

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Dependency with id nonexistent_dep not found"
    );

    // Verify event was not appended
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("should propagate validation errors from domain", async () => {
    // Arrange: Invalid status should fail domain validation
    const existingView: DependencyView = {
      dependencyId: "dep_999",
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
      aggregateId: "dep_999",
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

    const command: UpdateDependencyCommand = {
      id: "dep_999",
      status: "invalid" as unknown as UpdateDependencyCommand["status"],
    };

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Status must be one of: active, deprecated, removed"
    );
  });

  it("should allow clearing endpoint by setting to null", async () => {
    // Arrange
    const existingView: DependencyView = {
      dependencyId: "dep_clear",
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
      aggregateId: "dep_clear",
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

    const command: UpdateDependencyCommand = {
      id: "dep_clear",
      endpoint: null,
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.endpoint).toBeNull();
  });
});
