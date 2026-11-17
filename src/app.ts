#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { CliVersionReader } from "./infrastructure/cli-metadata/query/CliVersionReader.js";
import { Initializer as TuiInitializer} from "./presentation/tui/Initializer.js";
import { Initializer as CliInitializer} from "./presentation/cli/Initializer.js";
import { ARGV } from "./presentation/cli/Constants.js";

/** Application entry point that routes each process to a presentation pipeline. */
export async function runApp(): Promise<void> {
  const version = new CliVersionReader().getVersion().version;

  if (process.argv.length === ARGV.NODE_AND_SCRIPT_ARG_COUNT) {
    process.env.NODE_ENV ??= "production";
    await new TuiInitializer().launch(version);
    return;
  }

  await new CliInitializer(version).run();
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
) {
  void runApp();
}
