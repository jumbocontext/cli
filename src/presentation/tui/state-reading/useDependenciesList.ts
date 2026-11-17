import { useCallback, useContext } from "react";
import type { GetDependenciesResponse } from "../../../application/context/dependencies/get/GetDependenciesResponse.js";
import type { DependencyListFilter } from "../../../application/context/dependencies/get/IDependencyViewReader.js";
import { StateReaderContext } from "./StateReaderContext.js";
import { DEFAULT_STATE_READER_TICK_MS } from "./StateReaderDefaults.js";
import type { StateSnapshot } from "./StateSnapshot.js";
import { useTickingReadModel } from "./useTickingReadModel.js";

export function useDependenciesList(
  filter?: DependencyListFilter,
): StateSnapshot<GetDependenciesResponse> {
  const context = useContext(StateReaderContext);
  const controller = context?.controllers.getDependenciesController;

  return useTickingReadModel<GetDependenciesResponse>(
    useCallback(async () => {
      if (controller === undefined) {
        return null;
      }

      return controller.handle(filter === undefined ? {} : { filter });
    }, [controller, filter]),
    controller === undefined
      ? 0
      : (context?.tickMs ?? DEFAULT_STATE_READER_TICK_MS),
  );
}
