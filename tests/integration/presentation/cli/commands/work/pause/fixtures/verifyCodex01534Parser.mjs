// Optional upstream verification; normal Jest tests do not require Rust or a checkout.
// git clone --depth 1 --branch rust-v0.153.4 https://github.com/openai/codex.git <checkout>
// node tests/integration/presentation/cli/commands/work/pause/fixtures/verifyCodex01534Parser.mjs <checkout> [captured-stdout-file]
// Requires cached serde 1.0.229 / serde_json 1.0.151 and Cargo (runs offline).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const revision = "3d2ee51ca2d5db578f328aa75e20aa22c0197c9a";
assert.ok(process.argv[2], "Usage: node verifyCodex01534Parser.mjs <checkout> [captured-stdout-file]");
const checkout = resolve(process.argv[2]);
assert.equal(execFileSync("git", ["-C", checkout, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(), revision);
// Read Git blobs, so working-tree edits cannot silently change the verified source.
const readSource = file => execFileSync("git", ["-C", checkout, "show", `${revision}:codex-rs/hooks/src/${file}`], { encoding: "utf8" });
const parser = readSource("engine/output_parser.rs");
const schema = readSource("schema.rs");

// Extract the exact items at this pinned revision. These selected items contain
// no brace characters in literals; looks_like_json is extracted separately below.
function extractItem(source, start) {
  const offset = source.indexOf(start);
  assert.ok(offset >= 0, `Missing ${start}`);
  const body = source.indexOf("{", offset);
  let depth = 1;
  let end = body + 1;
  while (depth && end < source.length) {
    if (source[end] === "{") depth++;
    if (source[end] === "}") depth--;
    end++;
  }
  assert.equal(depth, 0);
  return source.slice(offset, end);
}

const fixtureRoot = mkdtempSync(join(tmpdir(), "codex-parser-01534-"));
try {
  mkdirSync(join(fixtureRoot, "src"));
  writeFileSync(join(fixtureRoot, "Cargo.toml"), `[package]
name="codex-parser-fixture"
version="0.0.0"
edition="2021"
[dependencies]
serde={version="=1.0.229",features=["derive"]}
serde_json="=1.0.151"
[workspace]
`);
  const wireDerives = '#[derive(Deserialize)]\n#[serde(rename_all="camelCase",deny_unknown_fields)]';
  // Preserve deserialization attributes; omit only unrelated schema/serialize/debug derives.
  const code = [
    "#![allow(dead_code)]\nuse serde::Deserialize;",
    extractItem(parser, "pub(crate) struct UniversalOutput"),
    extractItem(parser, "pub(crate) struct StatelessHookOutput"),
    wireDerives, extractItem(schema, "pub(crate) struct HookUniversalOutputWire"),
    wireDerives, extractItem(schema, "pub(crate) struct PreCompactCommandOutputWire"),
    extractItem(schema, "fn default_continue"),
    extractItem(parser, "impl From<HookUniversalOutputWire>"),
    extractItem(parser, "pub(crate) fn parse_pre_compact"),
    extractItem(parser, "fn parse_json<T>"),
    parser.slice(parser.indexOf("pub(crate) fn looks_like_json"), parser.indexOf("\nfn invalid_block_message")).trim(),
    `fn main() {
      use std::io::Read;
      let mut stdout = String::new();
      std::io::stdin().read_to_string(&mut stdout).unwrap();
      let parsed = parse_pre_compact(&stdout);
      println!("{}", serde_json::json!({
        "parsed": parsed.is_some(),
        "looksLikeJson": looks_like_json(&stdout),
        "invalidHookJson": parsed.is_none() && looks_like_json(&stdout)
      }));
    }`,
  ].join("\n\n");
  writeFileSync(join(fixtureRoot, "src/main.rs"), code);
  execFileSync("cargo", ["build", "--offline", "--quiet", "--manifest-path", join(fixtureRoot, "Cargo.toml")], { stdio: "inherit" });
  const executable = join(fixtureRoot, "target/debug", process.platform === "win32" ? "codex-parser-fixture.exe" : "codex-parser-fixture");
  const corpus = [
    ["[OK] Work paused\n", false, true],
    ["Work paused\n", false, false],
    ["", false, false],
    ["[]", false, true],
    ['{"unexpected":true}', false, true],
    ['{"continue":"true"}', false, true],
    ['{"systemMessage":123}', false, true],
    ['{"continue":true}', true, true],
    ['{"continue":false}', true, true],
  ];
  for (const [stdout, parsed, looksLikeJson] of corpus) {
    const actual = JSON.parse(execFileSync(executable, [], { input: stdout, encoding: "utf8" }));
    assert.deepEqual(actual, { parsed, looksLikeJson, invalidHookJson: !parsed && looksLikeJson });
  }
  console.log(`Codex ${revision}: ${corpus.length} parser cases verified`);
  if (process.argv[3]) {
    const input = readFileSync(process.argv[3], "utf8");
    console.log(execFileSync(executable, [], { input, encoding: "utf8" }).trim());
  }
} finally {
  // Only remove the exact directory created by this invocation.
  rmSync(fixtureRoot, { recursive: true, force: true });
}
