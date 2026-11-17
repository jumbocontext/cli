import { randomUUID } from "node:crypto";

export function ensureDaemonHostSessionKey(): void {
  process.env.JUMBO_HOST_SESSION_KEY ??= `daemon-${randomUUID()}`;
}
