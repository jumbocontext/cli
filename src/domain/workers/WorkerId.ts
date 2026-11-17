import {
  defineDomainIdentity,
  DomainIdentity,
} from "../identity/DomainIdentity.js";

export type WorkerId = DomainIdentity<"WorkerId">;
export const WorkerId = defineDomainIdentity("WorkerId");
