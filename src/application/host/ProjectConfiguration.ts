/** Project configuration after a reader has decoded and validated its source. */
export type ProjectConfiguration = {
  readonly projectId: string;
  /** Selects project data access; this is not a live connection or credential store. */
  readonly connection: {
    readonly backend: "local" | "remote";
  };
};
