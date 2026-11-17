<p align="center">
  <img src="jumbo-logo.svg" alt="Jumbo" width="200">
</p>

# Jumbo Context
### Tired of repeating yourself to Claude, Codex, Antigravity, Copilot and their cohorts?

Agents shouldn't have to be re-taught your project every session.
Jumbo gives them the context they're missing, so you don't have to. 

- Memory (Capture important details about your project _once_)
- Continuity across sessions
- Automatic goal specification
- Extended context windows
- Concurrent agents
- Harness and model agnostic

![](/assets/images/this-is-jumbo.gif)

## Can we address the elephant in the room?
<sub style="color:#898989">(a.k.a. What problems does this solve?)</sub>

Working with coding agents is amazing. But let's be honest, it' not without frustration. Here are the common issues:

- **Agent Amnesia**: It's a thing. Every session that came before is forgotten. You spend time and energy getting the agent caught up before you even start thinking about your goals.

- **Slop**: AI without guardrails can produce code that *kind of* works, but it’s rarely production-ready. Worse, it can leave behind a mess that takes hours to untangle. That’s not a productivity boost — it’s a hassle.

- **Vendor lock-in**: If an agent harness holds your memory, switching tools means losing that context. With new models and tools shipping every week, switching is inevitable. Your context should move with you.

## How does Jumbo help?

Jumbo was created to address these frustrations and unlock the full joy of coding with agents.

- **Memory:** Details about your project are saved, so your agents always have the correct context. Agent Amnesia is, well...forgotten. 

- **Quality:** Your coding agents write shippable code on the first shot. You save time and tokens.  
  
- **Interoperability:** Jumbo is harness- and model-agnostic.   

- **Portability:** Switch to new models when they're released. Your context stays with you.

- **Orchestration:** Run different agents in parallel. Optimize for capability and cost. Jumbo keeps everything in sync.

Those solve the core problems. These make Jumbo pleasant to use:

- **Extended context windows**: Run agents longer without context rot.<sup>*</sup>

- **Automatic**: Hooks into your agent session and orchestrates the flow. It just works.

- **Full control**: Jumbo's memories are yours. Stay in control and manage your data directly from the terminal.

- **Private**: All data stays local. Nothing leaves your machine.

- **Fast**: No network calls. No lag. Everything runs locally.

<sup>*</sup> <sub>Only works for harnesses that support hooks.</sub>


## Quick Start

1. Install Jumbo globally
``` bash
> npm i -g jumbo-cli
```

2. Browse your project folder and run Jumbo
``` bash
> jumbo
```
Jumbo will guide you in getting started.

3. Run your agent as normal (claude, codex, agy, vibe)

``` bash
> claude
[Nudge your agent once its running]
> Follow instructions
```

Jumbo will automatically orient the agent about your project and available goals.

> [!NOTE]
> Goals are the heart of Jumbo. Every memory, guideline, and constraint attaches to a goal — so define your work there first. (see `jumbo goal add --help`)
> 
> Your agent can help define goals too. It knows how to use Jumbo.

> [!TIP]
> Hit the ground running with the [Jumbo Memories](https://github.com/jumbocontext/jumbo-memories) repo — a curated library of best practice guidelines and invariants ready to drop into any project.

See the [Getting started](docs/getting-started/first-run.md) guide for the full workflow.

## Compatibility
Jumbo seamlessly integrates with all frontier harnesses and models. Use them interchangeably or in parallel. 

It also works with any agent that supports [AGENTS.md](https://agents.md) and truly excels with harnesses that support [open agent skills](https://agentskills.io). 

Use Jumbo in a harness that supports hooks and you'll never think about context windows again.

## How does it work?
It's simple. You just define your goals — describe your objective, criteria, and scope. Then run your agents and Jumbo guides them through the workflow:

1. **Refine:** Your agent collaborates with Jumbo to couple all relevant memories to your goal and build a context packet ready for the agent to implement.
2. **Implement:** Jumbo serves a curated context packet to your agent when it starts work on your goal.
3. **Review:** Your agent reviews the goal against criteria and project specification. Non-passing goals are rejected and queued for reimplementation.
4. **Codify:** Agents update documentation, change logs, and register any missing details that need to be preserved for future goals.

You don't have to remember all these steps. Jumbo hooks into your agent sessions and guides the entire flow.

Every time you start Claude Code (or similar) Jumbo will orient the agent about the state of your project. The agent will prompt you with an overview of planned work and ask what you want to work on. Just point at a goal and watch the magic happen.


## What's in the trunk?
Jumbo remembers:

Your domain:
- **Project**: What you are building and who it's for. 
- **Audiences**: Who uses your project and their priorities.
- **Audience Pains**: The problems your audiences face that you aim to solve.
- **Value Propositions**: How your product addresses each audience pain. 

Your solution:
- **Architecture**: Your solution design, structure, and patterns applied.
- **Components**: The parts comprising your solution and their roles.
- **Dependencies**: Third-party packages and external services your project relies on. 
- **Decisions**: History of why you chose what you chose.
- **Guidelines**: Preferences, best practices, and the standards you adhere to.
- **Invariants**: Rules you simply won't compromise on.  
- **Relations**: The graph that ties it all together.  

Your operations:
- **Goals**: The specifics - objective, criteria, scope, boundaries, and contextual relations.
- **Sessions**: Manage work continuity with pause, resume, compact, and multi-agent support.

## Architecture

Jumbo follows **Clean Screaming Architecture** — four layers, strict dependency rules, and file names that tell you exactly what they do.

- **Domain**: Aggregates, events, and policies. Zero dependencies on anything outside.
- **Application**: Command handlers, controllers, and gateway abstractions. Orchestrates the workflows.
- **Infrastructure**: Event store, SQLite projections, and gateway implementations. The concrete stuff.
- **Presentation**: CLI commands and output builders. Parses input, formats output, stays in its lane.

Dependencies always point inward. Swap out the infrastructure and nothing else notices.

Core patterns:

- **Event Sourcing**: Every state change is a domain event, appended to an immutable JSONL log. Full history, full replay.
- **CQRS**: Writes produce events through command handlers. Reads come from SQLite views. Each side is optimized independently.
- **DDD**: One aggregate per bounded context. Domain events live next to their entity. Business rules stay pure.
- **Gateway Pattern**: Controllers talk to abstractions. Infrastructure provides the implementations. Wired up at startup via Inversify.

Data lives in two stores:

- **Event store**: Append-only JSONL files. Human-readable. The source of truth.
- **SQLite**: Fast read views projected from the event stream. Rebuildable anytime with `jumbo db rebuild`.

When your agent starts a goal, Jumbo assembles a context packet on the fly — pulling in the components, decisions, guidelines, invariants, and architecture linked to that goal through relations. No stale caches. Always current.

### Built with

- **Core Libraries:**
  - [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) : Read-model projections
  - [`commander`](https://github.com/tj/commander.js) : CLI framework
  - [`inversify`](https://github.com/inversify/monorepo) + [`reflect-metadata`](https://github.com/rbuckton/reflect-metadata) : Dependency injection
  - [`yaml`](https://github.com/eemeli/yaml) : Context serialization
- **Terminal UI:**
  - [`ink`](https://github.com/vadimdemedes/ink) + [`react`](https://github.com/facebook/react) : Interactive terminal UI
  - [`inquirer`](https://github.com/SBoudrias/Inquirer.js) : CLI prompts
  - [`chalk`](https://github.com/chalk/chalk) : Terminal styling
  - [`boxen`](https://github.com/sindresorhus/boxen) : Terminal boxes
- **Utilities:**
  - [`date-fns`](https://github.com/date-fns/date-fns) : Date formatting
  - [`fast-glob`](https://github.com/mrmlnc/fast-glob) : File pattern matching
  - [`fs-extra`](https://github.com/jprichardson/node-fs-extra) : File system utilities
  - [`jsonc-parser`](https://github.com/microsoft/node-jsonc-parser) : JSON with comments parsing
  - [`ulid`](https://github.com/ulid/javascript) : Time-sortable unique IDs
  - [`uuid`](https://github.com/uuidjs/uuid) : Unique identifiers

Spread some ❤️ and sponsor the projects or buy them a cup of coffee. I have.

## Documentation

| Resource | Description |
| --- | --- |
| [Quickstart](docs/getting-started/first-run.md) | Get running in 5 minutes |
| [Installation](docs/getting-started/installation.md) | Prerequisites and setup |
| [Concepts](docs/getting-started/concepts.md) | Understand sessions, goals, and context |
| [What Jumbo Creates](docs/getting-started/what-jumbo-creates.md) | Generated files, folders, and local state |
| [Goal Management](docs/guides/goal-management.md) | Complete guide to tracking work |
| [Project Initialization](docs/reference/project-initialization.md) | Configure Jumbo for your project |
| [Session Management](docs/reference/commands/session.md) | Manage pause, resume, and session continuity |
| [Advanced Workflows](docs/guides/advanced-workflows.md) | Command chaining and multi-agent collaboration patterns |
| [Command Reference](docs/reference/) | Full command documentation |
| [Shared Memories](https://github.com/jumbocontext/shared-jumbo-memories) | Pluggable invariants, guidelines, and patterns to prime your project |


## FAQs

<details>
<summary>How does jumbo integrate with my AI agent?</summary>

Through hooks, with fallback to AGENTS.md. Your agent calls `jumbo session start` at the beginning of a session, and Jumbo returns a workflow router plus a bounded backlog preview. The selected workflow then loads the relevant context packet, such as `jumbo project show --northstar --format json` for goal design or `jumbo goal start --id <id>` for implementation. New insights are captured in the natural flow of your agent conversations.
</details>

<details>
<summary>What if I change agents or models?</summary>

Change agents and models at will. Jumbo just picks up where you left off.
</details>

<details>
<summary>What coding agents does jumbo work with?</summary>

Jumbo has been battle-tested with Claude Code, GitHub Copilot, Codex, and Antigravity. More are to be verified soon...
</details>

<details>
<summary>What IDEs are supported?</summary>

Theoretically, any IDE with an integrated coding agent that supports hooks or AGENTS.md should work. VS Code running GitHub Copilot has been tested and works well with all supported models. Cursor is to be verified soon...
</details>

<details>
<summary>Where is data stored?</summary>

Locally, beneath one per-user application root: `~/.jumbo/` on Linux, `~/Library/Application Support/jumbo` on macOS, and `<user-home>\\.jumbo\\` (for example `C:\\Users\\jjw\\.jumbo\\`) on Windows. XDG and AppData variables do not override the Linux/Windows root. Each project has a directory under `projects/`, named from its full root-workspace path, containing settings, events, logs and `jumbo.db`.

Existing project-local `.jumbo/` installations require explicit `jumbo migrate`. See the [migration guide](docs/migration.md).
</details>

<details>
<summary>Can I control what data Jumbo captures?</summary>

Absolutely. You can manage Jumbo directly from the CLI. You control how you want your agent to interact with Jumbo. Stay in the loop by approving each command, or run with pre-approved Jumbo commands for an automated experience.
</details>

<details>
<summary>Is Jumbo going to hijack my agent?</summary> 

Not at all. Jumbo prescribes an opinionated workflow that you can always bypass. It works alongside your agent to enhance its capabilities.  
</details>

<details>
<summary>Why not just use markdown files?</summary>  

Jumbo goes beyond static markdown files. It's an immutable event stream—capturing your entire project history, always current and auditable. You stay in your flow, never repeat yourself—only add new information when you need to. Markdown is a snapshot in time, Jumbo is your project's living memory.
</details>

<details>
<summary>Can I share context across a team?</summary>

Project storage is per OS user, outside the repository. Jumbo retains `.jumbo/` ignore protections for private legacy artifacts. Its event streams and database should not be shared through Git; independently developed histories are not automatically merged.

Love Jumbo and want to use it in your team? A cloud version is coming soon. Sign up to get notified when it's launched [here](https://jumbocontext.com/herd).
</details>

_An elephant never forgets. Neither should your agent_

## License

[AGPL-3.0](LICENSE)


<p align="center">
  Built in Copenhagen for devs who are tired of repeating themselves, by a dev who was tired of the same.
</p>
