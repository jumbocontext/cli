import {
  defineDomainIdentity,
  DomainIdentity,
} from "../identity/DomainIdentity.js";

export type DecisionId = DomainIdentity<"DecisionId">;
export const DecisionId = defineDomainIdentity("DecisionId");
