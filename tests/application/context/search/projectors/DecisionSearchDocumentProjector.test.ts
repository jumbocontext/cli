import { DecisionSearchDocumentProjector } from "../../../../../src/application/context/search/projectors/DecisionSearchDocumentProjector.js";
import { Decision } from "../../../../../src/domain/decisions/Decision.js";
import { DecisionEventType } from "../../../../../src/domain/decisions/Constants.js";
import { SearchCategory } from "../../../../../src/application/context/search/SearchCategory.js";

describe("DecisionSearchDocumentProjector removal", () => {
  it("subscribes to removal and deletes indexed documents independently of current index state", () => {
    const projector = new DecisionSearchDocumentProjector();
    const decision = Decision.create();
    const added = decision.add("Use SQLite", "Need local storage");
    const change = projector.project(added, null);
    if (change?.operation !== "upsert") throw new Error("Expected added decision document");
    const removed = decision.remove();
    expect(projector.eventTypes).toContain(DecisionEventType.REMOVED);
    const expected = { operation: "remove", source: { type: SearchCategory.DECISION, id: added.aggregateId } };
    expect(projector.project(removed, change.document)).toEqual(expected);
    expect(projector.project(removed, null)).toEqual(expected);
  });
});
