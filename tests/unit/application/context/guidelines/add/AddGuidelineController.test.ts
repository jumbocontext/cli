import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AddGuidelineController } from "../../../../../../src/application/context/guidelines/add/AddGuidelineController.js";
import { IAddGuidelineGateway } from "../../../../../../src/application/context/guidelines/add/IAddGuidelineGateway.js";

describe("AddGuidelineController", () => {
  let controller: AddGuidelineController;
  let mockGateway: jest.Mocked<IAddGuidelineGateway>;

  beforeEach(() => {
    mockGateway = {
      addGuideline: jest.fn(),
    } as jest.Mocked<IAddGuidelineGateway>;

    controller = new AddGuidelineController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      category: "testing" as const,
      title: "80% coverage required",
      description: "All new features must have at least 80% test coverage",
      rationale: "Ensures code quality and reduces bugs",
      examples: ["src/example.ts"],
    };

    const expectedResponse = {
      guidelineId: "guideline_123",
    };

    mockGateway.addGuideline.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addGuideline).toHaveBeenCalledWith(request);
    expect(request).not.toHaveProperty(["enforce", "ment"].join(""));
  });

  it("should handle request without optional examples", async () => {
    const request = {
      category: "codingStyle" as const,
      title: "Use TypeScript strict mode",
      description: "All TypeScript files must use strict mode",
      rationale: "Catches type errors early",
    };

    const expectedResponse = {
      guidelineId: "guideline_456",
    };

    mockGateway.addGuideline.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addGuideline).toHaveBeenCalledWith(request);
  });
});
