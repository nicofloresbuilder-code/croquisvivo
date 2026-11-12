/**
 * Lógica de precios de Croquis Vivo (semana 14). Funciones puras, sin red ni navegador.
 * Los precios de las constantes son VALORES DE PRUEBA inventados: nadie ha pagado todavía.
 * El 10 a 1 solo se calcula con datos que la persona escribe, y siempre se etiqueta como "con tus datos, no medida".
 */
import { datoPersonal, limpiarTexto, nuevoId } from "../sesion/validar";

export type SegmentoId = "A" | "B";
export interface Segmento { id: SegmentoId; nombre: string; firma: string; precioPrueba: number }
export const SEGMENTOS: readonly Segmento[] = [
  { id: "A", nombre: "Escuelas privadas y edificios pequeños", firma: "Dirección o dueño del inmueble", precioPrueba: 3000 },
  { id: "B", nombre: "Hospitales, empresas y sitios con varios inmuebles", firma: "Administración", precioPrueba: 9000 },
];

export const LIM = {
  nombre: 60, alcanzados: 1_000_000, precio: 1_000_000, costoEntrega: 1_000_000, costoActual: 100_000_000, costoFijoMensual: 10_000_000,
} as const;
export const OBJETIVO_RAZON = 10;

export interface Escenario {
  id: string; creada: number; nombre: string; segmento: SegmentoId;
  alcanzados: number; conversionPct: number; precioAnual: number;
  costoEntregaAnual: number | null; costoActualAnual: number | null; costoFijoMensual: number;
}
export interface Salida {
  pagantes: number; ingresoAnual: number; ingresoMensual: number;
  margenAnual: number | null; equilibrioPagantes: number | null;
  razon: number | null; cumpleRazon: boolean | null; costoActualNecesario: number;
}

/** Convierte lo que escribe una persona ("3,000", " 12 ", "") a número. "" da null; texto inválido da NaN. */
export function parseNumero(s: string): number | null {
  const t = limpiarTexto(s).replace(/[$\s]/g, "");
  if (t === "") return null;
  // La coma solo vale como separador de miles (3,000). "2,5" NO es 25: se rechaza para no multiplicar por 10 sin avisar.
  if (t.includes(",") && !/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) return NaN;
  const limpio = t.replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(limpio)) return NaN;
  return Number(limpio);
}

export function proyectar(e: Pick<Escenario, "alcanzados" | "conversionPct" | "precioAnual" | "costoEntregaAnual" | "costoActualAnual" | "costoFijoMensual">): Salida {
  const pagantes = Math.round((e.alcanzados * e.conversionPct) / 100);
  const ingresoAnual = pagantes * e.precioAnual;
  const fijoAnual = e.costoFijoMensual * 12;
  const margenAnual = e.costoEntregaAnual == null ? null : ingresoAnual - pagantes * e.costoEntregaAnual - fijoAnual;
  let equilibrioPagantes: number | null = null;
  if (e.costoEntregaAnual != null) {
    const contribucion = e.precioAnual - e.costoEntregaAnual;
    if (fijoAnual === 0) equilibrioPagantes = 0;
    else if (contribucion > 0) equilibrioPagantes = Math.ceil(fijoAnual / contribucion);
  }
  const razon = e.costoActualAnual == null || e.precioAnual <= 0 ? null : Math.round((e.costoActualAnual / e.precioAnual) * 100) / 100;
  return {
    pagantes, ingresoAnual, ingresoMensual: Math.round(ingresoAnual / 12),
    margenAnual, equilibrioPagantes, razon, cumpleRazon: razon == null ? null : razon >= OBJETIVO_RAZON,
    costoActualNecesario: e.precioAnual * OBJETIVO_RAZON,
  };
}

/** Cómo cambia el resultado si la conversión es otra (los supuestos más inciertos). */
export function sensibilidad(e: Escenario, conversiones = [1, 2, 5, 10, 20]) {
  return conversiones.map((c) => ({ conversionPct: c, ...proyectar({ ...e, conversionPct: c }) }));
}

type Raw = Partial<Record<keyof Escenario, unknown>>;
export type Resultado<T> = { ok: true; valor: T } | { ok: false; errores: string[] };

function num(campo: string, v: unknown, min: number, max: number, errores: string[], opts: { entero?: boolean; opcional?: boolean } = {}): number | null {
  if (v === null || v === undefined || v === "") {
    if (opts.opcional) return null;
    errores.push(`${campo}: escribe un número.`);
    return null;
  }
  const n = typeof v === "number" ? v : parseNumero(String(v));
  if (n === null || Number.isNaN(n) || !Number.isFinite(n)) { errores.push(`${campo}: escribe un número (sin letras; para decimales usa punto, y la coma solo para miles).`); return null; }
  if (opts.entero && !Number.isInteger(n)) { errores.push(`${campo}: debe ser un número entero.`); return null; }
  if (n < min || n > max) { errores.push(`${campo}: debe estar entre ${min.toLocaleString("es-MX")} y ${max.toLocaleString("es-MX")}.`); return null; }
  return n;
}

export function validarEscenario(r: Raw, ahora = Date.now()): Resultado<Escenario> {
  const errores: string[] = [];
  const nombre = limpiarTexto(r.nombre);
  if (!nombre) errores.push("Nombre: ponle un nombre al escenario.");
  else if (nombre.length > LIM.nombre) errores.push(`Nombre: máximo ${LIM.nombre} caracteres.`);
  else { const dp = datoPersonal(nombre); if (dp) errores.push(`Nombre: ${dp}`); }
  const segmento = r.segmento;
  if (segmento !== "A" && segmento !== "B") errores.push("Segmento: elige A o B.");
  const alcanzados = num("Inmuebles alcanzados", r.alcanzados, 0, LIM.alcanzados, errores, { entero: true });
  const conversionPct = num("Conversión (%)", r.conversionPct, 0, 100, errores);
  const precioAnual = num("Precio anual por inmueble", r.precioAnual, 0, LIM.precio, errores);
  const costoEntregaAnual = num("Costo de entrega por inmueble al año", r.costoEntregaAnual, 0, LIM.costoEntrega, errores, { opcional: true });
  const costoActualAnual = num("Costo actual del inmueble al año", r.costoActualAnual, 0, LIM.costoActual, errores, { opcional: true });
  const costoFijoMensual = num("Costo fijo mensual", r.costoFijoMensual ?? 0, 0, LIM.costoFijoMensual, errores);
  if (errores.length) return { ok: false, errores };
  return {
    ok: true,
    valor: {
      id: typeof r.id === "string" && r.id ? r.id : nuevoId(), creada: typeof r.creada === "number" ? r.creada : ahora, nombre,
      segmento: segmento as SegmentoId, alcanzados: alcanzados as number, conversionPct: conversionPct as number, precioAnual: precioAnual as number,
      costoEntregaAnual, costoActualAnual, costoFijoMensual: costoFijoMensual as number,
    },
  };
}

export const mxn = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

function celda(v: unknown): string {
  const s = String(v ?? "");
  const seguro = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${seguro.replace(/"/g, '""')}"`;
}
export function escenariosACsv(es: Escenario[]): string {
  const cab = ["id", "fecha", "nombre", "segmento", "inmuebles_alcanzados", "conversion_pct", "precio_anual_mxn", "costo_entrega_anual", "costo_actual_anual", "costo_fijo_mensual", "pagantes", "ingreso_anual", "ingreso_mensual", "razon_con_tus_datos"];
  const filas = es.map((e) => { const s = proyectar(e); return [e.id, new Date(e.creada).toISOString(), e.nombre, e.segmento, e.alcanzados, e.conversionPct, e.precioAnual, e.costoEntregaAnual ?? "sin medir", e.costoActualAnual ?? "sin dato", e.costoFijoMensual, s.pagantes, s.ingresoAnual, s.ingresoMensual, s.razon ?? "por medir"].map(celda).join(","); });
  return [cab.join(","), ...filas].join("\n");
}
