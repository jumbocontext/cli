import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, realpathSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { applicationEnvironment } from "./application-root.js";

/** Run singleton assertions in a fresh process without resetting private production state. */
export function compiledProcess(module: string, source: string): void {
  const directory = realpathSync(mkdtempSync(path.join(os.tmpdir(), "jumbo-singleton-")));
  const cwd = path.join(directory, "checkout");
  mkdirSync(cwd);
  try {
    execFileSync(process.execPath, ["--input-type=module", "--eval", `
      import assert from "node:assert/strict";
      import os from "node:os";
      import path from "node:path";
      import { existsSync } from "node:fs";
      import { ${module.split("/").at(-1)!.replace(/\.js$/, "")} } from ${JSON.stringify(pathToFileURL(path.resolve("dist", module)).href)};
      const cwd = process.cwd();
      ${source}
    `], { cwd, env: applicationEnvironment(directory), encoding: "utf8", timeout: 20_000 });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
