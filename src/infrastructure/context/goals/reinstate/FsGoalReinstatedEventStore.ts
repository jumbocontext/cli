import { IGoalReinstatedEventReader } from "../../../../application/context/goals/reinstate/IGoalReinstatedEventReader.js";
import { IGoalReinstatedEventWriter } from "../../../../application/context/goals/reinstate/IGoalReinstatedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";
import { FsEventStore } from "../../../persistence/FsEventStore.js";

export class FsGoalReinstatedEventStore
  extends FsEventStore
  implements IGoalReinstatedEventWriter, IGoalReinstatedEventReader
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
