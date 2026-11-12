/**
 * Registro de conversaciones de precio (semana 14, condiciones 1 y 2 del Blueprint).
 * Separa rechazo, interés dicho, propuesta pedida, compromiso firmado y pago. Solo los dos últimos cuentan como demanda.
 * No hay nombres, correos ni teléfonos: la persona se describe por rol.
 */
import { datoPersonal, limpiarTexto, nuevoId, ROL_IDS } from "../sesion/validar";

export const RESULTADOS = [
  ["rechazo", "Dijo que no"],
  ["interes_dicho", "Dijo que le interesa (no cuenta como demanda)"],
  ["pidio_propuesta", "Pidió una propuesta"],
  ["compromiso_firmado", "Firmó un compromiso"],
  ["pago_hecho", "Pagó"],
] as const;
export type ResultadoConv = (typeof RESULTADOS)[number][0];
const RES_IDS: string[] = RESULTADOS.map((r) => r[0]);
export const MAX = { tarea: 300, quien: 120, costo: 200, cita: 300, paso: 200, precio: 1_000_000 } as const;

export interface Conversacion {
  id: string; creada: number; rol: string; segmento: "A" | "B"; desconocido: boolean;
  tareaHoy: string; quienFirma: string; costoActual: string;
  precioPreguntado: number; resultado: ResultadoConv; cita: string; siguientePaso: string;
}
type Raw = Partial<Record<keyof Conversacion, unknown>>;
export type Resultado<T> = { ok: true; valor: T } | { ok: false; errores: string[] };

function txt(campo: string, v: unknown, max: number, errores: string[], requerido = true): string {
  const s = limpiarTexto(v);
  if (!s) { if (requerido) errores.push(`${campo}: escribe algo (o "sin dato" si no lo sabes).`); return ""; }
  if (s.length > max) errores.push(`${campo}: máximo ${max} caracteres.`);
  const dp = datoPersonal(s);
  if (dp) errores.push(`${campo}: ${dp}`);
  return s;
}

export function validarConversacion(r: Raw, ahora = Date.now()): Resultado<Conversacion> {
  const errores: string[] = [];
  if (typeof r.rol !== "string" || !ROL_IDS.includes(r.rol)) errores.push("Rol: elige un rol de la lista.");
  if (r.segmento !== "A" && r.segmento !== "B") errores.push("Segmento: elige A o B.");
  if (typeof r.desconocido !== "boolean") errores.push("Indica si la persona era desconocida para ti.");
  const tareaHoy = txt("Tarea de hoy (cómo lo hace hoy)", r.tareaHoy, MAX.tarea, errores);
  const quienFirma = txt("Quién firma el gasto", r.quienFirma, MAX.quien, errores);
  const costoActual = txt("Qué paga hoy", r.costoActual, MAX.costo, errores);
  const precio = typeof r.precioPreguntado === "number" ? r.precioPreguntado : Number(String(r.precioPreguntado ?? "").replace(/[$,\s]/g, ""));
  if (!Number.isFinite(precio) || precio <= 0 || precio > MAX.precio) errores.push(`Precio que le dijiste: un número mayor que 0 y hasta ${MAX.precio.toLocaleString("es-MX")}.`);
  if (typeof r.resultado !== "string" || !RES_IDS.includes(r.resultado)) errores.push("Resultado: elige qué pasó.");
  const cita = txt("Lo que dijo, tal cual", r.cita, MAX.cita, errores);
  const siguientePaso = txt("Siguiente paso", r.siguientePaso, MAX.paso, errores);
  if ((r.resultado === "compromiso_firmado" || r.resultado === "pago_hecho") && siguientePaso.length < 5) errores.push("Un compromiso o un pago necesita su prueba en 'Siguiente paso' (qué se firmó o se pagó).");
  if (errores.length) return { ok: false, errores };
  return {
    ok: true,
    valor: {
      id: typeof r.id === "string" && r.id ? r.id : nuevoId(), creada: typeof r.creada === "number" ? r.creada : ahora, rol: r.rol as string, segmento: r.segmento as "A" | "B",
      desconocido: r.desconocido as boolean, tareaHoy, quienFirma, costoActual, precioPreguntado: precio, resultado: r.resultado as ResultadoConv, cita, siguientePaso,
    },
  };
}

/** Cuenta cada resultado por separado. La demanda comprobada son solo compromisos firmados y pagos. */
export function resumen(cs: Conversacion[]) {
  const c: Record<ResultadoConv, number> = { rechazo: 0, interes_dicho: 0, pidio_propuesta: 0, compromiso_firmado: 0, pago_hecho: 0 };
  for (const x of cs) c[x.resultado]++;
  const demanda = c.compromiso_firmado + c.pago_hecho;
  const sinCosto = cs.filter((x) => /^sin dato$/i.test(x.costoActual.trim())).length;
  return { total: cs.length, ...c, demandaComprobada: demanda, sinCostoActual: sinCosto, desconocidos: cs.filter((x) => x.desconocido).length };
}

function celda(v: unknown): string {
  const s = String(v ?? "");
  const seguro = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${seguro.replace(/"/g, '""')}"`;
}
export function conversacionesACsv(cs: Conversacion[]): string {
  const cab = ["id", "fecha", "rol", "segmento", "desconocido", "tarea_hoy", "quien_firma", "que_paga_hoy", "precio_dicho", "resultado", "cita", "siguiente_paso"];
  return [cab.join(","), ...cs.map((x) => [x.id, new Date(x.creada).toISOString(), x.rol, x.segmento, x.desconocido, x.tareaHoy, x.quienFirma, x.costoActual, x.precioPreguntado, x.resultado, x.cita, x.siguientePaso].map(celda).join(","))].join("\n");
}
