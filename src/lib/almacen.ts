"use client";
/**
 * Almacén de casos. Si hay Supabase configurado y el inicio de sesión anónimo funciona,
 * guarda en la nube (cada persona ve solo sus filas, por RLS). Si no, guarda en este
 * navegador y lo dice en pantalla. Cada acceso va en try/catch: la app nunca se cae por esto.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Caso } from "./motor/caso";

export type Modo = "nube" | "local" | "memoria";
const CLAVE = "croquisvivo.casos.v1";
let memoria: Caso[] = [];
let cliente: SupabaseClient | null = null;
let modo: Modo = "local";
let listo: Promise<Modo> | null = null;

function esCaso(x: unknown): x is Caso {
  const c = x as Caso;
  return Boolean(c) && c.v === 1 && typeof c.id === "string" && typeof c.nombre === "string" && Array.isArray(c.acciones) && Array.isArray(c.aplicadas) && typeof c.afirmacion === "object";
}

function leerLocal(): Caso[] {
  try {
    const v = localStorage.getItem(CLAVE);
    if (v) {
      const j = JSON.parse(v);
      if (Array.isArray(j)) return j.filter(esCaso);
    }
    modo = "local";
  } catch {
    modo = "memoria";
    return memoria;
  }
  return [];
}
function escribirLocal(casos: Caso[]) {
  memoria = casos;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(casos));
    modo = "local";
  } catch {
    modo = "memoria";
  }
}

export function iniciar(): Promise<Modo> {
  if (listo) return listo;
  listo = (async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    leerLocal();
    if (!url || !key) return modo;
    try {
      cliente = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
      const { data } = await cliente.auth.getSession();
      if (!data.session) {
        const r = await cliente.auth.signInAnonymously();
        if (r.error) throw r.error;
      }
      modo = "nube";
    } catch {
      cliente = null;
      modo = leerLocal().length || modo === "local" ? "local" : modo;
    }
    return modo;
  })();
  return listo;
}
export function modoActual(): Modo { return modo; }

export async function listar(): Promise<Caso[]> {
  await iniciar();
  if (modo === "nube" && cliente) {
    try {
      const { data, error } = await cliente.from("casos").select("datos").order("actualizado", { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []).map((r) => r.datos).filter(esCaso);
    } catch {
      modo = "local";
    }
  }
  return leerLocal().sort((a, b) => b.actualizado - a.actualizado);
}

export async function guardar(c: Caso): Promise<Modo> {
  await iniciar();
  if (modo === "nube" && cliente) {
    try {
      const { error } = await cliente.from("casos").upsert({ id: c.id, nombre: c.nombre, datos: c, actualizado: new Date(c.actualizado).toISOString() }, { onConflict: "id" });
      if (error) throw error;
      return modo;
    } catch {
      modo = "local";
    }
  }
  const otros = leerLocal().filter((x) => x.id !== c.id);
  escribirLocal([c, ...otros]);
  return modo;
}

export async function borrar(id: string): Promise<void> {
  await iniciar();
  if (modo === "nube" && cliente) {
    try {
      const { error } = await cliente.from("casos").delete().eq("id", id);
      if (error) throw error;
      return;
    } catch {
      modo = "local";
    }
  }
  escribirLocal(leerLocal().filter((x) => x.id !== id));
}
