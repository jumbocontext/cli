import type { CommandMetadata } from "../../registry/CommandMetadata.js";
import type { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import type { RemoveDecisionRequest } from "../../../../../application/context/decisions/remove/RemoveDecisionRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";
import type { RenderData } from "../../../rendering/types.js";
import { DecisionRemoveOutputBuilder } from "./DecisionRemoveOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Permanently remove a decision and prune its relations",
  category: "solution",
  requiredOptions: [{ flags: "-i, --id <id>", description: "Decision ID to remove" }],
  examples: [
    { command: "jumbo decision remove --id dec_123", description: "Remove a decision and its relations" },
    { command: "jumbo decision remove --id dec_123 --format json", description: "Return the removal result as JSON" },
  ],
  related: ["decision show", "decision reverse", "decisions list"],
  requiresProject: true,
};

export async function decisionRemove(
  options: { id: string },
  container: IApplicationContainer
): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new DecisionRemoveOutputBuilder();

  try {
    const request: RemoveDecisionRequest = { decisionId: options.id };
    const response = await container.removeDecisionController.handle(request);
    const output = outputBuilder.buildSuccess(response);
    if (renderer.getConfig().format === "text") {
      renderer.banner([output.toHumanReadable()]);
    } else {
      const data = output.getSections().find(section => section.type === "data")?.content;
      renderer.data(data as RenderData);
    }
  } catch (error) {
    container.logger.error("decision.remove failed", error, { decisionId: options.id });
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    if (renderer.getConfig().format === "text") {
      console.error(output.toHumanReadable());
    } else {
      const data = output.getSections().find(section => section.type === "data")?.content;
      renderer.data(data as RenderData);
    }
    process.exit(1);
  }
}
