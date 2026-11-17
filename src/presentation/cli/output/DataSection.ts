import { Section } from "./Section.js";

export interface DataSection extends Section {
  type: "data";
  content: unknown;
}
