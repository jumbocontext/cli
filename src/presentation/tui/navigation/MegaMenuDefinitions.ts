import type { ScreenKey } from "./ScreenDefinitions.js";
import { GoalStatus } from "../../../domain/goals/Constants.js";
import type { GoalStatusType } from "../../../domain/goals/Constants.js";

export interface MegaMenuItem {
  readonly key: string;
  readonly label: string;
  readonly screenKey?: ScreenKey;
  readonly goalStatusFilter?: readonly GoalStatusType[];
  readonly children?: readonly MegaMenuItem[];
}

export interface MegaMenuSection {
  readonly key: string;
  readonly label: string;
  readonly screenKey?: ScreenKey;
  readonly goalStatusFilter?: readonly GoalStatusType[];
  readonly shortcut: string;
  readonly children: readonly MegaMenuItem[];
}

const MEGA_MENU_PRESENTATION_KEYS = {
  cockpit: "cockpit",
  decisions: "decisions",
  components: "components",
  goals: "goals",
  backlog: "backlog",
  active: "active",
  archive: "archive",
  removed: "removed",
  memory: "memory",
  invariants: "invariants",
  dependencies: "dependencies",
  guidelines: "guidelines",
  settings: "settings",
} as const;

export const MEGA_MENU_GOAL_STATUS_FILTERS = {
  backlog: [GoalStatus.TODO, GoalStatus.POSTPONED, GoalStatus.REFINED],
  active: [GoalStatus.DOING, GoalStatus.BLOCKED, GoalStatus.INREVIEW],
  archive: [GoalStatus.DONE],
  defined: [GoalStatus.TODO],
  postponed: [GoalStatus.POSTPONED],
  refined: [GoalStatus.REFINED],
  doing: [GoalStatus.DOING],
  blocked: [GoalStatus.BLOCKED],
  inReview: [GoalStatus.INREVIEW],
  done: [GoalStatus.DONE],
} as const satisfies Record<string, readonly GoalStatusType[]>;

export const MEGA_MENU_SECTIONS: readonly MegaMenuSection[] = [
  {
    key: MEGA_MENU_PRESENTATION_KEYS.cockpit,
    label: "Cockpit",
    screenKey: "cockpit",
    shortcut: "1",
    children: [],
  },
  {
    key: MEGA_MENU_PRESENTATION_KEYS.goals,
    label: "Goals",
    screenKey: "goals",
    shortcut: "2",
    children: [
      {
        key: MEGA_MENU_PRESENTATION_KEYS.backlog,
        label: "Backlog",
        screenKey: "goals",
        goalStatusFilter: MEGA_MENU_GOAL_STATUS_FILTERS.backlog,
        children: [
          {
            key: GoalStatus.TODO,
            label: "Defined",
            screenKey: "goals",
            goalStatusFilter: MEGA_MENU_GOAL_STATUS_FILTERS.defined,
          },
          {
            key: GoalStatus.REFINED,
            label: "Refined",
            screenKey: "goals",
            goalStatusFilter: MEGA_MENU_GOAL_STATUS_FILTERS.refined,
          },
          {
            key: GoalStatus.POSTPONED,
            label: "Postponed",
            screenKey: "goals",
            goalStatusFilter: MEGA_MENU_GOAL_STATUS_FILTERS.postponed,
          },
        ],
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.active,
        label: "Active",
        screenKey: "goals",
        goalStatusFilter: MEGA_MENU_GOAL_STATUS_FILTERS.active,
        children: [
          {
            key: GoalStatus.DOING,
            label: "In Progress",
            screenKey: "goals",
            goalStatusFilter: MEGA_MENU_GOAL_STATUS_FILTERS.doing,
          },
          {
            key: GoalStatus.BLOCKED,
            label: "Blocked",
            screenKey: "goals",
            goalStatusFilter: MEGA_MENU_GOAL_STATUS_FILTERS.blocked,
          },
          {
            key: GoalStatus.INREVIEW,
            label: "In Review",
            screenKey: "goals",
            goalStatusFilter: MEGA_MENU_GOAL_STATUS_FILTERS.inReview,
          },
        ],
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.archive,
        label: "Archive",
        screenKey: "goals",
        goalStatusFilter: MEGA_MENU_GOAL_STATUS_FILTERS.archive,
        children: [
          {
            key: GoalStatus.DONE,
            label: "Completed",
            screenKey: "goals",
            goalStatusFilter: MEGA_MENU_GOAL_STATUS_FILTERS.done,
          },
          { key: MEGA_MENU_PRESENTATION_KEYS.removed, label: "Removed" },
        ],
      },
    ],
  },
  {
    key: MEGA_MENU_PRESENTATION_KEYS.memory,
    label: "Memory",
    shortcut: "3",
    children: [
      {
        key: MEGA_MENU_PRESENTATION_KEYS.decisions,
        label: "Decisions",
        screenKey: "decisions",
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.invariants,
        label: "Invariants",
        screenKey: "invariants",
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.components,
        label: "Components",
        screenKey: "components",
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.dependencies,
        label: "Dependencies",
        screenKey: "dependencies",
      },
      {
        key: MEGA_MENU_PRESENTATION_KEYS.guidelines,
        label: "Guidelines",
        screenKey: "guidelines",
      },
    ],
  },
  {
    key: MEGA_MENU_PRESENTATION_KEYS.settings,
    label: "Settings",
    screenKey: "settings",
    shortcut: "4",
    children: [],
  },
] as const;

export const MAX_MENU_DEPTH = 3;
