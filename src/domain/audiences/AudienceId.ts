import {
  defineDomainIdentity,
  DomainIdentity,
} from "../identity/DomainIdentity.js";

export type AudienceId = DomainIdentity<"AudienceId">;
export const AudienceId = defineDomainIdentity("AudienceId");
