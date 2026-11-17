import { AudienceId } from "../../../../src/domain/audiences/AudienceId.js";
import { GoalId } from "../../../../src/domain/goals/GoalId.js";
import { ProjectId } from "../../../../src/domain/project/ProjectId.js";

describe("domain primitive identities", () => {
  it("creates canonical UUID identities", () => {
    const id = GoalId.create();

    expect(GoalId.is(id)).toBe(true);
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("rejects non-UUID values at strict boundaries", () => {
    expect(() => ProjectId.from("project")).toThrow(
      "ProjectId must be a valid UUID",
    );
  });

  it("preserves legacy identifiers as runtime strings", () => {
    const id = AudienceId.fromLegacy("audience-legacy");

    expect(id).toBe("audience-legacy");
    expect(JSON.stringify({ id })).toBe('{"id":"audience-legacy"}');
  });
});
