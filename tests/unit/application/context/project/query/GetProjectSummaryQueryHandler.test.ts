import { jest } from "@jest/globals";
import { GetProjectSummaryQueryHandler } from "../../../../../../src/application/context/project/query/GetProjectSummaryQueryHandler.js";
import { IProjectContextReader } from "../../../../../../src/application/context/project/query/IProjectContextReader.js";

describe("GetProjectSummaryQueryHandler", () => {
  it("returns null when the project is uninitialized", async () => {
    const reader = {
      getProject: jest.fn().mockResolvedValue(null),
      getProjectLifecycleState: jest.fn().mockResolvedValue("uninitialized"),
      getProjectKnowledgeInventory: jest.fn(),
    } as jest.Mocked<IProjectContextReader>;

    const handler = new GetProjectSummaryQueryHandler(reader);

    await expect(handler.execute()).resolves.toBeNull();
  });

  it("returns project summary with lifecycle state when initialized", async () => {
    const reader = {
      getProject: jest.fn().mockResolvedValue({
        projectId: "project_1",
        name: "Jumbo",
        purpose: "Agent orchestration",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      }),
      getProjectLifecycleState: jest.fn().mockResolvedValue("primed"),
      getProjectKnowledgeInventory: jest.fn(),
    } as jest.Mocked<IProjectContextReader>;

    const handler = new GetProjectSummaryQueryHandler(reader);

    await expect(handler.execute()).resolves.toEqual({
      name: "Jumbo",
      purpose: "Agent orchestration",
      lifecycleState: "primed",
    });
  });
});
