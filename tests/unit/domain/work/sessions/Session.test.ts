/**
 * Tests for Session aggregate
 */

import { Session } from "../../../../../src/domain/sessions/Session";
import {
  SessionEventType,
  SessionStatus,
  SessionErrorMessages,
} from "../../../../../src/domain/sessions/Constants";

describe("Session Aggregate", () => {
  describe("start()", () => {
    it("should create SessionStarted event", () => {
      // Arrange
      const session = Session.create("session_123");

      // Act
      const event = session.start();

      // Assert
      expect(event.type).toBe(SessionEventType.STARTED);
      expect(event.aggregateId).toBe("session_123");
      expect(event.version).toBe(1);
      expect(event.payload).toEqual({});
      expect(event.timestamp).toBeDefined();
    });

    it("should apply event to aggregate state", () => {
      // Arrange
      const session = Session.create("session_123");

      // Act
      session.start();
      const state = session.snapshot;

      // Assert
      expect(state.focus).toBe(""); // Focus not set at start
      expect(state.status).toBe(SessionStatus.ACTIVE);
      expect(state.version).toBe(1);
    });

    it("should throw error if session is already started", () => {
      // Arrange
      const session = Session.create("session_123");
      session.start();

      // Act & Assert
      expect(() => session.start()).toThrow(
        SessionErrorMessages.ALREADY_STARTED
      );
    });
  });

  describe("rehydrate()", () => {
    it("should rebuild aggregate from event history", () => {
      // Arrange
      const session1 = Session.create("session_123");
      const event = session1.start();

      // Act
      const session2 = Session.rehydrate("session_123", [event]);
      const state = session2.snapshot;

      // Assert
      expect(state.id).toBe("session_123");
      expect(state.focus).toBe(""); // Focus not set at start
      expect(state.status).toBe(SessionStatus.ACTIVE);
      expect(state.version).toBe(1);
    });

    it("should handle empty event history", () => {
      // Act
      const session = Session.rehydrate("session_123", []);
      const state = session.snapshot;

      // Assert
      expect(state.id).toBe("session_123");
      expect(state.focus).toBe("");
      expect(state.status).toBe(SessionStatus.ACTIVE);
      expect(state.version).toBe(0);
    });
  });
});
