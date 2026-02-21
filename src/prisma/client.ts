import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "warn" },
  ],
});

prisma.$on("error", (e) => {
  logger.error({ msg: e.message, target: e.target }, "Prisma error");
});

prisma.$on("warn", (e) => {
  logger.warn({ msg: e.message, target: e.target }, "Prisma warning");
});

export default prisma;
