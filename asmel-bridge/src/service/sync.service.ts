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
import {
  anotarCargadaEnAccess,
  yaCargadaEnAccess,
} from "./facturas-exportadas";

// SanaMed exige la clave del bridge en todas las rutas /api/bridge.
const authHeaders = { Authorization: `Bearer ${env.bridgeSecret}` };

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
        const facturaId = String(factura.id);

        // Ya cargada en Access en una corrida anterior (SanaMed no llegó a
        // marcarla): no se vuelve a insertar, solo se marca.
        const previa = yaCargadaEnAccess(facturaId);
        if (previa) {
          logger.warn("⚠️ Factura ya estaba en Access, solo se marca en SanaMed", {
            numero: factura.numero,
            idfc: previa.idfc,
          });
          await marcarFacturaExportada(facturaId);
          continue;
        }

        await insertarClienteAccess(conn, factura.empresa);
        await insertarEmailClienteAccess(conn, factura.empresa);

        const idfc = await insertarFacturaAccess(conn, factura);

        await insertarItemsFacturaAccess(conn, idfc, factura);

        try {
          anotarCargadaEnAccess(facturaId, idfc, factura.numero);
        } catch (err) {
          // Sin el registro local queda la marca de SanaMed como protección.
          logger.error("❌ No se pudo anotar la factura en el registro local", {
            numero: factura.numero,
            idfc,
            error: err instanceof Error ? err.message : err,
          });
        }

        await marcarFacturaExportada(facturaId);

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