import { NoOpRelationDiscoveryGoalRegistrar } from "../../../../../../src/application/context/relations/discover/NoOpRelationDiscoveryGoalRegistrar.js";
import { EntityType } from "../../../../../../src/domain/relations/Constants.js";

describe("NoOpRelationDiscoveryGoalRegistrar", () => {
  it("returns null without side-effects", async () => {
    const registrar = new NoOpRelationDiscoveryGoalRegistrar();

    const result = await registrar.execute(EntityType.COMPONENT, "comp_1");

    expect(result).toBeNull();
  });
});
