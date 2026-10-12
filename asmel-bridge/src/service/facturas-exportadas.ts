import fs from "fs";
import path from "path";

// =====================================================
// FACTURAS YA CARGADAS EN ACCESS (registro local en esta PC)
// =====================================================
// La tabla FC de Access no tiene dónde guardar el número de SanaMed, así que
// el bridge anota acá cada factura que carga: id de SanaMed → IDFC de Access.
// Antes de cargar una factura se mira esta lista: si ya está, no se vuelve a
// insertar (solo se reintenta marcarla como exportada en SanaMed). Protege
// contra duplicados cuando Access se cargó bien pero SanaMed no llegó a
// enterarse (Render caído, corte de red).
//
// Archivo: data/facturas-exportadas.json, junto a src/ y dist/.

type Registro = { idfc: number; numero: string; fecha: string };

const ARCHIVO = path.resolve(__dirname, "..", "..", "data", "facturas-exportadas.json");

function leer(): Record<string, Registro> {
  try {
    return JSON.parse(fs.readFileSync(ARCHIVO, "utf8")) as Record<string, Registro>;
  } catch (err) {
    // Todavía no existe: lista vacía. Cualquier otro error (archivo roto) se
    // propaga para no cargar facturas a ciegas.
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw err;
  }
}

export function yaCargadaEnAccess(facturaId: string): Registro | undefined {
  return leer()[facturaId];
}

export function anotarCargadaEnAccess(facturaId: string, idfc: number, numero: string): void {
  const todas = leer();
  todas[facturaId] = { idfc, numero, fecha: new Date().toISOString() };

  // Escritura atómica: si se corta a la mitad, el archivo anterior queda sano.
  fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
  const tmp = `${ARCHIVO}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(todas, null, 2));
  fs.renameSync(tmp, ARCHIVO);
}
