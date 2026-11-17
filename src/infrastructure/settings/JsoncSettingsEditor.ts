import * as jsonc from "jsonc-parser";

/**
 * Recursive JSON value shape used to walk settings documents and defaults
 * without resorting to `any` at the JSONC editing boundary.
 */
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

const FORMATTING_OPTIONS: jsonc.FormattingOptions = {
  insertSpaces: true,
  tabSize: 2,
  eol: "\n",
};

function isPlainObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Parse settings JSONC content, throwing a descriptive error if it is invalid.
 * Used at every write path so malformed files fail loudly instead of being
 * partially rewritten.
 */
export function assertValidJsonc(content: string, filePath: string): void {
  const errors: jsonc.ParseError[] = [];
  jsonc.parse(content, errors, { allowTrailingComma: true });
  if (errors.length > 0) {
    const formatted = errors
      .map(
        (err) =>
          `Error at offset ${err.offset}: ${jsonc.printParseErrorCode(err.error)}`,
      )
      .join(", ");
    throw new Error(
      `Invalid JSON in settings file at ${filePath}: ${formatted}`,
    );
  }
}

/**
 * Set a single value at `path` within JSONC `content`, preserving comments,
 * formatting, and every other entry in the document.
 */
export function setJsoncValue(
  content: string,
  path: jsonc.JSONPath,
  value: JsonValue,
): string {
  const edits = jsonc.modify(content, path, value, {
    formattingOptions: FORMATTING_OPTIONS,
  });
  return jsonc.applyEdits(content, edits);
}

function isMissing(content: string, path: jsonc.JSONPath): boolean {
  const tree = jsonc.parseTree(content);
  if (!tree) {
    return true;
  }
  return jsonc.findNodeAtLocation(tree, path) === undefined;
}

export interface MissingEntry {
  path: jsonc.JSONPath;
  value: JsonValue;
}

/**
 * Walk `defaults` against existing JSONC `content` and collect entries that
 * are absent. Whole subtrees are reported as a single entry when their parent
 * is entirely missing; otherwise only the missing nested fields are reported.
 * Collected entries never nest one inside another, so they can be applied to
 * `content` in any order without conflicting.
 */
export function collectMissingDefaults(
  content: string,
  defaults: JsonObject,
  basePath: jsonc.JSONPath = [],
): MissingEntry[] {
  const entries: MissingEntry[] = [];
  for (const key of Object.keys(defaults)) {
    const path = [...basePath, key];
    const value = defaults[key];
    if (isMissing(content, path)) {
      entries.push({ path, value });
    } else if (isPlainObject(value)) {
      entries.push(...collectMissingDefaults(content, value, path));
    }
  }
  return entries;
}

/**
 * Apply every missing default entry to `content`, returning the updated
 * document. Returns `content` unchanged if there is nothing to add.
 */
export function applyMissingDefaults(
  content: string,
  defaults: JsonObject,
): string {
  const entries = collectMissingDefaults(content, defaults);
  let updated = content;
  for (const entry of entries) {
    updated = setJsoncValue(updated, entry.path, entry.value);
  }
  return updated;
}
