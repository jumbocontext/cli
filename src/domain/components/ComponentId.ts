import {
  defineDomainIdentity,
  DomainIdentity,
} from "../identity/DomainIdentity.js";

export type ComponentId = DomainIdentity<"ComponentId">;
export const ComponentId = defineDomainIdentity("ComponentId");
