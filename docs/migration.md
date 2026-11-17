# Migrating project-local Jumbo storage

New Jumbo installations use one per-user application root. Existing `<workspace>/.jumbo` installations must be explicitly copied into that layout before normal project commands can run.

## Preparation

1. Stop **all** Jumbo commands, worker daemons and coding agents using the legacy project. Migration does not stop them for you or lock older CLI versions out of the source.
2. Back up the entire legacy `.jumbo` directory. Do not share private settings, logs or data through Git.
3. Run the new CLI from the exact legacy project root, not a descendant. In Git, this must be the main checkout root, not a linked worktree or nested subproject.

```sh
jumbo migrate
```

The command is noninteractive and scriptable. Neither a Git repository nor an installed Git executable is required for directory-only projects: the invocation directory selects that project's resources. Git is used only when checkout metadata exists, to resolve shared worktree storage. Herd, login and project-service construction are not required. Help and version remain usable before migration.

## Destination

- Linux: `~/.jumbo/`.
- macOS: `~/Library/Application Support/jumbo`.
- Windows: `<user-home>\.jumbo\`, for example `C:\Users\jjw\.jumbo\`.

XDG, APPDATA and LOCALAPPDATA variables do not redirect the Linux or Windows root.

The root reserves `settings.json` for application settings and holds `projects/`. There is no workspace registry. Project directory names encode the full canonical main-checkout path (or exact invocation directory outside Git); `/home/jjw/jumbo/cli` becomes `projects/--home-jjw-jumbo-cli--/`. Literal hyphens within path segments are encoded as `%2D` to avoid collisions with directory separators. Settings, events, logs, database and other copied artifacts remain together. Every linked worktree resolves to this same store automatically.

Stores created by the earlier experimental registry implementation may use unescaped hyphen keys. Inspect and relocate those stores explicitly before using this layout; this migration command only converts project-local `.jumbo` storage, not registry-era stores.

Migration preserves the project ID and unknown settings, converts `settings.jsonc` to `settings.json`, and selects the local backend. Older missing settings identity is recovered from project initialization events; conflicting or unrecoverable identity stops migration. A staged database snapshot retains committed WAL contents and is checked before SQLite backup. Changes to source artifacts during the copy cause rejection. Symbolic links require manual inspection/migration.

The validated destination directory is published atomically. Existing destinations and concurrent migrations are refused, never overwritten. Normal commands discover the new settings directly after success, even while legacy artifacts remain. No registration or attachment is needed.

## Verification and retained originals

After success, run `jumbo project show` and verify the expected project and history. Original artifacts are retained byte-for-byte; migration neither deletes them nor updates repository agent instructions/hooks.

**Do not resume an older Jumbo CLI against the retained `.jumbo` directory.** It would create a divergent working history. This implementation does not prevent an older binary from doing so. Treat originals as backup only.

## Failure, interruption and rollback

An ordinary failed attempt removes its own staged/copy destination and releases its migration lock. Original artifacts remain untouched. Existing destination content is never adopted or removed automatically.

A killed process may leave a `.migration-*` staging directory or a `<project-directory>.migration-lock` directory. If publication completed, the complete destination is already discoverable; there is no later registration step. Automatic resume and recovery are not implemented. Stop migration processes and retain all artifacts before inspecting these remnants; do not remove a lock belonging to a live process or overwrite an existing destination to retry.

Before considering rollback, stop the new CLI and back up both stores. Any writes made after successful migration exist only in the new store. Returning to retained originals would lose those writes unless separately recovered; there is no automatic merge or downgrade command.
