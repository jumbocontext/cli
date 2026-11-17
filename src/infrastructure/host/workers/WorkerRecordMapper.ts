/**
 * WorkerRecordMapper - Maps infrastructure WorkerRecord to application-layer types.
 *
 * Handles type casting at the infrastructure-application boundary.
 */

import {
  WorkerId,
  createWorkerId,
} from "../../../application/host/workers/WorkerId.js";
import { WorkerMode } from "../../../application/host/workers/WorkerMode.js";
import { WorkerRecord } from "./WorkerRecord.js";

const VALID_MODES = new Set<string>(["plan", "implement", "review", "codify"]);

export class WorkerRecordMapper {
  toWorkerId(record: WorkerRecord): WorkerId {
    return createWorkerId(record.workerId);
  }

  toWorkerMode(record: WorkerRecord): WorkerMode {
    if (record.mode !== null && VALID_MODES.has(record.mode)) {
      return record.mode as WorkerMode;
    }
    return null;
  }
}
