import { describe, test, expect } from "bun:test";
import { UserRepository } from "../../src/repositories/user.repository";

describe("UserRepository unit tests", () => {
  test("has updatePasswordByEmail method", () => {
    const repo = new UserRepository();
    expect(typeof repo.updatePasswordByEmail).toBe("function");
  });
});
