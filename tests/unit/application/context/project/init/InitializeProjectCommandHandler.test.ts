/**
 * Tests for InitializeProjectCommandHandler
 */

import { InitializeProjectCommandHandler } from "../../../../../../src/application/context/project/init/InitializeProjectCommandHandler.js";
import { InitializeProjectCommand } from "../../../../../../src/application/context/project/init/InitializeProjectCommand.js";
import { IProjectInitializedEventWriter } from "../../../../../../src/application/context/project/init/IProjectInitializedEventWriter.js";
import { IProjectInitReader } from "../../../../../../src/application/context/project/init/IProjectInitReader.js";
import { IAgentFileProtocol } from "../../../../../../src/application/context/project/init/IAgentFileProtocol.js";
import { IGitignoreProtocol } from "../../../../../../src/application/context/project/init/IGitignoreProtocol.js";
import { ISettingsInitializer } from "../../../../../../src/application/settings/ISettingsInitializer.js";
import { IProjectIdentityResolver } from "../../../../../../src/application/identity/IProjectIdentityResolver.js";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus.js";
import { ProjectErrorMessages, ProjectEventType } from "../../../../../../src/domain/project/Constants.js";
import { ProjectInitializedEvent } from "../../../../../../src/domain/project/init/ProjectInitializedEvent.js";
import { ProjectView } from "../../../../../../src/application/context/project/ProjectView.js";
import { AppendResult } from "../../../../../../src/application/persistence/IEventStore.js";
import { jest } from "@jest/globals";

describe("InitializeProjectCommandHandler", () => {
  let handler: InitializeProjectCommandHandler;
  let eventWriter: jest.Mocked<IProjectInitializedEventWriter>;
  let eventBus: jest.Mocked<IEventBus>;
  let reader: jest.Mocked<IProjectInitReader>;
  let agentFileProtocol: jest.Mocked<IAgentFileProtocol>;
  let settingsInitializer: jest.Mocked<ISettingsInitializer>;
  let gitignoreProtocol: jest.Mocked<IGitignoreProtocol>;
  let projectIdentityResolver: jest.Mocked<IProjectIdentityResolver>;

  beforeEach(() => {
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 1 } as AppendResult),
      readStream: jest.fn(),
    };

    eventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    };

    reader = {
      getProject: jest.fn(),
    };

    agentFileProtocol = {
      ensureJumboMd: jest.fn().mockResolvedValue(undefined),
      ensureAgentsMd: jest.fn().mockResolvedValue(undefined),
      ensureAgentConfigurations: jest.fn().mockResolvedValue(undefined),
      repairJumboMd: jest.fn().mockResolvedValue(undefined),
      repairAgentsMd: jest.fn().mockResolvedValue(undefined),
      repairAgentConfigurations: jest.fn().mockResolvedValue(undefined),
      getAvailableAgents: jest.fn().mockReturnValue([]),
      getPlannedFileChanges: jest.fn().mockResolvedValue([]),
    };

    settingsInitializer = {
      ensureSettingsFileExists: jest.fn().mockResolvedValue(undefined),
      getPlannedFileChange: jest.fn().mockResolvedValue(null),
    };

    gitignoreProtocol = {
      ensureExclusions: jest.fn().mockResolvedValue(undefined),
      getPlannedFileChanges: jest.fn().mockResolvedValue([]),
    };

    projectIdentityResolver = {
      generateProjectId: jest.fn().mockReturnValue(
        "11111111-1111-4111-8111-111111111111",
      ),
      persistProjectId: jest.fn().mockResolvedValue(undefined),
      resolveExistingProjectId: jest.fn(),
    };

    handler = new InitializeProjectCommandHandler(
      eventWriter,
      eventBus,
      reader,
      agentFileProtocol,
      settingsInitializer,
      gitignoreProtocol,
      projectIdentityResolver
    );
  });

  describe("execute()", () => {
    it("should throw error if project is already initialized", async () => {
      const existingView: ProjectView = {
        projectId: "project",
        name: "Existing Project",
        purpose: "Already set",
        version: 1,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      };

      reader.getProject.mockResolvedValue(existingView);

      const command: InitializeProjectCommand = {
        name: "New Project",
        purpose: "New purpose",
      };

      await expect(handler.execute(command, "/repo")).rejects.toThrow(
        ProjectErrorMessages.ALREADY_INITIALIZED
      );
      expect(eventWriter.append).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
      expect(agentFileProtocol.ensureAgentsMd).not.toHaveBeenCalled();
      expect(agentFileProtocol.ensureAgentConfigurations).not.toHaveBeenCalled();
      expect(settingsInitializer.ensureSettingsFileExists).not.toHaveBeenCalled();
      expect(projectIdentityResolver.generateProjectId).not.toHaveBeenCalled();
      expect(projectIdentityResolver.persistProjectId).not.toHaveBeenCalled();
      expect(gitignoreProtocol.ensureExclusions).not.toHaveBeenCalled();
    });

    it("should initialize project with a generated id and ensure all side effects execute", async () => {
      reader.getProject.mockResolvedValue(null);

      const command: InitializeProjectCommand = {
        name: "Jumbo",
        purpose: "LLM context management",
      };

      const result = await handler.execute(command, "/repo", ["claude", "antigravity"]);

      expect(result.projectId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(projectIdentityResolver.generateProjectId).not.toHaveBeenCalled();
      expect(eventWriter.append).toHaveBeenCalledTimes(1);

      const appendedEvent = eventWriter.append.mock.calls[0][0] as ProjectInitializedEvent;
      expect(appendedEvent.type).toBe(ProjectEventType.INITIALIZED);
      expect(appendedEvent.aggregateId).toBe(result.projectId);
      expect(appendedEvent.version).toBe(1);
      expect(appendedEvent.payload.name).toBe(command.name);
      expect(appendedEvent.payload.purpose).toBe(command.purpose);

      expect(eventBus.publish).toHaveBeenCalledWith(appendedEvent);
      expect(settingsInitializer.ensureSettingsFileExists).toHaveBeenCalledTimes(1);
      expect(projectIdentityResolver.persistProjectId).toHaveBeenCalledWith(result.projectId);
      expect(agentFileProtocol.ensureAgentsMd).toHaveBeenCalledWith("/repo");
      expect(agentFileProtocol.ensureAgentConfigurations).toHaveBeenCalledWith("/repo", ["claude", "antigravity"]);
      expect(gitignoreProtocol.ensureExclusions).toHaveBeenCalledWith("/repo");
    });
  });
});
