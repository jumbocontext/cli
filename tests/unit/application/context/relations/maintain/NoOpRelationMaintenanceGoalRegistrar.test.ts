import { NoOpRelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/NoOpRelationMaintenanceGoalRegistrar.js";
import { EntityType } from "../../../../../../src/domain/relations/Constants.js";

describe("NoOpRelationMaintenanceGoalRegistrar", () => {
  it("always returns null without side effects", async () => {
    const registrar = new NoOpRelationMaintenanceGoalRegistrar();

    const result = await registrar.execute(EntityType.COMPONENT, "comp_1", "component was updated");

    expect(result).toBeNull();
  });
});
