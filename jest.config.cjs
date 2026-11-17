const sharedConfiguration = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transformIgnorePatterns: ["node_modules/(?!uuid)"],
  transform: {
    "^.+\\.[jt]sx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "./tsconfig.jest.json",
      },
    ],
  },
};

module.exports = {
  maxWorkers: "50%",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/__tests__/**",
    "!src/**/*.test.ts",
    "!src/cli.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  projects: [
    {
      ...sharedConfiguration,
      displayName: "unit",
      roots: ["<rootDir>/tests/unit"],
    },
    {
      ...sharedConfiguration,
      displayName: "integration",
      roots: ["<rootDir>/tests/integration"],
    },
  ],
};
