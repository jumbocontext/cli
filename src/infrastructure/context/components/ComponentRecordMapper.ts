/**
 * ComponentRecordMapper - Maps infrastructure ComponentRecord to application ComponentView.
 *
 * Handles type casting at the infrastructure-application boundary.
 */

import { ComponentView } from "../../../application/context/components/ComponentView.js";
import {
  ComponentTypeValue,
  ComponentStatusValue,
} from "../../../domain/components/Constants.js";
import { ComponentRecord } from "./ComponentRecord.js";

export class ComponentRecordMapper {
  toView(record: ComponentRecord): ComponentView {
    return {
      componentId: record.id,
      name: record.name,
      type: record.type as ComponentTypeValue,
      description: record.description,
      responsibility: record.responsibility,
      path: record.path,
      status: record.status as ComponentStatusValue,
      deprecationReason: record.deprecationReason,
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
