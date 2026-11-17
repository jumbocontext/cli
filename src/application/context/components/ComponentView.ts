import {
  ComponentTypeValue,
  ComponentStatusValue,
} from "../../../domain/components/Constants.js";

export interface ComponentView {
  componentId: string;
  name: string;
  type: ComponentTypeValue;
  description: string;
  responsibility: string;
  path: string;
  status: ComponentStatusValue;
  deprecationReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}
