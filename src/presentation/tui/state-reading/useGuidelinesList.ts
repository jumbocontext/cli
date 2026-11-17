import { useCallback, useContext } from "react";
import type { GetGuidelinesResponse } from "../../../application/context/guidelines/get/GetGuidelinesResponse.js";
import { StateReaderContext } from "./StateReaderContext.js";
import { DEFAULT_STATE_READER_TICK_MS } from "./StateReaderDefaults.js";
import type { StateSnapshot } from "./StateSnapshot.js";
import { useTickingReadModel } from "./useTickingReadModel.js";

export function useGuidelinesList(
  category?: string,
): StateSnapshot<GetGuidelinesResponse> {
  const context = useContext(StateReaderContext);
  const controller = context?.controllers.getGuidelinesController;

  return useTickingReadModel<GetGuidelinesResponse>(
    useCallback(async () => {
      if (controller === undefined) {
        return null;
      }

      return controller.handle(category === undefined ? {} : { category });
    }, [category, controller]),
    controller === undefined
      ? 0
      : (context?.tickMs ?? DEFAULT_STATE_READER_TICK_MS),
  );
}
