import { execFileSync } from "node:child_process";
import { lstatSync, realpathSync } from "node:fs";
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
    
    // Search each ancestor for a Git checkout marker.
    while (true) {
      try {
        // Check whether this directory is a Git checkout root.
        lstatSync(path.join(ancestor, ".git"));
        // Stop searching once checkout metadata is found.
        break;
      } catch (error) {
        // Propagate filesystem errors other than a missing checkout marker.
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    
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
  
    // Some sandboxed environments (e.g. Codex's workspace-write sandbox)
    // materialize an empty, unusable .git directory in the workdir. When Git
    // rejects the marker, treat this context as having no checkout metadata.
    try {
      return this.#resolveCheckoutRoot(git);
    } catch (error) {
      if (!isUnusableCheckoutError(error)) throw error;
      return cwd;
    }
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


/**
 * Detects a Git marker that exists on disk but is not usable checkout
 * metadata (e.g. an empty .git directory materialized by a sandbox).
 */
function isUnusableCheckoutError(error: unknown): boolean {
  const stderr =
    error instanceof Error && "stderr" in error
      ? String((error as { stderr?: unknown }).stderr)
      : "";
  return stderr.includes("not a git repository");
}

export class CachedContextProject {
  private static instance: ContextProject | undefined;

  static get(): ContextProject {
    return (this.instance ??= new ContextProject());
  }
}
