import { describe, expect, it, jest } from "@jest/globals";
import { ISearchIndexRebuildGateway } from "../../../../../src/application/context/search/ISearchIndexRebuildGateway.js";
import { SearchCategory } from "../../../../../src/application/context/search/SearchCategory.js";
import { SearchIndexRebuildController } from "../../../../../src/application/context/search/SearchIndexRebuildController.js";

describe("SearchIndexRebuildController", () => {
  it("delegates typed rebuild requests to the gateway", async () => {
    const response = {
      success: true,
      eventsInspected: 3,
      documentsIndexed: 1,
      removedEntries: 2,
      countsByCategory: { [SearchCategory.COMPONENT]: 1 },
    };
    const gateway: jest.Mocked<ISearchIndexRebuildGateway> = {
      rebuildSearchIndex: jest.fn<ISearchIndexRebuildGateway["rebuildSearchIndex"]>().mockResolvedValue(response),
    };
    const controller = new SearchIndexRebuildController(gateway);
    const request = {};

    await expect(controller.handle(request)).resolves.toBe(response);

    expect(gateway.rebuildSearchIndex).toHaveBeenCalledWith(request);
  });
});
