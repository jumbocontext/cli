/**
 * Project-relative managed artifacts retired by init and evolve.
 * Add new retired files or directories here; cleanup and orchestration stay unchanged.
 */
const RETIRED_DISCOVERY_SKILL = "jumbo-command-discovery";
const SKILL_PLATFORMS = [
  ".agents/skills",
  ".claude/skills",
  ".vibe/skills",
  ".codex/skills",
  ".gemini/skills",
] as const;

export const DEPRECATED_MANAGED_PATHS: readonly string[] = [
  ...SKILL_PLATFORMS.map(platform => `${platform}/${RETIRED_DISCOVERY_SKILL}`),
];
