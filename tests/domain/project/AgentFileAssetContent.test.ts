import { describe, expect, it } from "@jest/globals";
import { AgentFileAssetContent } from "../../../src/domain/project/AgentFileAssetContent.js";

describe("AgentFileAssetContent", () => {
  it("reads canonical script assets with normalized trailing newlines", () => {
    const content = AgentFileAssetContent.readScript(
      "opencode-jumbo-plugin.js",
    );

    expect(content).toContain("export const JumboCompactionPlugin");
    expect(content).toContain('"experimental.session.compacting"');
    expect(content.endsWith("\n")).toBe(true);
  });
});
