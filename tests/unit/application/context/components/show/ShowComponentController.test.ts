import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ShowComponentController } from "../../../../../../src/application/context/components/show/ShowComponentController.js";
import { IShowComponentGateway } from "../../../../../../src/application/context/components/show/IShowComponentGateway.js";
import { ComponentView } from "../../../../../../src/application/context/components/ComponentView.js";
import { RelationView } from "../../../../../../src/application/context/relations/RelationView.js";

describe("ShowComponentController", () => {
  let controller: ShowComponentController;
  let mockGateway: jest.Mocked<IShowComponentGateway>;

  const mockComponent: ComponentView = {
    componentId: "comp_123",
    name: "UserService",
    type: "service",
    description: "Handles user operations",
    responsibility: "User management",
    path: "src/services/user",
    status: "active",
    deprecationReason: null,
    version: 1,
    createdAt: "2025-01-01T10:00:00Z",
    updatedAt: "2025-01-01T10:00:00Z",
  };

  const mockRelations: RelationView[] = [
    {
      relationId: "rel_1",
      fromEntityType: "component",
      fromEntityId: "comp_123",
      toEntityType: "component",
      toEntityId: "comp_456",
      relationType: "uses",
      strength: "strong",
      description: "UserService uses AuthProvider",
      status: "active",
      version: 1,
      createdAt: "2025-01-01T10:00:00Z",
      updatedAt: "2025-01-01T10:00:00Z",
    },
  ];

  beforeEach(() => {
    mockGateway = {
      showComponent: jest.fn(),
    } as jest.Mocked<IShowComponentGateway>;

    controller = new ShowComponentController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    mockGateway.showComponent.mockResolvedValue({
      component: mockComponent,
      relations: mockRelations,
    });

    const response = await controller.handle({ componentId: "comp_123" });

    expect(response.component).toEqual(mockComponent);
    expect(response.relations).toEqual(mockRelations);
    expect(mockGateway.showComponent).toHaveBeenCalledWith({
      componentId: "comp_123",
    });
  });

  it("should pass name request through to gateway", async () => {
    mockGateway.showComponent.mockResolvedValue({
      component: mockComponent,
      relations: [],
    });

    await controller.handle({ name: "UserService" });

    expect(mockGateway.showComponent).toHaveBeenCalledWith({
      name: "UserService",
    });
  });
});
