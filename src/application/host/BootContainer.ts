import type { ILogger } from "../logging/ILogger.js";

export interface BootContainer {
  readonly projectDataDir: string;
  logger: ILogger;
}
