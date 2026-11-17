import { Section } from "./Section.js";
import { Annotation } from "./Annotation.js";

export interface GroupSection extends Section {
  type: "group";
  content: unknown[];
  metadata: {
    groupHeader?: string;
    annotation?: Annotation;
    rendererType: string;
  };
}
