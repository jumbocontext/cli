import {
  defineDomainIdentity,
  DomainIdentity,
} from "../identity/DomainIdentity.js";

export type ProjectId = DomainIdentity<"ProjectId">;
export const ProjectId = defineDomainIdentity("ProjectId");
