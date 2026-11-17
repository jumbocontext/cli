import { createContext } from "react";
import type { StateReaderControllers } from "./StateReaderControllers.js";

interface StateReaderContextValue {
  readonly controllers: StateReaderControllers;
  readonly tickMs: number;
}

export const StateReaderContext = createContext<StateReaderContextValue | null>(
  null,
);
