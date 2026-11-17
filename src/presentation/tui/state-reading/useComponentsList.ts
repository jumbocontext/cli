import { useCallback, useContext } from "react";
import type { GetComponentsResponse } from "../../../application/context/components/list/GetComponentsResponse.js";
import type { ComponentStatusFilter } from "../../../application/context/components/get/IComponentViewReader.js";
import { ComponentStatus } from "../../../domain/components/Constants.js";
import { StateReaderContext } from "./StateReaderContext.js";
import { DEFAULT_STATE_READER_TICK_MS } from "./StateReaderDefaults.js";
import type { StateSnapshot } from "./StateSnapshot.js";
import { useTickingReadModel } from "./useTickingReadModel.js";

export function useComponentsList(
  status: ComponentStatusFilter = ComponentStatus.ACTIVE,
): StateSnapshot<GetComponentsResponse> {
  const context = useContext(StateReaderContext);
  const controller = context?.controllers.getComponentsController;

  return useTickingReadModel<GetComponentsResponse>(
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
