import { FastifyInstance } from "fastify";
import { githubWebhookHandler } from "../controllers/webhook.controller";

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.post("/webhooks/:secret", {
    schema: {
      params: {
        type: "object",
        properties: { secret: { type: "string" } },
        required: ["secret"],
      },
    },
    handler: githubWebhookHandler,
  });
}

/** Register webhook routes at all legacy-compatible prefixes. */
export async function registerWebhookRouteGroups(
  app: FastifyInstance,
  dbRoutes: (instance: FastifyInstance) => Promise<void>
): Promise<void> {
  const prefixes = ["/api/v1", "/api", ""] as const;
  for (const prefix of prefixes) {
    await app.register(async (instance) => {
      await instance.register(dbRoutes);
      await webhookRoutes(instance);
    }, prefix ? { prefix } : undefined);
  }
}
