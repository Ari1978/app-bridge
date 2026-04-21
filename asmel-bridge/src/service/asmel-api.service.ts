import axios from 'axios';
import { env } from '../config/env';

const api = axios.create({
  baseURL: env.asmelApiUrl,
  timeout: 120000,
  headers: {
    Authorization: `Bearer ${env.asmelApiToken}`,
    'Content-Type': 'application/json',
  },
});

export type EmpresaSyncDto = {
  id?: string; // 🔥 ahora opcional
  numeroCliente: string;
  razonSocial: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  cuit?: string;
  telefono?: string;
  emailFacturacion?: string;
  condicionIva?: string;
};

export type FacturaDetalleSyncDto = {
  concepto: string;
  total: number;
};

export type FacturaSyncDto = {
  id: string;
  numero: string;
  fecha: string;
  periodo: string;
  letra?: string;
  cae?: string;
  empresa: EmpresaSyncDto;
  detalles: FacturaDetalleSyncDto[];
};

// =========================
// EMPRESAS
// =========================
export async function getEmpresasPendientes(): Promise<EmpresaSyncDto[]> {
  const { data } = await api.get('/api/bridge/empresas');
  return Array.isArray(data) ? data : data.data ?? [];
}

export async function marcarEmpresaSincronizada(empresaId?: string): Promise<void> {
  // 🔥 FIX: evitar romper backend
  if (!empresaId || empresaId === 'undefined') {
    console.warn('⚠️ empresaId inválido, no se marca como sincronizada');
    return;
  }

  await api.patch(`/api/bridge/empresa/${empresaId}/sync`);
}



// =========================
// FACTURAS
// =========================
export async function getFacturasPendientes(): Promise<FacturaSyncDto[]> {
  const { data } = await api.get('/api/bridge/facturas');
  return Array.isArray(data) ? data : data.data ?? [];
}

export async function marcarFacturaExportada(facturaId?: string): Promise<void> {
  if (!facturaId || facturaId === 'undefined') {
    console.warn('⚠️ facturaId inválido, no se marca como exportada');
    return;
  }

  await api.patch(`/api/bridge/factura/${facturaId}/sync`);
}

