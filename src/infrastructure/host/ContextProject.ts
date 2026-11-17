import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, realpathSync } from "node:fs";
import path from "node:path";
import { ApplicationRoot } from "../../application/host/ApplicationRoot.js";

/** The project checkout and its derived Jumbo data directory for this context. */
export class ContextProject {

  readonly path: string;
  readonly dataPath: string;


  constructor() {
    this.path = this.#resolvePath();
    this.dataPath = this.#resolveDataPath();
    Object.freeze(this);
  }

  #resolvePath(): string {
    // Resolve the current working directory to its canonical path.
    const cwd = realpathSync(process.cwd());
    
    // Start at the current directory when searching for checkout metadata.
    let ancestor = cwd;
    
    // Walk from the working tree upward, searching each directory for a
    // resolvable .git entry that identifies the checkout root.
    while (true) {
      if (hasResolvableGitDir(path.join(ancestor, ".git"))) break;
    
      // Move to the parent directory.
      const parent = path.dirname(ancestor);
    
      // Use the original directory when no checkout metadata exists.
      if (parent === ancestor) return cwd;
      ancestor = parent;
    }
  
    // Create a stable environment for Git output parsing.
    const env: NodeJS.ProcessEnv = { ...process.env, LC_ALL: "C" };
  
    // Remove inherited Git overrides before resolving the current checkout.
    for (const key of [
      "GIT_DIR",
      "GIT_WORK_TREE",
      "GIT_COMMON_DIR",
      "GIT_INDEX_FILE",
    ]) {
      delete env[key];
    }
  
    // Define a local helper that executes Git commands with the isolated environment.
    const git = (...args: string[]) =>
      execFileSync("git", args, { cwd, env, encoding: "utf8" });
  
    return this.#resolveCheckoutRoot(git);
  }

  #resolveCheckoutRoot(
    git: (...args: string[]) => string,
  ): string {
    // List Git worktrees, split the NUL-delimited output into records, and select the first record.
    const main = git("worktree", "list", "--porcelain", "-z").split("\0\0")[0];
  
    // Split the selected worktree record into its NUL-delimited fields.
    const fields = main.split("\0");
  
    // Reject repositories without a main working tree.
    if (!fields[0].startsWith("worktree ") || fields.includes("bare")) {
      throw new Error(
        "Git repository has no main working tree for Jumbo project storage",
      );
    }
  
    // Resolve the main checkout path to its canonical form.
    const projectRoot = realpathSync(fields[0].slice("worktree ".length));
  
    // Verify that Git identifies the main checkout as its top-level directory.
    const mainTopLevel = realpathSync(
      git("-C", projectRoot, "rev-parse", "--show-toplevel").replace(
        /\r?\n$/,
        "",
      ),
    );
  
    // Reject stale or inconsistent main-checkout metadata.
    if (mainTopLevel !== projectRoot) {
      throw new Error("Git main working tree does not match its project root");
    }
  
    return projectRoot;
  }

  /** The application-root directory where this project's Jumbo data lives. */
  #resolveDataPath(): string {
    return ApplicationRoot.getInstance().getProjectDirectory(this.#resolvePath());
  }

}


// A .git entry is resolvable when it is either a gitfile — a .git file whose
// contents point at a gitdir, as created by git worktree add — or a .git
// directory following the standard repository layout (HEAD, objects/, refs/).
// Fabricated or empty .git directories, as materialized by sandboxed agent
// environments, lack the layout and are not resolvable.
function hasResolvableGitDir(entry: string): boolean {
  try {
    if (lstatSync(entry).isFile()) return true; // gitfile: a worktree pointer
    return (
      existsSync(path.join(entry, "HEAD")) &&
      existsSync(path.join(entry, "objects")) &&
      existsSync(path.join(entry, "refs"))
    );
  } catch {
    return false;
  }
}

export class CachedContextProject {
  private static instance: ContextProject | undefined;

  static get(): ContextProject {
    return (this.instance ??= new ContextProject());
  }
}
