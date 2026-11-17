import {
  defineDomainIdentity,
  DomainIdentity,
} from "../identity/DomainIdentity.js";

export type ValuePropositionId = DomainIdentity<"ValuePropositionId">;
export const ValuePropositionId = defineDomainIdentity("ValuePropositionId");
