import { useCallback, useContext } from "react";
import type { GetAllInvariantsResponse } from "../../../application/context/invariants/get/GetAllInvariantsResponse.js";
import { StateReaderContext } from "./StateReaderContext.js";
import { DEFAULT_STATE_READER_TICK_MS } from "./StateReaderDefaults.js";
import type { StateSnapshot } from "./StateSnapshot.js";
import { useTickingReadModel } from "./useTickingReadModel.js";

export function useInvariantsList(): StateSnapshot<GetAllInvariantsResponse> {
  const context = useContext(StateReaderContext);
  const controller = context?.controllers.getInvariantsController;

  return useTickingReadModel<GetAllInvariantsResponse>(
    useCallback(async () => {
      if (controller === undefined) {
        return null;
      }

      return controller.getAllInvariants({});
    }, [controller]),
    controller === undefined
      ? 0
      : (context?.tickMs ?? DEFAULT_STATE_READER_TICK_MS),
  );
}
