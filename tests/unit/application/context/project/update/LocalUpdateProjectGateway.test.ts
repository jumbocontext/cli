import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalUpdateProjectGateway } from "../../../../../../src/application/context/project/update/LocalUpdateProjectGateway.js";
import { UpdateProjectCommandHandler } from "../../../../../../src/application/context/project/update/UpdateProjectCommandHandler.js";
import { IProjectUpdateReader } from "../../../../../../src/application/context/project/update/IProjectUpdateReader.js";

describe("LocalUpdateProjectGateway", () => {
  let gateway: LocalUpdateProjectGateway;
  let mockCommandHandler: jest.Mocked<UpdateProjectCommandHandler>;
  let mockReader: jest.Mocked<IProjectUpdateReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateProjectCommandHandler>;

    mockReader = {
      getProject: jest.fn(),
    } as jest.Mocked<IProjectUpdateReader>;

    gateway = new LocalUpdateProjectGateway(mockCommandHandler, mockReader);
  });

  it("should execute command and return updated project details", async () => {
    mockCommandHandler.execute.mockResolvedValue({
      updated: true,
      changedFields: ["purpose"],
    });

    mockReader.getProject.mockResolvedValue({
      projectId: "project",
      name: "my-project",
      purpose: "Updated purpose",
      version: 2,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-02-19T00:00:00.000Z",
    });

    const response = await gateway.updateProject({
      purpose: "Updated purpose",
    });

    expect(response.updated).toBe(true);
    expect(response.changedFields).toEqual(["purpose"]);
    expect(response.name).toBe("my-project");
    expect(response.purpose).toBe("Updated purpose");
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      purpose: "Updated purpose",
    });
  });

  it("should handle no changes detected", async () => {
    mockCommandHandler.execute.mockResolvedValue({
      updated: false,
      changedFields: [],
    });

    mockReader.getProject.mockResolvedValue({
      projectId: "project",
      name: "my-project",
      purpose: "Same purpose",
      version: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const response = await gateway.updateProject({
      purpose: "Same purpose",
    });

    expect(response.updated).toBe(false);
    expect(response.changedFields).toEqual([]);
    expect(response.name).toBe("my-project");
    expect(response.purpose).toBe("Same purpose");
  });

  it("should handle null project view gracefully", async () => {
    mockCommandHandler.execute.mockResolvedValue({
      updated: true,
      changedFields: ["purpose"],
    });

    mockReader.getProject.mockResolvedValue(null);

    const response = await gateway.updateProject({
      purpose: "New purpose",
    });

    expect(response.name).toBe("N/A");
    expect(response.purpose).toBeNull();
  });
});
