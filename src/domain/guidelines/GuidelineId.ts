import {
  defineDomainIdentity,
  DomainIdentity,
} from "../identity/DomainIdentity.js";

export type GuidelineId = DomainIdentity<"GuidelineId">;
export const GuidelineId = defineDomainIdentity("GuidelineId");
