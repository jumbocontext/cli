export type AnnotationType =
  | "emphasis" // "MUST be strictly adhered to"
  | "groupHeader" // "Related Components:"
  | "instruction" // "Consider these when implementing:"
  | "warning" // "Breaking this invariant will cause X"
  | "context"; // "This decision was made because..."
