import { WorkerId } from "../../../domain/workers/WorkerId.js";

export type { WorkerId } from "../../../domain/workers/WorkerId.js";

/**
 * Creates a WorkerId from a string value.
 *
 * @param value - The string value to convert to a WorkerId
 * @returns The branded WorkerId
 */
export function createWorkerId(value: string): WorkerId {
  return WorkerId.fromLegacy(value);
}
