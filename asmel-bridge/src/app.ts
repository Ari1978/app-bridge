import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { syncNow } from "./service/sync.service";
import { logger } from "./utils/logger";
import axios from "axios";

logger.info("🚀 APP INICIANDO...");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "asmel-bridge", mode: "polling" });
});

// 🔥 SYNC MANUAL (lo dejamos para debug)
app.post("/sync", async (_req, res) => {
  try {
    await syncNow();
    res.json({ ok: true });
  } catch (error) {
    logger.error("Error en /sync", error);
    res.status(500).json({ ok: false });
  }
});

app.listen(env.port, () => {
  logger.info(`Bridge corriendo en puerto ${env.port}`);
});

const API_URL = process.env.ASMEL_API_URL;
const TOKEN = process.env.ASMEL_API_TOKEN;

setInterval(async () => {
  try {
    const res = await axios.get(`${API_URL}/api/bridge/sync-request`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 5000,
    });

    if (!res.data?.requested) return;

    logger.info("🟢 Sync solicitada desde backend");

    await syncNow();

    await axios.post(
      `${API_URL}/api/bridge/sync-request/clear`,
      {},
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      },
    );

    logger.info("✅ Sync manual completada");
  } catch (error: any) {
    logger.error("❌ Error consultando sync-request", error?.message);
  }
}, 5000);

