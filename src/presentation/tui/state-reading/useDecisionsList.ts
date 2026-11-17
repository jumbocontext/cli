import { useCallback, useContext } from "react";
import type { GetDecisionsResponse } from "../../../application/context/decisions/get/GetDecisionsResponse.js";
import type { DecisionStatusFilter } from "../../../application/context/decisions/get/IDecisionViewReader.js";
import { DecisionStatus } from "../../../domain/decisions/Constants.js";
import { StateReaderContext } from "./StateReaderContext.js";
import { DEFAULT_STATE_READER_TICK_MS } from "./StateReaderDefaults.js";
import type { StateSnapshot } from "./StateSnapshot.js";
import { useTickingReadModel } from "./useTickingReadModel.js";

export function useDecisionsList(
  status: DecisionStatusFilter = DecisionStatus.ACTIVE,
): StateSnapshot<GetDecisionsResponse> {
  const context = useContext(StateReaderContext);
  const controller = context?.controllers.getDecisionsController;

  return useTickingReadModel<GetDecisionsResponse>(
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
