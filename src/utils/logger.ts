import pino from "pino";
import { config } from "../config/env";

export const logger = pino({
  level: config.app.logLevel,
  transport:
    config.app.env !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
