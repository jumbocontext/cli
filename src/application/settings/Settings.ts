/**
 * Settings type definitions for application-wide configuration.
 * Project settings live in settings.json beneath the per-user application root's project directory.
 */

export interface QASettings {
  /**
   * Default turn limit for QA iterations on goal completion.
   * When this limit is reached, the goal is automatically completed.
   * Default: 3
   */
  defaultTurnLimit: number;
}

export interface ProjectSettings {
  /**
   * Stable project aggregate identity.
   *
   * New projects receive a generated UUID at initialization. Existing projects
   * created before this setting is populated migrate to their projected id.
   */
  id: string | null;
}

/**
 * Default claim duration in milliseconds (30 minutes).
 * Used as the fallback when no custom duration is configured.
 */
export const DEFAULT_CLAIM_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Default claim duration in minutes.
 * Used in settings file for user-friendly configuration.
 */
export const DEFAULT_CLAIM_DURATION_MINUTES = 30;

export interface ClaimSettings {
  /**
   * Duration in minutes that a goal claim remains valid.
   * After this duration, the claim expires and another worker can claim the goal.
   * Default: 30 minutes
   */
  claimDurationMinutes: number;
}

export interface TelemetrySettings {
  /**
   * Whether anonymous usage telemetry is enabled.
   * Default: true (opt-out model)
   */
  enabled: boolean;

  /**
   * Anonymous identifier used for telemetry events after opt-in.
   * Null until telemetry is enabled for the first time.
   */
  anonymousId: string | null;

  /**
   * Whether the user has explicitly made a telemetry consent decision.
   * False until the user opts in or out via the init prompt or
   * telemetry enable/disable commands.
   */
  consentGiven: boolean;
}

export interface TuiSettings {
  /**
   * Whether the Cockpit launchpad welcome panel should be shown.
   * Default: true
   */
  showLaunchpadWelcome: boolean;
}

/**
 * Default number of backlog goals shown in session-start preview.
 */
export const DEFAULT_BACKLOG_PREVIEW_SIZE = 5;

export interface SessionSettings {
  /**
   * Maximum number of available backlog goals to include in session start.
   * Default: 5
   */
  backlogPreviewSize: number;
}

export interface Settings {
  /**
   * Project identity settings
   */
  project?: ProjectSettings;

  /**
   * QA (Quality Assurance) settings for goal completion
   */
  qa: QASettings;

  /**
   * Claim settings for goal ownership and concurrency control
   */
  claims: ClaimSettings;

  /**
   * Telemetry consent and identity settings
   */
  telemetry: TelemetrySettings;

  /**
   * TUI presentation preferences
   */
  tui?: TuiSettings;

  /**
   * Session workflow preferences
   */
  session?: SessionSettings;
}
