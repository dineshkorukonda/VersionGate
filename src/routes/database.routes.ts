import { FastifyInstance } from "fastify";
import {
  listDatabasesHandler,
  getDatabaseHandler,
  createDatabaseHandler,
  startDatabaseHandler,
  stopDatabaseHandler,
  deleteDatabaseHandler,
  linkDatabaseHandler,
  unlinkDatabaseHandler,
} from "../controllers/database.controller";

export async function databaseRoutes(app: FastifyInstance): Promise<void> {
  app.get("/databases", listDatabasesHandler);
  app.post("/databases", createDatabaseHandler);
  app.get("/databases/:id", getDatabaseHandler);
  app.post("/databases/:id/start", startDatabaseHandler);
  app.post("/databases/:id/stop", stopDatabaseHandler);
  app.delete("/databases/:id", deleteDatabaseHandler);
  app.post("/databases/:id/link", linkDatabaseHandler);
  app.post("/databases/:id/unlink", unlinkDatabaseHandler);
}
