import { FsEventStore } from "../../../persistence/FsEventStore.js";
import type { IDecisionRemovedEventWriter } from "../../../../application/context/decisions/remove/IDecisionRemovedEventWriter.js";

export class FsDecisionRemovedEventStore extends FsEventStore implements IDecisionRemovedEventWriter {}
