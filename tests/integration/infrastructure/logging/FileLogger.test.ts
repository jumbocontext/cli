import fs from "fs-extra";
import * as path from "path";
import { FileLogger } from "../../../../src/infrastructure/logging/FileLogger";
import { LogLevel } from "../../../../src/application/logging/ILogger";
import os from "os";

describe("FileLogger", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-logs-"));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe("buildDailyLogFileName", () => {
    it("formats date as yyyymmdd.log", () => {
      const date = new Date(2026, 2, 26); // March 26, 2026
      expect(FileLogger.buildDailyLogFileName(date)).toBe("20260326.log");
    });

    it("pads single-digit day and month with leading zeros", () => {
      const date = new Date(2026, 0, 5); // January 5, 2026
      expect(FileLogger.buildDailyLogFileName(date)).toBe("20260105.log");
    });

    it("handles end of year", () => {
      const date = new Date(2026, 11, 31); // December 31, 2026
      expect(FileLogger.buildDailyLogFileName(date)).toBe("20261231.log");
    });
  });

  describe("daily log file creation", () => {
    it("creates log file with daily filename in specified directory", async () => {
      const logger = new FileLogger(tmpDir, LogLevel.DEBUG);
      logger.info("test message");
      await logger.close();

      const expectedFileName = FileLogger.buildDailyLogFileName(new Date());
      const expectedPath = path.join(tmpDir, expectedFileName);
      expect(await fs.pathExists(expectedPath)).toBe(true);
    });

    it("writes log entries to the daily file", async () => {
      const logger = new FileLogger(tmpDir, LogLevel.DEBUG);
      logger.info("hello world");
      await logger.close();

      const expectedFileName = FileLogger.buildDailyLogFileName(new Date());
      const content = await fs.readFile(path.join(tmpDir, expectedFileName), "utf8");
      expect(content).toContain("INFO: hello world");
    });
  });
});
