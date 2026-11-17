/**
 * FsWorkerIdentityRegistry - File-based worker identity persistence
 *
 * Maps host session keys to worker IDs and persists the mapping to disk.
 * Ensures that the same terminal/IDE session always gets the same workerId.
 *
 * Key Design:
 * - Resolves workerId once at construction time
 * - Persists hostSessionKey -> workerId mapping to a JSON file
 * - Implements IWorkerIdentityReader for application layer consumption
 * - Uses UUID v4 for generating new worker IDs
 */

import fs from "fs-extra";
import path from "path";
import { IWorkerIdentityReader } from "../../../application/host/workers/IWorkerIdentityReader.js";
import {
  WorkerId,
  createWorkerId,
} from "../../../application/host/workers/WorkerId.js";
import { WorkerId as DomainWorkerId } from "../../../domain/workers/WorkerId.js";
import { HostSessionKeyResolver } from "../session/HostSessionKeyResolver.js";

/**
 * Structure of a worker registry entry.
 */
type WorkerRegistryEntry = {
  workerId: string;
  hostSessionKey: string;
  createdAt: string;
  lastSeenAt: string;
};

/**
 * Structure of the persisted worker registry.
 */
type WorkerRegistry = {
  entries: Record<string, WorkerRegistryEntry>;
};

export class FsWorkerIdentityRegistry implements IWorkerIdentityReader {
  private readonly registryFilePath: string;
  private readonly sessionKeyResolver: HostSessionKeyResolver;
  private resolvedWorkerId: WorkerId | null = null;

  constructor(rootDir: string, sessionKeyResolver: HostSessionKeyResolver) {
    this.registryFilePath = path.join(rootDir, "workers.json");
    this.sessionKeyResolver = sessionKeyResolver;
  }

  /**
   * Gets the unique identifier for the current worker.
   *
   * Lazily resolves the workerId on first access and caches it.
   * Subsequent calls return the cached value.
   */
  get workerId(): WorkerId {
    if (this.resolvedWorkerId === null) {
      this.resolvedWorkerId = this.resolveWorkerId();
    }
    return this.resolvedWorkerId;
  }

  /**
   * Resolves the workerId for the current host session.
   *
   * Looks up the existing mapping or creates a new one if not found.
   * Updates the lastSeenAt timestamp on each access.
   */
  private resolveWorkerId(): WorkerId {
    const { key: hostSessionKey } = this.sessionKeyResolver.resolve();
    const registry = this.loadRegistry();

    const existingEntry = registry.entries[hostSessionKey];
    if (existingEntry) {
      // Update last seen timestamp
      existingEntry.lastSeenAt = new Date().toISOString();
      this.saveRegistry(registry);
      return createWorkerId(existingEntry.workerId);
    }

    // Create new worker entry
    const newWorkerId = DomainWorkerId.create();
    const now = new Date().toISOString();

    registry.entries[hostSessionKey] = {
      workerId: newWorkerId,
      hostSessionKey,
      createdAt: now,
      lastSeenAt: now,
    };

    this.saveRegistry(registry);
    return createWorkerId(newWorkerId);
  }

  /**
   * Loads the worker registry from disk.
   *
   * Creates an empty registry if the file doesn't exist.
   */
  private loadRegistry(): WorkerRegistry {
    try {
      if (fs.existsSync(this.registryFilePath)) {
        const content = fs.readFileSync(this.registryFilePath, "utf-8");
        return JSON.parse(content) as WorkerRegistry;
      }
    } catch {
      // If file is corrupted, start fresh
    }

    return { entries: {} };
  }

  /**
   * Saves the worker registry to disk.
   */
  private saveRegistry(registry: WorkerRegistry): void {
    fs.ensureFileSync(this.registryFilePath);
    fs.writeFileSync(
      this.registryFilePath,
      JSON.stringify(registry, null, 2),
      "utf-8",
    );
  }
}
