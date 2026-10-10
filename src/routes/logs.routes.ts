import { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { jobs } from "../db/schema";
import { jobLogsAfter } from "../utils/job-log-cursor";

export async function logsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/logs/:jobId", { websocket: true }, (socket, req) => {
    const jobId = (req.params as { jobId?: string }).jobId ?? "";
    let cursor = 0;
    let closed = false;
    let reading = false;
    let poll: ReturnType<typeof setInterval> | null = null;

    const cleanup = (): void => {
      if (closed) return;
      closed = true;
      if (poll) clearInterval(poll);
      try { socket.close(); } catch { /* connection already closed */ }
    };
    socket.on("close", cleanup);
    socket.on("error", cleanup);
    const sendJson = (obj: unknown): void => {
      if (closed) return;
      try { socket.send(JSON.stringify(obj)); } catch { cleanup(); }
    };
    if (!jobId) { cleanup(); return; }

    // PostgreSQL is the ordered source for both in-process and external workers.
    // A single cursor avoids duplicate delivery between local events and polling.
    const read = async (): Promise<void> => {
      if (closed || reading) return;
      reading = true;
      try {
        const [job] = await getDb().select({ logs: jobs.logs, logSequence: jobs.logSequence, status: jobs.status })
          .from(jobs).where(eq(jobs.id, jobId)).limit(1);
        if (closed) return;
        if (!job) { sendJson({ type: "error", message: "Job not found" }); cleanup(); return; }
        const batch = jobLogsAfter(job, cursor);
        if (batch.gap) sendJson({ type: "log", line: "[logs] Some older lines expired from retention.", timestamp: new Date().toISOString() });
        for (const entry of batch.entries) {
          sendJson({ type: "log", ...entry, timestamp: new Date().toISOString() });
        }
        cursor = batch.cursor;
        if (["COMPLETE", "FAILED", "CANCELLED"].includes(job.status)) {
          sendJson({ type: "status", status: job.status });
          cleanup();
        }
      } catch { cleanup(); } finally { reading = false; }
    };
    poll = setInterval(() => { void read(); }, 400);
    void read();
  });
}
