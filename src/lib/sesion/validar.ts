/**
 * Reglas puras de la libreta de sesiones (semana 13). Sin React, sin red: se prueban con tsx.
 * Principios: sin datos personales, el 10:1 solo se muestra si está medido, nada se borra.
 */

export const ROLES = [
  ["coordinador_pc", "Coordinador de Protección Civil"],
  ["director_escuela", "Director o directora de escuela"],
  ["administrador_hospital", "Administrador de hospital o clínica"],
  ["administrador_empresa", "Administrador de empresa o inmueble"],
  ["otro", "Otro rol"],
] as const;
export type Rol = (typeof ROLES)[number][0];
export const ROL_IDS: string[] = ROLES.map((r) => r[0]);

export const MAX_CITA = 300;
export const MAX_ATASCOS = 10;
export const META_SESIONES = 5;
export const META_DESCONOCIDOS = 3;

export interface Sesion {
  id: string;
  creada: number; // ms
  rol: Rol;
  desconocido: boolean;
  modalidad: "presencial" | "remota";
  completoSolo: boolean;
  segundos: number;
  errores: number;
  atascos: string[];
  problemaPrincipal: string;
  gravedad: number; // 1..5
  pagaHoy: string;
  quienFirma: string;
  segundosHoja: number | null;
  volveria: boolean;
  pruebaVolver: string;
}

export type Entrada = Partial<Record<keyof Sesion, unknown>>;
export type Resultado<T> = { ok: true; valor: T } | { ok: false; errores: string[] };

/** Quita caracteres de control y espacios repetidos. */
export function limpiarTexto(s: unknown): string {
  return String(s ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const RE_CORREO = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const RE_TELEFONO = /(?:\+?\d[\s().-]?){9,}/;
const RE_URL = /https?:\/\/|www\./i;

/** Devuelve un mensaje si el texto parece contener datos personales de una persona real; si no, null. */
export function datoPersonal(s: string): string | null {
  if (RE_CORREO.test(s)) return "Parece un correo. No anotes correos: describe a la persona solo por su rol.";
  if (RE_TELEFONO.test(s)) return "Parece un teléfono. No anotes teléfonos: describe a la persona solo por su rol.";
  if (RE_URL.test(s)) return "Parece un enlace. No anotes enlaces de perfiles de personas.";
  return null;
}

function texto(campo: string, v: unknown, max: number, errores: string[], opts: { requerido?: boolean; porDefecto?: string } = {}): string {
  let s = limpiarTexto(v);
  if (!s && opts.porDefecto) s = opts.porDefecto;
  if (!s && opts.requerido) errores.push(`${campo}: escribe algo (o "sin dato" si no lo sabes).`);
  if (s.length > max) errores.push(`${campo}: máximo ${max} caracteres (llevas ${s.length}).`);
  const dp = s ? datoPersonal(s) : null;
  if (dp) errores.push(`${campo}: ${dp}`);
  return s;
}

function entero(campo: string, v: unknown, min: number, max: number, errores: string[]): number {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
  if (!Number.isFinite(n) || !Number.isInteger(n)) { errores.push(`${campo}: escribe un número entero.`); return min; }
  if (n < min || n > max) { errores.push(`${campo}: debe estar entre ${min} y ${max}.`); return min; }
  return n;
}

/** "mm:ss" o "ss" → segundos. null si vacío, "mal" si no se entiende. */
export function parseMmSs(s: string): number | null | "mal" {
  const t = s.trim();
  if (!t) return null;
  const m = /^(\d{1,3}):([0-5]?\d)$/.exec(t);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  if (/^\d{1,4}$/.test(t)) return Number(t);
  return "mal";
}
export function fmtMmSs(seg: number): string {
  const m = Math.floor(seg / 60), s = Math.round(seg % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function nuevoId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  const h = "0123456789abcdef";
  const p = (n: number) => Array.from({ length: n }, () => h[Math.floor(Math.random() * 16)]).join("");
  return `${p(8)}-${p(4)}-4${p(3)}-${"89ab"[Math.floor(Math.random() * 4)]}${p(3)}-${p(12)}`;
}

export function validarSesion(e: Entrada, ahora = Date.now()): Resultado<Sesion> {
  const errores: string[] = [];
  const rol = String(e.rol ?? "");
  if (!ROL_IDS.includes(rol)) errores.push("Rol: elige uno de la lista.");
  if (typeof e.desconocido !== "boolean") errores.push("Elige si la persona era desconocida para ti o no.");
  if (e.modalidad !== "presencial" && e.modalidad !== "remota") errores.push("Elige si la sesión fue presencial o remota.");
  if (typeof e.completoSolo !== "boolean") errores.push("Elige si completó la tarea sin ayuda.");
  if (typeof e.volveria !== "boolean") errores.push("Elige si volvería a usarla.");
  const segundos = entero("Tiempo total (segundos)", e.segundos, 0, 7200, errores);
  const errs = entero("Errores", e.errores, 0, 100, errores);
  const gravedad = entero("Gravedad", e.gravedad, 1, 5, errores);
  let atascos: string[] = [];
  if (Array.isArray(e.atascos)) atascos = e.atascos.map(limpiarTexto).filter(Boolean);
  if (atascos.length > MAX_ATASCOS) errores.push(`Atascos: máximo ${MAX_ATASCOS} citas.`);
  atascos.forEach((a, i) => {
    if (a.length > MAX_CITA) errores.push(`Atasco ${i + 1}: máximo ${MAX_CITA} caracteres.`);
    const dp = datoPersonal(a);
    if (dp) errores.push(`Atasco ${i + 1}: ${dp}`);
  });
  const problemaPrincipal = texto("Problema principal", e.problemaPrincipal, 200, errores);
  const pagaHoy = texto("Qué paga hoy", e.pagaHoy, 200, errores, { requerido: true });
  const quienFirma = texto("Quién firma el gasto", e.quienFirma, 120, errores, { requerido: true });
  const pruebaVolver = texto("Prueba de que volvería", e.pruebaVolver, 300, errores);
  let segundosHoja: number | null = null;
  if (e.segundosHoja != null && e.segundosHoja !== "") segundosHoja = entero("Tiempo con su hoja de hoy (segundos)", e.segundosHoja, 1, 7200, errores);
  if (atascos.length > 0 && !problemaPrincipal) errores.push("Si hubo atascos, escribe el problema principal con tus palabras.");
  if (errores.length) return { ok: false, errores };
  return {
    ok: true,
    valor: {
      id: typeof e.id === "string" && e.id ? e.id : nuevoId(),
      creada: typeof e.creada === "number" ? e.creada : ahora,
      rol: rol as Rol,
      desconocido: e.desconocido as boolean,
      modalidad: e.modalidad as "presencial" | "remota",
      completoSolo: e.completoSolo as boolean,
      segundos, errores: errs, atascos, problemaPrincipal, gravedad,
      pagaHoy, quienFirma, segundosHoja,
      volveria: e.volveria as boolean, pruebaVolver,
    },
  };
}

export function reglaDeLaSemana(ss: Sesion[]) {
  const total = ss.length;
  const desconocidos = ss.filter((s) => s.desconocido).length;
  return {
    total, desconocidos,
    cumple: total >= META_SESIONES && desconocidos >= META_DESCONOCIDOS,
    faltan: Math.max(0, META_SESIONES - total),
    faltanDesconocidos: Math.max(0, META_DESCONOCIDOS - desconocidos),
  };
}

export interface Dolor { problema: string; sesiones: number; gravedad: number; puntos: number }

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, "").trim();

/** Ranking de los problemas que el observador anotó. Puntos = sesiones × gravedad promedio. Es lo que yo anoté, no una medida. */
export function rankingDolores(ss: Sesion[], n = 3): Dolor[] {
  const g = new Map<string, { problema: string; sesiones: number; suma: number }>();
  for (const s of ss) {
    if (!s.problemaPrincipal) continue;
    const k = norm(s.problemaPrincipal);
    if (!k) continue;
    const x = g.get(k) ?? { problema: s.problemaPrincipal, sesiones: 0, suma: 0 };
    x.sesiones += 1; x.suma += s.gravedad;
    g.set(k, x);
  }
  return [...g.values()]
    .map((x) => ({ problema: x.problema, sesiones: x.sesiones, gravedad: Math.round((x.suma / x.sesiones) * 10) / 10, puntos: Math.round(x.suma * 10) / 10 }))
    .sort((a, b) => b.puntos - a.puntos || b.sesiones - a.sesiones)
    .slice(0, n);
}

/**
 * Comparación de tiempos contra la hoja de hoy. Solo con 3 o más sesiones que tengan ambos tiempos
 * se calcula una razón mediana; antes dice "por medir". Si la herramienta es más lenta, lo dice.
 */
export function comparacionConHoja(ss: Sesion[]) {
  const conAmbos = ss.filter((s) => s.segundosHoja != null && s.segundos > 0);
  if (conAmbos.length < 3) return { medido: false as const, n: conAmbos.length, texto: `Por medir: hay ${conAmbos.length} de 3 sesiones con tiempo propio y tiempo con su hoja.` };
  const razones = conAmbos.map((s) => (s.segundosHoja as number) / s.segundos).sort((a, b) => a - b);
  const mid = Math.floor(razones.length / 2);
  const mediana = razones.length % 2 ? razones[mid] : (razones[mid - 1] + razones[mid]) / 2;
  const r = Math.round(mediana * 100) / 100;
  const texto = r >= 1
    ? `En ${conAmbos.length} sesiones, su hoja tardó una mediana de ${r} veces lo que tardó la herramienta. Es una medición con pocas personas, no una promesa.`
    : `En ${conAmbos.length} sesiones, la herramienta tardó más que su hoja (su hoja tardó ${r} veces lo de la herramienta).`;
  return { medido: true as const, n: conAmbos.length, razon: r, texto };
}

export function pagaHoyResumen(ss: Sesion[]) {
  const sinDato = (s: string) => /^sin dato$/i.test(s.trim());
  const conDato = ss.filter((s) => !sinDato(s.pagaHoy)).length;
  return { conDato, sinDato: ss.length - conDato };
}

export function volverian(ss: Sesion[]) {
  const dijeron = ss.filter((s) => s.volveria).length;
  const conPrueba = ss.filter((s) => s.volveria && s.pruebaVolver.length >= 5).length;
  return { dijeron, conPrueba, sinPrueba: dijeron - conPrueba };
}

function celda(v: unknown): string {
  const s = String(v ?? "");
  // protege contra fórmulas en hojas de cálculo
  const seguro = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${seguro.replace(/"/g, '""')}"`;
}
export function aCsv(ss: Sesion[]): string {
  const cab = ["id", "fecha", "rol", "desconocido", "modalidad", "completo_solo", "segundos", "errores", "atascos", "problema_principal", "gravedad", "paga_hoy", "quien_firma", "segundos_hoja", "volveria", "prueba_volver"];
  const filas = ss.map((s) => [s.id, new Date(s.creada).toISOString(), s.rol, s.desconocido, s.modalidad, s.completoSolo, s.segundos, s.errores, s.atascos.join(" | "), s.problemaPrincipal, s.gravedad, s.pagaHoy, s.quienFirma, s.segundosHoja ?? "", s.volveria, s.pruebaVolver].map(celda).join(","));
  return [cab.join(","), ...filas].join("\n");
}

/**
 * Une las sesiones de la nube con las de este navegador. Las que solo están aquí se devuelven como
 * "pendientes" para que se vuelvan a subir (antes se mostraban como guardadas en la nube sin estarlo).
 */
export function fusionar(nube: Sesion[], local: Sesion[]): { sesiones: Sesion[]; pendientes: Sesion[] } {
  const ids = new Set(nube.map((s) => s.id));
  const pendientes = local.filter((s) => !ids.has(s.id));
  return { sesiones: [...nube, ...pendientes].sort((a, b) => a.creada - b.creada), pendientes };
}
