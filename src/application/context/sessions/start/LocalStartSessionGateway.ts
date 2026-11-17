import { IStartSessionGateway } from "./IStartSessionGateway.js";
import { SessionStartRequest } from "./SessionStartRequest.js";
import { SessionStartResponse } from "./SessionStartResponse.js";
import { StartSessionCommandHandler } from "./StartSessionCommandHandler.js";
import { IBrownfieldStatusReader } from "./IBrownfieldStatusReader.js";
import { ISettingsReader } from "../../../settings/ISettingsReader.js";
import { DEFAULT_BACKLOG_PREVIEW_SIZE } from "../../../settings/Settings.js";
import { GoalBacklogPreviewQueryHandler } from "../../goals/query/GoalBacklogPreviewQueryHandler.js";

export class LocalStartSessionGateway implements IStartSessionGateway {
  constructor(
    private readonly startSessionCommandHandler: StartSessionCommandHandler,
    private readonly brownfieldStatusReader: IBrownfieldStatusReader,
    private readonly settingsReader: ISettingsReader,
    private readonly goalBacklogPreviewQueryHandler: GoalBacklogPreviewQueryHandler,
  ) {}

  async startSession(
    _request: SessionStartRequest,
  ): Promise<SessionStartResponse> {
    const [isUnprimed, settings] = await Promise.all([
      this.brownfieldStatusReader.isUnprimed(),
      this.settingsReader.read(),
    ]);
    const backlogPreviewSize =
      settings.session?.backlogPreviewSize ?? DEFAULT_BACKLOG_PREVIEW_SIZE;
    const backlogPreview =
      await this.goalBacklogPreviewQueryHandler.execute(backlogPreviewSize);
    const result = await this.startSessionCommandHandler.execute({});

    return {
      sessionId: result.sessionId,
      status: "active",
      isUnprimedBrownfield: isUnprimed,
      backlogPreview,
    };
  }
}
