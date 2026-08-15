import { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { jobs } from "../db/schema";
import { logEmitter } from "../events/log-emitter";

export async function logsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/logs/:jobId", { websocket: true }, (socket, req) => {
    const jobId =
      (req.params as { jobId?: string }).jobId ??
      req.url.replace(/^\//, "").split("/").pop()?.split("?")[0] ??
      "";
    if (!jobId) {
      socket.close();
      return;
    }

    let lastIndex = 0;
    let closed = false;

    const sendJson = (obj: unknown): void => {
      if (closed) return;
      try {
        socket.send(JSON.stringify(obj));
      } catch {
        closed = true;
      }
    };

    void (async () => {
      const db = getDb();
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
      if (!job) {
        sendJson({ type: "error", message: "Job not found" });
        socket.close();
        return;
      }

      const initialLogs = Array.isArray(job.logs) ? (job.logs as string[]) : [];
      for (let i = 0; i < initialLogs.length; i++) {
        sendJson({
          type: "log",
          line: initialLogs[i],
          timestamp: new Date().toISOString(),
        });
      }
      lastIndex = initialLogs.length;

      const isTerminal = (s: string) => s === "COMPLETE" || s === "FAILED" || s === "CANCELLED";

      if (isTerminal(job.status)) {
        sendJson({ type: "status", status: job.status });
        socket.close();
        return;
      }

      const onLiveLog = (line: string): void => {
        lastIndex++;
        sendJson({ type: "log", line, timestamp: new Date().toISOString() });
      };
      const onLiveStatus = (status: string): void => {
        sendJson({ type: "status", status });
        if (isTerminal(status)) {
          cleanup();
        }
      };

      const unsubLog = logEmitter.subscribeLog(jobId, onLiveLog);
      const unsubStatus = logEmitter.subscribeStatus(jobId, onLiveStatus);

      const cleanup = (): void => {
        if (closed) return;
        closed = true;
        clearInterval(poll);
        unsubLog();
        unsubStatus();
        try {
          socket.close();
        } catch {
          /* ignore */
        }
      };

      const poll = setInterval(async () => {
        try {
          const [j] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
          if (!j || closed) {
            cleanup();
            return;
          }
          const currentLogs = Array.isArray(j.logs) ? (j.logs as string[]) : [];
          while (lastIndex < currentLogs.length) {
            sendJson({
              type: "log",
              line: currentLogs[lastIndex],
              timestamp: new Date().toISOString(),
            });
            lastIndex++;
          }
          if (isTerminal(j.status)) {
            sendJson({ type: "status", status: j.status });
            cleanup();
          }
        } catch {
          cleanup();
        }
      }, 400);

      socket.on("close", () => {
        cleanup();
      });
    })();
  });
}
