/**
 * ProjectLifecycleState - Derived project state for cockpit routing.
 *
 * This state is calculated from existing project and knowledge read models.
 */
export type ProjectLifecycleState =
  "uninitialized" | "unprimed" | "primed-empty" | "primed";
