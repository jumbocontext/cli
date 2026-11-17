import { LocalRemoveGuidelineGateway } from "../../../../../../src/application/context/guidelines/remove/LocalRemoveGuidelineGateway";
import { RemoveGuidelineCommandHandler } from "../../../../../../src/application/context/guidelines/remove/RemoveGuidelineCommandHandler";
import { IGuidelineRemoveReader } from "../../../../../../src/application/context/guidelines/remove/IGuidelineRemoveReader";
import { GuidelineView } from "../../../../../../src/application/context/guidelines/GuidelineView";
import { jest } from "@jest/globals";

describe("LocalRemoveGuidelineGateway", () => {
  let gateway: LocalRemoveGuidelineGateway;
  let mockCommandHandler: jest.Mocked<RemoveGuidelineCommandHandler>;
  let mockGuidelineReader: jest.Mocked<IGuidelineRemoveReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RemoveGuidelineCommandHandler>;

    mockGuidelineReader = {
      findById: jest.fn(),
    } as jest.Mocked<IGuidelineRemoveReader>;

    gateway = new LocalRemoveGuidelineGateway(
      mockCommandHandler,
      mockGuidelineReader
    );
  });

  it("removes a guideline successfully", async () => {
    const mockView: GuidelineView = {
      guidelineId: "gl_123",
      category: "testing",
      title: "80% coverage required",
      description: "All new features must have at least 80% test coverage",
      rationale: "Ensures code quality",
      examples: [],
      isRemoved: false,
      removedAt: null,
      removalReason: null,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };

    mockGuidelineReader.findById.mockResolvedValue(mockView);
    mockCommandHandler.execute.mockResolvedValue({ guidelineId: "gl_123" });

    const response = await gateway.removeGuideline({
      guidelineId: "gl_123",
      reason: "Superseded",
    });

    expect(response.guidelineId).toBe("gl_123");
    expect(response.title).toBe("80% coverage required");
    expect(mockGuidelineReader.findById).toHaveBeenCalledWith("gl_123");
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      guidelineId: "gl_123",
      reason: "Superseded",
    });
  });

  it("falls back to guidelineId when view is not found", async () => {
    mockGuidelineReader.findById.mockResolvedValue(null);
    mockCommandHandler.execute.mockResolvedValue({ guidelineId: "gl_789" });

    const response = await gateway.removeGuideline({ guidelineId: "gl_789" });

    expect(response.guidelineId).toBe("gl_789");
    expect(response.title).toBe("gl_789");
  });

  it("propagates errors from command handler", async () => {
    const mockView: GuidelineView = {
      guidelineId: "gl_123",
      category: "testing",
      title: "80% coverage required",
      description: "All new features must have at least 80% test coverage",
      rationale: "Ensures code quality",
      examples: [],
      isRemoved: false,
      removedAt: null,
      removalReason: null,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };

    mockGuidelineReader.findById.mockResolvedValue(mockView);
    mockCommandHandler.execute.mockRejectedValue(
      new Error("Guideline with ID gl_123 not found")
    );

    await expect(
      gateway.removeGuideline({ guidelineId: "gl_123" })
    ).rejects.toThrow("Guideline with ID gl_123 not found");
  });
});
