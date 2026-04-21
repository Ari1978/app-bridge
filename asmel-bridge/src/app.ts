import * as dotenv from "dotenv"; 
dotenv.config();  

import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { syncNow } from './service/sync.service';
import { logger } from './utils/logger';

logger.info("🚀 APP INICIANDO...");
logger.info("🧠 MODO SYNC: MANUAL");

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'asmel-bridge' });
});

// 🔥 SYNC SOLO MANUAL
app.post('/sync', async (_req, res) => {
  try {
    await syncNow();
    res.json({ ok: true });
  } catch (error) {
    logger.error('Error en /sync', error);
    res.status(500).json({ ok: false });
  }
});

app.listen(env.port, () => {
  logger.info(`Bridge corriendo en puerto ${env.port}`);
});