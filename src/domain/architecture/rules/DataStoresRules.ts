import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  ArchitectureErrorMessages,
  ArchitectureLimits,
  formatErrorMessage,
} from "../Constants.js";
import { DataStore } from "../define/ArchitectureDefinedEvent.js";

export class DataStoreValidRule implements ValidationRule<DataStore[]> {
  validate(dataStores: DataStore[]): ValidationResult {
    const errors: string[] = [];

    for (const ds of dataStores) {
      if (!ds.name || ds.name.trim() === "") {
        errors.push(ArchitectureErrorMessages.DATA_STORE_NAME_REQUIRED);
      } else if (
        ds.name.length > ArchitectureLimits.DATA_STORE_NAME_MAX_LENGTH
      ) {
        errors.push(
          formatErrorMessage(
            ArchitectureErrorMessages.DATA_STORE_NAME_TOO_LONG,
            { max: ArchitectureLimits.DATA_STORE_NAME_MAX_LENGTH },
          ),
        );
      }

      if (!ds.type || ds.type.trim() === "") {
        errors.push(ArchitectureErrorMessages.DATA_STORE_TYPE_REQUIRED);
      } else if (
        ds.type.length > ArchitectureLimits.DATA_STORE_TYPE_MAX_LENGTH
      ) {
        errors.push(
          formatErrorMessage(
            ArchitectureErrorMessages.DATA_STORE_TYPE_TOO_LONG,
            { max: ArchitectureLimits.DATA_STORE_TYPE_MAX_LENGTH },
          ),
        );
      }

      if (!ds.purpose || ds.purpose.trim() === "") {
        errors.push(ArchitectureErrorMessages.DATA_STORE_PURPOSE_REQUIRED);
      } else if (
        ds.purpose.length > ArchitectureLimits.DATA_STORE_PURPOSE_MAX_LENGTH
      ) {
        errors.push(
          formatErrorMessage(
            ArchitectureErrorMessages.DATA_STORE_PURPOSE_TOO_LONG,
            { max: ArchitectureLimits.DATA_STORE_PURPOSE_MAX_LENGTH },
          ),
        );
      }

      // Break after first invalid store to avoid noise
      if (errors.length > 0) break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export class DataStoresMaxCountRule implements ValidationRule<DataStore[]> {
  constructor(private maxCount: number = ArchitectureLimits.MAX_DATA_STORES) {}

  validate(dataStores: DataStore[]): ValidationResult {
    const isValid = dataStores.length <= this.maxCount;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(ArchitectureErrorMessages.TOO_MANY_DATA_STORES, {
              max: this.maxCount,
            }),
          ],
    };
  }
}

export const DATA_STORES_RULES = [
  new DataStoreValidRule(),
  new DataStoresMaxCountRule(),
];
