import { describe, expect, it } from "@jest/globals";
import { AudiencePriority } from "../../../../../src/domain/audiences/Constants.js";
import {
  InitFlowAudiencePriorityOption,
  InitFlowFieldKey,
  InitFlowFieldKind,
  InitFlowRollback,
  InitFlowStage,
  InitFlowValidationCopy,
  InitFlowYesNoValue,
} from "../../../../../src/presentation/tui/project-initialization/Constants.js";
import { WizardFieldKind } from "../../../../../src/presentation/tui/wizard/WizardConstants.js";

describe("InitFlowConstants", () => {
  it("exports flow stage and rollback identifiers", () => {
    expect(InitFlowStage).toEqual({
      project: "project",
      audienceGate: "audience-gate",
      audience: "audience",
      valueGate: "value-gate",
      value: "value",
      agentSelection: "agent-selection",
      confirmation: "confirmation",
      success: "success",
    });
    expect(InitFlowRollback).toEqual({
      audience: "audience",
      valueProposition: "value-proposition",
      plan: "plan",
    });
  });

  it("exports wizard field identifiers, kinds, yes/no values, and validation copy", () => {
    expect(InitFlowFieldKey.projectName).toBe("projectName");
    expect(InitFlowFieldKey.confirmInitialization).toBe("confirmInitialization");
    expect(InitFlowFieldKind).toEqual({
      yesNo: WizardFieldKind.YES_NO,
      singleSelect: WizardFieldKind.SINGLE_SELECT,
      multiSelect: WizardFieldKind.MULTI_SELECT,
    });
    expect(InitFlowYesNoValue).toEqual({
      yes: "yes",
      yesShort: "y",
      no: "no",
      noShort: "n",
    });
    expect(InitFlowValidationCopy.yesNo).toBe("Enter yes or no");
  });

  it("uses domain audience priority values for priority options", () => {
    expect(InitFlowAudiencePriorityOption.primary.value).toBe(
      AudiencePriority.PRIMARY,
    );
    expect(InitFlowAudiencePriorityOption.secondary.value).toBe(
      AudiencePriority.SECONDARY,
    );
    expect(InitFlowAudiencePriorityOption.tertiary.value).toBe(
      AudiencePriority.TERTIARY,
    );
  });
});
