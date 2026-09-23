export * from "./add/GoalAddedEvent.js";
export * from "./refine/GoalRefinedEvent.js";
export * from "./refine/GoalRefinementStartedEvent.js";
export * from "./block/GoalBlockedEvent.js";
export * from "./complete/GoalCompletedEvent.js";
export * from "./pause/GoalPausedEvent.js";
export * from "./postpone/GoalPostponedEvent.js";
export * from "./remove/GoalRemovedEvent.js";
export * from "./reset/GoalResetEvent.js";
export * from "./resume/GoalResumedEvent.js";
export * from "./start/GoalStartedEvent.js";
export * from "./unblock/GoalUnblockedEvent.js";
export * from "./update/GoalUpdatedEvent.js";
export * from "./update-progress/GoalProgressUpdatedEvent.js";
export * from "./review/GoalSubmittedForReviewEvent.js";
export * from "./qualify/GoalQualifiedEvent.js";
export * from "./commit/GoalCommittedEvent.js";
export * from "./reject/GoalRejectedEvent.js";
export * from "./submit/GoalSubmittedEvent.js";
export * from "./codify/GoalCodifyingStartedEvent.js";
export * from "./close/GoalClosedEvent.js";
export * from "./approve/GoalApprovedEvent.js";
export * from "./migrate/GoalStatusMigratedEvent.js";

import { GoalAddedEvent} from "./add/GoalAddedEvent.js";
import { GoalRefinedEvent} from "./refine/GoalRefinedEvent.js";
import { GoalRefinementStartedEvent} from "./refine/GoalRefinementStartedEvent.js";
import { GoalBlockedEvent} from "./block/GoalBlockedEvent.js";
import { GoalCompletedEvent} from "./complete/GoalCompletedEvent.js";
import { GoalPausedEvent} from "./pause/GoalPausedEvent.js";
import { GoalPostponedEvent } from "./postpone/GoalPostponedEvent.js";
import { GoalRemovedEvent} from "./remove/GoalRemovedEvent.js";
import { GoalResetEvent} from "./reset/GoalResetEvent.js";
import { GoalResumedEvent} from "./resume/GoalResumedEvent.js";
import { GoalStartedEvent} from "./start/GoalStartedEvent.js";
import { GoalUnblockedEvent} from "./unblock/GoalUnblockedEvent.js";
import { GoalUpdatedEvent} from "./update/GoalUpdatedEvent.js";
import { GoalProgressUpdatedEvent} from "./update-progress/GoalProgressUpdatedEvent.js";
import { GoalSubmittedForReviewEvent} from "./review/GoalSubmittedForReviewEvent.js";
import { GoalQualifiedEvent} from "./qualify/GoalQualifiedEvent.js";
import { GoalCommittedEvent} from "./commit/GoalCommittedEvent.js";
import { GoalRejectedEvent} from "./reject/GoalRejectedEvent.js";
import { GoalSubmittedEvent} from "./submit/GoalSubmittedEvent.js";
import { GoalCodifyingStartedEvent} from "./codify/GoalCodifyingStartedEvent.js";
import { GoalClosedEvent} from "./close/GoalClosedEvent.js";
import { GoalApprovedEvent} from "./approve/GoalApprovedEvent.js";
import { GoalStatusMigratedEvent} from "./migrate/GoalStatusMigratedEvent.js";

// Union type will expand as we add more events
export type GoalEvent =
    GoalAddedEvent |
    GoalRefinedEvent |
    GoalRefinementStartedEvent |
    GoalBlockedEvent |
    GoalCompletedEvent |
    GoalPausedEvent |
    GoalPostponedEvent |
    GoalProgressUpdatedEvent |
    GoalRemovedEvent |
    GoalResetEvent |
    GoalResumedEvent |
    GoalStartedEvent |
    GoalUnblockedEvent |
    GoalUpdatedEvent |
    GoalSubmittedForReviewEvent |
    GoalQualifiedEvent |
    GoalCommittedEvent |
    GoalRejectedEvent |
    GoalSubmittedEvent |
    GoalCodifyingStartedEvent |
    GoalClosedEvent |
    GoalApprovedEvent |
    GoalStatusMigratedEvent;
