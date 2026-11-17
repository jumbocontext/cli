# Tests

## Layout

- `unit/`: isolated behavior tests, organized like `src/`.
- `integration/`: real infrastructure, cross-component, compiled-process, and mixed suites. Existing mixed suites remain intact during migration.
- `acceptance/cli/`: CLI features and colocated Cucumber steps, organized by CLI command hierarchy, without an extra `commands/` directory.
- `fixtures/` and `helpers/`: existing shared test utilities. They remain in place to keep this migration mechanical.

Example use-case parity:

```text
src/presentation/cli/commands/project/init/project.init.ts
tests/unit/presentation/cli/commands/project/init/project.init.test.ts
tests/acceptance/cli/project/init/project.init.feature
tests/acceptance/cli/project/init/project.init.steps.ts
```

## Commands

```bash
npm run test:unit
npm run test:integration
npm test
```

`npm test` runs the Jest unit and integration projects. It does not run Cucumber.
Compiled-CLI integration tests require a current build.

Build before acceptance tests so they exercise current implementation:

```bash
npm run build
npm run test:acceptance
```

Run only the initialization feature:

```bash
npm run test:acceptance -- --tags @project-init
```

Type-check acceptance support and steps without executing scenarios:

```bash
node node_modules/typescript/bin/tsc --project tests/acceptance/tsconfig.json
```

## CLI acceptance conventions

- Features describe user-visible behavior, not services or method calls.
- Use-case-specific steps live beside their feature.
- `acceptance/shared/` contains reusable workspace, isolated-home, Git, and settings fixtures.
- `acceptance/cli/shared/` contains the CLI subprocess driver, scenario world, and Cucumber lifecycle hooks.
- Invoke the compiled CLI as a public API. Do not import or mock application services.
- Assert exit codes, output, and observable filesystem state.
- Existing-settings fixtures use the documented storage convention directly; they do not invoke an internal settings writer.
- Each scenario has its own workspace and home, removed after the scenario.
- Acceptance scenarios may deliberately fail while the underlying framework is being corrected. Do not weaken them to match current implementation.
