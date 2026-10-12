import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta variable de entorno: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT || 3001),

  asmelApiUrl: required('ASMEL_API_URL'),
  // Clave que SanaMed exige en /api/bridge (mismo valor que en Render).
  bridgeSecret: required('BRIDGE_SECRET'),

  // ❌ lo dejamos pero ya no se usa
  accessDsn: process.env.ACCESS_DSN || '',

  // 🔥 ESTE ES EL IMPORTANTE
  accessDbPath: required('ACCESS_DB_PATH'),

  syncIntervalMs: Number(process.env.SYNC_INTERVAL_MS || 30000),
};