import { useCallback, useContext } from "react";
import type { ProjectSummaryView } from "../../../application/context/project/ProjectSummaryView.js";
import { StateReaderContext } from "./StateReaderContext.js";
import { DEFAULT_STATE_READER_TICK_MS } from "./StateReaderDefaults.js";
import type { StateSnapshot } from "./StateSnapshot.js";
import { useTickingReadModel } from "./useTickingReadModel.js";

export function useProjectContext(): StateSnapshot<ProjectSummaryView> {
  const context = useContext(StateReaderContext);
  const controller = context?.controllers.getProjectSummaryQueryHandler;

  return useTickingReadModel<ProjectSummaryView>(
    useCallback(async () => {
      if (controller === undefined) {
        return null;
      }

      return controller.execute();
    }, [controller]),
    controller === undefined
      ? 0
      : (context?.tickMs ?? DEFAULT_STATE_READER_TICK_MS),
  );
}
