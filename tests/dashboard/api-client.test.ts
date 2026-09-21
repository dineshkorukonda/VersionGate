import { describe, test, expect } from "bun:test";
import { ApiError } from "../../dashboard/src/lib/api/client";

describe("dashboard api client", () => {
  test("ApiError exposes status and parsed body", () => {
    const err = new ApiError("Validation failed", 400, { error: "ValidationError" });
    expect(err.name).toBe("ApiError");
    expect(err.message).toBe("Validation failed");
    expect(err.status).toBe(400);
    expect(err.body).toEqual({ error: "ValidationError" });
  });

  test("ApiError works without body", () => {
    const err = new ApiError("Not found", 404);
    expect(err.status).toBe(404);
    expect(err.body).toBeUndefined();
  });
});
