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
    // 🧾 EMPRESAS
    // =========================
    const empresas = await getEmpresasPendientes();

    logger.info(`📦 Empresas pendientes: ${empresas.length}`);

    for (const empresa of empresas) {
      try {
        await insertarClienteAccess(conn, empresa);
        await insertarEmailClienteAccess(conn, empresa);

        // 🔥 FIX REAL: usar ID de Mongo
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

    // =========================
    // 🧾 FACTURAS
    // =========================
    const facturas = await getFacturasPendientes();

    logger.info(`🧾 Facturas pendientes: ${facturas.length}`);

    for (const factura of facturas) {
      try {
        // 🔥 asegurar cliente SIEMPRE
        await insertarClienteAccess(conn, factura.empresa);
        await insertarEmailClienteAccess(conn, factura.empresa);

        // 🔥 cabecera
        const idfc = await insertarFacturaAccess(conn, factura);

        // 🔥 FIX SOLO TIPADO
        if (idfc === undefined) continue;

        await insertarItemsFacturaAccess(conn, idfc, factura);

        // 🔥 marcar exportada
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

    running = false;
  }
}
