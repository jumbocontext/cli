import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { audiencePainsList } from "../../../../../../../src/presentation/cli/commands/audience-pains/list/audiencePains.list.js";
import { GetAudiencePainsController } from "../../../../../../../src/application/context/audience-pains/list/GetAudiencePainsController.js";
import { AudiencePainView } from "../../../../../../../src/application/context/audience-pains/AudiencePainView.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { AudiencePainsListDependencies } from "../../../../../../../src/presentation/cli/commands/audience-pains/list/audiencePains.list.js";

describe("audiencePains.list command", () => {
  let mockContainer: Partial<AudiencePainsListDependencies>;
  let mockController: jest.Mocked<Pick<GetAudiencePainsController, "handle">>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockController = {
      handle: jest.fn(),
    };

    mockContainer = {
      getAudiencePainsController: mockController as unknown as GetAudiencePainsController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list pain points in text format", async () => {
    const mockPains: AudiencePainView[] = [
      {
        painId: "pain_123",
        title: "Context Loss",
        description: "LLMs lose context between sessions",
        status: "active",
        resolvedAt: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockController.handle.mockResolvedValue({ pains: mockPains });

    await audiencePainsList(mockContainer as AudiencePainsListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({});
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should show info message when no pains exist", async () => {
    mockController.handle.mockResolvedValue({ pains: [] });

    await audiencePainsList(mockContainer as AudiencePainsListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({});
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockPains: AudiencePainView[] = [
      {
        painId: "pain_123",
        title: "Context Loss",
        description: "LLMs lose context",
        status: "active",
        resolvedAt: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockController.handle.mockResolvedValue({ pains: mockPains });

    await audiencePainsList(mockContainer as AudiencePainsListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({});
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should handle multiple pain points", async () => {
    const mockPains: AudiencePainView[] = [
      {
        painId: "pain_1",
        title: "First Pain",
        description: "Description 1",
        status: "active",
        resolvedAt: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
      {
        painId: "pain_2",
        title: "Second Pain",
        description: "Description 2",
        status: "active",
        resolvedAt: null,
        version: 1,
        createdAt: "2025-01-01T11:00:00Z",
        updatedAt: "2025-01-01T11:00:00Z",
      },
    ];

    mockController.handle.mockResolvedValue({ pains: mockPains });

    await audiencePainsList(mockContainer as AudiencePainsListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({});
    expect(consoleSpy).toHaveBeenCalled();
  });
});
