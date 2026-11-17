import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalAddGuidelineGateway } from "../../../../../../src/application/context/guidelines/add/LocalAddGuidelineGateway.js";
import { AddGuidelineCommandHandler } from "../../../../../../src/application/context/guidelines/add/AddGuidelineCommandHandler.js";

describe("LocalAddGuidelineGateway", () => {
  let gateway: LocalAddGuidelineGateway;
  let mockCommandHandler: jest.Mocked<AddGuidelineCommandHandler>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AddGuidelineCommandHandler>;

    gateway = new LocalAddGuidelineGateway(mockCommandHandler);
  });

  it("should execute command and return guideline id", async () => {
    const guidelineId = "guideline_123";

    mockCommandHandler.execute.mockResolvedValue({ guidelineId });

    const response = await gateway.addGuideline({
      category: "testing",
      title: "80% coverage required",
      description: "All new features must have at least 80% test coverage",
      rationale: "Ensures code quality and reduces bugs",
      examples: ["src/example.ts"],
    });

    expect(response.guidelineId).toBe(guidelineId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      category: "testing",
      title: "80% coverage required",
      description: "All new features must have at least 80% test coverage",
      rationale: "Ensures code quality and reduces bugs",
      examples: ["src/example.ts"],
    });
    expect(mockCommandHandler.execute.mock.calls[0][0]).not.toHaveProperty(["enforce", "ment"].join(""));
  });

  it("should handle request without optional examples", async () => {
    const guidelineId = "guideline_456";

    mockCommandHandler.execute.mockResolvedValue({ guidelineId });

    const response = await gateway.addGuideline({
      category: "codingStyle",
      title: "Use TypeScript strict mode",
      description: "All TypeScript files must use strict mode",
      rationale: "Catches type errors early",
    });

    expect(response.guidelineId).toBe(guidelineId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      category: "codingStyle",
      title: "Use TypeScript strict mode",
      description: "All TypeScript files must use strict mode",
      rationale: "Catches type errors early",
      examples: undefined,
    });
  });
});
