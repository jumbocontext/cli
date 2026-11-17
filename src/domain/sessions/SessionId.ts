import {
  defineDomainIdentity,
  DomainIdentity,
} from "../identity/DomainIdentity.js";

export type SessionId = DomainIdentity<"SessionId">;
export const SessionId = defineDomainIdentity("SessionId");
