import { useCallback, useContext } from "react";
import type { ProjectStatsController } from "../../../application/context/project/stats/ProjectStatsController.js";
import type { ProjectStatsResponse } from "../../../application/context/project/stats/ProjectStatsResponse.js";
import { StateReaderContext } from "./StateReaderContext.js";
import { DEFAULT_STATE_READER_TICK_MS } from "./StateReaderDefaults.js";
import type { StateSnapshot } from "./StateSnapshot.js";
import { useTickingReadModel } from "./useTickingReadModel.js";

export function useProjectStats(): StateSnapshot<ProjectStatsResponse> {
  const context = useContext(StateReaderContext);
  const controller = context?.controllers.projectStatsController as
    Pick<ProjectStatsController, "handle"> | undefined;

  return useTickingReadModel<ProjectStatsResponse>(
    useCallback(async () => {
      if (controller === undefined) {
        return null;
      }

      return controller.handle({ currentOnly: true });
    }, [controller]),
    controller === undefined
      ? 0
      : (context?.tickMs ?? DEFAULT_STATE_READER_TICK_MS),
  );
}
