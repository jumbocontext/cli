#!/usr/bin/env node
/**
 * Cross-file magic string linter.
 *
 * Scans all source .ts files and reports string literals whose value appears
 * in more than one file (or more than N times overall). The fix is to extract
 * the string into a shared constant or enum at the lowest common scope.
 *
 * Configuration (optional): magic-strings.config.json at the repo root.
 * {
 *   "minLength": 5,        // ignore literals shorter than this
 *   "threshold": 2,        // report values occurring in >= this many files
 *   "ignore": ["some-string"],
 *   "ignoreFiles": ["src/generated/(star)(star)"],  // glob patterns
 * }
 */

import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { globSync } from 'node:fs';

const repoRoot = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const configPath = path.join(repoRoot, 'magic-strings.config.json');
let config = {};
if (existsSync(configPath)) {
  config = JSON.parse(readFileSync(configPath, 'utf8'));
}
const MIN_LENGTH = config.minLength ?? 5;
const THRESHOLD = config.threshold ?? 2;
const IGNORE = new Set(config.ignore ?? []);
const IGNORE_FILES = config.ignoreFiles ?? [];

const GLOBS = ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/*.test.ts', '!src/**/__tests__/**'];

// ---------------------------------------------------------------------------
// AST traversal
// ---------------------------------------------------------------------------

/** @type {Map<string, Map<string, {line: number}[]>>>} value -> file -> locations */
const occurrences = new Map();

function shouldIgnoreFile(file) {
  const rel = path.relative(repoRoot, file).replaceAll('\\', '/');
  return IGNORE_FILES.some((pattern) => {
    // simple glob: ** matches any path segment(s), * matches within a segment
    const rx = new RegExp(
      '^' + pattern.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll('\\*\\*/', '(?:.*/)?').replaceAll('\\*', '[^/]*') + '$'
    );
    return rx.test(rel);
  });
}

function collectLiterals(sourceFile, file) {
  const visit = (node) => {
    if (ts.isStringLiteral(node) || (ts.isNoSubstitutionTemplateLiteral(node) && node.text.length > 0)) {
      const parent = node.parent;
      let skip = false;

      // Import/export module specifiers are structural, not magic
      if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) skip = true;
      const KEY_KINDS = new Set([
        ts.SyntaxKind.PropertyAssignment,
        ts.SyntaxKind.PropertySignature,
        ts.SyntaxKind.PropertyDeclaration,
        ts.SyntaxKind.MethodDeclaration,
        ts.SyntaxKind.GetAccessor,
        ts.SyntaxKind.SetAccessor,
        ts.SyntaxKind.MethodSignature,
      ]);
      // Non-computed property / method names are structural
      if (KEY_KINDS.has(parent?.kind) && parent.name === node) skip = true;
      // Enum member names are structural
      if (parent?.kind === ts.SyntaxKind.EnumMember && parent.name === node) skip = true;
      // Type members like type A = { "foo": string } — keys, not values
      if (parent?.kind === ts.SyntaxKind.TypeLiteral || parent?.kind === ts.SyntaxKind.InterfaceDeclaration) skip = true;

      if (!skip && node.text.length >= MIN_LENGTH && !IGNORE.has(node.text)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        let byFile = occurrences.get(node.text);
        if (!byFile) {
          byFile = new Map();
          occurrences.set(node.text, byFile);
        }
        const locs = byFile.get(file) ?? [];
        locs.push({ line: line + 1 });
        byFile.set(file, locs);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const files = globSync(GLOBS, { cwd: repoRoot })
  .map((f) => path.resolve(repoRoot, f))
  .filter((f) => !shouldIgnoreFile(f))
  .sort();

for (const file of files) {
  const sourceText = readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  collectLiterals(sourceFile, file);
}

const rel = (f) => path.relative(repoRoot, f).replaceAll('\\', '/');

/** @type {{ value: string, files: number, total: number }[]} */
const violations = [];
for (const [value, byFile] of occurrences) {
  const total = [...byFile.values()].reduce((n, locs) => n + locs.length, 0);
  if (byFile.size >= THRESHOLD) {
    violations.push({ value, files: byFile.size, total });
  }
}
violations.sort((a, b) => b.files - a.files || b.total - a.total);

if (violations.length > 0) {
  console.error(`\nmagic-strings: ${violations.length} string literal(s) duplicated across files\n`);
  for (const v of violations) {
    console.error(`  "${v.value}"  (${v.files} files, ${v.total} occurrences)`);
    const byFile = occurrences.get(v.value);
    for (const [file, locs] of [...byFile.entries()].sort()) {
      console.error(`    ${rel(file)}:${locs.map((l) => l.line).join(',')}`);
    }
    console.error('');
  }
  console.error(
    `Extract duplicated strings into a shared constant or enum at the lowest common scope,\n` +
      `then reference the constant instead of repeating the literal. If a string legitimately\n` +
      `belongs in multiple places, add it to "ignore" in magic-strings.config.json.\n`
  );
  process.exit(1);
} else {
  console.log('magic-strings: no cross-file duplicates found');
}
