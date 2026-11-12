"use client";
/**
 * Almacén genérico (semana 14): base de datos si existe, si no este navegador; la copia local siempre existe.
 * Lo que solo está en este navegador se reintenta subir al listar y se cuenta en `soloAqui`.
 */
import { clienteNube, iniciar } from "./almacen";

interface Cfg<T extends { id: string; creada: number }, F> {
  tabla: string; clave: string; aFila: (x: T) => F; deFila: (f: F) => T; esValido: (x: unknown) => x is T;
}
export interface Tabla<T extends { id: string; creada: number }> {
  listar(): Promise<{ items: T[]; donde: "nube" | "local"; soloAqui: number }>;
  guardar(x: T): Promise<"nube" | "local">;
  borrar?(id: string): Promise<void>;
}

export function crearTabla<T extends { id: string; creada: number }, F>(c: Cfg<T, F>, opciones: { borrable: boolean }): Tabla<T> {
  let memoria: T[] = [];
  const leer = (): T[] => {
    try {
      const v = localStorage.getItem(c.clave);
      if (v) { const j = JSON.parse(v); if (Array.isArray(j)) return j.filter(c.esValido); }
      return [];
    } catch { return memoria; }
  };
  const escribir = (xs: T[]) => { memoria = xs; try { localStorage.setItem(c.clave, JSON.stringify(xs)); } catch { /* en memoria */ } };
  const t: Tabla<T> = {
    async listar() {
      await iniciar();
      const local = leer();
      const cl = await clienteNube();
      if (cl) {
        try {
          const { data, error } = await cl.from(c.tabla).select("*").order("creada", { ascending: true }).limit(200);
          if (error) throw error;
          const nube = (data ?? []).map((f) => c.deFila(f as F));
          const ids = new Set(nube.map((x) => x.id));
          const pendientes = local.filter((x) => !ids.has(x.id));
          let soloAqui = 0;
          for (const p of pendientes) {
            try { const r = await cl.from(c.tabla).upsert(c.aFila(p) as unknown as Record<string, unknown>, { onConflict: "id" }); if (r.error) throw r.error; } catch { soloAqui++; }
          }
          return { items: [...nube, ...pendientes].sort((a, b) => a.creada - b.creada), donde: "nube", soloAqui };
        } catch { /* cae a local */ }
      }
      return { items: local.sort((a, b) => a.creada - b.creada), donde: "local", soloAqui: local.length };
    },
    async guardar(x) {
      await iniciar();
      escribir([...leer().filter((o) => o.id !== x.id), x]);
      const cl = await clienteNube();
      if (cl) {
        try { const { error } = await cl.from(c.tabla).upsert(c.aFila(x) as unknown as Record<string, unknown>, { onConflict: "id" }); if (error) throw error; return "nube"; } catch { /* queda local */ }
      }
      return "local";
    },
  };
  if (opciones.borrable) {
    t.borrar = async (id: string) => {
      await iniciar();
      escribir(leer().filter((o) => o.id !== id));
      const cl = await clienteNube();
      if (cl) { try { await cl.from(c.tabla).delete().eq("id", id); } catch { /* ya no está en este navegador */ } }
    };
  }
  return t;
}
