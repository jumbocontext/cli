import { IGoalPostponedEventReader } from "../../../../application/context/goals/postpone/IGoalPostponedEventReader.js";
import { IGoalPostponedEventWriter } from "../../../../application/context/goals/postpone/IGoalPostponedEventWriter.js";
import { ILogger } from "../../../../application/logging/ILogger.js";
import { FsEventStore } from "../../../persistence/FsEventStore.js";

export class FsGoalPostponedEventStore
  extends FsEventStore
  implements IGoalPostponedEventWriter, IGoalPostponedEventReader
{
  constructor(rootDir: string, logger: ILogger) {
    super(rootDir, logger);
  }
}
