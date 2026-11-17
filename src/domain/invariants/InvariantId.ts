import {
  defineDomainIdentity,
  DomainIdentity,
} from "../identity/DomainIdentity.js";

export type InvariantId = DomainIdentity<"InvariantId">;
export const InvariantId = defineDomainIdentity("InvariantId");
