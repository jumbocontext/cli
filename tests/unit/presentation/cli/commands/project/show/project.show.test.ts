import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ShowProjectController } from "../../../../../../../src/application/context/project/show/ShowProjectController.js";
import { projectShow } from "../../../../../../../src/presentation/cli/commands/project/show/project.show.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { ShowProjectDependencies } from "../../../../../../../src/presentation/cli/commands/project/show/project.show.js";

describe("project.show command", () => {
  let mockController: jest.Mocked<Pick<ShowProjectController, "handle">>;
  let mockContainer: Partial<ShowProjectDependencies>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    Renderer.configure({ format: "json", verbosity: "normal" });
    mockController = {
      handle: jest.fn().mockResolvedValue({
        project: {
          projectId: "project-1",
          name: "Jumbo",
          purpose: "Context orchestration",
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        northStar: null,
      }),
    };
    mockContainer = {
      showProjectController: mockController as unknown as ShowProjectController,
    };
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should request default project output", async () => {
    await projectShow({}, mockContainer as ShowProjectDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({ northstar: false });
  });

  it("should request north-star output when flag is set", async () => {
    await projectShow({ northstar: true }, mockContainer as ShowProjectDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({ northstar: true });
  });
});
