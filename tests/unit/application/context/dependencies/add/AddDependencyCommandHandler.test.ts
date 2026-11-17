import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AddDependencyCommandHandler } from "../../../../../../src/application/context/dependencies/add/AddDependencyCommandHandler.js";
import { IDependencyAddedEventWriter } from "../../../../../../src/application/context/dependencies/add/IDependencyAddedEventWriter.js";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus.js";
import { IDependencyAddReader } from "../../../../../../src/application/context/dependencies/add/IDependencyAddReader.js";

describe("AddDependencyCommandHandler", () => {
  let handler: AddDependencyCommandHandler;
  let eventWriter: jest.Mocked<IDependencyAddedEventWriter>;
  let eventBus: jest.Mocked<IEventBus>;
  let dependencyReader: jest.Mocked<IDependencyAddReader>;

  beforeEach(() => {
    eventWriter = {
      append: jest.fn(),
    } as unknown as jest.Mocked<IDependencyAddedEventWriter>;
    eventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    } as unknown as jest.Mocked<IEventBus>;
    dependencyReader = {
      findById: jest.fn(),
      findByIdentity: jest.fn(),
    } as unknown as jest.Mocked<IDependencyAddReader>;

    handler = new AddDependencyCommandHandler(eventWriter, eventBus, dependencyReader);
  });

  it("creates external dependencies from name/ecosystem/packageName identity", async () => {
    dependencyReader.findByIdentity.mockResolvedValue(null);

    const result = await handler.execute({
      name: "Express",
      ecosystem: "npm",
      packageName: "express",
      versionConstraint: "^4.18.0",
      endpoint: "/api/auth",
      contract: "IAuthApi",
    });

    expect(result.dependencyId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(dependencyReader.findByIdentity).toHaveBeenCalledWith("npm", "express");
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });

  it("returns an existing legacy identifier for an idempotent add", async () => {
    dependencyReader.findByIdentity.mockResolvedValue({
      dependencyId: "dep_npm_express",
    } as never);

    const result = await handler.execute({
      name: "Express",
      ecosystem: "npm",
      packageName: "express",
    });

    expect(result).toEqual({ dependencyId: "dep_npm_express" });
    expect(eventWriter.append).not.toHaveBeenCalled();
  });

  it("throws when external identity flags are missing", async () => {
    await expect(
      handler.execute({
        endpoint: "/api/auth",
      })
    ).rejects.toThrow("Dependency identity is required. Provide name/ecosystem/packageName.");

    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
