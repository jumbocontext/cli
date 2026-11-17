import {
  defineDomainIdentity,
  DomainIdentity,
} from "../identity/DomainIdentity.js";

export type RelationId = DomainIdentity<"RelationId">;
export const RelationId = defineDomainIdentity("RelationId");
