import { useCallback, useContext } from "react";
import type { GetGoalsRequest } from "../../../application/context/goals/get/GetGoalsRequest.js";
import type { GetGoalsResponse } from "../../../application/context/goals/get/GetGoalsResponse.js";
import type { GoalStatusType } from "../../../domain/goals/Constants.js";
import { StateReaderContext } from "./StateReaderContext.js";
import { DEFAULT_STATE_READER_TICK_MS } from "./StateReaderDefaults.js";
import type { StateSnapshot } from "./StateSnapshot.js";
import { useTickingReadModel } from "./useTickingReadModel.js";

export function useGoalsList(
  statusFilter?: readonly GoalStatusType[],
): StateSnapshot<GetGoalsResponse> {
  const context = useContext(StateReaderContext);
  const controller = context?.controllers.getGoalsController;

  return useTickingReadModel<GetGoalsResponse>(
    useCallback(async () => {
      if (controller === undefined) {
        return null;
      }

      const request: GetGoalsRequest =
        statusFilter === undefined ? {} : { statuses: [...statusFilter] };
      return controller.handle(request);
    }, [controller, statusFilter]),
    controller === undefined
      ? 0
      : (context?.tickMs ?? DEFAULT_STATE_READER_TICK_MS),
  );
}
