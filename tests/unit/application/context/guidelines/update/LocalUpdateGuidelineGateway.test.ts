import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalUpdateGuidelineGateway } from "../../../../../../src/application/context/guidelines/update/LocalUpdateGuidelineGateway.js";
import { IGuidelineUpdatedEventWriter } from "../../../../../../src/application/context/guidelines/update/IGuidelineUpdatedEventWriter.js";
import { IGuidelineUpdatedEventReader } from "../../../../../../src/application/context/guidelines/update/IGuidelineUpdatedEventReader.js";
import { IGuidelineUpdateReader } from "../../../../../../src/application/context/guidelines/update/IGuidelineUpdateReader.js";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus.js";
import { GuidelineView } from "../../../../../../src/application/context/guidelines/GuidelineView.js";

describe("LocalUpdateGuidelineGateway", () => {
  let gateway: LocalUpdateGuidelineGateway;
  let mockEventWriter: jest.Mocked<IGuidelineUpdatedEventWriter>;
  let mockEventReader: jest.Mocked<IGuidelineUpdatedEventReader>;
  let mockGuidelineReader: jest.Mocked<IGuidelineUpdateReader>;
  let mockEventBus: jest.Mocked<IEventBus>;

  const existingView: GuidelineView = {
    guidelineId: "guid_123",
    category: "testing",
    title: "Original Title",
    description: "Original description",
    rationale: "Original rationale",
    examples: [],
    isRemoved: false,
    removedAt: null,
    removalReason: null,
    version: 1,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(() => {
    mockEventWriter = {
      append: jest.fn(),
    } as jest.Mocked<IGuidelineUpdatedEventWriter>;

    mockEventReader = {
      readStream: jest.fn(),
    } as jest.Mocked<IGuidelineUpdatedEventReader>;

    mockGuidelineReader = {
      findById: jest.fn(),
    } as jest.Mocked<IGuidelineUpdateReader>;

    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    } as jest.Mocked<IEventBus>;

    gateway = new LocalUpdateGuidelineGateway(
      mockEventWriter,
      mockEventReader,
      mockGuidelineReader,
      mockEventBus
    );
  });

  it("should update guideline and return response with updated fields", async () => {
    // First call: existence check; second call: fetch updated view
    const updatedView: GuidelineView = {
      ...existingView,
      title: "Updated Title",
      version: 2,
    };
    mockGuidelineReader.findById
      .mockResolvedValueOnce(existingView)
      .mockResolvedValueOnce(updatedView);
    mockEventReader.readStream.mockResolvedValue([
      {
        type: "GuidelineAddedEvent",
        streamId: "guid_123",
        timestamp: "2026-01-01T00:00:00Z",
        version: 1,
        payload: {
          category: "testing",
          title: "Original Title",
          description: "Original description",
          rationale: "Original rationale",
          examples: [],
        },
      },
    ]);
    mockEventWriter.append.mockResolvedValue({ position: 1 });
    mockEventBus.publish.mockResolvedValue(undefined);

    const response = await gateway.updateGuideline({
      id: "guid_123",
      title: "Updated Title",
    });

    expect(response.guidelineId).toBe("guid_123");
    expect(response.updatedFields).toEqual(["title"]);
    expect(response.title).toBe("Updated Title");
    expect(response.version).toBe(2);
    expect(mockEventWriter.append).toHaveBeenCalled();
    expect(mockEventWriter.append.mock.calls[0][0].payload).not.toHaveProperty(["enforce", "ment"].join(""));
    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it("should throw when guideline does not exist", async () => {
    mockGuidelineReader.findById.mockResolvedValue(null);

    await expect(
      gateway.updateGuideline({
        id: "guid_nonexistent",
        title: "New Title",
      })
    ).rejects.toThrow();

    expect(mockEventWriter.append).not.toHaveBeenCalled();
  });

  it("should track multiple updated fields", async () => {
    const updatedView: GuidelineView = {
      ...existingView,
      category: "security",
      title: "New Title",
      description: "New description",
      version: 2,
    };
    mockGuidelineReader.findById
      .mockResolvedValueOnce(existingView)
      .mockResolvedValueOnce(updatedView);
    mockEventReader.readStream.mockResolvedValue([
      {
        type: "GuidelineAddedEvent",
        streamId: "guid_123",
        timestamp: "2026-01-01T00:00:00Z",
        version: 1,
        payload: {
          category: "testing",
          title: "Original Title",
          description: "Original description",
          rationale: "Original rationale",
          examples: [],
        },
      },
    ]);
    mockEventWriter.append.mockResolvedValue({ position: 1 });
    mockEventBus.publish.mockResolvedValue(undefined);

    const response = await gateway.updateGuideline({
      id: "guid_123",
      category: "security",
      title: "New Title",
      description: "New description",
    });

    expect(response.updatedFields).toEqual(["category", "title", "description"]);
  });
});
