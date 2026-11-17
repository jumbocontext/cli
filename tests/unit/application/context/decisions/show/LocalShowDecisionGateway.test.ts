import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { DecisionView } from "../../../../../../src/application/context/decisions/DecisionView.js";
import { IDecisionViewReader } from "../../../../../../src/application/context/decisions/get/IDecisionViewReader.js";
import { LocalShowDecisionGateway } from "../../../../../../src/application/context/decisions/show/LocalShowDecisionGateway.js";

describe("LocalShowDecisionGateway", () => {
  let decisionViewReader: jest.Mocked<IDecisionViewReader>;
  let gateway: LocalShowDecisionGateway;

  const decision: DecisionView = {
    decisionId: "dec_123",
    title: "Use event sourcing",
    context: "State changes need a durable audit trail.",
    rationale: "Events preserve intent.",
    alternatives: ["CRUD snapshots", "Change data capture"],
    consequences: "Projection rebuilding is required.",
    status: "active",
    supersededBy: null,
    reversalReason: null,
    reversedAt: null,
    version: 3,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-02-01T11:00:00.000Z",
  };

  beforeEach(() => {
    decisionViewReader = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn(),
    };
    gateway = new LocalShowDecisionGateway(decisionViewReader);
  });

  it("retrieves one decision through findByIds", async () => {
    decisionViewReader.findByIds.mockResolvedValue([decision]);

    await expect(gateway.showDecision({ decisionId: "dec_123" })).resolves.toEqual({ decision });
    expect(decisionViewReader.findByIds).toHaveBeenCalledWith(["dec_123"]);
    expect(decisionViewReader.findAll).not.toHaveBeenCalled();
    expect(decisionViewReader.search).not.toHaveBeenCalled();
  });

  it("fails clearly when the decision ID is unknown", async () => {
    decisionViewReader.findByIds.mockResolvedValue([]);

    await expect(gateway.showDecision({ decisionId: "dec_missing" }))
      .rejects.toThrow("Decision not found: dec_missing");
  });
});
