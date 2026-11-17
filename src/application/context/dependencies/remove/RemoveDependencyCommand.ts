export interface RemoveDependencyCommand {
  readonly dependencyId: string;
  readonly reason?: string; // Optional: why it's being removed
}
