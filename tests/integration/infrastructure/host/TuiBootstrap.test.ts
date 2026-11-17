import { realpathSync } from "node:fs";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ApplicationLauncherDependencies } from "../../../../src/presentation/tui/application-shell/ApplicationLauncherDependencies.js";
import type { TuiComposition } from "../../../../src/presentation/tui/Initializer.js";

const launch = jest.fn<() => Promise<void>>();
const launcher = jest.fn<(version: string, dependencies: ApplicationLauncherDependencies, cwd: string) => void>();
jest.unstable_mockModule("../../../../src/presentation/tui/application-shell/ApplicationLauncher.js", () => ({
  ApplicationLauncher: class {
    constructor(version: string, dependencies: ApplicationLauncherDependencies, cwd: string) {
      launcher(version, dependencies, cwd);
    }
    launch = launch;
  },
}));

const buildMock = jest.fn<() => Promise<unknown>>();
const disposeMock = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

class LeafContainerBuilderStub {
  build = buildMock;
  dispose = disposeMock;
  withProjectInitFeature() { return this; }
  withAudienceFeature() { return this; }
  withValuePropositionFeature() { return this; }
  withAddGoalFeature() { return this; }
  withGetGoalsFeature() { return this; }
  withShowGoalFeature() { return this; }
  withGetSessionsFeature() { return this; }
  withGetComponentsFeature() { return this; }
  withGetDecisionsFeature() { return this; }
  withGetDependenciesFeature() { return this; }
  withGetGuidelinesFeature() { return this; }
  withGetInvariantsFeature() { return this; }
  withSearchFeature() { return this; }
  withProjectStatsFeature() { return this; }
  withProjectContextReaderFeature() { return this; }
  withSettingsReaderFeature() { return this; }
  withTelemetryClientFeature() { return this; }
  withCliUpdateFeature() { return this; }
}
const leafContainerBuilderMock = jest.fn(() => new LeafContainerBuilderStub());

jest.unstable_mockModule("../../../../src/infrastructure/host/LeafContainerBuilder.js", () => ({
  LeafContainerBuilder: leafContainerBuilderMock,
}));

const { Initializer, createTuiDependencies } = await import("../../../../src/presentation/tui/Initializer.js");
const cwd = realpathSync(process.cwd());

function servicesFixture() {
  const services = {
    projectContextReader: { getProject: jest.fn<() => Promise<null>>().mockResolvedValue(null) },
    getGoalsController: { handle: jest.fn() },
    showGoalController: { handle: jest.fn() },
    getSessionsController: { handle: jest.fn() },
    getComponentsController: { handle: jest.fn() },
    getDecisionsController: { handle: jest.fn() },
    getDependenciesController: { handle: jest.fn() },
    getGuidelinesController: { handle: jest.fn() },
    getInvariantsController: { getAllInvariants: jest.fn() },
    projectStatsController: { handle: jest.fn() },
    searchController: { handle: jest.fn() },
    planProjectInitController: { handle: jest.fn() },
    initializeProjectController: { handle: jest.fn<(request: unknown) => Promise<object>>().mockResolvedValue({ initialized: true }) },
    addAudienceController: { handle: jest.fn<(request: unknown) => Promise<object>>().mockResolvedValue({ audienceId: "audience" }) },
    addValuePropositionController: { handle: jest.fn<(request: unknown) => Promise<object>>().mockResolvedValue({ valueId: "value" }) },
    addGoalController: { handle: jest.fn() },
    settingsReader: { read: jest.fn(), write: jest.fn() },
    cliUpdateController: { check: jest.fn(), upgrade: jest.fn() },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  };
  buildMock.mockResolvedValue(services);
  return services;
}

function dependencies(): ApplicationLauncherDependencies {
  return launcher.mock.calls[0][1];
}

beforeEach(() => {
  launcher.mockClear();
  launch.mockReset().mockResolvedValue();
  buildMock.mockReset();
  disposeMock.mockClear();
  leafContainerBuilderMock.mockClear();
});

describe("createTuiDependencies", () => {
  it("compose_validBuilder_mapsCapabilitiesFromComposedServices", async () => {
    // Arrange
    const services = servicesFixture();
    // Act
    const composition = await createTuiDependencies();
    // Assert
    expect(leafContainerBuilderMock).toHaveBeenCalledTimes(1);
    expect(buildMock).toHaveBeenCalledTimes(1);
    const deps = composition.dependencies;
    const { getProjectSummaryQueryHandler, ...readers } = deps.stateReaderControllers;
    expect(readers).toEqual({
      getGoalsController: services.getGoalsController,
      showGoalController: services.showGoalController,
      getSessionsController: services.getSessionsController,
      getComponentsController: services.getComponentsController,
      getDecisionsController: services.getDecisionsController,
      getDependenciesController: services.getDependenciesController,
      getGuidelinesController: services.getGuidelinesController,
      getInvariantsController: services.getInvariantsController,
      projectStatsController: services.projectStatsController,
      searchController: services.searchController,
    });
    await expect(getProjectSummaryQueryHandler?.execute()).resolves.toBeNull();
    expect(services.projectContextReader.getProject).toHaveBeenCalledTimes(1);
    expect(deps.actionControllers).toEqual({
      planProjectInitController: services.planProjectInitController,
      initializeProjectController: services.initializeProjectController,
      addAudienceController: services.addAudienceController,
      addValuePropositionController: services.addValuePropositionController,
      addGoalController: services.addGoalController,
    });
    expect(deps.settingsReader).toBe(services.settingsReader);
    expect(deps.cliUpdateController).toBe(services.cliUpdateController);
    expect(deps.logger).toBe(services.logger);
  });

  it("compose_compositionFails_disposesPartialResourcesAndPropagatesFailure", async () => {
    // Arrange
    const failure = new Error("composition failed");
    buildMock.mockRejectedValueOnce(failure);
    // Act
    const result = createTuiDependencies();
    // Assert
    await expect(result).rejects.toBe(failure);
    expect(disposeMock).toHaveBeenCalledTimes(1);
  });
});

describe("TuiBootstrap", () => {
  it("launch_validComposition_launchesLauncherAndReleasesResourcesOnExit", async () => {
    // Arrange
    const services = servicesFixture();
    const composition = await createTuiDependencies();
    launch.mockReset().mockResolvedValue();
    launcher.mockClear();
    // Act
    await new Initializer(() => composition).launch("1.2.3");
    // Assert
    expect(disposeMock).toHaveBeenCalledTimes(1);
    expect(launcher).toHaveBeenCalledTimes(1);
    expect(launcher.mock.calls[0][0]).toBe("1.2.3");
    expect(launcher.mock.calls[0][2]).toBe(cwd);
    expect(launcher.mock.calls[0][1].stateReaderControllers.getGoalsController).toBe(services.getGoalsController);
    expect(launcher.mock.calls[0][1].subprocessManagerFactory).toEqual(expect.any(Function));
  });

  it("launch_uninitializedProject_reusesEagerServicesForActions", async () => {
    // Arrange
    const services = servicesFixture();
    const composition = await createTuiDependencies();
    const request = { projectRoot: cwd, name: "Project", purpose: undefined };
    // Act
    await new Initializer(() => composition).launch("1");
    const result = await composition.dependencies.actionControllers.initializeProjectController?.handle(request);
    // Assert
    expect(result).toEqual({ initialized: true });
    expect(services.initializeProjectController.handle).toHaveBeenCalledWith(request);
    expect(buildMock).toHaveBeenCalledTimes(1);
    expect(composition.dependencies.actionControllers.addGoalController).toBe(services.addGoalController);
  });

  it("launch_compositionFails_propagatesWithoutLaunching", async () => {
    // Arrange
    const failure = new Error("composition failed");
    // Act
    const result = new Initializer(() => Promise.reject(failure)).launch("1");
    // Assert
    await expect(result).rejects.toBe(failure);
    expect(launcher).not.toHaveBeenCalled();
  });

  it("launch_launcherFails_stillReleasesResourcesAndPropagatesFailure", async () => {
    // Arrange
    const composition = await createTuiDependencies();
    const failure = new Error("launcher failed");
    launch.mockReset().mockRejectedValue(failure);
    // Act
    const result = new Initializer(() => composition).launch("1");
    // Assert
    await expect(result).rejects.toBe(failure);
    expect(disposeMock).toHaveBeenCalledTimes(1);
  });

  it("launch_launcherPending_awaitsCompletionAndPropagatesFailure", async () => {
    // Arrange
    const composition = await createTuiDependencies();
    let reject!: (error: Error) => void;
    let entered!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    launch.mockImplementationOnce(() => {
      entered();
      return new Promise<void>((_resolve, fail) => { reject = fail; });
    });
    const failure = new Error("launcher failed");
    let settled = false;
    // Act
    const result = new Initializer(() => composition).launch("1").catch((error: unknown) => {
      settled = true;
      return error;
    });
    await started;
    // Assert
    expect(settled).toBe(false);
    expect(disposeMock).not.toHaveBeenCalled();
    reject(failure);
    expect(await result).toBe(failure);
    expect(disposeMock).toHaveBeenCalledTimes(1);
  });
});
