import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { GuidelineShowOutputBuilder } from "./GuidelineShowOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Display the complete execution guideline record",
  category: "solution",
  requiredOptions: [
    {
      flags: "-i, --id <guidelineId>",
      description: "ID of the guideline to show",
    },
  ],
  examples: [
    {
      command: "jumbo guideline show --id guide_abc123",
      description: "Show the complete guideline record",
    },
    {
      command: "jumbo guideline show --id guide_abc123 --format json",
      description: "Show the complete guideline record as JSON",
    },
    {
      command: "jumbo guideline show --id guide_abc123 --format text",
      description: "Show the complete guideline record as rich text",
    },
  ],
  related: ["guidelines list", "guidelines search", "guideline update"],
  requiresProject: true,
};

export async function guidelineShow(
  options: { id: string },
  container: IApplicationContainer
): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GuidelineShowOutputBuilder();

  try {
    const { guideline } = await container.showGuidelineController.handle({
      guidelineId: options.id,
    });

    if (renderer.getConfig().format === "text") {
      // Preserve the builder's DesignTokens colors without Renderer.info's legacy tint.
      renderer.banner([outputBuilder.build(guideline).toHumanReadable()]);
      return;
    }

    const dataSection = outputBuilder
      .buildStructuredOutput(guideline)
      .getSections()
      .find((section) => section.type === "data");

    if (dataSection) {
      renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    const output = error instanceof Error && error.message === `Guideline not found: ${options.id}`
      ? outputBuilder.buildNotFoundError(options.id)
      : outputBuilder.buildFailureError(error instanceof Error ? error : String(error));

    renderer.error(output.toHumanReadable());
    process.exitCode = 1;
  }
}
