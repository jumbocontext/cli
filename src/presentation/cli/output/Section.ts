import { SectionType } from "./SectionType.js";
import { Annotation } from "./Annotation.js";

export interface Section {
  type: SectionType;
  content: unknown;
  metadata?: {
    annotation?: Annotation;
    groupHeader?: string;
    rendererType?: string;
    [key: string]: unknown;
  };
}
