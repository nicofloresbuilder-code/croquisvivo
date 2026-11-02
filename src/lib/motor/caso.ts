/** Caso: un croquis, lo que dijo el registro, las correcciones aplicadas y las acciones. */
import type { Accion } from "./acciones";
import { limpiarTexto } from "./acciones";
import type { Afirmacion, Brecha, Conjunto, Observado } from "./conjunto";
import { compararAfirmacion, correrConjunto } from "./conjunto";
import type { Finding, Site } from "./nucleo";
import { analyze, aplicarFix, simulate } from "./nucleo";
import type { SitioId } from "./sitios";
import { PRESETS } from "./sitios";

export interface Resumen { brechas: number; sinOirSeguro: number; tUltima: number; fraccion: number }
export interface Caso {
  v: 1;
  id: string;
  nombre: string;
  sitio: SitioId;
  afirmacion: Afirmacion;
  observado?: Observado;
  aplicadas: string[]; // ids de correcciones aplicadas al modelo, en orden
  acciones: Accion[];
  antes?: Resumen; // foto del modelo antes de aplicar la primera corrección
  creado: number;
  actualizado: number;
}
export interface Derivado {
  site: Site;
  conjunto: Conjunto;
  brechas: Brecha[];
  hallazgos: Finding[];
  resumen: Resumen;
}

export function nuevoId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === "x" ? r : (r & 3) | 8).toString(16);
  });
}

export function afirmacionPorDefecto(sitio: SitioId): Afirmacion {
  const n = PRESETS[sitio]().people.length;
  return { personas: n, evacuaron: n, tiempoSeg: 90, alarmaTodas: true };
}

export function crearCaso(sitio: SitioId, nombre: string, ahora: number): Caso {
  return { v: 1, id: nuevoId(), nombre: limpiarTexto(nombre, 80) || "Caso sin nombre", sitio, afirmacion: afirmacionPorDefecto(sitio), aplicadas: [], acciones: [], creado: ahora, actualizado: ahora };
}

export function limpiarAfirmacion(a: Afirmacion): { ok: true; valor: Afirmacion } | { ok: false; error: string } {
  const ent = (x: number) => Number.isInteger(x);
  if (!ent(a.personas) || a.personas < 1 || a.personas > 2000) return { ok: false, error: "Las personas presentes deben ser un número entero entre 1 y 2000." };
  if (!ent(a.evacuaron) || a.evacuaron < 0 || a.evacuaron > a.personas) return { ok: false, error: "Las personas que salieron deben ser entre 0 y las presentes." };
  if (a.tiempoSeg != null && (!Number.isFinite(a.tiempoSeg) || a.tiempoSeg < 10 || a.tiempoSeg > 3600)) return { ok: false, error: "El tiempo debe estar entre 10 segundos y 60 minutos." };
  return { ok: true, valor: { personas: a.personas, evacuaron: a.evacuaron, tiempoSeg: a.tiempoSeg ?? null, alarmaTodas: Boolean(a.alarmaTodas) } };
}

export function construirSitio(c: Pick<Caso, "sitio" | "aplicadas">): Site {
  const s = PRESETS[c.sitio]();
  for (const id of c.aplicadas) aplicarFix(s, id);
  return s;
}

export function derivar(c: Caso): Derivado {
  const site = construirSitio(c);
  const conjunto = correrConjunto(site);
  const brechas = compararAfirmacion(c.afirmacion, conjunto);
  const run = simulate(site, 2026, { frames: false });
  const hallazgos = analyze(site, run);
  return { site, conjunto, brechas, hallazgos, resumen: resumir(brechas, conjunto) };
}
export function resumir(brechas: Brecha[], c: Conjunto): Resumen {
  return { brechas: brechas.filter((b) => b.estado === "brecha").length, sinOirSeguro: c.sinOirSeguro, tUltima: c.tUltima.mediana, fraccion: c.fraccionSalida.mediana };
}

/** Asegura que cada hallazgo con corrección tenga una acción (propuesta si es nueva). */
export function sincronizarAcciones(c: Caso, hallazgos: Finding[]): Caso {
  const nuevas: Accion[] = [];
  for (const h of hallazgos) {
    if (!h.fix) continue;
    if (c.acciones.some((a) => a.fixId === h.fix!.id)) continue;
    nuevas.push({ id: nuevoId(), fixId: h.fix.id, titulo: h.fix.label, porQue: h.title, responsable: "", fecha: "", estado: "propuesta" });
  }
  return nuevas.length ? { ...c, acciones: [...c.acciones, ...nuevas] } : c;
}
