/**
 * Acciones: cada brecha se vuelve una corrección con responsable y fecha.
 * Regla del producto: ninguna acción pasa a "confirmada" sin un simulacro real
 * capturado por una persona. El modelo nunca confirma nada por sí solo.
 */
export type EstadoAccion = "propuesta" | "asignada" | "aplicada_modelo" | "confirmada_real";
export const ORDEN_ESTADOS: EstadoAccion[] = ["propuesta", "asignada", "aplicada_modelo", "confirmada_real"];
export const ETIQUETA_ESTADO: Record<EstadoAccion, string> = {
  propuesta: "Propuesta (sin responsable)",
  asignada: "Asignada",
  aplicada_modelo: "Aplicada al modelo, pendiente de verificar en simulacro real",
  confirmada_real: "Confirmada en simulacro real",
};

export interface Accion {
  id: string;
  fixId: string;
  titulo: string;
  porQue: string;
  responsable: string;
  fecha: string; // YYYY-MM-DD
  estado: EstadoAccion;
  real?: { fecha: string; nota: string; tiempoSeg?: number | null };
}

export type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
export function limpiarTexto(s: string, max: number): string {
  // quita caracteres de control y recorta; los formularios nunca pasan texto crudo
  return s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
export function fechaValida(s: string): boolean {
  if (!FECHA.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function asignar(a: Accion, responsable: string, fecha: string): Resultado<Accion> {
  const r = limpiarTexto(responsable, 60);
  if (r.length < 2) return { ok: false, error: "Escribe el nombre de la persona responsable." };
  if (!fechaValida(fecha)) return { ok: false, error: "Elige una fecha válida." };
  if (a.estado !== "propuesta" && a.estado !== "asignada") return { ok: false, error: "Esta acción ya está aplicada." };
  return { ok: true, valor: { ...a, responsable: r, fecha, estado: "asignada" } };
}
export function aplicarAlModelo(a: Accion): Resultado<Accion> {
  if (a.estado !== "asignada") return { ok: false, error: "Primero asigna una persona responsable y una fecha." };
  return { ok: true, valor: { ...a, estado: "aplicada_modelo" } };
}
export function confirmarReal(a: Accion, fecha: string, nota: string, tiempoSeg: number | null): Resultado<Accion> {
  if (a.estado !== "aplicada_modelo") return { ok: false, error: "Solo se confirma una acción que ya se aplicó al modelo." };
  if (!fechaValida(fecha)) return { ok: false, error: "Escribe la fecha del simulacro real." };
  const n = limpiarTexto(nota, 400);
  if (n.length < 10) return { ok: false, error: "Describe qué se observó en el simulacro real (mínimo 10 caracteres)." };
  if (tiempoSeg != null && (!Number.isFinite(tiempoSeg) || tiempoSeg < 10 || tiempoSeg > 3600)) return { ok: false, error: "El tiempo debe estar entre 10 s y 60 min." };
  return { ok: true, valor: { ...a, estado: "confirmada_real", real: { fecha, nota: n, tiempoSeg } } };
}
/** Deshacer: una acción aplicada vuelve a "asignada" (por ejemplo, si se aplicó por error). */
export function revertir(a: Accion): Resultado<Accion> {
  if (a.estado !== "aplicada_modelo") return { ok: false, error: "Solo se puede revertir una acción aplicada al modelo." };
  return { ok: true, valor: { ...a, estado: "asignada" } };
}
