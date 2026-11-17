import { SemanticColors } from "../../shared/DesignTokens.js";

export interface AnimatedBannerLineColorSegment {
  text: string;
  color?: string;
  inverse?: boolean;
}

export function getAnimatedBannerLineColorSegments(
  line: string,
  elephantHex: string,
): AnimatedBannerLineColorSegment[] {
  const segments: AnimatedBannerLineColorSegment[] = [];
  let index = 0;

  while (index < line.length) {
    const character = line[index];

    if (character === "▓" || character === "▒") {
      let elephantSegment = "";
      while (
        index < line.length &&
        (line[index] === "▓" || line[index] === "▒" || line[index] === "█")
      ) {
        const nearbyContext = line.slice(
          Math.max(0, index - 3),
          Math.min(line.length, index + 4),
        );
        const hasShading =
          nearbyContext.includes("▓") || nearbyContext.includes("▒");

        if (line[index] === "█" && !hasShading) break;

        elephantSegment += line[index];
        index++;
      }

      const vibrantSegment = elephantSegment
        .replace(/▓/g, "░")
        .replace(/[▒█]/g, " ");
      segments.push({
        text: vibrantSegment,
        color: elephantHex,
        inverse: true,
      });
    } else if (character === "█" || character === "░") {
      let textSegment = "";
      while (
        index < line.length &&
        (line[index] === "█" || line[index] === "░")
      ) {
        textSegment += line[index];
        index++;
      }
      segments.push({ text: textSegment, color: "#c8c8c8" });
    } else if ("╭╮╰╯│─".includes(character)) {
      let boxSegment = "";
      while (index < line.length && "╭╮╰╯│─".includes(line[index])) {
        boxSegment += line[index];
        index++;
      }
      segments.push({ text: boxSegment, color: SemanticColors.keyBadge });
    } else if (
      character === "A" &&
      line.slice(index).startsWith("Agent Context Orchestration")
    ) {
      const tagline = "Agent Context Orchestration";
      segments.push({ text: tagline, color: "#808080" });
      index += tagline.length;
    } else {
      let plainSegment = "";
      while (
        index < line.length &&
        line[index] !== "▓" &&
        line[index] !== "▒" &&
        line[index] !== "█" &&
        line[index] !== "░" &&
        !"╭╮╰╯│─".includes(line[index]) &&
        !(
          line[index] === "A" &&
          line.slice(index).startsWith("Agent Context Orchestration")
        )
      ) {
        plainSegment += line[index];
        index++;
      }

      if (plainSegment.length > 0) {
        segments.push({ text: plainSegment });
      }
    }
  }

  return segments;
}
