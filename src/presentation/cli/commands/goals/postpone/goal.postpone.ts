import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { GoalPostponeOutputBuilder } from "./GoalPostponeOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Postpone a defined goal so automatic work streams skip it",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the defined goal to postpone",
    },
  ],
  examples: [
    {
      command: "jumbo goal postpone --id abc123",
      description: "Keep a defined goal visible while excluding it from automatic work streams",
    },
  ],
  related: ["goals list", "goal refine"],
  requiresProject: true,
};

export async function goalPostpone(
  options: { id: string },
  container: IApplicationContainer
): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalPostponeOutputBuilder();

  try {
    const response = await container.postponeGoalController.handle({ goalId: options.id });
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
