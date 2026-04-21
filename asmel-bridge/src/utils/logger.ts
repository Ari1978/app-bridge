import winston from "winston";
import path from "path";
import fs from "fs";

// crear carpeta logs si no existe
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const baseLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) =>
        `[${timestamp}] ${level.toUpperCase()} ${message}`
    )
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
    }),
    new winston.transports.Console(),
  ],
});

// 👉 wrapper para no romper tu código actual
export const logger = {
  info(message: string, data?: unknown) {
  baseLogger.info(`${message} ${data ? String(data) : ""}`);
},
warn(message: string, data?: unknown) {
  baseLogger.warn(`${message} ${data ? String(data) : ""}`);
},
error(message: string, data?: unknown) {
  baseLogger.error(`${message} ${data ? String(data) : ""}`);
},
};