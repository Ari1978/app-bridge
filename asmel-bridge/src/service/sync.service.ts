import { getAccessConnection } from "../db/access";
import {
  getEmpresasPendientes,
  getFacturasPendientes,
  marcarEmpresaSincronizada,
  marcarFacturaExportada,
} from "./asmel-api.service";
import {
  insertarClienteAccess,
  insertarEmailClienteAccess,
} from "./access-clientes.service";
import {
  insertarFacturaAccess,
  insertarItemsFacturaAccess,
} from "./access-facturas.service";
import { logger } from "../utils/logger";
import { env } from "../config/env";

// SanaMed exige la clave del bridge en todas las rutas /api/bridge.
const authHeaders = { Authorization: `Bearer ${env.asmelApiToken}` };

let running = false;

export async function syncNow(): Promise<void> {
  if (running) {
    logger.warn("⛔ Sync ya en ejecución");
    return;
  }

  running = true;
  let conn: any;

  try {
    conn = await getAccessConnection();
    logger.info("🔥 Conectado a Access");

    // =========================
    // 🔥 LEER ESTADO (onlyId)
    // =========================
    let onlyId: string | null = null;

    try {
      const res = await fetch(
        `${process.env.ASMEL_API_URL}/api/bridge/sync-request`,
        { headers: authHeaders }
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      onlyId = data.onlyId || null;
    } catch (err) {
      logger.warn(
        "⚠️ No se pudo obtener sync-request",
        err instanceof Error ? err.message : err
      );
    }

    // =========================
    // 🧾 EMPRESAS
    // =========================
    if (!onlyId) {
      const empresas = await getEmpresasPendientes();

      logger.info(`📦 Empresas pendientes: ${empresas.length}`);

      for (const empresa of empresas) {
        try {
          await insertarClienteAccess(conn, empresa);
          await insertarEmailClienteAccess(conn, empresa);

          const empresaId = empresa.id ? String(empresa.id) : undefined;

          if (!empresaId) {
            logger.warn("⚠️ empresaId inválido, no se marca como sincronizada");
          } else {
            await marcarEmpresaSincronizada(empresaId);
          }

          logger.info("✅ Empresa OK", {
            empresaId,
            numeroCliente: empresa.numeroCliente,
          });
        } catch (error: any) {
          logger.error("❌ Error empresa", {
            empresaId: empresa.id,
            error: error?.message || error,
          });
        }
      }
    } else {
      logger.info("🚀 Sync individual → no se recorren empresas");
    }

    // =========================
    // 🧾 FACTURAS
    // =========================

    let facturas = await getFacturasPendientes();

    if (onlyId) {
      facturas = facturas.filter(
        (f) => String(f.id) === String(onlyId)
      );

      logger.info("🎯 Sync individual", {
        onlyId,
        total: facturas.length,
      });
    }

    logger.info(`🧾 Facturas a exportar: ${facturas.length}`);

    for (const factura of facturas) {
      try {
        await insertarClienteAccess(conn, factura.empresa);
        await insertarEmailClienteAccess(conn, factura.empresa);

        const idfc = await insertarFacturaAccess(conn, factura);

        if (idfc === undefined) continue;

        await insertarItemsFacturaAccess(conn, idfc, factura);

        await marcarFacturaExportada(String(factura.id));

        logger.info("✅ Factura OK", {
          facturaId: factura.id,
          numero: factura.numero,
          idfc,
        });
      } catch (error: any) {
        logger.error("❌ Error factura", {
          facturaId: factura.id,
          numero: factura.numero,
          error: error?.message || error,
        });
      }
    }
  } catch (error: any) {
    logger.error("💥 ERROR GENERAL SYNC", error?.message || error);
  } finally {
    try {
      if (conn) {
        await conn.close();
        logger.info("🔌 Conexión Access cerrada");
      }
    } catch (err) {
      logger.error("Error cerrando conexión", err);
    }

    // 🔥 limpiar estado SIEMPRE
    try {
      const res = await fetch(
        `${process.env.ASMEL_API_URL}/api/bridge/sync-request/clear`,
        {
          method: "POST",
          headers: authHeaders,
        }
      );
      if (!res.ok) {
        logger.warn(`⚠️ No se pudo limpiar sync-request (HTTP ${res.status})`);
      }
    } catch (err) {
      logger.warn("⚠️ No se pudo limpiar sync-request");
    }

    running = false;
  }
}