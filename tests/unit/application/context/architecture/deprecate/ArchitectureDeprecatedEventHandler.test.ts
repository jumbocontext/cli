import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ArchitectureDeprecatedEventHandler } from "../../../../../../src/application/context/architecture/deprecate/ArchitectureDeprecatedEventHandler.js";
import { IArchitectureDeprecatedProjector } from "../../../../../../src/application/context/architecture/deprecate/IArchitectureDeprecatedProjector.js";
import { ArchitectureDeprecatedEvent } from "../../../../../../src/domain/architecture/deprecate/ArchitectureDeprecatedEvent.js";

describe("ArchitectureDeprecatedEventHandler", () => {
  let handler: ArchitectureDeprecatedEventHandler;
  let mockProjector: jest.Mocked<IArchitectureDeprecatedProjector>;

  beforeEach(() => {
    mockProjector = {
      applyArchitectureDeprecated: jest.fn<IArchitectureDeprecatedProjector["applyArchitectureDeprecated"]>().mockResolvedValue(undefined),
    } as jest.Mocked<IArchitectureDeprecatedProjector>;

    handler = new ArchitectureDeprecatedEventHandler(mockProjector);
  });

  it("should delegate to projector with the event", async () => {
    const event: ArchitectureDeprecatedEvent = {
      type: "ArchitectureDeprecatedEvent",
      aggregateId: "architecture",
      version: 2,
      timestamp: "2026-04-14T00:00:00Z",
      payload: {
        reason: "Architecture entity deprecated in favor of fine-grained entities",
      },
    };

    await handler.handle(event);

    expect(mockProjector.applyArchitectureDeprecated).toHaveBeenCalledWith(event);
    expect(mockProjector.applyArchitectureDeprecated).toHaveBeenCalledTimes(1);
  });
});
