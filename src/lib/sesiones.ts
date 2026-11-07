"use client";
/**
 * Almacén de la libreta de sesiones. Igual que los casos: base de datos si existe, si no este navegador.
 * No hay función de borrado a propósito: las sesiones que salen mal también se conservan
 * (Condición 6 del Blueprint: conservar resultados negativos y disensos).
 */
import { clienteNube, iniciar } from "./almacen";
import { fusionar, type Sesion } from "./sesion/validar";

const CLAVE = "croquisvivo.sesiones.v1";
let memoria: Sesion[] = [];

function leerLocal(): Sesion[] {
  try {
    const v = localStorage.getItem(CLAVE);
    if (v) { const j = JSON.parse(v); if (Array.isArray(j)) return j as Sesion[]; }
    return [];
  } catch { return memoria; }
}
function escribirLocal(s: Sesion[]) {
  memoria = s;
  try { localStorage.setItem(CLAVE, JSON.stringify(s)); } catch { /* en memoria */ }
}

function aFila(s: Sesion) {
  return {
    id: s.id, creada: new Date(s.creada).toISOString(), rol: s.rol, desconocido: s.desconocido, modalidad: s.modalidad,
    completo_solo: s.completoSolo, segundos: s.segundos, errores: s.errores, atascos: s.atascos, problema_principal: s.problemaPrincipal,
    gravedad: s.gravedad, paga_hoy: s.pagaHoy, quien_firma: s.quienFirma, segundos_hoja: s.segundosHoja, volveria: s.volveria, prueba_volver: s.pruebaVolver,
  };
}
type Fila = ReturnType<typeof aFila>;
function deFila(f: Fila): Sesion {
  return {
    id: f.id, creada: new Date(f.creada).getTime(), rol: f.rol as Sesion["rol"], desconocido: f.desconocido, modalidad: f.modalidad as Sesion["modalidad"],
    completoSolo: f.completo_solo, segundos: f.segundos, errores: f.errores, atascos: f.atascos as string[], problemaPrincipal: f.problema_principal,
    gravedad: f.gravedad, pagaHoy: f.paga_hoy, quienFirma: f.quien_firma, segundosHoja: f.segundos_hoja, volveria: f.volveria, pruebaVolver: f.prueba_volver,
  };
}

export async function listarSesiones(): Promise<{ sesiones: Sesion[]; donde: "nube" | "local"; soloAqui: number }> {
  await iniciar();
  const local = leerLocal();
  const c = await clienteNube();
  if (c) {
    try {
      const { data, error } = await c.from("sesiones").select("*").order("creada", { ascending: true }).limit(200);
      if (error) throw error;
      const { sesiones, pendientes } = fusionar((data ?? []).map((f) => deFila(f as Fila)), local);
      // Reintenta subir lo que solo estaba en este navegador; lo que siga sin subir se avisa en pantalla.
      let soloAqui = 0;
      for (const s of pendientes) {
        try {
          const r = await c.from("sesiones").upsert(aFila(s), { onConflict: "id" });
          if (r.error) throw r.error;
        } catch { soloAqui++; }
      }
      return { sesiones, donde: "nube", soloAqui };
    } catch { /* cae a local */ }
  }
  return { sesiones: local.sort((a, b) => a.creada - b.creada), donde: "local", soloAqui: local.length };
}

export async function guardarSesion(s: Sesion): Promise<"nube" | "local"> {
  await iniciar();
  const otras = leerLocal().filter((x) => x.id !== s.id);
  escribirLocal([...otras, s]); // la copia local siempre existe
  const c = await clienteNube();
  if (c) {
    try {
      const { error } = await c.from("sesiones").upsert(aFila(s), { onConflict: "id" });
      if (error) throw error;
      return "nube";
    } catch { /* queda local */ }
  }
  return "local";
}
