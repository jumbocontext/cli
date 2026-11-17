/**
 * Infrastructure implementation of ICliVersionReader.
 * Reads CLI version from package.json at runtime.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";
import {
  CliVersion,
  ICliVersionReader,
} from "../../../application/cli-metadata/query/ICliMetadataReader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CliVersionReader implements ICliVersionReader {
  private cachedVersion?: CliVersion;

  getVersion(): CliVersion {
    if (this.cachedVersion) {
      return this.cachedVersion;
    }

    try {
      // Find package.json relative to the compiled code location
      // This file compiles to: dist/infrastructure/cli-metadata/query/CliVersionReader.js
      // package.json is at the project root, 4 levels up from the compiled file
      const packageJsonPath = path.resolve(
        __dirname,
        "../../../../package.json",
      );

      // Read and parse package.json
      const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
      const packageJson = JSON.parse(packageJsonContent);

      // Extract version field
      if (!packageJson.version || typeof packageJson.version !== "string") {
        throw new Error("package.json does not contain a valid version field");
      }

      this.cachedVersion = {
        version: packageJson.version,
      };

      return this.cachedVersion;
    } catch (error) {
      // Graceful error handling with fallback
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `Failed to read CLI version from package.json: ${errorMessage}`,
      );
    }
  }
}
