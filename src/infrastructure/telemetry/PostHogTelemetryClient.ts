import { PostHog } from "posthog-node";
import { ITelemetryClient } from "../../application/telemetry/ITelemetryClient.js";
import {
  POSTHOG_API_KEY,
  POSTHOG_HOST,
  POSTHOG_SHUTDOWN_TIMEOUT_MS,
} from "./PostHogTelemetryConstants.js";

interface PostHogCaptureMessage {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
}

interface IPostHogSdkClient {
  capture(message: PostHogCaptureMessage): void;
  shutdown(shutdownTimeoutMs?: number): void | Promise<void>;
}

type PostHogClientFactory = () => IPostHogSdkClient | null;

function createDefaultPostHogClient(): IPostHogSdkClient | null {
  if (!POSTHOG_API_KEY) {
    return null;
  }
  return new PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST });
}

export class PostHogTelemetryClient implements ITelemetryClient {
  private readonly anonymousId: string;
  private readonly postHogClient: IPostHogSdkClient | null;

  constructor(
    anonymousId: string,
    postHogClientFactory: PostHogClientFactory = createDefaultPostHogClient,
  ) {
    this.anonymousId = anonymousId;

    try {
      this.postHogClient = postHogClientFactory();
    } catch {
      this.postHogClient = null;
    }
  }

  track(event: string, properties?: Record<string, unknown>): void {
    if (this.postHogClient === null) {
      return;
    }

    try {
      this.postHogClient.capture({
        distinctId: this.anonymousId,
        event,
        properties,
      });
    } catch {
      // Telemetry must never affect CLI execution.
    }
  }

  async flush(): Promise<void> {
    await this.shutdownPostHogClient();
  }

  async shutdown(): Promise<void> {
    await this.shutdownPostHogClient();
  }

  private async shutdownPostHogClient(): Promise<void> {
    if (this.postHogClient === null) {
      return;
    }

    try {
      await Promise.resolve(
        this.postHogClient.shutdown(POSTHOG_SHUTDOWN_TIMEOUT_MS),
      );
    } catch {
      // Telemetry must never affect CLI execution.
    }
  }
}
