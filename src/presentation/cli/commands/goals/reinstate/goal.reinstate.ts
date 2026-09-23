import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { GoalReinstateOutputBuilder } from "./GoalReinstateOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Reinstate a postponed goal as defined so it is eligible for refinement",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the postponed goal to reinstate",
    },
  ],
  examples: [
    {
      command: "jumbo goal reinstate --id abc123",
      description: "Return a postponed goal to defined status and renewed refinement eligibility",
    },
  ],
  related: ["goals list", "goal postpone", "goal refine"],
  requiresProject: true,
};

export async function goalReinstate(
  options: { id: string },
  container: IApplicationContainer
): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalReinstateOutputBuilder();

  try {
    const response = await container.reinstateGoalController.handle({ goalId: options.id });
    const output = outputBuilder.buildSuccess(response);

    if (renderer.getConfig().format === "text") {
      renderer.info(output.toHumanReadable());
      return;
    }

    const data = output.getSections().find((section) => section.type === "data")?.content;
    if (data) renderer.data(data as RenderData);
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    if (renderer.getConfig().format === "text") {
      renderer.error(output.toHumanReadable());
    } else {
      const data = output.getSections().find((section) => section.type === "data")?.content as RenderData;
      renderer.error(String(data.error), String(data.details));
    }
    process.exit(1);
  }
}
