import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";

jest.unstable_mockModule("@inquirer/prompts", () => ({
  checkbox: jest.fn(),
  confirm: jest.fn(),
  input: jest.fn(),
  select: jest.fn(),
}));

jest.unstable_mockModule(
  "../../../../../../../src/presentation/cli/banner/AnimatedBanner.js",
  () => ({
    getBannerLines: jest.fn(() => ["Jumbo"]),
    showAnimatedBanner: jest.fn().mockResolvedValue(undefined),
  }),
);

jest.unstable_mockModule(
  "../../../../../../../src/application/context/project/init/ExistingSettingsGuard.js",
  () => ({
    ExistingSettingsError: class ExistingSettingsError extends Error {},
    ExistingSettingsGuard: jest.fn().mockImplementation(() => ({
      assertInitializationAllowed: jest.fn(),
    })),
  }),
);

const prompts = await import("@inquirer/prompts");
const { projectInit } =
  await import("../../../../../../../src/presentation/cli/commands/project/init/project.init.js");
import type { ProjectInitDependencies } from "../../../../../../../src/presentation/cli/commands/project/init/project.init.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { ICliVersionReader } from "../../../../../../../src/application/cli-metadata/query/ICliMetadataReader.js";
import type { GetTelemetryStatusController } from "../../../../../../../src/application/context/telemetry/get/GetTelemetryStatusController.js";
import type { UpdateTelemetryConsentController } from "../../../../../../../src/application/context/telemetry/update/UpdateTelemetryConsentController.js";
import type { PlanProjectInitController } from "../../../../../../../src/application/context/project/init/PlanProjectInitController.js";
import type { InitializeProjectController } from "../../../../../../../src/application/context/project/init/InitializeProjectController.js";
import type { AddAudienceController } from "../../../../../../../src/application/context/audiences/add/AddAudienceController.js";
import type { AddAudiencePainController } from "../../../../../../../src/application/context/audience-pains/add/AddAudiencePainController.js";
import type { AddValuePropositionController } from "../../../../../../../src/application/context/value-propositions/add/AddValuePropositionController.js";

describe("project.init command", () => {
  const availableAgents = [
    { id: "claude", name: "Claude" },
    { id: "antigravity", name: "Antigravity" },
    { id: "copilot", name: "Copilot" },
  ] as const;
  let mockContainer: Partial<ProjectInitDependencies>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let isTtyDescriptor: PropertyDescriptor | undefined;
  let promptResultQueue: unknown[];

  function createMockContainer(
    telemetryStatusOverrides: Record<string, unknown> = {},
  ): Partial<ProjectInitDependencies> {
    return {
      cliVersionReader: {
        getVersion: jest.fn().mockReturnValue({ version: "1.0.1" }),
      } as unknown as ICliVersionReader,
      getTelemetryStatusController: {
        handle: jest.fn().mockResolvedValue({
          configured: false,
          enabled: false,
          effectiveEnabled: false,
          anonymousId: null,
          disabledByCi: false,
          disabledByEnvironment: false,
          ...telemetryStatusOverrides,
        }),
      } as unknown as GetTelemetryStatusController,
      updateTelemetryConsentController: {
        handle: jest.fn().mockResolvedValue({
          enabled: true,
          effectiveEnabled: true,
          anonymousId: "anon-123",
          disabledByCi: false,
          disabledByEnvironment: false,
          generatedAnonymousId: true,
        }),
      } as unknown as UpdateTelemetryConsentController,
      planProjectInitController: {
        handle: jest.fn().mockResolvedValue({
          availableAgents,
          plannedChanges: [],
        }),
      } as unknown as PlanProjectInitController,
      initializeProjectController: {
        handle: jest.fn().mockResolvedValue({
          projectId: "project_123",
          changes: [],
        }),
      } as unknown as InitializeProjectController,
      addAudienceController: {
        handle: jest.fn().mockResolvedValue({
          audienceId: "aud_123",
          name: "Developers",
          description: "Software developers",
          priority: "primary",
        }),
      } as unknown as AddAudienceController,
      addAudiencePainController: {
        handle: jest.fn().mockResolvedValue({
          painId: "pain_123",
          title: "Context loss",
          description: "LLMs lose context",
          version: 1,
        }),
      } as unknown as AddAudiencePainController,
      addValuePropositionController: {
        handle: jest.fn().mockResolvedValue({
          valuePropositionId: "vp_123",
          title: "Persistent context",
          measurableOutcome: undefined,
        }),
      } as unknown as AddValuePropositionController,
    };
  }

  /**
   * In interactive mode the prompt sequence is:
   * 1. Project details (name, purpose)
   * 2. Audience confirm gate
   * 3. (If yes: audience fields, then "Add another?" confirm)
   * 4. Pain confirm gate
   * 5. (If yes: pain fields, then "Add another?" confirm)
   * 6. Value confirm gate
   * 7. (If yes: value fields, then "Add another?" confirm)
   * 8. Telemetry consent
   * 9. Agent selection
   */
  function queuePromptResults(...results: unknown[]): void {
    promptResultQueue.push(...results);
  }

  function installPromptQueue(): void {
    const nextResult = jest.fn(async () => {
      if (promptResultQueue.length === 0) {
        throw new Error("Unexpected prompt call");
      }
      return promptResultQueue.shift();
    });

    (prompts.input as jest.Mock).mockImplementation(nextResult);
    (prompts.confirm as jest.Mock).mockImplementation(nextResult);
    (prompts.checkbox as jest.Mock).mockImplementation(nextResult);
    (prompts.select as jest.Mock).mockImplementation(nextResult);
  }

  function expectNoPromptCalls(): void {
    expect(prompts.input).not.toHaveBeenCalled();
    expect(prompts.confirm).not.toHaveBeenCalled();
    expect(prompts.checkbox).not.toHaveBeenCalled();
    expect(prompts.select).not.toHaveBeenCalled();
  }

  function mockInteractiveSkipAllPrimitives(
    projectOverrides: Record<string, unknown> = {},
    telemetryAnswer: Record<string, unknown> = { enabled: true },
    agentSelectionAnswer: Record<string, unknown> = {
      selectedAgentIds: availableAgents.map((agent) => agent.id),
    },
  ) {
    queuePromptResults(
      projectOverrides.name ?? "TestProject",
      projectOverrides.purpose ?? "",
      false,
      false,
      false,
      telemetryAnswer.enabled,
      agentSelectionAnswer.selectedAgentIds,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    promptResultQueue = [];
    installPromptQueue();

    mockContainer = createMockContainer();

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    Renderer.reset();

    isTtyDescriptor = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    Renderer.reset();

    if (isTtyDescriptor) {
      Object.defineProperty(process.stdout, "isTTY", isTtyDescriptor);
    } else {
      Reflect.deleteProperty(process.stdout, "isTTY");
    }
  });

  describe("telemetry", () => {
    it("collects telemetry consent during interactive init", async () => {
      mockInteractiveSkipAllPrimitives(
        { name: "Jumbo", purpose: "Telemetry" },
        { enabled: true },
      );

      await projectInit({ yolo: true }, mockContainer as ProjectInitDependencies);

      expect(
        mockContainer.getTelemetryStatusController!.handle,
      ).toHaveBeenCalledWith({});
      expect(
        mockContainer.updateTelemetryConsentController!.handle,
      ).toHaveBeenCalledWith({ enabled: true });
    });

    it("accepting default enables telemetry with opt-out framing", async () => {
      mockInteractiveSkipAllPrimitives({}, { enabled: true });

      await projectInit({ yolo: true }, mockContainer as ProjectInitDependencies);

      expect(
        mockContainer.updateTelemetryConsentController!.handle,
      ).toHaveBeenCalledWith({ enabled: true });
    });

    it("declining disables telemetry", async () => {
      mockInteractiveSkipAllPrimitives({}, { enabled: false });

      await projectInit({ yolo: true }, mockContainer as ProjectInitDependencies);

      expect(
        mockContainer.updateTelemetryConsentController!.handle,
      ).toHaveBeenCalledWith({ enabled: false });
    });

    it("enables telemetry by default in non-interactive mode without prompting", async () => {
      await projectInit(
        {
          nonInteractive: true,
          yolo: true,
          name: "Jumbo",
        },
        mockContainer as ProjectInitDependencies,
      );

      expectNoPromptCalls();
      expect(
        mockContainer.updateTelemetryConsentController!.handle,
      ).toHaveBeenCalledWith({ enabled: true });
    });

    it("skips telemetry prompt when CI is detected", async () => {
      mockContainer = createMockContainer({ disabledByCi: true });

      queuePromptResults("TestProject", "", false, false, false, ["claude"]);

      await projectInit({ yolo: true }, mockContainer as ProjectInitDependencies);

      expect(
        mockContainer.updateTelemetryConsentController!.handle,
      ).not.toHaveBeenCalled();
    });

    it("skips telemetry prompt when JUMBO_TELEMETRY_DISABLED=1 is set", async () => {
      mockContainer = createMockContainer({ disabledByEnvironment: true });

      queuePromptResults("TestProject", "", false, false, false, ["claude"]);

      await projectInit({ yolo: true }, mockContainer as ProjectInitDependencies);

      expect(
        mockContainer.updateTelemetryConsentController!.handle,
      ).not.toHaveBeenCalled();
    });

    it("skips telemetry prompt when already configured", async () => {
      mockContainer = createMockContainer({ configured: true });

      queuePromptResults("TestProject", "", false, false, false, ["claude"]);

      await projectInit({ yolo: true }, mockContainer as ProjectInitDependencies);

      expect(
        mockContainer.updateTelemetryConsentController!.handle,
      ).not.toHaveBeenCalled();
    });
  });

  describe("interactive primitive prompts", () => {
    it("prompts for audience, pain, and value when user accepts each gate", async () => {
      queuePromptResults(
        "TestProject",
        "",
        true,
        "Devs",
        "Software developers",
        "primary",
        false,
        true,
        "Context loss",
        "LLMs lose context",
        false,
        true,
        "Persistent",
        "Keep context",
        "No loss",
        "",
        false,
        true,
        ["claude", "copilot"],
      );

      await projectInit({ yolo: true }, mockContainer as ProjectInitDependencies);

      expect(mockContainer.addAudienceController!.handle).toHaveBeenCalledWith({
        name: "Devs",
        description: "Software developers",
        priority: "primary",
      });
      expect(
        mockContainer.addAudiencePainController!.handle,
      ).toHaveBeenCalledWith({
        title: "Context loss",
        description: "LLMs lose context",
      });
      expect(
        mockContainer.addValuePropositionController!.handle,
      ).toHaveBeenCalledWith({
        title: "Persistent",
        description: "Keep context",
        benefit: "No loss",
        measurableOutcome: undefined,
      });
    });

    it("skips primitives when user declines each gate", async () => {
      mockInteractiveSkipAllPrimitives();

      await projectInit({ yolo: true }, mockContainer as ProjectInitDependencies);

      expect(
        mockContainer.addAudienceController!.handle,
      ).not.toHaveBeenCalled();
      expect(
        mockContainer.addAudiencePainController!.handle,
      ).not.toHaveBeenCalled();
      expect(
        mockContainer.addValuePropositionController!.handle,
      ).not.toHaveBeenCalled();
    });

    it("allows adding multiple audiences via the loop", async () => {
      queuePromptResults(
        "TestProject",
        "",
        true,
        "Devs",
        "Developers",
        "primary",
        true,
        "PMs",
        "Product managers",
        "secondary",
        false,
        false,
        false,
        true,
        ["claude"],
      );

      await projectInit({ yolo: true }, mockContainer as ProjectInitDependencies);

      expect(mockContainer.addAudienceController!.handle).toHaveBeenCalledTimes(
        2,
      );
      expect(mockContainer.addAudienceController!.handle).toHaveBeenCalledWith({
        name: "Devs",
        description: "Developers",
        priority: "primary",
      });
      expect(mockContainer.addAudienceController!.handle).toHaveBeenCalledWith({
        name: "PMs",
        description: "Product managers",
        priority: "secondary",
      });
    });

    it("allows adding multiple pain points via the loop", async () => {
      queuePromptResults(
        "TestProject",
        "",
        false,
        true,
        "Pain A",
        "Desc A",
        true,
        "Pain B",
        "Desc B",
        false,
        false,
        true,
        ["claude"],
      );

      await projectInit({ yolo: true }, mockContainer as ProjectInitDependencies);

      expect(
        mockContainer.addAudiencePainController!.handle,
      ).toHaveBeenCalledTimes(2);
    });

    it("allows adding multiple value propositions via the loop", async () => {
      queuePromptResults(
        "TestProject",
        "",
        false,
        false,
        true,
        "V1",
        "D1",
        "B1",
        "",
        true,
        "V2",
        "D2",
        "B2",
        "M2",
        false,
        true,
        ["claude"],
      );

      await projectInit({ yolo: true }, mockContainer as ProjectInitDependencies);

      expect(
        mockContainer.addValuePropositionController!.handle,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockContainer.addValuePropositionController!.handle,
      ).toHaveBeenCalledWith({
        title: "V2",
        description: "D2",
        benefit: "B2",
        measurableOutcome: "M2",
      });
    });
  });

  describe("non-interactive primitive flags", () => {
    it("skips the agent checkbox and initializes all agents in non-interactive mode", async () => {
      await projectInit(
        {
          nonInteractive: true,
          yolo: true,
          name: "TestProject",
        },
        mockContainer as ProjectInitDependencies,
      );

      expect(
        mockContainer.planProjectInitController!.handle,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockContainer.planProjectInitController!.handle,
      ).toHaveBeenCalledWith({
        projectRoot: process.cwd(),
      });
      expect(
        mockContainer.initializeProjectController!.handle,
      ).toHaveBeenCalledWith({
        name: "TestProject",
        purpose: undefined,
        projectRoot: process.cwd(),
        selectedAgentIds: undefined,
      });
    });

    it("persists audience from CLI flags in non-interactive mode", async () => {
      await projectInit(
        {
          nonInteractive: true,
          yolo: true,
          name: "TestProject",
          audienceName: "Devs",
          audienceDescription: "Software developers",
          audiencePriority: "primary",
        },
        mockContainer as ProjectInitDependencies,
      );

      expect(mockContainer.addAudienceController!.handle).toHaveBeenCalledWith({
        name: "Devs",
        description: "Software developers",
        priority: "primary",
      });
    });

    it("persists pain from CLI flags in non-interactive mode", async () => {
      await projectInit(
        {
          nonInteractive: true,
          yolo: true,
          name: "TestProject",
          painTitle: "Context loss",
          painDescription: "LLMs lose context",
        },
        mockContainer as ProjectInitDependencies,
      );

      expect(
        mockContainer.addAudiencePainController!.handle,
      ).toHaveBeenCalledWith({
        title: "Context loss",
        description: "LLMs lose context",
      });
    });

    it("persists value proposition from CLI flags in non-interactive mode", async () => {
      await projectInit(
        {
          nonInteractive: true,
          yolo: true,
          name: "TestProject",
          valueTitle: "Persistent context",
          valueDescription: "Keep context across sessions",
          valueBenefit: "No context loss",
          valueMeasurableOutcome: "Zero loss",
        },
        mockContainer as ProjectInitDependencies,
      );

      expect(
        mockContainer.addValuePropositionController!.handle,
      ).toHaveBeenCalledWith({
        title: "Persistent context",
        description: "Keep context across sessions",
        benefit: "No context loss",
        measurableOutcome: "Zero loss",
      });
    });

    it("skips primitives when partial flags are provided in non-interactive mode", async () => {
      await projectInit(
        {
          nonInteractive: true,
          yolo: true,
          name: "TestProject",
          audienceName: "Devs",
          // missing audienceDescription and audiencePriority
        },
        mockContainer as ProjectInitDependencies,
      );

      expect(
        mockContainer.addAudienceController!.handle,
      ).not.toHaveBeenCalled();
    });
  });

  describe("success output", () => {
    it("filters planned changes and initialization to the selected agents", async () => {
      mockInteractiveSkipAllPrimitives(
        {},
        { enabled: true },
        { selectedAgentIds: ["antigravity", "copilot"] },
      );

      await projectInit({ yolo: true }, mockContainer as ProjectInitDependencies);

      expect(
        mockContainer.planProjectInitController!.handle,
      ).toHaveBeenNthCalledWith(1, {
        projectRoot: process.cwd(),
      });
      expect(
        mockContainer.planProjectInitController!.handle,
      ).toHaveBeenNthCalledWith(2, {
        projectRoot: process.cwd(),
        selectedAgentIds: ["antigravity", "copilot"],
      });
      expect(
        mockContainer.initializeProjectController!.handle,
      ).toHaveBeenCalledWith({
        name: "TestProject",
        purpose: undefined,
        projectRoot: process.cwd(),
        selectedAgentIds: ["antigravity", "copilot"],
      });
    });

    it("lists registered primitives in success output", async () => {
      queuePromptResults(
        "TestProject",
        "",
        true,
        "Devs",
        "Developers",
        "primary",
        false,
        false,
        false,
        true,
        ["claude"],
      );

      await projectInit({ yolo: true }, mockContainer as ProjectInitDependencies);

      const loggedText = consoleLogSpy.mock.calls
        .map((c) => String(c[0]))
        .join("\n");
      expect(loggedText).toContain("Registered Audience: Devs");
    });

    it("suggests skipped primitives in next steps", async () => {
      mockInteractiveSkipAllPrimitives();

      await projectInit({ yolo: true }, mockContainer as ProjectInitDependencies);

      const loggedText = consoleLogSpy.mock.calls
        .map((c) => String(c[0]))
        .join("\n");
      expect(loggedText).toContain("jumbo audience add");
      expect(loggedText).toContain("jumbo audience-pain add");
      expect(loggedText).toContain("jumbo value add");
    });

    it("omits suggestion for primitives that were provided", async () => {
      queuePromptResults(
        "TestProject",
        "",
        true,
        "Devs",
        "Developers",
        "primary",
        false,
        true,
        "Pain",
        "Desc",
        false,
        true,
        "Val",
        "Desc",
        "Ben",
        "",
        false,
        true,
        ["claude"],
      );

      await projectInit({ yolo: true }, mockContainer as ProjectInitDependencies);

      const loggedText = consoleLogSpy.mock.calls
        .map((c) => String(c[0]))
        .join("\n");
      expect(loggedText).not.toContain("jumbo audience add");
      expect(loggedText).not.toContain("jumbo audience-pain add");
      expect(loggedText).not.toContain("jumbo value add");
    });
  });
});
