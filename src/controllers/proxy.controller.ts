import type { FastifyReply, FastifyRequest } from "fastify";
import { ProxyService } from "../services/proxy.service";

const proxyService = new ProxyService();

export async function proxyStageHandler(
  req: FastifyRequest<{ Params: { projectName: string; envName: string; "*"?: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { projectName, envName } = req.params;
  const wildcardPath = req.params["*"] || "/";

  const target = await proxyService.resolveTarget(projectName, envName);
  if (!target) {
    return reply.code(404).type("text/html").send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>VersionGate — Stage Not Found</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 2rem; border-radius: 12px; border: 1px solid #334155; max-width: 500px; text-align: center; }
            h1 { color: #38bdf8; font-size: 1.5rem; margin-top: 0; }
            p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
            .badge { background: #334155; color: #fbbf24; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>404 Deployment Inactive</h1>
            <p>No active deployment found for project <strong>${projectName}</strong> on stage <span class="badge">${envName}</span>.</p>
            <p>Deploy or promote a build to this stage in the VersionGate dashboard.</p>
          </div>
        </body>
      </html>
    `);
  }

  return proxyService.proxyRequest(req, reply, target, wildcardPath);
}

export async function proxyProjectDefaultHandler(
  req: FastifyRequest<{ Params: { projectName: string; "*"?: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { projectName } = req.params;
  const wildcardPath = req.params["*"] || "/";

  const target = await proxyService.resolveTarget(projectName, "production");
  if (!target) {
    return reply.code(404).type("text/html").send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>VersionGate — Project Not Found</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 2rem; border-radius: 12px; border: 1px solid #334155; max-width: 500px; text-align: center; }
            h1 { color: #38bdf8; font-size: 1.5rem; margin-top: 0; }
            p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>404 Project Not Active</h1>
            <p>No active production deployment found for project <strong>${projectName}</strong>.</p>
          </div>
        </body>
      </html>
    `);
  }

  return proxyService.proxyRequest(req, reply, target, wildcardPath);
}
