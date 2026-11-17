import {
  defineDomainIdentity,
  DomainIdentity,
} from "../identity/DomainIdentity.js";

export type DependencyId = DomainIdentity<"DependencyId">;
export const DependencyId = defineDomainIdentity("DependencyId");
