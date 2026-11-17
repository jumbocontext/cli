import {
  defineDomainIdentity,
  DomainIdentity,
} from "../identity/DomainIdentity.js";

export type GoalId = DomainIdentity<"GoalId">;
export const GoalId = defineDomainIdentity("GoalId");
