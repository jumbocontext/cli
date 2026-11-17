import { NavigationConstants } from "../../../../src/presentation/tui/NavigationConstants.js";

describe("NavigationConstants", () => {
  it("defines the top-level screen navigation keys", () => {
    expect(NavigationConstants.Screens.Cockpit.Key).toBe("cockpit");
    expect(NavigationConstants.Screens.Goals.Key).toBe("goals");
    expect(NavigationConstants.Screens.Memory.Key).toBe("memory");
  });
});
