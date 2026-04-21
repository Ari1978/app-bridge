import { FacturaSyncDto } from "./asmel-api.service";

// ======================
// HELPERS
// ======================

function formatCliente(numero: number | string) {
  return String(numero).padStart(7, "0");
}

function cleanAccessString(text: string, max = 100) {
  if (!text) return "";

  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, "''")
    .substring(0, max);
}

function formatAccessDate(date: Date | string) {
  const d = new Date(date);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${mm}/${dd}/${yyyy}`;
}

// ======================
// GENERAR ID FACTURA REAL (IDFCIT)
// ======================

async function getNextIdFactura(conn: any): Promise<number> {
  const rows = await conn.query(`
    SELECT MAX(IDFCIT) as maxId FROM FCIT
  `);

  const maxId = Number((rows as any[])[0]?.maxId ?? 0);
  const next = maxId + 1;

  console.log("👉 NUEVO ID FACTURA:", next);

  return next;
}

function getLetraFactura(condicion: string): string {
  const c = (condicion || "").toLowerCase().trim();

  switch (c) {
    case "responsable_inscripto":
    case "exento_a":
      return "A";

    case "monotributo":
    case "monotributista":
    case "consumidor_final":
      return "C";

    case "exento":
    case "exento_b":
      return "B";

    default:
      return "B";
  }
}

// ======================
// INSERT FACTURA (FC)
// ======================

export async function insertarFacturaAccess(
  conn: any,
  factura: FacturaSyncDto,
): Promise<number | void> {
  try {
    const cliente = formatCliente(factura.empresa.numeroCliente);
    const fecha = formatAccessDate(new Date());

    const check = await conn.query(`
      SELECT COMPROBANTE 
      FROM FC 
      WHERE COMPROBANTE = '${factura.numero}'
    `);

    if (Array.isArray(check) && check.length > 0) {
      console.log("⚠️ FACTURA YA EXISTE:", factura.numero);
      return;
    }

    const resultMax = await conn.query(`
  SELECT MAX(IDFC) as maxId FROM FC
`);

    const idfc = (resultMax?.[0]?.maxId || 0) + 1;

    const condicion = factura.empresa.condicionIva ?? "consumidor_final";
    const letra = getLetraFactura(condicion);

    // 🔥 RECIÉN ACÁ INSERTÁS
    const sql = `
      INSERT INTO FC (
  IDFC,
  SISTEMA,
  CLIENTE,
  CODMOV,
  CONDVTA,
  MONEDAORIG,
  MONEDAEMIS,
  VENDEDOR,
  OPERACION,
  FECHADEALTA,
  FECHAFACTURA,
  LETRA,
  COMPROBANTE
) VALUES (
  ${idfc},
  'AP',
  '${cliente}',
  'FE',
  '01',
  'P',
  'P',
  '000',
  '01',
  #${fecha}#,
  #${fecha}#,
  '${letra}',
  '${factura.numero}'
)    `;

    console.log("🚀 INSERT FC:", factura.numero);

    await conn.query(sql);

    console.log("✅ IDFC:", idfc);

    return idfc;
  } catch (error) {
    console.error("💥 ERROR INSERT FC", error);
    throw error;
  }
}
// ======================
// INSERT ITEMS (FCIT)
// ======================

export async function insertarItemsFacturaAccess(
  conn: any,
  idFactura: number,
  factura: FacturaSyncDto,
): Promise<void> {
  try {
    console.log("🔥 DETALLES:", factura.detalles);

    for (let i = 0; i < factura.detalles.length; i++) {
      const item = factura.detalles[i];

      const concepto = cleanAccessString(item.concepto, 90);
      const total = Number(item.total ?? 0);
      const importe = Math.abs(total);
      const renglon = i + 1;

      const sql = `
        INSERT INTO FCIT (
          IDFCIT,
          RENGLON,
          CONCEPTO,
          CODIMP,
          INCIMP,
          MONORIG,
          IMPORTE,
          IMPORTE_S_D,
          DESCUENTOS
        ) VALUES (
          ${idFactura},
          ${renglon},
          '${concepto}',
          '00',
          'N',
          'L',
          ${importe},
          0,
          ''
        )
      `;

      console.log("🚀 SQL FCIT:", sql);

      await conn.query(sql);
    }
  } catch (err: any) {
    console.error("💥 ERROR INSERT FCIT");
    console.error("Factura:", factura.numero);
    console.error("Error:", err?.message || err);
    throw err;
  }
}
