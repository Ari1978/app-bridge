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

// Objetos se muestran como JSON (String() daba "[object Object]").
function detalle(data: unknown): string {
  if (data === undefined || data === null || data === "") return "";
  if (typeof data === "object") {
    try {
      return JSON.stringify(data);
    } catch {
      return String(data);
    }
  }
  return String(data);
}

// 👉 wrapper para no romper tu código actual
export const logger = {
  info(message: string, data?: unknown) {
    baseLogger.info(`${message} ${detalle(data)}`);
  },
  warn(message: string, data?: unknown) {
    baseLogger.warn(`${message} ${detalle(data)}`);
  },
  error(message: string, data?: unknown) {
    baseLogger.error(`${message} ${detalle(data)}`);
  },
};
