import type { FastifyInstance } from "fastify";
import { proxyStageHandler, proxyProjectDefaultHandler } from "../controllers/proxy.controller";

export async function proxyRoutes(app: FastifyInstance): Promise<void> {
  app.all("/p/:projectName/:envName/*", proxyStageHandler);
  app.all("/p/:projectName/:envName", proxyStageHandler);
  app.all("/p/:projectName/*", proxyProjectDefaultHandler);
  app.all("/p/:projectName", proxyProjectDefaultHandler);
}
