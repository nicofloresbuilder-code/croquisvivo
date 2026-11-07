"use client";
/**
 * Registro anónimo de eventos (analítica propia). Sin cookies de terceros, sin scripts externos,
 * sin nombres ni textos libres de otras personas: solo el tipo de evento, la ruta y números.
 * Guarda siempre en este navegador (últimos 500) y, si hay base de datos, también allá.
 * Cada acceso va en try/catch: registrar un evento nunca rompe la página.
 */
import { clienteNube } from "./almacen";
import { limpiarTexto, MAX_CITA, nuevoId } from "./sesion/validar";

export const TIPOS = ["pagina_vista", "caso_creado", "comparado", "plano_reproducido", "accion_asignada", "accion_aplicada", "accion_confirmada", "calibrado", "error_validacion", "atasco", "sesion_iniciada", "sesion_terminada"] as const;
export type Tipo = (typeof TIPOS)[number];
export interface Evento { id: string; t: number; tipo: Tipo; sesionId: string | null; detalle: Record<string, string | number | boolean> }

const CLAVE_EV = "croquisvivo.eventos.v1";
const CLAVE_SES = "croquisvivo.sesionActiva.v1";
const MAX_LOCAL = 500;
let memoria: Evento[] = [];

export interface SesionActiva { id: string; inicio: number }

export function sesionActiva(): SesionActiva | null {
  try {
    const v = localStorage.getItem(CLAVE_SES);
    if (!v) return null;
    const j = JSON.parse(v);
    if (j && typeof j.id === "string" && typeof j.inicio === "number") return j;
  } catch { /* sin almacenamiento */ }
  return null;
}
export function fijarSesionActiva(s: SesionActiva | null) {
  try { if (s) localStorage.setItem(CLAVE_SES, JSON.stringify(s)); else localStorage.removeItem(CLAVE_SES); } catch { /* sin almacenamiento */ }
}

export function limpiarDetalle(d: Record<string, unknown>): Evento["detalle"] {
  const out: Evento["detalle"] = {};
  for (const [k, v] of Object.entries(d)) {
    if (Object.keys(out).length >= 8) break;
    if (typeof v === "number" && Number.isFinite(v)) out[k.slice(0, 30)] = v;
    else if (typeof v === "boolean") out[k.slice(0, 30)] = v;
    else if (typeof v === "string") out[k.slice(0, 30)] = limpiarTexto(v).slice(0, MAX_CITA);
  }
  return out;
}

export function leerEventos(): Evento[] {
  try {
    const v = localStorage.getItem(CLAVE_EV);
    if (v) { const j = JSON.parse(v); if (Array.isArray(j)) return j as Evento[]; }
    return [];
  } catch { return memoria; }
}
function escribir(ev: Evento[]) {
  memoria = ev;
  try { localStorage.setItem(CLAVE_EV, JSON.stringify(ev)); } catch { /* se queda en memoria */ }
}

export function registrar(tipo: Tipo, detalle: Record<string, unknown> = {}): void {
  try {
    const sa = sesionActiva();
    const e: Evento = { id: nuevoId(), t: Date.now(), tipo, sesionId: sa ? sa.id : null, detalle: limpiarDetalle(detalle) };
    escribir([...leerEventos(), e].slice(-MAX_LOCAL));
    void (async () => {
      try {
        const c = await clienteNube();
        if (!c) return;
        await c.from("eventos").insert({ id: e.id, sesion_id: e.sesionId, tipo: e.tipo, detalle: e.detalle, t: new Date(e.t).toISOString() });
      } catch { /* la copia local basta */ }
    })();
  } catch { /* nunca rompe la página */ }
}

export function eventosDeSesion(sesionId: string): Evento[] {
  return leerEventos().filter((e) => e.sesionId === sesionId);
}
