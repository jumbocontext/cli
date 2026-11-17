// Acceptance tests are not ready for release and are hidden from the
// default test runs. Re-enable these paths once they are stabilized.
export default {
  paths: [
    // "tests/acceptance/cli/**/*.feature",
    // "tests/acceptance/startup/**/*.feature",
  ],
  import: [
    // "tests/acceptance/cli/shared/world.ts",
    // "tests/acceptance/cli/shared/hooks.ts",
    // "tests/acceptance/cli/**/*.steps.ts",
    // "tests/acceptance/startup/**/*.steps.ts",
  ],
  format: ["progress"],
};
