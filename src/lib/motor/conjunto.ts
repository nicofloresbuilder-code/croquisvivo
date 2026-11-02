/**
 * Conjunto de simulaciones y comparación de afirmaciones.
 *
 * Aquí vive el Paso 4 del Method: comparar lo que se AFIRMA contra lo que se MIDE
 * y marcar solo las brechas mayores que el error normal. El error normal es el
 * rango en que el modelo cambia por azar (varias corridas con distinta semilla)
 * más una incertidumbre acústica declarada.
 */
import { SNR_MIN, acoustics, flowField, fmt, simulate } from "./nucleo";
import type { Site } from "./nucleo";

export const CORRIDAS = 24;
export const INCERTIDUMBRE_DB = 3;

export interface Afirmacion {
  personas: number; // personas presentes según el registro
  evacuaron: number; // personas que el registro dice que salieron
  tiempoSeg: number | null; // tiempo total declarado (segundos); null si no lo dice
  alarmaTodas: boolean; // "la alarma se oyó en todas las áreas"
}
export interface Observado {
  tiempoSeg?: number | null; // tiempo medido en un simulacro REAL posterior
  nivelAlarmaDb?: number | null; // nivel de alarma medido con sonómetro
}
export interface Rango { min: number; p10: number; mediana: number; p90: number; max: number }
export interface Conjunto {
  n: number;
  presentes: number; // personas en el croquis
  fraccionSalida: Rango; // fracción que sale (0 a 1)
  tUltima: Rango; // segundos hasta la última persona que salió
  sinOirSeguro: number; // personas cuyo margen acústico es < 15 dB - incertidumbre
  sinOirPosible: number; // personas cuyo margen acústico es < 15 dB + incertidumbre
  sinOirFijo: number; // personas con margen < 15 dB (criterio nominal)
  incertidumbreDb: number;
}

function cuantil(xs: number[], q: number): number {
  const a = [...xs].sort((p, r) => p - r);
  if (!a.length) return 0;
  const pos = (a.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return a[lo] + (a[hi] - a[lo]) * (pos - lo);
}
export function rango(xs: number[]): Rango {
  return { min: Math.min(...xs), p10: cuantil(xs, 0.1), mediana: cuantil(xs, 0.5), p90: cuantil(xs, 0.9), max: Math.max(...xs) };
}

export function correrConjunto(site: Site, n = CORRIDAS, semillaBase = 2026, incertidumbreDb = INCERTIDUMBRE_DB): Conjunto {
  const ac = acoustics(site), dist = flowField(site, false);
  const fr: number[] = [], tl: number[] = [];
  let primera: ReturnType<typeof simulate> | null = null;
  for (let k = 0; k < n; k++) {
    const r = simulate(site, semillaBase + k, { frames: false, ac, dist });
    if (!primera) primera = r;
    fr.push(r.agents.length ? r.evacuated / r.agents.length : 0);
    tl.push(r.tLast);
  }
  const agentes = primera ? primera.agents : [];
  const margen = (a: { alarmDb: number; ambDb: number }) => a.alarmDb - a.ambDb;
  return {
    n, presentes: agentes.length,
    fraccionSalida: rango(fr), tUltima: rango(tl),
    sinOirFijo: agentes.filter((a) => margen(a) < SNR_MIN).length,
    sinOirSeguro: agentes.filter((a) => margen(a) < SNR_MIN - incertidumbreDb).length,
    sinOirPosible: agentes.filter((a) => margen(a) < SNR_MIN + incertidumbreDb).length,
    incertidumbreDb,
  };
}

export type Clase = "observado" | "simulado" | "faltante" | "no_verificado";
export type EstadoBrecha = "brecha" | "dentro_margen" | "indeterminado" | "sin_dato";
export interface Brecha {
  id: "personas" | "tiempo" | "alarma";
  tema: string;
  afirmado: string; // lo que dice el registro (clase: no verificado)
  medido: string; // lo que midió el modelo (clase: simulado)
  estado: EstadoBrecha;
  conclusion: string; // frase corta, nunca "seguro" ni "verificado"
  banda?: { min: number; max: number; afirmado: number; unidad: string };
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function compararAfirmacion(a: Afirmacion, c: Conjunto): Brecha[] {
  const out: Brecha[] = [];

  // 1. Personas que salieron
  const fa = a.personas > 0 ? a.evacuaron / a.personas : 0;
  const f = c.fraccionSalida;
  const fuera1 = fa < f.p10 - 1e-9 || fa > f.p90 + 1e-9;
  out.push({
    id: "personas", tema: "Personas que salieron",
    afirmado: `${a.evacuaron} de ${a.personas} (${pct(fa)})`,
    medido: f.p10 === f.p90 ? `${pct(f.mediana)} en las ${c.n} corridas` : `${pct(f.p10)} a ${pct(f.p90)} en ${c.n} corridas`,
    estado: fuera1 ? "brecha" : "dentro_margen",
    conclusion: fuera1
      ? (fa > f.p90 ? "El registro dice que salió más gente de la que el modelo logra sacar, aun con su margen." : "El registro dice que salió menos gente de lo que el modelo logra, aun con su margen.")
      : "Dentro del margen del modelo. Eso no prueba que el desalojo sea seguro.",
    banda: { min: f.p10 * 100, max: f.p90 * 100, afirmado: fa * 100, unidad: "%" },
  });

  // 2. Tiempo total
  if (a.tiempoSeg == null) {
    out.push({ id: "tiempo", tema: "Tiempo total", afirmado: "El registro no dice el tiempo", medido: `${fmt(c.tUltima.p10)} a ${fmt(c.tUltima.p90)}`, estado: "sin_dato", conclusion: "Falta el dato en el registro: no hay afirmación que comparar." });
  } else {
    const t = c.tUltima, fuera2 = a.tiempoSeg < t.p10 || a.tiempoSeg > t.p90;
    out.push({
      id: "tiempo", tema: "Tiempo total",
      afirmado: fmt(a.tiempoSeg), medido: `${fmt(t.p10)} a ${fmt(t.p90)} (mediana ${fmt(t.mediana)})`,
      estado: fuera2 ? "brecha" : "dentro_margen",
      conclusion: fuera2
        ? (a.tiempoSeg < t.p10 ? "El registro dice un tiempo más corto que el más rápido que alcanza el modelo." : "El registro dice un tiempo más largo de lo que el modelo espera.")
        : "Dentro del margen del modelo. Eso no prueba que el desalojo sea seguro.",
      banda: { min: t.p10, max: t.p90, afirmado: a.tiempoSeg, unidad: "s" },
    });
  }

  // 3. Alarma audible en todas las áreas
  if (!a.alarmaTodas) {
    out.push({ id: "alarma", tema: "Alarma oída", afirmado: "El registro reconoce que no se oyó en todas las áreas", medido: `${c.sinOirFijo} personas bajo el margen de 15 dB`, estado: "dentro_margen", conclusion: "El registro ya reconoce el problema; la simulación lo confirma o no, pero no hay contradicción." });
  } else if (c.sinOirSeguro > 0) {
    out.push({
      id: "alarma", tema: "Alarma oída",
      afirmado: "Se oyó en todas las áreas",
      medido: `${c.sinOirSeguro} personas sin oírla con margen claro (15 dB ± ${c.incertidumbreDb})`,
      estado: "brecha", conclusion: "Aun con la incertidumbre acústica, hay personas donde la alarma no supera el ruido de fondo.",
    });
  } else if (c.sinOirPosible > 0) {
    out.push({
      id: "alarma", tema: "Alarma oída", afirmado: "Se oyó en todas las áreas",
      medido: `${c.sinOirPosible} personas en el límite (15 dB ± ${c.incertidumbreDb})`,
      estado: "indeterminado", conclusion: "No se puede afirmar ni negar con el margen actual. Falta medirlo con sonómetro.",
    });
  } else {
    out.push({ id: "alarma", tema: "Alarma oída", afirmado: "Se oyó en todas las áreas", medido: "Todas las personas por encima del margen", estado: "dentro_margen", conclusion: "Dentro del margen del modelo. Eso no prueba que se oiga en un simulacro real." });
  }
  return out;
}

export interface Calibracion { estado: "dentro" | "fuera" | "sin_dato"; texto: string }
/** Compara un tiempo observado en un simulacro REAL con la banda del modelo. */
export function calibrar(o: Observado | undefined, c: Conjunto): Calibracion {
  if (!o || o.tiempoSeg == null) return { estado: "sin_dato", texto: "Sin simulacro real capturado: el modelo no está calibrado." };
  const dentro = o.tiempoSeg >= c.tUltima.p10 && o.tiempoSeg <= c.tUltima.p90;
  return dentro
    ? { estado: "dentro", texto: `El tiempo observado (${fmt(o.tiempoSeg)}) cae dentro de la banda del modelo. Un solo simulacro no valida el modelo.` }
    : { estado: "fuera", texto: `El tiempo observado (${fmt(o.tiempoSeg)}) cae FUERA de la banda del modelo (${fmt(c.tUltima.p10)} a ${fmt(c.tUltima.p90)}). El modelo no está calibrado para este inmueble: no uses sus brechas como medidas.` };
}

export interface Evidencia { dato: string; clase: Clase; nota: string }
export function evidencias(a: Afirmacion, o: Observado | undefined): Evidencia[] {
  const L: Evidencia[] = [
    { dato: "Personas que salieron (registro)", clase: "no_verificado", nota: "Lo declara la hoja de asistencia; nadie lo respalda con otra fuente." },
    { dato: a.tiempoSeg == null ? "Tiempo total (registro)" : `Tiempo total declarado: ${fmt(a.tiempoSeg)}`, clase: a.tiempoSeg == null ? "faltante" : "no_verificado", nota: a.tiempoSeg == null ? "El registro no trae tiempo." : "Cronometrado por una persona, sin segunda fuente." },
    { dato: "Alarma oída en todas las áreas (registro)", clase: "no_verificado", nota: "Es una afirmación; nadie midió el nivel de sonido." },
    { dato: "Rango de personas que salen, tiempos y margen acústico", clase: "simulado", nota: `Salen de ${CORRIDAS} corridas del modelo sobre el croquis. No son mediciones reales.` },
    o?.nivelAlarmaDb != null
      ? { dato: `Nivel de alarma medido: ${o.nivelAlarmaDb} dB`, clase: "observado", nota: "Capturado por una persona con sonómetro." }
      : { dato: "Nivel real de la alarma en cada área", clase: "faltante", nota: "Nadie lo midió con sonómetro." },
    o?.tiempoSeg != null
      ? { dato: `Tiempo de un simulacro real posterior: ${fmt(o.tiempoSeg)}`, clase: "observado", nota: "Capturado por una persona después de aplicar correcciones." }
      : { dato: "Resultado de un simulacro real posterior", clase: "faltante", nota: "Sin él, ninguna corrección puede marcarse como confirmada." },
    { dato: "Posición real de estorbos y puertas durante el simulacro", clase: "faltante", nota: "El croquis es un ejemplo; no refleja el inmueble real." },
  ];
  return L;
}
