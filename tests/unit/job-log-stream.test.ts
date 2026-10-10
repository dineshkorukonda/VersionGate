import { describe, expect, spyOn, test } from "bun:test";
import { EventEmitter } from "events";
import * as client from "../../src/db/client";
import { logsRoutes } from "../../src/routes/logs.routes";

describe("job WebSocket polling", () => {
  test("sends new retained entries before terminal status and closes polling", async () => {
    let handler: (socket: any, req: any) => void = () => {};
    await logsRoutes({ get: (_url: string, _options: unknown, callback: typeof handler) => { handler = callback; } } as any);
    const snapshots = [
      { logs: ["old 4999", "old 5000"], logSequence: 5000, status: "RUNNING" },
      { logs: ["old 5000", "new 5001"], logSequence: 5001, status: "COMPLETE" },
    ];
    let reads = 0;
    const db = { select: () => ({ from: () => ({ where: () => ({ limit: async () => {
      reads++;
      return [snapshots.shift()];
    } }) }) }) };
    const database = spyOn(client, "getDb").mockReturnValue(db as any);
    const messages: any[] = [];
    let finish: () => void = () => {};
    const done = new Promise<void>((resolve) => { finish = resolve; });
    const socket = Object.assign(new EventEmitter(), {
      send: (raw: string) => { messages.push(JSON.parse(raw)); },
      close: () => { socket.emit("close"); finish(); },
    });
    try {
      handler(socket, { params: { jobId: "job" } });
      await done;
      expect(messages.filter((message) => message.type === "log").map((message) => message.sequence)).toEqual([4999, 5000, 5001]);
      expect(messages.at(-1)).toEqual({ type: "status", status: "COMPLETE" });
      expect(reads).toBe(2);
    } finally { socket.close(); database.mockRestore(); }
  });

  test("handles a disconnect while the initial database read is still pending", async () => {
    let handler: (socket: any, req: any) => void = () => {};
    await logsRoutes({ get: (_url: string, _options: unknown, callback: typeof handler) => { handler = callback; } } as any);
    let resolve: (rows: unknown[]) => void = () => {};
    const pending = new Promise<unknown[]>((complete) => { resolve = complete; });
    const database = spyOn(client, "getDb").mockReturnValue({ select: () => ({ from: () => ({ where: () => ({ limit: () => pending }) }) }) } as any);
    let sends = 0;
    const socket = Object.assign(new EventEmitter(), { send: () => { sends++; }, close: () => { socket.emit("close"); } });
    try {
      handler(socket, { params: { jobId: "job" } });
      socket.close();
      resolve([{ logs: ["late"], logSequence: 1, status: "RUNNING" }]);
      await pending;
      await Promise.resolve();
      expect(sends).toBe(0);
    } finally { socket.close(); database.mockRestore(); }
  });
});
