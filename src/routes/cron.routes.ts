import { FastifyInstance } from "fastify";
import {
  listCronJobsHandler,
  getCronJobHandler,
  createCronJobHandler,
  updateCronJobHandler,
  deleteCronJobHandler,
  triggerCronJobHandler,
  getCronJobLogsHandler,
  getServerCapacitySpecsHandler,
} from "../controllers/cron.controller";

export async function cronRoutes(app: FastifyInstance): Promise<void> {
  app.get("/cron-jobs", listCronJobsHandler);
  app.post("/cron-jobs", createCronJobHandler);
  app.get("/cron-jobs/:id", getCronJobHandler);
  app.patch("/cron-jobs/:id", updateCronJobHandler);
  app.delete("/cron-jobs/:id", deleteCronJobHandler);
  app.post("/cron-jobs/:id/run", triggerCronJobHandler);
  app.get("/cron-jobs/:id/logs", getCronJobLogsHandler);

  // Server hardware capacity specs & recommendation tiers
  app.get("/system/capacity-specs", getServerCapacitySpecsHandler);
}
