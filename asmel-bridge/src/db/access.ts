import odbc from "odbc";
import { env } from "../config/env";
import fs from "fs";

export async function getAccessConnection(): Promise<odbc.Connection> {
  try {
    // =========================
    // 📂 PATH
    // =========================
    const rawPath = env.accessDbPath;
    const dbPath = rawPath.replace(/\\\\/g, "\\");

    console.log("📂 DB PATH:", dbPath);

    if (!fs.existsSync(dbPath)) {
      throw new Error("Archivo Access no existe");
    }

    // =========================
    // 🔌 CONEXIÓN ODBC
    // =========================
    const connectionString = `Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${dbPath};`;

    console.log("🔌 CONECTANDO CON ODBC...");

    const connection = await odbc.connect(connectionString);

    console.log("✅ CONEXIÓN ODBC LISTA");

    return connection;

  } catch (error: any) {
    console.error("❌ Error conectando a Access");
    console.error(error?.message || error);
    throw error;
  }
}