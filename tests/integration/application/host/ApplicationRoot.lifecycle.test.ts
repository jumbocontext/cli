import { describe, expect, it } from "@jest/globals";
import { compiledProcess } from "../../../fixtures/compiled-process.js";

describe("ApplicationRoot compiled-process lifecycle", () => {
  it("getInstance_importOnly_doesNotResolveRootOrCreateStorage", () => {
    const source = `
      const home = os.homedir();
      const storageExistsAfterImport = existsSync(path.join(home, ".jumbo"));
      os.homedir = () => {
        throw new Error("Not initialized by import");
      };

      assert.equal(storageExistsAfterImport, false);
      assert.throws(
        () => ApplicationRoot.getInstance(),
        /Not initialized by import/,
      );
    `;

    const run = () => compiledProcess("application/host/ApplicationRoot.js", source);

    expect(run).not.toThrow();
  });

  it("getInstance_failureThenSuccess_retriesAndCachesImmutableRoot", () => {
    const source = `
      const home = os.homedir();
      let homeResolutionCalls = 0;
      const failure = new Error("Home unavailable");

      os.homedir = () => {
        homeResolutionCalls += 1;
        throw failure;
      };
      assert.throws(
        () => ApplicationRoot.getInstance(),
        error => error === failure,
      );

      os.homedir = () => {
        homeResolutionCalls += 1;
        return home;
      };
      const root = ApplicationRoot.getInstance();

      os.homedir = () => {
        throw new Error("Must not resolve again");
      };
      const cachedRoot = ApplicationRoot.getInstance();

      assert.equal(cachedRoot, root);
      assert.equal(homeResolutionCalls, 2);
      assert.equal(Object.isFrozen(root), true);
    `;

    const run = () => compiledProcess("application/host/ApplicationRoot.js", source);

    expect(run).not.toThrow();
  });
});
