import path from "path";

export interface NamespaceMigration {
  namespace: string;
  path: string;
}

export function getNamespaceMigrations(
  infrastructureDir: string,
): NamespaceMigration[] {
  return [
    {
      namespace: "sessions",
      path: path.join(infrastructureDir, "context/sessions/migrations"),
    },
    {
      namespace: "goals",
      path: path.join(infrastructureDir, "context/goals/migrations"),
    },
    // Solution category
    {
      namespace: "decisions",
      path: path.join(infrastructureDir, "context/decisions/migrations"),
    },
    {
      namespace: "architecture",
      path: path.join(infrastructureDir, "context/architecture/migrations"),
    },
    {
      namespace: "components",
      path: path.join(infrastructureDir, "context/components/migrations"),
    },
    {
      namespace: "dependencies",
      path: path.join(infrastructureDir, "context/dependencies/migrations"),
    },
    {
      namespace: "guidelines",
      path: path.join(infrastructureDir, "context/guidelines/migrations"),
    },
    {
      namespace: "invariants",
      path: path.join(infrastructureDir, "context/invariants/migrations"),
    },
    {
      namespace: "search",
      path: path.join(infrastructureDir, "context/search/migrations"),
    },
    // Project knowledge category
    {
      namespace: "project",
      path: path.join(infrastructureDir, "context/project/migrations"),
    },
    {
      namespace: "audiences",
      path: path.join(infrastructureDir, "context/audiences/migrations"),
    },
    {
      namespace: "audience-pains",
      path: path.join(infrastructureDir, "context/audience-pains/migrations"),
    },
    {
      namespace: "value-propositions",
      path: path.join(
        infrastructureDir,
        "context/value-propositions/migrations",
      ),
    },
    {
      namespace: "relations",
      path: path.join(infrastructureDir, "context/relations/migrations"),
    },
    {
      namespace: "workers",
      path: path.join(infrastructureDir, "host/workers/migrations"),
    },
  ];
}
