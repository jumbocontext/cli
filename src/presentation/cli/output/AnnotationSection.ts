import { Section } from "./Section.js";
import { Annotation } from "./Annotation.js";

export interface AnnotationSection extends Section {
  type: "annotation";
  content: Annotation;
}
