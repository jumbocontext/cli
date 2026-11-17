import { PlannedFileChange } from "../context/project/init/PlannedFileChange.js";

/**
 * Port interface for ensuring settings exist during initialization.
 */
export interface ISettingsInitializer {
  /**
   * Ensure the project's convention-derived settings.json exists with defaults.
   */
  ensureSettingsFileExists(): Promise<void>;

  /**
   * Get planned file change for settings file.
   * Returns null if settings file already exists (no change needed).
   *
   * @returns PlannedFileChange or null if no change needed
   */
  getPlannedFileChange(): Promise<PlannedFileChange | null>;
}
