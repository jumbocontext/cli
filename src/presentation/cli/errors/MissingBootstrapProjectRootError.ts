/** Raised when an accepted local command resolves no bootstrap project root. */
export class MissingBootstrapProjectRootError extends Error {
  constructor() {
    super("Accepted local command has no bootstrap project root");
    this.name = "MissingBootstrapProjectRootError";
  }
}
