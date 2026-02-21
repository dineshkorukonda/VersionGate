import { FastifyInstance } from "fastify";
import {
  deployHandler,
  rollbackHandler,
  listDeploymentsHandler,
  statusHandler,
} from "../controllers/deployment.controller";

const deployBodySchema = {
  type: "object",
  required: ["imageTag"],
  properties: {
    imageTag: { type: "string", minLength: 1 },
  },
  additionalProperties: false,
};

const deploymentSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    version: { type: "number" },
    imageTag: { type: "string" },
    containerName: { type: "string" },
    port: { type: "number" },
    status: { type: "string" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
};

export async function deploymentRoutes(app: FastifyInstance): Promise<void> {
  app.post("/deploy", {
    schema: {
      body: deployBodySchema,
      response: {
        202: {
          type: "object",
          properties: {
            deployment: deploymentSchema,
            message: { type: "string" },
          },
        },
      },
    },
    handler: deployHandler,
  });

  app.post("/rollback", {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            rolledBackFrom: deploymentSchema,
            restoredTo: deploymentSchema,
            message: { type: "string" },
          },
        },
      },
    },
    handler: rollbackHandler,
  });

  app.get("/deployments", {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            deployments: { type: "array", items: deploymentSchema },
          },
        },
      },
    },
    handler: listDeploymentsHandler,
  });

  app.get("/status", {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            status: { type: "string" },
            activeDeployment: { ...deploymentSchema, nullable: true },
          },
        },
      },
    },
    handler: statusHandler,
  });
}
