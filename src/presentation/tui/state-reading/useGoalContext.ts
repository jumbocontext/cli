import { useCallback, useContext } from "react";
import type { ShowGoalResponse } from "../../../application/context/goals/get/ShowGoalResponse.js";
import { StateReaderContext } from "./StateReaderContext.js";
import { DEFAULT_STATE_READER_TICK_MS } from "./StateReaderDefaults.js";
import type { StateSnapshot } from "./StateSnapshot.js";
import { useTickingReadModel } from "./useTickingReadModel.js";

export function useGoalContext(
  goalId?: string,
): StateSnapshot<ShowGoalResponse> {
  const context = useContext(StateReaderContext);
  const controller = context?.controllers.showGoalController;

  return useTickingReadModel<ShowGoalResponse>(
    useCallback(async () => {
      if (controller === undefined || goalId === undefined) {
        return null;
      }

      return controller.handle({ goalId });
    }, [controller, goalId]),
    controller === undefined || goalId === undefined
      ? 0
      : (context?.tickMs ?? DEFAULT_STATE_READER_TICK_MS),
  );
}
