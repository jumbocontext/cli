/**
 * Tests for UpdateProjectCommandHandler
 */

import { UpdateProjectCommandHandler } from "../../../../../../src/application/context/project/update/UpdateProjectCommandHandler";
import { UpdateProjectCommand } from "../../../../../../src/application/context/project/update/UpdateProjectCommand";
import { IProjectUpdatedEventWriter } from "../../../../../../src/application/context/project/update/IProjectUpdatedEventWriter";
import { IProjectUpdateReader } from "../../../../../../src/application/context/project/update/IProjectUpdateReader";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { IProjectIdentityResolver } from "../../../../../../src/application/identity/IProjectIdentityResolver";
import { ProjectEvent, ProjectUpdatedEvent } from "../../../../../../src/domain/project/EventIndex";
import { ProjectEventType } from "../../../../../../src/domain/project/Constants";
import { ProjectView } from "../../../../../../src/application/context/project/ProjectView";
import { AppendResult } from "../../../../../../src/application/persistence/IEventStore";
import { jest } from "@jest/globals";

describe("UpdateProjectCommandHandler", () => {
  let mockEventWriter: jest.Mocked<IProjectUpdatedEventWriter>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockReader: jest.Mocked<IProjectUpdateReader>;
  let mockProjectIdentityResolver: jest.Mocked<IProjectIdentityResolver>;
  let handler: UpdateProjectCommandHandler;

  beforeEach(() => {
    mockEventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 1 } as AppendResult),
      readStream: jest.fn(),
    };

    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    };

    mockReader = {
      getProject: jest.fn(),
    };

    mockProjectIdentityResolver = {
      generateProjectId: jest.fn(),
      persistProjectId: jest.fn(),
      resolveExistingProjectId: jest.fn(async (projectedProjectId) => projectedProjectId),
    };

    handler = new UpdateProjectCommandHandler(
      mockEventWriter,
      mockEventBus,
      mockReader,
      mockProjectIdentityResolver,
    );
  });

  describe("execute()", () => {
    it("should throw error if project is not initialized", async () => {
      // Arrange
      mockReader.getProject.mockResolvedValue(null);

      const command: UpdateProjectCommand = {
        purpose: "New purpose",
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Project must be initialized before updating"
      );
      expect(mockEventWriter.append).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it("should update project purpose and publish event", async () => {
      // Arrange
      const existingView: ProjectView = {
        projectId: "project",
        name: "My Project",
        purpose: "Original purpose",
        version: 1,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      };

      const initEvent: ProjectEvent = {
        type: ProjectEventType.INITIALIZED,
        aggregateId: "project",
        version: 1,
        timestamp: "2025-01-01T00:00:00.000Z",
        payload: {
          name: "My Project",
          purpose: "Original purpose",
          },
      };

      mockReader.getProject.mockResolvedValue(existingView);
      mockEventWriter.readStream.mockResolvedValue([initEvent]);

      const command: UpdateProjectCommand = {
        purpose: "New purpose",
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.updated).toBe(true);
      expect(result.changedFields).toEqual(["purpose"]);
      expect(mockProjectIdentityResolver.resolveExistingProjectId)
        .toHaveBeenCalledWith("project", expect.any(Function));

      // Verify event was appended to event store
      expect(mockEventWriter.append).toHaveBeenCalledTimes(1);
      const appendedEvent = mockEventWriter.append.mock.calls[0][0] as ProjectUpdatedEvent;
      expect(appendedEvent.type).toBe(ProjectEventType.UPDATED);
      expect(appendedEvent.aggregateId).toBe("project");
      expect(appendedEvent.version).toBe(2);
      expect(appendedEvent.payload.purpose).toBe("New purpose");

      // Verify event was published to event bus
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalledWith(appendedEvent);
    });

    it("should read history from the persisted project id when settings provide one", async () => {
      const persistedProjectId = "11111111-1111-4111-8111-111111111111";
      const existingView: ProjectView = {
        projectId: persistedProjectId,
        name: "My Project",
        purpose: "Original purpose",
        version: 1,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      };
      const initEvent: ProjectEvent = {
        type: ProjectEventType.INITIALIZED,
        aggregateId: persistedProjectId,
        version: 1,
        timestamp: "2025-01-01T00:00:00.000Z",
        payload: {
          name: "My Project",
          purpose: "Original purpose",
        },
      };
      mockReader.getProject.mockResolvedValue(existingView);
      mockProjectIdentityResolver.resolveExistingProjectId.mockResolvedValue(persistedProjectId);
      mockEventWriter.readStream.mockResolvedValue([initEvent]);

      await handler.execute({ purpose: "New purpose" });

      expect(mockEventWriter.readStream).toHaveBeenCalledWith(persistedProjectId);
      const appendedEvent = mockEventWriter.append.mock.calls[0][0] as ProjectUpdatedEvent;
      expect(appendedEvent.aggregateId).toBe(persistedProjectId);
    });

    it("should pass the projected project id to identity migration for legacy projects", async () => {
      const existingView: ProjectView = {
        projectId: "project",
        name: "My Project",
        purpose: "Original purpose",
        version: 1,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      };
      const initEvent: ProjectEvent = {
        type: ProjectEventType.INITIALIZED,
        aggregateId: "project",
        version: 1,
        timestamp: "2025-01-01T00:00:00.000Z",
        payload: {
          name: "My Project",
          purpose: "Original purpose",
        },
      };
      mockReader.getProject.mockResolvedValue(existingView);
      mockEventWriter.readStream.mockResolvedValue([initEvent]);

      await handler.execute({ purpose: "New purpose" });

      expect(mockProjectIdentityResolver.resolveExistingProjectId)
        .toHaveBeenCalledWith("project", expect.any(Function));
      expect(mockEventWriter.readStream).toHaveBeenCalledWith("project");
    });

    it("should return false if no changes detected (idempotent)", async () => {
      // Arrange
      const existingView: ProjectView = {
        projectId: "project",
        name: "My Project",
        purpose: "Original purpose",
        version: 1,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      };

      const initEvent: ProjectEvent = {
        type: ProjectEventType.INITIALIZED,
        aggregateId: "project",
        version: 1,
        timestamp: "2025-01-01T00:00:00.000Z",
        payload: {
          name: "My Project",
          purpose: "Original purpose",
          },
      };

      mockReader.getProject.mockResolvedValue(existingView);
      mockEventWriter.readStream.mockResolvedValue([initEvent]);

      const command: UpdateProjectCommand = {
        purpose: "Original purpose", // Same as current value
      };

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.updated).toBe(false);
      expect(result.changedFields).toEqual([]);
      expect(mockEventWriter.append).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it("should throw error if purpose is too long", async () => {
      // Arrange
      const existingView: ProjectView = {
        projectId: "project",
        name: "My Project",
        purpose: "Original purpose",
        version: 1,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      };

      const initEvent: ProjectEvent = {
        type: ProjectEventType.INITIALIZED,
        aggregateId: "project",
        version: 1,
        timestamp: "2025-01-01T00:00:00.000Z",
        payload: {
          name: "My Project",
          purpose: "Original purpose",
          },
      };

      mockReader.getProject.mockResolvedValue(existingView);
      mockEventWriter.readStream.mockResolvedValue([initEvent]);

      const command: UpdateProjectCommand = {
        purpose: "a".repeat(1001), // Max is 1000
      };

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        "Purpose must be less than 1000 characters"
      );
      expect(mockEventWriter.append).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it("should rehydrate aggregate from multiple events", async () => {
      // Arrange
      const existingView: ProjectView = {
        projectId: "project",
        name: "My Project",
        purpose: "Updated purpose",
        version: 2,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-02T00:00:00.000Z",
      };

      const initEvent: ProjectEvent = {
        type: ProjectEventType.INITIALIZED,
        aggregateId: "project",
        version: 1,
        timestamp: "2025-01-01T00:00:00.000Z",
        payload: {
          name: "My Project",
          purpose: "Original purpose",
        },
      };

      const firstUpdateEvent: ProjectEvent = {
        type: ProjectEventType.UPDATED,
        aggregateId: "project",
        version: 2,
        timestamp: "2025-01-02T00:00:00.000Z",
        payload: {
          purpose: "Updated purpose",
        },
      };

      mockReader.getProject.mockResolvedValue(existingView);
      mockEventWriter.readStream.mockResolvedValue([initEvent, firstUpdateEvent]);

      const command: UpdateProjectCommand = {
        purpose: "Final purpose",
      };

      // Act
      await handler.execute(command);

      // Assert
      const appendedEvent = mockEventWriter.append.mock.calls[0][0] as ProjectUpdatedEvent;
      expect(appendedEvent.version).toBe(3); // Should be version 3 after two previous events
      expect(appendedEvent.payload.purpose).toBe("Final purpose");
    });
  });
});
