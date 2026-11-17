import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { AuditRelationsController } from "../../../../../../../src/application/context/relations/audit/AuditRelationsController.js";
import { relationsAudit } from "../../../../../../../src/presentation/cli/commands/relations/audit/relations.audit.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { RelationsAuditDependencies } from "../../../../../../../src/presentation/cli/commands/relations/audit/relations.audit.js";

describe("relations.audit command", () => {
  let handle: jest.Mock;
  let container: Partial<RelationsAuditDependencies>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });
    handle = jest.fn().mockResolvedValue({
      requestedChecks: ["summary"],
      entityType: null,
      summary: {
        nodes: { count: 0, byEntityType: {} },
        relations: { count: 0, byRelationType: {}, byStrength: {}, byStatus: {} },
      },
      findings: {
        dangling: { count: 0, items: [] },
        isolated: { count: 0, items: [] },
        inactiveOnly: { count: 0, items: [] },
        ambiguousId: { count: 0, items: [] },
      },
    });
    container = {
      auditRelationsController: { handle } as unknown as AuditRelationsController,
    };
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("runs every check by default", async () => {
    await relationsAudit({}, container as RelationsAuditDependencies);
    expect(handle).toHaveBeenCalledWith({ checks: undefined, entityType: undefined });
  });

  it("passes selected checks and the entity type filter", async () => {
    await relationsAudit(
      { check: ["dangling", "inactive-only"], entityType: "component" },
      container as RelationsAuditDependencies,
    );
    expect(handle).toHaveBeenCalledWith({
      checks: ["dangling", "inactive-only"],
      entityType: "component",
    });
  });

  it("normalizes check names case-insensitively", async () => {
    await relationsAudit({ check: "ambiguous-ID" }, container as RelationsAuditDependencies);
    expect(handle).toHaveBeenCalledWith({ checks: ["ambiguous-id"], entityType: undefined });
  });

  it("emits exactly one valid JSON object", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });
    await relationsAudit({ check: "summary" }, container as RelationsAuditDependencies);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(consoleSpy.mock.calls[0][0]))).toEqual(expect.objectContaining({
      requestedChecks: ["summary"],
      summary: expect.any(Object),
      findings: expect.any(Object),
    }));
  });
});
