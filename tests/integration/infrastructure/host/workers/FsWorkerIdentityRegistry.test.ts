import fs from "fs-extra";
import * as path from "path";
import { FsWorkerIdentityRegistry } from "../../../../../src/infrastructure/host/workers/FsWorkerIdentityRegistry";
import { HostSessionKeyResolver, HostSessionKeyResult } from "../../../../../src/infrastructure/host/session/HostSessionKeyResolver";
import os from "os";

// Mock HostSessionKeyResolver for controlled testing
class MockHostSessionKeyResolver extends HostSessionKeyResolver {
  private mockKey: string;

  constructor(mockKey: string) {
    super();
    this.mockKey = mockKey;
  }

  override resolve(): HostSessionKeyResult {
    return {
      key: this.mockKey,
      parts: [{ source: "MOCK", value: this.mockKey }],
    };
  }
}

describe("FsWorkerIdentityRegistry", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-workers-"));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe("workerId property", () => {
    it("returns a valid UUID workerId", () => {
      const resolver = new MockHostSessionKeyResolver("test-session-key-1");
      const registry = new FsWorkerIdentityRegistry(tmpDir, resolver);

      const workerId = registry.workerId;

      // UUID v4 format
      expect(workerId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("returns same workerId on multiple accesses", () => {
      const resolver = new MockHostSessionKeyResolver("test-session-key-2");
      const registry = new FsWorkerIdentityRegistry(tmpDir, resolver);

      const workerId1 = registry.workerId;
      const workerId2 = registry.workerId;
      const workerId3 = registry.workerId;

      expect(workerId1).toBe(workerId2);
      expect(workerId2).toBe(workerId3);
    });

    it("returns same workerId for same hostSessionKey across instances", () => {
      const sessionKey = "persistent-session-key";
      const resolver1 = new MockHostSessionKeyResolver(sessionKey);
      const resolver2 = new MockHostSessionKeyResolver(sessionKey);

      const registry1 = new FsWorkerIdentityRegistry(tmpDir, resolver1);
      const workerId1 = registry1.workerId;

      const registry2 = new FsWorkerIdentityRegistry(tmpDir, resolver2);
      const workerId2 = registry2.workerId;

      expect(workerId1).toBe(workerId2);
    });

    it("returns different workerIds for different hostSessionKeys", () => {
      const resolver1 = new MockHostSessionKeyResolver("session-key-a");
      const resolver2 = new MockHostSessionKeyResolver("session-key-b");

      const registry1 = new FsWorkerIdentityRegistry(tmpDir, resolver1);
      const registry2 = new FsWorkerIdentityRegistry(tmpDir, resolver2);

      const workerId1 = registry1.workerId;
      const workerId2 = registry2.workerId;

      expect(workerId1).not.toBe(workerId2);
    });
  });

  describe("persistence", () => {
    it("creates workers.json file on first access", () => {
      const resolver = new MockHostSessionKeyResolver("test-session-key");
      const registry = new FsWorkerIdentityRegistry(tmpDir, resolver);

      // Access workerId to trigger file creation
      registry.workerId;

      const filePath = path.join(tmpDir, "workers.json");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("persists worker entry with required fields", () => {
      const sessionKey = "test-session-for-persistence";
      const resolver = new MockHostSessionKeyResolver(sessionKey);
      const registry = new FsWorkerIdentityRegistry(tmpDir, resolver);

      const workerId = registry.workerId;

      const filePath = path.join(tmpDir, "workers.json");
      const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      expect(content.entries[sessionKey]).toBeDefined();
      expect(content.entries[sessionKey].workerId).toBe(workerId);
      expect(content.entries[sessionKey].hostSessionKey).toBe(sessionKey);
      expect(content.entries[sessionKey].createdAt).toBeDefined();
      expect(content.entries[sessionKey].lastSeenAt).toBeDefined();
    });

    it("updates lastSeenAt on subsequent accesses", async () => {
      const sessionKey = "test-session-for-lastseen";
      const resolver = new MockHostSessionKeyResolver(sessionKey);

      // First access
      const registry1 = new FsWorkerIdentityRegistry(tmpDir, resolver);
      registry1.workerId;

      const filePath = path.join(tmpDir, "workers.json");
      const content1 = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const lastSeenAt1 = content1.entries[sessionKey].lastSeenAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second access with new instance
      const registry2 = new FsWorkerIdentityRegistry(tmpDir, resolver);
      registry2.workerId;

      const content2 = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const lastSeenAt2 = content2.entries[sessionKey].lastSeenAt;

      expect(lastSeenAt2).not.toBe(lastSeenAt1);
    });

    it("preserves createdAt on subsequent accesses", async () => {
      const sessionKey = "test-session-for-createdat";
      const resolver = new MockHostSessionKeyResolver(sessionKey);

      // First access
      const registry1 = new FsWorkerIdentityRegistry(tmpDir, resolver);
      registry1.workerId;

      const filePath = path.join(tmpDir, "workers.json");
      const content1 = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const createdAt1 = content1.entries[sessionKey].createdAt;

      // Wait and second access
      await new Promise((resolve) => setTimeout(resolve, 10));

      const registry2 = new FsWorkerIdentityRegistry(tmpDir, resolver);
      registry2.workerId;

      const content2 = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const createdAt2 = content2.entries[sessionKey].createdAt;

      expect(createdAt2).toBe(createdAt1);
    });

    it("handles multiple workers in same registry file", () => {
      const resolver1 = new MockHostSessionKeyResolver("worker-1-key");
      const resolver2 = new MockHostSessionKeyResolver("worker-2-key");
      const resolver3 = new MockHostSessionKeyResolver("worker-3-key");

      const registry1 = new FsWorkerIdentityRegistry(tmpDir, resolver1);
      const registry2 = new FsWorkerIdentityRegistry(tmpDir, resolver2);
      const registry3 = new FsWorkerIdentityRegistry(tmpDir, resolver3);

      const workerId1 = registry1.workerId;
      const workerId2 = registry2.workerId;
      const workerId3 = registry3.workerId;

      const filePath = path.join(tmpDir, "workers.json");
      const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      expect(Object.keys(content.entries)).toHaveLength(3);
      expect(content.entries["worker-1-key"].workerId).toBe(workerId1);
      expect(content.entries["worker-2-key"].workerId).toBe(workerId2);
      expect(content.entries["worker-3-key"].workerId).toBe(workerId3);
    });
  });

  describe("error handling", () => {
    it("starts fresh if registry file is corrupted", () => {
      // Write corrupted JSON
      const filePath = path.join(tmpDir, "workers.json");
      fs.writeFileSync(filePath, "{ invalid json", "utf-8");

      const resolver = new MockHostSessionKeyResolver("new-session-key");
      const registry = new FsWorkerIdentityRegistry(tmpDir, resolver);

      // Should not throw, should create new entry
      const workerId = registry.workerId;

      expect(workerId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );

      // File should now be valid
      const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      expect(content.entries["new-session-key"]).toBeDefined();
    });
  });
});
