import { FastifyInstance } from "fastify";
import { reconcileHandler } from "../controllers/system.controller";

export async function systemRoutes(app: FastifyInstance): Promise<void> {
  app.post("/system/reconcile", {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            report: {
              type: "object",
              properties: {
                deployingFixed: { type: "number" },
                activeInvalidated: { type: "number" },
              },
            },
          },
        },
      },
    },
    handler: reconcileHandler,
  });
}
