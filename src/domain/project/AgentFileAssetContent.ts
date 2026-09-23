import { readFileSync } from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const assetRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "assets",
  "agent-files"
);

export class AgentFileAssetContent {
  static readMarkdown(fileName: string): string {
    return this.withTrailingNewline(
      readFileSync(path.join(assetRoot, "markdown", fileName), "utf-8")
        .replace(/\r\n/g, "\n")
    );
  }

  static readJson<T = unknown>(fileName: string): T {
    const content = readFileSync(path.join(assetRoot, "json", fileName), "utf-8");
    return JSON.parse(content) as T;
  }

  static readScript(fileName: string): string {
    return this.withTrailingNewline(
      readFileSync(path.join(assetRoot, "scripts", fileName), "utf-8")
        .replace(/\r\n/g, "\n")
    );
  }

  static extractSection(content: string, marker: string): string {
    const markerIndex = content.indexOf(marker);
    if (markerIndex === -1) {
      return this.withTrailingNewline(content.trimEnd());
    }

    return this.withTrailingNewline(content.substring(markerIndex).trimEnd());
  }

  private static withTrailingNewline(content: string): string {
    return content.endsWith("\n") ? content : `${content}\n`;
  }
}
