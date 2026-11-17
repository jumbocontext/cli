import { useCallback, useContext } from "react";
import type { GetSessionsResponse } from "../../../application/context/sessions/get/GetSessionsResponse.js";
import type { SessionStatusFilter } from "../../../application/context/sessions/get/ISessionViewReader.js";
import { StateReaderContext } from "./StateReaderContext.js";
import { DEFAULT_STATE_READER_TICK_MS } from "./StateReaderDefaults.js";
import type { StateSnapshot } from "./StateSnapshot.js";
import { useTickingReadModel } from "./useTickingReadModel.js";

export function useSessionsList(
  status: SessionStatusFilter = "all",
): StateSnapshot<GetSessionsResponse> {
  const context = useContext(StateReaderContext);
  const controller = context?.controllers.getSessionsController;

  return useTickingReadModel<GetSessionsResponse>(
    useCallback(async () => {
      if (controller === undefined) {
        return null;
      }

      return controller.handle({ status });
    }, [controller, status]),
    controller === undefined
      ? 0
      : (context?.tickMs ?? DEFAULT_STATE_READER_TICK_MS),
  );
}
