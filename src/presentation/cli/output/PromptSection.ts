import { Section } from "./Section.js";

export interface PromptSection extends Section {
  type: "prompt";
  content: string;
}
