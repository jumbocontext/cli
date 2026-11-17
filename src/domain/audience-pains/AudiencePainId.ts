import {
  defineDomainIdentity,
  DomainIdentity,
} from "../identity/DomainIdentity.js";

export type AudiencePainId = DomainIdentity<"AudiencePainId">;
export const AudiencePainId = defineDomainIdentity("AudiencePainId");
