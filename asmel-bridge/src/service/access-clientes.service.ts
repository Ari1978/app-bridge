import odbc from "odbc";
import { EmpresaSyncDto } from "./asmel-api.service";
import { cleanCuit, cleanString, formatAccessDate } from "../utils/clean";

// ======================
// SAFE SQL STRING
// ======================
function safe(value: any, max = 255): string {
  if (!value) return "";
  return String(value).replace(/'/g, "''").substring(0, max);
}

// ======================
// FORMAT CLIENTE
// ======================
function formatNumeroCliente(numero: string | number): string {
  return String(numero).padStart(7, "0");
}

// ======================
// EXISTE CLIENTE
// ======================
export async function existeCliente(
  conn: odbc.Connection,
  numeroCliente: string,
): Promise<boolean> {
  const numero = formatNumeroCliente(numeroCliente);

  const sql = `
    SELECT NUMERO FROM CLIENTES WHERE NUMERO = '${numero}'
  `;

  try {
    console.log("==============================");
    console.log("🔍 EXISTE CLIENTE");
    console.log("➡️ numeroCliente (raw):", numeroCliente);
    console.log("➡️ numeroCliente (formatted):", numero);
    console.log("➡️ SQL:", sql);

    const rows = await conn.query(sql);

    console.log("➡️ RESULT ROWS:", rows);

    const existe = Array.isArray(rows) && rows.length > 0;

    console.log("➡️ EXISTE?:", existe);
    console.log("==============================");

    return existe;
  } catch (err: any) {
    console.error("💥 ERROR EXISTE CLIENTE", err);
    throw err;
  }
}
// ======================
// INSERT CLIENTE
// ======================
export async function insertarClienteAccess(
  conn: odbc.Connection,
  empresa: EmpresaSyncDto,
): Promise<void> {
  try {
    if (!empresa.numeroCliente) {
      console.log("⛔ SIN numeroCliente → SKIP");
      return;
    }

    const numeroCliente = empresa.numeroCliente;
    const numeroClienteFormateado = formatNumeroCliente(empresa.numeroCliente);

    console.log("==============================");
    console.log("🏢 PROCESANDO EMPRESA");
    console.log("➡️ empresaId:", empresa.id || empresa.id);
    console.log("➡️ numeroCliente raw:", numeroCliente);
    console.log("➡️ numeroCliente formatted:", numeroClienteFormateado);
    console.log("➡️ razonSocial:", empresa.razonSocial);

    const yaExiste = await existeCliente(conn, numeroCliente);

    if (yaExiste) {
      console.log("⚠️ CLIENTE YA EXISTE → NO INSERTA");
      console.log("==============================");
      return;
    }

    console.log("🆕 CLIENTE NO EXISTE → INSERTANDO");

    const impuesto = mapImpuesto(empresa.condicionIva);
    const provincia = mapProvincia(empresa.provincia);
    const cuitSafe = safe(cleanCuit(empresa.cuit), 15);

    const razon = safe(cleanString(empresa.razonSocial), 60);
    const direccion = safe(cleanString(empresa.direccion), 60);
    const localidad = safe(cleanString(empresa.localidad), 60);
    const telefono = safe(cleanString(empresa.telefono), 20);

    const fecha = formatAccessDate(new Date());

    console.log("🧪 DEBUG LENGTHS:", {
      razon: razon.length,
      direccion: direccion.length,
      localidad: localidad.length,
      telefono: telefono.length,
      cuit: cuitSafe.length,
    });
    console.log("🚨 EMPRESA PROBLEMÁTICA:", empresa);

    const sql = `
      INSERT INTO CLIENTES (
        NUMERO,
        RAZONSOC,
        DIRECCION,
        LOCALIDAD,
        PROVINCIA,
        PAIS,
        IMPUESTO,
        CUIT,
        TELEFONOS,
        CODFACT,
        CONDVTAFIJA,
        FECALTA
      ) VALUES (
        '${numeroClienteFormateado}',
        '${razon}',
        '${direccion}',
        '${localidad}',
        '${provincia}',
        'Argentina',
        '${impuesto}',
        '${cuitSafe}',
        ${telefono ? `'${telefono}'` : 'NULL'},
        'FE',
        '04',
        #${fecha}#
      )
    `;

    console.log("🚀 SQL INSERT:", sql);
    console.log("🧪 SQL REAL:", sql);

    await conn.query(sql);

    console.log("✅ CLIENTE INSERTADO:", numeroClienteFormateado);
    console.log("==============================");
  } catch (err: any) {
    console.error("💥 ERROR INSERT CLIENTE", err);
    throw err;
  }
}

// ======================
// INSERT EMAIL CLIENTE
// ======================
export async function insertarEmailClienteAccess(
  conn: odbc.Connection,
  empresa: EmpresaSyncDto,
): Promise<void> {
  try {
    const email = safe(
      cleanString(
        (empresa as any).emailFacturacion || (empresa as any).email1 || "",
        100,
      ),
      100,
    );
    if (!email) return;

    const numeroCliente = formatNumeroCliente(empresa.numeroCliente);

    const checkSql = `
      SELECT CLIENTE 
      FROM EMAILSCLTE 
      WHERE CLIENTE = '${numeroCliente}'
      AND EMAIL = '${email}' 
      AND TIPO = 'FE'
    `;

    

    const existe = await conn.query(checkSql);

    if (Array.isArray(existe) && existe.length > 0) return;

    const sql = `
      INSERT INTO EMAILSCLTE (CLIENTE, TIPO, EMAIL)
      VALUES (
        '${numeroCliente}',
        'FE',
        '${email}'
      )
    `;

    await conn.query(sql);

    console.log("✅ EMAIL INSERTADO:", email);
  } catch (err: any) {
    console.error("💥 ERROR INSERT EMAIL", err);
    throw err;
  }
}

// ======================
// HELPERS
// ======================
function mapImpuesto(condicionIva?: string): string {
  const value = (condicionIva || "").toLowerCase();

  if (value.includes("responsable")) return "RI";
  if (value.includes("monotrib")) return "RM";
  if (value.includes("exento")) return "EX";

  return "RI";
}

function mapProvincia(provincia?: string): string {
  const value = (provincia || "").toLowerCase();

  if (
    value.includes("buenos aires") ||
    value.includes("bs as") ||
    value.includes("caba")
  ) {
    return "BA";
  }

  if (value.includes("cordoba")) return "CB";
  if (value.includes("santa fe")) return "SF";
  if (value.includes("mendoza")) return "MZ";

  return "BA"; // fallback seguro
}
