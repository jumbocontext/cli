import { describe, it, expect } from "@jest/globals";
import { IdGenerator } from "../../../../src/application/identity/IdGenerator.js";

describe("IdGenerator", () => {
  it("returns a valid UUID v4 string", () => {
    const id = IdGenerator.generate();
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(id).toMatch(uuidV4Regex);
  });

  it("returns unique IDs on each call", () => {
    const ids = new Set(Array.from({ length: 100 }, () => IdGenerator.generate()));
    expect(ids.size).toBe(100);
  });
});
