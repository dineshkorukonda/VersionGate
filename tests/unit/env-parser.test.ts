import { describe, test, expect } from "bun:test";
import { parseEnvText, formatEnvText, handleEnvPaste } from "../../dashboard/src/lib/env-parser";

describe("Environment Parser and Formatter", () => {
  test("parseEnvText parses standard KEY=VALUE lines", () => {
    const raw = `
PORT=8080
DATABASE_URL=postgresql://user:pass@localhost:5432/db
NODE_ENV=production
`;
    const parsed = parseEnvText(raw);
    expect(parsed).toEqual([
      { key: "PORT", value: "8080" },
      { key: "DATABASE_URL", value: "postgresql://user:pass@localhost:5432/db" },
      { key: "NODE_ENV", value: "production" },
    ]);
  });

  test("parseEnvText handles comments and export prefixes", () => {
    const raw = `
# This is a comment
export SECRET_KEY="my-secret-value"
export PUBLIC_URL='https://example.com'
EMPTY_VAL=
`;
    const parsed = parseEnvText(raw);
    expect(parsed).toEqual([
      { key: "SECRET_KEY", value: "my-secret-value" },
      { key: "PUBLIC_URL", value: "https://example.com" },
      { key: "EMPTY_VAL", value: "" },
    ]);
  });

  test("formatEnvText formats pairs to valid dotenv string", () => {
    const pairs = [
      { key: "APP_NAME", value: "VersionGate" },
      { key: "PORT", value: "9090" },
      { key: "", value: "ignored" },
    ];
    const text = formatEnvText(pairs);
    expect(text).toBe("APP_NAME=VersionGate\nPORT=9090");
  });

  test("handleEnvPaste parses bulk env assignment", () => {
    let currentPairs = [{ key: "", value: "" }];
    const updater = (fn: any) => {
      currentPairs = fn(currentPairs);
    };

    const handled = handleEnvPaste("FOO=bar\nBAZ=qux", 0, updater as any);
    expect(handled).toBe(true);
    expect(currentPairs).toEqual([
      { key: "FOO", value: "bar" },
      { key: "BAZ", value: "qux" },
    ]);
  });
});
